
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { themes } from '../themes';
import { XMarkIcon, PartyPopperIcon } from './Icons';

interface CountdownProps {
  title: string;
  targetDate: string;
  themeClasses: typeof themes.default;
  behavior?: 'discrete' | 'confetti' | 'fullscreen' | 'intense';
  playSound?: boolean;
  onOpenSettings: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ title, targetDate, themeClasses, behavior = 'discrete', playSound = false, onOpenSettings }) => {
  const [showEffect, setShowEffect] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<{id: number, left: string, animationDuration: string, bg: string}[]>([]);
  const [isRinging, setIsRinging] = useState(false);
  const hasTriggeredRef = useRef(false);
  
  // Refs for audio interval clearing
  const alarmIntervalRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);

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
    } else {
        timeLeft.totalDifference = difference;
    }

    return timeLeft;
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  // Alarm Logic
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

  // Effect to manage ringing loop
  useEffect(() => {
    if (isRinging) {
        playAlarm(); // Play immediately
        
        // Loop alarm every 2 seconds
        alarmIntervalRef.current = window.setInterval(playAlarm, 2000);
        
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

  const dismiss = () => {
      setShowEffect(false);
      setIsRinging(false);
  };

  useEffect(() => {
    // Reset trigger state when parameters change
    hasTriggeredRef.current = false;
    setShowEffect(false);
    setIsRinging(false);

    // Initial check to prevent 1s delay on load if already finished
    const initialCheck = calculateTimeLeft();
    if (initialCheck.totalDifference <= 0 && behavior !== 'discrete') {
        setShowEffect(true);
        hasTriggeredRef.current = true;
        // Do not trigger sound on initial load if already expired long ago, 
        // only if it just happened. But here we assume if it's done, it's done.
    }

    // Generate confetti particles only once if needed
    if (behavior === 'confetti' && confettiParticles.length === 0) {
        const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
        const particles = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 3 + 2}s`,
            bg: colors[Math.floor(Math.random() * colors.length)]
        }));
        setConfettiParticles(particles);
    }

    // Set an interval that updates every second
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      
      // Trigger effect if finished and haven't triggered yet
      if (newTime.totalDifference <= 0) {
          if (!hasTriggeredRef.current) {
              if (behavior !== 'discrete') setShowEffect(true);
              if (playSound) setIsRinging(true);
              hasTriggeredRef.current = true;
          }
      }
    }, 1000);

    // Clear the interval on cleanup
    return () => clearInterval(timer);
  }, [calculateTimeLeft, behavior, playSound]); // confettiParticles omitted intentionally to stable initialization

  if (!targetDate) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Please set a date in the settings.</div>;
  }

  const { years, months, days, hours, minutes, seconds, totalDifference } = timeLeft;
  const isFinished = totalDifference <= 0;

  // --- Effects Rendering ---

  // 1. Intense Mode: Flashing Background Style
  // Only flash if finished AND effect hasn't been dismissed
  const intenseStyle = isFinished && showEffect && behavior === 'intense' 
    ? "animate-[pulse_0.5s_ease-in-out_infinite] bg-red-900/80 border-red-500" 
    : "";

  return (
    <div className={`relative text-center p-2 transition-all duration-300 rounded-lg ${intenseStyle}`}>
      
      {/* 2. Confetti Particles (Overlay) */}
      {isFinished && showEffect && behavior === 'confetti' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg z-0">
              {confettiParticles.map(p => (
                  <div 
                    key={p.id}
                    className="absolute top-0 w-1.5 h-1.5 rounded-full animate-[fall_linear_infinite]"
                    style={{
                        left: p.left,
                        backgroundColor: p.bg,
                        animationDuration: p.animationDuration,
                        opacity: 0.8
                    }}
                  />
              ))}
              <style>{`
                @keyframes fall {
                    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
                }
              `}</style>
          </div>
      )}

      <h3 className={`relative z-10 text-lg font-bold ${themeClasses.header} break-all`} title={title}>{title}</h3>
      
      {isFinished ? (
          <div className="relative z-10 mt-2">
            {/* Active Effect State with Done Button */}
            {showEffect && (behavior === 'confetti' || behavior === 'intense') ? (
                <div className="space-y-2">
                    <p className={`text-xl font-bold ${themeClasses.header}`}>Time's Up!</p>
                    <button 
                        onClick={dismiss}
                        className={`px-4 py-1.5 text-sm font-bold rounded-full shadow-lg bg-white text-black hover:bg-gray-200 transition-colors`}
                    >
                        Done
                    </button>
                </div>
            ) : (
                // Post-Effect / Discrete State
                <div className="animate-fade-in-up">
                    <p className={`text-2xl font-bold ${themeClasses.ring.replace('ring-','text-')}`}>The time is now!</p>
                    <button 
                        onClick={() => { dismiss(); onOpenSettings(); }}
                        className={`mt-3 text-sm font-semibold ${themeClasses.buttonSecondary} py-1.5 px-4 rounded-full transition-colors`}
                    >
                        Set new
                    </button>
                </div>
            )}
          </div>
      ) : (
          <div className="flex justify-center items-start flex-wrap gap-3 mt-2 font-mono tracking-tight">
            {years > 0 && <div className="text-center"><span className="text-3xl font-bold">{years}</span><span className="text-xs block">years</span></div>}
            {months > 0 && <div className="text-center"><span className="text-3xl font-bold">{months}</span><span className="text-xs block">months</span></div>}
            {days > 0 && <div className="text-center"><span className="text-3xl font-bold">{days}</span><span className="text-xs block">days</span></div>}
            <div className="text-center"><span className="text-3xl font-bold">{String(hours).padStart(2, '0')}</span><span className="text-xs block">hours</span></div>
            <div className="text-center"><span className="text-3xl font-bold">{String(minutes).padStart(2, '0')}</span><span className="text-xs block">minutes</span></div>
            {totalDifference < 24 * 60 * 60 * 1000 && (
                <div className="text-center"><span className="text-3xl font-bold">{String(seconds).padStart(2, '0')}</span><span className="text-xs block">seconds</span></div>
            )}
          </div>
      )}

      {/* 3. Fullscreen Modal */}
      {isFinished && behavior === 'fullscreen' && showEffect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in-up">
              <div className={`relative w-full max-w-lg p-8 rounded-2xl border-2 ${themeClasses.modalBg} ${themeClasses.dashedBorder} text-center shadow-2xl`}>
                  
                  <PartyPopperIcon className="w-20 h-20 mx-auto mb-6 text-yellow-400 animate-bounce" />
                  
                  <h2 className="text-xl font-medium uppercase tracking-widest text-slate-400 mb-2">Countdown Finished</h2>
                  <h1 className={`text-4xl md:text-6xl font-bold mb-8 ${themeClasses.header} break-words`}>
                      {title}
                  </h1>
                  
                  <button 
                    onClick={dismiss}
                    className={`px-8 py-3 text-lg font-bold rounded-full shadow-lg transform hover:scale-105 transition-all ${themeClasses.buttonPrimary}`}
                  >
                      Ok
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Countdown;