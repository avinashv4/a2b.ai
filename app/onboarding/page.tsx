'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plane, ArrowRight, Check, ChevronDown } from 'lucide-react';

interface OnboardingStep {
  id: string;
  question: string;
  placeholder?: string;
  type: 'text' | 'date' | 'tel' | 'select' | 'address';
  options?: { value: string; label: string; flag: string }[];
  fields?: { id: string; placeholder: string; required: boolean }[];
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
  { 
    id: 'mobileNumber', 
    question: 'What\'s your mobile number?', 
    placeholder: 'Enter your mobile number', 
    type: 'tel' 
  },
  { 
    id: 'address', 
    question: 'What\'s your address?', 
    type: 'address',
    fields: [
      { id: 'addressLine1', placeholder: 'Street address', required: true },
      { id: 'addressLine2', placeholder: 'Apartment, suite, etc. (optional)', required: false },
      { id: 'city', placeholder: 'City', required: true },
      { id: 'state', placeholder: 'State/Province', required: true },
      { id: 'country', placeholder: 'Country', required: true },
      { id: 'postCode', placeholder: 'Postal/ZIP code', required: true },
    ]
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [addressFields, setAddressFields] = useState<Record<string, string>>({});
  const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
  const [isVisible, setIsVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    if (currentStepData.type === 'address') {
      // Load saved address fields
      const savedAddress: Record<string, string> = {};
      currentStepData.fields?.forEach(field => {
        savedAddress[field.id] = answers[field.id] || '';
      });
      setAddressFields(savedAddress);
    } else {
      setCurrentAnswer(answers[currentStepData?.id] || '');
    }
    
    setShowDropdown(false);
    return () => clearTimeout(timer);
  }, [currentStep, currentStepData?.id, answers]);

  const validateDate = (dateStr: string): boolean => {
    if (dateStr.length !== 10) return false;
    
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return false;
    
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    
    // Check if date is valid and in the past
    return inputDate.getTime() < today.getTime() && 
           inputDate.getFullYear() === year &&
           inputDate.getMonth() === month - 1 &&
           inputDate.getDate() === day;
  };

  const handleNext = () => {
    if (currentStepData.type === 'address') {
      // Validate required address fields
      const requiredFields = currentStepData.fields?.filter(field => field.required) || [];
      const hasAllRequired = requiredFields.every(field => addressFields[field.id]?.trim());
      
      if (!hasAllRequired) return;
      
      // Save all address fields
      const newAnswers = { ...answers };
      Object.entries(addressFields).forEach(([key, value]) => {
        newAnswers[key] = value;
      });
      setAnswers(newAnswers);
    } else if (currentStepData.type === 'date') {
      if (!validateDate(currentAnswer)) return;
      setAnswers(prev => ({ ...prev, [currentStepData.id]: currentAnswer }));
    } else {
      if (!currentAnswer.trim() && currentStepData.id !== 'middleName') return;
      setAnswers(prev => ({ ...prev, [currentStepData.id]: currentAnswer }));
    }

    if (isLastStep) {
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
      return;
    }

    // Transition to next step
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStepData.type !== 'address') {
      handleNext();
    }
  };

  const formatDateInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setCurrentAnswer(formatted);
  };

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setShowDropdown(false);
  };

  const getSelectedCountry = () => {
    return countryCodes.find(country => country.value === selectedCountryCode) || countryCodes[0];
  };

  const handleAddressFieldChange = (fieldId: string, value: string) => {
    setAddressFields(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const renderInput = () => {
    if (currentStepData.type === 'address') {
      return (
        <div className="space-y-4">
          {currentStepData.fields?.map((field, index) => (
            <Input
              key={field.id}
              type="text"
              placeholder={field.placeholder}
              value={addressFields[field.id] || ''}
              onChange={(e) => handleAddressFieldChange(field.id, e.target.value)}
              className="h-14 text-lg rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              autoFocus={index === 0}
            />
          ))}
        </div>
      );
    }

    if (currentStepData.type === 'tel') {
      const selectedCountry = getSelectedCountry();
      
      return (
        <div className="space-y-4">
          {/* Country Code Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full h-14 text-lg rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="font-medium">{selectedCountry.value}</span>
              <span className="text-gray-600">{selectedCountry.label}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
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
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-medium">{country.value}</span>
                    <span className="text-gray-600">{country.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Phone Number Input */}
          <Input
            type="tel"
            placeholder={currentStepData.placeholder}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-16 text-lg rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center"
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

  const canProceed = () => {
    if (currentStepData.type === 'address') {
      const requiredFields = currentStepData.fields?.filter(field => field.required) || [];
      return requiredFields.every(field => addressFields[field.id]?.trim());
    }
    
    if (currentStepData.type === 'date') {
      return validateDate(currentAnswer);
    }
    
    return currentAnswer.trim() || currentStepData.id === 'middleName';
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
                  disabled={!canProceed()}
                  className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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