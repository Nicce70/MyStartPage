export interface Link {
  id: string;
  name: string;
  url: string;
  comment?: string;
}

export interface Group {
  id:string;
  name: string;
  links: Link[];
  isCollapsed?: boolean;
}

export interface Column {
  id: string;
  name: string;
  groups: Group[];
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
  showCalendar: boolean;
  showTodos: boolean;
  openLinksInNewTab: boolean;
  holidayCountry: string;
  showSearch: boolean;
  searchEngine: string;
  centerContent: boolean;
  backgroundImage: string;
  showWeather: boolean;
  weatherCity: string;
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

export type ModalType = 'addGroup' | 'editGroup' | 'addLink' | 'editLink' | 'deleteGroup' | 'deleteLink' | 'addColumn' | 'editColumn' | 'deleteColumn' | 'importConfirm' | 'resetConfirm';

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
    maxtempC: string;
    mintempC: string;
  }[];
}

export const CALENDAR_WIDGET_ID = 'calendar-widget-id';
export const TODO_WIDGET_ID = 'todo-widget-id';
export const WEATHER_WIDGET_ID = 'weather-widget-id';