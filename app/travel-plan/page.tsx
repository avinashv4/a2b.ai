'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Plane, 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  Navigation, 
  Car, 
  Train, 
  Ship, 
  MapPin, 
  Calendar, 
  Users, 
  CreditCard, 
  Star,
  ChevronLeft,
  ChevronRight,
  Menu,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Hotel,
  Coffee,
  Camera,
  Mountain,
  Building,
  ShoppingBag,
  Utensils,
  TreePine,
  Palette,
  Music
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import DateIcon from '@/components/DateIcon';
import InteractiveMap from '@/components/InteractiveMap';

interface Place {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  walkTime?: string;
  distance?: string;
  travelMode?: 'walk' | 'car' | 'train' | 'metro' | 'ferry';
  travelModes?: Record<string, { duration: string; distance: string }>;
  type?: string;
  visitTime?: string;
  coordinates?: {
    lat: number;
    lng: number;
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
  index?: number;
  text_content?: string;
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
  budgetRange?: string;
  mapLocations?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    day?: string;
    type?: string;
    visitTime?: string;
    duration?: string;
  }>;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  voted: boolean;
}

// Helper to get the correct year for a given month and day
function getClosestYear(month: string, day: string): number {
  const now = new Date();
  const monthIndex = new Date(`${month} 1, 2000`).getMonth();
  const targetDate = new Date(now.getFullYear(), monthIndex, Number(day));
  if (targetDate < now) {
    return now.getFullYear() + 1;
  }
  return now.getFullYear();
}

export default function TravelPlanPage() {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tripTitle, setTripTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 'accept' | 'reject'>>({});
  const [allPlacesVoted, setAllPlacesVoted] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateVotes, setRegenerateVotes] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [hotelVotes, setHotelVotes] = useState<Record<string, number>>({});
  const [confirming, setConfirming] = useState(false);
  const [confirmVotes, setConfirmVotes] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [animatedElements, setAnimatedElements] = useState<Set<string>>(new Set());
  
  const searchParams = useSearchParams();
  const mapRef = useRef<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const groupId = searchParams.get('groupId');

  // Scroll animation setup
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const elementId = entry.target.getAttribute('data-animate-id');
          if (elementId) {
            setAnimatedElements(prev => new Set([...prev, elementId]));
            entry.target.classList.add('animate-fade-in-up');
          }
        }
      });
    }, observerOptions);

    // Observe all animatable elements
    const elements = document.querySelectorAll('[data-animate-id]');
    elements.forEach(el => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [itineraryData]);

  // Re-observe elements when itinerary data changes
  useEffect(() => {
    if (itineraryData && observerRef.current) {
      setTimeout(() => {
        const elements = document.querySelectorAll('[data-animate-id]');
        elements.forEach(el => observerRef.current?.observe(el));
      }, 100);
    }
  }, [itineraryData]);

  useEffect(() => {
    if (!groupId) {
      setError('Group ID not found');
      setLoading(false);
      return;
    }

    const loadItineraryData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/auth';
          return;
        }

        setCurrentUserId(user.id);

        const { data: groupData, error: groupError } = await supabase
          .from('travel_groups')
          .select('itinerary, trip_name, destination_display')
          .eq('group_id', groupId)
          .single();

        if (groupError || !groupData?.itinerary) {
          setError('No itinerary found for this group');
          setLoading(false);
          return;
        }

        setItineraryData(groupData.itinerary);
        setTripTitle(groupData.trip_name || 'Trip Plan');
        setDestination(groupData.destination_display || 'Destination');

        // Load group members
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select(`
            user_id,
            place_votes,
            regenerate_vote,
            selected_hotel,
            confirm_itinerary_vote,
            profiles!group_members_user_id_fkey(first_name, last_name, profile_picture)
          `)
          .eq('group_id', groupId);

        if (!membersError && membersData) {
          const formattedMembers: User[] = membersData.map((member: any) => ({
            id: member.user_id,
            name: member.user_id === user.id ? 'You' : `${member.profiles.first_name} ${member.profiles.last_name}`,
            avatar: member.profiles.profile_picture || 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png',
            voted: member.user_id === user.id ? allPlacesVoted : !!member.place_votes && Object.keys(member.place_votes).length > 0
          }));

          setGroupMembers(formattedMembers);
          setTotalMembers(formattedMembers.length);

          // Set current user's votes
          const currentUserMember = membersData.find(m => m.user_id === user.id);
          if (currentUserMember?.place_votes) {
            setUserVotes(currentUserMember.place_votes);
            
            // Check if user has voted on all places
            const totalPlaces = groupData.itinerary.itinerary.reduce((total: number, day: any) => {
              return total + day.places.length;
            }, 0);
            
            const votedPlacesCount = Object.keys(currentUserMember.place_votes).length;
            setAllPlacesVoted(votedPlacesCount >= totalPlaces);
          }

          // Count regenerate votes
          const regenerateCount = membersData.filter(m => m.regenerate_vote).length;
          setRegenerateVotes(regenerateCount);

          // Count confirm votes
          const confirmCount = membersData.filter(m => m.confirm_itinerary_vote).length;
          setConfirmVotes(confirmCount);

          // Count hotel votes
          const hotelVoteCounts: Record<string, number> = {};
          membersData.forEach(member => {
            if (member.selected_hotel) {
              hotelVoteCounts[member.selected_hotel] = (hotelVoteCounts[member.selected_hotel] || 0) + 1;
            }
          });
          setHotelVotes(hotelVoteCounts);

          // Set current user's selected hotel
          if (currentUserMember?.selected_hotel) {
            setSelectedHotel(currentUserMember.selected_hotel);
          }
        }
      } catch (error) {
        console.error('Error loading itinerary:', error);
        setError('Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    };

    loadItineraryData();
  }, [groupId]);

  const handlePlaceVote = async (placeId: string, vote: 'accept' | 'reject') => {
    if (!currentUserId || !groupId) return;

    try {
      const response = await fetch('/api/vote-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          userId: currentUserId,
          placeId,
          vote
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserVotes(prev => ({ ...prev, [placeId]: vote }));
        setAllPlacesVoted(data.allPlacesVoted);
      }
    } catch (error) {
      console.error('Error voting on place:', error);
    }
  };

  const handleRegenerateItinerary = async () => {
    if (!currentUserId || !groupId) return;

    setRegenerating(true);
    try {
      const response = await fetch('/api/regenerate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          userId: currentUserId,
          placeVotes: userVotes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRegenerateVotes(data.regenerateVotes);
        
        if (data.regenerated) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error regenerating itinerary:', error);
    } finally {
      setRegenerating(false);
    }
  };

  const handleHotelSelect = async (hotelId: string) => {
    if (!currentUserId || !groupId) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ selected_hotel: hotelId })
        .eq('group_id', groupId)
        .eq('user_id', currentUserId);

      if (!error) {
        setSelectedHotel(hotelId);
        setHotelVotes(prev => ({
          ...prev,
          [hotelId]: (prev[hotelId] || 0) + (selectedHotel ? 0 : 1),
          ...(selectedHotel && selectedHotel !== hotelId ? { [selectedHotel]: Math.max(0, (prev[selectedHotel] || 1) - 1) } : {})
        }));
      }
    } catch (error) {
      console.error('Error selecting hotel:', error);
    }
  };

  const handleConfirmItinerary = async () => {
    if (!currentUserId || !groupId) return;

    setConfirming(true);
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ confirm_itinerary_vote: true })
        .eq('group_id', groupId)
        .eq('user_id', currentUserId);

      if (!error) {
        setConfirmVotes(prev => prev + 1);
        
        // Check if all members have confirmed
        if (confirmVotes + 1 >= totalMembers) {
          // Redirect to confirmation page
          window.location.href = `/itinerary-confirmation?groupId=${groupId}`;
        }
      }
    } catch (error) {
      console.error('Error confirming itinerary:', error);
    } finally {
      setConfirming(false);
    }
  };

  const getTravelModeIcon = (mode: string) => {
    switch (mode) {
      case 'walking': return <span title="Walk">🚶</span>;
      case 'bicycling': return <span title="Bike">🚴</span>;
      case 'driving': return <span title="Car">🚗</span>;
      case 'transit': return <span title="Transit">🚆</span>;
      case 'car': return <Car className="w-3 h-3" />;
      case 'train': return <Train className="w-3 h-3" />;
      case 'ferry': return <Ship className="w-3 h-3" />;
      default: return <Navigation className="w-3 h-3" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'monument': return <Building className="w-4 h-4 text-gray-600" />;
      case 'museum': return <Building className="w-4 h-4 text-gray-600" />;
      case 'park': return <TreePine className="w-4 h-4 text-green-600" />;
      case 'food': return <Utensils className="w-4 h-4 text-orange-600" />;
      case 'shopping': return <ShoppingBag className="w-4 h-4 text-purple-600" />;
      case 'photo_spot': return <Camera className="w-4 h-4 text-blue-600" />;
      case 'historical': return <Building className="w-4 h-4 text-amber-600" />;
      case 'entertainment': return <Music className="w-4 h-4 text-pink-600" />;
      case 'cultural': return <Palette className="w-4 h-4 text-indigo-600" />;
      case 'nature': return <Mountain className="w-4 h-4 text-green-600" />;
      default: return <MapPin className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleMapLocationClick = (location: any) => {
    if (mapRef.current) {
      mapRef.current.centerMapAt(location.lat, location.lng);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading travel plan...</p>
        </div>
      </div>
    );
  }

  if (error || !itineraryData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'No itinerary found'}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { itinerary, flights = [], hotels = [], budgetRange, mapLocations = [] } = itineraryData;
  const allMembersConfirmed = confirmVotes >= totalMembers;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <div className="bg-white rounded-2xl nav-shadow px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">a2b.ai</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </button>
              
              <Link href="/dashboard">
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-screen pt-24">
        {/* Collapsible Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out relative`}>
          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-600" />
            )}
          </button>

          <div className="p-6 h-full overflow-y-auto">
            {!sidebarCollapsed ? (
              <>
                {/* Trip Info */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{tripTitle}</h2>
                  <p className="text-sm text-gray-600">{destination}</p>
                  {budgetRange && (
                    <p className="text-sm text-blue-600 mt-1">Budget: {budgetRange}</p>
                  )}
                </div>

                {/* Group Members */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Group Members</h3>
                  <div className="space-y-3">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className={`text-xs ${member.voted ? 'text-green-600' : 'text-gray-500'}`}>
                            {member.voted ? 'Voted' : 'Pending'}
                          </p>
                        </div>
                        <div className={`w-4 h-4 rounded-full ${member.voted ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Interactive Map</h3>
                  <div className="h-48 rounded-lg overflow-hidden">
                    <InteractiveMap
                      ref={mapRef}
                      locations={mapLocations}
                      center={mapLocations.length > 0 ? { lat: mapLocations[0].lat, lng: mapLocations[0].lng } : undefined}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {allPlacesVoted && (
                    <Button
                      onClick={handleRegenerateItinerary}
                      disabled={regenerating}
                      variant="outline"
                      className="w-full"
                    >
                      {regenerating ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Regenerating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <RotateCcw className="w-4 h-4" />
                          <span>Regenerate ({regenerateVotes}/{totalMembers})</span>
                        </div>
                      )}
                    </Button>
                  )}

                  <Button
                    onClick={handleConfirmItinerary}
                    disabled={confirming || !allPlacesVoted}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {confirming ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Confirming...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4" />
                        <span>Confirm ({confirmVotes}/{totalMembers})</span>
                      </div>
                    )}
                  </Button>

                  {allMembersConfirmed && (
                    <Link href={`/itinerary-confirmation?groupId=${groupId}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        View Final Itinerary
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            ) : (
              /* Collapsed Sidebar Icons */
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div 
              className="text-center mb-8 opacity-0 translate-y-8 transition-all duration-700 ease-out"
              data-animate-id="header"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tripTitle}</h1>
              <p className="text-xl text-gray-600">Your personalized {destination} adventure</p>
            </div>

            {/* Flight Details */}
            {flights && flights.length > 0 && (
              <div 
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8 opacity-0 translate-y-8 transition-all duration-700 ease-out"
                data-animate-id="flights"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Selected Flight</h3>
                <div className="space-y-4">
                  {flights.map((flight) => (
                    <div key={flight.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{flight.airline}</h4>
                            {flight.index !== undefined && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Option {flight.index + 1}
                              </span>
                            )}
                          </div>
                          {flight.text_content ? (
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              <p className="font-mono text-xs">{flight.text_content}</p>
                            </div>
                          ) : (
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
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">{flight.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotel Selection */}
            {hotels && hotels.length > 0 && (
              <div 
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8 opacity-0 translate-y-8 transition-all duration-700 ease-out"
                data-animate-id="hotels"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Choose Your Hotel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotels.map((hotel) => (
                    <div 
                      key={hotel.id} 
                      className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        selectedHotel === hotel.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleHotelSelect(hotel.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          <img
                            src={hotel.image}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{hotel.name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                              <span>{hotel.rating}</span>
                            </div>
                            <span>•</span>
                            <span className="text-blue-600 font-semibold">{hotel.price}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {hotel.amenities.slice(0, 2).map((amenity, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                {amenity}
                              </span>
                            ))}
                          </div>
                          {hotelVotes[hotel.id] > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-green-600 font-medium">
                                {hotelVotes[hotel.id]} vote{hotelVotes[hotel.id] !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                        {selectedHotel === hotel.id && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Itinerary */}
            <div className="space-y-6">
              <h3 
                className="text-xl font-bold text-gray-900 opacity-0 translate-y-8 transition-all duration-700 ease-out"
                data-animate-id="itinerary-title"
              >
                Daily Itinerary
              </h3>
              
              {itinerary?.map((day, idx) => (
                <div 
                  key={day.date} 
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 opacity-0 translate-y-8 transition-all duration-700 ease-out"
                  data-animate-id={`day-${idx}`}
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <DateIcon month={day.month} date={day.date} className="w-12 h-12 bg-blue-600 rounded-lg text-white" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Day {idx + 1}</h4>
                      <p className="text-sm text-gray-600">{day.day} {day.date}, {getClosestYear(day.month, day.date)}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {day.places.map((place, index) => (
                      <div key={place.id}>
                        <div className="flex space-x-4">
                          <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <img
                              src={place.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop'}
                              alt={place.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  {getTypeIcon(place.type || 'attraction')}
                                  <h5 className="font-semibold text-gray-900">{place.name}</h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                                {place.visitTime && (
                                  <p className="text-xs text-blue-600 mb-1">📅 Visit at {place.visitTime}</p>
                                )}
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{place.duration}</span>
                                  </div>
                                  {place.coordinates && (
                                    <button
                                      onClick={() => handleMapLocationClick(place.coordinates)}
                                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                                    >
                                      <MapPin className="w-3 h-3" />
                                      <span>View on map</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Voting buttons */}
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => handlePlaceVote(place.id, 'accept')}
                                  className={`p-2 rounded-lg transition-colors ${
                                    userVotes[place.id] === 'accept'
                                      ? 'bg-green-100 text-green-600'
                                      : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                                  }`}
                                  title="Accept this place"
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handlePlaceVote(place.id, 'reject')}
                                  className={`p-2 rounded-lg transition-colors ${
                                    userVotes[place.id] === 'reject'
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                  }`}
                                  title="Reject this place"
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Connection line and travel info */}
                        {index < day.places.length - 1 && place.travelModes && (
                          <div className="flex items-center justify-center py-4 ml-28">
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                              <div className="w-1 h-4 border-l border-dashed border-gray-400"></div>
                              <div className="flex items-center space-x-1 text-xs text-gray-600">
                                {Object.entries(place.travelModes).map(([mode, info]) =>
                                  info ? (
                                    <span key={mode} className="flex items-center gap-1">
                                      {getTravelModeIcon(mode)}
                                      <span>{info.duration}</span>
                                      <span>•</span>
                                      <span>{info.distance}</span>
                                    </span>
                                  ) : null
                                )}
                              </div>
                              <div className="w-1 h-4 border-l border-dashed border-gray-400"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Voting Progress */}
            <div 
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mt-8 opacity-0 translate-y-8 transition-all duration-700 ease-out"
              data-animate-id="voting-progress"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Progress</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Places voted on</span>
                  <span>{Object.keys(userVotes).length} / {itinerary?.reduce((total, day) => total + day.places.length, 0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(Object.keys(userVotes).length / (itinerary?.reduce((total, day) => total + day.places.length, 0) || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
                {allPlacesVoted && (
                  <p className="text-green-600 text-sm font-medium">✓ You've voted on all places!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}