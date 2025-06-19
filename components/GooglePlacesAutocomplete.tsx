import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  types?: string[];
  onPlaceSelect?: (place: any) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  className,
  types = ['(cities)'],
  onPlaceSelect
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Keep localValue in sync with parent value if it changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        return;
      }

      // Load Google Maps API with async loading
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsLoaded(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      try {
        // Use the new PlaceAutocompleteElement if available, fallback to legacy Autocomplete
        if (window.google.maps.places.PlaceAutocompleteElement) {
          // Create the new element
          const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
            types: types,
            fields: ['place_id', 'formatted_address', 'name', 'geometry', 'address_components']
          });
          
          // Replace the input with the autocomplete element
          if (inputRef.current.parentNode) {
            inputRef.current.parentNode.replaceChild(autocompleteElement, inputRef.current);
          }
          
          autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
            const place = event.place;
            if (place) {
              let valueToSet = '';
              if (place.displayName) {
                valueToSet = place.displayName;
              } else if (place.name) {
                valueToSet = place.name;
              }
              setLocalValue(valueToSet);
              onChange(valueToSet);
              if (onPlaceSelect) {
                onPlaceSelect(place);
              }
            }
          });
          
          autocompleteRef.current = autocompleteElement;
        } else {
          // Fallback to legacy Autocomplete
          let options: any = {
            types: types,
            fields: ['place_id', 'formatted_address', 'name', 'geometry', 'address_components']
          };
          
          autocompleteRef.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            options
          );

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place) {
              let valueToSet = '';
              if (place.structured_formatting && place.structured_formatting.main_text) {
                valueToSet = place.structured_formatting.main_text;
              } else if (place.name) {
                valueToSet = place.name;
              }
              setLocalValue(valueToSet);
              onChange(valueToSet);
              if (onPlaceSelect) {
                onPlaceSelect(place);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error setting up Google Places Autocomplete:', error);
      }
    }

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange, onPlaceSelect, types]);

  // If using the new PlaceAutocompleteElement, we don't render the input
  if (isLoaded && window.google?.maps?.places?.PlaceAutocompleteElement) {
    return <div ref={inputRef} className={className} />;
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default GooglePlacesAutocomplete;