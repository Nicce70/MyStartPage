

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

// Types for the new Homey Custom Widget
export interface HomeyCapabilityItem {
  id: string;
  type: 'homey_capability';
  deviceId: string;
  capabilityId: string;
}

export interface HomeyFlowItem {
  id: string;
  type: 'homey_flow';
  flowId: string;
}

export interface TextItem {
  id: string;
  type: 'text';
  content: string;
}

export type HomeyCustomItemType = HomeyCapabilityItem | HomeyFlowItem | TextItem | Separator;

// A master type for any item that can exist in a group's `items` array
export type AnyItemType = GroupItemType | HomeyCustomItemType;


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
  items: AnyItemType[];
  isCollapsed?: boolean;
  type?: 'links' | 'widget';
  colorVariant?: 'default' | 'secondary' | 'tertiary' | 'green' | 'gray' | 'black' | 'dark_blue';
  widgetType?: 'weather' | 'calendar' | 'todo' | 'clock' | 'timer' | 'rss' | 'calculator' | 'scratchpad' | 'countdown' | 'currency' | 'webhook' | 'unit_converter' | 'network' | 'solar' | 'homey' | 'radio' | 'favorites' | 'picture' | 'iframe' | 'homey_custom';
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
        selectedCapabilities?: { deviceId: string; capabilityId: string; }[];
        selectedFlows?: { flowId: string; }[];
        enableScroll?: boolean;
        showOneRow?: boolean;
    };
    homeyCustomSettings?: {
        showOneRow?: boolean;
    };
    radioStations?: RadioStation[];
    favoritesOrder?: string[]; // For custom sorting of favorites
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

// Single, unified DraggedItem type
export type DraggedItem =
  | { type: 'groupItem'; item: AnyItemType; sourceGroupId: string; sourceColumnId: string }
  | { type: 'group'; group: Group; sourceColumnId: string }
  | { type: 'column'; column: Column }
  | null;

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
  homey?: {
    localIp?: string;
    apiToken?: string;
    pollingInterval?: number; // in seconds
  };
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

export type ModalType = 'addGroup' | 'editGroup' | 'addLink' | 'editLink' | 'deleteGroup' | 'deleteItem' | 'addColumn' | 'editColumn' | 'deleteColumn' | 'importConfirm' | 'resetConfirm' | 'addWidget' | 'editWidgetSettings' | 'addLinkOrSeparator' | 'exportOptions' | 'addHomeyCustomItem' | 'selectHomeyItem' | 'addOrEditTextItem';

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