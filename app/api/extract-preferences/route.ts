import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface ConversationData {
  deal_breakers_and_strong_preferences?: string;
  interests_and_activities?: string;
  nice_to_haves_and_openness?: string;
  travel_motivations?: string;
  must_do_experiences?: string;
  learning_interests?: string;
  schedule_and_logistics?: string;
  budget_and_spending?: string;
  travel_style_preferences?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, userId, groupId } = await request.json();

    if (!conversationId || !userId || !groupId) {
      return NextResponse.json(
        { error: 'Missing required parameters: conversationId, userId, or groupId' },
        { status: 400 }
      );
    }

    // Get conversation details from ElevenLabs
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      {
        method: 'GET',
        headers: {
          'Xi-Api-Key': process.env.ELEVENLABS_API_KEY || '',
        },
      }
    );

    if (!elevenLabsResponse.ok) {
      console.error('ElevenLabs API error:', elevenLabsResponse.status, elevenLabsResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch conversation from ElevenLabs' },
        { status: 500 }
      );
    }

    const conversationData = await elevenLabsResponse.json();
    console.log('Conversation data received:', conversationData);

    // Extract preference data from the conversation
    const preferences: ConversationData = {
      deal_breakers_and_strong_preferences: conversationData.deal_breakers_and_strong_preferences || '',
      interests_and_activities: conversationData.interests_and_activities || '',
      nice_to_haves_and_openness: conversationData.nice_to_haves_and_openness || '',
      travel_motivations: conversationData.travel_motivations || '',
      must_do_experiences: conversationData.must_do_experiences || '',
      learning_interests: conversationData.learning_interests || '',
      schedule_and_logistics: conversationData.schedule_and_logistics || '',
      budget_and_spending: conversationData.budget_and_spending || '',
      travel_style_preferences: conversationData.travel_style_preferences || '',
    };

    // Update the group_members table with the extracted preferences
    const { error: updateError } = await supabase
      .from('group_members')
      .update(preferences)
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences extracted and saved successfully',
      preferences,
    });

  } catch (error) {
    console.error('Error in extract-preferences API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}