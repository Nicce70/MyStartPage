
import React, { useState, useEffect } from 'react';
import type { Group, Theme, WebhookItem } from '../types';
import { PlusIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from './Icons';

// Simple UUID generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface WebhookSettingsFormProps {
  group: Group;
  themeClasses: Theme;
}

const WebhookSettingsForm: React.FC<WebhookSettingsFormProps> = ({ group, themeClasses }) => {
  const [items, setItems] = useState<WebhookItem[]>(group.widgetSettings?.webhookItems || []);

  const handleAddItem = () => {
    const newItem: WebhookItem = {
      id: uuidv4(),
      name: 'New Button',
      url: 'http://',
      method: 'GET'
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof WebhookItem, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newItems = [...items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      setItems(newItems);
    } else if (direction === 'down' && index < items.length - 1) {
      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      setItems(newItems);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-xs text-yellow-200 mb-4">
        <strong>Important Network Limitation:</strong><br/>
        If you are viewing this dashboard via <strong>HTTPS</strong>, modern browsers will block requests to local <strong>HTTP</strong> addresses (like 192.168.x.x).
        <ul className="list-disc list-inside mt-1 opacity-80">
            <li>Use <strong>HTTPS</strong> URLs for your webhooks (e.g., Homey Cloud).</li>
            <li>Or host this dashboard via <strong>HTTP</strong> on your local network.</li>
        </ul>
      </div>

      <input type="hidden" name="webhookItemsJSON" value={JSON.stringify(items)} />
      
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {items.map((item, index) => (
          <div key={item.id} className={`p-3 rounded-lg border ${themeClasses.inputBg} border-slate-600 flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                    placeholder="Button Name"
                    maxLength={30}
                    className={`flex-1 p-1.5 rounded text-sm ${themeClasses.modalBg} border border-slate-500 focus:border-indigo-500 outline-none`}
                />
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => handleMoveItem(index, 'up')}
                        disabled={index === 0}
                        className={`p-1 ${themeClasses.iconMuted} hover:text-white disabled:opacity-30`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleMoveItem(index, 'down')}
                        disabled={index === items.length - 1}
                        className={`p-1 ${themeClasses.iconMuted} hover:text-white disabled:opacity-30`}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className={`p-1 text-red-400 hover:text-red-300`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <div className="flex gap-2">
                <select
                    value={item.method}
                    onChange={(e) => handleUpdateItem(item.id, 'method', e.target.value)}
                    className={`w-40 p-1.5 rounded text-sm ${themeClasses.modalBg} border border-slate-500 focus:border-indigo-500 outline-none`}
                >
                    <option value="GET">GET (Fetch)</option>
                    <option value="POST">POST (Fetch)</option>
                    <option value="navigate">Background (Iframe)</option>
                </select>
                <input
                    type="url"
                    value={item.url}
                    onChange={(e) => handleUpdateItem(item.id, 'url', e.target.value)}
                    placeholder="http://192.168.1.x/api/trigger"
                    className={`flex-1 p-1.5 rounded text-sm ${themeClasses.modalBg} border border-slate-500 focus:border-indigo-500 outline-none font-mono`}
                />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddItem}
        className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-dashed ${themeClasses.dashedBorder} ${themeClasses.textSubtle} hover:border-slate-500 hover:text-slate-300 transition-colors`}
      >
        <PlusIcon className="w-4 h-4" />
        Add Button
      </button>
    </div>
  );
};

export default WebhookSettingsForm;
