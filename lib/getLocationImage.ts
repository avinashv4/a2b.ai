const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY'; // This will be replaced with actual key

export async function getLocationImage(location: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(location + ' travel destination')}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': process.env.NEXT_PUBLIC_PEXELS_API_KEY || PEXELS_API_KEY
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.large;
      }
    }
  } catch (error) {
    console.error('Error fetching location image:', error);
  }
  
  // Fallback to a default travel image
  return 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop';
}