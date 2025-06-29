const fetch = require('node-fetch');
const cheerio = require('cheerio');

const FLIGHT_URL = 'https://flights.booking.com/flights/MAA.AIRPORT-JFK.AIRPORT?type=ROUNDTRIP&adults=1&cabinClass=ECONOMY&children=&from=MAA.AIRPORT&to=JFK.AIRPORT&fromCountry=IN&toCountry=US&fromLocationName=Chennai+International+Airport&toLocationName=John+F.+Kennedy+International+Airport&depart=2025-07-26&return=2025-08-02&sort=BEST&travelPurpose=leisure&ca_source=flights_index_sb&aid=304142&label=flights-booking-direct';
const TARGET_ARIA = 'Flight option';

async function run() {
  try {
    const response = await fetch(FLIGHT_URL);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const html = await response.text();

    const $ = cheerio.load(html);

    const elements = $(`[aria-label="${TARGET_ARIA}"]`);
    console.log(`Found ${elements.length} elements with aria-label="${TARGET_ARIA}"`);

    const flight_cards_info = [];

    elements.each((i, el) => {
      const tag = el.tagName?.toLowerCase();
      const aria = $(el).attr('aria-label');
      const text = $(el).text().trim();
      const flight_info = `#${i}: <${tag}> aria-label='${aria}'; text='${text}'`;
      console.log(flight_info);
      flight_cards_info.push(flight_info);
    });

    // Optionally return, save, or process `flight_cards_info`
  } catch (err) {
    console.error('Scraping failed:', err);
  }
}

run();
