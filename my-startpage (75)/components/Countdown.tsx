import React, { useState, useEffect, useCallback } from 'react';
import type { themes } from '../themes';

interface CountdownProps {
  title: string;
  targetDate: string;
  themeClasses: typeof themes.default;
}

const Countdown: React.FC<CountdownProps> = ({ title, targetDate, themeClasses }) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {
      years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDifference: 0
    };

    if (difference > 0) {
      const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24));
      
      let years = Math.floor(totalDays / 365.25);
      let remainingDays = totalDays % 365.25;
      
      let months = Math.floor(remainingDays / 30.44);
      let days = Math.floor(remainingDays % 30.44);

      timeLeft = {
        years: years,
        months: months,
        days: days,
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        totalDifference: difference,
      };
    }

    return timeLeft;
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    // Set an interval that updates every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Clear the interval on cleanup
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (!targetDate) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Please set a date in the settings.</div>;
  }

  const { years, months, days, hours, minutes, seconds, totalDifference } = timeLeft;

  if (totalDifference <= 0) {
    return (
      <div className="text-center p-2">
        <h3 className={`text-lg font-bold ${themeClasses.header}`}>{title}</h3>
        <p className={`text-2xl font-bold mt-2 ${themeClasses.ring.replace('ring-','text-')}`}>The time is now!</p>
      </div>
    );
  }

  // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace error.
  const timerComponents: React.ReactElement[] = [];

  if (years > 0) {
    timerComponents.push(<div key="years" className="text-center"><span className="text-3xl font-bold">{years}</span><span className="text-xs block">years</span></div>);
  }
  if (months > 0) {
    timerComponents.push(<div key="months" className="text-center"><span className="text-3xl font-bold">{months}</span><span className="text-xs block">months</span></div>);
  }
  if (days > 0) {
    timerComponents.push(<div key="days" className="text-center"><span className="text-3xl font-bold">{days}</span><span className="text-xs block">days</span></div>);
  }

  // Always show hours and minutes
  timerComponents.push(<div key="hours" className="text-center"><span className="text-3xl font-bold">{String(hours).padStart(2, '0')}</span><span className="text-xs block">hours</span></div>);
  timerComponents.push(<div key="minutes" className="text-center"><span className="text-3xl font-bold">{String(minutes).padStart(2, '0')}</span><span className="text-xs block">minutes</span></div>);
  
  // Only show seconds if less than a day is left, as requested.
  if (totalDifference < 24 * 60 * 60 * 1000) {
    timerComponents.push(<div key="seconds" className="text-center"><span className="text-3xl font-bold">{String(seconds).padStart(2, '0')}</span><span className="text-xs block">seconds</span></div>);
  }

  return (
    <div className="text-center p-2">
      <h3 className={`text-lg font-bold ${themeClasses.header} break-all`} title={title}>{title}</h3>
      <div className="flex justify-center items-start flex-wrap gap-3 mt-2 font-mono tracking-tight">
        {timerComponents}
      </div>
    </div>
  );
};

export default Countdown;
