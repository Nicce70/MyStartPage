import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { themes } from '../themes';

interface TimerProps {
  initialDuration: number; // in seconds
  themeClasses: typeof themes.default;
  playSound?: boolean;
  onOpenSettings: () => void;
  isEditMode: boolean;
}

const Timer: React.FC<TimerProps> = ({ initialDuration, themeClasses, playSound = true, onOpenSettings, isEditMode }) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const isStopwatch = initialDuration === 0;
  
  const intervalRef = useRef<number | null>(null);
  
  // When the configured duration changes, reset the timer
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeLeft(initialDuration);
    setIsActive(false);
  }, [initialDuration]);

  const playAlarm = useCallback(() => {
    // To ensure reliable playback, a new Audio object is created for each beep.
    const audio = new Audio('../kitchen-timer.mp3');
    audio.play().catch(e => console.error("Error playing sound:", e));
  }, []);

  // Effect to handle the countdown/countup interval
  useEffect(() => {
    if (isActive && !isEditMode) { // Do not run timer in edit mode
      intervalRef.current = window.setInterval(() => {
        if (isStopwatch) {
          setTimeLeft(t => t + 1);
        } else {
          setTimeLeft(t => {
            if (t > 1) {
              return t - 1;
            } else {
              // Timer is finishing
              if (intervalRef.current) clearInterval(intervalRef.current);
              setIsActive(false);
              if (playSound) {
                playAlarm(); // Play once immediately
                intervalRef.current = window.setInterval(playAlarm, 1000); // Then loop
              }
              return 0;
            }
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isStopwatch, playSound, playAlarm, isEditMode]);


  const handleStartPause = () => {
    // If it's a finished timer, do nothing on start.
    if (!isStopwatch && timeLeft <= 0 && !isActive) {
      return;
    }
    // If pausing, clear any potential alarm interval
    if (isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setTimeLeft(initialDuration);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isFinished = !isStopwatch && timeLeft <= 0;
  const finishedColorClass = themeClasses.ring.replace('ring-', 'text-');

  return (
    <div className="flex flex-col items-center justify-center p-2 text-center">
      <div className={`text-4xl font-bold font-mono tracking-wider ${isFinished ? `animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite] ${finishedColorClass}` : themeClasses.header}`}>
        {formatTime(timeLeft)}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 w-full">
        <button
          onClick={handleStartPause}
          className={`${themeClasses.buttonPrimary} font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isEditMode || (isFinished && !isActive)}
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
            onClick={onOpenSettings}
            className={`${themeClasses.buttonSecondary} font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isEditMode || isActive}
        >
            Set
        </button>
        <button
          onClick={handleReset}
          className={`${themeClasses.buttonSecondary} font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isEditMode}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Timer;