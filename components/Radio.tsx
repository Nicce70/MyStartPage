
import React, { useState, useEffect, useRef } from 'react';
import type { themes } from '../themes';
import type { RadioStation } from '../types';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ChevronDownIcon } from './Icons';

interface RadioProps {
  stations: RadioStation[];
  themeClasses: typeof themes.default;
  isEditMode: boolean;
}

const Radio: React.FC<RadioProps> = ({ stations, themeClasses, isEditMode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStationId, setCurrentStationId] = useState(stations?.[0]?.id || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const currentStation = stations.find(s => s.id === currentStationId) || stations[0];

  useEffect(() => {
    // If stations are updated from settings, make sure we have a valid selection
    if (stations && stations.length > 0 && !stations.find(s => s.id === currentStationId)) {
      setCurrentStationId(stations[0].id);
    }
  }, [stations, currentStationId]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Helper to safely play audio and ignore interruption errors
  const safePlay = (audio: HTMLAudioElement) => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
          playPromise.catch(error => {
              if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                  console.error("Playback failed:", error);
                  setIsPlaying(false);
              }
          });
      }
  };

  // Initialize Audio Object on Mount
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

  // Effect 1: Handle Volume/Mute Changes
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = isMuted ? 0 : volume;
      }
  }, [volume, isMuted]);

  // Effect 2: Handle Station Changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentStation) return;

    if (audio.src !== currentStation.url) {
        audio.src = currentStation.url;
        if (isPlaying) {
            safePlay(audio);
        }
    }
  }, [currentStation, isPlaying]);

  // Effect 3: Handle Play/Pause Toggle
  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
          if (audio.paused) {
              safePlay(audio);
          }
      } else {
          if (!audio.paused) {
              audio.pause();
          }
      }
  }, [isPlaying]);

  const togglePlay = () => {
      if (!currentStation) return;
      setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
      setIsMuted(!isMuted);
  };

  const handleStationSelect = (stationId: string) => {
    setCurrentStationId(stationId);
    setIsDropdownOpen(false);
  };

  if (!stations || stations.length === 0) {
    return (
      <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>
        No stations configured. Add some in settings.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isEditMode}
          className={`w-full flex items-center justify-between p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing} text-sm font-semibold text-left disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="truncate">{currentStation?.name || 'Select Station'}</span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {isDropdownOpen && !isEditMode && (
          <div className={`absolute z-30 top-full mt-1 w-full rounded-md shadow-lg border max-h-96 overflow-y-auto ${themeClasses.modalBg} ${themeClasses.dashedBorder}`}>
            <ul className="py-1">
              {stations.map(station => (
                <li
                  key={station.id}
                  onClick={() => handleStationSelect(station.id)}
                  className={`px-3 py-2 text-sm cursor-pointer ${themeClasses.linkHoverBg} ${currentStationId === station.id ? themeClasses.header : ''}`}
                >
                  {station.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
            onClick={togglePlay}
            disabled={isEditMode}
            className={`p-3 rounded-full transition-all shadow-lg flex-shrink-0 ${isPlaying ? themeClasses.buttonPrimary : themeClasses.buttonSecondary} hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>

        <div className={`flex-1 flex items-center gap-2 bg-black/20 p-2 rounded-lg ${isEditMode ? 'opacity-50' : ''}`}>
            <button 
                onClick={toggleMute}
                disabled={isEditMode}
                className={`p-1 rounded-md hover:bg-white/10 transition-colors focus:outline-none disabled:cursor-not-allowed`}
                title={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? (
                    <SpeakerXMarkIcon className={`w-4 h-4 ${themeClasses.iconMuted}`} />
                ) : (
                    <SpeakerWaveIcon className={`w-4 h-4 ${themeClasses.iconMuted}`} />
                )}
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                disabled={isEditMode}
                onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                }}
                className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:cursor-not-allowed"
            />
        </div>
      </div>

      <div className="h-6 flex items-center justify-center gap-1 overflow-hidden">
          {isPlaying ? (
              <>
                <div className="w-1 bg-green-400 animate-[pulse_0.6s_ease-in-out_infinite] h-3"></div>
                <div className="w-1 bg-green-400 animate-[pulse_0.8s_ease-in-out_infinite] h-5"></div>
                <div className="w-1 bg-green-400 animate-[pulse_1.1s_ease-in-out_infinite] h-2"></div>
                <div className="w-1 bg-green-400 animate-[pulse_0.7s_ease-in-out_infinite] h-4"></div>
                <div className="w-1 bg-green-400 animate-[pulse_0.9s_ease-in-out_infinite] h-3"></div>
                <span className="ml-2 text-xs text-green-400 font-bold uppercase tracking-wider">Live</span>
              </>
          ) : (
              <span className={`text-xs ${themeClasses.textSubtle} uppercase tracking-wider`}>Ready</span>
          )}
      </div>
    </div>
  );
};

export default Radio;
