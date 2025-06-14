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
  Navigation2
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
  rating: number;
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
  const [expandedDays, setExpandedDays] = useState<string[]>(['day1']);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showItineraryDays, setShowItineraryDays] = useState(true);
  const [showTripSettings, setShowTripSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tripName, setTripName] = useState('Paris Adventure');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempTripName, setTempTripName] = useState(tripName);

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
      stops: 'Direct',
      rating: 4.5
    },
    {
      id: '2',
      airline: 'Delta',
      departure: '6:15 AM',
      arrival: '12:30 PM',
      duration: '9h 15m',
      price: '$580',
      stops: '1 stop',
      rating: 4.2
    },
    {
      id: '3',
      airline: 'United',
      departure: '3:20 PM',
      arrival: '9:35 PM',
      duration: '9h 15m',
      price: '$720',
      stops: 'Direct',
      rating: 4.3
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
          description: 'Iconic iron lattice tower and symbol of Paris',
          image: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '2 hours',
          votes: { accept: 3, deny: 1, userVote: null }
        },
        {
          id: 'p2',
          name: 'Seine River Cruise',
          description: 'Scenic boat ride along the historic Seine River',
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
          description: 'World\'s largest art museum and historic monument',
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
          description: 'Medieval Catholic cathedral and architectural masterpiece',
          image: 'https://images.pexels.com/photos/1850619/pexels-photo-1850619.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '1.5 hours',
          votes: { accept: 4, deny: 0, userVote: null }
        },
        {
          id: 'p5',
          name: 'Sainte-Chapelle',
          description: 'Gothic chapel famous for its stunning stained glass',
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
          description: 'Historic area known for its student life and bistros',
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
          description: 'Artistic district with stunning basilica views',
          image: 'https://images.pexels.com/photos/1308940/pexels-photo-1308940.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
          duration: '3 hours',
          votes: { accept: 4, deny: 0, userVote: null }
        },
        {
          id: 'p8',
          name: 'Moulin Rouge',
          description: 'Famous cabaret and birthplace of the can-can dance',
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

  return (
    <div className="min-h-screen bg-white flex">
      {/* Collapsible Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
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
                    <div className="ml-4 mt-2 space-y-1">
                      {itinerary.map((day) => (
                        <button
                          key={day.date}
                          onClick={() => scrollToSection(`day-${day.date}`)}
                          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600"
                        >
                          <div className="flex flex-col items-center text-xs">
                            <span className="font-medium text-[10px]">{day.day}</span>
                            <span className="font-bold text-sm">{day.date}</span>
                          </div>
                          <span className="text-sm">{day.month}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

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
                    <span className="text-[10px] font-medium">{day.day}</span>
                    <span className="text-sm font-bold">{day.date}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
      <div className="flex-1 flex">
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
                          className="text-4xl font-bold border-none p-0 h-auto focus:ring-0"
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
                        <h1 className="text-4xl font-bold text-gray-900">{tripName}</h1>
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
                    <p className="text-2xl font-bold text-blue-600">$2,450</p>
                    <p className="text-gray-600">estimated budget per person</p>
                  </div>
                </div>
                
                <p className="text-xl text-gray-600 mb-6">June 15-17, 2024 • 3 Days</p>
                
                {/* Trip Members */}
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 font-medium">Travelers:</span>
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
                  <span className="text-gray-600">{tripMembers.length} travelers</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                  <Plane className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Flight</h3>
                  <p className="text-gray-600">Air France • Direct</p>
                  <p className="text-sm text-gray-500">8h 15m</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                  <Hotel className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Hotel</h3>
                  <p className="text-gray-600">Hotel Le Marais</p>
                  <p className="text-sm text-gray-500">4.8★ • $180/night</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                  <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Activities</h3>
                  <p className="text-gray-600">8 attractions</p>
                  <p className="text-sm text-gray-500">Museums, landmarks</p>
                </div>
              </div>
            </div>
          </div>

          {/* Flights Section */}
          <div ref={(el) => sectionRefs.current['flights'] = el} className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Flight Options</h2>
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
                          <h3 className="text-xl font-semibold text-gray-900">{flight.airline}</h3>
                          {renderStarRating(flight.rating)}
                        </div>
                        <div className="flex items-center space-x-6 text-gray-600">
                          <div>
                            <p className="font-medium">{flight.departure}</p>
                            <p className="text-sm">Departure</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-px bg-gray-300"></div>
                            <Plane className="w-4 h-4" />
                            <div className="w-8 h-px bg-gray-300"></div>
                          </div>
                          <div>
                            <p className="font-medium">{flight.arrival}</p>
                            <p className="text-sm">Arrival</p>
                          </div>
                          <div className="text-sm">
                            <p>{flight.duration}</p>
                            <p>{flight.stops}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{flight.price}</p>
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
                <h2 className="text-3xl font-bold text-gray-900">Hotel Options</h2>
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
                          <h3 className="text-xl font-semibold text-gray-900">{hotel.name}</h3>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">{hotel.price}</p>
                          </div>
                        </div>
                        {renderStarRating(hotel.rating)}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {hotel.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Daily Itinerary</h2>
            
            {itinerary.map((day) => (
              <div key={day.date} ref={(el) => sectionRefs.current[`day-${day.date}`] = el} className="mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{day.month} - {day.day} {day.date}</h3>
                
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
                              <h4 className="text-xl font-semibold text-gray-900">{place.name}</h4>
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
                            <p className="text-gray-600 mb-3">{place.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
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
              </div>
            ))}
          </div>
        </div>

        {/* Map Section (40%) */}
        <div className="w-2/5 bg-gray-100 border-l border-gray-200">
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
           'Trip Settings'}
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