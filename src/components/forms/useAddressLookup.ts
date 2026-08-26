import { useState, useCallback, useRef, useEffect } from 'react';
import { apiUrl, cartFetch } from '@/lib/cart'; // using cartFetch for store api calls, or just regular fetch

export interface GeoapifySuggestion {
  properties: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    state_code?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
    formatted?: string;
  };
}

export function useAddressLookup() {
  const [suggestions, setSuggestions] = useState<GeoapifySuggestion[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to fetch
  const fetchGeo = async (endpoint: string, query: string, countrycode?: string, state?: string) => {
    try {
      setIsLookingUp(true);
      setError(null);
      let url = apiUrl(`/api/store/geo/${endpoint}?${query}`);
      if (countrycode) {
        url += `&countrycode=${encodeURIComponent(countrycode)}`;
      }
      if (state) {
        url += `&state=${encodeURIComponent(state)}`;
      }
      // Using standard fetch since this might be used in both logged-in and logged-out (checkout/registration) contexts.
      // cartFetch is fine too, but regular fetch guarantees it works without token strictness if needed.
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      return data.features || [];
    } catch (err: any) {
      console.error(`Geoapify ${endpoint} error:`, err);
      setError(err.message || 'Lookup failed');
      return [];
    } finally {
      setIsLookingUp(false);
    }
  };

  const lookupZip = useCallback(async (zip: string, countrycode?: string) => {
    if (!zip || zip.trim().length < 3) return []; // don't lookup tiny strings
    return fetchGeo('lookup', `zip=${encodeURIComponent(zip)}`, countrycode);
  }, []);

  const autocompleteCity = useCallback(async (query: string, countrycode?: string, state?: string) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const results = await fetchGeo('autocomplete', `q=${encodeURIComponent(query)}`, countrycode, state);
      setSuggestions(results);
    }, 400); // 400ms debounce
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    suggestions,
    setSuggestions,
    isLookingUp,
    error,
    lookupZip,
    autocompleteCity
  };
}
