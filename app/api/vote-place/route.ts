import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { groupId, userId, placeId, vote } = await request.json();

    if (!groupId || !userId || !placeId || !vote) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(vote)) {
      return NextResponse.json({ error: 'Vote must be accept or reject' }, { status: 400 });
    }

    // Get current user's votes
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('place_votes')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (memberError) {
      return NextResponse.json({ error: 'Failed to get member data' }, { status: 500 });
    }

    // Update the vote for this place
    const currentVotes = memberData.place_votes || {};
    currentVotes[placeId] = vote;

    // Get total number of places in the itinerary
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('itinerary')
      .eq('group_id', groupId)
      .single();

    if (groupError || !groupData.itinerary) {
      return NextResponse.json({ error: 'Failed to get itinerary data' }, { status: 500 });
    }

    // Count total places across all days
    const totalPlaces = groupData.itinerary.itinerary.reduce((total: number, day: any) => {
      return total + day.places.length;
    }, 0);

    // Check if user has voted on all places
    const votedPlacesCount = Object.keys(currentVotes).length;
    const allPlacesVoted = votedPlacesCount >= totalPlaces;

    // Update user's votes and voting status
    const { error: updateError } = await supabase
      .from('group_members')
      .update({
        place_votes: currentVotes,
        all_places_voted: allPlacesVoted
      })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update vote' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      allPlacesVoted,
      votedPlaces: votedPlacesCount,
      totalPlaces
    });

  } catch (error) {
    console.error('Error in vote place:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}