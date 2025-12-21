
import React from 'react';
import type { Column, ModalState, ToDoItem, CalculatorState, Settings, DraggedItem, AnyItemType, Group } from '../types';
import GroupItem from './GroupColumn';
import { PencilIcon, TrashIcon, PlusIcon, DragHandleIcon } from './Icons';
import type { themes } from '../themes';

type DropTarget = { columnId: string; groupId?: string; itemId?: string; } | null;

interface ColumnProps {
  column: Column;
  allColumns: Column[];
  isEditMode: boolean;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent, item: DraggedItem, elementRef: HTMLElement | null) => void;
  draggedItem: DraggedItem;
  dropTarget: DropTarget;
  openModal: (type: ModalState['type'], data?: any) => void;
  openLinkGroupPopup: (group: Group, columnId: string) => void;
  groupGap: number;
  showColumnTitles: boolean;
  onToggleGroupCollapsed: (columnId: string, groupId: string) => void;
  themeClasses: typeof themes.default;
  openLinksInNewTab: boolean;
  widthStyle: React.CSSProperties;
  isDeletable: boolean;
  todos: ToDoItem[];
  setTodos: React.Dispatch<React.SetStateAction<ToDoItem[]>>;
  onCalculatorStateChange: (newState: CalculatorState) => void;
  onScratchpadChange: (groupId: string, newContent: string) => void;
  showGroupToggles: boolean;
  homeyGlobalSettings?: Settings['homey'];
  onRequestDeleteTodo: (todoId: string) => void;
  // Central Homey Engine Props
  homeyDevices: any;
  homeyZones: any;
  homeyFlows: any;
  homeyConnectionState: 'websocket' | 'polling' | 'disconnected';
  homeyLastUpdate: Date | null;
  homeyCountdown: number;
  homeyLog: string[];
  onHomeyToggle: (deviceId: string, capabilityId: string, currentState: boolean) => void;
  onHomeyTriggerFlow: (flowId: string) => void;
  onHomeyOptimisticUpdate: (deviceId: string, capabilityId: string, value: any) => void;
  onRemoveFavorite: (linkId: string) => void;
}

const ColumnComponent: React.FC<ColumnProps> = ({ 
  column, allColumns, isEditMode, onPointerDown, draggedItem, dropTarget, openModal, openLinkGroupPopup, groupGap, showColumnTitles, onToggleGroupCollapsed, themeClasses, openLinksInNewTab, widthStyle, isDeletable, todos, setTodos, onCalculatorStateChange, onScratchpadChange, showGroupToggles, homeyGlobalSettings, onRequestDeleteTodo,
  // Central Homey Engine Props
  homeyDevices, homeyZones, homeyFlows, homeyConnectionState, homeyLastUpdate, homeyCountdown, homeyLog, onHomeyToggle, onHomeyTriggerFlow, onHomeyOptimisticUpdate, onRemoveFavorite
}) => {
  const columnRef = React.useRef<HTMLDivElement>(null);
  
  const isDropTarget = dropTarget?.columnId === column.id && !dropTarget.groupId;
  const isDraggingThis = isEditMode && draggedItem?.type === 'column' && draggedItem.column.id === column.id;

  return (
    <div
      ref={columnRef}
      style={widthStyle}
      data-droppable="column"
      data-column-id={column.id}
      onContextMenu={(e) => { if (isEditMode) e.preventDefault(); }}
      className={`flex-shrink-0 rounded-lg transition-all duration-200 h-fit ${themeClasses.columnBg} ${isDraggingThis ? 'opacity-30' : 'opacity-100'} ${isDropTarget ? `ring-2 ${themeClasses.ring}` : ''}`}
    >
      {showColumnTitles && (
        <div 
          className="flex justify-between items-start mb-4 group/header p-2"
          style={isEditMode ? { touchAction: 'none', userSelect: 'none' } : {}}
          onMouseDown={(e) => onPointerDown(e, { type: 'column', column }, columnRef.current)}
          onTouchStart={(e) => onPointerDown(e, { type: 'column', column }, columnRef.current)}
        >
          <div className="flex items-start gap-2 min-w-0">
            {isEditMode && <DragHandleIcon className="w-5 h-5 text-slate-500 flex-shrink-0 cursor-grab mt-1" />}
            <h2 className={`text-xl font-bold ${themeClasses.header} break-all`}>{column.name}</h2>
          </div>
          {isEditMode && (
            <div className="flex items-center gap-2 transition-opacity flex-shrink-0 ml-2">
              <button onClick={() => openModal('addWidget', { columnId: column.id })} className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-700 transition-colors`}>
                <PlusIcon className="w-5 h-5" />
              </button>
              <button onClick={() => openModal('editColumn', column)} className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-700 transition-colors`}>
                <PencilIcon className="w-4 h-4" />
              </button>
              {isDeletable && (
                <button onClick={() => openModal('deleteColumn', column)} className={`p-1 ${themeClasses.iconMuted} hover:text-red-400 rounded-full hover:bg-slate-700 transition-colors`}>
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <div className={`space-y-${groupGap} p-2 ${showColumnTitles ? 'pt-0' : ''}`}>
        {column.groups.map(group => (
          <GroupItem
            key={group.id}
            group={group}
            allColumns={allColumns}
            columnId={column.id}
            isEditMode={isEditMode}
            onPointerDown={onPointerDown}
            draggedItem={draggedItem}
            dropTarget={dropTarget}
            openModal={openModal}
            openLinkGroupPopup={openLinkGroupPopup}
            onToggleGroupCollapsed={onToggleGroupCollapsed}
            themeClasses={themeClasses}
            openLinksInNewTab={openLinksInNewTab}
            todos={todos}
            setTodos={setTodos}
            onCalculatorStateChange={onCalculatorStateChange}
            onScratchpadChange={onScratchpadChange}
            showGroupToggles={showGroupToggles}
            homeyGlobalSettings={homeyGlobalSettings}
            onRequestDeleteTodo={onRequestDeleteTodo}
            // Pass central homey props down
            homeyDevices={homeyDevices}
            homeyZones={homeyZones}
            homeyFlows={homeyFlows}
            homeyConnectionState={homeyConnectionState}
            homeyLastUpdate={homeyLastUpdate}
            homeyCountdown={homeyCountdown}
            homeyLog={homeyLog}
            onHomeyToggle={onHomeyToggle}
            onHomeyTriggerFlow={onHomeyTriggerFlow}
            onHomeyOptimisticUpdate={onHomeyOptimisticUpdate}
            onRemoveFavorite={onRemoveFavorite}
          />
        ))}
         {column.groups.length === 0 && (
           <div className={`text-center py-8 text-sm border-2 border-dashed rounded-lg ${themeClasses.textSubtle} ${themeClasses.dashedBorder}`}>
             {isEditMode ? "Drop a group here or click '+' to add one." : "This column is empty."}
           </div>
        )}
      </div>
    </div>
  );
};

export default ColumnComponent;
