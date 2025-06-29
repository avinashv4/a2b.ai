import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabaseClient';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface GroupMember {
  user_id: string;
  schedule_and_logistics?: string;
  flight_preference?: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Get group details
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('destination, destination_display, host_id')
      .eq('group_id', groupId)
      .single();

    if (groupError || !groupData) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get all group members with their schedules and flight preferences
    const { data: membersData, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        schedule_and_logistics,
        flight_preference,
        profiles!group_members_user_id_fkey(first_name, last_name)
      `)
      .eq('group_id', groupId);

    if (membersError || !membersData) {
      return NextResponse.json({ error: 'Failed to fetch group members' }, { status: 500 });
    }

    // Get host profile for fallback departure location
    const { data: hostProfile, error: hostError } = await supabase
      .from('profiles')
      .select('state, country')
      .eq('user_id', groupData.host_id)
      .single();

    // Determine flight class based on preferences
    const flightPreferences = membersData
      .map(member => member.flight_preference)
      .filter(pref => pref);

    let flightClass = 'ECONOMY'; // Default
    if (flightPreferences.includes('ECONOMY')) {
      flightClass = 'ECONOMY';
    } else if (flightPreferences.includes('BUSINESS')) {
      flightClass = 'BUSINESS';
    } else if (flightPreferences.includes('FIRST')) {
      flightClass = 'FIRST';
    }

    // Format member data for LLM
    const memberSchedules = membersData.map((member: any) => ({
      name: `${member.profiles.first_name} ${member.profiles.last_name}`,
      schedule: member.schedule_and_logistics || 'No schedule information provided',
      flightPreference: member.flight_preference || 'Not specified'
    }));

    // Create prompt for LLM to determine travel dates
    const prompt = `
You are a travel planning assistant. Analyze the group's schedule and logistics information to determine the best travel dates for their trip to ${groupData.destination_display}.

GROUP MEMBER SCHEDULES AND LOGISTICS:
${memberSchedules.map(member => `
**${member.name}:**
- Schedule & Logistics: ${member.schedule}
- Flight Preference: ${member.flightPreference}
`).join('\n')}

HOST FALLBACK LOCATION: ${hostProfile ? `${hostProfile.state}, ${hostProfile.country}` : 'Not available'}

INSTRUCTIONS:
1. Analyze all member schedules to find common available dates
2. Determine optimal departure and return dates that work for everyone
3. Calculate trip duration in days
4. Identify the most common departure location mentioned by members
5. If no departure locations are mentioned, use the host's location as fallback
6. Provide IATA airport code for the departure location

Return your response in the following EXACT JSON format:

{
  "departure_date": "2025-07-26",
  "return_date": "2025-08-02",
  "trip_duration_days": 7,
  "departure_location": "Chennai",
  "departure_iata_code": "MAA",
  "majority_departure_location": "Chennai, Tamil Nadu, India",
  "reasoning": "Brief explanation of why these dates and location were chosen"
}

REQUIREMENTS:
- Dates must be in YYYY-MM-DD format
- Trip duration should be realistic (3-14 days typically)
- IATA code must be valid 3-letter airport code
- If multiple departure locations, choose the one mentioned by majority
- If tied or unclear, use host location as fallback
- Consider work schedules, holidays, and availability mentioned by members
`;

    // Generate travel dates using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let travelDatesData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        travelDatesData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Update the travel group with determined dates and flight info
    const { error: updateError } = await supabase
      .from('travel_groups')
      .update({
        departure_date: travelDatesData.departure_date,
        return_date: travelDatesData.return_date,
        trip_duration_days: travelDatesData.trip_duration_days,
        departure_location: travelDatesData.departure_location,
        departure_iata_code: travelDatesData.departure_iata_code,
        flight_class: flightClass,
        travel_dates_determined: true,
        majority_departure_location: travelDatesData.majority_departure_location
      })
      .eq('group_id', groupId);

    if (updateError) {
      console.error('Error updating travel group:', updateError);
      return NextResponse.json({ error: 'Failed to save travel dates' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...travelDatesData,
        flight_class: flightClass
      }
    });

  } catch (error) {
    console.error('Error determining travel dates:', error);
    return NextResponse.json(
      { error: 'Failed to determine travel dates' },
      { status: 500 }
    );
  }
}