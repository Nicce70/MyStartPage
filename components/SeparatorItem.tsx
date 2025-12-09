

import React from 'react';
import type { DraggedItem, Separator } from '../types';
import { TrashIcon, DragHandleIcon } from './Icons';
import type { themes } from '../themes';

interface SeparatorItemProps {
  separator: Separator;
  groupId: string;
  columnId: string;
  isEditMode: boolean;
  onDelete: () => void;
  onDragStart: (item: DraggedItem) => void;
  onDrop: (target: { columnId: string; groupId?: string; itemId?: string }) => void;
  isDragging: boolean;
  touchDragItem: DraggedItem;
  handleTouchStart: (e: React.TouchEvent, item: DraggedItem) => void;
  touchDragOverTarget: { columnId: string; groupId?: string; itemId?: string } | null;
  themeClasses: typeof themes.default;
  compact: boolean;
}

const SeparatorItem: React.FC<SeparatorItemProps> = ({ separator, groupId, columnId, isEditMode, onDelete, onDragStart, onDrop, isDragging, touchDragItem, handleTouchStart, touchDragOverTarget, themeClasses, compact }) => {
  const [isMouseDragOver, setIsMouseDragOver] = React.useState(false);

  React.useEffect(() => {
    if (!isDragging && !touchDragItem) {
      setIsMouseDragOver(false);
    }
  }, [isDragging, touchDragItem]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMouseDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsMouseDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop({ columnId, groupId, itemId: separator.id });
    setIsMouseDragOver(false);
  };

  if (!isEditMode) {
    return <hr className={`${themeClasses.dashedBorder} ${compact ? 'my-1' : 'my-2'}`} />;
  }
  
  const isDraggingThis = isDragging || (touchDragItem?.type === 'groupItem' && touchDragItem.item.id === separator.id);
  
  const isTouchDragOver = touchDragItem?.type === 'groupItem' &&
    touchDragOverTarget?.itemId === separator.id &&
    touchDragItem.item.id !== separator.id;

  const isDragOver = isMouseDragOver || isTouchDragOver;

  return (
    <div
      id={`separator-${separator.id}`}
      draggable={isEditMode}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart({type: 'groupItem', item: separator, sourceGroupId: groupId, sourceColumnId: columnId})
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onTouchStart={(e) => handleTouchStart(e, {type: 'groupItem', item: separator, sourceGroupId: groupId, sourceColumnId: columnId})}
      data-drop-target="item"
      data-column-id={columnId}
      data-group-id={groupId}
      data-item-id={separator.id}
      className={`group/separator flex items-center justify-between p-2 rounded-md transition-all duration-150 ease-in-out cursor-grab ${isDraggingThis ? 'opacity-30' : ''} ${isDragOver ? `ring-1 ${themeClasses.ring}` : ''}`}
    >
      <div className="flex items-center gap-3 w-full">
        <DragHandleIcon className="w-5 h-5 text-slate-500 flex-shrink-0 cursor-grab" />
        <hr className={`w-full ${themeClasses.dashedBorder} border-dashed`} />
      </div>
      <div className="flex items-center gap-2 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`p-1 ${themeClasses.iconMuted} hover:text-red-400 rounded-full hover:bg-slate-600 transition-colors`}>
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SeparatorItem;