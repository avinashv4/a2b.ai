import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabaseClient';
import { getPlaceImage } from '@/lib/getLocationImage';
import { getPlaceCoordinates } from '@/lib/utils';
import { getOptimalRoute, getAllTravelModes } from '@/lib/getRoute';
import { getGooglePlacePhotoUrl } from '@/lib/getPlacePhoto';

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

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Get group details and members with preferences
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('destination, host_id, destination_display')
      .eq('group_id', groupId)
      .single();

    if (groupError || !groupData) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
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
      travelStyle: member.travel_style_preferences
    }));

    // Create prompt for Gemini
    const prompt = `
You are a professional travel planner. Create a detailed group itinerary for ${groupData.destination} based on the group member preferences below:

${memberPreferences.map(member => `
**${member.name}:**
- Deal Breakers: ${member.dealBreakers || 'None specified'}
- Interests: ${member.interests || 'None specified'}
- Nice to Haves: ${member.niceToHaves || 'None specified'}
- Motivations: ${member.motivations || 'None specified'}
- Must Do: ${member.mustDo || 'None specified'}
- Learning Interests: ${member.learning || 'None specified'}
- Schedule: ${member.schedule || 'None specified'}
- Budget: ${member.budget || 'None specified'}
- Travel Style: ${member.travelStyle || 'None specified'}
`).join('\n')}

Please return the response in the following EXACT JSON format (no additional text, just the JSON):

{
  "budgetRange": "",
  "arrivalIataCode": "CDG",
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
- Include a field in the JSON: "budgetRange": "$1200-$1800" (or similar, as a string).
- The range should reflect the minimum and maximum likely spend for the group per person, based on the planned itinerary and group preferences.

CRITICAL DATE FORMAT REQUIREMENTS:
- "date" must be a 2-digit day number (e.g., "15", "01", "31")
- "day" must be the full day name (e.g., "Monday", "Tuesday", "Wednesday")
- "month" must be a 3-letter month abbreviation (e.g., "Jun", "Dec", "Jan")

Days in Itinerary:
- If group members mention availability (schedule), find common free dates. Use only dates when all members who have mentioned a schedule are free.
- If no dates are mentioned or availability is unclear, default to creating an itinerary for exactly 3 full days.

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
`;

    // Generate itinerary using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Store the raw API response
    const rawApiResponse = {
      prompt: prompt,
      response: text,
      timestamp: new Date().toISOString(),
      model: 'gemini-2.5-flash'
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

    // Enhance images and coordinates with Pexels and Google Places
    for (const day of itineraryData.itinerary) {
      for (const place of day.places) {
        // Get image from Google Places
        place.image = await getGooglePlacePhotoUrl(`${place.name} ${groupData.destination_display || groupData.destination}`)
          || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop';
        // Get accurate coordinates
        const coordinates = await getPlaceCoordinates(place.name, groupData.destination_display || groupData.destination);
        if (coordinates) {
          place.coordinates = coordinates;
        }
      }
      // After all coordinates are set, get all travel modes between consecutive places
      for (let i = 1; i < day.places.length; i++) {
        const prev = day.places[i - 1];
        const curr = day.places[i];
        if (prev.coordinates && curr.coordinates) {
          const allModes = await getAllTravelModes(prev.coordinates, curr.coordinates);
          curr.travelModes = allModes; // { walking: {...}, bicycling: {...}, driving: {...}, transit: {...} }
        }
      }
    }

    // Format map locations from the itinerary
    itineraryData.mapLocations = itineraryData.itinerary.flatMap((day: DayItinerary) =>
      day.places.map((place: Place) => ({
        id: place.id,
        name: place.name,
        lat: place.coordinates?.lat || 0,
        lng: place.coordinates?.lng || 0,
        day: day.month,
        type: place.type,
        visitTime: place.visitTime,
        duration: place.duration
      }))
    );

    for (const hotel of itineraryData.hotels) {
      hotel.image = await getGooglePlacePhotoUrl(`${hotel.name} hotel ${groupData.destination_display || groupData.destination}`)
        || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop';
    }

    // --- Fetch real flights from SerpAPI ---
    // Initialize with fallback flights first
    itineraryData.flights = [
      {
        id: "1",
        airline: "Air India",
        departure: "10:30 AM",
        arrival: "2:45 PM",
        duration: "8h 15m",
        price: "$650",
        stops: "Direct"
      },
      {
        id: "2",
        airline: "Emirates",
        departure: "11:45 PM",
        arrival: "6:30 AM+1",
        duration: "9h 45m",
        price: "$720",
        stops: "1 stop"
      },
      {
        id: "3",
        airline: "Qatar Airways",
        departure: "2:15 AM",
        arrival: "8:00 AM",
        duration: "10h 45m",
        price: "$680",
        stops: "1 stop"
      }
    ];

    try {
      // Use Chennai (MAA) as departure, LLM-provided IATA code or group destination as arrival
      const departureCode = 'MAA'; // Chennai
      const arrivalIataCode = itineraryData.arrivalIataCode;
      const arrivalId = arrivalIataCode || groupData.destination_display || groupData.destination;
      
      // Use a fixed date for demo (you can make this dynamic)
      const outboundDate = '2024-06-15';
      
      const serpApiKey = process.env.SERPAPI_KEY!;
      const serpApiUrl = `https://serpapi.com/search.json?engine=google_flights&departure_id=${departureCode}&arrival_id=${encodeURIComponent(arrivalId)}&outbound_date=${outboundDate}&api_key=${serpApiKey}`;
      
      const serpRes = await fetch(serpApiUrl);
      const serpData = await serpRes.json();
      
      if (serpData && (serpData.best_flights || serpData.other_flights)) {
        const allFlights = [...(serpData.best_flights || []), ...(serpData.other_flights || [])];
        const realFlights = allFlights.slice(0, 3).map((flight: any, idx: number) => ({
          id: String(idx + 1),
          airline: flight.flights?.[0]?.airline || 'Unknown Airline',
          departure: flight.flights?.[0]?.departure_airport?.time || '',
          arrival: flight.flights?.[flight.flights.length - 1]?.arrival_airport?.time || '',
          duration: flight.total_duration || '',
          price: flight.price ? `$${flight.price}` : '',
          stops: flight.flights?.length > 1 ? `${flight.flights.length - 1} stop${flight.flights.length > 2 ? 's' : ''}` : 'Direct',
        }));
      
        if (realFlights.length > 0) {
          itineraryData.flights = realFlights;
        }
      }
    } catch (flightErr) {
      console.error('Error fetching flights from SerpAPI:', flightErr);
      // Fallback flights are already set above
    }

    // Save the final itinerary to the database
    const { error: updateError } = await supabase
      .from('travel_groups')
      .update({ 
        itinerary: itineraryData,
        most_recent_api_call: rawApiResponse
      })
      .eq('group_id', groupId);

    if (updateError) {
      console.error('Error saving itinerary to DB:', updateError);
      // Optional: return an error if saving is critical, but for now we'll just log it
    }

    return NextResponse.json({
      success: true,
      data: itineraryData
    });

  } catch (error) {
    console.error('Error generating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}