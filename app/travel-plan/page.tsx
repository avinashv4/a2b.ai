'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Plane, 
  Hotel, 
  Calendar, 
  MapPin, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Check,
  RotateCcw,
  Clock,
  Navigation,
  Star,
  DollarSign,
  Settings,
  Copy,
  Trash2,
  Edit2,
  Car,
  Train,
  Navigation2,
  RefreshCw,
  X,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Place {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  walkTime?: string;
  distance?: string;
  travelMode?: 'walk' | 'car' | 'train' | 'metro' | 'ferry';
  votes?: {
    accept: number;
    deny: number;
    userVote?: 'accept' | 'deny' | null;
  };
}

interface DayItinerary {
  date: string;
  day: string;
  month: string;
  places: Place[];
}

interface Flight {
  id: string;
  airline: string;
  departure: string;
  arrival: string;
  duration: string;
  price: string;
  stops: string;
}

interface Hotel {
  id: string;
  name: string;
  rating: number;
  price: string;
  image: string;
  amenities: string[];
}

export default function TravelPlanPage() {
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedDays, setExpandedDays] = useState<string[]>(['15']);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showItineraryDays, setShowItineraryDays] = useState(true);
  const [showTripSettings, setShowTripSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tripName, setTripName] = useState('Paris Adventure');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempTripName, setTempTripName] = useState(tripName);
  const [regenerateVotes, setRegenerateVotes] = useState(2);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = (id: string, event: React.MouseEvent) => {
    setHoveredTooltip(id);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredTooltip(null);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleDayExpansion = (dayId: string) => {
    setExpandedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const handleVote = (placeId: string, voteType: 'accept' | 'deny') => {
    // Update vote logic here
    console.log(`Voted ${voteType} for place ${placeId}`);
  };

  const handleCopyInviteLink = () => {
    const inviteLink = 'a2b.ai/join/abc123';
    navigator.clipboard.writeText(inviteLink);
    // Show success message
  };

  const handleDeletePlan = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeletePlan = () => {
    window.location.href = '/dashboard';
  };

  const handleEditTripName = () => {
    setIsEditingName(true);
    setTempTripName(tripName);
  };

  const saveTripName = () => {
    setTripName(tempTripName);
    setIsEditingName(false);
  };

  const cancelEditName = () => {
    setTempTripName(tripName);
    setIsEditingName(false);
  };

  const handleRegenerateItinerary = () => {
    setRegenerateVotes(prev => prev + 1);
  };

  // Sample data
  const tripMembers = [
    { name: 'You', avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop' },
    { name: 'Sarah', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop' },
    { name: 'Mike', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop' },
    { name: 'Emma', avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop' }
  ];

  const flights: Flight[] = [
    {
      id: '1',
      airline: 'Air France',
      departure: '10:30 AM',
      arrival: '2:45 PM',
      duration: '8h 15m',
      price: '$650',
      stops: 'Direct'
    },
    {
      id: '2',
      airline: 'Delta',
      departure: '6:15 AM',
      arrival: '12:30 PM',
      duration: '9h 15m',
      price: '$580',
      stops: '1 stop'
    },
    {
      id: '3',
      airline: 'United',
      departure: '3:20 PM',
      arrival: '9:35 PM',
      duration: '9h 15m',
      price: '$720',
      stops: 'Direct'
    }
  ];

  const hotels: Hotel[] = [
    {
      id: '1',
      name: 'Hotel Le Marais',
      rating: 4.8,
      price: '$180/night',
      image: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      amenities: ['Free WiFi', 'Breakfast', 'Gym', 'Spa']
    },
    {
      id: '2',
      name: 'Grand Hotel Opera',
      rating: 4.6,
      price: '$220/night',
      image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      amenities: ['Free WiFi', 'Restaurant', 'Bar', 'Concierge']
    },
    {
      id: '3',
      name: 'Boutique Hotel Montmartre',
      rating: 4.4,
      price: '$150/night',
      image: 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
      amenities: ['Free WiFi', 'Rooftop Terrace', 'Pet Friendly']
    }
  ];

  const itinerary: DayItinerary[] = [
    {
      date: '15',
      day: 'Jun',
      month: 'Day 1',
      places: [
        {
          id: 'p1',
          name: 'Eiffel Tower',
          description: 'Iconic iron lattice tower and symbol of Paris. Standing at 330 meters tall, this architectural marvel offers breathtaking views of the city and is a must-visit landmark for any Paris trip.',
          image: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '2 hours',
          votes: { accept: 3, deny: 1, userVote: null }
        },
        {
          id: 'p2',
          name: 'Seine River Cruise',
          description: 'Scenic boat ride along the historic Seine River. Experience Paris from a unique perspective as you glide past famous landmarks including Notre-Dame, the Louvre, and charming riverside cafes.',
          image: 'https://images.pexels.com/photos/1530259/pexels-photo-1530259.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '1.5 hours',
          walkTime: '15 min',
          distance: '1.2 km',
          travelMode: 'walk',
          votes: { accept: 4, deny: 0, userVote: 'accept' }
        },
        {
          id: 'p3',
          name: 'Louvre Museum',
          description: 'World\'s largest art museum and historic monument. Home to thousands of works including the Mona Lisa and Venus de Milo, this former royal palace is a treasure trove of art and history.',
          image: 'https://images.pexels.com/photos/2675266/pexels-photo-2675266.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '3 hours',
          walkTime: '8 min',
          distance: '2.5 km',
          travelMode: 'metro',
          votes: { accept: 2, deny: 2, userVote: 'deny' }
        }
      ]
    },
    {
      date: '16',
      day: 'Jun',
      month: 'Day 2',
      places: [
        {
          id: 'p4',
          name: 'Notre-Dame Cathedral',
          description: 'Medieval Catholic cathedral and architectural masterpiece. This Gothic cathedral, immortalized in Victor Hugo\'s novel, showcases stunning flying buttresses and intricate stone carvings.',
          image: 'https://images.pexels.com/photos/1850619/pexels-photo-1850619.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '1.5 hours',
          votes: { accept: 4, deny: 0, userVote: null }
        },
        {
          id: 'p5',
          name: 'Sainte-Chapelle',
          description: 'Gothic chapel famous for its stunning stained glass windows. Built in the 13th century, this royal chapel features some of the most beautiful medieval stained glass in the world.',
          image: 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '1 hour',
          walkTime: '5 min',
          distance: '400 m',
          travelMode: 'walk',
          votes: { accept: 3, deny: 1, userVote: null }
        },
        {
          id: 'p6',
          name: 'Latin Quarter',
          description: 'Historic area known for its student life and bistros. Wander through narrow medieval streets, browse bookshops, and enjoy authentic French cuisine in this vibrant neighborhood.',
          image: 'https://images.pexels.com/photos/1461974/pexels-photo-1461974.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '2 hours',
          walkTime: '12 min',
          distance: '3.2 km',
          travelMode: 'car',
          votes: { accept: 4, deny: 0, userVote: null }
        }
      ]
    },
    {
      date: '17',
      day: 'Jun',
      month: 'Day 3',
      places: [
        {
          id: 'p7',
          name: 'Montmartre & Sacré-Cœur',
          description: 'Artistic district with stunning basilica views. Explore the bohemian neighborhood where Picasso and Renoir once lived, and visit the beautiful white-domed basilica overlooking Paris.',
          image: 'https://images.pexels.com/photos/1308940/pexels-photo-1308940.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '3 hours',
          votes: { accept: 4, deny: 0, userVote: null }
        },
        {
          id: 'p8',
          name: 'Moulin Rouge',
          description: 'Famous cabaret and birthplace of the can-can dance. Experience the glamour and excitement of this legendary venue that has been entertaining audiences since 1889.',
          image: 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '2 hours',
          walkTime: '8 min',
          distance: '650 m',
          travelMode: 'walk',
          votes: { accept: 3, deny: 1, userVote: null }
        }
      ]
    }
  ];

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, isExternal: true, href: '/dashboard' },
  ];

  const travelSections = [
    { id: 'overview', label: 'Trip Overview', icon: MapPin },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar, hasCollapse: true },
  ];

  const mobileNavItems = [
    { id: 'overview', label: 'Overview', icon: MapPin },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
  ];

  const getTravelModeIcon = (mode: string) => {
    switch (mode) {
      case 'walk': return <Navigation className="w-4 h-4" />;
      case 'car': return <Car className="w-4 h-4" />;
      case 'train': return <Train className="w-4 h-4" />;
      case 'metro': return <Navigation2 className="w-4 h-4" />;
      case 'ferry': return <Navigation className="w-4 h-4" />;
      default: return <Navigation className="w-4 h-4" />;
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating}</span>
      </div>
    );
  };

  // Scroll spy effect
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const sections = ['overview', 'flights', 'hotels', 'itinerary'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = sectionRefs.current[section];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex">
        <div className="w-72 bg-white border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">a2b.ai</span>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="w-3/5 p-8">
            <div className="space-y-6">
              <div className="w-full h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
              <div className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
              <div className="h-24 bg-gray-100 rounded-2xl animate-pulse"></div>
            </div>
          </div>
          <div className="w-2/5 bg-gray-100 border-l border-gray-200">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Loading...</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">a2b.ai</span>
            </div>
            <Button
              onClick={() => setShowMobileMap(!showMobileMap)}
              variant="outline"
              size="sm"
              className="px-3 py-2"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {showMobileMap ? 'Close Map' : 'View Map'}
            </Button>
          </div>
        </div>

        {/* Mobile Map Overlay */}
        {showMobileMap && (
          <div className="fixed inset-0 bg-white z-50 pt-16">
            <div className="h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Interactive Map</h3>
                <p className="text-gray-500">Map integration will be added here</p>
                <Button
                  onClick={() => setShowMobileMap(false)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Close Map
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <div className="pt-20 pb-20 px-4">
          {/* Trip Overview */}
          <div ref={(el) => sectionRefs.current['overview'] = el} className="mb-8">
            <div className="space-y-6">
              {/* Trip Image */}
              <div className="w-full h-48 rounded-2xl overflow-hidden bg-gray-200">
                <img
                  src="https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop"
                  alt="Paris"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Trip Header */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{tripName}</h1>
                <p className="text-lg text-gray-600 mb-4">June 15-17, 2024 • 3 Days</p>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">$2,450</p>
                  <p className="text-sm text-gray-600">estimated budget per person</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 text-center">
                  <Plane className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Suggested Flight</h3>
                  <p className="text-sm text-gray-600">Air France • Direct</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 text-center">
                  <Hotel className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Suggested Hotel</h3>
                  <p className="text-sm text-gray-600">Hotel Le Marais</p>
                </div>
              </div>
            </div>
          </div>

          {/* Flights Section */}
          <div ref={(el) => sectionRefs.current['flights'] = el} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Flight Options (Round Trip)</h2>
            <div className="space-y-4">
              {flights.map((flight) => (
                <div key={flight.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{flight.airline}</h3>
                      <p className="text-lg font-bold text-blue-600">{flight.price}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{flight.departure} → {flight.arrival}</p>
                      <p>{flight.duration} • {flight.stops}</p>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Select Flight
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hotels Section */}
          <div ref={(el) => sectionRefs.current['hotels'] = el} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hotel Options</h2>
            <div className="space-y-4">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="space-y-3">
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-200">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
                      <p className="text-lg font-bold text-green-600">{hotel.price}</p>
                    </div>
                    {renderStarRating(hotel.rating)}
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Select Hotel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Itinerary Section */}
          <div ref={(el) => sectionRefs.current['itinerary'] = el} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Daily Itinerary</h2>
            
            {itinerary.map((day) => (
              <div key={day.date} className="mb-6">
                <Button
                  onClick={() => toggleDayExpansion(day.date)}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 mb-4"
                >
                  <span className="text-lg font-semibold">{day.month} - {day.day} {day.date}</span>
                  {expandedDays.includes(day.date) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
                
                {expandedDays.includes(day.date) && (
                  <div className="space-y-4">
                    {day.places.map((place, index) => (
                      <div key={place.id}>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                          <div className="space-y-3">
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-200">
                              <img
                                src={place.image}
                                alt={place.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-gray-900">{place.name}</h4>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleVote(place.id, 'accept')}
                                  className={`w-8 h-8 rounded-full p-0 ${
                                    place.votes?.userVote === 'accept'
                                      ? 'bg-green-600 text-white'
                                      : 'bg-green-100 text-green-600'
                                  }`}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleVote(place.id, 'deny')}
                                  className={`w-8 h-8 rounded-full p-0 ${
                                    place.votes?.userVote === 'deny'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-red-100 text-red-600'
                                  }`}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{place.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{place.duration}</span>
                              </div>
                              {place.votes && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-green-600">👍 {place.votes.accept}</span>
                                  <span className="text-red-600">👎 {place.votes.deny}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Travel Connection */}
                        {index < day.places.length - 1 && place.walkTime && (
                          <div className="flex items-center justify-center py-2">
                            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full text-xs text-gray-600">
                              {getTravelModeIcon(place.travelMode || 'walk')}
                              <span>{place.walkTime}</span>
                              <span>•</span>
                              <span>{place.distance}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex items-center justify-around py-2">
            {mobileNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  activeSection === item.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Fixed Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-30`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">a2b.ai</span>
              </div>
            )}
            <Button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Dashboard Section */}
            <div className="space-y-2">
              {sidebarItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-100 ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                  onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter(item.id, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  <item.icon className="w-5 h-5 text-gray-600" />
                  {!sidebarCollapsed && <span className="font-medium text-gray-700">{item.label}</span>}
                </a>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Travel Sections */}
            <div className="space-y-2">
              {travelSections.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-100 ${
                      activeSection === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter(item.id, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <item.icon className="w-5 h-5" />
                    {!sidebarCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{item.label}</span>
                        {item.hasCollapse && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowItineraryDays(!showItineraryDays);
                            }}
                            variant="ghost"
                            size="sm"
                            className="p-1"
                          >
                            {showItineraryDays ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Itinerary Days */}
                  {item.id === 'itinerary' && showItineraryDays && !sidebarCollapsed && (
                    <div className="ml-4 mt-2 space-y-1 transition-all duration-300 ease-in-out">
                      {itinerary.map((day) => (
                        <button
                          key={day.date}
                          onClick={() => scrollToSection(`day-${day.date}`)}
                          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600"
                        >
                          <div className="flex flex-col items-center text-xs">
                            <span className="font-medium text-[9px]">{day.day}</span>
                            <span className="font-bold text-xs">{day.date}</span>
                          </div>
                          <span className="text-sm">{day.month}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Divider before Itinerary Days (when collapsed) */}
            {sidebarCollapsed && <div className="border-t border-gray-200"></div>}

            {/* Itinerary Days (when collapsed) */}
            {sidebarCollapsed && (
              <div className="space-y-2">
                {itinerary.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => scrollToSection(`day-${day.date}`)}
                    className="w-full flex flex-col items-center px-2 py-3 rounded-xl transition-colors hover:bg-gray-100 text-gray-700"
                    onMouseEnter={(e) => handleMouseEnter(`day-${day.date}`, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span className="text-[9px] font-medium">{day.day}</span>
                    <span className="text-xs font-bold">{day.date}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Regenerate Itinerary Button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleRegenerateItinerary}
            variant="outline"
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-100 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter('regenerate', e)}
            onMouseLeave={handleMouseLeave}
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-700">Regenerate Itinerary</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{regenerateVotes}</span>
              </div>
            )}
          </Button>
        </div>

        {/* Trip Settings */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative">
            <Button
              onClick={() => setShowTripSettings(!showTripSettings)}
              variant="ghost"
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-100 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter('settings', e)}
              onMouseLeave={handleMouseLeave}
            >
              <Settings className="w-5 h-5 text-gray-600" />
              {!sidebarCollapsed && <span className="font-medium text-gray-700">Trip Settings</span>}
            </Button>

            {/* Settings Dropdown */}
            {showTripSettings && !sidebarCollapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                <button
                  onClick={handleCopyInviteLink}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Invite Link</span>
                </button>
                <button
                  onClick={handleDeletePlan}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-3"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Plan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Content Section (60%) */}
        <div className="w-3/5 overflow-y-auto">
          {/* Trip Overview */}
          <div ref={(el) => sectionRefs.current['overview'] = el} className="p-8">
            <div className="space-y-8">
              {/* Trip Image */}
              <div className="w-full h-64 rounded-2xl overflow-hidden bg-gray-200">
                <img
                  src="https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop"
                  alt="Paris"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Trip Header */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    {isEditingName ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={tempTripName}
                          onChange={(e) => setTempTripName(e.target.value)}
                          className="text-3xl font-bold border-none p-0 h-auto focus:ring-0"
                          onKeyPress={(e) => e.key === 'Enter' && saveTripName()}
                          autoFocus
                        />
                        <Button onClick={saveTripName} size="sm" className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button onClick={cancelEditName} size="sm" variant="outline">
                          ×
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-3xl font-bold text-gray-900">{tripName}</h1>
                        <Button
                          onClick={handleEditTripName}
                          variant="ghost"
                          size="sm"
                          className="p-2"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">$2,450</p>
                    <p className="text-sm text-gray-600">estimated budget per person</p>
                  </div>
                </div>
                
                <p className="text-lg text-gray-600 mb-6">June 15-17, 2024 • 3 Days</p>
                
                {/* Trip Members */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700 font-medium">Travelers:</span>
                  <div className="flex -space-x-2">
                    {tripMembers.map((member, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200"
                        style={{ zIndex: tripMembers.length - index }}
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{tripMembers.length} travelers</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                  <Plane className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Suggested Flight</h3>
                  <p className="text-sm text-gray-600">Air France • Direct</p>
                  <p className="text-xs text-gray-500">8h 15m</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                  <Hotel className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Suggested Hotel</h3>
                  <p className="text-sm text-gray-600">Hotel Le Marais</p>
                  <p className="text-xs text-gray-500">4.8★ • $180/night</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                  <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Activities</h3>
                  <p className="text-sm text-gray-600">8 attractions</p>
                  <p className="text-xs text-gray-500">Museums, landmarks</p>
                </div>
              </div>
            </div>
          </div>

          {/* Flights Section */}
          <div ref={(el) => sectionRefs.current['flights'] = el} className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Flight Options (Round Trip)</h2>
                <Button variant="outline" className="px-6 py-2 rounded-xl">
                  See More Flights
                </Button>
              </div>
              
              <div className="space-y-4">
                {flights.map((flight) => (
                  <div key={flight.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{flight.airline}</h3>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div>
                            <p className="font-medium">{flight.departure}</p>
                            <p className="text-xs">Departure</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-px bg-gray-300"></div>
                            <Plane className="w-4 h-4" />
                            <div className="w-8 h-px bg-gray-300"></div>
                          </div>
                          <div>
                            <p className="font-medium">{flight.arrival}</p>
                            <p className="text-xs">Arrival</p>
                          </div>
                          <div className="text-xs">
                            <p>{flight.duration}</p>
                            <p>{flight.stops}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">{flight.price}</p>
                        <Button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl">
                          Select
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hotels Section */}
          <div ref={(el) => sectionRefs.current['hotels'] = el} className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Hotel Options</h2>
                <Button variant="outline" className="px-6 py-2 rounded-xl">
                  See More Hotels
                </Button>
              </div>
              
              <div className="space-y-4">
                {hotels.map((hotel) => (
                  <div key={hotel.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex space-x-6">
                      <div className="w-48 h-32 rounded-xl overflow-hidden bg-gray-200">
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">{hotel.price}</p>
                          </div>
                        </div>
                        {renderStarRating(hotel.rating)}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {hotel.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                        <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl">
                          Select Hotel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Itinerary Section */}
          <div ref={(el) => sectionRefs.current['itinerary'] = el} className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Daily Itinerary</h2>
            
            {itinerary.map((day) => (
              <div key={day.date} ref={(el) => sectionRefs.current[`day-${day.date}`] = el} className="mb-12">
                <Button
                  onClick={() => toggleDayExpansion(day.date)}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 mb-6 text-left"
                >
                  <span className="text-xl font-bold">{day.month} - {day.day} {day.date}</span>
                  {expandedDays.includes(day.date) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
                
                {expandedDays.includes(day.date) && (
                  <div className="space-y-6">
                    {day.places.map((place, index) => (
                      <div key={place.id}>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                          <div className="flex space-x-6">
                            <div className="w-48 h-32 rounded-xl overflow-hidden bg-gray-200">
                              <img
                                src={place.image}
                                alt={place.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-semibold text-gray-900">{place.name}</h4>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleVote(place.id, 'accept')}
                                    className={`w-8 h-8 rounded-full p-0 transition-all ${
                                      place.votes?.userVote === 'accept'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-green-100 hover:bg-green-200 text-green-600'
                                    }`}
                                    onMouseEnter={(e) => handleMouseEnter(`accept-${place.id}`, e)}
                                    onMouseLeave={handleMouseLeave}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleVote(place.id, 'deny')}
                                    className={`w-8 h-8 rounded-full p-0 transition-all ${
                                      place.votes?.userVote === 'deny'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-red-100 hover:bg-red-200 text-red-600'
                                    }`}
                                    onMouseEnter={(e) => handleMouseEnter(`deny-${place.id}`, e)}
                                    onMouseLeave={handleMouseLeave}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{place.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{place.duration}</span>
                                </div>
                                {place.votes && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-green-600">👍 {place.votes.accept}</span>
                                    <span className="text-red-600">👎 {place.votes.deny}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Travel Connection */}
                        {index < day.places.length - 1 && place.walkTime && (
                          <div className="flex items-center justify-center py-4">
                            <div className="flex items-center space-x-3 bg-gray-50 px-6 py-3 rounded-full border border-gray-200">
                              <div className="w-2 h-8 border-l-2 border-dashed border-gray-300"></div>
                              <div className="flex items-center space-x-3 text-xs text-gray-600">
                                {getTravelModeIcon(place.travelMode || 'walk')}
                                <span className="font-medium">{place.walkTime}</span>
                                <span>•</span>
                                <span>{place.distance}</span>
                                <span>•</span>
                                <span className="capitalize">{place.travelMode || 'walk'}</span>
                              </div>
                              <div className="w-2 h-8 border-l-2 border-dashed border-gray-300"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Map Section (40%) */}
        <div className="w-2/5 bg-gray-100 border-l border-gray-200 fixed right-0 h-full">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Interactive Map</h3>
              <p className="text-gray-500">Map integration will be added here</p>
              <p className="text-sm text-gray-400 mt-2">Showing locations for selected day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltips */}
      {hoveredTooltip && sidebarCollapsed && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
          }}
        >
          {sidebarItems.find(item => item.id === hoveredTooltip)?.label ||
           travelSections.find(item => item.id === hoveredTooltip)?.label ||
           itinerary.find(day => `day-${day.date}` === hoveredTooltip)?.month ||
           (hoveredTooltip === 'regenerate' ? 'Regenerate Itinerary' : 'Trip Settings')}
        </div>
      )}

      {/* Vote Tooltips */}
      {hoveredTooltip && hoveredTooltip.startsWith('accept-') && (
        <div
          className="fixed z-50 bg-green-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
          }}
        >
          Vote to Accept
        </div>
      )}
      {hoveredTooltip && hoveredTooltip.startsWith('deny-') && (
        <div
          className="fixed z-50 bg-red-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
          }}
        >
          Vote to Deny
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Travel Plan</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this travel plan? This action cannot be undone. :(</p>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeletePlan}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}