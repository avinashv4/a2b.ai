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
    if (groupError || !groupData) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    return NextResponse.json({ most_recent_api_call: groupData.most_recent_api_call });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
} 