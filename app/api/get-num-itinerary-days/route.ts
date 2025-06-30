import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('most_recent_api_call')
      .eq('group_id', groupId)
      .single();
    if (groupError || !groupData || !groupData.most_recent_api_call) {
      return NextResponse.json({ error: 'No most_recent_api_call found for this group' }, { status: 404 });
    }
    let responseText = groupData.most_recent_api_call.response;
    if (!responseText) {
      return NextResponse.json({ error: 'No response found in most_recent_api_call' }, { status: 404 });
    }
    // Try to parse the responseText as JSON
    let itineraryObj;
    try {
      // If responseText is wrapped in code block, remove it
      responseText = responseText.replace(/^```json|```$/g, '').trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        itineraryObj = JSON.parse(jsonMatch[0]);
      } else {
        itineraryObj = JSON.parse(responseText);
      }
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse response as JSON' }, { status: 500 });
    }
    const numDays = Array.isArray(itineraryObj?.itinerary) ? itineraryObj.itinerary.length : 0;
    return NextResponse.json({ numDays });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
} 