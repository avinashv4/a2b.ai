'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plane, ArrowRight, Copy, Check } from 'lucide-react';

export default function CreateTripPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [destination, setDestination] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const steps = [
    { id: 'destination', question: 'Where would you like to go?' },
    { id: 'invite', question: 'Invite your travel buddies' }
  ];

  const currentStepData = steps[currentStep];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Generate invite link when moving to invite step
    if (currentStep === 1 && !inviteLink) {
      const randomId = Math.random().toString(36).substring(2, 15);
      setInviteLink(`a2b.ai/join/${randomId}`);
    }

    return () => clearTimeout(timer);
  }, [currentStep, inviteLink]);

  const handleNext = () => {
    if (currentStep === 0) {
      if (!destination.trim()) return;
      
      // Transition to next step
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(1);
        setTimeout(() => {
          setIsVisible(true);
        }, 50);
      }, 300);
    } else {
      // Complete trip creation
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep === 0) {
      handleNext();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <Input
            type="text"
            placeholder="Enter destination (e.g., Paris, Tokyo, New York)"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-16 text-lg rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center"
            autoFocus
          />

          <div className="flex justify-center">
            <Button
              onClick={handleNext}
              disabled={!destination.trim()}
              className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              value={inviteLink}
              readOnly
              className="h-16 text-lg rounded-xl border-gray-300 bg-gray-50 text-center pr-16"
            />
            <button
              onClick={copyToClipboard}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <p className="text-center text-gray-600">
            Share this link with your friends to invite them to your {destination} trip
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleNext}
            className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
          >
            <Check className="w-5 h-5 mr-2" />
            Complete Trip Setup
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <Plane className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">a2b.ai</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-500">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className={`transition-all duration-300 ease-in-out transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-white rounded-3xl card-shadow p-8 md:p-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {currentStepData?.question}
              </h1>
            </div>

            {renderStepContent()}
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className={`text-center mt-6 transition-all duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}