import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getGooglePlacePhotoUrl } from '@/lib/getPlacePhoto';
import { getPlaceCoordinates } from '@/lib/utils';
import { getAllTravelModes } from '@/lib/getRoute';

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Fetch the most recent LLM response
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('most_recent_api_call, destination, destination_display')
      .eq('group_id', groupId)
      .single();

    if (groupError || !groupData || !groupData.most_recent_api_call) {
      return NextResponse.json({ error: 'No LLM response found for this group' }, { status: 404 });
    }

    // Parse the LLM response JSON
    let itineraryData;
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

    // Enhance images and coordinates for each place
    for (const day of itineraryData.itinerary) {
      for (const place of day.places) {
        place.image = await getGooglePlacePhotoUrl(`${place.name} ${groupData.destination_display || groupData.destination}`)
          || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop';
        const coordinates = await getPlaceCoordinates(place.name, groupData.destination_display || groupData.destination);
        if (coordinates) {
          place.coordinates = coordinates;
        }
      }
      // Add travel modes between consecutive places
      for (let i = 1; i < day.places.length; i++) {
        const prev = day.places[i - 1];
        const curr = day.places[i];
        if (prev.coordinates && curr.coordinates) {
          curr.travelModes = await getAllTravelModes(prev.coordinates, curr.coordinates);
        }
      }
    }

    // Enhance images for each hotel
    if (Array.isArray(itineraryData.hotels)) {
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

    return NextResponse.json({ success: true, itinerary: itineraryData });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
} 