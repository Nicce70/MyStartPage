
import React, { useState } from 'react';
import type { Group, Theme } from '../types';

interface IframeSettingsFormProps {
  group: Group;
  themeClasses: Theme;
}

const IframeSettingsForm: React.FC<IframeSettingsFormProps> = ({ group, themeClasses }) => {
  const [url, setUrl] = useState(group.widgetSettings?.iframeUrl || '');
  const [height, setHeight] = useState(group.widgetSettings?.iframeHeight || 400);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>(group.widgetSettings?.iframeViewMode || 'desktop');
  const [interval, setInterval] = useState(group.widgetSettings?.iframeUpdateInterval || 0);

  return (
    <div className="space-y-4">
        {/* Hidden inputs to pass data back to App.tsx */}
        <input type="hidden" name="iframeUrl" value={url} />
        <input type="hidden" name="iframeViewMode" value={viewMode} />
        
        <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-xs text-yellow-200 mb-2">
            <strong>Warning:</strong> Many major websites (e.g., Google, Facebook, YouTube) block being embedded in iframes for security reasons. If the widget shows "refused to connect" or is blank, the site likely does not allow embedding.
        </div>

        <div>
            <label htmlFor="iframeUrlInput" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Website URL</label>
            <input
                type="url"
                id="iframeUrlInput"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="iframeHeight" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Height (px)</label>
                <input
                    type="number"
                    id="iframeHeight"
                    name="iframeHeight"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    min="100"
                    max="2000"
                    className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
            </div>
            <div>
                 <label htmlFor="iframeUpdateInterval" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Auto Refresh (mins)</label>
                <input
                    type="number"
                    id="iframeUpdateInterval"
                    name="iframeUpdateInterval"
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                    min="0"
                    max="999"
                    className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
                <p className="text-xs text-slate-500 mt-1">0 to disable</p>
            </div>
        </div>

        <div>
            <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-2`}>View Mode</label>
            <div className="flex bg-slate-700 p-1 rounded-lg">
                <button
                    type="button"
                    onClick={() => setViewMode('desktop')}
                    className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'desktop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                >
                    Desktop (Full Width)
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode('mobile')}
                    className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                >
                    Mobile (Phone Width)
                </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
                "Mobile" restricts the width to ~375px to trigger responsive layouts on supported sites.
            </p>
        </div>
    </div>
  );
};

export default IframeSettingsForm;
