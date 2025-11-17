import React, { useState, useEffect } from 'react';
import type { Column, Group, Link } from '../types';
import { PencilIcon, TrashIcon, DragHandleIcon, GlobeIcon } from './Icons';
import type { themes } from '../themes';

type DraggedItem = 
  | { type: 'link'; link: Link; sourceGroupId: string; sourceColumnId: string }
  | { type: 'group'; group: Group; sourceColumnId: string }
  | { type: 'column'; column: Column }
  | null;

interface LinkItemProps {
  link: Link;
  groupId: string;
  columnId: string;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (item: DraggedItem) => void;
  onDrop: (target: { columnId: string; groupId?: string; linkId?: string }) => void;
  isDragging: boolean;
  themeClasses: typeof themes.default;
  openLinksInNewTab: boolean;
}

const LinkItem: React.FC<LinkItemProps> = ({ link, groupId, columnId, isEditMode, onEdit, onDelete, onDragStart, onDrop, isDragging, themeClasses, openLinksInNewTab }) => {
  const [imgError, setImgError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    // When a drag operation ends, reset the visual indicator.
    if (!isDragging) {
      setIsDragOver(false);
    }
  }, [isDragging]);

  const getFaviconUrl = (url: string) => {
    try {
      const urlObject = new URL(url);
      return `https://icon.horse/icon/${urlObject.hostname}`;
    } catch (e) {
      return '';
    }
  };
  
  const faviconUrl = getFaviconUrl(link.url);

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
    onDrop({ columnId, groupId, linkId: link.id });
    setIsDragOver(false);
  };

  const handleItemClick = () => {
    if (!isEditMode) {
      if (openLinksInNewTab) {
        window.open(link.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = link.url;
      }
    }
  };

  return (
    <div
      id={`link-${link.id}`}
      title={link.comment}
      draggable={isEditMode}
      onClick={handleItemClick}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart({type: 'link', link, sourceGroupId: groupId, sourceColumnId: columnId})
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group/link flex items-center justify-between p-2 rounded-md transition-all duration-150 ease-in-out ${isEditMode ? 'cursor-grab' : 'cursor-pointer'} ${isDragging ? 'opacity-30' : `${themeClasses.linkBg} ${themeClasses.linkHoverBg}`} ${isDragOver ? `ring-1 ${themeClasses.ring}` : ''}`}
    >
      <div className="flex items-center gap-3 truncate">
        {isEditMode && <DragHandleIcon className={`w-5 h-5 text-slate-500 group-hover/link:text-slate-400 flex-shrink-0 cursor-grab`} />}
        {imgError || !faviconUrl ? (
          <GlobeIcon className={`w-6 h-6 ${themeClasses.iconMuted} flex-shrink-0`} />
        ) : (
          <img
            src={faviconUrl}
            alt={`${link.name} favicon`}
            className="w-6 h-6 object-contain flex-shrink-0"
            onError={() => setImgError(true)}
          />
        )}
        <span
          className={`truncate ${themeClasses.linkText} ${!isEditMode ? themeClasses.linkHoverText.replace('hover:', 'group-hover/link:') : 'cursor-default'}`}
        >
          {link.name}
        </span>
      </div>
      {isEditMode && (
        <div className="flex items-center gap-2 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className={`p-1 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-600 transition-colors`}>
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`p-1 ${themeClasses.iconMuted} hover:text-red-400 rounded-full hover:bg-slate-600 transition-colors`}>
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkItem;