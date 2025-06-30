import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabaseClient';
import { getPlaceImage } from '@/lib/getLocationImage';
import { getPlaceCoordinates } from '@/lib/utils';
import { getOptimalRoute, getAllTravelModes } from '@/lib/getRoute';
import { getGooglePlacePhotoUrl } from '@/lib/getPlacePhoto';
import { randomUUID } from 'crypto';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface GroupMember {
  user_id: string;
  deal_breakers_and_strong_preferences?: string;
  interests_and_activities?: string;
  nice_to_haves_and_openness?: string;
  travel_motivations?: string;
  must_do_experiences?: string;
  learning_interests?: string;
  schedule_and_logistics?: string;
  budget_and_spending?: string;
  travel_style_preferences?: string;
  flight_preference?: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface Place {
  id: string;
  name: string;
  description: string;
  duration: string;
  walkTime?: string;
  distance?: string;
  travelMode?: string;
  type?: string;
  visitTime?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface DayItinerary {
  date: string;
  day: string;
  month: string;
  places: Place[];
}

interface BookingUrlParams {
  from: string;
  to: string;
  departDate: string;
  returnDate: string;
  adults: number;
  cabinClass: string;
}

function constructBookingUrl(params: BookingUrlParams): string {
  const baseUrl = 'https://flights.booking.com/flights';
  const route = `${params.from}.AIRPORT-${params.to}.AIRPORT/`;
  
  const searchParams = new URLSearchParams({
    type: 'ROUNDTRIP',
    adults: params.adults.toString(),
    cabinClass: params.cabinClass,
    children: '',
    from: `${params.from}.AIRPORT`,
    to: `${params.to}.AIRPORT`,
    depart: params.departDate,
    return: params.returnDate,
    sort: 'BEST',
    travelPurpose: 'leisure',
    ca_source: 'flights_index_sb'
  });

  return `${baseUrl}/${route}?${searchParams.toString()}`;
}

export async function POST(request: NextRequest) {
  try {
    const { groupId, action } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Handle hotel aggregation actions (separate from main itinerary generation)
    if (action === 'aggregate_selected_hotel') {
      // Fetch all selected_hotel for the group
      const { data: members, error } = await supabase
        .from('group_members')
        .select('selected_hotel')
        .eq('group_id', groupId);
      if (error) return NextResponse.json({ error: 'Failed to fetch selections' }, { status: 500 });
      const counts: Record<string, number> = {};
      (members || []).forEach((m: any) => {
        if (m.selected_hotel) counts[m.selected_hotel] = (counts[m.selected_hotel] || 0) + 1;
      });
      // Find the hotel(s) with the max count
      const max = Math.max(...Object.values(counts));
      const topHotels = Object.entries(counts).filter(([_, v]) => v === max).map(([k]) => k);
      // If tie, pick the cheaper one
      if (topHotels.length > 1) {
        // Fetch hotel prices from the itinerary
        const { data: groupData } = await supabase
          .from('travel_groups')
          .select('itinerary')
          .eq('group_id', groupId)
          .single();
        const hotels = groupData?.itinerary?.hotels || [];
        let minPrice = Infinity;
        let winner = topHotels[0];
        for (const hotelId of topHotels) {
          const hotel = hotels.find((h: any) => h.id === hotelId);
          if (hotel) {
            // Extract numeric price
            const priceNum = parseFloat((hotel.price || '').replace(/[^\d.]/g, ''));
            if (!isNaN(priceNum) && priceNum < minPrice) {
              minPrice = priceNum;
              winner = hotelId;
            }
          }
        }
        return NextResponse.json({ winner });
      }
      // Otherwise, return the single winner
      return NextResponse.json({ winner: topHotels[0] });
    }

    // Main itinerary generation logic starts here
    // Get group details and members with preferences
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('destination, host_id, destination_display, departure_date, return_date, trip_duration_days, departure_iata_code, destination_iata_code, flight_class, travel_dates_determined, booking_url')
      .eq('group_id', groupId)
      .single();

    if (groupError || !groupData) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if travel dates have been determined
    if (!groupData.travel_dates_determined) {
      return NextResponse.json({ error: 'Travel dates must be determined first' }, { status: 400 });
    }

    // Generate booking URL if not already present
    let bookingUrl = groupData.booking_url;
    if (!bookingUrl) {
      // Get member count for adults
      const { data: membersCount, error: membersCountError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersCountError) {
        return NextResponse.json({ error: 'Failed to get member count' }, { status: 500 });
      }

      const adultCount = membersCount?.length || 1;

      // Construct booking URL
      bookingUrl = constructBookingUrl({
        from: groupData.departure_iata_code,
        to: groupData.destination_iata_code,
        departDate: groupData.departure_date,
        returnDate: groupData.return_date,
        adults: adultCount,
        cabinClass: groupData.flight_class || 'ECONOMY'
      });

      // Save booking URL to database
      const { error: updateUrlError } = await supabase
        .from('travel_groups')
        .update({ booking_url: bookingUrl })
        .eq('group_id', groupId);

      if (updateUrlError) {
        console.error('Error saving booking URL:', updateUrlError);
      }
    }

    // Get all group members with their preferences
    const { data: membersData, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        deal_breakers_and_strong_preferences,
        interests_and_activities,
        nice_to_haves_and_openness,
        travel_motivations,
        must_do_experiences,
        learning_interests,
        schedule_and_logistics,
        budget_and_spending,
        travel_style_preferences,
        flight_preference,
        profiles!group_members_user_id_fkey(first_name, last_name)
      `)
      .eq('group_id', groupId);

    if (membersError || !membersData) {
      return NextResponse.json({ error: 'Failed to fetch group members' }, { status: 500 });
    }

    // Format preferences for Gemini
    const memberPreferences = membersData.map((member: any) => ({
      name: `${member.profiles.first_name} ${member.profiles.last_name}`,
      dealBreakers: member.deal_breakers_and_strong_preferences,
      interests: member.interests_and_activities,
      niceToHaves: member.nice_to_haves_and_openness,
      motivations: member.travel_motivations,
      mustDo: member.must_do_experiences,
      learning: member.learning_interests,
      schedule: member.schedule_and_logistics,
      budget: member.budget_and_spending,
      travelStyle: member.travel_style_preferences,
      flightPreference: member.flight_preference
    }));

    // Fetch flight options from DB
    const { data: flightData, error: flightError } = await supabase
      .from('travel_groups')
      .select('flight_options')
      .eq('group_id', groupId)
      .single();

    if (flightError || !flightData || !flightData.flight_options) {
      return NextResponse.json({ error: 'Flight options not found' }, { status: 404 });
    }

    // Format flight options for LLM (only first 5)
    let availableFlights = '';
    if (Array.isArray(flightData.flight_options) && flightData.flight_options.length > 0) {
      availableFlights = `\nAVAILABLE FLIGHT OPTIONS:\n${flightData.flight_options.slice(0, 5).map((flight: any) => `\nIndex: ${flight.index}\nFlight Details: ${flight.text_content}\n`).join('\n')}`;
    }

    // Create prompt for Gemini (same as before, but using availableFlights from DB)
    const prompt = `
You are a professional travel planner. Create a detailed group itinerary for ${groupData.destination} based on the group member preferences below:

TRAVEL DATES AND DURATION:
- Departure Date: ${groupData.departure_date}
- Return Date: ${groupData.return_date}
- Trip Duration: ${groupData.trip_duration_days} days
- You MUST create an itinerary for exactly ${groupData.trip_duration_days} days

${memberPreferences.map(member => `\n**${member.name}:**\n- Deal Breakers: ${member.dealBreakers || 'None specified'}\n- Interests: ${member.interests || 'None specified'}\n- Nice to Haves: ${member.niceToHaves || 'None specified'}\n- Motivations: ${member.motivations || 'None specified'}\n- Must Do: ${member.mustDo || 'None specified'}\n- Learning Interests: ${member.learning || 'None specified'}\n- Schedule: ${member.schedule || 'None specified'}\n- Budget: ${member.budget || 'None specified'}\n- Travel Style: ${member.travelStyle || 'None specified'}\n- Flight Preference: ${member.flightPreference || 'None specified'}\n`).join('\n')}

${availableFlights}

Please return the response in the following EXACT JSON format (no additional text, just the JSON):

{
  "budgetRange": "",
  "arrivalIataCode": "CDG",
  "selectedFlight": {
    "index": 0,
    "text_content": "Flight details text from the available options"
  },
  "itinerary": [
    {
      "date": "15",
      "day": "Monday",
      "month": "Jun",
      "places": [
        {
          "id": "p1",
          "name": "Attraction Name",
          "description": "Detailed description of the place and why it's included",
          "duration": "2 hours",
          "type": "monument",
          "visitTime": "10:00 AM"
        },
        {
          "id": "p2",
          "name": "Restaurant Name",
          "description": "Great place for lunch with local cuisine",
          "duration": "1.5 hours",
          "type": "food",
          "visitTime": "1:00 PM"
        }
      ]
    }
  ],
  "hotels": [
    {
      "id": "1",
      "name": "Hotel Name",
      "rating": 4.8,
      "price": "$180/night",
      "amenities": ["Free WiFi", "Breakfast", "Gym", "Spa"]
    }
  ]
}
REQUIREMENTS:

Budget Estimate:
- Calculate a rough estimated budget range for the entire itinerary, including travel (flights), local transportation, lodging, entry fees for places, food (all meals), and any other relevant costs.
- Include a field in the JSON: "budgetRange": "$1200-$1800" and nothing else (or similar, as a string).
- The range should reflect the minimum and maximum likely spend for the group per person, based on the planned itinerary and group preferences.

CRITICAL DATE FORMAT REQUIREMENTS:
- "date" must be a 2-digit day number (e.g., "15", "01", "31")
- "day" must be the full day name (e.g., "Monday", "Tuesday", "Wednesday")
- "month" must be a 3-letter month abbreviation (e.g., "Jun", "Dec", "Jan")
- You MUST use the exact dates from ${groupData.departure_date} to ${groupData.return_date}
- Create exactly ${groupData.trip_duration_days} days of itinerary

CRITICAL: Use the provided travel dates above. Do NOT create different dates based on member preferences.
${availableFlights ? `
Flight Selection:
- CRITICAL: Choose the BEST flight option from the available flights list above
- Consider: price, timing, convenience, minimal layovers
- Return the selected flight's index, text_content, and the airline's IATA code (e.g., "AI" for Air India) in the "selectedFlight" field as "iata_code"
- CRITICAL: Plan activities considering the selected flight's arrival time. give the user around 2 hours of buffer time after the arrival time. to checkin and freshen up
- CRITICAL: On departure day, ensure all activities end at least 4 hours before flight departure time
- Do not schedule any activities after the time needed to reach airport 3 hours before departure
- Consider the departure date (${groupData.departure_date}) and return date (${groupData.return_date}) when planning
` : ''}

CRITICAL FLIGHT TEXT PARSING:
If you select a flight from the available options, you MUST also parse the text_content and return structured flight data.

The text_content format is: "Flexible ticket upgrade available01:00MAA · 26 Jul1 stop9h 15m10:15IXZ · 26 Jul13:25IXZ · 2 Aug2 stops15h 55m05:20MAA · 3 AugAir IndiaINR86,414.00View details"

Parse this into structured JSON within the selectedFlight object as "parsed_details":
{
  "going_flight": {
    "departure_time": "01:00",
    "departure_airport": "MAA", 
    "departure_date": "26 Jul",
    "arrival_time": "10:15",
    "arrival_airport": "IXZ",
    "arrival_date": "26 Jul", 
    "stops": "1 stop",
    "duration": "9h 15m"
  },
  "return_flight": {
    "departure_time": "13:25",
    "departure_airport": "IXZ",
    "departure_date": "2 Aug", 
    "arrival_time": "05:20",
    "arrival_airport": "MAA",
    "arrival_date": "3 Aug",
    "stops": "2 stops", 
    "duration": "15h 55m"
  },
  "airlines_used": ["Air India"],
  "total_price": "INR 86,414.00",
  "flights_used_text": "Air India"
}

AIRLINE PARSING RULES:
- Split airline text by commas
- If a segment starts with "operated", it belongs to the previous airline
- Extract main airline names only (no "operated by" text)
- First airline is for going flight, second (if exists) for return flight
- If only one airline, use same for both flights

PARSING PATTERN:
- Ignore "Flexible ticket upgrade available" at start
- Going flight: time + airport + date + stops + duration + time + airport + date
- Return flight: time + airport + date + stops + duration + time + airport + date  
- Airline info + price + "View details" (ignore "View details")

Daily Structure:
- Include items per day depending on group travel style:
  - If relaxed/spontaneous → 4-5 key places (max), include leisure time.
  - If active/adventurous/sightseeing-focused → Cover more key attractions per day.
  - Make sure all the places in a single day of the itinerary are within 10kms of each other.

Include:
  - Brunch/lunch
  - Dinner
  - Attractions/activities that align with group interests and must-dos.

Place Fields:
  - "type" must be one of:
     "monument", "museum", "park", "food", "shopping", "photo_spot", "historical", "entertainment", "cultural", "nature"
  - Include "visitTime" (specific time like "10:00 AM").
  - Include "duration" (time people usually spend at the place).

Descriptions:
  - Each "description" should explain why the place is selected (based on preferences, location significance, food culture, etc.).

Meals:
- Suggest specific restaurants or food experiences for brunch/lunch and dinner daily.
- Mention why each meal spot is chosen (e.g., regional specialty, ambiance, group dietary preferences, etc.).

Hotels:
- Suggest 3 hotel options:
  - Breakfast must be included.
  - Include "rating" (out of 5), "price" per night, and a list of "amenities" (if available).

General:
- The JSON must be syntactically correct and parseable.
- Ensure all suggestions reflect a balance of group budgets, styles, and must-dos.
- CRITICAL: Create exactly ${groupData.trip_duration_days} days of itinerary using dates from ${groupData.departure_date} to ${groupData.return_date}
`;

    // Generate itinerary using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Store the raw API response
    const rawApiResponse = {
      prompt: prompt,
      response: text,
      timestamp: new Date().toISOString(),
      model: 'gemini-2.5-flash-lite-preview-06-17'
    };

    // Parse the JSON response
    let itineraryData;
    try {
      // Clean the response to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        itineraryData = JSON.parse(jsonMatch[0]);
        console.log('LLM itineraryData:', JSON.stringify(itineraryData, null, 2));
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Store the raw LLM response, the parsed itinerary, and the selected flight if present
    const updateData: any = { 
      most_recent_api_call: rawApiResponse,
      itinerary: itineraryData
    };
    if (itineraryData.selectedFlight) {
      updateData.selected_flight = itineraryData.selectedFlight;
    }
    const { error: updateError } = await supabase
      .from('travel_groups')
      .update(updateData)
      .eq('group_id', groupId);

    if (updateError) {
      console.error('Error saving LLM response to DB:', updateError);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error generating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}

// Helper functions to extract basic info for display
function extractAirline(textContent: string): string {
  const airlineMatch = textContent.match(/([A-Za-z\s]+(?:Airlines?|Airways?|Air India|Emirates|Etihad|IndiGo))/);
  return airlineMatch ? airlineMatch[1].trim() : 'Unknown Airline';
}

function extractPrice(textContent: string): string {
  const priceMatch = textContent.match(/INR([\d,]+\.?\d*)/);
  return priceMatch ? `INR ${priceMatch[1]}` : 'Price not available';
}