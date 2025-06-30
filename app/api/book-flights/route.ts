import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Country name to ISO code mapping (short list, add more as needed)
const countryNameToIsoCode: { [key: string]: string } = {
  "Afghanistan": "af",
  "Albania": "al",
  "Algeria": "dz",
  "American Samoa": "as",
  "Andorra": "ad",
  "Angola": "ao",
  "Anguilla": "ai",
  "Antigua & Barbuda": "ag",
  "Argentina": "ar",
  "Armenia": "am",
  "Aruba": "aw",
  "Australia": "au",
  "Austria": "at",
  "Azerbaijan": "az",
  "Bahamas": "bs",
  "Bahrain": "bh",
  "Bangladesh": "bd",
  "Barbados": "bb",
  "Belarus": "by",
  "Belgium": "be",
  "Belize": "bz",
  "Benin": "bj",
  "Bermuda": "bm",
  "Bhutan": "bt",
  "Bolivia": "bo",
  "Bonaire St. Eustatius and Saba": "bq",
  "Bosnia and Herzegovina": "ba",
  "Botswana": "bw",
  "Brazil": "br",
  "British Indian Ocean Territory": "io",
  "British Virgin Islands": "vg",
  "Brunei": "bn",
  "Bulgaria": "bg",
  "Burkina Faso": "bf",
  "Burundi": "bi",
  "Cambodia": "kh",
  "Cameroon": "cm",
  "Canada": "ca",
  "Cape Verde": "cv",
  "Cayman Islands": "ky",
  "Central Africa Republic": "cf",
  "Chad": "td",
  "Chile": "cl",
  "China": "cn",
  "Christmas Island": "cx",
  "Cocos (K) I.": "cc",
  "Colombia": "co",
  "Comoros": "km",
  "Congo": "cg",
  "Cook Islands": "ck",
  "Costa Rica": "cr",
  "Croatia": "hr",
  "Cuba": "cu",
  "Curaçao": "cw",
  "Cyprus": "cy",
  "Czech Republic": "cz",
  "Democratic Republic of the Congo": "cd",
  "Denmark": "dk",
  "Djibouti": "dj",
  "Dominica": "dm",
  "Dominican Republic": "do",
  "East Timor": "tl",
  "Ecuador": "ec",
  "Egypt": "eg",
  "El Salvador": "sv",
  "Equatorial Guinea": "gq",
  "Eritrea": "er",
  "Estonia": "ee",
  "Eswatini": "sz",
  "Ethiopia": "et",
  "Falkland Islands (Malvinas)": "fk",
  "Faroe Islands": "fo",
  "Fiji": "fj",
  "Finland": "fi",
  "France": "fr",
  "French Guiana": "gf",
  "French Polynesia": "pf",
  "Gabon": "ga",
  "Gambia": "gm",
  "Georgia": "ge",
  "Germany": "de",
  "Ghana": "gh",
  "Gibraltar": "gi",
  "Greece": "gr",
  "Greenland": "gl",
  "Grenada": "gd",
  "Guadeloupe": "gp",
  "Guam": "gu",
  "Guatemala": "gt",
  "Guernsey": "gg",
  "Guinea": "gn",
  "Guinea-Bissau": "gw",
  "Guyana": "gy",
  "Haiti": "ht",
  "Honduras": "hn",
  "Hong Kong": "hk",
  "Hungary": "hu",
  "Iceland": "is",
  "India": "in",
  "Indonesia": "id",
  "Iran": "ir",
  "Iraq": "iq",
  "Ireland": "ie",
  "Isle of Man": "im",
  "Israel": "il",
  "Italy": "it",
  "Ivory Coast": "ci",
  "Jamaica": "jm",
  "Japan": "jp",
  "Jersey": "je",
  "Jordan": "jo",
  "Kazakhstan": "kz",
  "Kenya": "ke",
  "Kiribati": "ki",
  "Kosovo": "xk",
  "Kuwait": "kw",
  "Kyrgyzstan": "kg",
  "Laos": "la",
  "Latvia": "lv",
  "Lebanon": "lb",
  "Lesotho": "ls",
  "Liberia": "lr",
  "Libya": "ly",
  "Liechtenstein": "li",
  "Lithuania": "lt",
  "Luxembourg": "lu",
  "Macau": "mo",
  "Madagascar": "mg",
  "Malawi": "mw",
  "Malaysia": "my",
  "Maldives": "mv",
  "Mali": "ml",
  "Malta": "mt",
  "Marshall Islands": "mh",
  "Martinique": "mq",
  "Mauritania": "mr",
  "Mauritius": "mu",
  "Mayotte": "yt",
  "Mexico": "mx",
  "Micronesia": "fm",
  "Moldova": "md",
  "Monaco": "mc",
  "Mongolia": "mn",
  "Montenegro": "me",
  "Montserrat": "ms",
  "Morocco": "ma",
  "Mozambique": "mz",
  "Myanmar": "mm",
  "Namibia": "na",
  "Nauru": "nr",
  "Nepal": "np",
  "Netherlands": "nl",
  "New Caledonia": "nc",
  "New Zealand": "nz",
  "Nicaragua": "ni",
  "Niger": "ne",
  "Nigeria": "ng",
  "Niue": "nu",
  "Norfolk Island": "nf",
  "North Korea": "kp",
  "North Macedonia": "mk",
  "Northern Mariana Islands": "mp",
  "Norway": "no",
  "Oman": "om",
  "Pakistan": "pk",
  "Palau": "pw",
  "Palestinian Territory": "ps",
  "Panama": "pa",
  "Papua New Guinea": "pg",
  "Paraguay": "py",
  "Peru": "pe",
  "Philippines": "ph",
  "Poland": "pl",
  "Portugal": "pt",
  "Puerto Rico": "pr",
  "Qatar": "qa",
  "Reunion": "re",
  "Romania": "ro",
  "Russia": "ru",
  "Rwanda": "rw",
  "Saint Barts": "bl",
  "Saint Kitts and Nevis": "kn",
  "Saint Lucia": "lc",
  "Saint Martin": "mf",
  "Saint Vincent & Grenadines": "vc",
  "Samoa": "ws",
  "San Marino": "sm",
  "São Tomé and Príncipe": "st",
  "Saudi Arabia": "sa",
  "Senegal": "sn",
  "Serbia": "rs",
  "Seychelles": "sc",
  "Sierra Leone": "sl",
  "Singapore": "sg",
  "Slovakia": "sk",
  "Slovenia": "si",
  "Solomon Islands": "sb",
  "Somalia": "so",
  "South Africa": "za",
  "South Korea": "kr",
  "South Sudan": "ss",
  "Spain": "es",
  "Sri Lanka": "lk",
  "St. Helena": "sh",
  "St. Maarten": "sx",
  "St. Pierre and Miquelon": "pm",
  "Sudan": "sd",
  "Suriname": "sr",
  "Svalbard & Jan Mayen": "sj",
  "Sweden": "se",
  "Switzerland": "ch",
  "Syria": "sy",
  "Taiwan": "tw",
  "Tajikistan": "tj",
  "Tanzania": "tz",
  "Thailand": "th",
  "Togo": "tg",
  "Tokelau": "tk",
  "Tonga": "to",
  "Trinidad and Tobago": "tt",
  "Tunisia": "tn",
  "Turkey": "tr",
  "Turkmenistan": "tm",
  "Turks & Caicos Islands": "tc",
  "Tuvalu": "tv",
  "U.S. Virgin Islands": "vi",
  "Uganda": "ug",
  "Ukraine": "ua",
  "United Arab Emirates": "ae",
  "United Kingdom": "gb",
  "United States": "us",
  "Uruguay": "uy",
  "Uzbekistan": "uz",
  "Vanuatu": "vu",
  "Vatican City": "va",
  "Venezuela": "ve",
  "Vietnam": "vn",
  "Wallis and Futuna": "wf",
  "Western Sahara": "eh",
  "Yemen": "ye",
  "Zambia": "zm",
  "Zimbabwe": "zw"
};

export async function POST(request: NextRequest) {
  try {
    const { groupId } = await request.json();
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Fetch group data (booking_url, selected_flight, host_id)
    const { data: groupData, error: groupError } = await supabase
      .from('travel_groups')
      .select('booking_url, selected_flight, host_id')
      .eq('group_id', groupId)
      .single();
    if (groupError || !groupData) {
      return NextResponse.json({ error: 'Failed to fetch group data' }, { status: 500 });
    }
    const booking_url = groupData.booking_url;
    if (!booking_url) {
      return NextResponse.json({ error: 'No booking_url found for group' }, { status: 400 });
    }

    // Fetch all group members
    const { data: membersData, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        profiles!group_members_user_id_fkey(
          first_name,
          last_name,
          gender,
          date_of_birth
        )
      `)
      .eq('group_id', groupId);
    if (membersError || !membersData) {
      return NextResponse.json({ error: 'Failed to fetch group members' }, { status: 500 });
    }

    // Fetch host profile for contact details
    const { data: hostProfile, error: hostError } = await supabase
      .from('profiles')
      .select('first_name, last_name, mobile_number, email, country')
      .eq('user_id', groupData.host_id)
      .single();
    if (hostError || !hostProfile) {
      return NextResponse.json({ error: 'Failed to fetch host profile' }, { status: 500 });
    }

    // Format passengers data
    const passengers = membersData.map((member: any) => {
      const profile = member.profiles;
      const dateOfBirth = new Date(profile.date_of_birth);
      return {
        firstName: profile.first_name,
        lastName: profile.last_name,
        gender: profile.gender || 'male',
        day: dateOfBirth.getDate().toString().padStart(2, '0'),
        month: (dateOfBirth.getMonth() + 1).toString().padStart(2, '0'),
        year: dateOfBirth.getFullYear().toString()
      };
    });

    // Extract phone details from mobile number (assuming format like +91 9876543210)
    const mobileNumber = hostProfile.mobile_number || '';
    const phoneNumber = mobileNumber.replace(/\D/g, ''); // Remove non-digits
    // Dynamically map host country to ISO code for phoneCountryCode
    const hostCountry = hostProfile.country;
    const phoneCountryCode = countryNameToIsoCode[hostCountry as string] || 'us'; // fallback to US if not found

    // Get flight option index from selected flight
    let flightOption = 'flight-card-0';
    if (groupData.selected_flight && typeof groupData.selected_flight.index === 'number') {
      flightOption = `flight-card-${groupData.selected_flight.index}`;
    }

    // Prepare booking request
    const bookingData = {
      group_id: groupId,
      flight_url: booking_url,
      passengers: passengers,
      flight_option: flightOption,
      headless: true,
      timeout: 45000,
      email: hostProfile.email,
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber.slice(-10) // Last 10 digits
    };

    // Send POST to Railway app
    const railwayUrl = 'https://web-production-45560.up.railway.app/api/book-flight';
    await fetch(railwayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    // Return immediately
    return NextResponse.json({ status: 'processing' });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 });
  }
} 