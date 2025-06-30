import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('travel_groups')
      .select('flight_booking')
      .eq('group_id', groupId)
      .single();
    if (error) {
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ flight_booking: data?.flight_booking || null });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
} 