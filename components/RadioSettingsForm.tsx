
import React, { useState, useEffect } from 'react';
import type { Group, Theme, RadioStation } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

// Simple UUID generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface RadioSettingsFormProps {
  group: Group;
  themeClasses: Theme;
}

const RadioSettingsForm: React.FC<RadioSettingsFormProps> = ({ group, themeClasses }) => {
  // Initialize with existing custom stations or an empty array (we don't save default stations here)
  const [stations, setStations] = useState<RadioStation[]>(group.widgetSettings?.radioStations || []);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAddStation = () => {
    if (!newName || !newUrl) return;
    
    // Ensure HTTPS
    let secureUrl = newUrl;
    if (secureUrl.startsWith('http:')) {
        secureUrl = secureUrl.replace('http:', 'https:');
    }

    const newStation: RadioStation = {
      id: uuidv4(),
      name: newName,
      url: secureUrl,
    };
    setStations([...stations, newStation]);
    setNewName('');
    setNewUrl('');
  };

  const handleDeleteStation = (id: string) => {
    setStations(stations.filter(s => s.id !== id));
  };

  // Update the hidden input field for the parent form handler
  useEffect(() => {
      const hiddenInput = document.getElementById('radioStationsJSON') as HTMLInputElement;
      if(hiddenInput) {
          hiddenInput.value = JSON.stringify(stations);
      }
  }, [stations]);

  // We need to render a hidden input to pass the data back to App.tsx's handleFormSubmit
  // However, React state updates are async, so we use a key trick or just rely on the input being present.
  // A better way in this architecture is to update the DOM element directly or use a ref if available, 
  // but since we are inside a form managed by App.tsx, we'll use a hidden input.

  return (
    <div className="space-y-6">
      {/* Hidden input for form submission */}
      <input type="hidden" id="radioStationsJSON" name="radioStationsJSON" value={JSON.stringify(stations)} />

      {/* List Existing Custom Stations */}
      <div>
        <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-2`}>My Custom Stations</label>
        {stations.length === 0 ? (
            <div className={`text-sm ${themeClasses.textSubtle} italic mb-2`}>No custom stations added yet.</div>
        ) : (
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-1 mb-2">
                {stations.map((station) => (
                    <li key={station.id} className={`flex justify-between items-center p-2 rounded-md ${themeClasses.inputBg} border border-slate-600`}>
                        <div className="truncate pr-2">
                            <div className="font-semibold text-sm">{station.name}</div>
                            <div className={`text-xs ${themeClasses.textSubtle} truncate`}>{station.url}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleDeleteStation(station.id)}
                            className={`p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors`}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </li>
                ))}
            </ul>
        )}
      </div>

      {/* Add New Station */}
      <div className={`p-3 rounded-lg border ${themeClasses.dashedBorder} bg-black/20`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider ${themeClasses.modalMutedText} mb-3`}>Add New Station</h4>
        <div className="space-y-3">
            <div>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Station Name (e.g. Cool FM)"
                    className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
            </div>
            <div>
                <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Stream URL (https://...)"
                    className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
                <p className="text-xs text-slate-500 mt-1">Must be a direct stream link (mp3/aac) via HTTPS.</p>
            </div>
            <button
                type="button"
                onClick={handleAddStation}
                disabled={!newName || !newUrl}
                className={`w-full flex items-center justify-center gap-2 p-2 rounded-md font-semibold text-sm ${themeClasses.buttonSecondary} disabled:opacity-50`}
            >
                <PlusIcon className="w-4 h-4" />
                Add Station
            </button>
        </div>
      </div>
    </div>
  );
};

export default RadioSettingsForm;