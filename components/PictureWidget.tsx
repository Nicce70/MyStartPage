

import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';
import { PhotoIcon } from './Icons';

interface PictureWidgetProps {
  url?: string;
  base64?: string;
  sourceType?: 'url' | 'upload';
  height?: number;
  fit?: 'cover' | 'contain' | 'fill';
  borderRadius?: boolean;
  updateInterval?: number; // in minutes
  pictureClickUrl?: string;
  openLinksInNewTab?: boolean;
  themeClasses: typeof themes.default;
}

const PictureWidget: React.FC<PictureWidgetProps> = ({ 
  url, 
  base64, 
  sourceType = 'url', 
  height = 200, 
  fit = 'cover',
  borderRadius = true,
  updateInterval = 0,
  pictureClickUrl,
  openLinksInNewTab = true,
  themeClasses 
}) => {
  const [cacheBust, setCacheBust] = useState(0);

  useEffect(() => {
    if (updateInterval > 0 && sourceType === 'url' && url) {
      const intervalId = setInterval(() => {
        setCacheBust(Date.now());
      }, updateInterval * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [updateInterval, sourceType, url]);

  let imgSrc = sourceType === 'upload' ? base64 : url;

  if (sourceType === 'url' && url && updateInterval > 0 && cacheBust > 0) {
    // Add a cache-busting query parameter.
    imgSrc = `${url}${url.includes('?') ? '&' : '?'}refresh=${cacheBust}`;
  }

  if (!imgSrc) {
    return (
      <div 
        className={`flex flex-col items-center justify-center ${themeClasses.textSubtle} border-2 border-dashed ${themeClasses.dashedBorder} rounded-lg`}
        style={{ height: `${height}px` }}
      >
        <PhotoIcon className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-sm">No image selected</span>
      </div>
    );
  }

  const imgElement = (
    <img 
      src={imgSrc} 
      alt="Widget" 
      className={`w-full h-full ${borderRadius ? 'rounded-lg' : ''}`}
      style={{ objectFit: fit }}
      onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );

  if (pictureClickUrl) {
    return (
      <a
        href={pictureClickUrl}
        target={openLinksInNewTab ? "_blank" : "_self"}
        rel="noopener noreferrer"
        className="block w-full overflow-hidden cursor-pointer"
        style={{ height: `${height}px` }}
      >
        {imgElement}
      </a>
    );
  }

  return (
    <div className="w-full overflow-hidden" style={{ height: `${height}px` }}>
      {imgElement}
    </div>
  );
};

export default PictureWidget;