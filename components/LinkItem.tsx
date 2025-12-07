

import React, { useState, useEffect } from 'react';
import type { DraggedItem, Link } from '../types';
import { PencilIcon, TrashIcon, DragHandleIcon, GlobeIcon } from './Icons';
import type { themes } from '../themes';

interface LinkItemProps {
  link: Link;
  groupId: string;
  columnId: string;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (item: DraggedItem) => void;
  onDrop: (target: { columnId: string; groupId?: string; itemId?: string }) => void;
  isDragging: boolean;
  themeClasses: typeof themes.default;
  openLinksInNewTab: boolean;
  compact: boolean;
}

const LinkItem: React.FC<LinkItemProps> = ({ link, groupId, columnId, isEditMode, onEdit, onDelete, onDragStart, onDrop, isDragging, themeClasses, openLinksInNewTab, compact }) => {
  const [errorCount, setErrorCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    // When link.url changes, reset the error counter to re-attempt loading.
    setErrorCount(0);
  }, [link.url]);

  useEffect(() => {
    // When a drag operation ends, reset the visual indicator.
    if (!isDragging) {
      setIsDragOver(false);
    }
  }, [isDragging]);

  const handleFaviconError = () => {
    setErrorCount(prev => prev + 1);
  };
  
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
    onDrop({ columnId, groupId, itemId: link.id });
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

  const renderFavicon = () => {
    let hostname;
    try {
      hostname = new URL(link.url).hostname;
    } catch (e) {
      return <GlobeIcon className={`w-6 h-6 ${themeClasses.iconMuted} flex-shrink-0`} />;
    }

    if (errorCount >= 2) {
      return <GlobeIcon className={`w-6 h-6 ${themeClasses.iconMuted} flex-shrink-0`} />;
    }

    const src = errorCount === 0
      ? `https://icon.horse/icon/${hostname}`
      : `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
    
    return (
      <img
        src={src}
        alt="" // alt is empty for decorative images
        className="w-6 h-6 object-contain flex-shrink-0"
        onError={handleFaviconError}
      />
    );
  };

  return (
    <div
      id={`link-${link.id}`}
      title={link.comment}
      draggable={isEditMode}
      onClick={handleItemClick}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart({type: 'groupItem', item: link, sourceGroupId: groupId, sourceColumnId: columnId})
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group/link flex items-start justify-between rounded-md transition-all duration-150 ease-in-out ${isEditMode ? 'cursor-grab' : 'cursor-pointer'} ${isDragging ? 'opacity-30' : ''} ${isDragOver ? `ring-1 ${themeClasses.ring}` : ''} ${compact ? 'py-1' : `p-2 ${themeClasses.linkBg} ${themeClasses.linkHoverBg}`}`}
    >
      <div className={`flex items-start min-w-0 ${compact ? 'gap-2' : 'gap-3'}`}>
        {isEditMode && <DragHandleIcon className={`w-5 h-5 mt-1 text-slate-500 group-hover/link:text-slate-400 flex-shrink-0 cursor-grab`} />}
        {!compact && renderFavicon()}
        <span
          className={`break-all ${compact ? `hover:underline ${themeClasses.linkText}` : `${themeClasses.linkText} ${!isEditMode ? themeClasses.linkHoverText.replace('hover:', 'group-hover/link:') : 'cursor-default'}`}`}
        >
          {link.name}
        </span>
      </div>
      {isEditMode && (
        <div className="flex items-center gap-2 transition-opacity flex-shrink-0 ml-2">
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