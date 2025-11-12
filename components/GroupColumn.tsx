import React from 'react';
// FIX: Import the 'Column' type.
import type { Column, Group, Link, ModalState } from '../types';
import LinkItem from './LinkItem';
import { PencilIcon, TrashIcon, PlusIcon, GripVerticalIcon, ChevronDownIcon } from './Icons';
import type { themes } from '../themes';

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
}

const GroupItem: React.FC<GroupItemProps> = ({
  group, columnId, isEditMode, onDragStart, onDrop, draggedItem, openModal, onToggleGroupCollapsed, themeClasses
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
          {isEditMode && <GripVerticalIcon className="w-5 h-5 text-slate-500 flex-shrink-0 cursor-grab" />}
          {!isEditMode && (
            <ChevronDownIcon className={`w-5 h-5 ${themeClasses.iconMuted} transition-transform duration-200 ${group.isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
          )}
          <h2 className="text-lg font-bold text-slate-200 truncate">{group.name}</h2>
        </div>
        {isEditMode && (
          <div className="flex items-center gap-2 opacity-0 group-hover/header:opacity-100 transition-opacity">
            <button onClick={() => openModal('addLink', { groupId: group.id, columnId })} className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-700 transition-colors`}>
              <PlusIcon className="w-5 h-5" />
            </button>
            <button onClick={() => openModal('editGroup', { group, columnId })} className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-700 transition-colors`}>
              <PencilIcon className="w-4 h-4" />
            </button>
            <button onClick={() => openModal('deleteGroup', { group, columnId })} className={`p-1 ${themeClasses.iconMuted} hover:text-red-400 rounded-full hover:bg-slate-700 transition-colors`}>
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {!group.isCollapsed && (
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
            />
          ))}
          {group.links.length === 0 && (
             <div className="text-center py-4 text-slate-500 text-sm">
               {isEditMode ? "Drop links here or click '+' to add." : "No links in this group."}
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupItem;