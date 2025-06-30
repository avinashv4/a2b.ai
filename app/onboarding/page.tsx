'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plane, ArrowRight, Check, ChevronDown, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: string;
  question: string;
  placeholder?: string;
  type: 'text' | 'date' | 'tel' | 'select' | 'address' | 'image';
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
  { 
    id: 'gender', 
    question: 'What\'s your gender?', 
    type: 'select',
    options: [
      { value: 'male', label: 'Male', flag: '👨' },
      { value: 'female', label: 'Female', flag: '👩' },
      { value: 'other', label: 'Other', flag: '🧑' }
    ]
  },
  { id: 'profilePicture', question: 'Add a profile picture', type: 'image' },
  { id: 'dateOfBirth', question: 'When were you born?', placeholder: 'YYYY/MM/DD', type: 'date' },
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
      { id: 'addressLine1', placeholder: 'Door number, Apartment, suite, etc.', required: true },
      { id: 'addressLine2', placeholder: 'Street name, Locality, etc.', required: false },
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedGender, setSelectedGender] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [onboardingError, setOnboardingError] = useState('');

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

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
    } else if (currentStepData.type === 'select') {
      setSelectedGender(answers[currentStepData?.id] || '');
    } else {
      setCurrentAnswer(answers[currentStepData?.id] || '');
    }
    
    setShowDropdown(false);
    return () => clearTimeout(timer);
  }, [currentStep, currentStepData?.id, answers]);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Make it square by using the smaller dimension
        const size = Math.min(img.width, img.height);
        canvas.width = 300;
        canvas.height = 300;
        
        // Calculate crop position to center the image
        const cropX = (img.width - size) / 2;
        const cropY = (img.height - size) / 2;
        
        ctx?.drawImage(img, cropX, cropY, size, size, 0, 0, 300, 300);
        
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setProfileImage(croppedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateDate = (dateStr: string): boolean => {
    if (dateStr.length !== 10) return false;
    
    const [year, month, day] = dateStr.split('/').map(Number);
    if (!year || !month || !day) return false;
    
    // Check if year is valid (e.g., not in future and reasonable past)
    const currentYear = new Date().getFullYear();
    if (year > currentYear || year < 1900) return false;
    
    // Check if month is valid (1-12)
    if (month < 1 || month > 12) return false;
    
    // Check if day is valid for the given month and year
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;
    
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    
    // Check if date is in the past
    return inputDate.getTime() < today.getTime();
  };

  const handleNext = async () => {
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
      // If last step, merge address fields into answers before saving
      if (isLastStep) {
        await saveProfile(newAnswers);
        return;
      }
    } else if (currentStepData.type === 'image') {
      // Profile picture is optional
      if (profileImage) {
        setAnswers(prev => ({ ...prev, [currentStepData.id]: profileImage }));
      } else {
        // Set default profile image if skipped
        setAnswers(prev => ({ ...prev, [currentStepData.id]: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png' }));
      }
    } else if (currentStepData.type === 'select') {
      if (!selectedGender) return;
      setAnswers(prev => ({ ...prev, [currentStepData.id]: selectedGender }));
    } else if (currentStepData.type === 'date') {
      if (!validateDate(currentAnswer)) return;
      setAnswers(prev => ({ ...prev, [currentStepData.id]: currentAnswer }));
    } else {
      if (!currentAnswer.trim() && currentStepData.id !== 'middleName') return;
      setAnswers(prev => ({ ...prev, [currentStepData.id]: currentAnswer }));
    }

    if (isLastStep && currentStepData.type !== 'address') {
      await saveProfile(answers);
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

  const handleBack = () => {
    if (currentStep === 0) return;
    
    // Transition to previous step
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
    }, 300);
  };

  // Helper to save profile
  const saveProfile = async (profileAnswers: Record<string, string>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profileData = {
        user_id: user.id,
        first_name: profileAnswers.firstName,
        middle_name: profileAnswers.middleName,
        last_name: profileAnswers.lastName,
        gender: profileAnswers.gender,
        profile_picture: profileAnswers.profilePicture,
        date_of_birth: profileAnswers.dateOfBirth,
        mobile_number: profileAnswers.mobileNumber,
        address_line1: profileAnswers.addressLine1,
        address_line2: profileAnswers.addressLine2,
        city: profileAnswers.city,
        state: profileAnswers.state,
        country: profileAnswers.country,
        post_code: profileAnswers.postCode
      };
      const { error } = await supabase.from('profiles').upsert(profileData);
      if (error) {
        setOnboardingError('Failed to save your profile: ' + error.message);
        console.error('Supabase upsert error:', error);
        return;
      }
    }
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStepData.type !== 'address') {
      handleNext();
    }
  };

  const formatDateInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 4)}/${digits.slice(4)}`;
    } else {
      return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6, 8)}`;
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    if (formatted.length <= 10) {
      setCurrentAnswer(formatted);
    }
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
    if (currentStepData.type === 'image') {
      return (
        <div className="space-y-6 flex flex-col items-center">
          {/* Profile Picture Preview */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200">
              {profileImage ? (
                <>
                  <img 
                    src={profileImage} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setProfileImage(null)}
                    className="absolute -top-1 -right-1 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center shadow-md transition-colors"
                    title="Remove photo"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Upload Area - Fixed height to prevent layout shift */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`w-full h-[200px] border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Drop your photo here or</p>
                <label className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">
                  browse files
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">
                JPG, PNG or GIF (max 10MB)
              </p>
            </div>
          </div>

          {/* Skip Button - Only show when no profile picture */}
          {!profileImage && (
            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                className="px-8 py-2 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                onClick={handleNext}
              >
                Skip
              </Button>
            </div>
          )}
        </div>
      );
    }

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
              <span className="text-xl" style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}>{selectedCountry.flag}</span>
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
                    <span className="text-lg" style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}>{country.flag}</span>
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

    if (currentStepData.type === 'select') {
      return (
        <div className="space-y-4">
          {currentStepData.options?.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedGender(option.value)}
              className={`w-full h-16 text-lg rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-3 ${
                selectedGender === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <span className="text-2xl">{option.flag}</span>
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
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
    if (currentStepData.type === 'image') {
      return profileImage !== null;
    }
    
    if (currentStepData.type === 'select') {
      return selectedGender !== '';
    }
    
    if (currentStepData.type === 'address') {
      const requiredFields = currentStepData.fields?.filter(field => field.required) || [];
      return requiredFields.every(field => addressFields[field.id]?.trim());
    }
    
    if (currentStepData.type === 'date') {
      return validateDate(currentAnswer);
    }
    
    return currentAnswer.trim() || currentStepData.id === 'middleName';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Checking access...</div>;
  }

  // Render error if onboarding upsert fails
  if (onboardingError) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">{onboardingError}</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo - Fixed position at the top */}
      <div className="w-full pt-8 pb-12">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <Plane className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">a2b.ai</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-2xl mx-auto pb-8">
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
          <div className={`transition-all duration-300 ease-in-out ${
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
                <div className="flex justify-center space-x-4">
                  {currentStep > 0 && (
                    <Button
                      onClick={handleBack}
                      className="h-14 px-8 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 hover:scale-105"
                    >
                      Back
                    </Button>
                  )}
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
            <p className="text-sm text-red-500">
              *This information will be used for travel booking purposes if you decide to proceed further.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}