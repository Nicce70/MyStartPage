import React, { useRef, useState } from 'react';
import Modal from './Modal';
import type { Settings, Group, Theme } from '../types';
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

const APP_VERSION = '2.3';

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
    { id: 'about', name: 'About' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" themeClasses={themeClasses}>
      <div className={`${themeClasses.modalMutedText}`}>
        <div className="border-b border-slate-700 mb-6">
          <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
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
                <label htmlFor="columnWidth" className="block text-sm font-medium">Global Column Size</label>
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
                  <span>Smaller</span>
                  <span>Larger</span>
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
              <div className="space-y-4">
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
                      className={`${themeClasses.buttonSecondary} font-semibold py-2 px-3 rounded-lg text-sm`}
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
          
          {activeTab === 'about' && (
            <div className="space-y-4 text-sm leading-relaxed max-h-[350px] overflow-y-auto pr-2">
                <h3 className={`text-lg font-bold ${themeClasses.modalText}`}>About My Startpage</h3>
                <p className="text-xs text-slate-400">Version {APP_VERSION}</p>
                
                <div>
                    <h4 className="font-semibold mb-1">How Your Data is Saved</h4>
                    <p>
                        All your settings, links, and widgets are stored directly in your web browser's local storage. 
                        This means your data stays on your device and is not sent to any external server, ensuring your privacy.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-1 text-amber-400">Important: Backup Your Data</h4>
                    <p>
                        Because all data is stored locally, it can be permanently lost if you clear your browser's data, 
                        if the browser has a critical error, or if you switch to a different device.
                    </p>
                    <p className="mt-2">
                        We <strong className="font-bold">strongly recommend</strong> that you regularly use the "Export Data" feature 
                        in the "Backup & Restore" tab to save a backup file of your configuration to a safe place.
                    </p>
                </div>

                <div className="pt-4 border-t border-slate-700">
                    <h4 className="font-semibold mb-1">Running Locally & Open Source</h4>
                    <p>
                        This startpage is fully open-source. You can download the complete source code from GitHub and run it entirely on your own computer.
                    </p>
                    <p className="mt-2">
                        There are two main ways to run it locally:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 mt-2">
                        <li>
                            <strong>Run the source code directly with a development server (recommended for development):</strong><br />
                            This requires Node.js installed on your computer.<br />
                            After downloading, navigate to the project folder in your terminal and run:<br />
                            <code className={`${themeClasses.inputBg} px-1 py-0.5 rounded-md text-xs block mt-1`}>
                                npm install<br />
                                npm run dev
                            </code><br />
                            This starts a local development server (using Vite) that automatically compiles the TypeScript/TSX files and refreshes your browser as you make changes.
                        </li>
                        <li>
                            <strong>Run the compiled static files (suitable for preview or production):</strong><br />
                            The project can be built into static files (usually in a <code>/docs</code> or <code>/dist</code> folder). You can serve these files with any simple static file server, for example Python’s built-in HTTP server:<br />
                            <code className={`${themeClasses.inputBg} px-1 py-0.5 rounded-md text-xs block mt-1`}>python -m http.server</code><br />
                            Navigate into the folder containing the built files before running the command. This method serves the already compiled JavaScript and assets but doesn’t support live updates or editing.
                        </li>
                    </ol>
                </div>

                <div className="pt-4 border-t border-slate-700">
                    <h4 className="font-semibold mb-1">Credits</h4>
                    <p>
                        This is a freeware application created by Niklas Holmgren.
                    </p>
                    <p>
                        Powered by Google AI Studio.
                    </p>
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