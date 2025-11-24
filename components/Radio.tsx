
import React, { useState, useEffect, useRef } from 'react';
import type { themes } from '../themes';
import type { RadioStation } from '../types';
import { PlayIcon, PauseIcon, SpeakerWaveIcon } from './Icons';

interface RadioProps {
  customStations: RadioStation[];
  themeClasses: typeof themes.default;
}

const DEFAULT_STATIONS: RadioStation[] = [
  { id: 'sr-p1', name: 'Sveriges Radio P1', url: 'https://sverigesradio.se/topsy/direkt/srapi/132.mp3' },
  { id: 'sr-p2', name: 'Sveriges Radio P2', url: 'https://sverigesradio.se/topsy/direkt/srapi/163.mp3' },
  { id: 'sr-p3', name: 'Sveriges Radio P3', url: 'https://sverigesradio.se/topsy/direkt/srapi/164.mp3' },
  { id: 'sr-p4-sthlm', name: 'SR P4 Stockholm', url: 'https://sverigesradio.se/topsy/direkt/srapi/701.mp3' },
  { id: 'mix-megapol', name: 'Mix Megapol', url: 'https://live-bauerse-fm.sharp-stream.com/mixmegapol_instream_se_mp3' },
  { id: 'rockklassiker', name: 'Rockklassiker', url: 'https://live-bauerse-fm.sharp-stream.com/rockklassiker_instream_se_mp3' },
  { id: 'rix-fm', name: 'Rix FM', url: 'https://fm01-ice.stream.viaplay.se/RixFM_se_mp3' },
  { id: 'lugna-favoriter', name: 'Lugna Favoriter', url: 'https://fm04-ice.stream.viaplay.se/LugnaFavoriter_se_mp3' },
  { id: 'star-fm', name: 'Star FM', url: 'https://fm03-ice.stream.viaplay.se/StarFM_se_mp3' },
];

const Radio: React.FC<RadioProps> = ({ customStations, themeClasses }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentStationId, setCurrentStationId] = useState(DEFAULT_STATIONS[2].id); // Default to P3
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stations = [...DEFAULT_STATIONS, ...(customStations || [])];
  const currentStation = stations.find(s => s.id === currentStationId) || stations[0];

  // Helper to safely play audio and ignore interruption errors
  const safePlay = (audio: HTMLAudioElement) => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
          playPromise.catch(error => {
              // Ignore AbortError (interrupted by pause/load) as it is expected during rapid interaction
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
    // Set initial volume
    audioRef.current.volume = volume;

    // Cleanup on unmount
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

  // Effect 1: Handle Volume Changes independently
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = volume;
      }
  }, [volume]);

  // Effect 2: Handle Station Changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src !== currentStation.url) {
        audio.src = currentStation.url;
        // If we are currently in a "playing" state, the new source should start playing
        if (isPlaying) {
            safePlay(audio);
        }
    }
  }, [currentStation.url, isPlaying]); // Use URL to check for changes, avoiding object ref issues

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
      setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Station Selector */}
      <select
        value={currentStationId}
        onChange={(e) => {
            setCurrentStationId(e.target.value);
        }}
        className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing} text-sm font-semibold`}
      >
        <optgroup label="Swedish Favorites">
            {DEFAULT_STATIONS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
            ))}
        </optgroup>
        {customStations && customStations.length > 0 && (
            <optgroup label="My Stations">
                {customStations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </optgroup>
        )}
      </select>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
            onClick={togglePlay}
            className={`p-3 rounded-full transition-all shadow-lg flex-shrink-0 ${isPlaying ? themeClasses.buttonPrimary : themeClasses.buttonSecondary} hover:brightness-110`}
        >
            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>

        <div className="flex-1 flex items-center gap-2 bg-black/20 p-2 rounded-lg">
            <SpeakerWaveIcon className={`w-4 h-4 ${themeClasses.iconMuted}`} />
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
        </div>
      </div>

      {/* Visualizer / Status */}
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
