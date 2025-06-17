'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plane, Mic, Phone, MessageCircle, Check, X, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

// ElevenLabs Conversational AI Integration
declare global {
  interface Window {
    ElevenLabs?: {
      ConversationalAI: {
        startSession: (config: {
          agentId: string;
          onConnect?: () => void;
          onDisconnect?: () => void;
          onMessage?: (message: any) => void;
          onModeChange?: (mode: any) => void;
        }) => Promise<any>;
        endSession: () => void;
      };
    };
  }
}

interface User {
  id: string;
  name: string;
  avatar: string;
  completed: boolean;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AIPreferencesPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI travel assistant. I'm here to learn about your preferences for this trip. What kind of experience are you looking for?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [userCompleted, setUserCompleted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [elevenLabsLoaded, setElevenLabsLoaded] = useState(false);
  const [conversationSession, setConversationSession] = useState<any>(null);

  useEffect(() => {
    // Load ElevenLabs SDK
    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;
    
    script.onload = () => {
      // Poll for ElevenLabs SDK availability
      const checkSDK = setInterval(() => {
        if (window.ElevenLabs?.ConversationalAI) {
          setElevenLabsLoaded(true);
          clearInterval(checkSDK);
        }
      }, 100); // Check every 100ms
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkSDK);
        if (!window.ElevenLabs?.ConversationalAI) {
          console.error('ElevenLabs SDK failed to load within timeout period');
        }
      }, 10000);
    };
    
    script.onerror = () => {
      console.error('Failed to load ElevenLabs SDK script');
    };
    
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

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

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleVoiceToggle = () => {
    if (!elevenLabsLoaded || !window.ElevenLabs) {
      console.error('ElevenLabs SDK not loaded');
      return;
    }

    if (!isRecording) {
      // Start ElevenLabs conversation
      window.ElevenLabs.ConversationalAI.startSession({
        agentId: 'agent_01jxy55f0afx8aax07xahyqsy5',
        onConnect: () => {
          console.log('Connected to ElevenLabs AI');
          setIsRecording(true);
        },
        onDisconnect: () => {
          console.log('Disconnected from ElevenLabs AI');
          setIsRecording(false);
        },
        onMessage: (message) => {
          console.log('AI Message:', message);
          // Add AI message to chat if needed
          if (message.type === 'agent_response') {
            const aiMessage: Message = {
              id: Date.now().toString(),
              text: message.text || 'AI is processing your request...',
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
          }
        },
        onModeChange: (mode) => {
          console.log('Mode changed:', mode);
        }
      }).then((session) => {
        setConversationSession(session);
      }).catch((error) => {
        console.error('Failed to start ElevenLabs session:', error);
      });
    } else {
      // End conversation
      if (window.ElevenLabs?.ConversationalAI) {
        window.ElevenLabs.ConversationalAI.endSession();
      }
      setIsRecording(false);
      setConversationSession(null);
    }
  };

  const handleChatToggle = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowChat(!showChat);
      setIsTransitioning(false);
    }, 300);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "That sounds interesting! Can you tell me more about your budget preferences?",
        "Great choice! What type of activities do you enjoy most when traveling?",
        "I understand. Are you more interested in relaxation or adventure activities?",
        "Perfect! How important is local cuisine to your travel experience?",
        "Excellent! Do you prefer staying in city centers or more secluded areas?"
      ];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
            {/* Audio Visualizer - Fade out when showing chat */}
            <div className={`absolute inset-0 w-full h-full transition-all duration-300 ease-in-out ${
              showChat || isTransitioning ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
            } flex items-center justify-center`}>
              <div className="w-80 h-80 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative overflow-hidden">
                {/* Audio Visualizer Placeholder */}
                <Image
                  src="/image.png"
                  alt="Audio Visualizer"
                  width={320}
                  height={320}
                  className="rounded-full object-cover"
                  priority
                />
                
                {/* Voice Control Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    onClick={handleVoiceToggle}
                    disabled={!elevenLabsLoaded}
                    className={`transition-all duration-300 ease-in-out ${
                      isRecording 
                        ? 'w-16 h-16 rounded-full bg-black hover:bg-black' 
                        : 'px-8 py-4 rounded-full bg-black hover:bg-black disabled:bg-gray-400'
                    } text-white font-semibold shadow-lg hover:scale-105 disabled:cursor-not-allowed`}
                  >
                    {isRecording ? (
                      <Phone className="w-6 h-6" />
                    ) : !elevenLabsLoaded ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading AI...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Mic className="w-5 h-5" />
                        <span>Talk to AI</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {/* Chat Interface - Fade in when chat is active */}
            <div className={`absolute inset-0 w-full h-full transition-all duration-300 ease-in-out ${
              showChat && !isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            } flex items-center justify-center`}>
              <div className="bg-white rounded-3xl border border-gray-200 shadow-lg w-full h-full flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Chat with AI Assistant</h3>
                </div>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                {/* Chat Input */}
                <div className="p-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className={`flex flex-col items-center transition-all duration-300 mt-10 ${
            showChat ? 'space-y-4' : 'space-y-6'
          }`}>
            {/* Chat Toggle Button */}
            <Button
              onClick={handleChatToggle}
              variant="outline"
              className="px-6 py-3 rounded-xl border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {showChat ? 'Talk to AI instead' : 'Chat with AI instead'}
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