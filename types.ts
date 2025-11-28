

export interface Link {
  id: string;
  type: 'link';
  name: string;
  url: string;
  comment?: string;
  isFavorite?: boolean;
}

export interface Separator {
  id: string;
  type: 'separator';
}

export type GroupItemType = Link | Separator;


export interface CalculatorState {
  currentValue: string;
  previousValue: string | null;
  operator: string | null;
  isNewEntry: boolean;
}

export interface WebhookItem {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'navigate';
}

export interface RadioStation {
  id: string;
  name: string;
  url: string;
}

export interface Group {
  id:string;
  name: string;
  items: GroupItemType[];
  isCollapsed?: boolean;
  type?: 'links' | 'widget';
  colorVariant?: 'default' | 'secondary' | 'tertiary' | 'green' | 'gray' | 'black' | 'dark_blue';
  widgetType?: 'weather' | 'calendar' | 'todo' | 'clock' | 'timer' | 'rss' | 'calculator' | 'scratchpad' | 'countdown' | 'currency' | 'webhook' | 'unit_converter' | 'network' | 'solar' | 'homey' | 'radio' | 'favorites' | 'picture' | 'iframe';
  widgetSettings?: {
    city?: string;
    weatherShowForecast?: boolean;
    weatherShowTime?: boolean;
    weatherTimezone?: string;
    weatherUpdateInterval?: number; // Interval in minutes
    timezone?: string;
    showSeconds?: boolean;
    showDate?: boolean; // New setting for Clock widget
    timerDuration?: number; // Duration in seconds
    timerPlaySound?: boolean;
    timerOvertime?: boolean; // New setting for overtime
    isStopwatch?: boolean;
    rssUrl?: string;
    rssItemCount?: number;
    rssUpdateInterval?: number; // Interval in minutes. 0 = never (manual/load only)
    scratchpadContent?: string;
    countdownTitle?: string;
    countdownDate?: string;
    countdownBehavior?: 'discrete' | 'confetti' | 'fullscreen' | 'intense';
    countdownPlaySound?: boolean;
    holidayCountry?: string;
    currencyBase?: string;
    currencyTargets?: string[];
    webhookItems?: WebhookItem[];
    solarCity?: string;
    solarUse24HourFormat?: boolean;
    solarCompactMode?: boolean;
    homeySettings?: {
        localIp?: string;
        apiToken?: string;
        deviceIds?: string[];
    };
    radioStations?: RadioStation[];
    pictureUrl?: string;
    pictureBase64?: string;
    pictureSourceType?: 'url' | 'upload';
    pictureHeight?: number; // in pixels
    pictureFit?: 'cover' | 'contain' | 'fill';
    pictureBorderRadius?: boolean;
    iframeUrl?: string;
    iframeHeight?: number;
    iframeViewMode?: 'desktop' | 'mobile';
    iframeUpdateInterval?: number; // in minutes
    compactMode?: boolean; // For link groups
  };
  calculatorState?: CalculatorState;
  links?: Link[]; // For data migration
}

export interface Column {
  id: string;
  name: string;
  groups: Group[];
  width?: number;
}

export interface ToDoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CustomThemeColors {
  background: string; // Main background
  panel: string;      // Column/Modal background
  primary: string;    // Primary buttons/accents
  secondary: string;  // Secondary buttons/headers
  text: string;       // Main text color
}

export interface Settings {
  columnGap: number;
  groupGap: number;
  columnWidth: number;
  showColumnTitles: boolean;
  theme: string;
  customThemeColors: CustomThemeColors;
  customBackgroundColor?: string; // Override theme background
  scale: number;
  openLinksInNewTab: boolean;
  showSearch: boolean;
  searchEngine: string;
  centerContent: boolean;
  backgroundImage: string;
  showGroupToggles: boolean;
  backupReminderInterval: number; // Days. 0 = Never.
  showQuotes: boolean;
  quoteCategory: string;
  quoteFrequency: 'daily' | 'always';
}

// FIX: Define and export the Theme interface
export interface Theme {
  name: string;
  body: string;
  header: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonDanger: string;
  buttonIconHoverBg: string;
  buttonIconHoverText: string;
  modalBg: string;
  modalText: string;
  modalMutedText: string;
  inputBg: string;
  inputFocusRing: string;
  columnBg: string;
  groupBg: string;
  groupBgSecondary: string;
  groupBgTertiary: string;
  linkBg: string;
  linkHoverBg: string;
  linkText: string;
  linkHoverText: string;
  iconMuted: string;
  ring: string;
  dashedBorder: string;
  textMuted: string;
  textSubtle: string;
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
}

export interface BackupData {
  version: number;
  columns: Column[];
  settings: Settings;
  pageTitle: string;
  todos: ToDoItem[];
}

export type ModalType = 'addGroup' | 'editGroup' | 'addLink' | 'editLink' | 'deleteGroup' | 'deleteItem' | 'addColumn' | 'editColumn' | 'deleteColumn' | 'importConfirm' | 'resetConfirm' | 'addWidget' | 'editWidgetSettings' | 'addLinkOrSeparator' | 'exportOptions';

export interface ModalState {
  type: ModalType;
  data?: any;
}

export interface GCalEvent {
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  htmlLink: string;
}

// Open-Meteo based structure
export interface WeatherData {
  locationName: string;
  current: {
    temp: number;
    weatherCode: number;
    description: string;
    isDay: boolean;
  };
  daily: {
    date: string; // ISO date string
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
    description: string;
  }[];
}

export const CALENDAR_WIDGET_ID = 'calendar-widget-id';
export const TODO_WIDGET_ID = 'todo-widget-id';
export const CALCULATOR_WIDGET_ID = 'calculator-widget-id';
export const WEATHER_WIDGET_ID = 'weather-widget-id';