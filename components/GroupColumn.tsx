import React from 'react';
import type { Column, Group, Link, ModalState, ToDoItem, CalculatorState } from '../types';
import { CALENDAR_WIDGET_ID, TODO_WIDGET_ID, CALCULATOR_WIDGET_ID } from '../types';
import LinkItem from './LinkItem';
import { PencilIcon, TrashIcon, PlusIcon, DragHandleIcon, ChevronDownIcon, CalendarDaysIcon, ClipboardDocumentCheckIcon, SunIcon, CogIcon, ClockIcon, TimerIcon, RssIcon, CalculatorIcon, DocumentTextIcon } from './Icons';
import type { themes } from '../themes';
import Calendar from './Calendar';
import ToDo from './ToDo';
import Weather from './Weather';
import Clock from './Clock';
import Timer from './Timer';
import RSS from './RSS';
import Calculator from './Calculator';
import Scratchpad from './Scratchpad';

type DraggedItem = 
  | { type: 'link'; link: Link; sourceGroupId: string; sourceColumnId: string }
  | { type: 'group'; group: Group; sourceColumnId: string }
  | { type: 'column'; column: Column }
  | null;

interface GroupItemProps {
  group: Group;
  columnId: string;
  isEditMode: boolean;
  onDragStart: (item: DraggedItem) => void;
  onDrop: (target: { columnId: string; groupId?: string; linkId?: string }) => void;
  draggedItem: DraggedItem;
  openModal: (type: ModalState['type'], data?: any) => void;
  onToggleGroupCollapsed: (columnId: string, groupId: string) => void;
  themeClasses: typeof themes.default;
  openLinksInNewTab: boolean;
  holidayCountry: string;
  todos: ToDoItem[];
  setTodos: React.Dispatch<React.SetStateAction<ToDoItem[]>>;
  onCalculatorStateChange: (newState: CalculatorState) => void;
  onScratchpadChange: (groupId: string, newContent: string) => void;
}

const DEFAULT_CALCULATOR_STATE: CalculatorState = {
  currentValue: '0',
  previousValue: null,
  operator: null,
  isNewEntry: true,
};

const GroupItem: React.FC<GroupItemProps> = ({
  group, columnId, isEditMode, onDragStart, onDrop, draggedItem, openModal, onToggleGroupCollapsed, themeClasses, openLinksInNewTab, holidayCountry, todos, setTodos, onCalculatorStateChange, onScratchpadChange
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  React.useEffect(() => {
    // When a drag operation ends (draggedItem becomes null), reset the visual indicator.
    if (!draggedItem) {
      setIsDragOver(false);
    }
  }, [draggedItem]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode || !draggedItem) return;
    if (draggedItem.type === 'link' || (draggedItem.type === 'group' && draggedItem.group.id !== group.id)) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode || !draggedItem) return;
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItem.type === 'link') {
        onDrop({ columnId, groupId: group.id });
    } else if (draggedItem.type === 'group') {
        onDrop({ columnId, groupId: group.id });
    }
    setIsDragOver(false);
  };

  const isDraggingThis = isEditMode && draggedItem?.type === 'group' && draggedItem.group.id === group.id;
  
  const groupType = group.type || 'links';
  const widgetType = group.widgetType;

  const isCalendarWidget = widgetType === 'calendar' || group.id === CALENDAR_WIDGET_ID;
  const isTodoWidget = widgetType === 'todo' || group.id === TODO_WIDGET_ID;
  const isCalculatorWidget = widgetType === 'calculator' || group.id === CALCULATOR_WIDGET_ID;
  const isWeatherWidget = widgetType === 'weather';
  const isClockWidget = widgetType === 'clock';
  const isTimerWidget = widgetType === 'timer';
  const isRssWidget = widgetType === 'rss';
  const isScratchpadWidget = widgetType === 'scratchpad';
  const isWidget = groupType === 'widget';
  const isConfigurableWidget = isWeatherWidget || isClockWidget || isTimerWidget || isRssWidget;

  return (
    <div
      draggable={isEditMode}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart({ type: 'group', group, sourceColumnId: columnId });
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-lg p-3 transition-all duration-200 ${themeClasses.groupBg} ${isDraggingThis ? 'opacity-30' : 'opacity-100'} ${isDragOver ? `ring-2 ${themeClasses.ring}` : ''}`}
    >
      <div 
        className={`flex justify-between items-center group/header ${!group.isCollapsed ? 'mb-4' : ''} ${!isEditMode ? 'cursor-pointer' : ''}`}
        onClick={!isEditMode ? () => onToggleGroupCollapsed(columnId, group.id) : undefined}
      >
        <div className="flex items-center gap-2 truncate">
          {isEditMode && <DragHandleIcon className={`w-5 h-5 text-slate-500 flex-shrink-0 cursor-grab`} />}
          {!isEditMode && (
            <ChevronDownIcon className={`w-5 h-5 ${themeClasses.iconMuted} transition-transform duration-200 ${group.isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
          )}
          <h2 className={`text-lg font-bold ${themeClasses.header} truncate flex items-center gap-2`}>
            {isCalendarWidget && <CalendarDaysIcon className="w-5 h-5" />}
            {isTodoWidget && <ClipboardDocumentCheckIcon className="w-5 h-5" />}
            {isCalculatorWidget && <CalculatorIcon className="w-5 h-5" />}
            {isWeatherWidget && <SunIcon className="w-5 h-5" />}
            {isClockWidget && <ClockIcon className="w-5 h-5" />}
            {isTimerWidget && <TimerIcon className="w-5 h-5" />}
            {isRssWidget && <RssIcon className="w-5 h-5" />}
            {isScratchpadWidget && <DocumentTextIcon className="w-5 h-5" />}
            {group.name}
          </h2>
        </div>

        <div className="flex items-center">
          {isEditMode && (
            <div className="flex items-center gap-2 transition-opacity">
              {isConfigurableWidget && (
                <button onClick={() => openModal('editWidgetSettings', { group, columnId })} className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-700 transition-colors`}>
                  <CogIcon className="w-5 h-5" />
                </button>
              )}
              {!isWidget && (
                <button onClick={() => openModal('addLink', { groupId: group.id, columnId })} className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-700 transition-colors`}>
                  <PlusIcon className="w-5 h-5" />
                </button>
              )}
              <button onClick={() => openModal('editGroup', { group, columnId })} className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-700 transition-colors`}>
                <PencilIcon className="w-4 h-4" />
              </button>
              {!isCalendarWidget && (
                  <button onClick={() => openModal('deleteGroup', { group, columnId })} className={`p-1 ${themeClasses.iconMuted} hover:text-red-400 rounded-full hover:bg-slate-700 transition-colors`}>
                      <TrashIcon className="w-4 h-4" />
                  </button>
              )}
            </div>
          )}
        </div>
      </div>
      {!group.isCollapsed && (
        isCalendarWidget ? (
          <Calendar themeClasses={themeClasses} holidayCountry={holidayCountry} />
        ) : isTodoWidget ? (
          <ToDo todos={todos} setTodos={setTodos} themeClasses={themeClasses} />
        ) : isCalculatorWidget ? (
          <Calculator
            themeClasses={themeClasses}
            state={group.calculatorState || DEFAULT_CALCULATOR_STATE}
            onStateChange={onCalculatorStateChange}
          />
        ) : isWeatherWidget ? (
          <Weather city={group.widgetSettings?.city || ''} themeClasses={themeClasses} />
        ) : isClockWidget ? (
          <Clock
            timezone={group.widgetSettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            showSeconds={group.widgetSettings?.showSeconds}
            themeClasses={themeClasses}
          />
        ) : isTimerWidget ? (
          <Timer
            initialDuration={group.widgetSettings?.timerDuration ?? 300}
            playSound={group.widgetSettings?.timerPlaySound}
            themeClasses={themeClasses}
            onOpenSettings={() => openModal('editWidgetSettings', { group, columnId })}
          />
        ) : isRssWidget ? (
          <RSS
            rssUrl={group.widgetSettings?.rssUrl || ''}
            itemCount={group.widgetSettings?.rssItemCount || 5}
            themeClasses={themeClasses}
            openLinksInNewTab={openLinksInNewTab}
          />
        ) : isScratchpadWidget ? (
          <Scratchpad
            content={group.widgetSettings?.scratchpadContent || ''}
            onChange={(newContent) => onScratchpadChange(group.id, newContent)}
            themeClasses={themeClasses}
            isEditMode={isEditMode}
          />
        ) : ( // Default to 'links' group
          <div className="space-y-2">
            {group.links.map(link => (
              <LinkItem
                key={link.id}
                link={link}
                groupId={group.id}
                columnId={columnId}
                isEditMode={isEditMode}
                onEdit={() => openModal('editLink', { link, groupId: group.id, columnId })}
                onDelete={() => openModal('deleteLink', { link, groupId: group.id, columnId })}
                isDragging={draggedItem?.type === 'link' && draggedItem.link.id === link.id}
                onDragStart={onDragStart}
                onDrop={onDrop}
                themeClasses={themeClasses}
                openLinksInNewTab={openLinksInNewTab}
              />
            ))}
            {group.links.length === 0 && (
               <div className="text-center py-4 text-slate-500 text-sm">
                 {isEditMode ? "Drop links here or click '+' to add." : "No links in this group."}
               </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default GroupItem;