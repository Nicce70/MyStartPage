import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';

interface CalendarProps {
  themeClasses: typeof themes.default;
  holidayCountry: string;
}

interface Holiday {
  date: string;
  localName: string;
}

const Calendar: React.FC<CalendarProps> = ({ themeClasses, holidayCountry }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!holidayCountry) {
      setHolidays(new Map());
      return;
    }

    const year = currentDate.getFullYear();
    const cacheKey = `holidays-${year}-${holidayCountry}`;
    
    try {
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        setHolidays(new Map(JSON.parse(cachedData)));
        return;
      }
    } catch (e) {
      console.error("Could not read from session storage", e);
    }

    fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${holidayCountry}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
      })
      .then((data: Holiday[]) => {
        if (Array.isArray(data)) {
          const holidayMap = new Map(data.map(h => [h.date, h.localName]));
          setHolidays(holidayMap);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(Array.from(holidayMap.entries())));
          } catch (e) {
             console.error("Could not write to session storage", e);
          }
        }
      })
      .catch(error => {
        console.error('Failed to fetch public holidays:', error);
        setHolidays(new Map()); // Clear holidays on error
      });
  }, [currentDate.getFullYear(), holidayCountry]);


  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  const todayBgClass = themeClasses.ring.replace('ring-', 'bg-');
  const ringShade = parseInt(themeClasses.ring.split('-').pop() || '500', 10);
  const todayTextClass = ringShade >= 500 ? 'text-white' : 'text-slate-900';
  const cellBorderClass = themeClasses.dashedBorder.replace('border-dashed', 'border');

  const changeMonth = (offset: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(1); 
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };
  
  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  }
  
  const getGoogleCalendarUrl = (day: number): string => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    return `https://calendar.google.com/calendar/r/week/${year}/${month}/${day}`;
  };

  const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const calendarDays: (number | null)[] = [];
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }

    const weeks: (number|null)[][] = [];
    let week: (number|null)[] = [];
    calendarDays.forEach((day, index) => {
      week.push(day);
      if ((index + 1) % 7 === 0 || index === calendarDays.length - 1) {
        if (index === calendarDays.length - 1 && week.length < 7) {
            while(week.length < 7) {
                week.push(null);
            }
        }
        weeks.push(week);
        week = [];
      }
    });
    
    const weekNumbers = weeks.map((week) => {
        const firstDayValue = week.find(d => d !== null);
        if (firstDayValue) {
            const dateForWeek = new Date(year, month, firstDayValue);
            return getWeekNumber(dateForWeek);
        }
        return getWeekNumber(new Date(year, month, 1));
    });

    return (
      <>
        {weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            <div className="flex items-center justify-center text-sm font-semibold">{weekNumbers[weekIndex]}</div>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <div key={dayIndex} className={`${themeClasses.columnBg} ${cellBorderClass}`}></div>;
              }
              const isToday = isCurrentMonth && day === todayDate;
              
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const holidayName = holidays.get(dateStr);
              const isHoliday = !!holidayName;
              
              const isSaturday = dayIndex === 5;
              const isSunday = dayIndex === 6;

              let dayTextColor = themeClasses.linkText;
              if (isHoliday || isSunday) {
                dayTextColor = 'text-red-500';
              } else if (isSaturday) {
                dayTextColor = 'text-orange-400';
              }

              return (
                <a
                  key={dayIndex}
                  href={getGoogleCalendarUrl(day)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={holidayName}
                  className={`flex items-center justify-center border text-sm font-bold cursor-pointer transition-colors 
                    ${cellBorderClass}
                    ${isToday
                      ? `${todayBgClass} ${todayTextClass}`
                      // FIX: The dayTextColor needs to be applied correctly.
                      : `${themeClasses.linkBg} ${dayTextColor} ${themeClasses.linkHoverBg}`
                    }`}
                >
                  <span>
                    {day}
                  </span>
                </a>
              );
            })}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div className={`${themeClasses.modalText} rounded-md select-none`}>
      <div className={`${themeClasses.modalBg} text-center py-1 mb-2`}>
        <h2 className="font-bold text-lg">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
      </div>
      <div className="grid grid-cols-8 gap-px text-center text-sm font-bold mb-1">
        <div>W</div>
        {dayNames.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-8 gap-px h-40">
          {renderCalendar()}
      </div>
      <div className="flex justify-between mt-2">
        <button
          onClick={() => changeMonth(-1)}
          className={`${themeClasses.buttonSecondary} font-bold p-2 rounded`}
          aria-label="Previous month"
          title="Previous month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={goToCurrentMonth}
          className={`${themeClasses.buttonSecondary} font-bold p-2 rounded`}
          aria-label="Current month"
          title="Current month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </button>
        <button
          onClick={() => changeMonth(1)}
          className={`${themeClasses.buttonSecondary} font-bold p-2 rounded`}
          aria-label="Next month"
          title="Next month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Calendar;