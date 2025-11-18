import React, { useState, useEffect, useRef, useMemo } from 'react';
import ColumnComponent from './components/Column';
import SettingsModal from './components/SettingsModal';
import Modal from './components/Modal';
import CurrencySettingsForm from './components/CurrencySettingsForm';
import { PlusIcon, PencilIcon, CogIcon, MagnifyingGlassIcon, SunIcon, ClockIcon, TimerIcon, RssIcon, LinkIcon, ClipboardDocumentCheckIcon, CalculatorIcon, DocumentTextIcon, MinusIcon, PartyPopperIcon, CalendarDaysIcon, BanknotesIcon } from './components/Icons';
import useLocalStorage from './hooks/useLocalStorage';
import { themes } from './themes';
import ThemeStyles from './components/ThemeStyles';
import type { Column, Group, Link, Settings, ModalState, BackupData, Theme, ToDoItem, CalculatorState, GroupItemType } from './types';
import { CALENDAR_WIDGET_ID, TODO_WIDGET_ID, CALCULATOR_WIDGET_ID, WEATHER_WIDGET_ID } from './types';

// Simple UUID generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const DEFAULT_COLUMNS: Column[] = [
  {
    id: uuidv4(),
    name: "Productivity",
    width: 3,
    groups: [
      {
        id: uuidv4(),
        name: "Work",
        items: [
          { id: uuidv4(), type: 'link', name: "Gmail", url: "https://mail.google.com", comment: "Work Email" },
          { id: uuidv4(), type: 'link', name: "Google Calendar", url: "https://calendar.google.com" },
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
          { id: uuidv4(), type: 'link', name: "Reddit", url: "https://www.reddit.com" },
          { id: uuidv4(), type: 'link', name: "Bluesky", url: "https://bsky.app/" },
        ],
        type: 'links'
      },
    ]
  }
];

const runDataMigrationAndValidation = (data: any): Column[] => {
  if (!Array.isArray(data)) {
    console.warn('LocalStorage data for columns is not an array, resetting to default.');
    return DEFAULT_COLUMNS;
  }

  const validatedColumns = data.map(col => {
    if (!col || typeof col !== 'object' || !col.id) return null;

    const groups = Array.isArray(col.groups) ? col.groups.map(group => {
      if (!group || typeof group !== 'object' || !group.id) return null;
      
      let items = group.items;
      // Migration from old `links` property
      if (Array.isArray(group.links) && !items) {
        items = group.links.map((link: any) => ({ ...link, type: 'link' as const }));
      }
      
      // Ensure items is a valid array and filter out bad entries
      if (!Array.isArray(items)) {
        items = [];
      } else {
        items = items.filter(item => item && typeof item === 'object' && item.id && item.type);
      }
      
      const migratedGroup = { ...group, items };
      delete migratedGroup.links; // remove old property
      return migratedGroup;
    }).filter(Boolean) : [];

    return { ...col, groups };
  }).filter(Boolean);

  return validatedColumns as Column[];
};

const DEFAULT_SETTINGS: Settings = {
  columnGap: 4,
  groupGap: 4,
  columnWidth: 4,
  showColumnTitles: true,
  theme: 'default',
  scale: 6,
  openLinksInNewTab: true,
  showSearch: false,
  searchEngine: 'google',
  centerContent: false,
  backgroundImage: '',
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

const searchEngines: { [key: string]: { name: string; url: string } } = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  brave: { name: 'Brave Search', url: 'https://search.brave.com/search?q=' },
};

type DraggedItem = 
  | { type: 'groupItem'; item: GroupItemType; sourceGroupId: string; sourceColumnId: string }
  | { type: 'group'; group: Group; sourceColumnId: string }
  | { type: 'column'; column: Column }
  | null;

// FIX: Property 'supportedValuesOf' does not exist on type 'typeof Intl' in some TypeScript configurations.
// Use optional chaining with a type assertion and provide a fallback to the user's current timezone.
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

const TimerSettingsForm: React.FC<{
  group: Group;
  themeClasses: Theme;
}> = ({ group, themeClasses }) => {
  const [isStopwatch, setIsStopwatch] = useState(group.widgetSettings?.isStopwatch ?? false);
  const isInputsDisabled = isStopwatch;

  // Determine the default values for the uncontrolled inputs.
  // These are calculated every render, which is fine because the `key` prop causes a remount.
  let defaultH, defaultM, defaultS, defaultPlaySound;
  
  if (isStopwatch) {
    // If the form is in stopwatch mode, all values are 0/false.
    defaultH = 0;
    defaultM = 0;
    defaultS = 0;
    defaultPlaySound = false;
  } else {
    // If the form is in timer mode...
    const savedDuration = group.widgetSettings?.timerDuration;
    // Check if the saved duration is 0. If it is, this was likely a stopwatch.
    // In this case, when showing the timer form, default to 5 minutes.
    if (savedDuration === 0) {
        defaultH = 0;
        defaultM = 5;
        defaultS = 0;
        defaultPlaySound = true;
    } else {
        // Otherwise, use the saved duration or the overall default (5 mins).
        const duration = savedDuration ?? 300;
        defaultH = Math.floor(duration / 3600);
        defaultM = Math.floor((duration % 3600) / 60);
        defaultS = duration % 60;
        defaultPlaySound = group.widgetSettings?.timerPlaySound ?? true;
    }
  }

  return (
    <div key={String(isStopwatch)}> {/* Force re-render on toggle to update defaultValues */}
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
          placeholder="e.g., London, GB"
          className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
        />
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

function App() {
  const [rawColumns, setColumns] = useLocalStorage<Column[]>('startpage-columns', DEFAULT_COLUMNS);
  const [rawSettings, setSettings] = useLocalStorage<Settings>('startpage-settings', DEFAULT_SETTINGS);
  const [pageTitle, setPageTitle] = useLocalStorage<string>('startpage-title', 'My Startpage');
  const [todos, setTodos] = useLocalStorage<ToDoItem[]>('startpage-todos', []);

  const columns = useMemo(() => runDataMigrationAndValidation(rawColumns), [rawColumns]);
  const settings = useMemo(() => sanitizeSettings(rawSettings), [rawSettings]);

  useEffect(() => {
    if (JSON.stringify(rawColumns) !== JSON.stringify(columns)) {
      setColumns(columns);
    }
  }, [rawColumns, columns, setColumns]);

  useEffect(() => {
    // If raw settings contain legacy keys that are not in DEFAULT_SETTINGS, clean them up.
    // We rely on sanitizeSettings to filter them out.
    // Using JSON.stringify for comparison is sufficient here.
    if (JSON.stringify(rawSettings) !== JSON.stringify(settings)) {
        setSettings(settings);
    }
  }, [rawSettings, settings, setSettings]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [themeClasses, setThemeClasses] = useState<Theme>(themes.default);
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const formRef = useRef<HTMLFormElement>(null);
  const collapsedGroupsBeforeEdit = useRef<Set<string>>(new Set());

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);
  
  useEffect(() => {
    document.documentElement.style.fontSize = scaleMap[settings.scale] || '16px';
  }, [settings.scale]);

  useEffect(() => {
    setThemeClasses(themes[settings.theme] || themes.default);
    document.body.className = themes[settings.theme]?.body || themes.default.body;
  }, [settings.theme]);

  useEffect(() => {
    if (settings.backgroundImage) {
      document.body.style.backgroundImage = `url('${settings.backgroundImage}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
    }

    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
    };
  }, [settings.backgroundImage]);
  
  useEffect(() => {
    if (modal) {
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

  const openModal = (type: ModalState['type'], data?: any) => setModal({ type, data });
  const closeModal = () => {
    setModal(null);
    if (modal?.type === 'importConfirm') {
        setImportData(null);
    }
  };

  const handleCalculatorStateChange = (newState: CalculatorState) => {
    setColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        groups: column.groups.map(group => {
          if (group.id === CALCULATOR_WIDGET_ID) {
            return { ...group, calculatorState: newState };
          }
          return group;
        })
      }))
    );
  };

  const handleScratchpadChange = (groupId: string, newContent: string) => {
    setColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        groups: column.groups.map(group => {
          if (group.id === groupId) {
            return { 
              ...group, 
              widgetSettings: {
                ...group.widgetSettings,
                scratchpadContent: newContent
              } 
            };
          }
          return group;
        })
      }))
    );
  };

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    const comment = formData.get('comment') as string;
    const width = parseInt(formData.get('width') as string, 10);

    const newColumns = JSON.parse(JSON.stringify(columns));

    switch (modal.type) {
      case 'addColumn':
        setColumns([...columns, { id: uuidv4(), name, groups: [], width: width || 3 }]);
        break;
      case 'editColumn':
        setColumns(columns.map(c => c.id === modal.data.id ? { ...c, name, width: width || 3 } : c));
        break;
      case 'addGroup': {
        const col = newColumns.find((c: Column) => c.id === modal.data.columnId);
        if (col) col.groups.push({ id: uuidv4(), name, items: [], type: 'links' });
        setColumns(newColumns);
        break;
      }
      case 'editGroup': {
        const col = newColumns.find((c: Column) => c.id === modal.data.columnId);
        const group = col?.groups.find((g: Group) => g.id === modal.data.group.id);
        if (group) group.name = name;
        setColumns(newColumns);
        break;
      }
      case 'editWidgetSettings': {
        const col = newColumns.find((c: Column) => c.id === modal.data.columnId);
        const group = col?.groups.find((g: Group) => g.id === modal.data.group.id);
        if (group) {
            if (!group.widgetSettings) group.widgetSettings = {};
            if (group.widgetType === 'weather') {
                const city = formData.get('city') as string;
                group.widgetSettings.city = city;
                group.widgetSettings.weatherShowForecast = formData.has('weatherShowForecast');
                group.widgetSettings.weatherShowTime = formData.has('weatherShowTime');
                if (formData.has('weatherShowTime')) {
                    group.widgetSettings.weatherTimezone = formData.get('weatherTimezone') as string;
                }
            } else if (group.widgetType === 'clock') {
                const timezone = formData.get('timezone') as string;
                const showSeconds = formData.has('showSeconds');
                group.widgetSettings.timezone = timezone;
                group.widgetSettings.showSeconds = showSeconds;
            } else if (group.widgetType === 'timer') {
                const isStopwatch = formData.has('isStopwatch');
                group.widgetSettings.isStopwatch = isStopwatch;
                if (isStopwatch) {
                    group.widgetSettings.timerDuration = 0;
                    group.widgetSettings.timerPlaySound = false;
                } else {
                    const hours = parseInt(formData.get('hours') as string, 10) || 0;
                    const minutes = parseInt(formData.get('minutes') as string, 10) || 0;
                    const seconds = parseInt(formData.get('seconds') as string, 10) || 0;
                    group.widgetSettings.timerDuration = (hours * 3600) + (minutes * 60) + seconds;
                    group.widgetSettings.timerPlaySound = formData.has('timerPlaySound');
                }
            } else if (group.widgetType === 'rss') {
                const rssUrl = formData.get('rssUrl') as string;
                const rssItemCount = parseInt(formData.get('rssItemCount') as string, 10) || 5;
                group.widgetSettings.rssUrl = rssUrl;
                group.widgetSettings.rssItemCount = rssItemCount;
            } else if (group.widgetType === 'countdown') {
                const countdownTitle = formData.get('countdownTitle') as string;
                const countdownDate = formData.get('countdownDate') as string;
                group.widgetSettings.countdownTitle = countdownTitle;
                group.widgetSettings.countdownDate = new Date(countdownDate).toISOString();
            } else if (group.widgetType === 'calendar') {
                const holidayCountry = formData.get('holidayCountry') as string;
                group.widgetSettings.holidayCountry = holidayCountry;
            } else if (group.widgetType === 'currency') {
                const currencyBase = formData.get('currencyBase') as string;
                const currencyTargets = formData.getAll('currencyTargets') as string[];
                group.widgetSettings.currencyBase = currencyBase;
                group.widgetSettings.currencyTargets = currencyTargets;
            }
        }
        setColumns(newColumns);
        break;
      }
      case 'addLink': {
        const col = newColumns.find((c: Column) => c.id === modal.data.columnId);
        const group = col?.groups.find((g: Group) => g.id === modal.data.groupId);
        if (group) group.items.push({ id: uuidv4(), type: 'link', name, url: url.startsWith('https://') || url.startsWith('http://') ? url : `https://${url}`, comment });
        setColumns(newColumns);
        break;
      }
      case 'editLink': {
        const col = newColumns.find((c: Column) => c.id === modal.data.columnId);
        const group = col?.groups.find((g: Group) => g.id === modal.data.groupId);
        const link = group?.items.find((l: GroupItemType) => l.id === modal.data.link.id);
        if (link && link.type === 'link') {
          link.name = name;
          link.url = url;
          link.comment = comment;
        }
        setColumns(newColumns);
        break;
      }
    }
    closeModal();
  };
  
  const handleAddSeparator = (groupId: string, columnId: string) => {
    setColumns(prevColumns => prevColumns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          groups: col.groups.map(g => {
            if (g.id === groupId) {
              return {
                ...g,
                items: [...g.items, { id: uuidv4(), type: 'separator' }]
              };
            }
            return g;
          })
        };
      }
      return col;
    }));
    closeModal();
  };

  const handleAddWidget = (widgetType: 'weather' | 'clock' | 'timer' | 'rss' | 'todo' | 'calculator' | 'scratchpad' | 'countdown' | 'calendar' | 'currency', columnId: string) => {
    const newColumns = JSON.parse(JSON.stringify(columns));
    const col = newColumns.find((c: Column) => c.id === columnId);
    if (!col) return;

    let newWidget: Group;

    if (widgetType === 'weather') {
        newWidget = {
            id: uuidv4(),
            name: "Weather",
            items: [],
            type: 'widget',
            widgetType: 'weather',
            widgetSettings: { 
              city: 'Stockholm', 
              weatherShowForecast: false,
              weatherShowTime: false,
              weatherTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }
        };
    } else if (widgetType === 'clock') {
      newWidget = {
          id: uuidv4(),
          name: "Clock",
          items: [],
          type: 'widget',
          widgetType: 'clock',
          widgetSettings: { 
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            showSeconds: true,
          }
      };
    } else if (widgetType === 'timer') {
        newWidget = {
            id: uuidv4(),
            name: "Timer / Stopwatch",
            items: [],
            type: 'widget',
            widgetType: 'timer',
            widgetSettings: { 
              timerDuration: 300, // 5 minutes default
              timerPlaySound: true,
              isStopwatch: false,
            }
        };
    } else if (widgetType === 'rss') {
        newWidget = {
            id: uuidv4(),
            name: "RSS Feed",
            items: [],
            type: 'widget',
            widgetType: 'rss',
            widgetSettings: { 
              rssUrl: '',
              rssItemCount: 5,
            }
        };
    } else if (widgetType === 'todo') {
        newWidget = { 
          id: TODO_WIDGET_ID, 
          name: 'To-Do List', 
          items: [], 
          isCollapsed: false, 
          type: 'widget', 
          widgetType: 'todo' 
        };
    } else if (widgetType === 'calculator') {
        newWidget = { 
            id: CALCULATOR_WIDGET_ID, 
            name: 'Calculator', 
            items: [], 
            isCollapsed: false, 
            type: 'widget', 
            widgetType: 'calculator',
            calculatorState: {
              currentValue: '0',
              previousValue: null,
              operator: null,
              isNewEntry: true,
            }
        };
    } else if (widgetType === 'scratchpad') {
        newWidget = {
            id: uuidv4(),
            name: "Scratchpad",
            items: [],
            type: 'widget',
            widgetType: 'scratchpad',
            widgetSettings: { 
              scratchpadContent: ''
            }
        };
    } else if (widgetType === 'countdown') {
        newWidget = {
            id: uuidv4(),
            name: "Countdown",
            items: [],
            type: 'widget',
            widgetType: 'countdown',
            widgetSettings: { 
              countdownTitle: 'My Event',
              countdownDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        };
    } else if (widgetType === 'calendar') {
        newWidget = { 
          id: CALENDAR_WIDGET_ID, 
          name: 'Calendar', 
          items: [], 
          isCollapsed: false, 
          type: 'widget', 
          widgetType: 'calendar',
          widgetSettings: {
            holidayCountry: 'SE'
          }
        };
    } else if (widgetType === 'currency') {
        newWidget = {
            id: uuidv4(),
            name: "Currency Converter",
            items: [],
            type: 'widget',
            widgetType: 'currency',
            widgetSettings: { 
              currencyBase: 'SEK',
              currencyTargets: ['USD', 'EUR', 'NOK']
            }
        };
    } else {
        return;
    }

    col.groups.push(newWidget);
    setColumns(newColumns);
    closeModal();
  };

  const handleDelete = () => {
    if (!modal?.type.startsWith('delete')) return;

    let newColumns = [...columns];

    switch (modal.type) {
      case 'deleteColumn': {
        newColumns = columns.filter(c => c.id !== modal.data.id);
        break;
      }
      case 'deleteGroup':
        newColumns = columns.map(c => {
          if (c.id === modal.data.columnId) {
            return { ...c, groups: c.groups.filter(g => g.id !== modal.data.group.id) };
          }
          return c;
        });
        break;
      case 'deleteItem':
        newColumns = columns.map(c => {
          if (c.id === modal.data.columnId) {
            return {
              ...c,
              groups: c.groups.map(g => {
                if (g.id === modal.data.groupId) {
                  return { ...g, items: g.items.filter(i => i.id !== modal.data.item.id) };
                }
                return g;
              })
            };
          }
          return c;
        });
        break;
    }

    setColumns(newColumns);
    closeModal();
  };
  
  const handleDragStart = (item: DraggedItem) => {
    setDraggedItem(item);
  };
  
  const handleDrop = (target: { columnId: string; groupId?: string; itemId?: string }) => {
    if (!draggedItem) return;

    let newColumns = JSON.parse(JSON.stringify(columns));

    // Remove the dragged item from its original position
    if (draggedItem.type === 'groupItem') {
      const sourceCol = newColumns.find((c: Column) => c.id === draggedItem.sourceColumnId);
      const sourceGroup = sourceCol?.groups.find((g: Group) => g.id === draggedItem.sourceGroupId);
      if (sourceGroup) {
        sourceGroup.items = sourceGroup.items.filter((i: GroupItemType) => i.id !== draggedItem.item.id);
      }
    } else if (draggedItem.type === 'group') {
      const sourceCol = newColumns.find((c: Column) => c.id === draggedItem.sourceColumnId);
      if (sourceCol) {
        sourceCol.groups = sourceCol.groups.filter((g: Group) => g.id !== draggedItem.group.id);
      }
    } else if (draggedItem.type === 'column') {
      newColumns = newColumns.filter((c: Column) => c.id !== draggedItem.column.id);
    }
    
    // Add the dragged item to its new position
    if (draggedItem.type === 'groupItem') {
      const targetCol = newColumns.find((c: Column) => c.id === target.columnId);
      const targetGroup = targetCol?.groups.find((g: Group) => g.id === target.groupId);
      if (targetGroup) {
        const targetItemIndex = target.itemId ? targetGroup.items.findIndex((i: GroupItemType) => i.id === target.itemId) : targetGroup.items.length;
        targetGroup.items.splice(targetItemIndex, 0, draggedItem.item);
      }
    } else if (draggedItem.type === 'group') {
      const targetCol = newColumns.find((c: Column) => c.id === target.columnId);
      if (targetCol) {
        const targetGroupIndex = target.groupId ? targetCol.groups.findIndex((g: Group) => g.id === target.groupId) : targetCol.groups.length;
        targetCol.groups.splice(targetGroupIndex, 0, draggedItem.group);
      }
    } else if (draggedItem.type === 'column') {
      const targetColumnIndex = newColumns.findIndex((c: Column) => c.id === target.columnId);
      newColumns.splice(targetColumnIndex, 0, draggedItem.column);
    }

    setColumns(newColumns);
    setDraggedItem(null);
  };

  const handleToggleGroupCollapsed = (columnId: string, groupId: string) => {
    const newColumns = columns.map(c => {
      if (c.id === columnId) {
        return {
          ...c,
          groups: c.groups.map(g => {
            if (g.id === groupId) {
              return { ...g, isCollapsed: !g.isCollapsed };
            }
            return g;
          })
        };
      }
      return c;
    });
    setColumns(newColumns);
  };
  
  const handleExport = () => {
    const data: BackupData = {
      version: 1,
      columns,
      settings,
      pageTitle,
      todos,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `startpage-backup-${date}.json`;
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result) as BackupData;
        
        if (data.version === 1 && data.columns && data.settings && data.pageTitle) {
          setImportData(data);
          openModal('importConfirm');
        } else {
          throw new Error("Invalid backup file format.");
        }
      } catch (error) {
        alert(`Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };
  
  const applyImport = () => {
    if (!importData) return;
    
    setColumns(runDataMigrationAndValidation(importData.columns));
    setSettings(prevSettings => ({...prevSettings, ...importData.settings}));
    setPageTitle(importData.pageTitle);
    setTodos(importData.todos || []);
    
    setIsSettingsModalOpen(false); // Close settings modal
    closeModal(); // Close confirmation modal
    
    alert("Import successful!");
  };

  const handleResetToDefaults = () => {
    setColumns(DEFAULT_COLUMNS);
    setSettings(DEFAULT_SETTINGS);
    setPageTitle('My Startpage');
    setTodos([]);
    closeModal();
    setIsSettingsModalOpen(false);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode || !searchQuery.trim()) return;

    const engine = searchEngines[settings.searchEngine] || searchEngines.google;
    const searchUrl = `${engine.url}${encodeURIComponent(searchQuery)}`;
    
    if (settings.openLinksInNewTab) {
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = searchUrl;
    }
  };

  const handleToggleEditMode = () => {
    setColumns(currentColumns => {
      // Entering edit mode
      if (!isEditMode) {
        const collapsedIds = new Set<string>();
        currentColumns.forEach(col => {
          col.groups.forEach(group => {
            if (group.isCollapsed) {
              collapsedIds.add(group.id);
            }
          });
        });
        collapsedGroupsBeforeEdit.current = collapsedIds;
  
        // Expand all groups
        return currentColumns.map(col => ({
          ...col,
          groups: col.groups.map(group => ({
            ...group,
            isCollapsed: false,
          })),
        }));
      } else { // Exiting edit mode
        const restoredColumns = currentColumns.map(col => ({
          ...col,
          groups: col.groups.map(group => ({
            ...group,
            isCollapsed: collapsedGroupsBeforeEdit.current.has(group.id),
          })),
        }));
        collapsedGroupsBeforeEdit.current.clear();
        return restoredColumns;
      }
    });
  
    setIsEditMode(prev => !prev);
  };

  const getModalContent = () => {
    if (!modal) return null;
    
    const { type, data } = modal;

    if (type === 'addLinkOrSeparator') {
      return (
        <div>
            <p className={`${themeClasses.modalMutedText} mb-4`}>Select an item to add to the group:</p>
            <div className="space-y-3">
                <button 
                    onClick={() => setModal({ type: 'addLink', data })}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
                >
                   <LinkIcon className="w-5 h-5" />
                   <span className="font-semibold">Link</span>
                </button>
                <button 
                    onClick={() => handleAddSeparator(data.groupId, data.columnId)}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
                >
                   <MinusIcon className="w-5 h-5" />
                   <span className="font-semibold">Separator</span>
                </button>
            </div>
        </div>
      );
    }

    if (type === 'addWidget') {
        const todoExists = columns.some(col => col.groups.some(g => g.widgetType === 'todo'));
        const calculatorExists = columns.some(col => col.groups.some(g => g.widgetType === 'calculator'));
        const calendarExists = columns.some(col => col.groups.some(g => g.widgetType === 'calendar'));

        const multiInstanceWidgets = (
          <>
            <button 
                onClick={() => handleAddWidget('weather', data.columnId)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
            >
               <SunIcon className="w-5 h-5" />
               <span className="font-semibold">Weather Widget</span>
            </button>
            <button 
                onClick={() => handleAddWidget('clock', data.columnId)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
            >
               <ClockIcon className="w-5 h-5" />
               <span className="font-semibold">Clock Widget</span>
            </button>
            <button 
                onClick={() => handleAddWidget('timer', data.columnId)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
            >
               <TimerIcon className="w-5 h-5" />
               <span className="font-semibold">Timer / Stopwatch Widget</span>
            </button>
            <button 
                onClick={() => handleAddWidget('rss', data.columnId)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
            >
               <RssIcon className="w-5 h-5" />
               <span className="font-semibold">RSS Feed Widget</span>
            </button>
             <button 
                onClick={() => handleAddWidget('currency', data.columnId)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
            >
               <BanknotesIcon className="w-5 h-5" />
               <span className="font-semibold">Currency Widget</span>
            </button>
            <button 
                onClick={() => handleAddWidget('scratchpad', data.columnId)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
            >
               <DocumentTextIcon className="w-5 h-5" />
               <span className="font-semibold">Scratchpad Widget</span>
            </button>
            <button 
                onClick={() => handleAddWidget('countdown', data.columnId)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
            >
               <PartyPopperIcon className="w-5 h-5" />
               <span className="font-semibold">Countdown Widget</span>
            </button>
          </>
        );

        const singleInstanceWidgets = (
          <>
            {!calendarExists && (
              <button 
                  onClick={() => handleAddWidget('calendar', data.columnId)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
              >
                  <CalendarDaysIcon className="w-5 h-5" />
                  <span className="font-semibold">Calendar Widget</span>
              </button>
            )}
            {!todoExists && (
              <button 
                  onClick={() => handleAddWidget('todo', data.columnId)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
              >
                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                  <span className="font-semibold">To-Do List Widget</span>
              </button>
            )}
            {!calculatorExists && (
              <button 
                  onClick={() => handleAddWidget('calculator', data.columnId)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
              >
                  <CalculatorIcon className="w-5 h-5" />
                  <span className="font-semibold">Calculator Widget</span>
              </button>
            )}
          </>
        );

        const hasSingleInstanceWidgets = !calendarExists || !todoExists || !calculatorExists;

        return (
            <div>
                <p className={`${themeClasses.modalMutedText} mb-4`}>Select an item to add to this column:</p>
                <div className="space-y-3">
                    <button 
                        onClick={() => setModal({ type: 'addGroup', data })}
                        className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${themeClasses.buttonSecondary}`}
                    >
                       <LinkIcon className="w-5 h-5" />
                       <span className="font-semibold">Link Group</span>
                    </button>
                    
                    <hr className={`border-slate-700 my-3`}/>
                    
                    {multiInstanceWidgets}

                    {hasSingleInstanceWidgets && (
                      <>
                        <hr className={`border-slate-700 my-3`}/>
                        {singleInstanceWidgets}
                      </>
                    )}
                </div>
            </div>
        );
    }
    
    if (type === 'importConfirm') {
      return (
        <div>
          <p className={themeClasses.modalMutedText}>Are you sure you want to import this file? This will overwrite all your current settings, columns, and links.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
            <button onClick={applyImport} className={`${themeClasses.buttonDanger} font-semibold py-2 px-4 rounded-lg transition-colors`}>Yes, Overwrite</button>
          </div>
        </div>
      );
    }
    
    if (type === 'resetConfirm') {
      return (
        <div>
          <p className={themeClasses.modalMutedText}>Are you sure you want to reset everything? All your columns, groups, links, and settings will be permanently deleted and restored to the default configuration.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
            <button onClick={handleResetToDefaults} className={`${themeClasses.buttonDanger} font-semibold py-2 px-4 rounded-lg transition-colors`}>Yes, Reset Everything</button>
          </div>
        </div>
      );
    }
    
    if (type.startsWith('delete')) {
      let itemName = '';
      if (type === 'deleteColumn') itemName = data.name;
      if (type === 'deleteGroup') itemName = data.group.name;
      if (type === 'deleteItem') itemName = data.item.type === 'link' ? data.item.name : 'this separator';
      
      return (
        <div>
          <p className={themeClasses.modalMutedText}>Are you sure you want to delete "{itemName}"?</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
            <button onClick={handleDelete} className={`${themeClasses.buttonDanger} font-semibold py-2 px-4 rounded-lg transition-colors`}>Delete</button>
          </div>
        </div>
      );
    }

    if (type === 'editWidgetSettings') {
      const { group } = data;
      if (group.widgetType === 'weather') {
          return (
              <form onSubmit={handleFormSubmit} ref={formRef}>
                <WeatherSettingsForm group={group} themeClasses={themeClasses} />
                <div className="flex justify-end gap-3 pt-6">
                  <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
                  <button type="submit" className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Save</button>
                </div>
              </form>
          );
      }

      if (group.widgetType === 'clock') {
          const currentTimezone = group.widgetSettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
          const currentShowSeconds = group.widgetSettings?.showSeconds ?? true;
          return (
              <form onSubmit={handleFormSubmit} ref={formRef}>
                  <div className="space-y-4">
                      <div>
                          <label htmlFor="timezone" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Timezone</label>
                          <select
                              id="timezone"
                              name="timezone"
                              defaultValue={currentTimezone}
                              required
                              className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing} max-h-60`}
                          >
                              {timezones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                          </select>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <label htmlFor="showSeconds" className="text-sm font-medium">Show Seconds</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="showSeconds"
                            name="showSeconds"
                            defaultChecked={currentShowSeconds}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-6">
                      <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
                      <button type="submit" className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Save</button>
                  </div>
              </form>
          );
      }
      
      if (group.widgetType === 'timer') {
          return (
              <form onSubmit={handleFormSubmit} ref={formRef}>
                  <TimerSettingsForm group={group} themeClasses={themeClasses} />
                  <div className="flex justify-end gap-3 pt-6">
                      <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
                      <button type="submit" className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Set</button>
                  </div>
              </form>
          );
      }

      if (group.widgetType === 'rss') {
        const currentUrl = group.widgetSettings?.rssUrl || '';
        const currentItemCount = group.widgetSettings?.rssItemCount || 5;
        return (
            <form onSubmit={handleFormSubmit} ref={formRef}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="rssUrl" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>RSS Feed URL</label>
                  <input
                    type="url"
                    id="rssUrl"
                    name="rssUrl"
                    defaultValue={currentUrl}
                    required
                    placeholder="https://example.com/feed.xml"
                    className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                  />
                </div>
                <div>
                    <label htmlFor="rssItemCount" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Number of Items to Show</label>
                    <input type="number" id="rssItemCount" name="rssItemCount" defaultValue={currentItemCount} min="1" max="20" className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
                <button type="submit" className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Save</button>
              </div>
            </form>
        );
      }

      if (group.widgetType === 'countdown') {
        const targetDate = new Date(group.widgetSettings?.countdownDate || Date.now());
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(targetDate.getTime() - tzoffset)).toISOString().slice(0, 16);

        return (
            <form onSubmit={handleFormSubmit} ref={formRef}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="countdownTitle" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Event Title</label>
                  <input
                    type="text"
                    id="countdownTitle"
                    name="countdownTitle"
                    defaultValue={group.widgetSettings?.countdownTitle || 'My Event'}
                    required
                    placeholder="e.g., Vacation"
                    className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                  />
                </div>
                <div>
                    <label htmlFor="countdownDate" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Date and Time</label>
                    <input 
                        type="datetime-local" 
                        id="countdownDate" 
                        name="countdownDate"
                        defaultValue={localISOTime}
                        required
                        className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} 
                    />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
                <button type="submit" className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Save</button>
              </div>
            </form>
        );
      }

      if (group.widgetType === 'calendar') {
        return (
          <form onSubmit={handleFormSubmit} ref={formRef}>
            <div>
              <label htmlFor="holidayCountry" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Country for Holidays</label>
              <select
                id="holidayCountry"
                name="holidayCountry"
                defaultValue={group.widgetSettings?.holidayCountry || 'SE'}
                className={`w-full p-2 mt-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
              >
                {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-6">
              <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
              <button type="submit" className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Save</button>
            </div>
          </form>
        );
      }
      if (group.widgetType === 'currency') {
          return (
              <form onSubmit={handleFormSubmit} ref={formRef}>
                <CurrencySettingsForm group={group} themeClasses={themeClasses} />
                <div className="flex justify-end gap-3 pt-6">
                  <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
                  <button type="submit" className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Save</button>
                </div>
              </form>
          );
      }
    }
    
    const isLink = type === 'addLink' || type === 'editLink';
    const isColumn = type === 'addColumn' || type === 'editColumn';
    
    const currentName = type.startsWith('edit') ? (data.group?.name || data.link?.name || data.name) : '';
    const currentUrl = type === 'editLink' ? data.link.url : (type === 'addLink' ? 'https://' : '');
    const currentComment = type === 'editLink' ? data.link.comment : '';
    const currentColumnWidth = isColumn ? (data?.width || 3) : 3;

    return (
      <form onSubmit={handleFormSubmit} ref={formRef}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>
              Name <span className="text-xs font-normal opacity-70">(max 30 chars)</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={currentName}
              required
              maxLength={30}
              className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
            />
          </div>
          {isColumn && (
             <div>
                <label htmlFor="width" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Column Width</label>
                <input
                  type="range"
                  id="width"
                  name="width"
                  min="1"
                  max="5"
                  defaultValue={currentColumnWidth}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2"
                />
                <div className="flex justify-between text-xs text-slate-400 px-1">
                  <span>Narrow</span>
                  <span>Normal</span>
                  <span>Wide</span>
                </div>
              </div>
          )}
          {isLink && (
            <>
              <div>
                <label htmlFor="url" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>URL</label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  defaultValue={currentUrl}
                  required
                  className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
              </div>
              <div>
                <label htmlFor="comment" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>
                  Comment (optional) <span className="text-xs font-normal opacity-70">(max 150 chars)</span>
                </label>
                <input
                  type="text"
                  id="comment"
                  name="comment"
                  defaultValue={currentComment}
                  maxLength={150}
                  className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-6">
          <button type="button" onClick={closeModal} className={`${themeClasses.buttonSecondary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Cancel</button>
          <button type="submit" className={`${themeClasses.buttonPrimary} font-semibold py-2 px-4 rounded-lg transition-colors`}>Save</button>
        </div>
      </form>
    );
  };
  
  const getModalTitle = () => {
    if (!modal) return '';
    switch (modal.type) {
      case 'addColumn': return 'Add Column';
      case 'editColumn': return 'Edit Column';
      case 'addGroup': return 'Add Link Group';
      case 'editGroup': return 'Edit Group Name';
      case 'addLink': return 'Add Link';
      case 'editLink': return 'Edit Link';
      case 'deleteColumn': return 'Delete Column';
      case 'deleteGroup': return 'Delete Group';
      case 'deleteItem': return `Delete ${modal.data.item.type === 'link' ? 'Link' : 'Separator'}`;
      case 'importConfirm': return 'Confirm Import';
      case 'resetConfirm': return 'Confirm Reset';
      case 'addWidget': return 'Add to Column';
      case 'addLinkOrSeparator': return 'Add to Group';
      case 'editWidgetSettings': return 'Widget Settings';
      default: return '';
    }
  };

  const baseWidthsInRem: { [key: number]: number } = { 1: 15, 2: 18, 3: 20, 4: 24, 5: 28 }; // Corresponds roughly to w-60, w-72, w-80, w-96, w-[28rem]
  const globalMultipliers: { [key: number]: number } = { 1: 0.8, 2: 0.85, 3: 0.9, 4: 1.0, 5: 1.1, 6: 1.2, 7: 1.3, 8: 1.4, 9: 1.5 };

  const getColumnStyle = (columnWidth: number | undefined) => {
    const individualWidth = columnWidth || 3;
    const baseWidth = baseWidthsInRem[individualWidth];
    const multiplier = globalMultipliers[settings.columnWidth];
    return { flexBasis: `${baseWidth * multiplier}rem` };
  };

  return (
    <>
      <ThemeStyles theme={themeClasses} />
      <main className={`h-screen flex flex-col py-4 px-2 sm:py-6 sm:px-4 lg:py-8 lg:px-6 transition-colors duration-300 font-sans`}>
        <header className="flex-shrink-0 grid grid-cols-[1fr_2fr_1fr] items-end gap-4 mb-6">
          <div className="justify-self-start w-full min-w-0">
              {isEditMode ? (
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  maxLength={30}
                  className={`text-3xl font-bold bg-transparent border-b border-slate-600 focus:border-indigo-500 outline-none pl-2 w-full ${themeClasses.header}`}
                  placeholder="Page Title"
                />
              ) : (
                <h1 className={`text-3xl font-bold ${themeClasses.header} pl-2 truncate`}>{pageTitle}</h1>
              )}
          </div>
                    
          <div className="w-full max-w-xl justify-self-center h-10 flex items-center relative top-2">
              {settings.showSearch && (
                  <form onSubmit={handleSearchSubmit} className="w-full relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <MagnifyingGlassIcon className={`h-5 w-5 ${themeClasses.iconMuted}`} aria-hidden="true" />
                      </div>
                      <input
                          type="search"
                          name="search"
                          id="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={`Search with ${searchEngines[settings.searchEngine]?.name || 'Google'}...`}
                          className={`block w-full rounded-md border-0 py-2 pl-10 pr-3 ${themeClasses.inputBg} ${themeClasses.inputFocusRing} placeholder:text-slate-400 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={isEditMode}
                      />
                  </form>
              )}
          </div>

          <div className="justify-self-end flex items-center gap-3">
            <button
              onClick={handleToggleEditMode}
              className={`${isEditMode ? themeClasses.buttonPrimary : themeClasses.buttonSecondary} flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors`}
            >
              <PencilIcon className="w-5 h-5" />
              <span>{isEditMode ? 'Done' : 'Edit'}</span>
            </button>
            {!isEditMode && (
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className={`${themeClasses.buttonSecondary} p-2 rounded-lg transition-colors`}
                aria-label="Settings"
              >
                <CogIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </header>

        <div className="flex-grow overflow-x-auto pb-4">
          <div
            className={`flex items-start h-full ${settings.centerContent ? 'w-fit mx-auto' : ''}`}
            style={{ gap: `${settings.columnGap * 0.25}rem` }}
          >
            {columns.map(col => (
              <ColumnComponent
                key={col.id}
                column={col}
                isEditMode={isEditMode}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                draggedItem={draggedItem}
                openModal={openModal}
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
              />
            ))}

            {isEditMode && (
              <div className={`flex-shrink-0`} style={getColumnStyle(3)}>
                <button
                  onClick={() => openModal('addColumn')}
                  className={`w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg transition-colors ${themeClasses.dashedBorder} ${themeClasses.textSubtle} hover:border-slate-500 hover:text-slate-300`}
                >
                  <PlusIcon />
                  Add Column
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        themeClasses={themeClasses}
        onExport={handleExport}
        onImport={handleImport}
        onReset={() => openModal('resetConfirm')}
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