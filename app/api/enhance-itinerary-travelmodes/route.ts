import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getAllTravelModes } from '@/lib/getRoute';

export async function POST(request: NextRequest) {
  try {
    const { groupId, dayIndex } = await request.json();
    if (!groupId || typeof dayIndex !== 'number') {
      return NextResponse.json({ error: 'Group ID and dayIndex are required' }, { status: 400 });
    }

    // Fetch the current itinerary
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('itinerary')
      .eq('group_id', groupId)
      .single();

    if (groupError || !groupData || !groupData.itinerary) {
      return NextResponse.json({ error: 'No itinerary found for this group' }, { status: 404 });
    }

    const itineraryData = groupData.itinerary;
    const day = itineraryData.itinerary[dayIndex];
    if (!day) {
      return NextResponse.json({ error: 'Invalid dayIndex' }, { status: 400 });
    }

    // Add travel modes between consecutive places for the specified day only
    for (let i = 1; i < day.places.length; i++) {
      const prev = day.places[i - 1];
      const curr = day.places[i];
      if (prev.coordinates && curr.coordinates) {
        curr.travelModes = await getAllTravelModes(prev.coordinates, curr.coordinates);
      }
    }

    // Store the updated itinerary in the DB
    const { error: updateError } = await supabase
      .from('travel_groups')
      .update({ itinerary: itineraryData })
      .eq('group_id', groupId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save travel modes', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, day: itineraryData.itinerary[dayIndex] });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
} 