import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Fetch booking_url from DB
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('booking_url')
      .eq('group_id', groupId)
      .single();

    if (groupError || !groupData || !groupData.booking_url) {
      return NextResponse.json({ error: 'Booking URL not found for group' }, { status: 404 });
    }

    // Send POST to Railway app
    const railwayUrl = 'https://web-production-45560.up.railway.app/api/get-flights';
    const railwayResponse = await fetch(railwayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flight_url: groupData.booking_url,
        headless: true,
        group_id: groupId
      })
    });

    if (!railwayResponse.ok) {
      const errorText = await railwayResponse.text();
      return NextResponse.json({ error: 'Failed to trigger Railway app', details: errorText }, { status: 500 });
    }

    // Return immediately
    return NextResponse.json({ status: 'processing' });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
}
