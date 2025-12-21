
import React, { useRef, useEffect } from 'react';
import type { Group, Theme } from '../types';
import LinkItem from './LinkItem';
import SeparatorItem from './SeparatorItem';
import { XMarkIcon } from './Icons';

interface LinkGroupPopupProps {
  group: Group;
  onClose: () => void;
  themeClasses: Theme;
  openLinksInNewTab: boolean;
}

const LinkGroupPopup: React.FC<LinkGroupPopupProps> = ({ group, onClose, themeClasses, openLinksInNewTab }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const compact = !!group.widgetSettings?.compactMode;

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={popupRef}
        onClick={e => e.stopPropagation()}
        className={`relative w-full max-w-md p-4 rounded-lg shadow-2xl border ${themeClasses.modalBg} ${themeClasses.dashedBorder}`}
      >
        <button onClick={onClose} className={`absolute top-3 right-3 p-1 rounded-full ${themeClasses.iconMuted} hover:text-white hover:bg-white/10`}>
          <XMarkIcon className="w-5 h-5" />
        </button>

        <h2 className={`text-lg font-bold mb-4 pr-8 ${themeClasses.header}`}>{group.name}</h2>
        
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <div className={compact ? "space-y-1" : "space-y-2"}>
            {group.items.map(item =>
              item.type === 'link' ? (
                <LinkItem
                  key={item.id}
                  link={item}
                  // Dummy props for type compatibility, not used in popup view
                  groupId={group.id}
                  columnId=""
                  isEditMode={false}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onPointerDown={() => {}}
                  draggedItem={null}
                  dropTarget={null}
                  // Real props
                  themeClasses={themeClasses}
                  openLinksInNewTab={openLinksInNewTab}
                  compact={compact}
                  onLinkClick={onClose} // Auto-close on link click
                />
              ) : item.type === 'separator' ? (
                <SeparatorItem
                  key={item.id}
                  separator={item}
                   // Dummy props
                  groupId={group.id}
                  columnId=""
                  isEditMode={false}
                  onDelete={() => {}}
                  onPointerDown={() => {}}
                  draggedItem={null}
                  dropTarget={null}
                   // Real props
                  themeClasses={themeClasses}
                  compact={compact}
                />
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkGroupPopup;
