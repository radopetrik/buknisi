"use client";

import React, { useState } from 'react';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface BusinessHour {
  day_in_week: DayOfWeek;
  from_time: string;
  to_time: string;
  break_from_time?: string;
  break_to_time?: string;
}

interface OpeningHoursListProps {
  hours: BusinessHour[];
  variant?: 'default' | 'hero';
}

const daysMap: Record<DayOfWeek, string> = {
  monday: 'Pondelok',
  tuesday: 'Utorok',
  wednesday: 'Streda',
  thursday: 'Štvrtok',
  friday: 'Piatok',
  saturday: 'Sobota',
  sunday: 'Nedeľa'
};

const daysOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function formatTime(timeStr: string) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    return `${h}:${m}`;
}

export function OpeningHoursList({ hours, variant = 'default' }: OpeningHoursListProps) {
  const currentDayIndex = new Date().getDay(); 
  const adjustedCurrentDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
  const currentDay = daysOrder[adjustedCurrentDayIndex];

  if (!hours || hours.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: variant === 'hero' ? '13px' : 'inherit' }}>Otváracie hodiny nie sú k dispozícii.</div>;
  }

  const isHero = variant === 'hero';

  return (
    <div className={`opening-hours-list ${isHero ? 'hero-variant' : ''}`} style={{ marginTop: isHero ? '8px' : '10px' }}>
      {daysOrder.map((day) => {
        const dayHours = hours.find((h) => h.day_in_week === day);
        const isToday = day === currentDay;
        
        return (
          <div key={day} className={`oh-row ${isToday ? 'current' : ''}`} style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: isHero ? '2px 0' : '8px 0', 
              borderBottom: isHero ? 'none' : '1px dashed #eee',
              color: isToday ? 'var(--primary-color)' : 'var(--text-muted)',
              fontWeight: isToday ? '700' : 'normal',
              fontSize: isHero ? '13px' : '14px'
          }}>
            <span style={{ width: isHero ? '80px' : '100px' }}>{daysMap[day]}</span>
            <span style={{ textAlign: 'right', flex: 1 }}>
              {dayHours ? (
                <>
                  {formatTime(dayHours.from_time)} – {formatTime(dayHours.to_time)}
                  {dayHours.break_from_time && dayHours.break_to_time && (
                     <span style={{fontSize: '0.9em', marginLeft: '8px', color: '#999', display: isHero ? 'none' : 'inline'}}>
                       (obed {formatTime(dayHours.break_from_time)} – {formatTime(dayHours.break_to_time)})
                     </span>
                  )}
                </>
              ) : (
                'Zatvorené'
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TodayOpeningHours({ hours }: OpeningHoursListProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!hours || hours.length === 0) return <span>Otváracie hodiny nie sú známe</span>;

    const currentDayIndex = new Date().getDay(); // 0 is Sunday
    const adjustedCurrentDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
    const currentDayKey = daysOrder[adjustedCurrentDayIndex];
    const todayHours = hours.find(h => h.day_in_week === currentDayKey);

    return (
        <div 
          className="opening-hours-dropdown-wrapper" 
          style={{ position: 'relative', display: 'inline-block' }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setIsOpen(!isOpen)}
            >
                {todayHours ? (
                   <span>
                      Dnes: <span style={{fontWeight: '600', color: 'var(--text-main)'}}>{formatTime(todayHours.from_time)} – {formatTime(todayHours.to_time)}</span>
                   </span>
                ) : (
                   <span style={{color: '#d63031'}}>Dnes zatvorené</span>
                )}
                <span style={{ fontSize: '10px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </div>

            {isOpen && (
                <div className="oh-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    background: 'white',
                    padding: '16px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    minWidth: '280px',
                    marginTop: '8px',
                    border: '1px solid #f0f0f0'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontFamily: 'var(--font-heading)' }}>Otváracie hodiny</h4>
                    <OpeningHoursList hours={hours} />
                </div>
            )}
        </div>
    );
}
