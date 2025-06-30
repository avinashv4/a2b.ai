'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plane, ArrowLeft, Check, Clock, Navigation, Car, Train, Ship, MapPin, Calendar, Users, CreditCard, FileText, Star } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import DateIcon from '@/components/DateIcon';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
}

interface DayItinerary {
  date: string;
  day: string;
  month: string;
  places: Place[];
}

interface Flight {
  id: string;
  flight_type?: string;
  airline: string;
  departure: string;
  departure_date?: string;
  arrival: string;
  arrival_date?: string;
  duration: string;
  price: string;
  stops: string;
  text_content?: string;
  departure_airport?: string;
  arrival_airport?: string;
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
}

// Helper to get the correct year for a given month and day
function getClosestYear(month: string, day: string): number {
  const now = new Date();
  const monthIndex = new Date(`${month} 1, 2000`).getMonth();
  const targetDate = new Date(now.getFullYear(), monthIndex, Number(day));
  if (targetDate < now) {
    // If the date has already passed this year, use next year
    return now.getFullYear() + 1;
  }
  return now.getFullYear();
}

export default function ItineraryConfirmationPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripTitle, setTripTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [tripMembers, setTripMembers] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const [savingPDF, setSavingPDF] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
        const groupId = searchParams.get('groupId');
    const selectedHotelParam = searchParams.get('selectedHotel');
    
    if (selectedHotelParam) {
      try {
        setSelectedHotel(JSON.parse(selectedHotelParam));
      } catch (e) {
        console.error('Error parsing selected hotel:', e);
      }
    }

        if (!groupId) {
      setError('Group ID not found.');
      setLoading(false);
          return;
        }

    const loadItineraryData = async () => {
      try {
        const { data: groupData, error: groupError } = await supabase
          .from('travel_groups')
          .select('itinerary, trip_name, destination_display, host_id, booking_url, selected_flight')
          .eq('group_id', groupId)
          .single();

        if (groupError || !groupData?.itinerary) {
          window.location.href = `/travel-plan?groupId=${groupId}`;
          return;
        }

        // Get current user and check if they're the host
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          setIsHost(user.id === groupData.host_id);
        }

        setItineraryData(groupData.itinerary);
        setTripTitle(groupData.trip_name || 'Trip Plan');
        setDestination(groupData.destination_display || 'Destination');

        // Fetch real trip members
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select(`
            profiles!group_members_user_id_fkey(first_name, last_name, profile_picture)
          `)
          .eq('group_id', groupId);

        if (!membersError && membersData) {
          const formattedMembers = membersData.map((m: any) => ({
            name: `${m.profiles.first_name} ${m.profiles.last_name}`,
            avatar: m.profiles.profile_picture || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
          }));
          setTripMembers(formattedMembers);
        }

        // Fetch winning hotel from backend
        if (groupData.itinerary?.hotels?.length) {
          const res = await fetch('/api/generate-itinerary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, action: 'aggregate_selected_hotel' })
          });
          const { winner } = await res.json();
          if (winner) {
            const hotel = groupData.itinerary.hotels.find((h: any) => h.id === winner);
            if (hotel) setSelectedHotel(hotel);
          }
        }
      } catch (error) {
        console.error('Error loading itinerary:', error);
        window.location.href = '/dashboard';
      } finally {
        setLoading(false);
      }
    };

    loadItineraryData();
  }, [searchParams]);

  // Auto-scroll animation effect
  useEffect(() => {
    if (!loading && itineraryData && !animationComplete) {
      const startAnimation = async () => {
        // Wait a bit for the page to fully render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get all animatable elements
        const elements = document.querySelectorAll('.fade-in-element');
        const totalHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;
        
        // Start from top
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        // Calculate scroll duration based on content length (minimum 3 seconds, maximum 6 seconds)
        const scrollDuration = Math.min(Math.max(3000, totalHeight / 2), 6000);
        const scrollStep = totalHeight / (scrollDuration / 50); // 50ms intervals
        
        let currentScroll = 0;
        let elementIndex = 0;
        
        const scrollInterval = setInterval(() => {
          currentScroll += scrollStep;
          window.scrollTo({ top: currentScroll, behavior: 'instant' });
          
          // Fade in elements as they come into view
          while (elementIndex < elements.length) {
            const element = elements[elementIndex];
            const elementTop = element.getBoundingClientRect().top + currentScroll;
            
            if (elementTop <= currentScroll + viewportHeight * 0.8) {
              element.classList.add('animate-fade-in');
              elementIndex++;
            } else {
              break;
            }
          }
          
          // Check if we've reached the bottom
          if (currentScroll >= totalHeight - viewportHeight) {
            clearInterval(scrollInterval);
            
            // Fade in any remaining elements
            elements.forEach(el => el.classList.add('animate-fade-in'));
            
            // Wait 2 seconds at the bottom
            setTimeout(() => {
              // Quick scroll back to top
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setAnimationComplete(true);
            }, 2000);
          }
        }, 50);
      };
      
      startAnimation();
    }
  }, [loading, itineraryData, animationComplete]);
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

  const handleProceedWithBooking = async () => {
    const groupId = searchParams.get('groupId');
    
    if (!isHost || !groupId || !currentUserId) {
      return;
    }

    setBookingInProgress(true);
    setIsProcessing(true);

    try {
      // Get group data including booking URL and selected flight
      const { data: groupData, error: groupError } = await supabase
        .from('travel_groups')
        .select('booking_url, selected_flight, host_id')
        .eq('group_id', groupId)
        .single();

      if (groupError || !groupData) {
        throw new Error('Failed to fetch group data');
      }

      // Get all group members
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
        throw new Error('Failed to fetch group members');
      }

      // Get host profile for contact details
      const { data: hostProfile, error: hostError } = await supabase
        .from('profiles')
        .select('first_name, last_name, mobile_number')
        .eq('user_id', groupData.host_id)
        .single();

      if (hostError || !hostProfile) {
        throw new Error('Failed to fetch host profile');
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
      const phoneCountryCode = 'in'; // Default to India, you might want to make this dynamic

      // Get flight option index from selected flight
      const flightOption = groupData.selected_flight?.index !== undefined 
        ? `flight-card-${groupData.selected_flight.index}`
        : 'flight-card-0';

      // Prepare booking request
      const bookingData = {
        flight_url: groupData.booking_url,
        passengers: passengers,
        flight_option: flightOption,
        headless: true,
        timeout: 45000,
        email: `${hostProfile.first_name.toLowerCase()}.${hostProfile.last_name.toLowerCase()}@example.com`, // You might want to store actual email
        phone_country_code: phoneCountryCode,
        phone_number: phoneNumber.slice(-10) // Last 10 digits
      };

      console.log('Booking request:', bookingData);

      // Make booking request
      const response = await fetch('https://c05b-2406-7400-c2-45a9-00-1004.ngrok-free.app/api/book-flight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error(`Booking API returned ${response.status}`);
      }

      const bookingResult = await response.json();
      console.log('Booking result:', bookingResult);

      if (bookingResult.success && bookingResult.final_url) {
        // Open booking page in new tab
        window.open(bookingResult.final_url, '_blank');
        
        // Show success message
        alert(`Booking completed successfully! Session ID: ${bookingResult.session_id}`);
      } else {
        throw new Error(bookingResult.message || 'Booking failed');
      }

    } catch (error) {
      console.error('Booking error:', error);
      alert(`Booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBookingInProgress(false);
      setIsProcessing(false);
    }
  };

  const handleSavePDF = async () => {
    setSavingPDF(true);
    try {
      const element = document.getElementById('itinerary-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${tripTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setSavingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading confirmation details...</p>
        </div>
      </div>
    );
  }

  if (!itineraryData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">No itinerary data found</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { itinerary, flights = [], hotels = [], budgetRange } = itineraryData;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <div className="bg-white rounded-2xl nav-shadow px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/travel-plan" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">a2b.ai</span>
            </Link>
            
            <Link href="/travel-plan">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Plan</span>
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div id="itinerary-content" className="max-w-4xl mx-auto px-6 py-8 pt-32">
        {/* Header */}
        <div className="text-center mb-8 fade-in-element opacity-0">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Itinerary Confirmed!</h1>
          <p className="text-xl text-gray-600">Ready to proceed with booking your {destination} adventure</p>
        </div>

        {/* Trip Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8 fade-in-element opacity-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{tripTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Duration</p>
                <p className="text-sm text-gray-600">
                  {itinerary?.[0]?.month} {itinerary?.[0]?.date}-{itinerary?.[itinerary.length - 1]?.date}, {itinerary?.[0] ? getClosestYear(itinerary[0].month, itinerary[0].date) : ''} • {itinerary?.length || 0} Days
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Travelers</p>
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1">
                    {tripMembers.slice(0, 3).map((member, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200"
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
                  <span className="text-sm text-gray-600">{tripMembers.length} people</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Total Cost</p>
                <p className="text-sm text-gray-600">{budgetRange || `${flights[0]?.price || '$650'} per person`}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        {flights && flights.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8 fade-in-element opacity-0">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Selected Flights</h3>
            <div className="space-y-4">
              {flights.map((flight) => (
                <div key={flight.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {flight.flight_type && <span className="text-blue-600 mr-2">{flight.flight_type}:</span>}
                          {flight.airline}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-6 text-gray-600 text-sm">
                        <div>
                          <p className="font-medium">
                            {flight.departure}
                            {flight.departure_date && <span className="ml-1">({flight.departure_date})</span>}
                          </p>
                          <p className="text-xs">
                            {flight.departure_airport ? `${flight.departure_airport} Departure` : 'Departure'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-px bg-gray-300"></div>
                          <Plane className="w-3 h-3" />
                          <div className="w-6 h-px bg-gray-300"></div>
                        </div>
                        <div>
                          <p className="font-medium">
                            {flight.arrival}
                            {flight.arrival_date && <span className="ml-1">({flight.arrival_date})</span>}
                          </p>
                          <p className="text-xs">
                            {flight.arrival_airport ? `${flight.arrival_airport} Arrival` : 'Arrival'}
                          </p>
                        </div>
                        <div className="text-xs">
                          <p>{flight.duration}</p>
                          <p>{flight.stops}</p>
                        </div>
                      </div>
                    </div>
                    {flight.price && (
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">{flight.price}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hotel Options */}
        {hotels && hotels.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8 fade-in-element opacity-0">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Hotel Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="border border-gray-200 rounded-xl p-4">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Hotel */}
        {selectedHotel && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6 fade-in-element opacity-0">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Selected Hotel</h2>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src={selectedHotel.image}
                  alt={selectedHotel.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{selectedHotel.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span>{selectedHotel.rating}</span>
                  </div>
                  <span>•</span>
                  <span className="text-blue-600 font-semibold">{selectedHotel.price}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedHotel.amenities.slice(0, 3).map((amenity, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmed Itinerary */}
        <div className="space-y-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 fade-in-element opacity-0">Confirmed Itinerary</h3>
          
          {itinerary?.map((day, idx) => (
            <div key={day.date} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 fade-in-element opacity-0">
              <div className="flex items-center space-x-3 mb-4">
                <DateIcon month={day.month} date={day.date} className="w-12 h-12 bg-blue-600 rounded-lg text-white" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Day {idx+1}</h4>
                  <p className="text-sm text-gray-600">{day.day} {day.date}, {getClosestYear(day.month, day.date)}</p>
                </div>
              </div>

              <div className="space-y-4">
                {day.places.map((place, index) => (
                  <div key={place.id}>
                    <div className="flex space-x-4">
                      <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={place.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop'}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 mb-1">{place.name}</h5>
                        <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                        {place.visitTime && (
                          <p className="text-xs text-blue-600 mb-1">📅 Visit at {place.visitTime}</p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{place.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connection line and travel info */}
                    {index < day.places.length - 1 && place.travelModes && (
                      <div className="flex items-center justify-center py-2 ml-24">
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

        {/* Booking Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 mb-8 fade-in-element opacity-0">
          <h3 className="text-xl font-bold text-gray-900 mb-4">What&apos;s Included</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Plane className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Round-trip Flights</p>
                <p className="text-sm text-gray-600">
                  {flights.length > 1 
                    ? `${flights[0]?.airline} / ${flights[1]?.airline}` 
                    : flights[0]?.airline || 'Air India'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Accommodation</p>
                <p className="text-sm text-gray-600">{selectedHotel?.name || hotels[0]?.name || 'Hotel'} (3 nights)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 fade-in-element opacity-0">
          <Button
            onClick={handleProceedWithBooking}
            disabled={isProcessing || !isHost}
            title={!isHost ? "Only host has access to book the flight" : ""}
            className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isHost 
                ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {bookingInProgress ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Booking Flight...</span>
              </div>
            ) : (
              <span>Proceed to Book Flight</span>
            )}
          </Button>
          <Button
            onClick={handleSavePDF}
            disabled={savingPDF}
            variant="outline"
            className="px-6 py-4 rounded-xl font-semibold"
          >
            {savingPDF ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Save as PDF</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}