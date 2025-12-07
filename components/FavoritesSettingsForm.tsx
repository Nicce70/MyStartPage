
import React, { useState, useMemo } from 'react';
import type { Group, Theme, Link, Column, GroupItemType } from '../types';

interface FavoritesSettingsFormProps {
  group: Group;
  allColumns: Column[];
  themeClasses: Theme;
}

const FavoritesSettingsForm: React.FC<FavoritesSettingsFormProps> = ({ group, allColumns, themeClasses }) => {
  const allFavorites = useMemo(() => {
    const favs: Link[] = [];
    allColumns.forEach(col => {
      col.groups.forEach(group => {
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

  const [orderedFavorites, setOrderedFavorites] = useState<Link[]>(() => {
    const order = group.widgetSettings?.favoritesOrder;
    if (!order) return allFavorites;
    
    const ordered = [...allFavorites];
    const orderMap = new Map(order.map((id, index) => [id, index]));
    
    ordered.sort((a, b) => {
      const indexA = orderMap.get(a.id);
      const indexB = orderMap.get(b.id);
      // FIX: Explicitly cast to Number to resolve a potential TypeScript type inference issue.
      if (indexA !== undefined && indexB !== undefined) return Number(indexA) - Number(indexB);
      if (indexA !== undefined) return -1;
      if (indexB !== undefined) return 1;
      // Keep original relative order for new/unsorted items
      return 0;
    });

    // Append any new favorites that aren't in the saved order yet
    const orderedIds = new Set(ordered.map(f => f.id));
    allFavorites.forEach(fav => {
        if (!orderedIds.has(fav.id)) {
            ordered.push(fav);
        }
    });

    return ordered;
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newItems = [...orderedFavorites];
    if (direction === 'up' && index > 0) {
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    setOrderedFavorites(newItems);
  };
  
  return (
    <div className="space-y-4">
      <input type="hidden" name="favoritesOrderJSON" value={JSON.stringify(orderedFavorites.map(f => f.id))} />
      <p className={`text-sm ${themeClasses.modalMutedText}`}>Use the arrow buttons to reorder your favorite links.</p>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {orderedFavorites.map((fav, index) => (
          <div key={fav.id} className={`p-2 rounded-lg border ${themeClasses.inputBg} border-slate-600 flex items-center justify-between`}>
            <span className="font-medium text-sm truncate">{fav.name}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleMove(index, 'up')}
                disabled={index === 0}
                className={`p-1 ${themeClasses.iconMuted} hover:text-white disabled:opacity-30`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
              </button>
              <button
                type="button"
                onClick={() => handleMove(index, 'down')}
                disabled={index === orderedFavorites.length - 1}
                className={`p-1 ${themeClasses.iconMuted} hover:text-white disabled:opacity-30`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
            </div>
          </div>
        ))}
        {orderedFavorites.length === 0 && <p className="text-center text-sm text-slate-500 py-4">No favorite links found.</p>}
      </div>
    </div>
  );
};

export default FavoritesSettingsForm;
