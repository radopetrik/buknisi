'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import CitySelector, { City } from './CitySelector';
import { createClient } from '@/utils/supabase/client';

// Simple cookie helpers
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0].trim() === name ? decodeURIComponent(parts[1]) : r;
  }, '');
}

interface SearchBarProps {
  defaultCategory?: string;
  defaultCity?: string;
  defaultDate?: string;
  defaultTimeFrom?: string;
  defaultTimeTo?: string;
  popoverClassName?: string;
  numberOfMonths?: number;
  cities?: City[] | null;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'company' | 'category';
  slug: string;
  categorySlug?: string;
  citySlug?: string;
  photoUrl?: string;
}

export default function SearchBar({ defaultCategory, defaultCity, defaultDate, defaultTimeFrom, defaultTimeTo, popoverClassName, numberOfMonths = 1, cities }: SearchBarProps) {
  const [range, setRange] = useState<DateRange | undefined>(
    defaultDate ? { from: new Date(defaultDate), to: undefined } : undefined
  );
  const [timeFrom, setTimeFrom] = useState<string>(defaultTimeFrom || '');
  const [timeTo, setTimeTo] = useState<string>(defaultTimeTo || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  
  // Local state to hold city name from cookie if defaultCity is missing
  const [cookieCityName, setCookieCityName] = useState<string>('');

  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const router = useRouter();
  
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load state from cookies on mount if props are missing
  useEffect(() => {
    // 1. Restore Date
    if (!defaultDate) {
        const cDate = getCookie('bs_date');
        if (cDate) {
            setRange({ from: new Date(cDate), to: undefined });
        }
    }
    // 2. Restore Times
    if (!defaultTimeFrom) {
        const cFrom = getCookie('bs_time_from');
        if (cFrom) setTimeFrom(cFrom);
    }
    if (!defaultTimeTo) {
        const cTo = getCookie('bs_time_to');
        if (cTo) setTimeTo(cTo);
    }
    // 3. Restore City Name (for CitySelector)
    if (!defaultCity) {
        const cCityName = getCookie('bs_city_name');
        if (cCityName) setCookieCityName(cCityName);
    }
  }, [defaultDate, defaultTimeFrom, defaultTimeTo, defaultCity]);

  const inputRef = useRef<HTMLInputElement>(null);

  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // Autocomplete state
  const [query, setQuery] = useState(defaultCategory || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0, width: 0 });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // State to ensure portal is only used on the client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (defaultCategory) {
      setQuery(defaultCategory);
    }
  }, [defaultCategory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      const { data: companies } = await supabase
        .from('companies')
        .select(`
          id, 
          name, 
          slug, 
          categories (slug),
          cities (slug),
          photos (url, ordering)
        `)
        .ilike('name', `%${query}%`)
        .limit(3);

      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .ilike('name', `%${query}%`)
        .limit(3);

      const combined: SearchResult[] = [
        ...(companies?.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: 'company' as const,
          categorySlug: c.categories?.slug,
          citySlug: c.cities?.slug,
          // Sort photos by ordering and take the first one, or just take the first one returned if ordering is handled by DB defaults/logic
          photoUrl: c.photos?.sort((a: any, b: any) => a.ordering - b.ordering)[0]?.url
        })) || []),
        ...(categories?.map(c => ({ ...c, type: 'category' as const })) || [])
      ];
      setResults(combined);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputFocus = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      // Position the popover below the input. Adjust as needed.
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8, // 8px gap
        left: rect.left + window.scrollX,
      });
    }
    setShowDatePicker(true);
  };

  const handleSearchFocus = () => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setAutocompletePosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setShowAutocomplete(true);
  };

  const handleSelect = (item: SearchResult) => {
    if (item.type === 'company') {
      const citySlug = item.citySlug || 'bratislava';
      const categorySlug = item.categorySlug || 'unknown';
      router.push(`/${citySlug}/${categorySlug}/c/${item.slug}`);
      return;
    }
    setQuery(item.name);
    setSelectedItem(item);
    setResults([]);
    setShowAutocomplete(false);
  };

  const handleSearch = async () => {
    let targetItem = selectedItem;

    if (!targetItem && query) {
        // 1. Try to find in current results
        targetItem = results.find(r => r.type === 'category') || null;
        
        // 2. If not found or results empty, fetch from DB
        if (!targetItem) {
             const { data: categories } = await supabase
                .from('categories')
                .select('id, name, slug')
                .ilike('name', `%${query}%`)
                .limit(1);
             
             if (categories && categories.length > 0) {
                 targetItem = { ...categories[0], type: 'category' };
             }
        }
    }

    // Resolve City
    let cityToUse = selectedCity;
    if (!cityToUse && cities) {
        // Try to find based on defaultCity or cookie
        // Note: defaultCity is name
        const nameToUse = defaultCity || cookieCityName;
        if (nameToUse) {
             cityToUse = cities.find(c => c.name === nameToUse) || null;
        }
    }

    const params = new URLSearchParams();
    
    // Save state to cookies
    if (range?.from) {
        const dateStr = format(range.from, 'yyyy-MM-dd');
        params.set('date', dateStr);
        setCookie('bs_date', dateStr);
    } else {
        setCookie('bs_date', '', -1);
    }

    if (timeFrom) {
        params.set('timeFrom', timeFrom);
        setCookie('bs_time_from', timeFrom);
    } else {
        setCookie('bs_time_from', '', -1);
    }

    if (timeTo) {
        params.set('timeTo', timeTo);
        setCookie('bs_time_to', timeTo);
    } else {
        setCookie('bs_time_to', '', -1);
    }

    // Handle City Persistence
    if (cityToUse) {
        setCookie('bs_city_name', cityToUse.name);
        setCookie('user-city', cityToUse.slug); 
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';

    if (targetItem?.type === 'category') {
        if (cityToUse) {
            router.push(`/${cityToUse.slug}/${targetItem.slug}${queryString}`);
        } else {
            router.push(`/c/${targetItem.slug}${queryString}`);
        }
    } else if (targetItem?.type === 'company') {
         const citySlug = targetItem.citySlug || (cityToUse?.slug) || 'bratislava';
         const categorySlug = targetItem.categorySlug || 'unknown';
         router.push(`/${citySlug}/${categorySlug}/c/${targetItem.slug}${queryString}`);
    } else {
         // No Category/Company selected/found (Empty query or "Search" clicked without match)
         if (cityToUse) {
             router.push(`/${cityToUse.slug}${queryString}`);
         } else {
             router.push(`/cities${queryString}`);
         }
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && !inputRef.current?.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node) && !searchInputRef.current?.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverRef, inputRef, autocompleteRef, searchInputRef]);

  let datePickerDisplay = 'Kedy?';
  if (range?.from) {
    if (!range.to) {
      datePickerDisplay = format(range.from, 'd. MMMM yyyy', { locale: sk });
    } else {
      datePickerDisplay = `${format(range.from, 'd.MM.yy', { locale: sk })} - ${format(range.to, 'd.MM.yy', { locale: sk })}`;
    }

    if (timeFrom) {
      datePickerDisplay += ` ${timeFrom}`;
      if (timeTo) {
        datePickerDisplay += ` - ${timeTo}`;
      }
    }
  }
  
  const DatePickerPopover = (
    <div 
      ref={popoverRef} 
      className={popoverClassName} 
      style={{ 
        position: 'absolute', 
        top: `${popoverPosition.top}px`, 
        left: `${popoverPosition.left}px`,
        zIndex: 101, 
        background: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '12px', 
        padding: '20px',
        marginTop:'0px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
      }}
    >
      <DayPicker
        mode="range"
        selected={range}
        onSelect={setRange}
        locale={sk}
        numberOfMonths={numberOfMonths}
      />
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>Čas od</label>
          <input
            type="time"
            step="300"
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.target.value)}
            style={{ 
              padding: '6px 8px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '14px',
              color: '#333'
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>Čas do</label>
          <input
            type="time"
            step="300"
            value={timeTo}
            onChange={(e) => setTimeTo(e.target.value)}
            style={{ 
              padding: '6px 8px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '14px',
              color: '#333'
            }}
          />
        </div>
      </div>
    </div>
  );

  const AutocompletePopover = (
    <div
      ref={autocompleteRef}
      style={{
        position: 'absolute',
        top: `${autocompletePosition.top}px`,
        left: `${autocompletePosition.left}px`,
        width: `${autocompletePosition.width}px`,
        zIndex: 102,
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '8px 0'
      }}
    >
      {results.some(r => r.type === 'company') && (
        <div>
          <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>Salóny</div>
          {results.filter(r => r.type === 'company').map(item => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#2c2c2c',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              {item.photoUrl && (
                <img 
                  src={item.photoUrl} 
                  alt={item.name} 
                  style={{ width: '32px', height: '32px', borderRadius: '4px', marginRight: '10px', objectFit: 'cover' }} 
                />
              )}
              {item.name}
            </div>
          ))}
        </div>
      )}
      
      {results.some(r => r.type === 'company') && results.some(r => r.type === 'category') && (
        <div style={{ height: '1px', background: '#eee', margin: '4px 0' }}></div>
      )}

      {results.some(r => r.type === 'category') && (
        <div>
          <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>Kategórie</div>
          {results.filter(r => r.type === 'category').map(item => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#2c2c2c',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              {item.name}
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query.length >= 2 && (
        <div style={{ padding: '12px 16px', color: '#999', fontSize: '14px', textAlign: 'center' }}>
          Žiadne výsledky
        </div>
      )}
    </div>
  );

  return (
    <div className="search-strip">
      <div className="search-input-group" style={{ position: 'relative' }}>
        <input 
          ref={searchInputRef}
          type="text" 
          placeholder="Procedúra/Salón" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedItem(null);
            setShowAutocomplete(true);
          }}
          onFocus={handleSearchFocus}
          style={{ paddingRight: '30px' }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSelectedItem(null);
              setResults([]);
            }}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#999',
              fontSize: '16px',
              padding: '0',
              lineHeight: 1,
              zIndex: 10
            }}
            title="Vymazať"
          >
            ✕
          </button>
        )}
        {showAutocomplete && isClient && (results.length > 0 || query.length >= 2) && createPortal(AutocompletePopover, document.body)}
      </div>
      <div className="search-input-group">
        <CitySelector 
            cities={cities} 
            defaultCity={defaultCity || cookieCityName} 
            onSelect={(city) => setSelectedCity(city)}
        />
      </div>
      <div className="search-input-group" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Kedy?"
          value={datePickerDisplay}
          onFocus={handleInputFocus}
          readOnly
          style={{cursor: 'pointer', paddingRight: '30px'}}
        />
        {datePickerDisplay !== 'Kedy?' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRange(undefined);
              setTimeFrom('');
              setTimeTo('');
              setCookie('bs_date', '', -1);
              setCookie('bs_time_from', '', -1);
              setCookie('bs_time_to', '', -1);
            }}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#999',
              fontSize: '16px',
              padding: '0',
              lineHeight: 1
            }}
            title="Vymazať dátum"
          >
            ✕
          </button>
        )}
        {showDatePicker && isClient && createPortal(DatePickerPopover, document.body)}
      </div>
      <button className="search-icon-btn" onClick={handleSearch}>🔍</button>
    </div>
  );
}
