
import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';
import { WindowIcon } from './Icons';

interface IframeWidgetProps {
  url: string;
  viewMode?: 'desktop' | 'mobile';
  height?: number;
  updateInterval?: number;
  themeClasses: typeof themes.default;
}

const IframeWidget: React.FC<IframeWidgetProps> = ({ 
  url, 
  viewMode = 'desktop', 
  height = 400, 
  updateInterval = 0,
  themeClasses 
}) => {
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (updateInterval > 0) {
      const intervalId = setInterval(() => {
        setIframeKey(prev => prev + 1);
      }, updateInterval * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [updateInterval]);

  if (!url) {
    return (
      <div 
        className={`flex flex-col items-center justify-center ${themeClasses.textSubtle} border-2 border-dashed ${themeClasses.dashedBorder} rounded-lg`}
        style={{ height: `${height}px` }}
      >
        <WindowIcon className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-sm">No URL configured</span>
      </div>
    );
  }

  // Ensure safe URL
  const safeUrl = url.startsWith('http') ? url : `https://${url}`;

  // Container styling for Mobile View simulation
  const containerStyle: React.CSSProperties = viewMode === 'mobile' 
    ? {
        width: '375px',
        maxWidth: '100%',
        margin: '0 auto',
        borderLeft: '1px solid rgba(128,128,128,0.2)',
        borderRight: '1px solid rgba(128,128,128,0.2)',
      } 
    : { width: '100%' };

  return (
    <div className="w-full overflow-hidden flex justify-center bg-white" style={{ height: `${height}px`, borderRadius: '0.5rem' }}>
      <div style={{ ...containerStyle, height: '100%' }}>
        <iframe
            key={iframeKey}
            src={safeUrl}
            title="Embedded Content"
            width="100%"
            height="100%"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            style={{ border: 'none', display: 'block' }}
        />
      </div>
    </div>
  );
};

export default IframeWidget;
