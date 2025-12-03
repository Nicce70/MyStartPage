
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { themes } from '../themes';

interface TimerProps {
  id: string; // Unique ID for local storage
  initialDuration: number; // in seconds
  themeClasses: typeof themes.default;
  playSound?: boolean;
  allowOvertime?: boolean;
  onOpenSettings: () => void;
  isEditMode: boolean;
}

const Timer: React.FC<TimerProps> = ({ id, initialDuration, themeClasses, playSound = true, allowOvertime = false, onOpenSettings, isEditMode }) => {
  const isStopwatch = initialDuration === 0;
  const storageKey = `timer-state-v2-${id}`; // v2 for new logic
  const prevDurationRef = useRef(initialDuration);
  
  // State initialization from localStorage
  const [targetTime, setTargetTime] = useState<number | null>(null); // For countdown
  const [startTime, setStartTime] = useState<number | null>(null);   // For stopwatch
  const [pausedDuration, setPausedDuration] = useState(initialDuration); // For countdown
  const [pausedElapsed, setPausedElapsed] = useState(0); // For stopwatch
  const [isActive, setIsActive] = useState(false);
  const [displayTime, setDisplayTime] = useState(initialDuration);
  const [isRinging, setIsRinging] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);

  // Load state from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.wasStopwatch !== isStopwatch) {
            // Mode changed, reset to default for the new mode
            handleReset();
            return;
        }
        
        setIsActive(data.isActive);
        if (isStopwatch) {
            setPausedElapsed(data.pausedElapsed || 0);
            if (data.isActive && data.startTime) {
                setStartTime(data.startTime);
            } else {
                setDisplayTime(data.pausedElapsed || 0);
            }
        } else { // Countdown
            setPausedDuration(data.pausedDuration ?? initialDuration);
            if (data.isActive && data.targetTime) {
                setTargetTime(data.targetTime);
            } else {
                setDisplayTime(data.pausedDuration ?? initialDuration);
            }
        }
      }
    } catch (e) {
      console.error("Failed to load timer state:", e);
    }
  }, [id, isStopwatch]); // Run only on mount and mode change

  // Save state to local storage whenever it changes
  useEffect(() => {
    if (isEditMode) return;
    try {
        const state = {
            isActive,
            targetTime,
            startTime,
            pausedDuration,
            pausedElapsed,
            wasStopwatch: isStopwatch,
        };
        localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save timer state:", e);
    }
  }, [isActive, targetTime, startTime, pausedDuration, pausedElapsed, isStopwatch, storageKey, isEditMode]);
  
  // Handle external settings change (Duration prop change)
  useEffect(() => {
    if (prevDurationRef.current !== initialDuration) {
        handleReset();
        prevDurationRef.current = initialDuration;
    }
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
      osc.type = 'square';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.setValueAtTime(0, t + 0.1);
      gain.gain.setValueAtTime(0.05, t + 0.2);
      gain.gain.setValueAtTime(0, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.4);
      setTimeout(() => { if (ctx.state !== 'closed') ctx.close(); }, 1000);
    } catch (e) { console.error("Error playing alarm sound:", e); }
  }, []);

  // Effect: Handle Alarm Loop
  useEffect(() => {
    if (isRinging) {
      playAlarm();
      alarmIntervalRef.current = window.setInterval(playAlarm, 1000);
      alarmTimeoutRef.current = window.setTimeout(() => setIsRinging(false), 20000);
    }
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      if (alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current);
    };
  }, [isRinging, playAlarm]);

  // Effect: Main timer/stopwatch tick logic
  useEffect(() => {
    if (isActive && !isEditMode) {
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        if (isStopwatch) {
          if (startTime) {
            const elapsed = (now - startTime) / 1000;
            setDisplayTime(pausedElapsed + elapsed);
          }
        } else { // Countdown
          if (targetTime) {
            const remaining = (targetTime - now) / 1000;
            const remainingSeconds = Math.max(0, remaining);
            setDisplayTime(remaining);

            if (remaining > 0 && remaining <= 1 && !isRinging) {
              // about to finish
            } else if (remaining <= 0 && displayTime > 0) { // Just crossed zero
              if (playSound) setIsRinging(true);
              if (!allowOvertime) {
                setIsActive(false);
                setTargetTime(null);
                setPausedDuration(0);
                setDisplayTime(0);
              }
            }
          }
        }
      }, 250); // Update 4 times a second for smoother display
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, isEditMode, isStopwatch, startTime, targetTime, pausedElapsed, displayTime, allowOvertime, playSound, isRinging]);

  const handleStartPause = () => {
    if (isRinging) { setIsRinging(false); return; }
    if (isFinished && !isActive && !allowOvertime) return;

    setIsActive(!isActive);
    const now = Date.now();

    if (!isActive) { // Starting
        if (isStopwatch) {
            setStartTime(now);
        } else {
            setTargetTime(now + pausedDuration * 1000);
        }
    } else { // Pausing
        if (isStopwatch) {
            if (startTime) {
                setPausedElapsed(p => p + (now - startTime) / 1000);
            }
            setStartTime(null);
        } else {
            if (targetTime) {
                setPausedDuration(Math.max(0, (targetTime - now) / 1000));
            }
            setTargetTime(null);
        }
    }
  };

  const handleReset = () => {
    setIsRinging(false);
    setIsActive(false);
    setTargetTime(null);
    setStartTime(null);
    setPausedDuration(initialDuration);
    setPausedElapsed(0);
    setDisplayTime(initialDuration);
    localStorage.removeItem(storageKey);
  };

  const formatTime = (totalSeconds: number) => {
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = Math.floor(absSeconds % 60);
    const sign = isNegative ? '-' : '';
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isFinished = !isStopwatch && displayTime <= 0;
  const finishedColorClass = themeClasses.ring.replace('ring-', 'text-');

  return (
    <div className="flex flex-col items-center justify-center p-2 text-center">
      <div className={`text-4xl font-bold font-mono tracking-wider ${isFinished && !isRinging ? `animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite] ${finishedColorClass}` : themeClasses.header}`}>
        {formatTime(displayTime)}
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
