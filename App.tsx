import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ColumnComponent from './components/Column';
import SettingsModal from './components/SettingsModal';
import Modal from './components/Modal';
import ColorSelector from './components/ColorSelector';
import CurrencySettingsForm from './components/CurrencySettingsForm';
import WebhookSettingsForm from './components/WebhookSettingsForm';
import HomeySettingsForm from './components/HomeySettingsForm';
import RadioSettingsForm from './components/RadioSettingsForm';
import FavoritesSettingsForm from './components/FavoritesSettingsForm';
import PictureSettingsForm from './components/PictureSettingsForm';
import IframeSettingsForm from './components/IframeSettingsForm';
import DonationPopup from './components/DonationPopup';
import QuotePopup from './components/QuotePopup';
import HomeyItemSelector from './components/HomeyItemSelector';
import HomeyCustomSettingsForm from './components/HomeyCustomSettingsForm';
import LinkGroupPopup from './components/LinkGroupPopup';
import { PlusIcon, PencilIcon, CogIcon, MagnifyingGlassIcon, SunIcon, ClockIcon, TimerIcon, RssIcon, LinkIcon, ClipboardDocumentCheckIcon, CalculatorIcon, DocumentTextIcon, MinusIcon, PartyPopperIcon, CalendarDaysIcon, BanknotesIcon, BoltIcon, ScaleIcon, ExclamationTriangleIcon, WifiIcon, MoonIcon, HomeIcon, RadioIcon, HeartIcon, HeartIconSolid, PhotoIcon, WindowIcon, SquaresPlusIcon, LightBulbIcon, PlayIcon, CpuChipIcon, ChevronDownIcon } from './components/Icons';
import useLocalStorage from './hooks/useLocalStorage';
import { themes, generateCustomTheme } from './themes';
import ThemeStyles from './components/ThemeStyles';
import type { Dashboard, Column, Group, Link, Settings, ModalState, BackupData, Theme, ToDoItem, CalculatorState, GroupItemType, AnyItemType, DraggedItem, ButtonHolderItem, FlowButton, RadioStation } from './types';
import { CALENDAR_WIDGET_ID, TODO_WIDGET_ID, CALCULATOR_WIDGET_ID, WEATHER_WIDGET_ID } from './types';
// @ts-ignore
import { io } from "socket.io-client";

// Simple UUID generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const DEFAULT_DASHBOARD: Dashboard = {
  id: uuidv4(),
  name: "Home",
  columns: [
      {
        id: uuidv4(),
        name: "Entertainment",
        width: 3,
        groups: [
          {
            id: uuidv4(),
            name: "Music",
            items: [
              { id: uuidv4(), type: 'link', name: "Spotify", url: "https://spotify.com", comment: "Spotify" },
              { id: uuidv4(), type: 'link', name: "YouTube Music", url: "https://music.youtube.com/" },
            ],
            type: 'links',
          },
        ]
      },
      {
        id: uuidv4(),
        name: "Social",
        width: 3,
        groups: [
          {
            id: uuidv4(),
            name: "General",
            items: [
              { id: uuidv4(), type: 'link', name: "Reddit", url: "https://reddit.com" },
              { id: uuidv4(), type: 'link', name: "Bluesky", url: "https://bsky.social/about" },
            ],
            type: 'links'
          },
        ]
      }
  ]
};

const DEFAULT_RADIO_STATIONS: RadioStation[] = [
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

const runDataMigrationAndValidation = (dashboardsData: any, oldColumnsData: any): Dashboard[] => {
  // If dashboardsData is valid, use it
  if (Array.isArray(dashboardsData) && dashboardsData.length > 0 && dashboardsData[0].columns) {
    // Basic validation
    return dashboardsData.map(d => ({
        id: d.id || uuidv4(),
        name: d.name || 'Dashboard',
        columns: Array.isArray(d.columns) ? d.columns : [],
        backgroundImage: d.backgroundImage,
        customBackgroundColor: d.customBackgroundColor,
    }));
  }

  // If dashboardsData is empty/invalid, check for old columns data
  if (Array.isArray(oldColumnsData) && oldColumnsData.length > 0) {
    console.log("Migrating old 'columns' data to new dashboard structure.");
    return [{
        id: uuidv4(),
        name: "Home",
        columns: oldColumnsData.map(col => {
            if (!col || typeof col !== 'object' || !col.id) return null;
            const groups = Array.isArray(col.groups) ? col.groups.map(group => {
                if (!group || typeof group !== 'object' || !group.id) return null;
                let items = group.items;
                if (Array.isArray(group.links) && !items) {
                    items = group.links.map((link: any) => ({ ...link, type: 'link' as const }));
                }
                if (!Array.isArray(items)) {
                    items = [];
                } else {
                    items = items.filter(item => item && typeof item === 'object' && item.id && item.type);
                }
                const migratedGroup = { ...group, items };
                delete migratedGroup.links;
                return migratedGroup;
            }).filter(Boolean) : [];
            return { ...col, groups };
        }).filter(Boolean)
    }];
  }

  // If nothing exists, return default
  console.warn('No valid data found in localStorage, resetting to default dashboard.');
  return [DEFAULT_DASHBOARD];
};

const DEFAULT_SETTINGS: Settings = {
  columnGap: 4,
  groupGap: 4,
  columnWidth: 4,
  showColumnTitles: true,
  theme: 'default',
  customThemeColors: {
    background: '#0f172a', // slate-900
    panel: '#1e293b',      // slate-800
    primary: '#6366f1',    // indigo-500
    secondary: '#475569',  // slate-600
    text: '#f1f5f9',       // slate-100
  },
  scale: 6,
  openLinksInNewTab: true,
  showSearch: false,
  searchEngine: 'google',
  centerContent: false,
  showGroupToggles: true,
  backupReminderInterval: 30,
  showQuotes: false,
  quoteCategory: 'inspirational',
  quoteFrequency: 'daily',
  homey: {
    localIp: '',
    apiToken: '',
    pollingInterval: 10,
  },
  dashboardView: 'dropdown',
};

const sanitizeSettings = (data: any): Settings => {
  const cleanSettings = { ...DEFAULT_SETTINGS };
  const validKeys = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    validKeys.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
         // @ts-ignore
         cleanSettings[key] = data[key];
      }
    });
  }
  return cleanSettings;
};

const scaleMap: { [key: number]: string } = {
  1: '10px',
  2: '10.5px',
  3: '11px',
  4: '11.5px',
  5: '12px',
  6: '12.5px',
  7: '13px',
  8: '13.5px',
  9: '14px',
  10: '14.5px',
  11: '15px',
};

const searchEngines: { [key: string]: { name: string; url: string; home: string } } = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=', home: 'https://www.google.com' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', home: 'https://duckduckgo.com' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=', home: 'https://www.bing.com' },
  brave: { name: 'Brave Search', url: 'https://search.brave.com/search?q=', home: 'https://search.brave.com' },
};

const timezones = (Intl as any).supportedValuesOf?.('timeZone') ?? [Intl.DateTimeFormat().resolvedOptions().timeZone];

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

const baseWidthsInRem: { [key: number]: number } = { 1: 15, 2: 18, 3: 20, 4: 24, 5: 28 };
const globalMultipliers: { [key: number]: number } = { 1: 0.8, 2: 0.85, 3: 0.9, 4: 1.0, 5: 1.1, 6: 1.2, 7: 1.3, 8: 1.4, 9: 1.5 };

const TimerSettingsForm: React.FC<{
  group: Group;
  themeClasses: Theme;
}> = ({ group, themeClasses }) => {
  const [isStopwatch, setIsStopwatch] = useState(group.widgetSettings?.isStopwatch ?? false);
  const isInputsDisabled = isStopwatch;

  let defaultH, defaultM, defaultS, defaultPlaySound, defaultOvertime;
  
  if (isStopwatch) {
    defaultH = 0;
    defaultM = 0;
    defaultS = 0;
    defaultPlaySound = false;
    defaultOvertime = false;
  } else {
    const savedDuration = group.widgetSettings?.timerDuration;
    if (savedDuration === 0) {
        defaultH = 0;
        defaultM = 5;
        defaultS = 0;
        defaultPlaySound = true;
        defaultOvertime = false;
    } else {
        const duration = savedDuration ?? 300;
        defaultH = Math.floor(duration / 3600);
        defaultM = Math.floor((duration % 3600) / 60);
        defaultS = duration % 60;
        defaultPlaySound = group.widgetSettings?.timerPlaySound ?? true;
        defaultOvertime = group.widgetSettings?.timerOvertime ?? false;
    }
  }

  return (
    <div key={String(isStopwatch)}>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
        <label htmlFor="isStopwatch" className="text-sm font-medium">Stopwatch Mode</label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="isStopwatch"
            name="isStopwatch"
            checked={isStopwatch}
            onChange={() => setIsStopwatch(prev => !prev)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <p className="text-xs text-slate-400 mb-4 -mt-2">Enable to count up from zero. Disable to count down from a set time.</p>

      <div className={`grid grid-cols-3 gap-4 transition-opacity ${isInputsDisabled ? 'opacity-50' : ''}`}>
        <div>
          <label htmlFor="hours" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Hours</label>
          <input type="number" id="hours" name="hours" defaultValue={defaultH} min="0" max="23" disabled={isInputsDisabled} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
        </div>
        <div>
          <label htmlFor="minutes" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Minutes</label>
          <input type="number" id="minutes" name="minutes" defaultValue={defaultM} min="0" max="59" disabled={isInputsDisabled} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
        </div>
        <div>
          <label htmlFor="seconds" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Seconds</label>
          <input type="number" id="seconds" name="seconds" defaultValue={defaultS} min="0" max="59" disabled={isInputsDisabled} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
        </div>
      </div>
      
      <div className={`flex items-center justify-between pt-4 mt-4 border-t border-slate-700 transition-opacity ${isInputsDisabled ? 'opacity-50' : ''}`}>
        <label htmlFor="timerPlaySound" className="text-sm font-medium">Play Sound on Finish</label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="timerPlaySound"
            name="timerPlaySound"
            defaultChecked={defaultPlaySound}
            disabled={isInputsDisabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {!isStopwatch && (
        <div className={`flex items-center justify-between pt-4 mt-4 border-t border-slate-700 transition-opacity ${isInputsDisabled ? 'opacity-50' : ''}`}>
            <label htmlFor="timerOvertime" className="text-sm font-medium">Count up after finish (Overtime)</label>
            <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                id="timerOvertime"
                name="timerOvertime"
                defaultChecked={defaultOvertime}
                disabled={isInputsDisabled}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
      )}
    </div>
  );
};

const WeatherSettingsForm: React.FC<{
  group: Group;
  themeClasses: Theme;
}> = ({ group, themeClasses }) => {
  const [showTime, setShowTime] = useState(group.widgetSettings?.weatherShowTime ?? false);
  const currentCity = group.widgetSettings?.city || '';
  const currentShowForecast = group.widgetSettings?.weatherShowForecast ?? false;
  const currentTimezone = group.widgetSettings?.weatherTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="city" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>City</label>
        <input
          type="text"
          id="city"
          name="city"
          defaultValue={currentCity}
          required
          placeholder="e.g. Paris, FR"
          className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
        />
        <p className="text-xs text-slate-500 mt-1">
          Use City, Country Code (e.g. Lund, SE) if there are multiple cities with the same name.
        </p>
      </div>
      <div className="flex items-center justify-between pt-2">
        <label htmlFor="weatherShowForecast" className="text-sm font-medium">Show 2-day forecast</label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="weatherShowForecast"
            name="weatherShowForecast"
            defaultChecked={currentShowForecast}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-700">
        <label htmlFor="weatherUpdateInterval" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Update Interval (minutes)</label>
        <input
          type="number"
          id="weatherUpdateInterval"
          name="weatherUpdateInterval"
          defaultValue={group.widgetSettings?.weatherUpdateInterval ?? 60}
          min="0"
          max="999"
          className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
        />
        <p className="text-xs text-slate-500 mt-1">Set to 0 to disable auto-updates. Data is cached for 30 mins to prevent excessive requests.</p>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="weatherShowTime" className="text-sm font-medium">Show local time</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="weatherShowTime"
              name="weatherShowTime"
              checked={showTime}
              onChange={(e) => setShowTime(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {showTime && (
          <div>
            <label htmlFor="weatherTimezone" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Timezone</label>
            <select
              id="weatherTimezone"
              name="weatherTimezone"
              defaultValue={currentTimezone}
              required
              className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing} max-h-60`}
            >
              {timezones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

const DragGhost = ({ children, x, y }: { children?: React.ReactNode, x: number, y: number }) => {
  if (!children) return null;
  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-50 opacity-80"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      {children}
    </div>
  );
};

const GlobalDragStyles = () => (
    <style>{`
        body.dragging, body.dragging * {
            cursor: grabbing !important;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
    `}</style>
);


function App() {
  const [rawDashboards, setDashboards] = useLocalStorage<Dashboard[]>('startpage-dashboards', []);
  const [oldColumnsData] = useLocalStorage<Column[]>('startpage-columns', []);
  const [activeDashboardId, setActiveDashboardId] = useLocalStorage<string>('startpage-active-dashboard-id', '');
  
  const [rawSettings, setSettings] = useLocalStorage<Settings>('startpage-settings', DEFAULT_SETTINGS);
  const [pageTitle, setPageTitle] = useLocalStorage<string>('startpage-title', 'My Startpage');
  const [todos, setTodos] = useLocalStorage<ToDoItem[]>('startpage-todos', []);
  const [lastBackupDate, setLastBackupDate] = useLocalStorage<string>('startpage-last-backup', '');
  const [installDate, setInstallDate] = useLocalStorage<string>('startpage-install-date', '');
  const [linkGroupPopupData, setLinkGroupPopupData] = useState<{ group: Group; columnId: string } | null>(null);

  const dashboards = useMemo(() => runDataMigrationAndValidation(rawDashboards, oldColumnsData), [rawDashboards, oldColumnsData]);
  const settings = useMemo(() => sanitizeSettings(rawSettings), [rawSettings]);
  
  const activeDashboard = useMemo(() => dashboards.find(d => d.id === activeDashboardId) || dashboards[0], [dashboards, activeDashboardId]);
  
  // Universal Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragGhost, setDragGhost] = useState<React.ReactNode | null>(null);
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const [currentDropTarget, setCurrentDropTarget] = useState<{ columnId: string; groupId?: string; itemId?: string } | null>(null);
  
  const longPressTimeout = useRef<number | null>(null);
  const dragStartCoords = useRef<{ x: number, y: number } | null>(null);
  const isPendingDrag = useRef(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [themeClasses, setThemeClasses] = useState<Theme>(themes.default);
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState(''); // For link form validation
  
  const formRef = useRef<HTMLFormElement>(null);
  const collapsedGroupsBeforeEdit = useRef<Set<string>>(new Set());
  const dashboardDropdownRef = useRef<HTMLDivElement>(null);
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);

  // Centering & Firefox-specific logic
  const isFirefox = useMemo(() => navigator.userAgent.toLowerCase().includes('firefox'), []);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Sync dashboards back to localStorage if migration occurred
    if (JSON.stringify(rawDashboards) !== JSON.stringify(dashboards)) {
        setDashboards(dashboards);
        // Clean up old columns data after migration
        localStorage.removeItem('startpage-columns');
    }
    // Set active dashboard ID if it's missing
    if (!activeDashboardId || !dashboards.some(d => d.id === activeDashboardId)) {
        setActiveDashboardId(dashboards[0]?.id || '');
    }
  }, [dashboards, rawDashboards, setDashboards, activeDashboardId, setActiveDashboardId]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculatedContentWidth = useMemo(() => {
    if (!isFirefox || !settings.centerContent || isEditMode || !activeDashboard) {
        return null;
    }

    const rootFontSizePx = parseFloat(scaleMap[settings.scale] || '12.5px');

    const totalColumnsWidthPx = activeDashboard.columns.reduce((acc, col) => {
        const individualWidth = col.width || 3;
        const baseWidth = baseWidthsInRem[individualWidth];
        const multiplier = globalMultipliers[settings.columnWidth];
        const columnWidthRem = baseWidth * multiplier;
        return acc + (columnWidthRem * rootFontSizePx);
    }, 0);

    const totalGaps = activeDashboard.columns.length > 0 ? activeDashboard.columns.length - 1 : 0;
    const gapWidthRem = settings.columnGap * 0.25;
    const totalGapsWidthPx = totalGaps * gapWidthRem * rootFontSizePx;

    return totalColumnsWidthPx + totalGapsWidthPx;
  }, [activeDashboard, settings.scale, settings.columnWidth, settings.columnGap, isFirefox, settings.centerContent, isEditMode]);


  // --- START OF CENTRAL HOMEY ENGINE ---
  const [homeyDevices, setHomeyDevices] = useState<any>({});
  const [homeyZones, setHomeyZones] = useState<any>({});
  const [homeyFlows, setHomeyFlows] = useState<any>({});
  const [homeyConnectionState, setHomeyConnectionState] = useState<'disconnected' | 'polling' | 'websocket'>('disconnected');
  const [homeyLog, setHomeyLog] = useState<string[]>([]);
  const [homeyLastUpdate, setHomeyLastUpdate] = useState<Date | null>(null);
  const [homeyCountdown, setHomeyCountdown] = useState(0);

  const homeySocketRef = useRef<any>(null);
  const homeyHeartbeatRef = useRef<number | null>(null);
  const homeyHasActiveWidgets = useMemo(() => 
    activeDashboard.columns.some(c => c.groups.some(g => g.widgetType?.startsWith('homey')))
  , [activeDashboard]);

  const addHomeyLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setHomeyLog(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }, []);

  const handleHomeyOptimisticUpdate = useCallback((deviceId: string, capabilityId: string, value: any) => {
    setHomeyDevices((prev: any) => {
        if (prev[deviceId] && prev[deviceId].capabilitiesObj[capabilityId]) {
            const newDevices = { ...prev };
            newDevices[deviceId] = {
                ...newDevices[deviceId],
                capabilitiesObj: {
                    ...newDevices[deviceId].capabilitiesObj,
                    [capabilityId]: {
                        ...newDevices[deviceId].capabilitiesObj[capabilityId],
                        value: value
                    }
                }
            };
            return newDevices;
        }
        return prev;
    });
  }, []);

  useEffect(() => {
    if (!homeyHasActiveWidgets) {
        if (homeySocketRef.current) homeySocketRef.current.disconnect();
        if (homeyHeartbeatRef.current) clearInterval(homeyHeartbeatRef.current);
        return;
    }

    const { localIp, apiToken, pollingInterval = 10 } = settings.homey || {};

    if (!localIp || !apiToken) {
        setHomeyConnectionState('disconnected');
        addHomeyLog("Error: Homey IP/Token not set.");
        return;
    }

    const url = localIp.trim().startsWith('http') ? localIp.trim() : `http://${localIp.trim()}`;
    const token = apiToken.replace(/^Bearer\s+/i, '').trim();
    const headers = { 'Authorization': `Bearer ${token}` };

    // WebSocket Logic
    if (homeySocketRef.current) homeySocketRef.current.disconnect();
    try {
        const socket = io(`${url}/api/`, { transports: ["websocket"], reconnection: true, reconnectionDelay: 5000 });
        homeySocketRef.current = socket;

        socket.on('connect', () => addHomeyLog("WS: Connecting..."));
        socket.on('authenticated', () => {
            setHomeyConnectionState('websocket');
            addHomeyLog("WS: Authenticated & Connected.");
            setHomeyLastUpdate(new Date());
        });
        socket.on('capability', (payload: any) => {
            if (homeyConnectionState !== 'websocket') setHomeyConnectionState('websocket');
            setHomeyLastUpdate(new Date());
            handleHomeyOptimisticUpdate(payload.deviceId, payload.capabilityId, payload.value);
        });
        socket.on('disconnect', (reason: string) => {
            setHomeyConnectionState('polling');
            addHomeyLog(`WS: Disconnected (${reason}). Falling back to polling.`);
        });
        socket.on('connect_error', (err: any) => {
            if (homeyConnectionState !== 'polling') {
                setHomeyConnectionState('polling');
                addHomeyLog(`WS: Connect Error (${err.message}).`);
            }
        });

        socket.emit('authenticate', { token });
    } catch (e) {
        addHomeyLog(`WS: Init failed. ${e instanceof Error ? e.message : 'Unknown'}`);
        setHomeyConnectionState('polling');
    }

    // --- REFACTORED UNIFIED POLLING AND COUNTDOWN LOGIC ---
    const poll = async () => {
        if (homeySocketRef.current?.connected) {
            if (homeyConnectionState !== 'websocket') setHomeyConnectionState('websocket');
            return;
        }
        if (homeyConnectionState !== 'polling') setHomeyConnectionState('polling');
        addHomeyLog("Polling: Fetching data...");
        try {
            const [devicesRes, zonesRes, flowsRes] = await Promise.all([
                fetch(`${url}/api/manager/devices/device`, { headers }),
                fetch(`${url}/api/manager/zones/zone`, { headers }),
                fetch(`${url}/api/manager/flow/flow`, { headers })
            ]);
            if (!devicesRes.ok || !zonesRes.ok || !flowsRes.ok) throw new Error("One or more API calls failed.");

            const [devicesData, zonesData, flowsData] = await Promise.all([devicesRes.json(), zonesRes.json(), flowsRes.json()]);
            
            setHomeyDevices(devicesData);
            setHomeyZones(zonesData);
            setHomeyFlows(flowsData);
            setHomeyLastUpdate(new Date());
            addHomeyLog("Polling: Success.");
        } catch (err) {
            addHomeyLog(`Polling: Failed. ${err instanceof Error ? err.message : 'Unknown'}.`);
            setHomeyConnectionState('disconnected');
        }
    };
    
    // Clear any old timer
    if (homeyHeartbeatRef.current) clearInterval(homeyHeartbeatRef.current);

    // Initial poll, then set up the heartbeat
    poll(); 
    
    let tick = 0;
    setHomeyCountdown(pollingInterval);

    const heartbeat = () => {
        tick = (tick + 1) % pollingInterval;
        
        // Update the visible countdown
        setHomeyCountdown(pollingInterval - tick);
        
        // When tick is 0, a full cycle has passed, so poll.
        if (tick === 0) {
            poll();
        }
    };
    
    homeyHeartbeatRef.current = window.setInterval(heartbeat, 1000);

    return () => {
        if (homeySocketRef.current) homeySocketRef.current.disconnect();
        if (homeyHeartbeatRef.current) clearInterval(homeyHeartbeatRef.current);
    };
  }, [homeyHasActiveWidgets, settings.homey, addHomeyLog, handleHomeyOptimisticUpdate]);

  const handleHomeyToggle = async (deviceId: string, capabilityId: string, currentState: boolean) => {
    const { localIp, apiToken } = settings.homey || {};
    if (!localIp || !apiToken) return;
    handleHomeyOptimisticUpdate(deviceId, capabilityId, !currentState);
    try {
        const url = `${localIp.trim().startsWith('http') ? localIp.trim() : `http://${localIp.trim()}`}/api/manager/devices/device/${deviceId}/capability/${capabilityId}`;
        const headers = { 'Authorization': `Bearer ${apiToken.replace(/^Bearer\s+/i, '').trim()}`, 'Content-Type': 'application/json' };
        await fetch(url, { method: 'PUT', body: JSON.stringify({ value: !currentState }), headers });
    } catch (e) { console.error("Homey command failed", e); }
  };

  const handleHomeyTriggerFlow = async (flowId: string) => {
      const { localIp, apiToken } = settings.homey || {};
      if (!localIp || !apiToken) return;
      try {
          const url = `${localIp.trim().startsWith('http') ? localIp.trim() : `http://${localIp.trim()}`}/api/manager/flow/flow/${flowId}/trigger`;
          const headers = { 'Authorization': `Bearer ${apiToken.replace(/^Bearer\s+/i, '').trim()}`, 'Content-Type': 'application/json' };
          await fetch(url, { method: 'POST', headers, body: '{}' });
      } catch (err) { console.error("Homey flow trigger failed:", err); }
  };

  // --- END OF CENTRAL HOMEY ENGINE ---

  const isBackupOverdue = useMemo(() => {
      if (!settings.backupReminderInterval || settings.backupReminderInterval === 0) return false;
      
      const now = Date.now();
      let referenceTime: number;

      if (lastBackupDate) {
          referenceTime = new Date(lastBackupDate).getTime();
      } else if (installDate) {
          referenceTime = new Date(installDate).getTime();
      } else {
          return false;
      }

      const daysSince = (now - referenceTime) / (1000 * 60 * 60 * 24);
      return daysSince > settings.backupReminderInterval;
  }, [lastBackupDate, installDate, settings.backupReminderInterval]);

  useEffect(() => {
    if (JSON.stringify(rawSettings) !== JSON.stringify(settings)) {
        setSettings(settings);
    }
  }, [rawSettings, settings, setSettings]);

  useEffect(() => {
    if (!installDate) {
        setInstallDate(new Date().toISOString());
    }
  }, [installDate, setInstallDate]);

  useEffect(() => {
    document.title = `${activeDashboard?.name || ''} - ${pageTitle}`;
  }, [pageTitle, activeDashboard]);
  
  useEffect(() => {
    document.documentElement.style.fontSize = scaleMap[settings.scale] || '16px';
  }, [settings.scale]);

  useEffect(() => {
    let activeTheme: Theme;
    if (settings.theme === 'custom' && settings.customThemeColors) {
      activeTheme = generateCustomTheme(settings.customThemeColors);
    } else {
      activeTheme = themes[settings.theme] || themes.default;
    }
    setThemeClasses(activeTheme);
    
    document.body.className = activeTheme.body;
    
    const dashboardBgImage = activeDashboard?.backgroundImage;
    const dashboardBgColor = activeDashboard?.customBackgroundColor;

    // Dashboard specific overrides
    if (dashboardBgImage) {
        document.body.style.backgroundImage = `url('${dashboardBgImage}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    } else if (dashboardBgColor) {
        document.body.style.backgroundImage = '';
        document.body.style.backgroundColor = dashboardBgColor;
    } else {
        // No dashboard override, clear any inline styles to let the theme's class take over
        document.body.style.backgroundImage = '';
        document.body.style.backgroundColor = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundAttachment = '';
    }

  }, [settings.theme, settings.customThemeColors, activeDashboard]);
  
  useEffect(() => {
    if (modal) {
        if (modal.type === 'addLink') {
            setUrlInput('https://');
        } else if (modal.type === 'editLink') {
            setUrlInput(modal.data.link.url);
        }

      setTimeout(() => {
        const input = formRef.current?.querySelector('input, select');
        if (input instanceof HTMLElement) {
          input.focus();
          if (input instanceof HTMLInputElement && input.type === 'text') {
            input.select();
          }
        }
      }, 100);
    }
  }, [modal]);

  useEffect(() => {
    if (modal?.type === 'moveFlowButton') {
        const { direction, button, holderId, groupId, columnId } = modal.data;
        
        setDashboards(prevDashboards => {
            const newDashboards = JSON.parse(JSON.stringify(prevDashboards));
            const currentDashboard = newDashboards.find((d: Dashboard) => d.id === activeDashboardId);
            const col = currentDashboard?.columns.find((c: Column) => c.id === columnId);
            const group = col?.groups.find((g: Group) => g.id === groupId);
            const holder = group?.items.find(i => i.id === holderId) as ButtonHolderItem | undefined;

            if (holder) {
                const index = holder.buttons.findIndex(b => b.id === button.id);
                if (index > -1) {
                    const newIndex = direction === 'left' ? index - 1 : index + 1;
                    if (newIndex >= 0 && newIndex < holder.buttons.length) {
                        const temp = holder.buttons[index];
                        holder.buttons[index] = holder.buttons[newIndex];
                        holder.buttons[newIndex] = temp;
                    }
                }
            }
            return newDashboards;
        });
        
        closeModal();
    }
  }, [modal, activeDashboardId]);

  const handlePointerUp = useCallback(() => {
    if (isPendingDrag.current && longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
    }
    isPendingDrag.current = false;
    dragStartCoords.current = null;

    if (isDragging) {
        if (currentDropTarget) {
            handleDrop(currentDropTarget);
        }
        setIsDragging(false);
        setDraggedItem(null);
        setDragGhost(null);
        setCurrentDropTarget(null);
        document.body.classList.remove('dragging');
    }

    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('mouseup', handlePointerUp);
    window.removeEventListener('touchmove', handlePointerMove);
    window.removeEventListener('touchend', handlePointerUp);
    window.removeEventListener('touchcancel', handlePointerUp);
  }, [isDragging, currentDropTarget]);

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (isPendingDrag.current) {
        const { clientX, clientY } = 'touches' in e ? e.touches[0] : e;
        const start = dragStartCoords.current;
        if (start) {
            const dx = Math.abs(clientX - start.x);
            const dy = Math.abs(clientY - start.y);
            if (dx > 5 || dy > 5) { // If user scrolls, cancel drag
                isPendingDrag.current = false;
                if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
            }
        }
        return;
    }
    
    if (!isDragging) return;

    if ('touches' in e) {
        e.preventDefault(); // Prevent scroll on touch devices
    }

    const { clientX, clientY } = 'touches' in e ? e.touches[0] : e;
    setPointerPosition({ x: clientX, y: clientY });

    let elementUnderPointer = document.elementFromPoint(clientX, clientY);
    let droppableElement = elementUnderPointer?.closest('[data-droppable]');

    if (droppableElement) {
        const { droppable, columnId, groupId, itemId } = (droppableElement as HTMLElement).dataset;
        if (droppable) {
            setCurrentDropTarget({ columnId: columnId!, groupId, itemId });
        }
    } else {
        setCurrentDropTarget(null);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', handlePointerUp);
        window.addEventListener('touchmove', handlePointerMove, { passive: false });
        window.addEventListener('touchend', handlePointerUp);
        window.addEventListener('touchcancel', handlePointerUp);
    }
    return () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handlePointerDown = (
    e: React.MouseEvent | React.TouchEvent,
    item: DraggedItem,
    elementRef: HTMLElement | null
  ) => {
    if (!isEditMode || !elementRef) return;
    
    const isTouchEvent = 'touches' in e;
    
    const { clientX, clientY } = isTouchEvent ? e.touches[0] : e;
    dragStartCoords.current = { x: clientX, y: clientY };
    setDraggedItem(item);
    
    const startDrag = () => {
        isPendingDrag.current = false;
        if (navigator.vibrate) navigator.vibrate(50);
        
        const rect = elementRef.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        setPointerOffset({ x: offsetX, y: offsetY });
        setPointerPosition({ x: clientX, y: clientY });

        const clone = elementRef.cloneNode(true) as HTMLElement;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.id = 'drag-ghost';
        
        setDragGhost(
          <div className="opacity-80" dangerouslySetInnerHTML={{ __html: clone.outerHTML }} />
        );
        
        setIsDragging(true);
        document.body.classList.add('dragging');
    };

    if (isTouchEvent) {
        isPendingDrag.current = true;
        longPressTimeout.current = window.setTimeout(startDrag, 200);
    } else {
        startDrag();
    }
  };

  const updateActiveDashboard = (updater: (dashboard: Dashboard) => Dashboard) => {
    setDashboards(prev => prev.map(d => d.id === activeDashboardId ? updater(d) : d));
  };
  

  const openModal = (type: ModalState['type'], data?: any) => setModal({ type, data });
  const closeModal = () => {
    setModal(null);
    if (modal?.type === 'importConfirm') {
        setImportData(null);
    }
  };

  const openLinkGroupPopup = (group: Group, columnId: string) => {
    setLinkGroupPopupData({ group, columnId });
  };
  const closeLinkGroupPopup = () => {
    setLinkGroupPopupData(null);
  };

  const handleCalculatorStateChange = (newState: CalculatorState) => {
    updateActiveDashboard(dashboard => ({
        ...dashboard,
        columns: dashboard.columns.map(column => ({
            ...column,
            groups: column.groups.map(group => {
                if (group.id === CALCULATOR_WIDGET_ID) {
                    return { ...group, calculatorState: newState };
                }
                return group;
            })
        }))
    }));
  };

  const handleScratchpadChange = (groupId: string, newContent: string) => {
    updateActiveDashboard(dashboard => ({
        ...dashboard,
        columns: dashboard.columns.map(column => ({
            ...column,
            groups: column.groups.map(group => {
                if (group.id === groupId) {
                    return { ...group, widgetSettings: { ...group.widgetSettings, scratchpadContent: newContent } };
                }
                return group;
            })
        }))
    }));
  };

  const handleRemoveFavorite = (linkId: string) => {
    setDashboards(prevDashboards => prevDashboards.map(dashboard => ({
        ...dashboard,
        columns: dashboard.columns.map(col => ({
            ...col,
            groups: col.groups.map(group => ({
                ...group,
                items: group.items.map(item => {
                    if (item.type === 'link' && item.id === linkId) {
                        return { ...item, isFavorite: false };
                    }
                    return item;
                })
            }))
        }))
    })));
  };

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
  };
  
  const handleDashboardsChange = (newDashboards: Dashboard[]) => {
    setDashboards(newDashboards);
  };

  const handleHomeySelect = (data: { deviceId: string; capabilityId: string } | { flowId: string }) => {
      if (!modal || !modal.data) return;
      const { groupId, columnId } = modal.data;
      
      updateActiveDashboard(dashboard => {
          const newDashboard = JSON.parse(JSON.stringify(dashboard));
          const col = newDashboard.columns.find((c: Column) => c.id === columnId);
          const group = col?.groups.find((g: Group) => g.id === groupId);
          if (group) {
              let newItem: AnyItemType;
              if ('deviceId' in data) {
                  newItem = { id: uuidv4(), type: 'homey_capability', deviceId: data.deviceId, capabilityId: data.capabilityId };
              } else {
                  newItem = { id: uuidv4(), type: 'homey_flow', flowId: data.flowId };
              }
              group.items.push(newItem);
          }
          return newDashboard;
      });
      closeModal();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    
    if (modal.type === 'exportOptions') {
        const filename = formData.get('filename') as string || `startpage-backup-${new Date().toISOString().slice(0, 10)}`;
        handleExportDownload(filename);
        return;
    }

    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    const comment = formData.get('comment') as string;
    const width = parseInt(formData.get('width') as string, 10);
    const isFavorite = formData.has('isFavorite');
    const customName = formData.get('customName') as string;

    const newDashboards = JSON.parse(JSON.stringify(dashboards));
    const currentDashboard = newDashboards.find((d: Dashboard) => d.id === activeDashboardId);
    if (!currentDashboard) return;

    switch (modal.type) {
      case 'addColumn':
        currentDashboard.columns.push({ id: uuidv4(), name, groups: [], width: width || 3 });
        setDashboards(newDashboards);
        break;
      case 'editColumn':
        currentDashboard.columns = currentDashboard.columns.map((c:Column) => c.id === modal.data.id ? { ...c, name, width: width || 3 } : c);
        setDashboards(newDashboards);
        break;
      case 'addGroup': {
        const col = currentDashboard.columns.find((c: Column) => c.id === modal.data.columnId);
        if (col) col.groups.push({ id: uuidv4(), name, items: [], type: 'links' });
        setDashboards(newDashboards);
        break;
      }
      case 'editGroup': {
        const col = currentDashboard.columns.find((c: Column) => c.id === modal.data.columnId);
        const group = col?.groups.find((g: Group) => g.id === modal.data.group.id);
        if (group) group.name = name;
        setDashboards(newDashboards);
        break;
      }
      case 'editWidgetSettings': {
        const col = currentDashboard.columns.find((c: Column) => c.id === modal.data.columnId);
        const group = col?.groups.find((g: Group) => g.id === modal.data.group.id);
        if (group) {
            if (name) group.name = name;
            if (formData.has('colorVariant')) group.colorVariant = formData.get('colorVariant') as any;
            if (!group.widgetSettings) group.widgetSettings = {};
            
            if (group.type !== 'widget') {
              group.widgetSettings.compactMode = formData.has('compactMode');
              group.widgetSettings.displayAsPopup = formData.has('displayAsPopup');
            }

            if (group.widgetType === 'weather') {
                group.widgetSettings.city = formData.get('city') as string;
                group.widgetSettings.weatherShowForecast = formData.has('weatherShowForecast');
                group.widgetSettings.weatherShowTime = formData.has('weatherShowTime');
                if (formData.has('weatherShowTime')) group.widgetSettings.weatherTimezone = formData.get('weatherTimezone') as string;
                group.widgetSettings.weatherUpdateInterval = parseInt(formData.get('weatherUpdateInterval') as string, 10);
            } else if (group.widgetType === 'clock') {
                group.widgetSettings.timezone = formData.get('timezone') as string;
                group.widgetSettings.showSeconds = formData.has('showSeconds');
                group.widgetSettings.showDate = formData.has('showDate');
            } else if (group.widgetType === 'timer') {
                const isStopwatch = formData.has('isStopwatch');
                group.widgetSettings.isStopwatch = isStopwatch;
                if (isStopwatch) {
                    group.widgetSettings.timerDuration = 0;
                    group.widgetSettings.timerPlaySound = false;
                    group.widgetSettings.timerOvertime = false;
                } else {
                    const hours = parseInt(formData.get('hours') as string, 10) || 0;
                    const minutes = parseInt(formData.get('minutes') as string, 10) || 0;
                    const seconds = parseInt(formData.get('seconds') as string, 10) || 0;
                    group.widgetSettings.timerDuration = (hours * 3600) + (minutes * 60) + seconds;
                    group.widgetSettings.timerPlaySound = formData.has('timerPlaySound');
                    group.widgetSettings.timerOvertime = formData.has('timerOvertime');
                }
            } else if (group.widgetType === 'rss') {
                group.widgetSettings.rssUrl = formData.get('rssUrl') as string;
                group.widgetSettings.rssItemCount = parseInt(formData.get('rssItemCount') as string, 10) || 5;
                group.widgetSettings.rssUpdateInterval = parseInt(formData.get('rssUpdateInterval') as string, 10) || 0;
            } else if (group.widgetType === 'countdown') {
                group.widgetSettings.countdownTitle = formData.get('countdownTitle') as string;
                group.widgetSettings.countdownDate = new Date(formData.get('countdownDate') as string).toISOString();
                group.widgetSettings.countdownBehavior = formData.get('countdownBehavior') as any;
                group.widgetSettings.countdownPlaySound = formData.has('countdownPlaySound');
            } else if (group.widgetType === 'calendar') {
                group.widgetSettings.holidayCountry = formData.get('holidayCountry') as string;
            } else if (group.widgetType === 'todo') {
                group.widgetSettings.todoConfirmDelete = formData.has('todoConfirmDelete');
            } else if (group.widgetType === 'currency') {
                group.widgetSettings.currencyBase = formData.get('currencyBase') as string;
                group.widgetSettings.currencyTargets = formData.getAll('currencyTargets') as string[];
            } else if (group.widgetType === 'webhook') {
                try { group.widgetSettings.webhookItems = JSON.parse(formData.get('webhookItemsJSON') as string); } catch (e) {}
            } else if (group.widgetType === 'solar') {
                group.widgetSettings.solarCity = formData.get('solarCity') as string;
                group.widgetSettings.solarUse24HourFormat = formData.has('solarUse24HourFormat');
                group.widgetSettings.solarCompactMode = formData.has('solarCompactMode');
                group.widgetSettings.solarDynamicPath = formData.has('solarDynamicPath');
            } else if (group.widgetType === 'homey') {
                 if (!group.widgetSettings.homeySettings) group.widgetSettings.homeySettings = {};
                 group.widgetSettings.homeySettings.enableScroll = formData.has('enableScroll');
                 group.widgetSettings.homeySettings.showOneRow = formData.has('showOneRow');
                 try {
                    group.widgetSettings.homeySettings.selectedCapabilities = JSON.parse(formData.get('selectedCapabilitiesJSON') as string);
                } catch (e) {
                    console.error("Failed to parse Homey capabilities", e);
                }
                try {
                    group.widgetSettings.homeySettings.selectedFlows = JSON.parse(formData.get('selectedFlowsJSON') as string);
                } catch (e) {
                    console.error("Failed to parse Homey flows", e);
                }
            } else if (group.widgetType === 'radio') {
                try { group.widgetSettings.radioStations = JSON.parse(formData.get('radioStationsJSON') as string); } catch (e) {}
            } else if (group.widgetType === 'favorites') {
                try { 
                    const order = JSON.parse(formData.get('favoritesOrderJSON') as string);
                    if (Array.isArray(order)) {
                        group.widgetSettings.favoritesOrder = order;
                    }
                } catch (e) { console.error("Failed to parse favorites order", e); }
            } else if (group.widgetType === 'picture') {
                group.widgetSettings.pictureSourceType = formData.get('pictureSourceType') as any;
                group.widgetSettings.pictureUrl = formData.get('pictureUrl') as string;
                group.widgetSettings.pictureBase64 = formData.get('pictureBase64') as string;
                group.widgetSettings.pictureHeight = parseInt(formData.get('pictureHeight') as string, 10) || 200;
                group.widgetSettings.pictureFit = formData.get('pictureFit') as any;
                group.widgetSettings.pictureBorderRadius = formData.has('pictureBorderRadius');
                group.widgetSettings.pictureUpdateInterval = parseInt(formData.get('pictureUpdateInterval') as string, 10) || 0;
                group.widgetSettings.pictureClickUrl = formData.get('pictureClickUrl') as string;
                group.widgetSettings.pictureEnableZoom = formData.has('pictureEnableZoom');
            } else if (group.widgetType === 'iframe') {
                group.widgetSettings.iframeUrl = formData.get('iframeUrl') as string;
                group.widgetSettings.iframeHeight = parseInt(formData.get('iframeHeight') as string, 10) || 400;
                group.widgetSettings.iframeViewMode = formData.get('iframeViewMode') as any;
                group.widgetSettings.iframeUpdateInterval = parseInt(formData.get('iframeUpdateInterval') as string, 10) || 0;
            } else if (group.widgetType === 'homey_custom') {
                if (!group.widgetSettings.homeyCustomSettings) group.widgetSettings.homeyCustomSettings = {};
                group.widgetSettings.homeyCustomSettings.showOneRow = formData.has('homeyCustomShowOneRow');
                group.widgetSettings.homeyCustomSettings.flowsInTwoColumns = formData.has('homeyCustomFlowsInTwoColumns');
            }
        }
        setDashboards(newDashboards);
        break;
      }
      case 'addLink': {
        const col = newDashboards.find((d: Dashboard) => d.id === activeDashboardId).columns.find((c: Column) => c.id === modal.data.columnId);
        const group = col?.groups.find((g: Group) => g.id === modal.data.groupId);
        if (group) group.items.push({ id: uuidv4(), type: 'link', name, url: url.startsWith('https://') || url.startsWith('http://') ? url : `https://${url}`, comment, isFavorite });
        setDashboards(newDashboards);
        break;
      }
      case 'editLink': {
        const col = newDashboards.find((d: Dashboard) => d.id === activeDashboardId).columns.find((c: Column) => c.id === modal.data.columnId);
        const group = col?.groups.find((g: Group) => g.id === modal.data.groupId);
        const link = group?.items.find((l: AnyItemType) => l.id === modal.data.link.id);
        if (link && link.type === 'link') {
          link.name = name;
          link.url = url;
          link.comment = comment;
          link.isFavorite = isFavorite;
        }
        setDashboards(newDashboards);
        break;
      }
      case 'addOrEditTextItem': {
          const col = newDashboards.find((d: Dashboard) => d.id === activeDashboardId).columns.find((c: Column) => c.id === modal.data.columnId);
          const group = col?.groups.find((g: Group) => g.id === modal.data.groupId);
          if (group) {
              const textContent = formData.get('textContent') as string;
              if (modal.data.item) {
                  const item = group.items.find((i: any) => i.id === modal.data.item.id);
                  if (item && item.type === 'text') item.content = textContent;
              } else {
                  group.items.push({ id: uuidv4(), type: 'text', content: textContent });
              }
              setDashboards(newDashboards);
          }
          break;
      }
      case 'editHomeyCustomItemName': {
        const { columnId, groupId, item: modalItem } = modal.data;
        const col = newDashboards.find((d: Dashboard) => d.id === activeDashboardId).columns.find((c: Column) => c.id === columnId);
        const group = col?.groups.find((g: Group) => g.id === groupId);
        if (group) {
            const item = group.items.find((i: any) => i.id === modalItem.id);
            if (item && (item.type === 'homey_capability' || item.type === 'homey_flow' || item.type === 'button_holder')) {
                item.customName = customName.trim() ? customName.trim() : undefined; 
            }
        }
        setDashboards(newDashboards);
        break;
      }
      case 'addFlowButton':
      case 'editFlowButton': {
          const { columnId, groupId, holderId, button } = modal.data;
          const flowValue = formData.get('flowId') as string;
          const [flowId, flowName] = flowValue.split('|');
          const symbol = formData.get('symbol') as string;

          const col = newDashboards.find((d: Dashboard) => d.id === activeDashboardId).columns.find((c: Column) => c.id === columnId);
          const group = col?.groups.find((g: Group) => g.id === groupId);
          const holder = group?.items.find(i => i.id === holderId) as ButtonHolderItem | undefined;

          if (holder) {
              if (modal.type === 'addFlowButton') {
                  const newButton: FlowButton = { id: uuidv4(), flowId, symbol, flowName };
                  holder.buttons.push(newButton);
              } else {
                  const buttonToEdit = holder.buttons.find(b => b.id === button.id);
                  if (buttonToEdit) {
                      buttonToEdit.flowId = flowId;
                      buttonToEdit.symbol = symbol;
                      buttonToEdit.flowName = flowName;
                  }
              }
              setDashboards(newDashboards);
          }
          break;
      }
    }
    closeModal();
  };
  
  const handleAddSeparator = (groupId: string, columnId: string) => {
    updateActiveDashboard(dashboard => {
        const newDashboard = JSON.parse(JSON.stringify(dashboard));
        const col = newDashboard.columns.find((c: Column) => c.id === columnId);
        const group = col?.groups.find((g: Group) => g.id === groupId);
        if (group) {
            group.items.push({ id: uuidv4(), type: 'separator' });
        }
        return newDashboard;
    });
    closeModal();
  };

  const handleAddButtonHolder = (groupId: string, columnId: string) => {
    updateActiveDashboard(dashboard => {
        const newDashboard = JSON.parse(JSON.stringify(dashboard));
        const col = newDashboard.columns.find((c: Column) => c.id === columnId);
        const group = col?.groups.find((g: Group) => g.id === groupId);
        if (group) {
            const newHolder: ButtonHolderItem = { id: uuidv4(), type: 'button_holder', buttons: [] };
            group.items.push(newHolder);
        }
        return newDashboard;
    });
    closeModal();
  };

  const handleAddWidget = (widgetType: string, columnId: string) => {
    updateActiveDashboard(dashboard => {
        const newDashboard = JSON.parse(JSON.stringify(dashboard));
        const col = newDashboard.columns.find((c: Column) => c.id === columnId);
        if (!col) return newDashboard;

        let newWidget: Group;

        if (widgetType === 'weather') {
            newWidget = { id: uuidv4(), name: "Weather", items: [], type: 'widget', widgetType: 'weather', widgetSettings: { city: 'Stockholm', weatherShowForecast: false, weatherShowTime: false, weatherTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, weatherUpdateInterval: 60 } };
        } else if (widgetType === 'clock') {
            newWidget = { id: uuidv4(), name: "Clock", items: [], type: 'widget', widgetType: 'clock', widgetSettings: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, showSeconds: true, showDate: true } };
        } else if (widgetType === 'timer') {
            newWidget = { id: uuidv4(), name: "Timer / Stopwatch", items: [], type: 'widget', widgetType: 'timer', widgetSettings: { timerDuration: 300, timerPlaySound: true, isStopwatch: false, timerOvertime: false } };
        } else if (widgetType === 'rss') {
            newWidget = { id: uuidv4(), name: "RSS Feed", items: [], type: 'widget', widgetType: 'rss', widgetSettings: { rssUrl: '', rssItemCount: 5, rssUpdateInterval: 60 } };
        } else if (widgetType === 'todo') {
            newWidget = { id: TODO_WIDGET_ID, name: 'To-Do List', items: [], isCollapsed: false, type: 'widget', widgetType: 'todo', widgetSettings: { todoConfirmDelete: true } };
        } else if (widgetType === 'calculator') {
            newWidget = { id: CALCULATOR_WIDGET_ID, name: 'Calculator', items: [], isCollapsed: false, type: 'widget', widgetType: 'calculator', calculatorState: { currentValue: '0', previousValue: null, operator: null, isNewEntry: true } };
        } else if (widgetType === 'scratchpad') {
            newWidget = { id: uuidv4(), name: "Notepad", items: [], type: 'widget', widgetType: 'scratchpad', widgetSettings: { scratchpadContent: '' } };
        } else if (widgetType === 'countdown') {
            newWidget = { id: uuidv4(), name: "Countdown", items: [], type: 'widget', widgetType: 'countdown', widgetSettings: { countdownTitle: 'My Event', countdownDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), countdownBehavior: 'discrete', countdownPlaySound: false } };
        } else if (widgetType === 'calendar') {
            newWidget = { id: CALENDAR_WIDGET_ID, name: 'Calendar', items: [], isCollapsed: false, type: 'widget', widgetType: 'calendar', widgetSettings: { holidayCountry: 'SE' } };
        } else if (widgetType === 'currency') {
            newWidget = { id: uuidv4(), name: "Currency Converter", items: [], type: 'widget', widgetType: 'currency', widgetSettings: { currencyBase: 'SEK', currencyTargets: ['USD', 'EUR', 'NOK'] } };
        } else if (widgetType === 'webhook') {
            newWidget = { id: uuidv4(), name: "Webhook Buttons", items: [], type: 'widget', widgetType: 'webhook', widgetSettings: { webhookItems: [] } };
        } else if (widgetType === 'unit_converter') {
            newWidget = { id: uuidv4(), name: "Unit Converter", items: [], type: 'widget', widgetType: 'unit_converter' };
        } else if (widgetType === 'network') {
            newWidget = { id: uuidv4(), name: "Network Info", items: [], type: 'widget', widgetType: 'network' };
        } else if (widgetType === 'solar') {
            newWidget = { id: uuidv4(), name: "Sunrise / Sunset", items: [], type: 'widget', widgetType: 'solar', widgetSettings: { solarCity: 'Stockholm', solarUse24HourFormat: true, solarCompactMode: false, solarDynamicPath: true } };
        } else if (widgetType === 'radio') {
            newWidget = { id: uuidv4(), name: "Radio", items: [], type: 'widget', widgetType: 'radio', widgetSettings: { radioStations: DEFAULT_RADIO_STATIONS } };
        } else if (widgetType === 'favorites') {
            newWidget = { id: uuidv4(), name: "Favorites", items: [], type: 'widget', widgetType: 'favorites', widgetSettings: { favoritesOrder: [] } };
        } else if (widgetType === 'picture') {
            newWidget = { id: uuidv4(), name: "Image", items: [], type: 'widget', widgetType: 'picture', widgetSettings: { pictureSourceType: 'url', pictureHeight: 200, pictureFit: 'cover', pictureBorderRadius: true } };
        } else if (widgetType === 'iframe') {
            newWidget = { id: uuidv4(), name: "Iframe", items: [], type: 'widget', widgetType: 'iframe', widgetSettings: { iframeUrl: '', iframeHeight: 400, iframeViewMode: 'desktop', iframeUpdateInterval: 0 } };
        } else if (widgetType === 'homey_custom') {
            newWidget = { id: uuidv4(), name: "Homey Pro Custom", items: [], type: 'widget', widgetType: 'homey_custom' };
        } else if (widgetType === 'homey_status') {
            newWidget = { id: uuidv4(), name: "Homey Pro Status", items: [], type: 'widget', widgetType: 'homey_status' };
        } else {
            return newDashboard;
        }

        col.groups.push(newWidget);
        return newDashboard;
    });
    closeModal();
  };

  const handleToggleEditMode = () => {
    if (!isEditMode) {
      const collapsedIds = new Set<string>();
      updateActiveDashboard(dashboard => {
          const newDashboard = JSON.parse(JSON.stringify(dashboard));
          let hasChanges = false;
          newDashboard.columns.forEach((c: Column) => {
              c.groups.forEach((g: Group) => {
                  if (g.isCollapsed) {
                      collapsedIds.add(g.id);
                      g.isCollapsed = false;
                      hasChanges = true;
                  }
              });
          });
          collapsedGroupsBeforeEdit.current = collapsedIds;
          return hasChanges ? newDashboard : dashboard;
      });
      setIsEditMode(true);
    } else {
      if (collapsedGroupsBeforeEdit.current.size > 0) {
          updateActiveDashboard(dashboard => {
              const newDashboard = JSON.parse(JSON.stringify(dashboard));
              newDashboard.columns.forEach((c: Column) => {
                  c.groups.forEach((g: Group) => {
                      if (collapsedGroupsBeforeEdit.current.has(g.id)) {
                          g.isCollapsed = true;
                      }
                  });
              });
              return newDashboard;
          });
      }
      collapsedGroupsBeforeEdit.current.clear();
      setIsEditMode(false);
    }
  };

  const handleRequestDeleteTodo = (todoId: string) => {
    openModal('deleteTodoItem', { todoId });
  };

  const handleDelete = () => {
    if (!modal) return;
    const { type, data } = modal;

    if (type === 'deleteTodoItem') {
      setTodos(prev => prev.filter(t => t.id !== data.todoId));
      closeModal();
      return;
    }
    
    updateActiveDashboard(dashboard => {
        const newDashboard = JSON.parse(JSON.stringify(dashboard));
        if (type === 'deleteColumn') {
            newDashboard.columns = newDashboard.columns.filter((c: Column) => c.id !== data.id);
        } else if (type === 'deleteGroup') {
            const col = newDashboard.columns.find((c: Column) => c.id === data.columnId);
            if (col) col.groups = col.groups.filter((g: Group) => g.id !== data.group.id);
        } else if (type === 'deleteItem') {
            const col = newDashboard.columns.find((c: Column) => c.id === data.columnId);
            const group = col?.groups.find((g: Group) => g.id === data.groupId);
            if (group) group.items = group.items.filter((i: AnyItemType) => i.id !== data.item.id);
        } else if (type === 'deleteFlowButton') {
            const { columnId, groupId, holderId, button } = data;
            const col = newDashboard.columns.find((c: Column) => c.id === columnId);
            const group = col?.groups.find((g: Group) => g.id === groupId);
            const holder = group?.items.find(i => i.id === holderId) as ButtonHolderItem | undefined;
            if (holder) holder.buttons = holder.buttons.filter(b => b.id !== button.id);
        }
        return newDashboard;
    });
    closeModal();
  };

  const handleDrop = (target: { columnId: string; groupId?: string; itemId?: string }) => {
    if (!draggedItem || !activeDashboard) return;

    updateActiveDashboard(dashboard => {
        const newDashboard = JSON.parse(JSON.stringify(dashboard));
        let newColumns = newDashboard.columns;

        if (draggedItem.type === 'column') {
            const sourceIndex = newColumns.findIndex((c: Column) => c.id === draggedItem.column.id);
            const targetIndex = newColumns.findIndex((c: Column) => c.id === target.columnId);
            if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
                const [movedColumn] = newColumns.splice(sourceIndex, 1);
                newColumns.splice(targetIndex, 0, movedColumn);
            }
        } else if (draggedItem.type === 'group') {
            const sourceCol = newColumns.find((c: Column) => c.id === draggedItem.sourceColumnId);
            const targetCol = newColumns.find((c: Column) => c.id === target.columnId);
            if (sourceCol && targetCol) {
                const sourceGroupIndex = sourceCol.groups.findIndex((g: Group) => g.id === draggedItem.group.id);
                if (sourceGroupIndex !== -1) {
                    const [movedGroup] = sourceCol.groups.splice(sourceGroupIndex, 1);
                    if (target.groupId) {
                        const targetGroupIndex = targetCol.groups.findIndex((g: Group) => g.id === target.groupId);
                        if (targetGroupIndex !== -1) {
                            targetCol.groups.splice(targetGroupIndex, 0, movedGroup);
                        } else { targetCol.groups.push(movedGroup); }
                    } else { targetCol.groups.push(movedGroup); }
                }
            }
        } else if (draggedItem.type === 'groupItem') {
            const sourceCol = newColumns.find((c: Column) => c.id === draggedItem.sourceColumnId);
            const sourceGroup = sourceCol?.groups.find((g: Group) => g.id === draggedItem.sourceGroupId);
            const targetCol = newColumns.find((c: Column) => c.id === target.columnId);
            const targetGroup = targetCol?.groups.find((g: Group) => g.id === target.groupId);

            if (sourceGroup && targetGroup) {
                const itemType = draggedItem.item.type;
                const isTargetLinkGroup = !targetGroup.widgetType || targetGroup.type === 'links';
                const isTargetHomeyCustom = targetGroup.widgetType === 'homey_custom';

                let isCompatible = false;
                if (itemType === 'separator') { isCompatible = true; } 
                else if (isTargetLinkGroup) { isCompatible = ['link'].includes(itemType); } 
                else if (isTargetHomeyCustom) { isCompatible = ['homey_capability', 'homey_flow', 'text', 'button_holder'].includes(itemType); }
                if (sourceGroup.id !== targetGroup.id && !isCompatible) return dashboard;

                const sourceItemIndex = sourceGroup.items.findIndex((i: AnyItemType) => i.id === draggedItem.item.id);
                if (sourceItemIndex !== -1) {
                    const [movedItem] = sourceGroup.items.splice(sourceItemIndex, 1);
                    if (target.itemId) {
                        const targetItemIndex = targetGroup.items.findIndex((i: AnyItemType) => i.id === target.itemId);
                        if (targetItemIndex !== -1) {
                            targetGroup.items.splice(targetItemIndex, 0, movedItem);
                        } else { targetGroup.items.push(movedItem); }
                    } else { targetGroup.items.push(movedItem); }
                }
            }
        }
        return { ...newDashboard, columns: newColumns };
    });
  };

  const handleToggleGroupCollapsed = (columnId: string, groupId: string) => {
    updateActiveDashboard(dashboard => ({
        ...dashboard,
        columns: dashboard.columns.map(col => {
            if (col.id === columnId) {
                return { ...col, groups: col.groups.map(g => g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g) };
            }
            return col;
        })
    }));
  };

  const onRequestExport = () => {
      openModal('exportOptions');
  };

  const handleExportDownload = (filename: string) => {
      const backup: BackupData = {
          version: 2,
          dashboards,
          settings,
          pageTitle,
          todos
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", filename.endsWith('.json') ? filename : `${filename}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      setLastBackupDate(new Date().toISOString());
      closeModal();
      setIsSettingsModalOpen(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              if (data && (data.columns || data.settings || data.dashboards)) {
                  setImportData(data);
                  openModal('importConfirm');
              } else {
                  alert('Invalid backup file format.');
              }
          } catch (error) {
              console.error('Error parsing backup file:', error);
              alert('Error reading backup file.');
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  const applyImport = () => {
      if (!importData) return;
      if (importData.dashboards) {
          setDashboards(importData.dashboards);
          setActiveDashboardId(importData.dashboards[0]?.id || '');
      } else if (importData.columns) { // Legacy import
          const migratedDashboards = runDataMigrationAndValidation(null, importData.columns);
          setDashboards(migratedDashboards);
          setActiveDashboardId(migratedDashboards[0]?.id || '');
      }
      if (importData.settings) setSettings({ ...DEFAULT_SETTINGS, ...importData.settings });
      if (importData.pageTitle) setPageTitle(importData.pageTitle);
      if (importData.todos) setTodos(importData.todos);
      closeModal();
      setIsSettingsModalOpen(false);
      setImportData(null);
  };

  const handleResetToDefaults = () => {
      setDashboards([DEFAULT_DASHBOARD]);
      setActiveDashboardId(DEFAULT_DASHBOARD.id);
      setSettings(DEFAULT_SETTINGS);
      setPageTitle('My Startpage');
      setTodos([]);
      setLastBackupDate('');
      setInstallDate(new Date().toISOString());
      closeModal();
      setIsSettingsModalOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const engine = searchEngines[settings.searchEngine] || searchEngines.google;
    let targetUrl: string;

    if (!searchQuery.trim()) {
      targetUrl = engine.home;
    } else {
      targetUrl = `${engine.url}${encodeURIComponent(searchQuery)}`;
    }
    
    if (settings.openLinksInNewTab) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
        window.location.href = targetUrl;
    }
    
    // Clear search input only if there was a query
    if (searchQuery.trim()) {
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dashboardDropdownRef.current && !dashboardDropdownRef.current.contains(event.target as Node)) {
            setIsDashboardDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeDashboard) {
    return (
        <div className={`h-screen w-screen flex items-center justify-center ${themeClasses.body}`}>
            <p>Loading dashboards...</p>
        </div>
    );
  }

  const shouldUsePaddingFix = calculatedContentWidth !== null;
  const columns = activeDashboard.columns;

  const getColumnStyle = (widthIndex: number = 3) => {
    const baseWidth = baseWidthsInRem[widthIndex] || baseWidthsInRem[3];
    const multiplier = globalMultipliers[settings.columnWidth];
    const widthRem = baseWidth * multiplier;
    return {
      width: `${widthRem}rem`,
      minWidth: `${widthRem}rem`,
      maxWidth: `${widthRem}rem`
    };
  };

  const getModalTitle = () => {
    if (!modal) return '';
    switch (modal.type) {
        case 'addColumn': return 'Add Column';
        case 'editColumn': return 'Edit Column';
        case 'deleteColumn': return 'Delete Column';
        case 'addGroup': return 'Add Group';
        case 'editGroup': return 'Edit Group';
        case 'deleteGroup': return 'Delete Group';
        case 'addLink': return 'Add Link';
        case 'editLink': return 'Edit Link';
        case 'deleteItem': return 'Delete Item';
        case 'importConfirm': return 'Confirm Import';
        case 'resetConfirm': return 'Reset Application';
        case 'addWidget': return 'Add Widget';
        case 'editWidgetSettings': return 'Widget Settings';
        case 'addLinkOrSeparator': return 'Add Item';
        case 'exportOptions': return 'Export Data';
        case 'addHomeyCustomItem': return 'Add Homey Item';
        case 'selectHomeyItem': return 'Select Homey Capability';
        case 'addOrEditTextItem': return modal.data?.item ? 'Edit Header' : 'Add Header';
        case 'editHomeyCustomItemName': return 'Edit Item Name';
        case 'addFlowButton': return 'Add Flow Button';
        case 'editFlowButton': return 'Edit Flow Button';
        case 'deleteFlowButton': return 'Delete Button';
        case 'moveFlowButton': return 'Move Button';
        case 'deleteTodoItem': return 'Delete Task';
        case 'dashboardSettings': return 'Dashboard Settings';
        default: return '';
    }
  };

  const getModalContent = () => {
    if (!modal) return null;
    const { type, data } = modal;

    switch (type) {
      case 'addColumn':
      case 'editColumn':
        return (
          <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Name</label>
              <input type="text" name="name" defaultValue={data?.name} required className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
            </div>
            <div>
              <label htmlFor="width" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Column Width</label>
              <input type="range" name="width" min="1" max="5" defaultValue={data?.width || 3} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
              <div className="flex justify-between text-xs text-slate-500 mt-1"><span>Narrow</span><span>Wide</span></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
              <button type="submit" className={`${themeClasses.buttonPrimary} px-4 py-2 rounded-lg`}>Save</button>
            </div>
          </form>
        );
      case 'addGroup':
      case 'editGroup':
        return (
          <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Name</label>
              <input type="text" name="name" defaultValue={data?.group ? data.group.name : ''} required className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
            </div>
            {(type === 'editGroup' && data.group.type !== 'widget') && (
              <>
                <ColorSelector currentColor={data.group.colorVariant || 'default'} themeClasses={themeClasses} />
                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <label htmlFor="compactMode" className="text-sm font-medium">Compact Mode</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            id="compactMode"
                            name="compactMode"
                            defaultChecked={data.group.widgetSettings?.compactMode}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <label htmlFor="displayAsPopup" className="text-sm font-medium">Display as Popup</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            id="displayAsPopup"
                            name="displayAsPopup"
                            defaultChecked={data.group.widgetSettings?.displayAsPopup}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
              </>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
              <button type="submit" className={`${themeClasses.buttonPrimary} px-4 py-2 rounded-lg`}>Save</button>
            </div>
          </form>
        );
      case 'addLink':
      case 'editLink':
        return (
          <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Name</label>
              <input type="text" name="name" defaultValue={data?.link?.name} required className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
            </div>
            <div>
              <label htmlFor="url" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>URL</label>
              <input type="text" name="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} required className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
            </div>
            <div>
              <label htmlFor="comment" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Comment / Tooltip (optional)</label>
              <input type="text" name="comment" defaultValue={data?.link?.comment} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <label htmlFor="isFavorite" className="text-sm font-medium">Add to Favorites</label>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        id="isFavorite"
                        name="isFavorite"
                        defaultChecked={data?.link?.isFavorite}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
              <button type="submit" className={`${themeClasses.buttonPrimary} px-4 py-2 rounded-lg`}>Save</button>
            </div>
          </form>
        );
      case 'deleteColumn':
      case 'deleteGroup':
      case 'deleteItem':
      case 'deleteTodoItem':
      case 'deleteFlowButton':
        return (
          <div className="space-y-4">
            <p className="text-slate-300">Are you sure you want to delete this? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
              <button onClick={handleDelete} className={`${themeClasses.buttonDanger} px-4 py-2 rounded-lg`}>Delete</button>
            </div>
          </div>
        );
      case 'resetConfirm':
        return (
          <div className="space-y-4">
            <p className="text-red-400 font-bold">Warning: This will delete ALL your data including dashboards, links, and settings.</p>
            <p className="text-slate-300">Make sure you have exported a backup if you want to save your current configuration.</p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
              <button onClick={handleResetToDefaults} className={`${themeClasses.buttonDanger} px-4 py-2 rounded-lg`}>Reset Everything</button>
            </div>
          </div>
        );
      case 'importConfirm':
        return (
          <div className="space-y-4">
            <p className="text-slate-300">This will overwrite your current configuration with the data from the backup file.</p>
            <p className="text-sm text-slate-400">Current settings will be lost.</p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
              <button onClick={applyImport} className={`${themeClasses.buttonPrimary} px-4 py-2 rounded-lg`}>Import</button>
            </div>
          </div>
        );
      case 'addWidget':
        const columnId = data.columnId;
        const hasTodo = activeDashboard.columns.some(col => col.groups.some(g => g.widgetType === 'todo'));
        const hasCalendar = activeDashboard.columns.some(col => col.groups.some(g => g.widgetType === 'calendar'));
        const hasCalculator = activeDashboard.columns.some(col => col.groups.some(g => g.widgetType === 'calculator'));
        const hasNetwork = activeDashboard.columns.some(col => col.groups.some(g => g.widgetType === 'network'));
        const hasRadio = activeDashboard.columns.some(col => col.groups.some(g => g.widgetType === 'radio'));
        const hasFavorites = activeDashboard.columns.some(col => col.groups.some(g => g.widgetType === 'favorites'));

        const WidgetBtn = ({ label, icon, onClick, fullWidth }: any) => (
            <button 
                onClick={onClick} 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${themeClasses.buttonSecondary} hover:brightness-110 ${fullWidth ? 'col-span-2' : ''}`}
            >
                <div className={themeClasses.iconMuted}>{icon}</div>
                <span className="font-semibold text-sm">{label}</span>
            </button>
        );

        return (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${themeClasses.modalMutedText} mb-3`}>Multi Instance Widgets</h3>
                <div className="grid grid-cols-2 gap-3">
                    <WidgetBtn label="Link Group" icon={<LinkIcon className="w-5 h-5" />} onClick={() => openModal('addGroup', { columnId })} fullWidth />
                    
                    <WidgetBtn label="Weather" icon={<SunIcon className="w-5 h-5" />} onClick={() => handleAddWidget('weather', columnId)} />
                    <WidgetBtn label="Clock" icon={<ClockIcon className="w-5 h-5" />} onClick={() => handleAddWidget('clock', columnId)} />
                    
                    <WidgetBtn label="Timer" icon={<TimerIcon className="w-5 h-5" />} onClick={() => handleAddWidget('timer', columnId)} />
                    <WidgetBtn label="RSS Feed" icon={<RssIcon className="w-5 h-5" />} onClick={() => handleAddWidget('rss', columnId)} />
                    
                    <WidgetBtn label="Currency" icon={<BanknotesIcon className="w-5 h-5" />} onClick={() => handleAddWidget('currency', columnId)} />
                    <WidgetBtn label="Webhook" icon={<BoltIcon className="w-5 h-5" />} onClick={() => handleAddWidget('webhook', columnId)} />
                    
                    <WidgetBtn label="Notepad" icon={<DocumentTextIcon className="w-5 h-5" />} onClick={() => handleAddWidget('scratchpad', columnId)} />
                    <WidgetBtn label="Countdown" icon={<PartyPopperIcon className="w-5 h-5" />} onClick={() => handleAddWidget('countdown', columnId)} />
                    
                    <WidgetBtn label="Unit Converter" icon={<ScaleIcon className="w-5 h-5" />} onClick={() => handleAddWidget('unit_converter', columnId)} />
                    <WidgetBtn label="Sunrise / Sunset" icon={<MoonIcon className="w-5 h-5" />} onClick={() => handleAddWidget('solar', columnId)} />
                    
                    <WidgetBtn label="Image" icon={<PhotoIcon className="w-5 h-5" />} onClick={() => handleAddWidget('picture', columnId)} />
                    <WidgetBtn label="Iframe (Limited)" icon={<WindowIcon className="w-5 h-5" />} onClick={() => handleAddWidget('iframe', columnId)} />
                </div>
            </div>

            <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${themeClasses.modalMutedText} mb-3`}>Single-Instance Widgets</h3>
                <div className="grid grid-cols-2 gap-3">
                    {!hasCalculator && <WidgetBtn label="Calculator" icon={<CalculatorIcon className="w-5 h-5" />} onClick={() => handleAddWidget('calculator', columnId)} />}
                    {!hasNetwork && <WidgetBtn label="Network Info" icon={<WifiIcon className="w-5 h-5" />} onClick={() => handleAddWidget('network', columnId)} />}
                    {!hasCalendar && <WidgetBtn label="Calendar" icon={<CalendarDaysIcon className="w-5 h-5" />} onClick={() => handleAddWidget('calendar', columnId)} />}
                    {!hasTodo && <WidgetBtn label="To-Do List" icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />} onClick={() => handleAddWidget('todo', columnId)} />}
                    {!hasRadio && <WidgetBtn label="Radio Player" icon={<RadioIcon className="w-5 h-5" />} onClick={() => handleAddWidget('radio', columnId)} />}
                    {!hasFavorites && <WidgetBtn label="Favorites" icon={<HeartIcon className="w-5 h-5" />} onClick={() => handleAddWidget('favorites', columnId)} />}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500/80 mb-3">Homey Pro Widgets</h3>
                <div className="grid grid-cols-2 gap-3">
                    <WidgetBtn label="Homey Pro Auto Zones" icon={<HomeIcon className="w-5 h-5" />} onClick={() => handleAddWidget('homey', columnId)} />
                    <WidgetBtn label="Homey Pro Custom" icon={<HomeIcon className="w-5 h-5" />} onClick={() => handleAddWidget('homey_custom', columnId)} />
                    <WidgetBtn label="Homey Pro Status" icon={<CpuChipIcon className="w-5 h-5" />} onClick={() => handleAddWidget('homey_status', columnId)} />
                </div>
            </div>
          </div>
        );
      case 'editWidgetSettings':
        return (
          <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
            {data.group.widgetType !== 'calculator' && data.group.widgetType !== 'scratchpad' && data.group.widgetType !== 'unit_converter' && data.group.widgetType !== 'network' && data.group.widgetType !== 'homey_status' && (
                <div className="mb-4">
                    <label htmlFor="name" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Name <span className="text-xs font-normal opacity-70">(max 30 chars)</span></label>
                    <input type="text" name="name" defaultValue={data.group.name} required maxLength={30} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                </div>
            )}
            
            <ColorSelector currentColor={data.group.colorVariant || 'default'} themeClasses={themeClasses} />

            {/* Widget Specific Forms */}
            {data.group.widgetType === 'weather' && <WeatherSettingsForm group={data.group} themeClasses={themeClasses} />}
            {data.group.widgetType === 'clock' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="timezone" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Timezone</label>
                  <select name="timezone" defaultValue={data.group.widgetSettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing} max-h-60`}>
                    {timezones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <label htmlFor="showSeconds" className="text-sm font-medium">Show Seconds</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="showSeconds" name="showSeconds" defaultChecked={data.group.widgetSettings?.showSeconds ?? true} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <label htmlFor="showDate" className="text-sm font-medium">Show Date</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="showDate" name="showDate" defaultChecked={data.group.widgetSettings?.showDate ?? true} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
              </div>
            )}
            {data.group.widgetType === 'timer' && <TimerSettingsForm group={data.group} themeClasses={themeClasses} />}
            {data.group.widgetType === 'rss' && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="rssUrl" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>RSS Feed URL</label>
                        <input type="url" name="rssUrl" defaultValue={data.group.widgetSettings?.rssUrl} placeholder="https://example.com/feed.xml" required className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="rssItemCount" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Items to show</label>
                            <input type="number" name="rssItemCount" defaultValue={data.group.widgetSettings?.rssItemCount || 5} min="1" max="20" className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                        </div>
                        <div>
                            <label htmlFor="rssUpdateInterval" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Refresh (mins)</label>
                            <input type="number" name="rssUpdateInterval" defaultValue={data.group.widgetSettings?.rssUpdateInterval || 60} min="0" className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                        </div>
                    </div>
                </div>
            )}
            {data.group.widgetType === 'countdown' && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="countdownTitle" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Title</label>
                        <input type="text" name="countdownTitle" defaultValue={data.group.widgetSettings?.countdownTitle} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                    </div>
                    <div>
                        <label htmlFor="countdownDate" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Target Date & Time</label>
                        <input type="datetime-local" name="countdownDate" defaultValue={data.group.widgetSettings?.countdownDate?.slice(0, 16)} required className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                    </div>
                    <div>
                        <label htmlFor="countdownBehavior" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Completion Effect</label>
                        <select name="countdownBehavior" defaultValue={data.group.widgetSettings?.countdownBehavior || 'discrete'} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}>
                            <option value="discrete">Text Only</option>
                            <option value="confetti">Confetti 🎉</option>
                            <option value="fullscreen">Fullscreen Alert</option>
                            <option value="intense">Flashing Red (Intense)</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <label htmlFor="countdownPlaySound" className="text-sm font-medium">Play Alarm Sound</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="countdownPlaySound" name="countdownPlaySound" defaultChecked={data.group.widgetSettings?.countdownPlaySound} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>
            )}
            {data.group.widgetType === 'calendar' && (
                <div>
                    <label htmlFor="holidayCountry" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Country for Holidays</label>
                    <select name="holidayCountry" defaultValue={data.group.widgetSettings?.holidayCountry || 'SE'} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}>
                        {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                </div>
            )}
            {data.group.widgetType === 'todo' && (
                <div className="flex items-center justify-between pt-2">
                    <label htmlFor="todoConfirmDelete" className="text-sm font-medium">Confirm before deleting tasks</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="todoConfirmDelete" name="todoConfirmDelete" defaultChecked={data.group.widgetSettings?.todoConfirmDelete ?? true} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            )}
            {data.group.widgetType === 'currency' && <CurrencySettingsForm group={data.group} themeClasses={themeClasses} />}
            {data.group.widgetType === 'webhook' && <WebhookSettingsForm group={data.group} themeClasses={themeClasses} />}
            {data.group.widgetType === 'solar' && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="solarCity" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>City</label>
                        <input type="text" name="solarCity" defaultValue={data.group.widgetSettings?.solarCity} placeholder="e.g. London" required className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <label htmlFor="solarUse24HourFormat" className="text-sm font-medium">24-hour Time Format</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="solarUse24HourFormat" name="solarUse24HourFormat" defaultChecked={data.group.widgetSettings?.solarUse24HourFormat} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <label htmlFor="solarCompactMode" className="text-sm font-medium">Compact Mode</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="solarCompactMode" name="solarCompactMode" defaultChecked={data.group.widgetSettings?.solarCompactMode} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <label htmlFor="solarDynamicPath" className="text-sm font-medium">Dynamic Sun Path Height</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="solarDynamicPath" name="solarDynamicPath" defaultChecked={data.group.widgetSettings?.solarDynamicPath ?? true} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>
            )}
            {data.group.widgetType === 'homey' && <HomeySettingsForm group={data.group} themeClasses={themeClasses} globalIp={settings.homey?.localIp} globalToken={settings.homey?.apiToken} />}
            {data.group.widgetType === 'radio' && <RadioSettingsForm group={data.group} themeClasses={themeClasses} />}
            {data.group.widgetType === 'favorites' && <FavoritesSettingsForm group={data.group} allColumns={activeDashboard.columns} themeClasses={themeClasses} />}
            {data.group.widgetType === 'picture' && <PictureSettingsForm group={data.group} themeClasses={themeClasses} />}
            {data.group.widgetType === 'iframe' && <IframeSettingsForm group={data.group} themeClasses={themeClasses} />}
            {data.group.widgetType === 'homey_custom' && <HomeyCustomSettingsForm group={data.group} themeClasses={themeClasses} />}

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
              <button type="submit" className={`${themeClasses.buttonPrimary} px-4 py-2 rounded-lg`}>Save</button>
            </div>
          </form>
        );
      case 'addLinkOrSeparator':
        return (
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => openModal('addLink', { groupId: data.groupId, columnId: data.columnId })} className={`p-4 rounded-lg border hover:border-indigo-500 hover:bg-slate-700/50 transition-all font-semibold ${themeClasses.inputBg} ${themeClasses.dashedBorder} flex items-center justify-center gap-2`}>
                <LinkIcon className="w-5 h-5" /> Add Link
            </button>
            <button onClick={() => handleAddButtonHolder(data.groupId, data.columnId)} className={`p-4 rounded-lg border hover:border-indigo-500 hover:bg-slate-700/50 transition-all font-semibold ${themeClasses.inputBg} ${themeClasses.dashedBorder} flex items-center justify-center gap-2`}>
                <SquaresPlusIcon className="w-5 h-5" /> Add Button Holder
            </button>
            <button onClick={() => openModal('addOrEditTextItem', { groupId: data.groupId, columnId: data.columnId })} className={`p-4 rounded-lg border hover:border-indigo-500 hover:bg-slate-700/50 transition-all font-semibold ${themeClasses.inputBg} ${themeClasses.dashedBorder} flex items-center justify-center gap-2`}>
                <span className="text-lg font-bold">H</span> Add Header
            </button>
            <button onClick={() => handleAddSeparator(data.groupId, data.columnId)} className={`p-4 rounded-lg border hover:border-indigo-500 hover:bg-slate-700/50 transition-all font-semibold ${themeClasses.inputBg} ${themeClasses.dashedBorder} flex items-center justify-center gap-2`}>
                <MinusIcon className="w-5 h-5" /> Add Separator
            </button>
          </div>
        );
      case 'exportOptions':
        return (
          <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
            <div>
                <label htmlFor="filename" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Filename</label>
                <input type="text" name="filename" defaultValue={`startpage-backup-${new Date().toISOString().slice(0, 10)}`} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
              <button type="submit" className={`${themeClasses.buttonPrimary} px-4 py-2 rounded-lg`}>Download</button>
            </div>
          </form>
        );
      case 'addHomeyCustomItem':
        return (
            <div className="flex flex-col gap-3">
                <button
                    onClick={() => openModal('selectHomeyItem', { ...data, itemType: 'capability' })}
                    className={`p-3 rounded border hover:bg-slate-700 ${themeClasses.inputBg} ${themeClasses.dashedBorder} text-left`}
                >
                    <span className="font-semibold block">Add Device Capability</span>
                    <span className="text-xs text-slate-400">Sensors, toggles, etc.</span>
                </button>
                <button
                    onClick={() => openModal('selectHomeyItem', { ...data, itemType: 'flow' })}
                    className={`p-3 rounded border hover:bg-slate-700 ${themeClasses.inputBg} ${themeClasses.dashedBorder} text-left`}
                >
                    <span className="font-semibold block">Add Flow Button</span>
                    <span className="text-xs text-slate-400">Trigger a flow manually</span>
                </button>
                <button onClick={() => openModal('addOrEditTextItem', { ...data })} className={`p-3 rounded border hover:bg-slate-700 ${themeClasses.inputBg} ${themeClasses.dashedBorder} text-left`}>
                    <span className="font-semibold block">Add Header</span>
                </button>
                <button onClick={() => handleAddButtonHolder(data.groupId, data.columnId)} className={`p-3 rounded border hover:bg-slate-700 ${themeClasses.inputBg} ${themeClasses.dashedBorder} text-left`}>
                    <span className="font-semibold block">Add Button Holder</span>
                </button>
                <button onClick={() => handleAddSeparator(data.groupId, data.columnId)} className={`p-3 rounded border hover:bg-slate-700 ${themeClasses.inputBg} ${themeClasses.dashedBorder} text-left`}>
                    <span className="font-semibold block">Add Separator</span>
                </button>
            </div>
        );
      case 'selectHomeyItem':
        return (
            <HomeyItemSelector
                themeClasses={themeClasses}
                globalIp={settings.homey?.localIp}
                globalToken={settings.homey?.apiToken}
                itemType={data.itemType}
                onSelect={(selected) => handleHomeySelect({ ...selected, ...data })}
            />
        );
      case 'addOrEditTextItem':
        return (
            <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                    <label htmlFor="textContent" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Header Text</label>
                    <input type="text" name="textContent" defaultValue={data.item?.content || ''} autoFocus required className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
                    <button type="submit" className={`${themeClasses.buttonPrimary} px-4 py-2 rounded-lg`}>Save</button>
                </div>
            </form>
        );
      case 'editHomeyCustomItemName':
        return (
            <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
                <div className="text-sm text-slate-400 mb-2">
                    Editing: <span className="font-semibold text-white">{data.item.customName || data.staticData.name}</span>
                </div>
                <div>
                    <label htmlFor="customName" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Custom Name (Optional)</label>
                    <input type="text" name="customName" defaultValue={data.item.customName || ''} placeholder="Leave empty to use default name" className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
                    <button type="submit" className={`${themeClasses.buttonPrimary} px-4 py-2 rounded-lg`}>Save</button>
                </div>
            </form>
        );
      case 'addFlowButton':
      case 'editFlowButton':
        return (
            <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
               {type === 'addFlowButton' && (
                   <div>
                       <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Select Flow</label>
                       <div className="h-48 border rounded-md overflow-hidden">
                           <HomeyItemSelector
                                themeClasses={themeClasses}
                                globalIp={settings.homey?.localIp}
                                globalToken={settings.homey?.apiToken}
                                itemType='flow'
                                onSelect={(selected) => {
                                    // We need to fetch the flow name or assume it from selection context if we want to store it
                                    // For simplicity, we just set the hidden input value
                                    const input = document.getElementById('flowIdInput') as HTMLInputElement;
                                    if(input && 'flowId' in selected) {
                                        input.value = `${selected.flowId}|Flow`; // Rough, name is not passed back easily here without refetch. 
                                        // A better way would be if selector returned name too. 
                                        // Assuming selector logic handles it or we re-fetch.
                                        // Actually `HomeyItemSelector` does not return name in `onSelect`.
                                        // Let's rely on the user to pick and we'll save ID.
                                        input.value = `${selected.flowId}|Linked Flow`;
                                    }
                                }}
                           />
                       </div>
                       <input type="hidden" name="flowId" id="flowIdInput" defaultValue={data.button ? `${data.button.flowId}|${data.button.flowName}` : ''} required />
                       <p className="text-xs text-slate-500 mt-1">Click a flow above to select it.</p>
                   </div>
               )}
               <div>
                   <label htmlFor="symbol" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Button Symbol/Text</label>
                   <input type="text" name="symbol" defaultValue={data.button?.symbol || ''} placeholder="Emoji or short text (e.g. 🏠)" required maxLength={4} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
               </div>
               <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} px-4 py-2 rounded-lg`}>Cancel</button>
                    <button type="submit" className={`${themeClasses.buttonPrimary} px-4 py-2 rounded-lg`}>Save</button>
                </div>
            </form>
        );
      case 'dashboardSettings':
         return (
             <div className="space-y-4">
                 <div>
                    <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Name</label>
                    <input 
                        type="text" 
                        value={activeDashboard.name} 
                        onChange={(e) => updateActiveDashboard(d => ({ ...d, name: e.target.value }))}
                        className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                    />
                 </div>
                 <div>
                    <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Background Image URL</label>
                    <input 
                        type="text" 
                        value={activeDashboard.backgroundImage || ''} 
                        onChange={(e) => updateActiveDashboard(d => ({ ...d, backgroundImage: e.target.value }))}
                        placeholder="https://..."
                        className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                    />
                 </div>
                 <div>
                    <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Background Color</label>
                    <div className="flex gap-2">
                        <input 
                            type="color" 
                            value={activeDashboard.customBackgroundColor || '#000000'} 
                            onChange={(e) => updateActiveDashboard(d => ({ ...d, customBackgroundColor: e.target.value }))}
                            className="h-10 w-12 bg-transparent border-0 p-0 cursor-pointer rounded"
                        />
                        <input 
                            type="text" 
                            value={activeDashboard.customBackgroundColor || ''} 
                            onChange={(e) => updateActiveDashboard(d => ({ ...d, customBackgroundColor: e.target.value }))}
                            placeholder="#..."
                            className={`flex-1 p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                        />
                    </div>
                 </div>
                 <div className="flex justify-end mt-4">
                     <button onClick={closeModal} className={`${themeClasses.buttonPrimary} px-4 py-2 rounded-lg`}>Done</button>
                 </div>
             </div>
         );
      default:
        return null;
    }
  };

  return (
    <>
      <ThemeStyles theme={themeClasses} />
      {isDragging && <GlobalDragStyles />}
      <DragGhost x={pointerPosition.x - pointerOffset.x} y={pointerPosition.y - pointerOffset.y}>
        {dragGhost}
      </DragGhost>

      <main className={`h-screen flex flex-col py-4 px-2 sm:py-6 sm:px-4 lg:py-8 lg:px-6 transition-colors duration-300 font-sans`}>
        <header className="flex-shrink-0 grid grid-cols-2 md:grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] items-end gap-y-4 gap-x-2 mb-6">

          {/* Row 1 Content */}
          <div className="justify-self-start w-full min-w-0 col-span-1 md:col-auto">
              {isEditMode ? (
                <input type="text" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} maxLength={30} className={`text-3xl font-bold bg-transparent border-b border-slate-600 focus:border-indigo-500 outline-none pl-2 w-full ${themeClasses.header}`} placeholder="Page Title" />
              ) : (
                <h1 className={`text-3xl font-bold ${themeClasses.header} pl-2 truncate`}>{pageTitle}</h1>
              )}
          </div>
          
          {settings.showSearch ? (
            <div className={`w-full max-w-3xl justify-self-center h-10 flex items-center relative col-span-2 md:col-auto order-last md:order-none ${!isFirefox ? 'md:top-2' : 'md:-top-1'}`}>
                <form onSubmit={handleSearchSubmit} className="w-full">
                    <div className="flex w-full">
                        <div className="relative flex-grow">
                           <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MagnifyingGlassIcon className={`h-5 w-5 ${themeClasses.iconMuted}`} aria-hidden="true" /></div>
                           <input type="search" name="search" id="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search with ${searchEngines[settings.searchEngine]?.name || 'Google'}...`} className={`block w-full rounded-l-md rounded-r-none border-0 py-2 pl-10 pr-3 ${themeClasses.inputBg} ${themeClasses.inputFocusRing} placeholder:text-slate-400 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed`} disabled={isEditMode} />
                        </div>
                        <button type="submit" className={`${themeClasses.buttonSecondary} rounded-l-none rounded-r-md px-4 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed`} disabled={isEditMode}>Go</button>
                    </div>
                </form>
            </div>
          ) : (
            <div className="hidden md:block"></div>
          )}

          <div className="justify-self-end flex items-center gap-3 col-span-1 md:col-auto">
              {dashboards.length > 1 && settings.dashboardView === 'dropdown' && (
                <div className="relative" ref={dashboardDropdownRef}>
                    <button
                      onClick={() => setIsDashboardDropdownOpen(prev => !prev)}
                      className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors ${themeClasses.buttonSecondary}`}>
                      <span className="truncate max-w-[150px] text-base font-semibold">{activeDashboard.name}</span>
                      <ChevronDownIcon
                        className={`w-5 h-5 transition-transform ${isDashboardDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isDashboardDropdownOpen && (
                        <div className={`absolute z-20 top-full mt-2 w-48 rounded-md shadow-lg border ${themeClasses.modalBg} ${themeClasses.dashedBorder}`}>
                            <ul className="py-1">
                                {dashboards.map(d => (
                                    <li key={d.id}>
                                        <button 
                                            onClick={() => {
                                                setActiveDashboardId(d.id);
                                                setIsDashboardDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm font-medium ${d.id === activeDashboardId ? themeClasses.header : themeClasses.modalMutedText} ${themeClasses.linkHoverBg}`}
                                        >
                                            {d.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
              )}


            <button onClick={handleToggleEditMode} className={`${isEditMode ? themeClasses.buttonPrimary : themeClasses.buttonSecondary} flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors`}>
              <PencilIcon className="w-5 h-5" /><span>{isEditMode ? 'Done' : 'Edit'}</span>
            </button>
            {!isEditMode && (
              <div className="flex items-center gap-2">
                  {isBackupOverdue && <button onClick={() => onRequestExport()} className="text-yellow-500 hover:text-yellow-400 transition-colors animate-pulse" title="Backup Overdue! Click to export data."><ExclamationTriangleIcon className="w-6 h-6" /></button>}
                  <button onClick={() => setIsSettingsModalOpen(true)} className={`${themeClasses.buttonSecondary} p-2 rounded-lg transition-colors`} aria-label="Settings"><CogIcon className="w-6 h-6" /></button>
              </div>
            )}
          </div>

          {/* Row 2 Content */}              
          {dashboards.length > 1 && settings.dashboardView === 'tabs' && (
              <div className="col-span-2 md:col-span-3 md:row-start-2 -mb-6 pb-2 overflow-x-auto">
                   <div className="flex items-center border-b-2 border-slate-700 space-x-2">
                        {dashboards.map(d => (
                           <button 
                                key={d.id}
                                onClick={() => setActiveDashboardId(d.id)}
                                className={`py-2 px-4 font-semibold text-sm whitespace-nowrap transition-colors rounded-t-md ${d.id === activeDashboardId ? `${themeClasses.buttonPrimary} border-b-2 border-transparent` : `${themeClasses.textMuted} ${themeClasses.linkHoverBg}`}`}
                           >
                               {d.name}
                           </button>
                        ))}
                   </div>
              </div>
          )}
        </header>

        <div className={`flex-grow overflow-x-auto pb-4`}>
           <div 
             className={`h-full ${settings.centerContent && !shouldUsePaddingFix ? 'text-center' : ''}`}
             style={shouldUsePaddingFix && calculatedContentWidth ? { 
                 paddingLeft: `max(0px, calc(50% - ${calculatedContentWidth / 2}px))`,
                 paddingRight: `max(0px, calc(50% - ${calculatedContentWidth / 2}px))`
             } : {}}
           >
             <div 
               className={`inline-flex items-start h-full text-left ${settings.centerContent && !shouldUsePaddingFix ? 'mx-auto' : ''}`}
               style={{ gap: `${settings.columnGap * 0.25}rem` }}
             >
                {columns.map(col => (
                  <ColumnComponent
                    key={col.id}
                    column={col}
                    allColumns={columns}
                    isEditMode={isEditMode}
                    onPointerDown={handlePointerDown}
                    draggedItem={draggedItem}
                    dropTarget={currentDropTarget}
                    openModal={openModal}
                    openLinkGroupPopup={openLinkGroupPopup}
                    groupGap={settings.groupGap}
                    showColumnTitles={isEditMode || settings.showColumnTitles}
                    onToggleGroupCollapsed={handleToggleGroupCollapsed}
                    themeClasses={themeClasses}
                    openLinksInNewTab={settings.openLinksInNewTab}
                    widthStyle={getColumnStyle(col.width)}
                    isDeletable={columns.length > 0}
                    todos={todos}
                    setTodos={setTodos}
                    onCalculatorStateChange={handleCalculatorStateChange}
                    onScratchpadChange={handleScratchpadChange}
                    showGroupToggles={settings.showGroupToggles}
                    homeyGlobalSettings={settings.homey}
                    onRequestDeleteTodo={handleRequestDeleteTodo}
                    homeyDevices={homeyDevices}
                    homeyZones={homeyZones}
                    homeyFlows={homeyFlows}
                    homeyConnectionState={homeyConnectionState}
                    homeyLastUpdate={homeyLastUpdate}
                    homeyCountdown={homeyCountdown}
                    homeyLog={homeyLog}
                    onHomeyToggle={handleHomeyToggle}
                    onHomeyTriggerFlow={handleHomeyTriggerFlow}
                    onHomeyOptimisticUpdate={handleHomeyOptimisticUpdate}
                    onRemoveFavorite={handleRemoveFavorite}
                  />
                ))}

                {isEditMode && (
                  <div className={`flex-shrink-0`} style={getColumnStyle(3)}>
                    <button onClick={() => openModal('addColumn')} className={`w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg transition-colors ${themeClasses.dashedBorder} ${themeClasses.textSubtle} hover:border-slate-500 hover:text-slate-300`}>
                      <PlusIcon /> Add Column
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>
      </main>
      
      <QuotePopup settings={settings} themeClasses={themeClasses} />
      <DonationPopup themeClasses={themeClasses} />

      {linkGroupPopupData && (
        <LinkGroupPopup
          group={linkGroupPopupData.group}
          onClose={closeLinkGroupPopup}
          themeClasses={themeClasses}
          openLinksInNewTab={settings.openLinksInNewTab}
        />
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        pageTitle={pageTitle}
        onPageTitleChange={setPageTitle}
        themeClasses={themeClasses}
        onExport={onRequestExport}
        onImport={handleImport}
        onReset={() => openModal('resetConfirm')}
        dashboards={dashboards}
        onDashboardsChange={handleDashboardsChange}
        activeDashboardId={activeDashboardId}
        setActiveDashboardId={setActiveDashboardId}
      />
      
      <Modal
        isOpen={!!modal}
        onClose={closeModal}
        title={getModalTitle()}
        themeClasses={themeClasses}
      >
        {getModalContent()}
      </Modal>
    </>
  );
}

export default App;
