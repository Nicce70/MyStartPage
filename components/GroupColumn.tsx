import React from 'react';
import type { Column, Group, GroupItemType, Link, ModalState, ToDoItem, CalculatorState, Settings } from '../types';
import { CALENDAR_WIDGET_ID, TODO_WIDGET_ID, CALCULATOR_WIDGET_ID } from '../types';
import LinkItem from './LinkItem';
import SeparatorItem from './SeparatorItem';
import { PencilIcon, TrashIcon, PlusIcon, DragHandleIcon, ChevronDownIcon, CalendarDaysIcon, ClipboardDocumentCheckIcon, SunIcon, CogIcon, ClockIcon, TimerIcon, StopwatchIcon, RssIcon, CalculatorIcon, DocumentTextIcon, PartyPopperIcon, BanknotesIcon, BoltIcon, ScaleIcon, WifiIcon, MoonIcon, HomeIcon, RadioIcon, HeartIcon, PhotoIcon, WindowIcon } from './Icons';
import type { themes } from '../themes';
import Calendar from './Calendar';
import ToDo from './ToDo';
import Weather from './Weather';
import Clock from './Clock';
import Timer from './Timer';
import RSS from './RSS';
import Calculator from './Calculator';
import Scratchpad from './Scratchpad';
import Countdown from './Countdown';
import Currency from './Currency';
import Webhook from './Webhook';
import UnitConverter from './UnitConverter';
import Network from './Network';
import Solar from './Solar';
import Homey from './Homey';
import Radio from './Radio';
import Favorites from './Favorites';
import PictureWidget from './PictureWidget';
import IframeWidget from './IframeWidget';

type DraggedItem = 
  | { type: 'groupItem'; item: GroupItemType; sourceGroupId: string; sourceColumnId: string }
  | { type: 'group'; group: Group; sourceColumnId: string }
  | { type: 'column'; column: Column }
  | null;

interface GroupItemProps {
  group: Group;
  allColumns: Column[]; // Need access to full tree for Favorites
  columnId: string;
  isEditMode: boolean;
  onDragStart: (item: DraggedItem) => void;
  onDrop: (target: { columnId: string; groupId?: string; itemId?: string }) => void;
  draggedItem: DraggedItem;
  openModal: (type: ModalState['type'], data?: any) => void;
  onToggleGroupCollapsed: (columnId: string, groupId: string) => void;
  themeClasses: typeof themes.default;
  openLinksInNewTab: boolean;
  todos: ToDoItem[];
  setTodos: React.Dispatch<React.SetStateAction<ToDoItem[]>>;
  onCalculatorStateChange: (newState: CalculatorState) => void;
  onScratchpadChange: (groupId: string, newContent: string) => void;
  showGroupToggles: boolean;
  homeyGlobalSettings?: Settings['homey'];
}

const DEFAULT_CALCULATOR_STATE: CalculatorState = {
  currentValue: '0',
  previousValue: null,
  operator: null,
  isNewEntry: true,
};

const GroupItem: React.FC<GroupItemProps> = ({
  group, allColumns, columnId, isEditMode, onDragStart, onDrop, draggedItem, openModal, onToggleGroupCollapsed, themeClasses, openLinksInNewTab, todos, setTodos, onCalculatorStateChange, onScratchpadChange, showGroupToggles, homeyGlobalSettings
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
    if (draggedItem.type === 'groupItem' || (draggedItem.type === 'group' && draggedItem.group.id !== group.id)) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode || !draggedItem) return;
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItem.type === 'groupItem') {
        onDrop({ columnId, groupId: group.id });
    } else if (draggedItem.type === 'group') {
        onDrop({ columnId, groupId: group.id });
    }
    setIsDragOver(false);
  };

  const isDraggingThis = isEditMode && draggedItem?.type === 'group' && draggedItem.group.id === group.id;
  
  const groupType = group.type || 'links';
  const widgetType = group.widgetType;
  const isWidget = groupType === 'widget';
  const compact = !!group.widgetSettings?.compactMode && !isEditMode;

  const isCalendarWidget = widgetType === 'calendar';
  const isTodoWidget = widgetType === 'todo';
  const isCalculatorWidget = widgetType === 'calculator';
  const isWeatherWidget = widgetType === 'weather';
  const isClockWidget = widgetType === 'clock';
  const isTimerWidget = widgetType === 'timer';
  const isRssWidget = widgetType === 'rss';
  const isScratchpadWidget = widgetType === 'scratchpad';
  const isCountdownWidget = widgetType === 'countdown';
  const isCurrencyWidget = widgetType === 'currency';
  const isWebhookWidget = widgetType === 'webhook';
  const isUnitConverterWidget = widgetType === 'unit_converter';
  const isNetworkWidget = widgetType === 'network';
  const isSolarWidget = widgetType === 'solar';
  const isHomeyWidget = widgetType === 'homey';
  const isRadioWidget = widgetType === 'radio';
  const isFavoritesWidget = widgetType === 'favorites';
  const isPictureWidget = widgetType === 'picture';
  const isIframeWidget = widgetType === 'iframe';

  // Determine background color class based on colorVariant
  const bgClass = {
    'default': themeClasses.groupBg,
    'secondary': themeClasses.groupBgSecondary,
    'tertiary': themeClasses.groupBgTertiary,
    'green': 'bg-[#60B162]',
    'gray': 'bg-[#F2F2F2]',
    'black': 'bg-[#0a0a0a] text-slate-200',
    'dark_blue': 'bg-[#172554] text-blue-100'
  }[group.colorVariant || 'default'] || themeClasses.groupBg;
  
  const accentBorderColor = themeClasses.ring.replace('ring-', 'border-');

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
      className={`rounded-lg p-3 transition-all duration-200 ${bgClass} ${isDraggingThis ? 'opacity-30' : 'opacity-100'} ${isDragOver ? `ring-2 ${themeClasses.ring}` : ''} ${isFavoritesWidget ? `border ${accentBorderColor}` : ''}`}
    >
      <div 
        className={`flex justify-between items-start group/header ${!group.isCollapsed ? 'mb-4' : ''} ${!isEditMode ? 'cursor-pointer' : ''}`}
        onClick={!isEditMode ? () => onToggleGroupCollapsed(columnId, group.id) : undefined}
      >
        <div className="flex items-start gap-2 min-w-0">
          {isEditMode && <DragHandleIcon className={`w-5 h-5 text-slate-500 flex-shrink-0 cursor-grab mt-1`} />}
          {!isEditMode && showGroupToggles && (
            <ChevronDownIcon className={`w-5 h-5 ${themeClasses.iconMuted} transition-transform duration-200 ${group.isCollapsed ? '-rotate-90' : 'rotate-0'} mt-1`} />
          )}
          
          <div className="flex items-start gap-2 min-w-0">
             {isCalendarWidget && <CalendarDaysIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isTodoWidget && <ClipboardDocumentCheckIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isCalculatorWidget && <CalculatorIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isWeatherWidget && <SunIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isClockWidget && <ClockIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isTimerWidget && (
                 group.widgetSettings?.isStopwatch 
                 ? <StopwatchIcon className="w-5 h-5 flex-shrink-0 mt-1" />
                 : <TimerIcon className="w-5 h-5 flex-shrink-0 mt-1" />
             )}
             {isRssWidget && <RssIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isScratchpadWidget && <DocumentTextIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isCountdownWidget && <PartyPopperIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isCurrencyWidget && <BanknotesIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isWebhookWidget && <BoltIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isUnitConverterWidget && <ScaleIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isNetworkWidget && <WifiIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isSolarWidget && <MoonIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isHomeyWidget && <HomeIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isRadioWidget && <RadioIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isFavoritesWidget && <HeartIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isPictureWidget && <PhotoIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
             {isIframeWidget && <WindowIcon className="w-5 h-5 flex-shrink-0 mt-1" />}
            <h2 className={`text-lg font-bold ${themeClasses.header} break-all`}>
                {group.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center flex-shrink-0 ml-2">
          {isEditMode && (
            <div className="flex items-center gap-2 transition-opacity">
              {!isWidget && (
                <button onClick={() => openModal('addLinkOrSeparator', { groupId: group.id, columnId })} className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-700 transition-colors`}>
                  <PlusIcon className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => openModal('editWidgetSettings', { group, columnId })} 
                className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-700 transition-colors`}
              >
                <CogIcon className="w-5 h-5" />
              </button>
              <button onClick={() => openModal('deleteGroup', { group, columnId })} className={`p-1 ${themeClasses.iconMuted} hover:text-red-400 rounded-full hover:bg-slate-700 transition-colors`}>
                  <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      {!group.isCollapsed && (
        isCalendarWidget ? (
          <Calendar themeClasses={themeClasses} holidayCountry={group.widgetSettings?.holidayCountry || 'SE'} />
        ) : isTodoWidget ? (
          <ToDo todos={todos} setTodos={setTodos} themeClasses={themeClasses} />
        ) : isCalculatorWidget ? (
          <Calculator
            themeClasses={themeClasses}
            state={group.calculatorState || DEFAULT_CALCULATOR_STATE}
            onStateChange={onCalculatorStateChange}
          />
        ) : isWeatherWidget ? (
          <Weather
            city={group.widgetSettings?.city || ''}
            showForecast={group.widgetSettings?.weatherShowForecast}
            showTime={group.widgetSettings?.weatherShowTime}
            timezone={group.widgetSettings?.weatherTimezone}
            updateInterval={group.widgetSettings?.weatherUpdateInterval}
            themeClasses={themeClasses}
          />
        ) : isClockWidget ? (
          <Clock
            timezone={group.widgetSettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            showSeconds={group.widgetSettings?.showSeconds}
            showDate={group.widgetSettings?.showDate}
            themeClasses={themeClasses}
          />
        ) : isTimerWidget ? (
          <Timer
            id={group.id}
            initialDuration={group.widgetSettings?.timerDuration ?? 300}
            playSound={group.widgetSettings?.timerPlaySound}
            allowOvertime={group.widgetSettings?.timerOvertime}
            themeClasses={themeClasses}
            onOpenSettings={() => openModal('editWidgetSettings', { group, columnId })}
            isEditMode={isEditMode}
          />
        ) : isRssWidget ? (
          <RSS
            rssUrl={group.widgetSettings?.rssUrl || ''}
            itemCount={group.widgetSettings?.rssItemCount || 5}
            updateInterval={group.widgetSettings?.rssUpdateInterval ?? 60}
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
        ) : isCountdownWidget ? (
          <Countdown
            title={group.widgetSettings?.countdownTitle || ''}
            targetDate={group.widgetSettings?.countdownDate || ''}
            behavior={group.widgetSettings?.countdownBehavior || 'discrete'}
            playSound={group.widgetSettings?.countdownPlaySound}
            themeClasses={themeClasses}
            onOpenSettings={() => openModal('editWidgetSettings', { group, columnId })}
          />
        ) : isCurrencyWidget ? (
          <Currency
            base={group.widgetSettings?.currencyBase || 'USD'}
            targets={group.widgetSettings?.currencyTargets || []}
            themeClasses={themeClasses}
          />
        ) : isWebhookWidget ? (
          <Webhook
            items={group.widgetSettings?.webhookItems || []}
            themeClasses={themeClasses}
          />
        ) : isUnitConverterWidget ? (
          <UnitConverter themeClasses={themeClasses} />
        ) : isNetworkWidget ? (
          <Network themeClasses={themeClasses} />
        ) : isSolarWidget ? (
          <Solar 
            city={group.widgetSettings?.solarCity || ''} 
            themeClasses={themeClasses} 
            use24HourFormat={group.widgetSettings?.solarUse24HourFormat}
            compactMode={group.widgetSettings?.solarCompactMode}
          />
        ) : isHomeyWidget ? (
          <Homey
            localIp={homeyGlobalSettings?.localIp || ''}
            apiToken={homeyGlobalSettings?.apiToken || ''}
            pollingInterval={homeyGlobalSettings?.pollingInterval || 10}
            selectedCapabilities={group.widgetSettings?.homeySettings?.selectedCapabilities || []}
            selectedFlows={group.widgetSettings?.homeySettings?.selectedFlows || []}
            enableScroll={group.widgetSettings?.homeySettings?.enableScroll}
            showOneRow={group.widgetSettings?.homeySettings?.showOneRow}
            themeClasses={themeClasses}
          />
        ) : isRadioWidget ? (
          <Radio 
            customStations={group.widgetSettings?.radioStations || []}
            themeClasses={themeClasses}
          />
        ) : isFavoritesWidget ? (
          <Favorites
            group={group}
            allColumns={allColumns}
            themeClasses={themeClasses}
            openLinksInNewTab={openLinksInNewTab}
          />
        ) : isPictureWidget ? (
          <PictureWidget
            url={group.widgetSettings?.pictureUrl}
            base64={group.widgetSettings?.pictureBase64}
            sourceType={group.widgetSettings?.pictureSourceType}
            height={group.widgetSettings?.pictureHeight}
            fit={group.widgetSettings?.pictureFit}
            borderRadius={group.widgetSettings?.pictureBorderRadius}
            themeClasses={themeClasses}
          />
        ) : isIframeWidget ? (
          <IframeWidget
            url={group.widgetSettings?.iframeUrl || ''}
            viewMode={group.widgetSettings?.iframeViewMode}
            height={group.widgetSettings?.iframeHeight}
            updateInterval={group.widgetSettings?.iframeUpdateInterval}
            themeClasses={themeClasses}
          />
        ) : ( // Default to 'links' group
          <div className={compact ? "space-y-1" : "space-y-2"}>
            {group.items.map(item =>
                item.type === 'link' ? (
                    <LinkItem
                        key={item.id}
                        link={item}
                        groupId={group.id}
                        columnId={columnId}
                        isEditMode={isEditMode}
                        onEdit={() => openModal('editLink', { link: item, groupId: group.id, columnId })}
                        onDelete={() => openModal('deleteItem', { item, groupId: group.id, columnId })}
                        isDragging={draggedItem?.type === 'groupItem' && draggedItem.item.id === item.id}
                        onDragStart={onDragStart}
                        onDrop={onDrop}
                        themeClasses={themeClasses}
                        openLinksInNewTab={openLinksInNewTab}
                        compact={compact}
                    />
                ) : (
                    <SeparatorItem
                        key={item.id}
                        separator={item}
                        groupId={group.id}
                        columnId={columnId}
                        isEditMode={isEditMode}
                        onDelete={() => openModal('deleteItem', { item, groupId: group.id, columnId })}
                        isDragging={draggedItem?.type === 'groupItem' && draggedItem.item.id === item.id}
                        onDragStart={onDragStart}
                        onDrop={onDrop}
                        themeClasses={themeClasses}
                        compact={compact}
                    />
                )
            )}
            {group.items.length === 0 && (
               <div className="text-center py-4 text-slate-500 text-sm">
                 {isEditMode ? "Drop items here or click '+' to add." : "No links in this group."}
               </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default GroupItem;