import React, { useRef } from 'react';
import type { DraggedItem, Separator } from '../types';
import { TrashIcon, DragHandleIcon } from './Icons';
import type { themes } from '../themes';

type DropTarget = { columnId: string; groupId?: string; itemId?: string; } | null;

interface SeparatorItemProps {
  separator: Separator;
  groupId: string;
  columnId: string;
  isEditMode: boolean;
  onDelete: () => void;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent, item: DraggedItem, elementRef: HTMLElement | null) => void;
  draggedItem: DraggedItem;
  dropTarget: DropTarget;
  themeClasses: typeof themes.default;
  compact: boolean;
}

const SeparatorItem: React.FC<SeparatorItemProps> = ({ 
  separator, groupId, columnId, isEditMode, onDelete, onPointerDown, draggedItem, dropTarget, themeClasses, compact 
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  
  const isDraggingThis = draggedItem?.type === 'groupItem' && draggedItem.item.id === separator.id;
  const isDropTarget = dropTarget?.itemId === separator.id;

  if (!isEditMode) {
    return <hr className={`${themeClasses.dashedBorder} ${compact ? 'my-1' : 'my-2'}`} />;
  }

  return (
    <div
      ref={itemRef}
      id={`item-${separator.id}`}
      data-droppable="item"
      data-column-id={columnId}
      data-group-id={groupId}
      data-item-id={separator.id}
      onContextMenu={(e) => { if (isEditMode) e.preventDefault(); }}
      className={`group/separator flex items-center justify-between p-2 rounded-md transition-all duration-150 ease-in-out cursor-grab ${isDraggingThis ? 'opacity-30' : ''} ${isDropTarget ? `ring-2 ${themeClasses.ring}` : ''}`}
    >
      <div 
        className="flex items-center gap-3 w-full"
        style={isEditMode ? { touchAction: 'none', userSelect: 'none' } : {}}
        onMouseDown={(e) => onPointerDown(e, {type: 'groupItem', item: separator, sourceGroupId: groupId, sourceColumnId: columnId}, itemRef.current)}
        onTouchStart={(e) => onPointerDown(e, {type: 'groupItem', item: separator, sourceGroupId: groupId, sourceColumnId: columnId}, itemRef.current)}
      >
        <DragHandleIcon className="w-5 h-5 text-slate-500 flex-shrink-0 cursor-grab" />
        <hr className={`w-full ${themeClasses.dashedBorder} border-dashed`} />
      </div>
      <div className="flex items-center gap-2 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`p-1 rounded-full transition-colors ${themeClasses.iconMuted} hover:text-red-400 ${themeClasses.buttonIconHoverBg}`}>
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SeparatorItem;