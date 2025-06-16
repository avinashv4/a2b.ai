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

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
      } else {
        setTimeout(checkGoogleMaps, 100);
      }
    };
    checkGoogleMaps();
  }, []);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      // Set up componentRestrictions for more accurate filtering
      let options: any = {
        types: types,
        fields: ['place_id', 'formatted_address', 'name', 'geometry', 'address_components']
      };
      if (types.includes('(countries)')) {
        options.types = ['(regions)']; // Google does not allow only countries, so we filter manually
      }
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
          } else {
            valueToSet = '';
          }
          onChange(valueToSet);
          if (onPlaceSelect) {
            onPlaceSelect(place);
          }
        }
      });
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange, onPlaceSelect, types]);

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default GooglePlacesAutocomplete;