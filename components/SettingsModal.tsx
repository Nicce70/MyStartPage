import React, { useRef } from 'react';
import Modal from './Modal';
import type { Settings } from '../types';
import { themes } from '../themes';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  themeClasses: typeof themes.default;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange, themeClasses, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isFloat = name === 'columnGap';
    onSettingsChange({ ...settings, [name]: isFloat ? parseFloat(value) : parseInt(value, 10) });
  };
  
  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onSettingsChange({ ...settings, [name]: checked });
  };

  const ringColorClass = themeClasses.inputFocusRing.split(' ').find(c => c.startsWith('focus:ring-'))?.replace('focus:', '') || 'ring-indigo-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" themeClasses={themeClasses}>
      <div className={`space-y-6 ${themeClasses.modalMutedText}`}>
        
        <div>
          <label htmlFor="columnGap" className="block text-sm font-medium">Column Gap</label>
          <input
            type="range"
            id="columnGap"
            name="columnGap"
            min="0"
            max="8"
            step="0.5"
            value={settings.columnGap}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2"
          />
          <div className="flex justify-between text-xs text-slate-400 px-1">
            <span>Tight</span>
            <span>Wide</span>
          </div>
        </div>

        <div>
          <label htmlFor="groupGap" className="block text-sm font-medium">Group Gap</label>
          <input
            type="range"
            id="groupGap"
            name="groupGap"
            min="1"
            max="8"
            value={settings.groupGap}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2"
          />
          <div className="flex justify-between text-xs text-slate-400 px-1">
            <span>Tight</span>
            <span>Wide</span>
          </div>
        </div>

        <div>
          <label htmlFor="scale" className="block text-sm font-medium">UI Scale (Default: 6)</label>
          <input
            type="range"
            id="scale"
            name="scale"
            min="1"
            max="11"
            value={settings.scale}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2"
          />
          <div className="flex justify-between text-xs text-slate-400 px-1">
            <span>Smallest</span>
            <span>Largest</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <label htmlFor="showColumnTitles" className="text-sm font-medium">Show Column Titles</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="showColumnTitles"
              name="showColumnTitles"
              checked={settings.showColumnTitles}
              onChange={handleToggleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="showCalendar" className="text-sm font-medium">Show Calendar</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="showCalendar"
              name="showCalendar"
              checked={settings.showCalendar}
              onChange={handleToggleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">Theme</label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(themes).map(([themeKey, themeData]) => (
              <button
                key={themeKey}
                onClick={() => onSettingsChange({ ...settings, theme: themeKey })}
                className={`text-left p-2 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                  settings.theme === themeKey ? `ring-2 ${ringColorClass} border-transparent` : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className={`w-5 h-5 rounded-full ${themeData.body.split(' ')[0]} border border-slate-500 flex-shrink-0`}></div>
                <span className="text-sm font-medium">{themeData.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="border-t border-slate-700 pt-6">
            <h3 className="text-sm font-medium mb-3">Backup & Restore</h3>
            <p className="text-xs text-slate-400 mb-4">Save all your columns, links, and settings to a file, or restore them from a backup.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    onClick={onExport}
                    className={`flex items-center justify-center gap-2 ${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}
                >
                    <ArrowDownTrayIcon />
                    Export Data
                </button>
                <button
                    onClick={handleImportClick}
                    className={`flex items-center justify-center gap-2 ${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}
                >
                    <ArrowUpTrayIcon />
                    Import Data
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onImport}
                    accept="application/json"
                    className="hidden"
                />
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Done</button>
        </div>

      </div>
    </Modal>
  );
};

export default SettingsModal;