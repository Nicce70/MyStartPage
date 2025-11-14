import React from 'react';
import type { Column, Group, Link, ModalState, ToDoItem } from '../types';
import GroupItem from './GroupColumn';
import { PencilIcon, TrashIcon, PlusIcon, GripVerticalIcon } from './Icons';
import type { themes } from '../themes';

type DraggedItem = 
  | { type: 'link'; link: Link; sourceGroupId: string; sourceColumnId: string }
  | { type: 'group'; group: Group; sourceColumnId: string }
  | { type: 'column'; column: Column }
  | null;

interface ColumnProps {
  column: Column;
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
  widthClass: string;
  isDeletable: boolean;
  holidayCountry: string;
  todos: ToDoItem[];
  setTodos: React.Dispatch<React.SetStateAction<ToDoItem[]>>;
  weatherCity: string;
}

const ColumnComponent: React.FC<ColumnProps> = ({ 
  column, isEditMode, onDragStart, onDrop, draggedItem, openModal, groupGap, showColumnTitles, onToggleGroupCollapsed, themeClasses, openLinksInNewTab, widthClass, isDeletable, holidayCountry, todos, setTodos, weatherCity
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
      draggable={isEditMode}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart({ type: 'column', column });
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-shrink-0 ${widthClass} rounded-lg transition-all duration-200 h-fit ${themeClasses.columnBg} ${isDraggingThis ? 'opacity-30' : 'opacity-100'} ${isDragOver ? `ring-2 ${themeClasses.ring}` : ''}`}
    >
      {showColumnTitles && (
        <div className="flex justify-between items-center mb-4 group/header p-2">
          <div className="flex items-center gap-2 truncate">
            {isEditMode && <GripVerticalIcon className="w-5 h-5 text-slate-500 flex-shrink-0 cursor-grab" />}
            <h2 className={`text-xl font-bold ${themeClasses.header} truncate`}>{column.name}</h2>
          </div>
          {isEditMode && (
            <div className="flex items-center gap-2 opacity-0 group-hover/header:opacity-100 transition-opacity">
              <button onClick={() => openModal('addGroup', { columnId: column.id })} className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-700 transition-colors`}>
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
            columnId={column.id}
            isEditMode={isEditMode}
            onDragStart={onDragStart}
            onDrop={onDrop}
            draggedItem={draggedItem}
            openModal={openModal}
            onToggleGroupCollapsed={onToggleGroupCollapsed}
            themeClasses={themeClasses}
            openLinksInNewTab={openLinksInNewTab}
            holidayCountry={holidayCountry}
            todos={todos}
            setTodos={setTodos}
            weatherCity={weatherCity}
          />
        ))}
         {column.groups.length === 0 && (
           <div className={`text-center py-8 text-sm border-2 border-dashed rounded-lg ${themeClasses.textSubtle} ${themeClasses.dashedBorder}`}>
             {isEditMode ? "Drop a group here or click '+' to add one." : "No groups in this column."}
           </div>
        )}
      </div>
    </div>
  );
};

export default ColumnComponent;