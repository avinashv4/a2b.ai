'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plane, Mic, Phone, Check, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useConversation } from '@elevenlabs/react';

interface User {
  id: string;
  name: string;
  avatar: string;
  completed: boolean;
}

export default function AIPreferencesPage() {
  const [userCompleted, setUserCompleted] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const conversation = useConversation({
    onConnect: () => console.log('Connected to ElevenLabs AI'),
    onDisconnect: () => console.log('Disconnected from ElevenLabs AI'),
    onMessage: (message) => console.log('AI Message:', message),
    onError: (error) => console.error('ElevenLabs Error:', error),
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: 'agent_01jxy55f0afx8aax07xahyqsy5',
      });

    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  useEffect(() => {
    const loadGroupData = async () => {
      try {
        // Get group ID from localStorage or URL params
        const storedGroupId = localStorage.getItem('currentGroupId');
        if (!storedGroupId) {
          // Redirect to dashboard if no group ID
          window.location.href = '/dashboard';
          return;
        }

        setGroupId(storedGroupId);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/auth';
          return;
        }

        // Load group members
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select(`
            user_id,
            profiles!group_members_user_id_fkey(
              first_name,
              last_name,
              profile_picture
            )
          `)
          .eq('group_id', storedGroupId);

        if (membersError) {
          console.error('Error loading group members:', membersError);
          return;
        }

        const formattedMembers: User[] = membersData.map(member => ({
          id: member.user_id,
          name: member.user_id === user.id ? 'You' : `${member.profiles.first_name} ${member.profiles.last_name}`,
          avatar: member.profiles.profile_picture || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
          completed: member.user_id === user.id ? userCompleted : Math.random() > 0.3 // Random for demo
        }));

        setGroupMembers(formattedMembers);
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
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Share Your Travel Preferences</h1>
            <p className="text-xl text-gray-600">Tell our AI what you&apos;re looking for in this Paris trip</p>
          </div>

          {/* Main Interface Container */}
          <div className="relative w-[600px] h-[600px] flex items-center justify-center">
            {/* AI Conversation Interface */}
            <div className="w-80 h-80 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative overflow-hidden border-4 border-white shadow-2xl">
              {/* Animated Background */}
              <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
                conversation.status === 'connected' 
                  ? 'from-green-400 to-blue-500 animate-pulse' 
                  : 'from-blue-100 to-blue-200'
              }`} />
              
              {/* Audio Visualizer Effect */}
              {conversation.status === 'connected' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 bg-white rounded-full animate-pulse"
                        style={{
                          height: `${20 + Math.random() * 40}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.8s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Voice Control Button */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-4">
                  {conversation.status === 'connected' ? (
                    <Button
                      onClick={stopConversation}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      <Phone className="w-6 h-6" />
                    </Button>
                  ) : (
                    <Button
                      onClick={startConversation}
                      disabled={conversation.status === 'connecting'}
                      className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {conversation.status === 'connecting' ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Mic className="w-5 h-5" />
                          <span>Talk to AI</span>
                        </div>
                      )}
                    </Button>
                  )}
                  
                  {/* Status Indicator */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                      Status: {conversation.status === 'connected' ? 'Connected' : 
                               conversation.status === 'connecting' ? 'Connecting...' : 'Ready'}
                    </p>
                    {conversation.status === 'connected' && (
                      <p className="text-xs text-gray-600 mt-1">
                        AI is {conversation.isSpeaking ? 'speaking' : 'listening'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-col items-center space-y-6 mt-10">
            {/* Instructions */}
            <div className="text-center max-w-md">
              <p className="text-gray-600 text-sm">
                Click "Talk to AI" to start a voice conversation about your travel preferences. 
                The AI will ask you questions to understand what you're looking for in this trip.
              </p>
            </div>

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
                if (allUsersReady) {
                  window.location.href = `/travel-plan?groupId=${groupId}`;
                }
              }}
              disabled={!allUsersReady}
              className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                allUsersReady 
                  ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              View Travel Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}