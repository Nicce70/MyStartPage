import React, { useRef, useState } from 'react';
import Modal from './Modal';
import type { Settings, Theme, Dashboard, CustomThemeColors } from '../types';
import { themes } from '../themes';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, SwatchIcon, HeartIcon, ArrowPathIcon, CheckIcon, ExclamationCircleIcon, PlusIcon, TrashIcon, PencilIcon, ChevronDownIcon, ChevronLeftIcon, CogIcon, XMarkIcon } from './Icons';

// Simple UUID generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  pageTitle: string;
  onPageTitleChange: (newTitle: string) => void;
  themeClasses: typeof themes.default;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  dashboards: Dashboard[];
  onDashboardsChange: (newDashboards: Dashboard[]) => void;
  activeDashboardId: string;
  setActiveDashboardId: (id: string) => void;
}

const APP_VERSION = '4.3d';

const HomeySettingsTab: React.FC<{ settings: Settings, onSettingsChange: (newSettings: Settings) => void, themeClasses: Theme }> = ({ settings, onSettingsChange, themeClasses }) => {
    const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testError, setTestError] = useState('');

    const handleHomeyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onSettingsChange({
            ...settings,
            homey: {
                ...settings.homey,
                [name]: name === 'pollingInterval' ? parseInt(value, 10) : value,
            }
        });
    };

    const handleTestConnection = async () => {
        setTestState('testing');
        setTestError('');

        const ip = settings.homey?.localIp;
        const token = settings.homey?.apiToken;

        if (!ip || !token) {
            setTestError('IP Address and Token are required.');
            setTestState('error');
            return;
        }

        const formattedIp = ip.trim().startsWith('http') ? ip.trim() : `http://${ip.trim()}`;
        const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

        try {
            const res = await fetch(`${formattedIp}/api/manager/zones/zone`, { 
                headers: { 'Authorization': `Bearer ${cleanToken}` }
            });
            if (!res.ok) {
                 if (res.status === 0) throw new Error('Connection Refused. Check IP and ensure you are on HTTP.');
                 if (res.status === 401) throw new Error('Unauthorized. Check your API Token.');
                 throw new Error(`API returned status ${res.status}.`);
            }
            setTestState('success');
        } catch (err) {
            setTestError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setTestState('error');
        } finally {
            setTimeout(() => setTestState('idle'), 3000);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-xs text-yellow-200">
                <strong>Requirement:</strong> To connect to Homey on your local network, this dashboard page must be accessed via <strong>HTTP</strong>, not HTTPS. Read more under <strong>About</strong>.
            </div>
            <div>
                <label htmlFor="localIp" className="block text-sm font-medium">Homey Local IP Address</label>
                <input
                    type="text"
                    id="localIp"
                    name="localIp"
                    value={settings.homey?.localIp || ''}
                    onChange={handleHomeyChange}
                    placeholder="192.168.1.x"
                    className={`w-full p-2 mt-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
            </div>
            <div>
                <label htmlFor="apiToken" className="block text-sm font-medium">Personal Access Token</label>
                <input
                    type="password"
                    id="apiToken"
                    name="apiToken"
                    value={settings.homey?.apiToken || ''}
                    onChange={handleHomeyChange}
                    placeholder="Enter your token"
                    className={`w-full p-2 mt-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Get your Personal Access Token from the Homey app: 
                  <span className="font-semibold"> Settings → API Keys → Create New Key</span>.
                </p>
            </div>
             <div>
                <label htmlFor="pollingInterval" className="block text-sm font-medium">Polling Interval (seconds)</label>
                <select
                  id="pollingInterval"
                  name="pollingInterval"
                  value={settings.homey?.pollingInterval ?? 10}
                  onChange={handleHomeyChange}
                  className={`w-full p-2 mt-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                >
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds (Default)</option>
                  <option value={20}>20 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  When websocket is unavailable (live update), polling is used instead (delayed update).                   
                </p>
            </div>

            <div>
                <button
                    onClick={handleTestConnection}
                    className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors ${themeClasses.buttonSecondary} disabled:opacity-50`}
                    disabled={testState === 'testing'}
                >
                    {testState === 'testing' && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                    {testState === 'success' && <CheckIcon className="w-4 h-4" />}
                    {testState === 'error' && <ExclamationCircleIcon className="w-4 h-4" />}
                    {testState === 'idle' ? 'Test Connection' : testState === 'testing' ? 'Testing...' : testState === 'success' ? 'Success!' : 'Failed'}
                </button>
                {testState === 'error' && <p className="text-xs text-red-400 mt-2 text-center">{testError}</p>}
            </div>
        </div>
    );
};

interface DashboardsTabProps {
    dashboards: Dashboard[],
    onDashboardsChange: (d: Dashboard[]) => void,
    activeDashboardId: string,
    setActiveDashboardId: (id: string) => void,
    themeClasses: Theme,
    settings: Settings,
    onSettingsChange: (s: Settings) => void,
    editingDashboardId: string | null;
    setEditingDashboardId: (id: string | null) => void;
}


const DashboardsTab: React.FC<DashboardsTabProps> = ({ 
    dashboards, 
    onDashboardsChange, 
    activeDashboardId, 
    setActiveDashboardId, 
    themeClasses, 
    settings, 
    onSettingsChange,
    editingDashboardId,
    setEditingDashboardId
}) => {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    
    // Edit form state
    const [editName, setEditName] = useState('');
    const [editBgImage, setEditBgImage] = useState('');
    const [editBgColor, setEditBgColor] = useState('');

    const handleAddDashboard = () => {
        const newDashboard: Dashboard = {
            id: uuidv4(),
            name: `Dashboard ${dashboards.length + 1}`,
            columns: [],
        };
        onDashboardsChange([...dashboards, newDashboard]);
        if (dashboards.length === 0) {
            setActiveDashboardId(newDashboard.id);
        }
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newDashboards = [...dashboards];
        if (direction === 'up' && index > 0) {
            [newDashboards[index - 1], newDashboards[index]] = [newDashboards[index], newDashboards[index - 1]];
        } else if (direction === 'down' && index < newDashboards.length - 1) {
            [newDashboards[index], newDashboards[index + 1]] = [newDashboards[index + 1], newDashboards[index]];
        }
        onDashboardsChange(newDashboards);
    };

    const startEditing = (dashboard: Dashboard) => {
        setEditingDashboardId(dashboard.id);
        setEditName(dashboard.name);
        setEditBgImage(dashboard.backgroundImage || '');
        setEditBgColor(dashboard.customBackgroundColor || '');
    };

    const saveEditing = () => {
        if (!editingDashboardId) return;
        
        onDashboardsChange(dashboards.map(d => {
            if (d.id === editingDashboardId) {
                return {
                    ...d,
                    name: editName,
                    backgroundImage: editBgImage,
                    customBackgroundColor: editBgColor
                };
            }
            return d;
        }));
        setEditingDashboardId(null);
    };

    const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onSettingsChange({ ...settings, dashboardView: e.target.value as 'dropdown' | 'tabs' });
    };

    // Sub-screen for editing specific dashboard settings
    if (editingDashboardId) {
        return (
            <div className="space-y-4">
                <button onClick={() => setEditingDashboardId(null)} className={`flex items-center gap-1 text-sm ${themeClasses.modalMutedText} ${themeClasses.buttonIconHoverText} mb-2`}>
                    <ChevronLeftIcon className="w-4 h-4" /> Back to List
                </button>
                <h3 className={`font-bold ${themeClasses.modalText}`}>Edit Dashboard</h3>
                
                <div>
                    <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Name</label>
                    <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                    />
                </div>
                <div>
                    <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Background Image URL</label>
                    <input 
                        type="text" 
                        value={editBgImage} 
                        onChange={(e) => setEditBgImage(e.target.value)} 
                        placeholder="https://..."
                        className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                    />
                </div>
                <div>
                    <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Background Color</label>
                    <div className="flex gap-2">
                        <input 
                            type="color" 
                            value={editBgColor || '#000000'} 
                            onChange={(e) => setEditBgColor(e.target.value)} 
                            className="h-10 w-12 bg-transparent border-0 p-0 cursor-pointer rounded"
                        />
                        <input 
                            type="text" 
                            value={editBgColor} 
                            onChange={(e) => setEditBgColor(e.target.value)} 
                            placeholder="#..."
                            className={`flex-1 p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-700 flex justify-end">
                    <button onClick={saveEditing} className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg`}>Save Changes</button>
                </div>
            </div>
        );
    }

    // Main list view
    return (
        <div className="space-y-6">
            <div>
                <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Navigation Style</label>
                <select 
                    value={settings.dashboardView} 
                    onChange={handleViewChange} 
                    className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                >
                    <option value="dropdown">Dropdown Menu</option>
                    <option value="tabs">Tabs</option>
                </select>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {dashboards.map((d, index) => (
                    <div key={d.id} className={`flex items-center gap-2 p-2 rounded-md ${themeClasses.inputBg} border border-transparent hover:border-slate-600`}>
                        {confirmDeleteId === d.id ? (
                            <div className="flex-1 flex items-center justify-between animate-fade-in px-1">
                                <span className="text-sm text-red-400 font-semibold truncate">Delete "{d.name}"?</span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => {
                                            const newDashboards = dashboards.filter(dash => dash.id !== d.id);
                                            onDashboardsChange(newDashboards);
                                            if (activeDashboardId === d.id) {
                                                setActiveDashboardId(newDashboards[0]?.id || '');
                                            }
                                            setConfirmDeleteId(null);
                                        }}
                                        className={`p-1 rounded bg-red-600 text-white hover:bg-red-500 transition-colors`}
                                        title="Confirm Delete"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setConfirmDeleteId(null)}
                                        className={`p-1 rounded bg-slate-600 text-white hover:bg-slate-500 transition-colors`}
                                        title="Cancel"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <span className="flex-1 font-medium truncate pl-2">{d.name}</span>
                                
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className={`p-1 rounded-full transition-colors disabled:opacity-30 ${themeClasses.iconMuted} ${themeClasses.buttonIconHoverText} ${themeClasses.buttonIconHoverBg}`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg></button>
                                    <button onClick={() => handleMove(index, 'down')} disabled={index === dashboards.length - 1} className={`p-1 rounded-full transition-colors disabled:opacity-30 ${themeClasses.iconMuted} ${themeClasses.buttonIconHoverText} ${themeClasses.buttonIconHoverBg}`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button>
                                </div>
                                
                                <div className="h-4 w-px bg-slate-600 mx-1"></div>
                                
                                <button onClick={() => startEditing(d)} className={`p-1 rounded-full transition-colors ${themeClasses.iconMuted} ${themeClasses.buttonIconHoverText} ${themeClasses.buttonIconHoverBg}`} title="Settings">
                                    <CogIcon className="w-4 h-4" />
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        if (dashboards.length <= 1) {
                                            alert("You cannot delete the last dashboard.");
                                            return;
                                        }
                                        setConfirmDeleteId(d.id);
                                    }}
                                    className={`p-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.iconMuted} hover:text-red-400 ${themeClasses.buttonIconHoverBg}`} 
                                    disabled={dashboards.length <= 1} 
                                    title="Delete"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <button onClick={handleAddDashboard} className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-dashed ${themeClasses.dashedBorder} ${themeClasses.textSubtle} hover:border-slate-500 hover:text-slate-300 transition-colors`}>
                <PlusIcon className="w-4 h-4" /> Add Dashboard
            </button>
        </div>
    );
};


export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  pageTitle,
  onPageTitleChange,
  themeClasses,
  onExport,
  onImport,
  onReset,
  dashboards,
  onDashboardsChange,
  activeDashboardId,
  setActiveDashboardId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('layout');
  const [customColors, setCustomColors] = useState<CustomThemeColors>(settings.customThemeColors);
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null);

  const handleClose = () => {
    setEditingDashboardId(null);
    onClose();
  };

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

  const handleNumberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    onSettingsChange({ ...settings, [name]: parseInt(value, 10) });
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newColors = { ...customColors, [name]: value };
    setCustomColors(newColors);
    onSettingsChange({ ...settings, customThemeColors: newColors });
  };

  const ringColorClass = themeClasses.inputFocusRing.split(' ').find(c => c.startsWith('focus:ring-'))?.replace('focus:', '') || 'ring-indigo-500';

  const tabs = [
    { id: 'layout', name: 'Layout & Appearance' },
    { id: 'dashboards', name: 'Dashboards' },
    { id: 'features', name: 'Features' },
    { id: 'theme', name: 'Theme' },
    { id: 'homey', name: 'Homey' },
    { id: 'backup', name: 'Backup & Restore' },
    { id: 'about', name: 'About' },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Global Settings" 
      themeClasses={themeClasses} 
      hideOverlay={activeTab === 'theme' && settings.theme === 'custom'}
    >
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
                    : `border-transparent ${themeClasses.modalMutedText} hover:border-slate-400 ${themeClasses.buttonIconHoverText}`
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
                <label htmlFor="pageTitle" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Page Title</label>
                <input type="text" id="pageTitle" name="pageTitle" value={pageTitle} onChange={(e) => onPageTitleChange(e.target.value)} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
              </div>
              
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

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-700">
                <label htmlFor="showGroupToggles" className="text-sm font-medium">Show Collapse Arrows</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="showGroupToggles"
                    name="showGroupToggles"
                    checked={settings.showGroupToggles ?? true}
                    onChange={handleToggleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'dashboards' && (
              <DashboardsTab 
                dashboards={dashboards} 
                onDashboardsChange={onDashboardsChange} 
                activeDashboardId={activeDashboardId} 
                setActiveDashboardId={setActiveDashboardId} 
                themeClasses={themeClasses}
                settings={settings}
                onSettingsChange={onSettingsChange}
                editingDashboardId={editingDashboardId}
                setEditingDashboardId={setEditingDashboardId}
              />
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

              <div className="pt-6 border-t border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                    <label htmlFor="showQuotes" className="text-sm font-medium">Daily Quotes</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        id="showQuotes"
                        name="showQuotes"
                        checked={settings.showQuotes}
                        onChange={handleToggleChange}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
                
                {settings.showQuotes && (
                    <div className="space-y-3 pl-2 border-l-2 border-slate-700">
                        <div>
                            <label htmlFor="quoteCategory" className="block text-sm font-medium">Category</label>
                            <select
                                id="quoteCategory"
                                name="quoteCategory"
                                value={settings.quoteCategory}
                                onChange={handleTextChange}
                                className={`w-full p-2 mt-1 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                            >
                                <option value="inspirational">Inspirational</option>
                                <option value="programming">Programming & Tech</option>
                                <option value="philosophy">Philosophy</option>
                                <option value="funny">Fun & Witty</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="quoteFrequency" className="block text-sm font-medium">Update Frequency</label>
                            <select
                                id="quoteFrequency"
                                name="quoteFrequency"
                                value={settings.quoteFrequency}
                                onChange={handleTextChange}
                                className={`w-full p-2 mt-1 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                            >
                                <option value="daily">Daily</option>
                                <option value="always">Every Page Load</option>
                            </select>
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium">Select Theme</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(themes).map(([themeKey, themeData]) => (
                    <button
                      key={themeKey}
                      onClick={() => onSettingsChange({ ...settings, theme: themeKey })}
                      className={`text-left p-2 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        settings.theme === themeKey ? `ring-2 ${ringColorClass} border-transparent shadow-lg scale-105` : 'border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${themeData.body} border border-slate-500 flex-shrink-0`}></div>
                      <span className="text-sm font-medium">{themeData.name}</span>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => onSettingsChange({ ...settings, theme: 'custom' })}
                    className={`text-left p-2 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      settings.theme === 'custom' ? `ring-2 ${ringColorClass} border-transparent shadow-lg scale-105` : 'border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 border border-slate-500 flex-shrink-0 text-white`}>
                        <SwatchIcon className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-medium">Custom</span>
                  </button>
                </div>
              </div>

              {settings.theme === 'custom' && (
                <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/50 animate-fade-in-up">
                    <h4 className="text-sm font-bold mb-3 text-indigo-400 uppercase tracking-wider">Custom Theme Editor</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="background" className="block text-xs font-medium mb-1 text-slate-400">Body Background</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    name="background"
                                    id="background"
                                    value={settings.customThemeColors.background}
                                    onChange={handleCustomColorChange}
                                    className="h-9 w-12 bg-transparent border-0 p-0 cursor-pointer rounded" 
                                />
                                <input 
                                    type="text"
                                    value={settings.customThemeColors.background}
                                    readOnly
                                    className={`flex-1 px-2 text-xs rounded ${themeClasses.inputBg} border-none font-mono uppercase`}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="panel" className="block text-xs font-medium mb-1 text-slate-400">Panel Background</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    name="panel"
                                    id="panel"
                                    value={settings.customThemeColors.panel}
                                    onChange={handleCustomColorChange}
                                    className="h-9 w-12 bg-transparent border-0 p-0 cursor-pointer rounded" 
                                />
                                <input 
                                    type="text"
                                    value={settings.customThemeColors.panel}
                                    readOnly
                                    className={`flex-1 px-2 text-xs rounded ${themeClasses.inputBg} border-none font-mono uppercase`}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="primary" className="block text-xs font-medium mb-1 text-slate-400">Primary Color</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    name="primary"
                                    id="primary"
                                    value={settings.customThemeColors.primary}
                                    onChange={handleCustomColorChange}
                                    className="h-9 w-12 bg-transparent border-0 p-0 cursor-pointer rounded" 
                                />
                                <input 
                                    type="text"
                                    value={settings.customThemeColors.primary}
                                    readOnly
                                    className={`flex-1 px-2 text-xs rounded ${themeClasses.inputBg} border-none font-mono uppercase`}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="secondary" className="block text-xs font-medium mb-1 text-slate-400">Secondary Color</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    name="secondary"
                                    id="secondary"
                                    value={settings.customThemeColors.secondary}
                                    onChange={handleCustomColorChange}
                                    className="h-9 w-12 bg-transparent border-0 p-0 cursor-pointer rounded" 
                                />
                                <input 
                                    type="text"
                                    value={settings.customThemeColors.secondary}
                                    readOnly
                                    className={`flex-1 px-2 text-xs rounded ${themeClasses.inputBg} border-none font-mono uppercase`}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="text" className="block text-xs font-medium mb-1 text-slate-400">Text Color</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    name="text"
                                    id="text"
                                    value={settings.customThemeColors.text}
                                    onChange={handleCustomColorChange}
                                    className="h-9 w-12 bg-transparent border-0 p-0 cursor-pointer rounded" 
                                />
                                <input 
                                    type="text"
                                    value={settings.customThemeColors.text}
                                    readOnly
                                    className={`flex-1 px-2 text-xs rounded ${themeClasses.inputBg} border-none font-mono uppercase`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'homey' && (
            <HomeySettingsTab settings={settings} onSettingsChange={onSettingsChange} themeClasses={themeClasses} />
          )}

          {activeTab === 'backup' && (
            <div>
                <h3 className="text-sm font-medium mb-3">Backup & Restore</h3>
                <p className="text-xs text-slate-400 mb-4">Save all your columns, links, and settings to a file, or restore them from a backup.</p>
                
                <div className="mb-6">
                    <label htmlFor="backupReminderInterval" className="block text-sm font-medium mb-1">Remind me to backup:</label>
                    <select
                      id="backupReminderInterval"
                      name="backupReminderInterval"
                      value={settings.backupReminderInterval ?? 30}
                      onChange={handleNumberChange}
                      className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                    >
                      <option value="0">Never</option>
                      <option value={7}>Every 7 days</option>
                      <option value={14}>Every 14 days</option>
                      <option value={30}>Every 30 days</option>
                    </select>
                </div>

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
            <div className="space-y-4 text-sm leading-relaxed max-h-[350px] overflow-y-auto pr-2 overscroll-contain">
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
                    <h4 className="font-semibold mb-2 text-red-400 flex items-center gap-2">
                        <HeartIcon className="w-4 h-4" />
                        Donate to Cat Shelter
                    </h4>
                    <p className="mb-3">
                        This app is free! If you find it useful, please consider making a small donation to help cats in need.
                    </p>
                    <button
                        onClick={() => window.open('https://www.paypal.com/us/fundraiser/charity/4858974', '_blank')}
                        className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-md text-xs font-bold ${themeClasses.buttonPrimary} transition-colors`}
                    >
                        <HeartIcon className="w-3 h-3" />
                        Donate via PayPal
                    </button>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <h4 className="font-semibold mb-1">Run Locally</h4>

                  <p>You can download the full source code from <a href="https://github.com/Nicce70/MyStartPage" target="_blank" rel="noopener noreferrer" className="underline">GitHub</a> and run it on your own computer.</p>

                  <p className="mt-2">Two simple ways to run it:</p>

                  <ol className="list-decimal list-inside space-y-2 mt-2">

                      <li>
                          <strong>Development mode (recommended):</strong><br />
                          a. Download and install <b><a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="underline">Node.js</a></b><br />
                          b. Download the project from GitHub and open the folder in a terminal.<br />
                          c. Run these commands:<br />
                          <code className={`${themeClasses.inputBg} px-1 py-0.5 rounded-md text-xs block mt-1`}>
                              npm install<br />
                              npm install socket.io-client - Only for Homey Widget<br />
                              npm run dev
                          </code><br />
                          A local server starts and the page opens automatically in your browser.
                      </li>

                      <li>
                          <strong>Run static build (preview / no editing):</strong><br />
                          a. Build the project:<br />
                          <code className={`${themeClasses.inputBg} px-1 py-0.5 rounded-md text-xs block mt-1`}>
                              npm run build
                          </code>
                          b. Go to the created <code>/dist</code> or <code>/docs</code> folder and run:<br />
                          <code className={`${themeClasses.inputBg} px-1 py-0.5 rounded-md text-xs block mt-1`}>
                              python -m http.server
                          </code>
                          c. Open the address shown in the terminal (e.g. <i>http://localhost:8000</i>).
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

        <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-700">
          <span className={`text-xs ${themeClasses.textSubtle}`}>
            Version {APP_VERSION}
          </span>
          <div className="flex justify-end gap-3">
            {!editingDashboardId && (
              <button type="button" onClick={handleClose} className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Done</button>
            )}
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default SettingsModal;