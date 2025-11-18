export interface Link {
  id: string;
  type: 'link';
  name: string;
  url: string;
  comment?: string;
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

export interface Group {
  id:string;
  name: string;
  items: GroupItemType[];
  isCollapsed?: boolean;
  type?: 'links' | 'widget';
  widgetType?: 'weather' | 'calendar' | 'todo' | 'clock' | 'timer' | 'rss' | 'calculator' | 'scratchpad' | 'countdown' | 'currency';
  widgetSettings?: {
    city?: string;
    weatherShowForecast?: boolean;
    weatherShowTime?: boolean;
    weatherTimezone?: string;
    timezone?: string;
    showSeconds?: boolean;
    timerDuration?: number; // Duration in seconds
    timerPlaySound?: boolean;
    isStopwatch?: boolean;
    rssUrl?: string;
    rssItemCount?: number;
    scratchpadContent?: string;
    countdownTitle?: string;
    countdownDate?: string;
    holidayCountry?: string;
    currencyBase?: string;
    currencyTargets?: string[];
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

export interface Settings {
  columnGap: number;
  groupGap: number;
  columnWidth: number;
  showColumnTitles: boolean;
  theme: string;
  scale: number;
  openLinksInNewTab: boolean;
  showSearch: boolean;
  searchEngine: string;
  centerContent: boolean;
  backgroundImage: string;
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

export type ModalType = 'addGroup' | 'editGroup' | 'addLink' | 'editLink' | 'deleteGroup' | 'deleteItem' | 'addColumn' | 'editColumn' | 'deleteColumn' | 'importConfirm' | 'resetConfirm' | 'addWidget' | 'editWidgetSettings' | 'addLinkOrSeparator';

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

export interface WeatherData {
  current_condition: {
    temp_C: string;
    weatherDesc: { value: string }[];
    weatherIconUrl: { value: string }[];
  }[];
  nearest_area: {
    areaName: { value: string }[];
  }[];
  weather: {
    date: string;
    maxtempC: string;
    mintempC: string;
    hourly: {
        weatherIconUrl: { value: string }[];
        // FIX: Add missing 'weatherDesc' property to match API response and fix type error in Weather.tsx.
        weatherDesc: { value: string }[];
    }[];
  }[];
}

export const CALENDAR_WIDGET_ID = 'calendar-widget-id';
export const TODO_WIDGET_ID = 'todo-widget-id';
export const CALCULATOR_WIDGET_ID = 'calculator-widget-id';
export const WEATHER_WIDGET_ID = 'weather-widget-id';