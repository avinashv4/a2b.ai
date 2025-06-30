import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Fetch flight_options from DB
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('flight_options')
      .eq('group_id', groupId)
      .single();

    if (groupError) {
      return NextResponse.json({ error: 'Database error', details: groupError.message }, { status: 500 });
    }

    if (groupData && groupData.flight_options) {
      return NextResponse.json({ ready: true, flight_options: groupData.flight_options });
    } else {
      return NextResponse.json({ ready: false });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
} 