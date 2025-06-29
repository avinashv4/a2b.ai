import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { flight_url, headless = true } = await request.json();

    if (!flight_url) {
      return NextResponse.json({ error: 'Flight URL is required' }, { status: 400 });
    }

    // Make request to your flight scraping service
    const response = await fetch(process.env.FLIGHT_SCRAPING_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FLIGHT_SCRAPING_API_KEY || ''}`,
      },
      body: JSON.stringify({
        flight_url,
        headless
      })
    });

    if (!response.ok) {
      throw new Error(`Flight scraping API returned ${response.status}`);
    }

    const flightData = await response.json();

    return NextResponse.json({
      success: true,
      flight_options: flightData.flight_options || []
    });

  } catch (error) {
    console.error('Error fetching flights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flight data' },
      { status: 500 }
    );
  }
}