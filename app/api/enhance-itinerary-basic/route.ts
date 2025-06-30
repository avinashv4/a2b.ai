import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getGooglePlacePhotoUrl } from '@/lib/getPlacePhoto';
import { getPlaceCoordinates } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { groupId, dayIndex } = await request.json();
    if (!groupId || typeof dayIndex !== 'number') {
      return NextResponse.json({ error: 'Group ID and dayIndex are required' }, { status: 400 });
    }

    // Fetch the most recent LLM response and itinerary
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('most_recent_api_call, destination, destination_display, itinerary')
      .eq('group_id', groupId)
      .single();

    if (groupError || !groupData || !groupData.most_recent_api_call) {
      return NextResponse.json({ error: 'No LLM response found for this group' }, { status: 404 });
    }

    // Parse the LLM response JSON if itinerary is not present
    let itineraryData = groupData.itinerary;
    if (!itineraryData) {
      try {
        const text = groupData.most_recent_api_call.response;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          itineraryData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in LLM response');
        }
      } catch (parseError) {
        return NextResponse.json({ error: 'Failed to parse LLM response', details: String(parseError) }, { status: 500 });
      }
    }

    // Enhance images and coordinates for the specified day only
    const day = itineraryData.itinerary[dayIndex];
    if (!day) {
      return NextResponse.json({ error: 'Invalid dayIndex' }, { status: 400 });
    }
    for (const place of day.places) {
      place.image = await getGooglePlacePhotoUrl(`${place.name} ${groupData.destination_display || groupData.destination}`)
        || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop';
      const coordinates = await getPlaceCoordinates(place.name, groupData.destination_display || groupData.destination);
      if (coordinates) {
        place.coordinates = coordinates;
      }
    }

    // Enhance images for each hotel (do this only on the first day to avoid redundant work)
    if (dayIndex === 0 && Array.isArray(itineraryData.hotels)) {
      for (const hotel of itineraryData.hotels) {
        hotel.image = await getGooglePlacePhotoUrl(`${hotel.name} hotel ${groupData.destination_display || groupData.destination}`)
          || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop';
      }
    }

    // Store the enhanced itinerary in the DB
    const { error: updateError } = await supabase
      .from('travel_groups')
      .update({ itinerary: itineraryData })
      .eq('group_id', groupId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save enhanced itinerary', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, day: itineraryData.itinerary[dayIndex] });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
} 