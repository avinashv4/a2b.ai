'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import InteractiveMap from '@/components/InteractiveMap';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getLocationImage } from '@/lib/getLocationImage';

interface Place {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  walkTime?: string;
  distance?: string;
  travelMode?: 'walk' | 'car' | 'train' | 'metro' | 'ferry';
  type?: string;
  visitTime?: string;
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

interface ItineraryData {
  itinerary: DayItinerary[];
  flights: Flight[];
  hotels: Hotel[];
  mapLocations: any[];
}

interface TripMember {
  name: string;
  avatar: string;
}

export default function TravelPlanPage() {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [tripMembers, setTripMembers] = useState<TripMember[]>([]);
  
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
  const [tripTitle, setTripTitle] = useState('');
  const [dayExpandedStates, setDayExpandedStates] = useState<Record<string, boolean>>({});
  const [sidebarFullyOpen, setSidebarFullyOpen] = useState(true);
  const [savingTitle, setSavingTitle] = useState(false);
  const [tripImage, setTripImage] = useState<string>('https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop');
  const [destination, setDestination] = useState<string>('');

  const settingsRef = useRef<HTMLDivElement>(null);
  const mobileSettingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const groupId = searchParams.get('groupId');
    if (!groupId) {
      setError('Group ID not found.');
      setLoading(false);
      return;
    }

    const fetchOrGenerateItinerary = async () => {
      try {
        const { data: groupData, error: groupError } = await supabase
          .from('travel_groups')
          .select('itinerary, destination_display, trip_name, destination')
          .eq('group_id', groupId)
          .single();

        if (groupError) throw groupError;

        let finalItineraryData: ItineraryData | null = null;
        if (groupData?.itinerary) {
          finalItineraryData = groupData.itinerary as ItineraryData;
        } else {
          const response = await fetch('/api/generate-itinerary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId }),
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to generate itinerary.');
          }

          const result = await response.json();
          finalItineraryData = result.data;
        }
        
        setItineraryData(finalItineraryData);
        setTripTitle(groupData.trip_name || groupData.destination_display || 'Trip Plan');
        setDestination(groupData.destination_display || groupData.destination || 'Paris');

        // Initialize expanded states for days
        if (finalItineraryData?.itinerary) {
          const initialExpanded: Record<string, boolean> = {};
          finalItineraryData.itinerary.forEach((day, index) => {
            initialExpanded[day.date] = index === 0; // Expand first day by default
          });
          setDayExpandedStates(initialExpanded);
        }

        // Fetch trip image
        if (groupData.destination_display || groupData.destination) {
          const imageUrl = await getLocationImage(groupData.destination_display || groupData.destination);
          setTripImage(imageUrl);
        }

        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select('profiles!group_members_user_id_fkey(first_name, last_name, profile_picture)')
          .eq('group_id', groupId);

        if (membersError) {
          console.error('Error fetching members:', membersError);
        } else if (membersData) {
          const formattedMembers = membersData.map((m: any) => ({
            name: `${m.profiles.first_name} ${m.profiles.last_name}`,
            avatar: m.profiles.profile_picture || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
          }));
          setTripMembers(formattedMembers);
        }

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrGenerateItinerary();
  }, [searchParams]);

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
      if (isMobile || !itineraryData) return;
      
      const dayIds = itineraryData.itinerary.map(day => day.date);
      const sections = ['overview', 'flights', 'hotels', ...dayIds];
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
  }, [isMobile, itineraryData]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!sidebarCollapsed) {
      timeout = setTimeout(() => setSidebarFullyOpen(true), 300);
    } else {
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

  const handleVote = (dayIndex: number, placeId: string, voteType: 'accept' | 'deny') => {
    if (!itineraryData) return;
    const newItinerary = [...itineraryData.itinerary];
    const placeIndex = newItinerary[dayIndex].places.findIndex(p => p.id === placeId);
    if (placeIndex !== -1) {
      newItinerary[dayIndex].places[placeIndex].voted = voteType;
      setItineraryData({ ...itineraryData, itinerary: newItinerary });
    }
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
    const groupId = searchParams.get('groupId');
    navigator.clipboard.writeText(`${window.location.origin}/join/${groupId}`);
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(false);
    saveTripTitle();
  };

  const saveTripTitle = async () => {
    const groupId = searchParams.get('groupId');
    if (!groupId || savingTitle) return;
    
    setSavingTitle(true);
    try {
      const { error } = await supabase
        .from('travel_groups')
        .update({ trip_name: tripTitle })
        .eq('group_id', groupId);

      if (error) {
        console.error('Error saving trip title:', error);
      }
    } catch (error) {
      console.error('Error saving trip title:', error);
    } finally {
      setSavingTitle(false);
    }
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleEdit();
    }
  };

  const handleConfirmItinerary = () => {
    const groupId = searchParams.get('groupId');
    window.location.href = `/itinerary-confirmation?groupId=${groupId}`;
  };

  const getTravelModeIcon = (mode: string) => {
    switch (mode) {
      case 'car': return <Car className="w-3 h-3" />;
      case 'train': return <Train className="w-3 h-3" />;
      case 'ferry': return <Ship className="w-3 h-3" />;
      default: return <Navigation className="w-3 h-3" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'monument': return '🏛️';
      case 'museum': return '🏛️';
      case 'park': return '🌳';
      case 'food': return '🍽️';
      case 'shopping': return '🛍️';
      case 'photo_spot': return '📸';
      case 'historical': return '🏰';
      case 'entertainment': return '🎭';
      case 'cultural': return '🎨';
      case 'nature': return '🌿';
      default: return '📍';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'monument': return 'Monument';
      case 'museum': return 'Museum';
      case 'park': return 'Park';
      case 'food': return 'Restaurant';
      case 'shopping': return 'Shopping';
      case 'photo_spot': return 'Photo Spot';
      case 'historical': return 'Historical';
      case 'entertainment': return 'Entertainment';
      case 'cultural': return 'Cultural';
      case 'nature': return 'Nature';
      default: return 'Attraction';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-800">Generating Your Travel Plan...</h1>
          <p className="text-gray-600 mt-2">Our AI is crafting the perfect trip for you. This might take a moment.</p>
        </div>
      </div>
    );
  }

  if (error || !itineraryData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-center p-4">
        <div>
          <h1 className="text-2xl font-bold text-red-600">Oops! Something went wrong.</h1>
          <p className="text-gray-600 mt-2">{error || 'Could not load itinerary data.'}</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { itinerary, flights, hotels, mapLocations } = itineraryData;

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
        {/* Add sections for each day */}
        {itinerary.map((day) => (
          <div key={day.date} id={day.date}>
            {renderDayContent(day)}
          </div>
        ))}
      </div>
    );
  };

  const renderDayContent = (day: DayItinerary) => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{day.month}</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {day.places.map((place, index) => (
            <div key={place.id}>
              <div className="bg-gray-50 rounded-xl p-6">
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
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getTypeIcon(place.type || 'attraction')}</span>
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{place.name}</h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span className="bg-gray-200 px-2 py-1 rounded-full">{getTypeLabel(place.type || 'attraction')}</span>
                            {place.visitTime && <span>Visit at {place.visitTime}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          onClick={() => handleVote(itinerary.findIndex(d => d.date === day.date), place.id, 'accept')}
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
                          onClick={() => handleVote(itinerary.findIndex(d => d.date === day.date), place.id, 'deny')}
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
                <div className="flex items-center justify-center py-4">
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
  );

  const renderOverviewContent = () => (
    <div className="space-y-8">
      {/* Trip Image */}
      <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-gray-200">
        <img
          src={tripImage}
          alt={destination}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Trip Header */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                onBlur={handleTitleEdit}
                onKeyPress={handleTitleKeyPress}
                className="text-2xl md:text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                autoFocus
                disabled={savingTitle}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{tripTitle}</h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={savingTitle}
                >
                  {savingTitle ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Edit3 className="w-4 h-4" />
                  )}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
          <Plane className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Suggested Flight</h3>
          <p className="text-xs text-gray-600">{flights?.[0]?.airline || 'Air India'} • {flights?.[0]?.stops || 'Direct'}</p>
          <p className="text-xs text-gray-500">{flights?.[0]?.duration || '8h 15m'}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
          <Hotel className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Suggested Hotel</h3>
          <p className="text-xs text-gray-600">{hotels?.[0]?.name || 'Hotel Name'}</p>
          <p className="text-xs text-gray-500">{hotels?.[0]?.rating || 4.5}★ • {hotels?.[0]?.price || '$180/night'}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
          <MapPin className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Activities</h3>
          <p className="text-xs text-gray-600">{itinerary.flatMap(day => day.places).length} attractions</p>
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
      </div>
    </div>
  );

  const renderFlightsContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Flight Options (Round Trip)</h2>
        <Button variant="outline" className="px-4 py-2 rounded-xl text-sm">
          See More Flights
        </Button>
      </div>
      
      <div className="space-y-4">
        {(flights || []).map((flight) => (
          <div key={flight.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Hotel Options</h2>
        <Button variant="outline" className="px-4 py-2 rounded-xl text-sm">
          See More Hotels
        </Button>
      </div>
      
      <div className="space-y-4">
        {(hotels || []).map((hotel) => (
          <div key={hotel.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Daily Itinerary</h2>
      
      <div className="space-y-6">
        {itinerary.map((day, dayIndex) => (
          <div key={day.date}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleDayInMain(day.date)}
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
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
                <div className="p-6 pt-0 space-y-6">
                  {day.places.map((place, index) => (
                    <div key={place.id}>
                      <div className="bg-gray-50 rounded-xl p-6">
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
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getTypeIcon(place.type || 'attraction')}</span>
                                <div>
                                  <h4 className="text-base font-semibold text-gray-900">{place.name}</h4>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <span className="bg-gray-200 px-2 py-1 rounded-full">{getTypeLabel(place.type || 'attraction')}</span>
                                    {place.visitTime && <span>Visit at {place.visitTime}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleVote(dayIndex, place.id, 'accept')}
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
                                  onClick={() => handleVote(dayIndex, place.id, 'deny')}
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
                        <div className="flex items-center justify-center py-4">
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around">
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

            {/* Divider */}
            <div className="pt-2">
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
                      id={`sidebar-${day.date}`}
                      className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 ${
                        activeSection === day.date ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      } transition-opacity duration-300 ${sidebarFullyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      style={{ transitionDelay: `${150 + idx * 80}ms` }}
                    >
                      <div className="flex flex-col items-center text-xs min-w-[32px]">
                        <span className="font-medium leading-none text-[10px] uppercase">{day.day}</span>
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
      <div className="hidden md:block flex-1 bg-gray-100 border-l border-gray-200 sticky top-0 h-screen">
        <InteractiveMap
          locations={mapLocations}
          center={mapLocations[0] ? { lat: mapLocations[0].lat, lng: mapLocations[0].lng } : { lat: 48.8566, lng: 2.3522 }}
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
          {sidebarItems.find(item => item.id === hoveredTooltip)?.label || 
           itinerary.find(day => day.date === hoveredTooltip)?.month ||
           hoveredTooltip.charAt(0).toUpperCase() + hoveredTooltip.slice(1)}
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