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
          .select('itinerary, trip_name, destination_display')
          .eq('group_id', groupId)
          .single();

        if (groupError || !groupData?.itinerary) {
          window.location.href = `/travel-plan?groupId=${groupId}`;
          return;
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

  const handleProceedWithBooking = () => {
    setIsProcessing(true);
    // Simulate booking process
    setTimeout(() => {
      alert('Booking initiated! You will be redirected to payment.');
      setIsProcessing(false);
    }, 2000);
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Itinerary Confirmed!</h1>
          <p className="text-xl text-gray-600">Ready to proceed with booking your {destination} adventure</p>
        </div>

        {/* Trip Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Flight Options</h3>
            <div className="space-y-4">
              {flights.map((flight) => (
                <div key={flight.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{flight.airline}</h4>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hotel Options */}
        {hotels && hotels.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
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
          <h3 className="text-xl font-bold text-gray-900">Confirmed Itinerary</h3>
          
          {itinerary?.map((day, idx) => (
            <div key={day.date} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
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
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">What&apos;s Included</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Plane className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Round-trip Flights</p>
                <p className="text-sm text-gray-600">{flights[0]?.airline || 'Air India'} {flights[0]?.stops || 'Direct'}</p>
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={handleProceedWithBooking}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-lg"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
                <span>Proceed with Booking</span>
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