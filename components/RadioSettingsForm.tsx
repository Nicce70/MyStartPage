

import React, { useState } from 'react';
import type { Group, Theme, RadioStation } from '../types';
import { PlusIcon, TrashIcon, ArrowPathIcon } from './Icons';

// Simple UUID generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const DEFAULT_STATIONS: RadioStation[] = [
  { id: 'sr-p1', name: 'Sveriges Radio P1', url: 'https://sverigesradio.se/topsy/direkt/srapi/132.mp3' },
  { id: 'sr-p2', name: 'Sveriges Radio P2', url: 'https://sverigesradio.se/topsy/direkt/srapi/163.mp3' },
  { id: 'sr-p3', name: 'Sveriges Radio P3', url: 'https://sverigesradio.se/topsy/direkt/srapi/164.mp3' },
  { id: 'sr-p4-sthlm', name: 'SR P4 Stockholm', url: 'https://sverigesradio.se/topsy/direkt/srapi/701.mp3' },
  { id: 'mix-megapol', name: 'Mix Megapol', url: 'https://live-bauerse-fm.sharp-stream.com/mixmegapol_instream_se_mp3' },
  { id: 'rockklassiker', name: 'Rockklassiker', url: 'https://live-bauerse-fm.sharp-stream.com/rockklassiker_instream_se_mp3' },
  { id: 'bandit-metal', name: 'Bandit Metal', url: 'https://wr03-ice.stream.khz.se/wr03_mp3' },
  { id: 'rix-fm', name: 'Rix FM', url: 'https://fm01-ice.stream.khz.se/fm01_mp3' },
  { id: 'lugna-favoriter', name: 'Lugna Favoriter', url: 'https://fm03-ice.stream.khz.se/fm03_mp3' },
  { id: 'star-fm', name: 'Star FM', url: 'https://fm05-ice.stream.khz.se/fm05_mp3' },
];

interface RadioSettingsFormProps {
  group: Group;
  themeClasses: Theme;
}

const RadioSettingsForm: React.FC<RadioSettingsFormProps> = ({ group, themeClasses }) => {
  const [stations, setStations] = useState<RadioStation[]>(group.widgetSettings?.radioStations || []);

  const handleAddStation = () => {
    const newStation: RadioStation = {
      id: uuidv4(),
      name: 'New Station',
      url: 'https://',
    };
    setStations([...stations, newStation]);
  };

  const handleUpdateStation = (id: string, field: 'name' | 'url', value: string) => {
    setStations(stations.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDeleteStation = (id: string) => {
    setStations(stations.filter(s => s.id !== id));
  };

  const handleMoveStation = (index: number, direction: 'up' | 'down') => {
    const newStations = [...stations];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newStations.length) {
      [newStations[index], newStations[targetIndex]] = [newStations[targetIndex], newStations[index]];
      setStations(newStations);
    }
  };

  const handleReset = () => {
    setStations(DEFAULT_STATIONS);
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name="radioStationsJSON" value={JSON.stringify(stations)} />
      
      <div className="flex justify-between items-center">
        <label className={`block text-sm font-medium ${themeClasses.modalMutedText}`}>My Stations</label>
        <button
            type="button"
            onClick={handleReset}
            className={`flex items-center gap-2 text-xs font-semibold py-1 px-2 rounded-md transition-colors ${themeClasses.buttonSecondary}`}
        >
            <ArrowPathIcon className="w-3 h-3" />
            Reset to Defaults
        </button>
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {stations.map((station, index) => (
          <div key={station.id} className={`p-3 rounded-lg border ${themeClasses.inputBg} border-slate-600 flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={station.name}
                    onChange={(e) => handleUpdateStation(station.id, 'name', e.target.value)}
                    placeholder="Station Name"
                    maxLength={40}
                    className={`flex-1 p-1.5 rounded text-sm ${themeClasses.modalBg} border border-slate-500 focus:border-indigo-500 outline-none`}
                />
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handleMoveStation(index, 'up')} disabled={index === 0} className={`p-1 ${themeClasses.iconMuted} hover:text-white disabled:opacity-30`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                    </button>
                    <button type="button" onClick={() => handleMoveStation(index, 'down')} disabled={index === stations.length - 1} className={`p-1 ${themeClasses.iconMuted} hover:text-white disabled:opacity-30`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </button>
                    <button type="button" onClick={() => handleDeleteStation(station.id)} className={`p-1 text-red-400 hover:text-red-300`}>
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <input
                type="url"
                value={station.url}
                onChange={(e) => handleUpdateStation(station.id, 'url', e.target.value)}
                placeholder="https://... Stream URL"
                className={`w-full p-1.5 rounded text-sm ${themeClasses.modalBg} border border-slate-500 focus:border-indigo-500 outline-none font-mono`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddStation}
        className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-dashed ${themeClasses.dashedBorder} ${themeClasses.textSubtle} hover:border-slate-500 hover:text-slate-300 transition-colors`}
      >
        <PlusIcon className="w-4 h-4" />
        Add Station
      </button>
    </div>
  );
};

export default RadioSettingsForm;