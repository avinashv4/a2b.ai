import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPlaceImage } from '@/lib/getLocationImage';
import { getPlaceCoordinates } from '@/lib/utils';
import { getOptimalRoute, getAllTravelModes } from '@/lib/getRoute';
import { getGooglePlacePhotoUrl } from '@/lib/getPlacePhoto';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Respond immediately
    setTimeout(async () => {
      try {
        // --- Begin original generate-itinerary logic ---
        // Get group details and members with preferences
        const { data: groupData, error: groupError } = await supabase
          .from('travel_groups')
          .select('destination, host_id, destination_display, departure_date, return_date, trip_duration_days, departure_iata_code, destination_iata_code, flight_class, travel_dates_determined, booking_url')
          .eq('group_id', groupId)
          .single();

        if (groupError || !groupData) return;
        if (!groupData.travel_dates_determined) return;

        // Generate booking URL if not already present
        let bookingUrl = groupData.booking_url;
        if (!bookingUrl) {
          const { data: membersCount } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId);
          const adultCount = membersCount?.length || 1;
          bookingUrl = `https://flights.booking.com/flights/${groupData.departure_iata_code}.AIRPORT-${groupData.destination_iata_code}.AIRPORT/?type=ROUNDTRIP&adults=${adultCount}&cabinClass=${groupData.flight_class || 'ECONOMY'}&children=&from=${groupData.departure_iata_code}.AIRPORT&to=${groupData.destination_iata_code}.AIRPORT&depart=${groupData.departure_date}&return=${groupData.return_date}&sort=BEST&travelPurpose=leisure&ca_source=flights_index_sb`;
          await supabase
            .from('travel_groups')
            .update({ booking_url: bookingUrl })
            .eq('group_id', groupId);
        }

        // Get all group members with their preferences
        const { data: membersData } = await supabase
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
        if (!membersData) return;

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
        const { data: flightData } = await supabase
          .from('travel_groups')
          .select('flight_options')
          .eq('group_id', groupId)
          .single();
        if (!flightData || !flightData.flight_options) return;

        let availableFlights = '';
        if (Array.isArray(flightData.flight_options) && flightData.flight_options.length > 0) {
          availableFlights = `\nAVAILABLE FLIGHT OPTIONS:\n${flightData.flight_options.slice(0, 5).map((flight: any) => `\nIndex: ${flight.index}\nFlight Details: ${flight.text_content}\n`).join('\n')}`;
        }

        // Create prompt for Gemini
        const prompt = `You are a professional travel planner. Create a detailed group itinerary for ${groupData.destination} based on the group member preferences below:\n\nTRAVEL DATES AND DURATION:\n- Departure Date: ${groupData.departure_date}\n- Return Date: ${groupData.return_date}\n- Trip Duration: ${groupData.trip_duration_days} days\n- You MUST create an itinerary for exactly ${groupData.trip_duration_days} days\n\n${memberPreferences.map(member => `\n**${member.name}:**\n- Deal Breakers: ${member.dealBreakers || 'None specified'}\n- Interests: ${member.interests || 'None specified'}\n- Nice to Haves: ${member.niceToHaves || 'None specified'}\n- Motivations: ${member.motivations || 'None specified'}\n- Must Do: ${member.mustDo || 'None specified'}\n- Learning Interests: ${member.learning || 'None specified'}\n- Schedule: ${member.schedule || 'None specified'}\n- Budget: ${member.budget || 'None specified'}\n- Travel Style: ${member.travelStyle || 'None specified'}\n- Flight Preference: ${member.flightPreference || 'None specified'}\n`).join('\n')}${availableFlights}\n\nPlease return the response in the following EXACT JSON format (no additional text, just the JSON): ...`;

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
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            itineraryData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          return;
        }

        // Store the raw LLM response, the parsed itinerary, and the selected flight if present
        const updateData: any = {
          most_recent_api_call: rawApiResponse,
          itinerary: itineraryData
        };
        if (itineraryData.selectedFlight) {
          updateData.selected_flight = itineraryData.selectedFlight;
        }
        await supabase
          .from('travel_groups')
          .update(updateData)
          .eq('group_id', groupId);
        // --- End original generate-itinerary logic ---
      } catch (err) {
        // Silent fail
      }
    }, 0);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to trigger itinerary generation' }, { status: 500 });
  }
} 