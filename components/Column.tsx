import React from 'react';
import type { Column, Group, Link, ModalState, ToDoItem, CalculatorState, GroupItemType, Settings } from '../types';
import GroupItem from './GroupColumn';
import { PencilIcon, TrashIcon, PlusIcon, DragHandleIcon } from './Icons';
import type { themes } from '../themes';

// FIX: Aligned DraggedItem type with the rest of the application to resolve type mismatch errors.
// It now uses a generic 'groupItem' type to handle both links and separators.
type DraggedItem =
  | { type: 'groupItem'; item: GroupItemType; sourceGroupId: string; sourceColumnId: string }
  | { type: 'group'; group: Group; sourceColumnId: string }
  | { type: 'column'; column: Column }
  | null;

interface ColumnProps {
  column: Column;
  allColumns: Column[]; // Added to pass down global state
  isEditMode: boolean;
  onDragStart: (item: DraggedItem) => void;
  onDrop: (target: { columnId: string; groupId?: string; linkId?: string }) => void;
  draggedItem: DraggedItem;
  openModal: (type: ModalState['type'], data?: any) => void;
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
}

const ColumnComponent: React.FC<ColumnProps> = ({ 
  column, allColumns, isEditMode, onDragStart, onDrop, draggedItem, openModal, groupGap, showColumnTitles, onToggleGroupCollapsed, themeClasses, openLinksInNewTab, widthStyle, isDeletable, todos, setTodos, onCalculatorStateChange, onScratchpadChange, showGroupToggles, homeyGlobalSettings
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  React.useEffect(() => {
    if (!draggedItem) {
      setIsDragOver(false);
    }
  }, [draggedItem]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode || !draggedItem) return;
    if (draggedItem.type === 'group' || (draggedItem.type === 'column' && draggedItem.column.id !== column.id)) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode || !draggedItem) return;
    e.preventDefault();
    e.stopPropagation();
    if (draggedItem.type === 'group') {
      onDrop({ columnId: column.id });
    } else if (draggedItem.type === 'column') {
      onDrop({ columnId: column.id });
    }
    setIsDragOver(false);
  };
  
  const isDraggingThis = isEditMode && draggedItem?.type === 'column' && draggedItem.column.id === column.id;

  return (
    <div
      style={widthStyle}
      draggable={isEditMode}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart({ type: 'column', column });
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-shrink-0 rounded-lg transition-all duration-200 h-fit ${themeClasses.columnBg} ${isDraggingThis ? 'opacity-30' : 'opacity-100'} ${isDragOver ? `ring-2 ${themeClasses.ring}` : ''}`}
    >
      {showColumnTitles && (
        <div className="flex justify-between items-start mb-4 group/header p-2">
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
            allColumns={allColumns} // Pass down global columns
            columnId={column.id}
            isEditMode={isEditMode}
            onDragStart={onDragStart}
            onDrop={onDrop}
            draggedItem={draggedItem}
            openModal={openModal}
            onToggleGroupCollapsed={onToggleGroupCollapsed}
            themeClasses={themeClasses}
            openLinksInNewTab={openLinksInNewTab}
            todos={todos}
            setTodos={setTodos}
            onCalculatorStateChange={onCalculatorStateChange}
            onScratchpadChange={onScratchpadChange}
            showGroupToggles={showGroupToggles}
            homeyGlobalSettings={homeyGlobalSettings}
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