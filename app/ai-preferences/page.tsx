'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plane, Check, X, ArrowLeft, Copy } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import VoiceAgentWidget from '@/components/VoiceAgentWidget';

interface User {
  id: string;
  name: string;
  avatar: string;
  completed: boolean;
}

interface MemberProfile {
  first_name: string;
  last_name: string;
  profile_picture?: string;
}

interface Member {
  user_id: string;
  profiles: MemberProfile;
}

export default function AIPreferencesPage() {
  const [userCompleted, setUserCompleted] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState<string>('');
  const [destination_display, setDestinationDisplay] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const loadGroupData = async () => {
      try {
        // Get group ID from URL params first, then localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const urlGroupId = urlParams.get('groupId');
        const storedGroupId = urlGroupId || localStorage.getItem('currentGroupId');
        
        if (!storedGroupId) {
          // Redirect to dashboard if no group ID
          window.location.href = '/dashboard';
          return;
        }

        // Update localStorage if we got groupId from URL
        if (urlGroupId) {
          localStorage.setItem('currentGroupId', urlGroupId);
        }

        setGroupId(storedGroupId);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/auth';
          return;
        }

        setCurrentUserId(user.id);

        // Load group details including destination
        const { data: groupData, error: groupError } = await supabase
          .from('travel_groups')
          .select('destination, host_id, destination_display')
          .eq('group_id', storedGroupId)
          .single();

        if (groupError) {
          console.error('Error loading group details:', groupError);
          return;
        }

        setDestination(groupData.destination);
        setDestinationDisplay(groupData.destination_display);
        setIsHost(groupData.host_id === user.id);

        // Load group members
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select(`
            user_id,
            preferences_completed_at,
            profiles(
              first_name,
              last_name,
              profile_picture
            )
          `)
          .eq('group_id', storedGroupId);

        if (membersError) {
          console.error('Error loading group members:', membersError);
          setGroupMembers([]);
          return;
        }

        const formattedMembers: User[] = (membersData || []).map((member: any) => {
          const profile = member.profiles;
          if (!profile) {
            return {
              id: member.user_id,
              name: member.user_id === user.id ? 'You' : 'Unknown User',
              avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
              completed: member.user_id === user.id ? userCompleted : Math.random() > 0.3
            };
          }
          
          return {
            id: member.user_id,
            name: member.user_id === user.id ? 'You' : `${profile.first_name} ${profile.last_name}`,
            avatar: profile.profile_picture || 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png',
            completed: member.user_id === user.id ? userCompleted : !!member.preferences_completed_at
          };
        });

        setGroupMembers(formattedMembers);
        console.log('Formatted members:', formattedMembers);
      } catch (error) {
        console.error('Error loading group data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [userCompleted]);

  const allUsersReady = groupMembers.every(user => user.completed);

  const handleConfirmPreferences = () => {
    setUserCompleted(true);
  };

  const copyInviteLink = async () => {
    try {
      const inviteLink = `${window.location.origin}/join/${groupId}`;
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleGenerateTravelPlan = async () => {
    if (!groupId) return;
    
    setGeneratingPlan(true);
    try {
      // First, determine travel dates and flight class
      const datesResponse = await fetch('/api/determine-travel-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });

      if (!datesResponse.ok) {
        throw new Error('Failed to determine travel dates');
      }

      const datesData = await datesResponse.json();
      console.log('Travel dates determined:', datesData);

      // Then generate the itinerary
      const itineraryResponse = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });

      if (!itineraryResponse.ok) {
        throw new Error('Failed to generate itinerary');
      }

      // Redirect to travel plan page
      window.location.href = `/travel-plan?groupId=${groupId}`;
    } catch (error) {
      console.error('Error generating travel plan:', error);
      alert('Failed to generate travel plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Floating Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl nav-shadow px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">a2b.ai</span>
            </Link>
            
            <Link href="/dashboard">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex h-screen pt-24">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-8 relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Share Your Travel Preferences</h1>
            <p className="text-xl text-gray-600">Tell our AI what you&apos;re looking for in this {destination_display} trip</p>
          </div>

          {/* ElevenLabs Conversational AI Widget - only render after loading */}
          {!loading && currentUserId && groupId && destination ? (
            <VoiceAgentWidget
              agentId="agent_01jxy55f0afx8aax07xahyqsy5"
              userId={currentUserId}
              groupId={groupId}
              destination={destination}
            />
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: 600 }}>
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading AI assistant...</p>
                {loading && <p className="text-sm text-gray-500 mt-2">Loading trip details...</p>}
                {!currentUserId && <p className="text-sm text-gray-500 mt-2">Getting user information...</p>}
                {!groupId && <p className="text-sm text-gray-500 mt-2">Loading group information...</p>}
                {!destination && <p className="text-sm text-gray-500 mt-2">Loading destination...</p>}
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="flex flex-col items-center space-y-6 mt-10">
            {/* Instructions */}
            <div className="text-center max-w-md">
              <p className="text-gray-600 text-sm">
                Use the AI assistant above to share your travel preferences for {destination_display}. 
                The AI will help create a personalized itinerary based on your interests.
              </p>
            </div>

            {/* Copy Invite Link */}
            <Button
              onClick={copyInviteLink}
              variant="outline"
              className="px-6 py-2 rounded-xl font-medium"
            >
              {copied ? (
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Copied!</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Copy className="w-4 h-4" />
                  <span>Copy Invite Link</span>
                </div>
              )}
            </Button>

            {/* Confirm Preferences Button */}
            <Button
              onClick={handleConfirmPreferences}
              disabled={userCompleted}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                userCompleted 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {userCompleted ? (
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5" />
                  <span>Preferences Confirmed</span>
                </div>
              ) : (
                'Confirm My Preferences'
              )}
            </Button>
          </div>
        </div>

        {/* Right Sidebar - User Status */}
        <div className="w-80 bg-white p-6 border-l border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Trip Members</h3>
          
          <div className="space-y-4">
            {groupMembers.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className={`text-sm ${user.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {user.completed ? 'Preferences shared' : 'Pending...'}
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  user.completed ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {user.completed ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* View Itinerary Buttons */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={() => {
                if (allUsersReady && isHost) {
                  window.location.href = `/travel-plan?groupId=${groupId}`;
                } else if (!isHost) {
                  // Show tooltip or message for non-hosts
                  return;
                }
              }}
              disabled={!allUsersReady || !isHost}
              title={!isHost ? "Waiting for host to generate travel plan" : ""}
              className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 relative ${
                allUsersReady && isHost
                  ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isHost ? 'Generate Travel Plan' : 'Waiting for Host'}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}