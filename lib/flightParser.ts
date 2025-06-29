interface FlightOption {
  index: number;
  tag_name: string;
  aria_label: string;
  text_content: string;
  aria_describedby: string | null;
}

interface ParsedFlight {
  index: number;
  outbound: {
    departure_time: string;
    departure_date: string;
    departure_airport: string;
    arrival_time: string;
    arrival_date: string;
    arrival_airport: string;
    duration: string;
    stops: string;
  };
  return: {
    departure_time: string;
    departure_date: string;
    departure_airport: string;
    arrival_time: string;
    arrival_date: string;
    arrival_airport: string;
    duration: string;
    stops: string;
  };
  airline: string;
  price: string;
  currency: string;
  ticket_type?: string;
}

export function parseFlightOptions(flightOptions: FlightOption[]): ParsedFlight[] {
  return flightOptions.map(option => {
    const text = option.text_content;
    
    // Extract price (INR format)
    const priceMatch = text.match(/INR([\d,]+\.?\d*)/);
    const price = priceMatch ? priceMatch[1] : '0';
    
    // Extract airline name (usually appears before "INR" or at the end before price)
    const airlineMatch = text.match(/([A-Za-z\s]+(?:Airlines?|Airways?))/);
    const airline = airlineMatch ? airlineMatch[1].trim() : 'Unknown Airline';
    
    // Extract ticket type if present
    const ticketTypeMatch = text.match(/(Economy Basic|Eco Value|Business|First)/);
    const ticketType = ticketTypeMatch ? ticketTypeMatch[1] : undefined;
    
    // Parse outbound flight (first flight segment)
    const outboundMatch = text.match(/(\d{2}:\d{2})([A-Z]{3})\s*·\s*(\d{1,2}\s+[A-Za-z]{3})(\d+\s+stops?|\d+\s+stop|Direct)?(\d+h\s*\d*m?)(\d{2}:\d{2})([A-Z]{3})\s*·\s*(\d{1,2}\s+[A-Za-z]{3})/);
    
    // Parse return flight (second flight segment)
    const returnMatch = text.match(/(\d{2}:\d{2})([A-Z]{3})\s*·\s*(\d{1,2}\s+[A-Za-z]{3}).*?(\d+\s+stops?|\d+\s+stop|Direct)?(\d+h\s*\d*m?)(\d{2}:\d{2})([A-Z]{3})\s*·\s*(\d{1,2}\s+[A-Za-z]{3})(?!.*\d{2}:\d{2})/);
    
    // Find all time patterns to separate outbound and return
    const timeMatches = [...text.matchAll(/(\d{2}:\d{2})([A-Z]{3})\s*·\s*(\d{1,2}\s+[A-Za-z]{3})/g)];
    
    let outbound, returnFlight;
    
    if (timeMatches.length >= 4) {
      // We have both outbound and return flights
      outbound = {
        departure_time: timeMatches[0][1],
        departure_date: timeMatches[0][3],
        departure_airport: timeMatches[0][2],
        arrival_time: timeMatches[1][1],
        arrival_date: timeMatches[1][3],
        arrival_airport: timeMatches[1][2],
        duration: extractDuration(text, 0) || 'Unknown',
        stops: extractStops(text, 0) || 'Unknown'
      };
      
      returnFlight = {
        departure_time: timeMatches[2][1],
        departure_date: timeMatches[2][3],
        departure_airport: timeMatches[2][2],
        arrival_time: timeMatches[3][1],
        arrival_date: timeMatches[3][3],
        arrival_airport: timeMatches[3][2],
        duration: extractDuration(text, 1) || 'Unknown',
        stops: extractStops(text, 1) || 'Unknown'
      };
    } else {
      // Fallback parsing
      outbound = {
        departure_time: 'Unknown',
        departure_date: 'Unknown',
        departure_airport: 'Unknown',
        arrival_time: 'Unknown',
        arrival_date: 'Unknown',
        arrival_airport: 'Unknown',
        duration: 'Unknown',
        stops: 'Unknown'
      };
      
      returnFlight = {
        departure_time: 'Unknown',
        departure_date: 'Unknown',
        departure_airport: 'Unknown',
        arrival_time: 'Unknown',
        arrival_date: 'Unknown',
        arrival_airport: 'Unknown',
        duration: 'Unknown',
        stops: 'Unknown'
      };
    }
    
    return {
      index: option.index,
      outbound,
      return: returnFlight,
      airline,
      price,
      currency: 'INR',
      ticket_type: ticketType
    };
  });
}

function extractDuration(text: string, segmentIndex: number): string | null {
  const durationMatches = [...text.matchAll(/(\d+h\s*\d*m?)/g)];
  return durationMatches[segmentIndex] ? durationMatches[segmentIndex][1] : null;
}

function extractStops(text: string, segmentIndex: number): string | null {
  const stopMatches = [...text.matchAll(/(\d+\s+stops?|Direct)/g)];
  return stopMatches[segmentIndex] ? stopMatches[segmentIndex][1] : null;
}