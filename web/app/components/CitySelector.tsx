'use client';

import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';

export interface City {
  id: string;
  name: string;
  slug: string;
}

interface CitySelectorProps {
  cities?: City[] | null;
  defaultCity?: string;
  onSelect?: (city: City | null) => void;
  placeholder?: string;
}

const EMPTY_CITIES: City[] = [];

export default function CitySelector({ cities, defaultCity, onSelect, placeholder = "Lokalita" }: CitySelectorProps) {
  // Ensure cities is always an array, handling null/undefined prop using a stable reference
  const safeCities = cities || EMPTY_CITIES;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(defaultCity || '');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [filteredCities, setFilteredCities] = useState<City[]>(safeCities);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isClient, setIsClient] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    if (defaultCity && safeCities.length > 0) {
      const found = safeCities.find(c => c.name.toLowerCase() === defaultCity.toLowerCase());
      if (found) setSelectedCity(found);
    }
  }, [defaultCity, safeCities]);

  useEffect(() => {
    // If a city is explicitly selected, show full list (for next interaction)
    if (selectedCity) {
      setFilteredCities(safeCities);
      return;
    }

    // If search term is empty/whitespace, show all cities
    if (!searchTerm.trim()) {
      setFilteredCities(safeCities);
      return;
    }

    // Otherwise filter
    setFilteredCities(
      safeCities.filter(city => 
        city.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, safeCities, selectedCity]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) && 
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // If we closed without selecting and input doesn't match a city, reset to selection or clear
        if (!selectedCity && searchTerm !== '') {
            // Optional behavior: revert to previous selection or keep text
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCity, searchTerm]);

  const handleInputFocus = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 220) // Minimum width
      });
    }
    setIsOpen(true);
  };

  const handleSelect = (city: City) => {
    setSelectedCity(city);
    setSearchTerm(city.name);
    setIsOpen(false);
    if (onSelect) onSelect(city);
  };

  const handleClear = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setSelectedCity(null);
    setSearchTerm('');
    // Explicitly reset filtered cities immediately for UX responsiveness
    setFilteredCities(safeCities);
    if (onSelect) onSelect(null);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedCity(null); // Clear selection when typing
    setIsOpen(true);
  };

  const Dropdown = (
    <div 
      ref={popoverRef}
      style={{ 
        position: 'absolute', 
        top: `${popoverPosition.top}px`, 
        left: `${popoverPosition.left}px`,
        width: `${popoverPosition.width}px`,
        zIndex: 101, 
        background: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '12px', 
        padding: '8px 0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      {filteredCities.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {filteredCities.map(city => (
            <li 
              key={city.id}
              onClick={() => handleSelect(city)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '15px',
                color: 'var(--text-main)',
                backgroundColor: selectedCity?.id === city.id ? 'var(--accent-pink)' : 'transparent',
                fontWeight: selectedCity?.id === city.id ? '700' : '400',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                 if (selectedCity?.id !== city.id) e.currentTarget.style.backgroundColor = '#f9f9f9';
              }}
              onMouseLeave={(e) => {
                 if (selectedCity?.id !== city.id) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {city.name}
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
          Nenašli sa žiadne mestá
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        style={{
            width: '100%',
            border: 'none',
            padding: '12px 0',
            outline: 'none',
            fontSize: '15px',
            background: 'transparent',
            color: 'var(--text-main)',
            fontFamily: 'var(--font-body)'
        }}
      />
      {/* Clear Button - only show if there is text or selection */}
      {(selectedCity || searchTerm) && (
        <button
          onClick={handleClear}
          type="button"
          style={{
            border: 'none',
            background: 'transparent',
            color: '#999',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '4px'
          }}
          aria-label="Zrušiť výber"
        >
          ✕
        </button>
      )}
      
      {isOpen && isClient && createPortal(Dropdown, document.body)}
    </div>
  );
}
