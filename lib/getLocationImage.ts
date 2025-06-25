// Google Custom Search API for images
async function getGoogleSearchImage(query: string): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_API_KEY;
    const cx = process.env.NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_CX || '47e33f2e6e59d4e95';
    
    if (!apiKey) {
      console.warn('Google Custom Search API key not found, using fallback');
      return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop';
    }

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=1`;
    
    const response = await fetch(searchUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].link;
      }
    }
  } catch (error) {
    console.error('Error fetching Google Custom Search image:', error);
  }
  
  // Fallback to default image
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop';
}

// Main location image function using Unsplash (for trip headers)
export async function getLocationImage(location: string): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    
    if (!apiKey) {
      console.warn('Unsplash API key not found, using fallback');
      return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop';
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(location + ' landmark')}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${apiKey}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
    }
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
  }
  
  // Fallback to a default travel image
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop';
}

// Place-specific image function using Google Custom Search
export async function getPlaceImage(placeName: string, destination: string): Promise<string> {
  const searchQuery = `${placeName} ${destination}`;
  return await getGoogleSearchImage(searchQuery);
}

// Hotel-specific image function using Google Custom Search
export async function getHotelImage(hotelName: string, destination: string): Promise<string> {
  const searchQuery = `${hotelName} hotel ${destination}`;
  return await getGoogleSearchImage(searchQuery);
}