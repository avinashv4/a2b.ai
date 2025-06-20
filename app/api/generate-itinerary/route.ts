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

async function getPexelsImage(query: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': process.env.PEXELS_API_KEY!
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.medium;
      }
    }
  } catch (error) {
    console.error('Error fetching Pexels image:', error);
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
          "duration": "2 hours",
          "walkTime": "15 min",
          "distance": "1.2 km",
          "travelMode": "walk",
          "type": "monument",
          "visitTime": "10:00 AM",
          "coordinates": {
            "lat": 48.8584,
            "lng": 2.2945
          }
        },
        {
          "id": "p2",
          "name": "Restaurant Name",
          "description": "Great place for lunch with local cuisine",
          "duration": "1.5 hours",
          "walkTime": "10 min",
          "distance": "800 m",
          "travelMode": "walk",
          "type": "food",
          "visitTime": "1:00 PM",
          "coordinates": {
            "lat": 48.8566,
            "lng": 2.3522
          }
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
  ],
  "mapLocations": [
    {
      "id": "p1",
      "name": "Attraction Name",
      "lat": 48.8584,
      "lng": 2.2945,
      "day": "Day 1",
      "type": "monument",
      "visitTime": "10:00 AM",
      "duration": "2 hours",
      "walkTimeFromPrevious": "15 min"
    }
  ]
}

Requirements:
- Create exactly 3 days of itinerary
- Include 3-4 places per day including meals (brunch/lunch and dinner)
- For each place, specify the type: "monument", "museum", "park", "food", "shopping", "photo_spot", "historical", "entertainment", "cultural", "nature"
- Include specific visit times (e.g., "10:00 AM", "2:30 PM")
- Add realistic coordinates for each location
- Include walking/transport times between locations
- Add meal suggestions for brunch/lunch and dinner each day
- Hotels should have breakfast included, so focus on brunch/lunch and dinner
- Provide detailed descriptions explaining why each place was chosen
- Include 3 hotel options
- Consider all group member preferences
- Return the IATA airport code for the arrival city in "arrivalIataCode"
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

    // Enhance images with Pexels
    for (const day of itineraryData.itinerary) {
      for (const place of day.places) {
        const searchQuery = `${place.name} ${groupData.destination}`;
        place.image = await getPexelsImage(searchQuery);
      }
    }

    for (const hotel of itineraryData.hotels) {
      const searchQuery = `${hotel.name} hotel ${groupData.destination}`;
      hotel.image = await getPexelsImage(searchQuery);
    }

    // --- Fetch real flights from SerpAPI ---
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
      
      const realFlights = (serpData.best_flights || serpData.other_flights || []).slice(0, 3).map((flight: any, idx: number) => ({
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
    } catch (flightErr) {
      console.error('Error fetching flights from SerpAPI:', flightErr);
      // Keep LLM flights as fallback
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