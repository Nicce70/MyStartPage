
import React, { useState } from 'react';
import type { themes } from '../themes';
import type { WebhookItem } from '../types';

interface WebhookProps {
  items: WebhookItem[];
  themeClasses: typeof themes.default;
  isEditMode: boolean;
}

const Webhook: React.FC<WebhookProps> = ({ items, themeClasses, isEditMode }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleClick = (item: WebhookItem) => {
    if (isEditMode) return;
    setActiveId(item.id);
    
    if (item.method === 'navigate') {
        // Create a temporary, invisible iframe to perform the request.
        // This simulates a "navigation" (like typing URL in address bar) without leaving the page.
        // Note: Browsers will block this if the dashboard is HTTPS and the target is HTTP (Mixed Content).
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = item.url;
        document.body.appendChild(iframe);
        
        // Remove the iframe after a short delay to clean up
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 2000);
        
    } else {
        // Fire and forget request using Fetch
        // We use 'no-cors' to allow sending requests to other domains (like local IP addresses)
        const fetchOptions: RequestInit = {
          method: item.method || 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          credentials: 'omit',
        };

        if (item.method === 'POST') {
            fetchOptions.body = '';
        }

        fetch(item.url, fetchOptions)
            .catch(e => {
                // Suppress errors for cleaner UI in fire-and-forget mode
                // console.warn('Webhook trigger warning:', e); 
            });
    }

    // Visual feedback logic - reset after animation
    setTimeout(() => setActiveId(null), 300);
  };

  if (!items || items.length === 0) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>No webhooks configured. Add them in settings.</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            disabled={isEditMode}
            className={`
              p-3 rounded-lg font-semibold text-sm transition-all duration-200 truncate
              ${isActive 
                ? 'bg-green-500 text-white scale-95 shadow-inner' 
                : `${themeClasses.buttonSecondary} hover:brightness-110`
              }
              ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={item.url}
          >
            {item.name}
          </button>
        );
      })}
    </div>
  );
};

export default Webhook;
