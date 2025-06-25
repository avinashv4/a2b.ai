import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { groupId, userId } = await request.json();

    if (!groupId || !userId) {
      return NextResponse.json({ error: 'Group ID and User ID are required' }, { status: 400 });
    }

    // Update user's regenerate vote
    const { error: voteError } = await supabase
      .from('group_members')
      .update({ regenerate_vote: true })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (voteError) {
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }

    // Check if all members have voted
    const { data: allMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, regenerate_vote')
      .eq('group_id', groupId);

    if (membersError) {
      return NextResponse.json({ error: 'Failed to check votes' }, { status: 500 });
    }

    const totalMembers = allMembers.length;
    const votedMembers = allMembers.filter(member => member.regenerate_vote).length;

    // If all members have voted, regenerate the itinerary
    if (votedMembers === totalMembers) {
      // Call the generate-itinerary API
      const regenerateResponse = await fetch(`${request.nextUrl.origin}/api/generate-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      if (!regenerateResponse.ok) {
        return NextResponse.json({ error: 'Failed to regenerate itinerary' }, { status: 500 });
      }

      // Reset all regenerate votes
      const { error: resetError } = await supabase
        .from('group_members')
        .update({ regenerate_vote: false })
        .eq('group_id', groupId);

      if (resetError) {
        console.error('Failed to reset votes:', resetError);
      }

      return NextResponse.json({
        success: true,
        regenerated: true,
        votedMembers: totalMembers,
        totalMembers
      });
    }

    return NextResponse.json({
      success: true,
      regenerated: false,
      votedMembers,
      totalMembers
    });

  } catch (error) {
    console.error('Error in regenerate itinerary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}