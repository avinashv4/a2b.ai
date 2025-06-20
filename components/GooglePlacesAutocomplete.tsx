import React, { useEffect, useRef } from 'react';

interface GooglePlacesAutocompleteProps {
  value: string; // Note: value cannot be controlled for PlaceAutocompleteElement
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  types?: string[];
  onPlaceSelect?: (place: any) => void;
}

/**
 * Uses Google Maps PlaceAutocompleteElement web component.
 * Note: The value cannot be controlled from React. Use onChange/onPlaceSelect to get the selected value.
 */
const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value, // not used for PlaceAutocompleteElement
  onChange,
  placeholder,
  className,
  types = ['(cities)'], // not used for PlaceAutocompleteElement
  onPlaceSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<any>(null);

  useEffect(() => {
    function createAutocompleteElement() {
      if (
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        window.google.maps.places.PlaceAutocompleteElement &&
        containerRef.current
      ) {
        // Remove any previous element
        containerRef.current.innerHTML = '';
        // Create the new element
        const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
          types: ['(regions)']
        });
        if (placeholder) autocompleteElement.setAttribute('placeholder', placeholder);
        // Note: types attribute is not currently supported in the new element
        containerRef.current.appendChild(autocompleteElement);

        autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
          const place = event?.place;
          if (place) {
            // Only proceed if the place is a city, state, country, or continent
            const allowedTypes = ['locality', 'administrative_area_level_1', 'country', 'continent'];
            if (place.types?.some((type: string) => allowedTypes.includes(type))) {
              const valueToSet = place.displayName || place.name || '';
              onChange(valueToSet);
              if (onPlaceSelect) onPlaceSelect(place);
            }
          }
        });

        autocompleteElementRef.current = autocompleteElement;
      }
    }

    // Load Google Maps JS API if not already loaded
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        createAutocompleteElement();
      };
      document.head.appendChild(script);
    } else {
      createAutocompleteElement();
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [onChange, onPlaceSelect, placeholder]);

  // The new widget manages its own value, so you can't control it via React's value prop
  return <div ref={containerRef} className={className} />;
};

export default GooglePlacesAutocomplete;