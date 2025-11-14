import React, { useState, useEffect, useRef } from 'react';
import ColumnComponent from './components/Column';
import SettingsModal from './components/SettingsModal';
import Modal from './components/Modal';
import { PlusIcon, PencilIcon, CogIcon, MagnifyingGlassIcon } from './components/Icons';
import useLocalStorage from './hooks/useLocalStorage';
import { themes } from './themes';
import ThemeStyles from './components/ThemeStyles';
import type { Column, Group, Link, Settings, ModalState, BackupData, Theme, ToDoItem } from './types';
import { CALENDAR_WIDGET_ID, TODO_WIDGET_ID, WEATHER_WIDGET_ID } from './types';

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
    groups: [
      {
        id: uuidv4(),
        name: "Work",
        links: [
          { id: uuidv4(), name: "Gmail", url: "https://mail.google.com", comment: "Work Email" },
          { id: uuidv4(), name: "Google Calendar", url: "https://calendar.google.com" },
        ]
      },
    ]
  },
  {
    id: uuidv4(),
    name: "Social",
    groups: [
      {
        id: uuidv4(),
        name: "General",
        links: [
          { id: uuidv4(), name: "Reddit", url: "https://www.reddit.com" },
          { id: uuidv4(), name: "Twitter", url: "https://www.twitter.com" },
        ]
      },
    ]
  }
];

const DEFAULT_SETTINGS: Settings = {
  columnGap: 4,
  groupGap: 4,
  columnWidth: 4,
  showColumnTitles: true,
  theme: 'default',
  scale: 6,
  showCalendar: false,
  showTodos: false,
  openLinksInNewTab: true,
  holidayCountry: 'SE',
  showSearch: false,
  searchEngine: 'google',
  centerContent: false,
  backgroundImage: '',
  showWeather: false,
  weatherCity: 'Stockholm, SE',
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

const columnWidthMap: { [key: number]: string } = {
  1: 'w-60', // 240px
  2: 'w-64', // 256px
  3: 'w-72', // 288px
  4: 'w-80', // 320px (default)
  5: 'w-[22rem]', // 352px
  6: 'w-96', // 384px
  7: 'w-[26rem]', // 416px
  8: 'w-[28rem]', // 448px
  9: 'w-[30rem]', // 480px
};

const searchEngines: { [key: string]: { name: string; url: string } } = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  brave: { name: 'Brave Search', url: 'https://search.brave.com/search?q=' },
};

type DraggedItem = 
  | { type: 'link'; link: Link; sourceGroupId: string; sourceColumnId: string }
  | { type: 'group'; group: Group; sourceColumnId: string }
  | { type: 'column'; column: Column }
  | null;


function App() {
  const [columns, setColumns] = useLocalStorage<Column[]>('startpage-columns', DEFAULT_COLUMNS);
  const [settings, setSettings] = useLocalStorage<Settings>('startpage-settings', DEFAULT_SETTINGS);
  const [pageTitle, setPageTitle] = useLocalStorage<string>('startpage-title', 'My Startpage');
  const [todos, setTodos] = useLocalStorage<ToDoItem[]>('startpage-todos', []);

  const [isEditMode, setIsEditMode] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [themeClasses, setThemeClasses] = useState<Theme>(themes.default);
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const formRef = useRef<HTMLFormElement>(null);

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
        const input = formRef.current?.querySelector('input');
        input?.focus();
        input?.select();
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

  const handleSettingsChange = (newSettings: Settings) => {
    const oldShowCalendar = settings.showCalendar;
    const newShowCalendar = newSettings.showCalendar;
    const oldShowTodos = settings.showTodos;
    const newShowTodos = newSettings.showTodos;
    const oldShowWeather = settings.showWeather;
    const newShowWeather = newSettings.showWeather;
  
    let updatedColumns = JSON.parse(JSON.stringify(columns));
  
    // Handle Calendar Widget
    if (newShowCalendar !== oldShowCalendar) {
      if (newShowCalendar) {
        const calendarExists = updatedColumns.some((col: Column) => col.groups.some(g => g.id === CALENDAR_WIDGET_ID));
        if (!calendarExists) {
          if (updatedColumns.length === 0) {
            updatedColumns.push({ id: uuidv4(), name: "Column 1", groups: [] });
          }
          const calendarWidget: Group = { id: CALENDAR_WIDGET_ID, name: 'Calendar', links: [], isCollapsed: false };
          updatedColumns[0].groups.unshift(calendarWidget);
        }
      } else {
        updatedColumns = updatedColumns.map((col: Column) => ({
          ...col,
          groups: col.groups.filter(g => g.id !== CALENDAR_WIDGET_ID),
        }));
      }
    }
  
    // Handle To-Do Widget
    if (newShowTodos !== oldShowTodos) {
      if (newShowTodos) {
        const todoExists = updatedColumns.some((col: Column) => col.groups.some(g => g.id === TODO_WIDGET_ID));
        if (!todoExists) {
          if (updatedColumns.length === 0) {
            updatedColumns.push({ id: uuidv4(), name: "Column 1", groups: [] });
          }
          const todoWidget: Group = { id: TODO_WIDGET_ID, name: 'To-Do List', links: [], isCollapsed: false };
          updatedColumns[0].groups.unshift(todoWidget);
        }
      } else {
        updatedColumns = updatedColumns.map((col: Column) => ({
          ...col,
          groups: col.groups.filter(g => g.id !== TODO_WIDGET_ID),
        }));
      }
    }

    // Handle Weather Widget
    if (newShowWeather !== oldShowWeather) {
      if (newShowWeather) {
        const weatherExists = updatedColumns.some((col: Column) => col.groups.some(g => g.id === WEATHER_WIDGET_ID));
        if (!weatherExists) {
          if (updatedColumns.length === 0) {
            updatedColumns.push({ id: uuidv4(), name: "Column 1", groups: [] });
          }
          const weatherWidget: Group = { id: WEATHER_WIDGET_ID, name: 'Weather', links: [], isCollapsed: false };
          updatedColumns[0].groups.unshift(weatherWidget);
        }
      } else {
        updatedColumns = updatedColumns.map((col: Column) => ({
          ...col,
          groups: col.groups.filter(g => g.id !== WEATHER_WIDGET_ID),
        }));
      }
    }
  
    setColumns(updatedColumns);
    setSettings(newSettings);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    const comment = formData.get('comment') as string;

    const newColumns = JSON.parse(JSON.stringify(columns));

    switch (modal.type) {
      case 'addColumn':
        setColumns([...columns, { id: uuidv4(), name, groups: [] }]);
        break;
      case 'editColumn':
        setColumns(columns.map(c => c.id === modal.data.id ? { ...c, name } : c));
        break;
      case 'addGroup': {
        const col = newColumns.find((c: Column) => c.id === modal.data.columnId);
        if (col) col.groups.push({ id: uuidv4(), name, links: [] });
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
      case 'addLink': {
        const col = newColumns.find((c: Column) => c.id === modal.data.columnId);
        const group = col?.groups.find((g: Group) => g.id === modal.data.groupId);
        if (group) group.links.push({ id: uuidv4(), name, url: url.startsWith('https://') || url.startsWith('http://') ? url : `https://${url}`, comment });
        setColumns(newColumns);
        break;
      }
      case 'editLink': {
        const col = newColumns.find((c: Column) => c.id === modal.data.columnId);
        const group = col?.groups.find((g: Group) => g.id === modal.data.groupId);
        const link = group?.links.find((l: Link) => l.id === modal.data.link.id);
        if (link) {
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

  const handleDelete = () => {
    if (!modal?.type.startsWith('delete')) return;

    let newColumns = [...columns];

    switch (modal.type) {
      case 'deleteColumn': {
        const columnToDelete = columns.find(c => c.id === modal.data.id);
        if (columnToDelete) {
            if (columnToDelete.groups.some(g => g.id === CALENDAR_WIDGET_ID)) {
                setSettings(s => ({ ...s, showCalendar: false }));
            }
            if (columnToDelete.groups.some(g => g.id === TODO_WIDGET_ID)) {
                setSettings(s => ({ ...s, showTodos: false }));
            }
            if (columnToDelete.groups.some(g => g.id === WEATHER_WIDGET_ID)) {
                setSettings(s => ({ ...s, showWeather: false }));
            }
        }
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
      case 'deleteLink':
        newColumns = columns.map(c => {
          if (c.id === modal.data.columnId) {
            return {
              ...c,
              groups: c.groups.map(g => {
                if (g.id === modal.data.groupId) {
                  return { ...g, links: g.links.filter(l => l.id !== modal.data.link.id) };
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
  
  const handleDrop = (target: { columnId: string; groupId?: string; linkId?: string }) => {
    if (!draggedItem) return;

    let newColumns = JSON.parse(JSON.stringify(columns));

    // Remove the dragged item from its original position
    if (draggedItem.type === 'link') {
      const sourceCol = newColumns.find((c: Column) => c.id === draggedItem.sourceColumnId);
      const sourceGroup = sourceCol?.groups.find((g: Group) => g.id === draggedItem.sourceGroupId);
      if (sourceGroup) {
        sourceGroup.links = sourceGroup.links.filter((l: Link) => l.id !== draggedItem.link.id);
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
    if (draggedItem.type === 'link') {
      const targetCol = newColumns.find((c: Column) => c.id === target.columnId);
      const targetGroup = targetCol?.groups.find((g: Group) => g.id === target.groupId);
      if (targetGroup) {
        const targetLinkIndex = target.linkId ? targetGroup.links.findIndex((l: Link) => l.id === target.linkId) : targetGroup.links.length;
        targetGroup.links.splice(targetLinkIndex, 0, draggedItem.link);
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
    
    setColumns(importData.columns);
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
    if (!searchQuery.trim()) return;

    const engine = searchEngines[settings.searchEngine] || searchEngines.google;
    const searchUrl = `${engine.url}${encodeURIComponent(searchQuery)}`;
    
    if (settings.openLinksInNewTab) {
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = searchUrl;
    }
  };

  const getModalContent = () => {
    if (!modal) return null;
    
    const { type, data } = modal;
    
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
      if (type === 'deleteLink') itemName = data.link.name;
      
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
    
    const isLink = type === 'addLink' || type === 'editLink';
    const currentName = type.startsWith('edit') ? (data.group?.name || data.link?.name || data.name) : '';
    const currentUrl = type === 'editLink' ? data.link.url : (type === 'addLink' ? 'https://' : '');
    const currentComment = type === 'editLink' ? data.link.comment : '';

    return (
      <form onSubmit={handleFormSubmit} ref={formRef}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Name</label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={currentName}
              required
              className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
            />
          </div>
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
                <label htmlFor="comment" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Comment (optional)</label>
                <input
                  type="text"
                  id="comment"
                  name="comment"
                  defaultValue={currentComment}
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
      case 'addGroup': return 'Add Group';
      case 'editGroup': return 'Edit Group';
      case 'addLink': return 'Add Link';
      case 'editLink': return 'Edit Link';
      case 'deleteColumn': return 'Delete Column';
      case 'deleteGroup': return 'Delete Group';
      case 'deleteLink': return 'Delete Link';
      case 'importConfirm': return 'Confirm Import';
      case 'resetConfirm': return 'Confirm Reset';
      default: return '';
    }
  };

  const columnWidthClass = columnWidthMap[settings.columnWidth] || 'w-80';

  return (
    <>
      <ThemeStyles theme={themeClasses} />
      <main className={`h-screen flex flex-col py-4 px-2 sm:py-6 sm:px-4 lg:py-8 lg:px-6 transition-colors duration-300 font-sans`}>
        <header className="flex-shrink-0 grid grid-cols-[1fr_2fr_1fr] items-end gap-4 mb-6">
          <div className="justify-self-start">
              <h1 className={`text-3xl font-bold ${themeClasses.header} pl-2 truncate`}>{pageTitle}</h1>
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
                          className={`block w-full rounded-md border-0 py-2 pl-10 pr-3 ${themeClasses.inputBg} ${themeClasses.inputFocusRing} placeholder:text-slate-400 sm:text-sm sm:leading-6`}
                      />
                  </form>
              )}
          </div>

          <div className="justify-self-end flex items-center gap-3">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
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
                widthClass={columnWidthClass}
                isDeletable={columns.length > 1}
                holidayCountry={settings.holidayCountry}
                todos={todos}
                setTodos={setTodos}
                weatherCity={settings.weatherCity}
              />
            ))}

            {isEditMode && (
              <div className={`flex-shrink-0 ${columnWidthClass}`}>
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