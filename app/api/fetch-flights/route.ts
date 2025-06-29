import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { flight_url, headless = true } = await request.json();

    if (!flight_url) {
      return NextResponse.json({ error: 'Flight URL is required' }, { status: 400 });
    }

    // Check if the flight scraping API URL is configured
    if (!process.env.FLIGHT_SCRAPING_API_URL) {
      console.error('FLIGHT_SCRAPING_API_URL not configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Flight scraping service not configured',
        flight_options: []
      });
    }

    // Make request to your flight scraping service
    const response = await fetch(process.env.FLIGHT_SCRAPING_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.FLIGHT_SCRAPING_API_KEY && {
          'Authorization': `Bearer ${process.env.FLIGHT_SCRAPING_API_KEY}`
        })
      },
      body: JSON.stringify({
        flight_url,
        headless
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Flight scraping API returned ${response.status}:`, errorText);
      return NextResponse.json({ 
        success: false, 
        error: `Flight API error: ${response.status}`,
        flight_options: []
      });
    }

    const flightData = await response.json();

    return NextResponse.json({
      success: true,
      flight_options: flightData.flight_options || []
    });

  } catch (error) {
    console.error('Error fetching flights:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch flight data',
        flight_options: []
      },
      { status: 200 } // Return 200 with empty data instead of 500
    );
  }
}