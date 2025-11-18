import React from 'react';
import type { Column, Group, GroupItemType, Separator } from '../types';
import { TrashIcon, DragHandleIcon } from './Icons';
import type { themes } from '../themes';

type DraggedItem = 
  | { type: 'groupItem'; item: GroupItemType; sourceGroupId: string; sourceColumnId: string }
  | { type: 'group'; group: Group; sourceColumnId: string }
  | { type: 'column'; column: Column }
  | null;

interface SeparatorItemProps {
  separator: Separator;
  groupId: string;
  columnId: string;
  isEditMode: boolean;
  onDelete: () => void;
  onDragStart: (item: DraggedItem) => void;
  onDrop: (target: { columnId: string; groupId?: string; itemId?: string }) => void;
  isDragging: boolean;
  themeClasses: typeof themes.default;
}

const SeparatorItem: React.FC<SeparatorItemProps> = ({ separator, groupId, columnId, isEditMode, onDelete, onDragStart, onDrop, isDragging, themeClasses }) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  React.useEffect(() => {
    if (!isDragging) {
      setIsDragOver(false);
    }
  }, [isDragging]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop({ columnId, groupId, itemId: separator.id });
    setIsDragOver(false);
  };

  if (!isEditMode) {
    return <hr className={`${themeClasses.dashedBorder} my-2`} />;
  }

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
      className={`group/separator flex items-center justify-between p-2 rounded-md transition-all duration-150 ease-in-out cursor-grab ${isDragging ? 'opacity-30' : ''} ${isDragOver ? `ring-1 ${themeClasses.ring}` : ''}`}
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