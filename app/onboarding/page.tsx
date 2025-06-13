'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plane, ArrowRight, Check, ChevronDown } from 'lucide-react';

interface OnboardingStep {
  id: string;
  question: string;
  placeholder: string;
  type: 'text' | 'date' | 'tel' | 'select';
  options?: { value: string; label: string; flag: string }[];
}

const countryCodes = [
  { value: '+1', label: 'United States', flag: '🇺🇸' },
  { value: '+44', label: 'United Kingdom', flag: '🇬🇧' },
  { value: '+91', label: 'India', flag: '🇮🇳' },
  { value: '+86', label: 'China', flag: '🇨🇳' },
  { value: '+81', label: 'Japan', flag: '🇯🇵' },
  { value: '+49', label: 'Germany', flag: '🇩🇪' },
  { value: '+33', label: 'France', flag: '🇫🇷' },
  { value: '+39', label: 'Italy', flag: '🇮🇹' },
  { value: '+34', label: 'Spain', flag: '🇪🇸' },
  { value: '+61', label: 'Australia', flag: '🇦🇺' },
  { value: '+1', label: 'Canada', flag: '🇨🇦' },
  { value: '+55', label: 'Brazil', flag: '🇧🇷' },
  { value: '+7', label: 'Russia', flag: '🇷🇺' },
  { value: '+82', label: 'South Korea', flag: '🇰🇷' },
  { value: '+65', label: 'Singapore', flag: '🇸🇬' },
];

const onboardingSteps: OnboardingStep[] = [
  { id: 'firstName', question: 'What\'s your first name?', placeholder: 'Enter your first name', type: 'text' },
  { id: 'middleName', question: 'What\'s your middle name?', placeholder: 'Enter your middle name (optional)', type: 'text' },
  { id: 'lastName', question: 'What\'s your last name?', placeholder: 'Enter your last name', type: 'text' },
  { id: 'dateOfBirth', question: 'When were you born?', placeholder: 'DD/MM/YYYY', type: 'date' },
  { id: 'countryCode', question: 'Select your country code', placeholder: 'Choose your country', type: 'select', options: countryCodes },
  { id: 'mobileNumber', question: 'What\'s your mobile number?', placeholder: 'Enter your mobile number', type: 'tel' },
  { id: 'addressLine1', question: 'What\'s your address line 1?', placeholder: 'Enter your street address', type: 'text' },
  { id: 'addressLine2', question: 'What\'s your address line 2?', placeholder: 'Apartment, suite, etc. (optional)', type: 'text' },
  { id: 'city', question: 'What city do you live in?', placeholder: 'Enter your city', type: 'text' },
  { id: 'state', question: 'What state/province do you live in?', placeholder: 'Enter your state or province', type: 'text' },
  { id: 'country', question: 'What country do you live in?', placeholder: 'Enter your country', type: 'text' },
  { id: 'postCode', question: 'What\'s your postal code?', placeholder: 'Enter your postal/ZIP code', type: 'text' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const selectedCountryCode = answers['countryCode'] || '+1';

  useEffect(() => {
    // Initial fade in
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    setCurrentAnswer(answers[currentStepData?.id] || '');
    setShowDropdown(false);
    return () => clearTimeout(timer);
  }, [currentStep, currentStepData?.id, answers]);

  const handleNext = () => {
    if (!currentAnswer.trim() && !['middleName', 'addressLine2'].includes(currentStepData.id)) return;

    // Save current answer
    setAnswers(prev => ({
      ...prev,
      [currentStepData.id]: currentAnswer
    }));

    if (isLastStep) {
      // Complete onboarding and redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
      return;
    }

    // Start transition
    setIsTransitioning(true);
    setIsVisible(false);
    
    // After fade out, move to next step
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsTransitioning(false);
      // Fade in new question
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStepData.type !== 'select') {
      handleNext();
    }
  };

  const formatDateInput = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as DD/MM/YYYY
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentStepData.type === 'date') {
      const formatted = formatDateInput(e.target.value);
      setCurrentAnswer(formatted);
    } else {
      setCurrentAnswer(e.target.value);
    }
  };

  const handleCountrySelect = (countryCode: string) => {
    setCurrentAnswer(countryCode);
    setShowDropdown(false);
  };

  const getSelectedCountry = () => {
    return countryCodes.find(country => country.value === currentAnswer) || countryCodes[0];
  };

  const renderInput = () => {
    if (currentStepData.type === 'select') {
      const selectedCountry = getSelectedCountry();
      return (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full h-16 text-lg rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center bg-white flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">{selectedCountry.flag}</span>
            <span>{selectedCountry.value}</span>
            <span className="text-gray-600">{selectedCountry.label}</span>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
          
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
              {countryCodes.map((country) => (
                <button
                  key={`${country.value}-${country.label}`}
                  type="button"
                  onClick={() => handleCountrySelect(country.value)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="font-medium">{country.value}</span>
                  <span className="text-gray-600">{country.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (currentStepData.type === 'tel') {
      return (
        <div className="flex space-x-3">
          <div className="flex items-center bg-gray-50 rounded-xl px-4 border border-gray-300">
            <span className="text-lg font-medium text-gray-700">{selectedCountryCode}</span>
          </div>
          <Input
            type="tel"
            placeholder={currentStepData.placeholder}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 h-16 text-lg rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center"
            autoFocus
          />
        </div>
      );
    }

    return (
      <Input
        type={currentStepData.type === 'date' ? 'text' : currentStepData.type}
        placeholder={currentStepData.placeholder}
        value={currentAnswer}
        onChange={currentStepData.type === 'date' ? handleDateChange : (e) => setCurrentAnswer(e.target.value)}
        onKeyPress={handleKeyPress}
        className="h-16 text-lg rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center"
        autoFocus
        maxLength={currentStepData.type === 'date' ? 10 : undefined}
      />
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
            <span className="text-sm text-gray-500">Step {currentStep + 1} of {onboardingSteps.length}</span>
            <span className="text-sm text-gray-500">{Math.round(((currentStep + 1) / onboardingSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
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

            <div className="space-y-6">
              {renderInput()}

              <div className="flex justify-center">
                <Button
                  onClick={handleNext}
                  disabled={!currentAnswer.trim() && !['middleName', 'addressLine2'].includes(currentStepData?.id)}
                  className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className={`text-center mt-6 transition-all duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <p className="text-sm text-gray-500">
            This information will be used for travel booking purposes if you decide to proceed further.
          </p>
        </div>
      </div>
    </div>
  );
}