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

    // Get country codes for departure and destination
    const departureCountry = getCountryFromIATA(groupData.departure_iata_code);
    const destinationCountry = getCountryFromIATA(groupData.destination_iata_code);

    // Construct Booking.com URL
    const bookingUrl = constructBookingUrl({
      from: groupData.departure_iata_code,
      to: groupData.destination_iata_code,
      fromCountry: departureCountry,
      toCountry: destinationCountry,
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
  fromCountry: string;
  toCountry: string;
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
    fromCountry: params.fromCountry,
    toCountry: params.toCountry,
    depart: params.departDate,
    return: params.returnDate,
    sort: 'BEST',
    travelPurpose: 'leisure',
    ca_source: 'flights_index_sb'
  });

  return `${baseUrl}/${route}?${searchParams.toString()}`;
}

// Helper function to get country code from IATA code
function getCountryFromIATA(iataCode: string): string {
  const airportCountryMap: Record<string, string> = {
    // India
    'MAA': 'IN', 'BOM': 'IN', 'DEL': 'IN', 'BLR': 'IN', 'HYD': 'IN', 'CCU': 'IN',
    'COK': 'IN', 'AMD': 'IN', 'PNQ': 'IN', 'GOI': 'IN', 'TRV': 'IN', 'IXM': 'IN',
    
    // USA
    'JFK': 'US', 'LAX': 'US', 'ORD': 'US', 'DFW': 'US', 'DEN': 'US', 'SFO': 'US',
    'SEA': 'US', 'LAS': 'US', 'PHX': 'US', 'IAH': 'US', 'MIA': 'US', 'BOS': 'US',
    'MSP': 'US', 'DTW': 'US', 'PHL': 'US', 'LGA': 'US', 'BWI': 'US', 'DCA': 'US',
    
    // UK
    'LHR': 'GB', 'LGW': 'GB', 'STN': 'GB', 'LTN': 'GB', 'MAN': 'GB', 'EDI': 'GB',
    'BHX': 'GB', 'GLA': 'GB', 'BRS': 'GB', 'NCL': 'GB',
    
    // France
    'CDG': 'FR', 'ORY': 'FR', 'NCE': 'FR', 'LYS': 'FR', 'MRS': 'FR', 'TLS': 'FR',
    
    // Germany
    'FRA': 'DE', 'MUC': 'DE', 'TXL': 'DE', 'DUS': 'DE', 'HAM': 'DE', 'STR': 'DE',
    
    // Japan
    'NRT': 'JP', 'HND': 'JP', 'KIX': 'JP', 'ITM': 'JP', 'NGO': 'JP', 'FUK': 'JP',
    
    // Australia
    'SYD': 'AU', 'MEL': 'AU', 'BNE': 'AU', 'PER': 'AU', 'ADL': 'AU', 'DRW': 'AU',
    
    // Canada
    'YYZ': 'CA', 'YVR': 'CA', 'YUL': 'CA', 'YYC': 'CA', 'YOW': 'CA', 'YHZ': 'CA',
    
    // Singapore
    'SIN': 'SG',
    
    // UAE
    'DXB': 'AE', 'AUH': 'AE',
    
    // Thailand
    'BKK': 'TH', 'DMK': 'TH', 'HKT': 'TH',
    
    // Malaysia
    'KUL': 'MY', 'PEN': 'MY', 'JHB': 'MY',
    
    // Indonesia
    'CGK': 'ID', 'DPS': 'ID',
    
    // China
    'PEK': 'CN', 'PVG': 'CN', 'CAN': 'CN', 'SZX': 'CN',
    
    // South Korea
    'ICN': 'KR', 'GMP': 'KR',
    
    // Italy
    'FCO': 'IT', 'MXP': 'IT', 'VCE': 'IT', 'NAP': 'IT',
    
    // Spain
    'MAD': 'ES', 'BCN': 'ES', 'PMI': 'ES', 'AGP': 'ES',
    
    // Netherlands
    'AMS': 'NL',
    
    // Switzerland
    'ZUR': 'CH', 'GVA': 'CH',
    
    // Austria
    'VIE': 'AT',
    
    // Belgium
    'BRU': 'BE',
    
    // Turkey
    'IST': 'TR', 'SAW': 'TR',
    
    // Russia
    'SVO': 'RU', 'DME': 'RU', 'VKO': 'RU',
    
    // Brazil
    'GRU': 'BR', 'GIG': 'BR', 'BSB': 'BR',
    
    // Mexico
    'MEX': 'MX', 'CUN': 'MX',
    
    // South Africa
    'JNB': 'ZA', 'CPT': 'ZA'
  };

  return airportCountryMap[iataCode] || 'US'; // Default to US if not found
}