import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Get travel group details
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select(`
        departure_date,
        return_date,
        departure_iata_code,
        destination_iata_code,
        flight_class,
        travel_dates_determined
      `)
      .eq('group_id', groupId)
      .single();

    if (groupError || !groupData) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!groupData.travel_dates_determined) {
      return NextResponse.json({ error: 'Travel dates not determined yet' }, { status: 400 });
    }

    // Get member count (all considered adults)
    const { data: membersData, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (membersError) {
      return NextResponse.json({ error: 'Failed to get member count' }, { status: 500 });
    }

    const adultCount = membersData?.length || 1;

    // Construct Booking.com URL
    const bookingUrl = constructBookingUrl({
      from: groupData.departure_iata_code,
      to: groupData.destination_iata_code,
      departDate: groupData.departure_date,
      returnDate: groupData.return_date,
      adults: adultCount,
      cabinClass: groupData.flight_class || 'ECONOMY'
    });

    // Save the booking URL to the database
    const { error: updateError } = await supabase
      .from('travel_groups')
      .update({ booking_url: bookingUrl })
      .eq('group_id', groupId);

    if (updateError) {
      console.error('Error saving booking URL:', updateError);
      return NextResponse.json({ error: 'Failed to save booking URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      booking_url: bookingUrl,
      details: {
        from: groupData.departure_iata_code,
        to: groupData.destination_iata_code,
        departDate: groupData.departure_date,
        returnDate: groupData.return_date,
        adults: adultCount,
        cabinClass: groupData.flight_class
      }
    });

  } catch (error) {
    console.error('Error generating booking URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate booking URL' },
      { status: 500 }
    );
  }
}

interface BookingUrlParams {
  from: string;
  to: string;
  departDate: string;
  returnDate: string;
  adults: number;
  cabinClass: string;
}

function constructBookingUrl(params: BookingUrlParams): string {
  const baseUrl = 'https://flights.booking.com/flights';
  const route = `${params.from}.AIRPORT-${params.to}.AIRPORT/`;
  
  const searchParams = new URLSearchParams({
    type: 'ROUNDTRIP',
    adults: params.adults.toString(),
    cabinClass: params.cabinClass,
    children: '',
    from: `${params.from}.AIRPORT`,
    to: `${params.to}.AIRPORT`,
    depart: params.departDate,
    return: params.returnDate,
    sort: 'BEST',
    travelPurpose: 'leisure',
    ca_source: 'flights_index_sb'
  });

  return `${baseUrl}/${route}?${searchParams.toString()}`;
}
