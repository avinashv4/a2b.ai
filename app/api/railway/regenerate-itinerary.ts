import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPlaceImage } from '@/lib/getLocationImage';
import { getPlaceCoordinates } from '@/lib/utils';
import { getAllTravelModes } from '@/lib/getRoute';
import { getGooglePlacePhotoUrl } from '@/lib/getPlacePhoto';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { groupId, userId, feedback } = await request.json();
    if (!groupId || !userId) {
      return NextResponse.json({ error: 'Group ID and User ID are required' }, { status: 400 });
    }

    // Respond immediately
    setTimeout(async () => {
      try {
        // Update user's regenerate vote and feedback
        await supabase
          .from('group_members')
          .update({ regenerate_vote: true, itinerary_feedback: feedback })
          .eq('group_id', groupId)
          .eq('user_id', userId);

        // Check if all members have voted
        const { data: allMembers } = await supabase
          .from('group_members')
          .select('user_id, regenerate_vote')
          .eq('group_id', groupId);
        if (!allMembers) return;
        const totalMembers = allMembers.length;
        const regenerateVotes = allMembers.filter(member => member.regenerate_vote).length;
        const majorityThreshold = totalMembers === 2 ? 2 : Math.ceil(totalMembers / 2);

        if (regenerateVotes >= majorityThreshold) {
          // Get group data including original API response and member preferences
          const { data: groupData } = await supabase
            .from('travel_groups')
            .select('most_recent_api_call, destination, destination_display, departure_date, return_date, trip_duration_days')
            .eq('group_id', groupId)
            .single();
          if (!groupData || !groupData.most_recent_api_call) return;

          // Get all member feedback and preferences
          const { data: membersWithFeedback } = await supabase
            .from('group_members')
            .select(`
              user_id,
              itinerary_feedback,
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
          if (!membersWithFeedback) return;

          // Collect all feedback
          const allFeedback = membersWithFeedback
            .filter(member => member.itinerary_feedback)
            .map(member => ({
              name: `${(member.profiles as any).first_name} ${(member.profiles as any).last_name}`,
              feedback: member.itinerary_feedback
            }));

          // Format member preferences for Gemini
          const memberPreferences = membersWithFeedback.map(member => ({
            name: `${(member.profiles as any).first_name} ${(member.profiles as any).last_name}`,
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

          // Create regeneration prompt
          const regenerationPrompt = `You are a professional travel planner. I need you to update an existing itinerary based on group voting feedback.\n\nTRAVEL DATES AND DURATION:\n- Departure Date: ${groupData.departure_date}\n- Return Date: ${groupData.return_date}\n- Trip Duration: ${groupData.trip_duration_days} days\n- You MUST maintain exactly ${groupData.trip_duration_days} days in the itinerary\n\nGROUP MEMBER PREFERENCES:\n${memberPreferences.map(member => `\n**${member.name}:**\n- Deal Breakers: ${member.dealBreakers || 'None specified'}\n- Interests: ${member.interests || 'None specified'}\n- Nice to Haves: ${member.niceToHaves || 'None specified'}\n- Motivations: ${member.motivations || 'None specified'}\n- Must Do: ${member.mustDo || 'None specified'}\n- Learning Interests: ${member.learning || 'None specified'}\n- Schedule: ${member.schedule || 'None specified'}\n- Budget: ${member.budget || 'None specified'}\n- Travel Style: ${member.travelStyle || 'None specified'}\n- Flight Preference: ${member.flightPreference || 'None specified'}\n`).join('\n')}\n\nORIGINAL ITINERARY RESPONSE:\n${groupData.most_recent_api_call.response}\n\nGROUP FEEDBACK:\n${allFeedback.map(fb => `\n**${fb.name}:**\n${fb.feedback}\n`).join('\n')}\n\nINSTRUCTIONS:\n1. Carefully analyze the group feedback to understand what they liked and what they want changed.\n2. Keep elements that received positive feedback.\n3. Replace or modify elements that received negative feedback or suggestions for improvement.\n4. Maintain the same JSON structure as the original response.\n5. Keep the same budget range, arrival IATA code, hotels, and flights unless specifically mentioned in feedback.\n6. Ensure new places align with group preferences and feedback.\n7. CRITICAL: Maintain the exact same dates from ${groupData.departure_date} to ${groupData.return_date}\n8. CRITICAL: Keep exactly ${groupData.trip_duration_days} days in the itinerary\n9. Address each piece of feedback thoughtfully while maintaining overall trip coherence.\n\nReturn the updated itinerary in the EXACT same JSON format as the original response.\n`;

          // Generate updated itinerary using Gemini
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });
          const result = await model.generateContent(regenerationPrompt);
          const response = await result.response;
          const text = response.text();

          // Store the new API response
          const newApiResponse = {
            prompt: regenerationPrompt,
            response: text,
            timestamp: new Date().toISOString(),
            model: 'gemini-2.5-flash-lite-preview-06-17',
            type: 'regeneration'
          };

          // Parse the JSON response
          let updatedItineraryData;
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              updatedItineraryData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (parseError) {
            return;
          }

          // Enhance images and coordinates (same as original generation)
          for (const day of updatedItineraryData.itinerary) {
            for (const place of day.places) {
              place.image = await getGooglePlacePhotoUrl(`${place.name} ${groupData.destination_display || groupData.destination}`)
                || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop';
              const coordinates = await getPlaceCoordinates(place.name, groupData.destination_display || groupData.destination);
              if (coordinates) {
                place.coordinates = coordinates;
              }
            }
            for (let i = 1; i < day.places.length; i++) {
              const prev = day.places[i - 1];
              const curr = day.places[i];
              if (prev.coordinates && curr.coordinates) {
                const allModes = await getAllTravelModes(prev.coordinates, curr.coordinates);
                curr.travelModes = allModes;
              }
            }
          }

          // Enhance images for hotels
          for (const hotel of updatedItineraryData.hotels) {
            hotel.image = await getGooglePlacePhotoUrl(`${hotel.name} hotel ${groupData.destination_display || groupData.destination}`)
              || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop';
          }

          // Format map locations
          updatedItineraryData.mapLocations = updatedItineraryData.itinerary.flatMap((day: any) =>
            day.places.map((place: any) => ({
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

          // Save the new itinerary and API call
          await supabase
            .from('travel_groups')
            .update({
              itinerary: updatedItineraryData,
              most_recent_api_call: newApiResponse
            })
            .eq('group_id', groupId);

          // Reset all regenerate_vote to false for all group members in the group
          await supabase
            .from('group_members')
            .update({ regenerate_vote: false, itinerary_feedback: null })
            .eq('group_id', groupId);
        }
      } catch (err) {
        // Silent fail
      }
    }, 0);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to trigger itinerary regeneration' }, { status: 500 });
  }
} 