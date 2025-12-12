import React, { useMemo, useState, useEffect } from 'react';
import type { Column, Link, Theme, Group, GroupItemType } from '../types';
import { GlobeIcon } from './Icons';

interface FavoritesProps {
  group: Group;
  allColumns: Column[];
  themeClasses: Theme;
  openLinksInNewTab: boolean;
}

// A self-contained component for handling favicon loading with fallbacks.
const FaviconWithFallback: React.FC<{ url: string; className: string }> = ({ url, className }) => {
    const [errorCount, setErrorCount] = useState(0);

    // Reset errors when the URL changes
    useEffect(() => {
        setErrorCount(0);
    }, [url]);

    const handleError = () => {
        setErrorCount(prev => prev + 1);
    };

    let hostname: string;
    try {
        hostname = new URL(url).hostname;
    } catch (e) {
        return <GlobeIcon className={className} />;
    }

    if (errorCount >= 2) {
        return <GlobeIcon className={className} />;
    }

    const src = errorCount === 0
        ? `https://icon.horse/icon/${hostname}`
        : `https://icons.duckduckgo.com/ip3/${hostname}.ico`;

    return <img src={src} alt="" className={className} onError={handleError} />;
};

const Favorites: React.FC<FavoritesProps> = ({ group, allColumns, themeClasses, openLinksInNewTab }) => {
  
  const favoriteLinks = useMemo(() => {
    const favs: Link[] = [];
    allColumns.forEach(col => {
      col.groups.forEach(g => {
        if (g.items) {
            g.items.forEach((item: GroupItemType) => {
                if (item.type === 'link' && item.isFavorite) {
                    favs.push(item);
                }
            });
        }
      });
    });
    
    const order = group.widgetSettings?.favoritesOrder;
    if (order) {
        const orderMap = new Map(order.map((id, index) => [id, index]));
        favs.sort((a: Link, b: Link) => {
            const indexA = orderMap.get(a.id);
            const indexB = orderMap.get(b.id);
            // FIX: Explicitly cast to Number to resolve a potential TypeScript type inference issue.
            if (indexA !== undefined && indexB !== undefined) return Number(indexA) - Number(indexB);
            if (indexA !== undefined) return -1; // a is ordered, b is not
            if (indexB !== undefined) return 1;  // b is ordered, a is not
            return 0; // neither are ordered, maintain original relative order
        });
    }

    return favs;
  }, [allColumns, group.widgetSettings?.favoritesOrder]);
  
  if (favoriteLinks.length === 0) {
    return (
        <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>
            Mark links as favorites ❤️ in their settings to see them here.
        </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1`}>
      {favoriteLinks.map(link => (
            <a
                key={link.id}
                href={link.url}
                target={openLinksInNewTab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-2 rounded-md transition-colors border ${themeClasses.dashedBorder} ${themeClasses.linkBg} ${themeClasses.linkHoverBg}`}
                title={link.comment}
            >
                <FaviconWithFallback 
                    url={link.url} 
                    className={`w-6 h-6 object-contain flex-shrink-0 ${themeClasses.iconMuted}`} 
                />
                <span className={`truncate font-medium ${themeClasses.linkText} ${themeClasses.linkHoverText}`}>
                    {link.name}
                </span>
            </a>
        )
      )}
    </div>
  );
};

export default Favorites;