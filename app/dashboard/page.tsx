'use client';

import { useState, useRef, useEffect } from 'react';
import { Plane, Users, MapPin, Calendar, Settings, Bell, User, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import FlowingMenu from '@/components/FlowingMenu';

export default function DashboardPage() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      message: "Toby has finished mentioning their preferences for the Paris trip",
      time: "2 minutes ago",
      unread: true
    },
    {
      id: 2,
      message: "Sarah added new photos to the Tokyo itinerary",
      time: "1 hour ago",
      unread: true
    },
    {
      id: 3,
      message: "Flight prices dropped for your London trip",
      time: "3 hours ago",
      unread: false
    }
  ];

  // Sample travel plans
  const travelPlans = [
    {
      id: 1,
      destination: "Paris",
      members: [
        { name: "You", avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" },
        { name: "Sarah", avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" },
        { name: "Mike", avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" }
      ],
      additionalMembers: 4
    },
    {
      id: 2,
      destination: "Tokyo",
      members: [
        { name: "You", avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" },
        { name: "Emma", avatar: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" }
      ],
      additionalMembers: 2
    },
    {
      id: 3,
      destination: "Bali",
      members: [
        { name: "You", avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" },
        { name: "Alex", avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" },
        { name: "Lisa", avatar: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" },
        { name: "Tom", avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" }
      ],
      additionalMembers: 1
    }
  ];

  // FlowingMenu items based on travel plans
  const flowingMenuItems = travelPlans.map(plan => ({
    link: '#',
    text: plan.destination,
    members: plan.members,
    additionalMembers: plan.additionalMembers,
    image: `https://images.pexels.com/photos/${
      plan.destination === 'Paris' ? '338515' : 
      plan.destination === 'Tokyo' ? '2506923' : 
      '1320684'
    }/pexels-photo-${
      plan.destination === 'Paris' ? '338515' : 
      plan.destination === 'Tokyo' ? '2506923' : 
      '1320684'
    }.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop`
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl nav-shadow px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">a2b.ai</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {notifications.some(n => n.unread) && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                            notification.unread ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="text-sm text-gray-900 mb-1">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <Link href="/settings">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-6 h-6" />
                </button>
              </Link>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">A</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                    <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <User className="w-4 h-4" />
                        <span>Account Details</span>
                      </div>
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button 
                      onClick={() => window.location.href = '/auth'}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Log Out</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 pt-32">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Hey Avinash! Where to next?</h1>
          <p className="text-xl text-gray-600">Start planning your next trip!</p>
        </div>

        {/* Travel Plans */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Travel Plans</h2>
          
          {/* FlowingMenu Section */}
          <div className="mb-8">
              <div className="bg-gray-900 rounded-2xl overflow-hidden" style={{ height: '400px' }}>
                <FlowingMenu items={flowingMenuItems} />
              </div>
            </div>
            
          <div className="space-y-4">
            {/* Create New Travel Plan Card */}
            <Link href="/create-trip">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-gray-700">Create New Travel Plan</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}