import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabaseClient';

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

async function getLocationImage(destination: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(destination)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
    }
  } catch (error) {
    console.error('Error fetching location image:', error);
  }
  
  return 'https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop';
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
You are a professional travel planner. Create a detailed 3-day itinerary for ${groupData.destination} based on the following group preferences:

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
  "arrivalIataCode": "CDG",
  "itinerary": [
    {
      "date": "15",
      "day": "Jun",
      "month": "Day 1",
      "places": [
        {
          "id": "p1",
          "name": "Attraction Name",
          "description": "Detailed description of the place and why it's included",
          "image": "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
          "duration": "2 hours",
          "walkTime": "15 min",
          "distance": "1.2 km",
          "travelMode": "walk"
        }
      ]
    }
  ],
  "flights": [
    {
      "id": "1",
      "airline": "Airline Name",
      "departure": "10:30 AM",
      "arrival": "2:45 PM",
      "duration": "8h 15m",
      "price": "$650",
      "stops": "Direct"
    }
  ],
  "hotels": [
    {
      "id": "1",
      "name": "Hotel Name",
      "rating": 4.8,
      "price": "$180/night",
      "image": "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      "amenities": ["Free WiFi", "Breakfast", "Gym", "Spa"]
    }
  ],
  "mapLocations": [
    {
      "id": "p1",
      "name": "Attraction Name",
      "lat": 48.8584,
      "lng": 2.2945,
      "day": "Day 1"
    }
  ]
}

Requirements:
- Create exactly 3 days of itinerary
- Include 2-4 places per day
- Add realistic travel times between locations
- Include 3 flight options and 3 hotel options
- Use real coordinates for map locations
- Consider all group member preferences
- Provide detailed descriptions explaining why each place was chosen
- Use appropriate Pexels image URLs for attractions
- Include walking/transport times between locations
- Additionally, return the IATA airport code for the arrival city (the main destination of the trip) in a top-level field called "arrivalIataCode". For example: "MAA" for Chennai, "JFK" for New York, "CDG" for Paris, etc.
`;

    // Generate itinerary using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemma-3-12b-it' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let itineraryData;
    try {
      // Clean the response to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        itineraryData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Enhance images with Unsplash if needed
    for (const day of itineraryData.itinerary) {
      for (const place of day.places) {
        if (!place.image || place.image.includes('placeholder')) {
          place.image = await getLocationImage(place.name);
        }
      }
    }

    for (const hotel of itineraryData.hotels) {
      if (!hotel.image || hotel.image.includes('placeholder')) {
        hotel.image = await getLocationImage(`${hotel.name} hotel ${groupData.destination}`);
      }
    }

    // --- Fetch real flights from SerpAPI ---
    try {
      // Use Chennai (MAA) as departure, LLM-provided IATA code or group destination as arrival
      const departureCode = 'MAA'; // Chennai
      const arrivalIataCode = itineraryData.arrivalIataCode;
      const arrivalId = arrivalIataCode || groupData.destination_display || groupData.destination;
      // You may want to map arrivalId to an IATA code for better accuracy
      const itineraryStartDate = itineraryData.itinerary?.[0]?.date; // e.g., '15'
      const itineraryMonth = itineraryData.itinerary?.[0]?.day; // e.g., 'Jun'
      // For demo, use a fixed year and parse month to number
      const monthMap: Record<string, string> = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
      };
      const year = '2024';
      const month = monthMap[itineraryMonth] || '01';
      const day = itineraryStartDate?.padStart(2, '0') || '01';
      const outboundDate = `${year}-${month}-${day}`;
      const serpApiKey = process.env.SERPAPI_KEY!;
      const serpApiUrl = `https://serpapi.com/search.json?engine=google_flights&departure_id=${departureCode}&arrival_id=${encodeURIComponent(arrivalId)}&outbound_date=${outboundDate}&api_key=${serpApiKey}`;
      const serpRes = await fetch(serpApiUrl);
      const serpData = await serpRes.json();
      const realFlights = (serpData.flights_results || []).slice(0, 3).map((flight: any, idx: number) => ({
        id: String(idx + 1),
        airline: flight.airline || 'Unknown',
        departure: flight.departure_time || '',
        arrival: flight.arrival_time || '',
        duration: flight.duration || '',
        price: flight.price || '',
        stops: flight.stops || '',
      }));
      if (realFlights.length > 0) {
        itineraryData.flights = realFlights;
      }
    } catch (flightErr) {
      console.error('Error fetching flights from SerpAPI:', flightErr);
      // If error, keep LLM flights as fallback
    }

    // Save the final itinerary to the database
    const { error: updateError } = await supabase
      .from('travel_groups')
      .update({ itinerary: itineraryData })
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