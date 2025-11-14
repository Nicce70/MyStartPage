import React, { useRef, useState } from 'react';
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
  onReset: () => void;
}

const countries = [
  { code: '', name: 'None' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange, themeClasses, onExport, onImport, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('layout');

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
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onSettingsChange({ ...settings, [name]: value });
  };

  const ringColorClass = themeClasses.inputFocusRing.split(' ').find(c => c.startsWith('focus:ring-'))?.replace('focus:', '') || 'ring-indigo-500';

  const tabs = [
    { id: 'layout', name: 'Layout & Appearance' },
    { id: 'features', name: 'Features' },
    { id: 'theme', name: 'Theme' },
    { id: 'backup', name: 'Backup & Restore' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" themeClasses={themeClasses}>
      <div className={`${themeClasses.modalMutedText}`}>
        <div className="border-b border-slate-700 mb-6">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? `border-indigo-500 ${themeClasses.modalText}`
                    : `border-transparent ${themeClasses.modalMutedText} hover:border-slate-400 hover:text-slate-200`
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-h-[350px]">
          {activeTab === 'layout' && (
            <div className="space-y-6">
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
                  max="10"
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
                <label htmlFor="columnWidth" className="block text-sm font-medium">Column Width</label>
                <input
                  type="range"
                  id="columnWidth"
                  name="columnWidth"
                  min="1"
                  max="9"
                  value={settings.columnWidth}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2"
                />
                <div className="flex justify-between text-xs text-slate-400 px-1">
                  <span>Narrow</span>
                  <span>Wide</span>
                </div>
              </div>

              <div>
                <label htmlFor="scale" className="block text-sm font-medium">UI Scale</label>
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
                <label htmlFor="centerContent" className="text-sm font-medium">Center Content</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="centerContent"
                    name="centerContent"
                    checked={settings.centerContent}
                    onChange={handleToggleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
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
                <label htmlFor="holidayCountry" className="block text-sm font-medium">Country for Holidays</label>
                <select
                  id="holidayCountry"
                  name="holidayCountry"
                  value={settings.holidayCountry}
                  onChange={handleTextChange}
                  className={`w-full p-2 mt-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                >
                  {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="showTodos" className="text-sm font-medium">Show To-Do List</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="showTodos"
                    name="showTodos"
                    checked={settings.showTodos}
                    onChange={handleToggleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="pt-6 border-t border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                      <label htmlFor="showWeather" className="text-sm font-medium">Show Weather Widget</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input
                              type="checkbox"
                              id="showWeather"
                              name="showWeather"
                              checked={settings.showWeather}
                              onChange={handleToggleChange}
                              className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                  </div>

                  {settings.showWeather && (
                    <div>
                        <label htmlFor="weatherCity" className="block text-sm font-medium">City</label>
                         <p className="text-xs text-slate-400 mt-1 mb-2">E.g., "London, GB" or "New York"</p>
                        <input
                            type="text"
                            id="weatherCity"
                            name="weatherCity"
                            value={settings.weatherCity}
                            onChange={handleTextChange}
                            placeholder="Enter city name"
                            className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                    </div>
                  )}
              </div>


              <div className="pt-6 border-t border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                    <label htmlFor="showSearch" className="text-sm font-medium">Show Search Bar</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        id="showSearch"
                        name="showSearch"
                        checked={settings.showSearch}
                        onChange={handleToggleChange}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <div>
                    <label htmlFor="searchEngine" className="block text-sm font-medium">Search Engine</label>
                    <select
                    id="searchEngine"
                    name="searchEngine"
                    value={settings.searchEngine}
                    onChange={handleTextChange}
                    className={`w-full p-2 mt-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                    >
                    <option value="google">Google</option>
                    <option value="duckduckgo">DuckDuckGo</option>
                    <option value="bing">Bing</option>
                    <option value="brave">Brave Search</option>
                    </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-700 flex items-center justify-between">
                <label htmlFor="openLinksInNewTab" className="text-sm font-medium">Open links in new tab</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="openLinksInNewTab"
                    name="openLinksInNewTab"
                    checked={settings.openLinksInNewTab}
                    onChange={handleToggleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div>
              <label className="block text-sm font-medium">Theme</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(themes).map(([themeKey, themeData]) => (
                  <button
                    key={themeKey}
                    onClick={() => onSettingsChange({ ...settings, theme: themeKey, backgroundImage: '' })}
                    className={`text-left p-2 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                      settings.theme === themeKey ? `ring-2 ${ringColorClass} border-transparent` : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full ${themeData.body.split(' ')[0]} border border-slate-500 flex-shrink-0`}></div>
                    <span className="text-sm font-medium">{themeData.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-700">
                <label htmlFor="backgroundImage" className="block text-sm font-medium">Custom Background Image URL</label>
                <p className="text-xs text-slate-400 mt-1 mb-2">Paste a direct link to an image to use it as a background.</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="backgroundImage"
                    name="backgroundImage"
                    value={settings.backgroundImage || ''}
                    onChange={(e) => onSettingsChange({ ...settings, backgroundImage: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-15..."
                    className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                  />
                  {settings.backgroundImage && (
                    <button
                      onClick={() => onSettingsChange({ ...settings, backgroundImage: '' })}
                      className={`${themeClasses.buttonSecondary} font-semibold py-2 px-3 rounded-lg transition-colors text-sm`}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div>
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
                <div className="mt-8 pt-6 border-t border-slate-700">
                    <h3 className="text-sm font-medium text-red-400">Reset Application</h3>
                    <p className="text-xs text-slate-400 mt-2 mb-4">This will permanently delete all your columns, links, and settings, and restore the startpage to its default state. This action cannot be undone.</p>
                    <button
                        onClick={onReset}
                        className={`w-full sm:w-auto ${themeClasses.buttonDanger} font-semibold py-2 px-4 rounded-lg transition-colors`}
                    >
                        Reset to Defaults
                    </button>
                </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-700">
          <button type="button" onClick={onClose} className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Done</button>
        </div>

      </div>
    </Modal>
  );
};

export default SettingsModal;