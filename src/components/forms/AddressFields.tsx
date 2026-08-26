import React, { useState, useEffect, useRef } from 'react';
import { useAddressLookup, GeoapifySuggestion } from './useAddressLookup';
import { Country, State } from 'country-state-city';
import { Loader2, MapPin } from 'lucide-react';

export interface AddressData {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface AddressFieldsProps {
  value: AddressData;
  onChange: (updates: Partial<AddressData>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
  hideAddressLines?: boolean;
}

export function AddressFields({ 
  value, 
  onChange, 
  errors = {}, 
  disabled = false,
  className = '',
  hideAddressLines = false
}: AddressFieldsProps) {
  const { suggestions, setSuggestions, isLookingUp, lookupZip, autocompleteCity } = useAddressLookup();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    onChange({ 
      country: newCountry,
      state: '',
      city: '',
      postal_code: ''
    });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const newState = e.target.value;
    onChange({
      state: newState,
      city: '',
      postal_code: ''
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCity = e.target.value;
    onChange({ city: newCity });
    
    if (newCity.length >= 3) {
      const countryObj = Country.getAllCountries().find(c => c.name === value.country);
      const countryCode = countryObj ? countryObj.isoCode : '';
      autocompleteCity(newCity, countryCode, value.state);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZip = e.target.value;
    onChange({ postal_code: newZip });
    
    // Reverse lookup if they type a full-ish postal code and haven't filled city/state yet
    // Or we can just let it lookup and autofill
    if (newZip.length >= 5) {
      const countryObj = Country.getAllCountries().find(c => c.name === value.country);
      const countryCode = countryObj ? countryObj.isoCode : '';
      const results = await lookupZip(newZip, countryCode);
      if (results && results.length > 0) {
        const bestMatch = results[0].properties;
        const updates: Partial<AddressData> = {};
        
        // Auto-fill but don't overwrite if they already typed something different? 
        // Actually, autofilling when Zip is entered is usually expected to overwrite/correct.
        const bestCity = bestMatch.city || bestMatch.town || bestMatch.village || bestMatch.municipality || bestMatch.county;
        if (bestCity && !value.city) updates.city = bestCity; // only auto-fill if empty
        // We do NOT overwrite state/country from Zip anymore in the strict top-down flow
        
        if (Object.keys(updates).length > 0) {
           onChange(updates);
        }
      }
    }
  };

  const handleSuggestionClick = (suggestion: GeoapifySuggestion) => {
    const props = suggestion.properties;
    const bestCity = props.city || props.town || props.village || props.municipality || props.county;
    const updates: Partial<AddressData> = {
      city: bestCity || value.city,
    };
    
    if (props.postcode) updates.postal_code = props.postcode;
    // We do NOT overwrite state/country from City anymore in the strict top-down flow
    
    onChange(updates);
    setShowSuggestions(false);
  };

  const selectedCountryObj = Country.getAllCountries().find(c => c.name === value.country);
  const stateOptions = selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : [];
  const needsStateDropdown = stateOptions.length > 0;

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-[#312f2c]/20 bg-white text-[#312f2c] focus:outline-none focus:border-[#d1a054] focus:ring-1 focus:ring-[#d1a054] transition-all placeholder:text-[#312f2c]/30 disabled:opacity-50 disabled:bg-[#f5f0e8]";
  const labelCls = "block text-sm font-semibold text-[#312f2c] mb-1.5";
  const errCls = "text-red-500 text-xs mt-1 font-medium";

  return (
    <div className={`space-y-4 ${className}`}>
      {!hideAddressLines && (
        <>
          <div>
            <label className={labelCls}>Address Line 1 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={value.address_line1 || ''} 
              onChange={e => onChange({ address_line1: e.target.value })}
              disabled={disabled}
              className={`${inputCls} ${errors.address_line1 ? 'border-red-500' : ''}`} 
              placeholder="123 Main St"
            />
            {errors.address_line1 && <p className={errCls}>{errors.address_line1}</p>}
          </div>

          <div>
            <label className={labelCls}>Address Line 2</label>
            <input 
              type="text" 
              value={value.address_line2 || ''} 
              onChange={e => onChange({ address_line2: e.target.value })}
              disabled={disabled}
              className={inputCls} 
              placeholder="Apt, Suite, etc. (Optional)"
            />
          </div>
        </>
      )}

      {/* Country -> State -> City -> Zip flow as requested */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Country <span className="text-red-500">*</span></label>
          <select
            value={value.country || 'United States'}
            onChange={handleCountryChange}
            disabled={disabled}
            className={`${inputCls} ${errors.country ? 'border-red-500' : ''}`}
          >
            <option value="">Select a country...</option>
            {Country.getAllCountries().map(c => (
              <option key={c.isoCode} value={c.name}>{c.name}</option>
            ))}
          </select>
          {errors.country && <p className={errCls}>{errors.country}</p>}
        </div>

        <div>
          <label className={labelCls}>State / Province <span className="text-red-500">*</span></label>
          {needsStateDropdown ? (
            <select
              value={value.state || ''}
              onChange={handleStateChange}
              disabled={disabled || !value.country}
              className={`${inputCls} ${errors.state ? 'border-red-500' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">Select state...</option>
              {stateOptions.map(s => (
                <option key={s.isoCode} value={s.name}>{s.name}</option>
              ))}
            </select>
          ) : (
            <input 
              type="text" 
              value={value.state || ''} 
              onChange={handleStateChange}
              disabled={disabled || !value.country}
              className={`${inputCls} ${errors.state ? 'border-red-500' : ''} disabled:opacity-50 disabled:cursor-not-allowed`} 
            />
          )}
          {errors.state && <p className={errCls}>{errors.state}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative" ref={wrapperRef}>
          <label className={labelCls}>City <span className="text-red-500">*</span></label>
          <div className="relative">
             <input 
               type="text" 
               value={value.city || ''} 
               onChange={handleCityChange}
               onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
               disabled={disabled || !value.state}
               className={`${inputCls} ${errors.city ? 'border-red-500' : ''} disabled:opacity-50 disabled:cursor-not-allowed`} 
             />
             {isLookingUp && (
               <div className="absolute right-3 top-1/2 -translate-y-1/2">
                 <Loader2 className="w-4 h-4 text-[#d1a054] animate-spin" />
               </div>
             )}
          </div>
          {errors.city && <p className={errCls}>{errors.city}</p>}
          
          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-[#312f2c]/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left px-4 py-3 hover:bg-[#f5f0e8] transition-colors flex items-start gap-3 border-b border-[#312f2c]/5 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-[#d1a054] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#312f2c]">
                      {s.properties.city || s.properties.town || s.properties.village || s.properties.municipality || s.properties.county || s.properties.formatted}
                    </p>
                    <p className="text-xs text-[#312f2c]/60">
                      {[s.properties.state, s.properties.country, s.properties.postcode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>Zip / Postal Code <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={value.postal_code || ''} 
            onChange={handleZipChange}
            disabled={disabled || !value.city}
            className={`${inputCls} ${errors.postal_code ? 'border-red-500' : ''} disabled:opacity-50 disabled:cursor-not-allowed`} 
          />
          {errors.postal_code && <p className={errCls}>{errors.postal_code}</p>}
        </div>
      </div>
    </div>
  );
}
