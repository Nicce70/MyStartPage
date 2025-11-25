
import React, { useMemo } from 'react';
import type { Column, Link, Theme, GroupItemType } from '../types';
import { GlobeIcon } from './Icons';

interface FavoritesProps {
  allColumns: Column[];
  themeClasses: Theme;
  openLinksInNewTab: boolean;
}

const Favorites: React.FC<FavoritesProps> = ({ allColumns, themeClasses, openLinksInNewTab }) => {
  
  // Flatten all items from all groups in all columns to find favorites
  const favoriteLinks = useMemo(() => {
    const favs: Link[] = [];
    allColumns.forEach(col => {
      col.groups.forEach(group => {
        // Only look in link groups, or generally check all items if they are links
        if (group.items) {
            group.items.forEach((item: GroupItemType) => {
                if (item.type === 'link' && item.isFavorite) {
                    favs.push(item);
                }
            });
        }
      });
    });
    return favs;
  }, [allColumns]);

  const getFaviconUrl = (url: string) => {
    try {
      const urlObject = new URL(url);
      return `https://icons.duckduckgo.com/ip3/${urlObject.hostname}.ico`;
    } catch (e) {
      return '';
    }
  };

  if (favoriteLinks.length === 0) {
    return (
        <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>
            Mark links as favorites ❤️ in their settings to see them here.
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
      {favoriteLinks.map(link => {
        const faviconUrl = getFaviconUrl(link.url);
        return (
            <a
                key={link.id}
                href={link.url}
                target={openLinksInNewTab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-2 rounded-md transition-colors ${themeClasses.linkBg} ${themeClasses.linkHoverBg}`}
                title={link.comment}
            >
                {faviconUrl ? (
                    <img
                        src={faviconUrl}
                        alt=""
                        className="w-5 h-5 object-contain flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <GlobeIcon className={`w-5 h-5 ${themeClasses.iconMuted} flex-shrink-0`} />
                )}
                <span className={`truncate font-medium ${themeClasses.linkText} ${themeClasses.linkHoverText}`}>
                    {link.name}
                </span>
            </a>
        );
      })}
    </div>
  );
};

export default Favorites;
