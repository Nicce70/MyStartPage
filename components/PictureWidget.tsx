
import React from 'react';
import type { themes } from '../themes';
import { PhotoIcon } from './Icons';

interface PictureWidgetProps {
  url?: string;
  base64?: string;
  sourceType?: 'url' | 'upload';
  height?: number;
  fit?: 'cover' | 'contain' | 'fill';
  borderRadius?: boolean;
  themeClasses: typeof themes.default;
}

const PictureWidget: React.FC<PictureWidgetProps> = ({ 
  url, 
  base64, 
  sourceType = 'url', 
  height = 200, 
  fit = 'cover',
  borderRadius = true,
  themeClasses 
}) => {
  const imgSrc = sourceType === 'upload' ? base64 : url;

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

  return (
    <div className="w-full overflow-hidden" style={{ height: `${height}px` }}>
      <img 
        src={imgSrc} 
        alt="Widget" 
        className={`w-full h-full ${borderRadius ? 'rounded-lg' : ''}`}
        style={{ objectFit: fit }}
        onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
};

export default PictureWidget;
