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
  RefreshCw,
  Edit3,
  Car,
  Train,
  Ship,
  FileText,
  Save,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import InteractiveMap from '@/components/InteractiveMap';
import Link from 'next/link';

interface Place {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  walkTime?: string;
  distance?: string;
  travelMode?: 'walk' | 'car' | 'train' | 'metro' | 'ferry';
  voted?: 'accept' | 'deny' | null;
}

interface DayItinerary {
  date: string;
  day: string;
  month: string;
  places: Place[];
  expanded?: boolean;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedDays, setExpandedDays] = useState<string[]>(['15']);
  const [itineraryExpanded, setItineraryExpanded] = useState(true);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [regenerateVotes, setRegenerateVotes] = useState(3);
  const [hasVotedRegenerate, setHasVotedRegenerate] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tripTitle, setTripTitle] = useState('Paris Adventure');
  const [dayExpandedStates, setDayExpandedStates] = useState<Record<string, boolean>>({
    '15': true,
    '16': false,
    '17': false
  });
  const [sidebarFullyOpen, setSidebarFullyOpen] = useState(true);

  const settingsRef = useRef<HTMLDivElement>(null);
  const mobileSettingsRef = useRef<HTMLDivElement>(null);

  // Sample location data for the map
  const mapLocations = [
    { id: 'p1', name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, day: 'Day 1' },
    { id: 'p2', name: 'Seine River Cruise', lat: 48.8566, lng: 2.3522, day: 'Day 1' },
    { id: 'p3', name: 'Louvre Museum', lat: 48.8606, lng: 2.3376, day: 'Day 1' },
    { id: 'p4', name: 'Notre-Dame Cathedral', lat: 48.8530, lng: 2.3499, day: 'Day 2' },
    { id: 'p5', name: 'Sainte-Chapelle', lat: 48.8555, lng: 2.3448, day: 'Day 2' },
    { id: 'p6', name: 'Latin Quarter', lat: 48.8503, lng: 2.3447, day: 'Day 2' },
    { id: 'p7', name: 'Montmartre & Sacré-Cœur', lat: 48.8867, lng: 2.3431, day: 'Day 3' },
    { id: 'p8', name: 'Moulin Rouge', lat: 48.8841, lng: 2.3322, day: 'Day 3' }
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (mobileSettingsRef.current && !mobileSettingsRef.current.contains(event.target as Node)) {
        setShowMobileSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isMobile) return;
      
      const sections = ['overview', 'flights', 'hotels', '15', '16', '17'];
      const scrollPosition = window.scrollY + 200;
      
      for (const section of sections) {
        const element = document.getElementById(section);
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
  }, [isMobile]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!sidebarCollapsed) {
      // Wait for the transition to finish before showing text
      timeout = setTimeout(() => setSidebarFullyOpen(true), 300);
    } else {
      // Hide text immediately when collapsing
      setSidebarFullyOpen(false);
    }
    return () => clearTimeout(timeout);
  }, [sidebarCollapsed]);

  const handleMouseEnter = (id: string, event: React.MouseEvent) => {
    setHoveredTooltip(id);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredTooltip(null);
  };

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const toggleDayInMain = (dayId: string) => {
    setDayExpandedStates(prev => ({
      ...prev,
      [dayId]: !prev[dayId]
    }));
  };

  const scrollToSection = (sectionId: string) => {
    if (isMobile) {
      setActiveSection(sectionId);
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleVote = (placeId: string, voteType: 'accept' | 'deny') => {
    // Update the place vote status
    setItinerary(prev => prev.map(day => ({
      ...day,
      places: day.places.map(place => 
        place.id === placeId ? { ...place, voted: voteType } : place
      )
    })));
  };

  const handleRegenerateVote = () => {
    if (!hasVotedRegenerate) {
      setRegenerateVotes(prev => prev + 1);
      setHasVotedRegenerate(true);
    }
  };

  const handleDeletePlan = () => {
    window.location.href = '/dashboard';
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText('a2b.ai/join/abc123');
    // You could add a toast notification here
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleEdit();
    }
  };

  const handleConfirmItinerary = () => {
    // Redirect to confirmation page
    window.location.href = '/itinerary-confirmation';
  };

  const handleSavePDF = () => {
    // Generate PDF with trip details
    console.log('Generating PDF...');
  };

  const getTravelModeIcon = (mode: string) => {
    switch (mode) {
      case 'car': return <Car className="w-3 h-3" />;
      case 'train': return <Train className="w-3 h-3" />;
      case 'ferry': return <Ship className="w-3 h-3" />;
      default: return <Navigation className="w-3 h-3" />;
    }
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

  const [itinerary, setItinerary] = useState<DayItinerary[]>([
    {
      date: '15',
      day: 'Jun',
      month: 'Day 1',
      places: [
        {
          id: 'p1',
          name: 'Eiffel Tower',
          description: 'Iconic iron lattice tower and symbol of Paris. Built in 1889, this architectural marvel offers breathtaking views of the city from its three observation levels.',
          image: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '2 hours'
        },
        {
          id: 'p2',
          name: 'Seine River Cruise',
          description: 'Scenic boat ride along the historic Seine River. Enjoy panoramic views of Paris landmarks including Notre-Dame, the Louvre, and charming bridges while learning about the city\'s rich history.',
          image: 'https://images.pexels.com/photos/1530259/pexels-photo-1530259.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '1.5 hours',
          walkTime: '15 min',
          distance: '1.2 km',
          travelMode: 'walk'
        },
        {
          id: 'p3',
          name: 'Louvre Museum',
          description: 'World\'s largest art museum and historic monument. Home to thousands of works including the Mona Lisa and Venus de Milo. The palace itself is a masterpiece of French architecture.',
          image: 'https://images.pexels.com/photos/2675266/pexels-photo-2675266.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '3 hours',
          walkTime: '20 min',
          distance: '1.8 km',
          travelMode: 'walk'
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
          description: 'Medieval Catholic cathedral and architectural masterpiece. Despite recent restoration work, this Gothic wonder remains one of the finest examples of French Gothic architecture.',
          image: 'https://images.pexels.com/photos/1850619/pexels-photo-1850619.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '1.5 hours'
        },
        {
          id: 'p5',
          name: 'Sainte-Chapelle',
          description: 'Gothic chapel famous for its stunning stained glass windows. Built in the 13th century, it houses some of the most beautiful medieval stained glass in the world.',
          image: 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '1 hour',
          walkTime: '5 min',
          distance: '400 m',
          travelMode: 'walk'
        },
        {
          id: 'p6',
          name: 'Latin Quarter',
          description: 'Historic area known for its student life, lively atmosphere, and bistros. Wander through narrow medieval streets, visit the Panthéon, and enjoy authentic French cuisine.',
          image: 'https://images.pexels.com/photos/1461974/pexels-photo-1461974.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '2 hours',
          walkTime: '10 min',
          distance: '800 m',
          travelMode: 'walk'
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
          description: 'Artistic district with stunning basilica views. Explore the bohemian neighborhood where Picasso and Renoir once lived, and enjoy panoramic views from the Sacré-Cœur Basilica.',
          image: 'https://images.pexels.com/photos/1308940/pexels-photo-1308940.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '3 hours'
        },
        {
          id: 'p8',
          name: 'Moulin Rouge',
          description: 'Famous cabaret and birthplace of the can-can dance. Experience the glamour and excitement of this legendary venue with its iconic red windmill and spectacular shows.',
          image: 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '2 hours',
          walkTime: '8 min',
          distance: '650 m',
          travelMode: 'walk'
        }
      ]
    }
  ]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, isExternal: true, href: '/dashboard' },
    { id: 'overview', label: 'Trip Overview', icon: MapPin },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
  ];

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">{rating}</span>
      </div>
    );
  };

  const renderMainContent = () => {
    if (isMobile) {
      switch (activeSection) {
        case 'overview':
          return renderOverviewContent();
        case 'flights':
          return renderFlightsContent();
        case 'hotels':
          return renderHotelsContent();
        case 'itinerary':
          return renderItineraryContent();
        default:
          return renderOverviewContent();
      }
    }

    return (
      <div className="space-y-12">
        <div id="overview">{renderOverviewContent()}</div>
        <div id="flights">{renderFlightsContent()}</div>
        <div id="hotels">{renderHotelsContent()}</div>
        <div id="itinerary">{renderItineraryContent()}</div>
      </div>
    );
  };

  const renderOverviewContent = () => (
    <div className="space-y-6">
      {/* Trip Image */}
      <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-gray-200">
        <img
          src="https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop"
          alt="Paris"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Trip Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                onBlur={handleTitleEdit}
                onKeyPress={handleTitleKeyPress}
                className="text-2xl md:text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                autoFocus
              />
            ) : (
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{tripTitle}</h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-lg text-gray-600 mt-1">June 15-17, 2024 • 3 Days</p>
          </div>
          <div className="text-right">
            <p className="text-xl md:text-2xl font-bold text-blue-600">$2,450</p>
            <p className="text-sm text-gray-600">estimated budget per person</p>
          </div>
        </div>
        
        {/* Trip Members */}
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium text-sm">Travelers:</span>
          <div className="flex -space-x-2">
            {tripMembers.map((member, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200"
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
          <span className="text-gray-600 text-sm">{tripMembers.length} travelers</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 text-center">
          <Plane className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Suggested Flight</h3>
          <p className="text-xs text-gray-600">Air France • Direct</p>
          <p className="text-xs text-gray-500">8h 15m</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 text-center">
          <Hotel className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Suggested Hotel</h3>
          <p className="text-xs text-gray-600">Hotel Le Marais</p>
          <p className="text-xs text-gray-500">4.8★ • $180/night</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 text-center">
          <MapPin className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Activities</h3>
          <p className="text-xs text-gray-600">8 attractions</p>
          <p className="text-xs text-gray-500">Museums, landmarks</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleConfirmItinerary}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Confirm Itinerary
        </Button>
        <Button
          onClick={handleSavePDF}
          variant="outline"
          className="flex-1 py-3 rounded-xl font-semibold"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Travel Plan
        </Button>
      </div>
    </div>
  );

  const renderFlightsContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Flight Options (Round Trip)</h2>
        <Button variant="outline" className="px-4 py-2 rounded-xl text-sm">
          See More Flights
        </Button>
      </div>
      
      <div className="space-y-3">
        {flights.map((flight) => (
          <div key={flight.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{flight.airline}</h3>
                </div>
                <div className="flex items-center space-x-6 text-gray-600 text-sm">
                  <div>
                    <p className="font-medium">{flight.departure}</p>
                    <p className="text-xs">Departure</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-px bg-gray-300"></div>
                    <Plane className="w-3 h-3" />
                    <div className="w-6 h-px bg-gray-300"></div>
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
                <Button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-xl text-sm">
                  Select
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHotelsContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Hotel Options</h2>
        <Button variant="outline" className="px-4 py-2 rounded-xl text-sm">
          See More Hotels
        </Button>
      </div>
      
      <div className="space-y-3">
        {hotels.map((hotel) => (
          <div key={hotel.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex space-x-4">
              <div className="w-32 h-24 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{hotel.price}</p>
                  </div>
                </div>
                {renderStarRating(hotel.rating)}
                <div className="flex flex-wrap gap-1 mt-2">
                  {hotel.amenities.slice(0, 3).map((amenity, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
                <Button className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-xl text-sm">
                  Select Hotel
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderItineraryContent = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Daily Itinerary</h2>
      
      <div className="space-y-4">
        {itinerary.map((day) => (
          <div key={day.date}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleDayInMain(day.date)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{day.month}</h3>
                  <p className="text-sm text-gray-600">{day.day} {day.date}, 2024</p>
                </div>
                {dayExpandedStates[day.date] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                dayExpandedStates[day.date] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="p-4 pt-0 space-y-4">
                  {day.places.map((place, index) => (
                    <div key={place.id}>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex space-x-4">
                          <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <img
                              src={place.image}
                              alt={place.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-base font-semibold text-gray-900">{place.name}</h4>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleVote(place.id, 'accept')}
                                  className={`w-6 h-6 rounded-full p-0 transition-colors ${
                                    place.voted === 'accept' 
                                      ? 'bg-green-600 text-white' 
                                      : 'bg-green-100 hover:bg-green-200 text-green-600'
                                  }`}
                                  onMouseEnter={(e) => handleMouseEnter(`accept-${place.id}`, e)}
                                  onMouseLeave={handleMouseLeave}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleVote(place.id, 'deny')}
                                  className={`w-6 h-6 rounded-full p-0 transition-colors ${
                                    place.voted === 'deny' 
                                      ? 'bg-red-600 text-white' 
                                      : 'bg-red-100 hover:bg-red-200 text-red-600'
                                  }`}
                                  onMouseEnter={(e) => handleMouseEnter(`deny-${place.id}`, e)}
                                  onMouseLeave={handleMouseLeave}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{place.description}</p>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{place.duration}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Connection line and travel info */}
                      {index < day.places.length - 1 && place.walkTime && (
                        <div className="flex items-center justify-center py-2">
                          <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                            <div className="w-1 h-4 border-l border-dashed border-gray-400"></div>
                            <div className="flex items-center space-x-1 text-xs text-gray-600">
                              {getTravelModeIcon(place.travelMode || 'walk')}
                              <span>{place.walkTime}</span>
                              <span>•</span>
                              <span>{place.distance}</span>
                            </div>
                            <div className="w-1 h-4 border-l border-dashed border-gray-400"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">a2b.ai</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowMobileMap(!showMobileMap)}
                variant="outline"
                className="px-3 py-1 rounded-lg text-sm"
              >
                {showMobileMap ? 'Close Map' : 'View Map'}
              </Button>
              <div className="relative" ref={mobileSettingsRef}>
                <Button
                  onClick={() => setShowMobileSettings(!showMobileSettings)}
                  variant="outline"
                  className="p-2 rounded-lg"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                {showMobileSettings && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    <button
                      onClick={copyInviteLink}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Copy Invite Link</span>
                    </button>
                    <button
                      onClick={handleRegenerateVote}
                      disabled={hasVotedRegenerate}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="h-8 flex items-center">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-gray-700">Regenerate Itinerary</span>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full ml-auto">
                        {regenerateVotes}
                      </span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Delete Trip</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Map Overlay */}
        {showMobileMap && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="h-full flex flex-col">
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Map View</h3>
                <Button
                  onClick={() => setShowMobileMap(false)}
                  variant="outline"
                  className="px-3 py-1 rounded-lg text-sm"
                >
                  Close
                </Button>
              </div>
              <div className="flex-1">
                <InteractiveMap
                  locations={mapLocations}
                  center={{ lat: 48.8566, lng: 2.3522 }}
                  zoom={12}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          {renderMainContent()}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
          {[
            { id: 'overview', label: 'Overview', icon: MapPin },
            { id: 'flights', label: 'Flights', icon: Plane },
            { id: 'hotels', label: 'Hotels', icon: Hotel },
            { id: 'itinerary', label: 'Itinerary', icon: Calendar }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                activeSection === item.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-10`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className={`flex items-center space-x-2`}>
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-white" />
                </div>
                <span className={`text-lg font-bold text-gray-900 transition-opacity duration-300 ${sidebarFullyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>a2b.ai</span>
              </div>
            )}
            <Button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              if (item.isExternal) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100`}
                    onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter(item.id, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="h-8 flex items-center">
                      <item.icon className="w-4 h-4 text-gray-600 transition-opacity duration-300" />
                    </div>
                    {!sidebarCollapsed && (
                      <span className={`font-medium text-gray-700 text-sm transition-opacity duration-300 ${sidebarFullyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>{item.label}</span>
                    )}
                  </a>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 ${
                    activeSection === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                  onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter(item.id, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="h-8 flex items-center">
                    <item.icon className="w-4 h-4 transition-opacity duration-300" />
                  </div>
                  {!sidebarCollapsed && (
                    <span className={`font-medium text-sm transition-opacity duration-300 ${sidebarFullyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>{item.label}</span>
                  )}
                </button>
              );
            })}

            {/* Divider before Trip Overview */}
            <div className="my-2">
              <div className="border-t border-gray-200"></div>
            </div>

            {/* Divider before Itinerary */}
            <div className="my-2">
              <div className="border-t border-gray-200"></div>
            </div>

            {/* Itinerary Section */}
            <div>
              <button
                onClick={() => setItineraryExpanded(!itineraryExpanded)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter('itinerary', e)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex items-center space-x-2">
                  <div className="h-8 flex items-center">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  {!sidebarCollapsed && (
                    <span className={`font-medium text-gray-700 text-sm transition-opacity duration-300 ${sidebarFullyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Itinerary</span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-opacity duration-300 ${sidebarFullyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${itineraryExpanded ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Itinerary Days */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                itineraryExpanded && !sidebarCollapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="ml-4 mt-1 space-y-1">
                  {itinerary.map((day, idx) => (
                    <button
                      key={day.date}
                      onClick={() => scrollToSection(day.date)}
                      className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 ${
                        activeSection === day.date ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      } transition-opacity duration-300 ${sidebarFullyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      style={{ transitionDelay: `${150 + idx * 80}ms` }}
                    >
                      <div className="flex flex-col items-center text-xs">
                        <span className="font-medium leading-none text-xs">{day.day}</span>
                        <span className="font-bold text-sm leading-none">{day.date}</span>
                      </div>
                      <span className="font-medium text-sm">{day.month}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          {/* Regenerate Itinerary */}
          <button
            onClick={handleRegenerateVote}
            disabled={hasVotedRegenerate}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              hasVotedRegenerate ? 'bg-gray-100 text-gray-500' : 'hover:bg-gray-100 text-gray-700'
            }`}
            onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter('regenerate', e)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="h-8 flex items-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            {!sidebarCollapsed && (
              <div className={`flex items-center justify-between w-full`}>
                <span className={`font-medium text-sm transition-opacity duration-300 ${sidebarFullyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Regenerate</span>
                <span className={`text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full transition-opacity duration-300 ${sidebarFullyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>{regenerateVotes}</span>
              </div>
            )}
          </button>

          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-700`}
              onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter('settings', e)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="h-8 flex items-center">
                <Settings className="w-4 h-4" />
              </div>
              {!sidebarCollapsed && (
                <span className={`font-medium text-sm transition-opacity duration-300 ${sidebarFullyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Settings</span>
              )}
            </button>

            {/* Settings Dropdown */}
            {showSettings && !sidebarCollapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <button
                  onClick={copyInviteLink}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Copy Invite Link</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">Delete Plan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} flex items-start`} style={{ width: 'auto' }}>
        <div className="max-w-[900px] w-full px-6 pt-6 pb-6 mx-auto">
          {renderMainContent()}
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-1 bg-gray-100 border-l border-gray-200 sticky top-0 h-screen">
        <InteractiveMap
          locations={mapLocations}
          center={{ lat: 48.8566, lng: 2.3522 }}
          zoom={12}
          className="w-full h-full"
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Travel Plan</h3>
            <p className="text-gray-600 mb-4">Are you sure? :(</p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeletePlan}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltips */}
      {hoveredTooltip && sidebarCollapsed && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-2 py-1 rounded-lg text-xs pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
          }}
        >
          {hoveredTooltip === 'dashboard' && 'Dashboard'}
          {hoveredTooltip === 'overview' && 'Trip Overview'}
          {hoveredTooltip === 'flights' && 'Flights'}
          {hoveredTooltip === 'hotels' && 'Hotels'}
          {hoveredTooltip === 'itinerary' && 'Itinerary'}
          {hoveredTooltip === 'regenerate' && 'Regenerate Itinerary'}
          {hoveredTooltip === 'settings' && 'Settings'}
        </div>
      )}

      {/* Vote Tooltips */}
      {hoveredTooltip && hoveredTooltip.startsWith('accept-') && (
        <div
          className="fixed z-50 bg-green-900 text-white px-2 py-1 rounded-lg text-xs pointer-events-none"
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
          className="fixed z-50 bg-red-900 text-white px-2 py-1 rounded-lg text-xs pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
          }}
        >
          Vote to Deny
        </div>
      )}
    </div>
  );
}