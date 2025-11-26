import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';

interface ClockProps {
  timezone: string;
  themeClasses: typeof themes.default;
  showSeconds?: boolean;
  showDate?: boolean;
}

const Clock: React.FC<ClockProps> = ({ timezone, themeClasses, showSeconds = true, showDate = true }) => {
  const [time, setTime] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    // Reset error when timezone changes
    setError(null);
  }, [timezone]);

  const formatTime = () => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };

      if (showSeconds) {
        options.second = '2-digit';
      }
      
      return time.toLocaleTimeString('default', options);
    } catch (e) {
      setError(`Invalid timezone: ${timezone}`);
      return showSeconds ? '--:--:--' : '--:--';
    }
  };

  const formatDate = () => {
    try {
      return new Intl.DateTimeFormat('default', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(time);
    } catch (e) {
      return 'Invalid Date';
    }
  };

  if (error) {
    return <div className={`text-sm text-center py-4 text-red-400`}>{error}</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 text-center">
      <div className={`text-3xl font-bold ${themeClasses.header}`}>{formatTime()}</div>
      {showDate && (
        <div className={`text-sm ${themeClasses.textMuted}`}>{formatDate()}</div>
      )}
    </div>
  );
};

export default Clock;