
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { themes } from '../themes';

interface TimerProps {
  initialDuration: number; // in seconds
  themeClasses: typeof themes.default;
  playSound?: boolean;
  allowOvertime?: boolean;
  onOpenSettings: () => void;
  isEditMode: boolean;
}

const Timer: React.FC<TimerProps> = ({ initialDuration, themeClasses, playSound = true, allowOvertime = false, onOpenSettings, isEditMode }) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const isStopwatch = initialDuration === 0;
  
  const intervalRef = useRef<number | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);
  
  // When the configured duration changes, reset the timer
  useEffect(() => {
    setIsRinging(false);
    setIsActive(false);
    setTimeLeft(initialDuration);
  }, [initialDuration]);

  const playAlarm = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Classic digital alarm sound (Square wave)
      osc.type = 'square';
      osc.frequency.value = 880; // A5 note
      
      // Pattern: Beep (0.1s) - Pause (0.1s) - Beep (0.1s)
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.setValueAtTime(0, t + 0.1);
      gain.gain.setValueAtTime(0.05, t + 0.2);
      gain.gain.setValueAtTime(0, t + 0.3);
      
      osc.start(t);
      osc.stop(t + 0.4);
      
      // Cleanup context after sound finishes
      setTimeout(() => {
        if (ctx.state !== 'closed') ctx.close();
      }, 1000);
      
    } catch (e) {
      console.error("Error playing alarm sound:", e);
    }
  }, []);

  // Effect 1: Handle Alarm Loop
  // This is separated from the countdown timer so stopping the countdown (isActive=false) doesn't kill the alarm.
  useEffect(() => {
    if (isRinging) {
      playAlarm(); // Play immediately
      
      // Loop alarm every second
      alarmIntervalRef.current = window.setInterval(playAlarm, 1000);
      
      // Auto stop after 20 seconds
      alarmTimeoutRef.current = window.setTimeout(() => {
        setIsRinging(false);
      }, 20000);
    }

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current);
        alarmTimeoutRef.current = null;
      }
    };
  }, [isRinging, playAlarm]);

  // Effect 2: Handle Countdown/Countup Tick
  useEffect(() => {
    if (isActive && !isEditMode) {
      intervalRef.current = window.setInterval(() => {
        if (isStopwatch) {
          setTimeLeft(t => t + 1);
        } else {
          setTimeLeft(t => {
            // Calculate next time
            const nextTime = t - 1;
            
            // Check if we just reached zero (transition from 1 to 0) or are already negative
            if (nextTime === 0) {
               // Trigger alarm if configured
               if (playSound) setIsRinging(true);
               
               // If overtime is NOT allowed, stop here.
               if (!allowOvertime) {
                 setIsActive(false);
                 return 0;
               }
            }
            
            // If we are here, it's either > 0 or < 0 (overtime)
            return nextTime;
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
  }, [isActive, isStopwatch, isEditMode, playSound, allowOvertime]);


  const handleStartPause = () => {
    // If alarm is ringing, this button acts as "Stop Alarm"
    if (isRinging) {
        setIsRinging(false);
        return;
    }
    
    // If it's a finished timer (and alarm stopped), do nothing on start unless reset.
    // Exception: If overtime is allowed, we can technically pause/resume negative counting.
    if (!isStopwatch && timeLeft <= 0 && !isActive && !allowOvertime) {
      return;
    }
    
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsRinging(false);
    setIsActive(false);
    setTimeLeft(initialDuration);
  };

  const formatTime = (totalSeconds: number) => {
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;
    const sign = isNegative ? '-' : '';
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Determine visual state
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
          className={`${themeClasses.buttonPrimary} font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${isRinging ? 'animate-pulse bg-red-600 hover:bg-red-500' : ''}`}
          disabled={isEditMode || (isFinished && !isActive && !isRinging && !allowOvertime)}
        >
          {isRinging ? 'Stop' : isActive ? 'Pause' : 'Start'}
        </button>
        <button
            onClick={onOpenSettings}
            className={`${themeClasses.buttonSecondary} font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isEditMode || isActive || isRinging}
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
