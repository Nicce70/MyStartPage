
import React, { useState, useEffect, useRef } from 'react';
import type { themes } from '../themes';
import { PhotoIcon, MagnifyingGlassPlusIcon, ArrowTopRightOnSquareIcon, XMarkIcon } from './Icons';

interface LightboxProps {
  src: string;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ src, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in"
            onClick={onClose}
        >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-opacity">
                <XMarkIcon className="w-8 h-8" />
            </button>
            <img 
                src={src} 
                alt="Enlarged view" 
                className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
            />
        </div>
    );
};

interface PictureWidgetProps {
  url?: string;
  base64?: string;
  sourceType?: 'url' | 'upload';
  height?: number;
  fit?: 'cover' | 'contain' | 'fill';
  borderRadius?: boolean;
  updateInterval?: number; // in minutes
  pictureClickUrl?: string;
  pictureEnableZoom?: boolean;
  openLinksInNewTab?: boolean;
  themeClasses: typeof themes.default;
  isEditMode: boolean;
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
  pictureEnableZoom,
  openLinksInNewTab = true,
  themeClasses,
  isEditMode
}) => {
  const [cacheBust, setCacheBust] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (updateInterval > 0 && sourceType === 'url' && url) {
      const intervalId = setInterval(() => {
        setCacheBust(Date.now());
      }, updateInterval * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [updateInterval, sourceType, url]);

  useEffect(() => {
    if (!showOptions) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  let imgSrc = sourceType === 'upload' ? base64 : url;

  if (sourceType === 'url' && url && updateInterval > 0 && cacheBust > 0) {
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

  const hasLink = !!pictureClickUrl;
  const hasZoom = !!pictureEnableZoom;

  let clickMode: 'options' | 'link' | 'zoom' | 'none' = 'none';
  if (hasLink && hasZoom) {
    clickMode = 'options';
  } else if (hasLink) {
    clickMode = 'link';
  } else if (hasZoom) {
    clickMode = 'zoom';
  }
  
  const handleWrapperClick = () => {
    if (isEditMode) return;

    switch (clickMode) {
        case 'link':
            window.open(pictureClickUrl, openLinksInNewTab ? "_blank" : "_self", "noopener,noreferrer");
            break;
        case 'zoom':
            setIsLightboxOpen(true);
            break;
        case 'options':
            setShowOptions(true);
            break;
    }
  };
  
  const handleZoomClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsLightboxOpen(true);
      setShowOptions(false);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(pictureClickUrl, openLinksInNewTab ? "_blank" : "_self", "noopener,noreferrer");
      setShowOptions(false);
  };
  
  const cursorClass = isEditMode || clickMode === 'none' ? 'cursor-default' : 'cursor-pointer';

  return (
    <>
        <div 
            ref={widgetRef}
            className={`relative w-full overflow-hidden ${cursorClass}`} 
            style={{ height: `${height}px` }}
            onClick={handleWrapperClick}
        >
            <img 
              src={imgSrc} 
              alt="Widget" 
              className={`w-full h-full ${borderRadius ? 'rounded-lg' : ''}`}
              style={{ objectFit: fit }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            
            {showOptions && !isEditMode && (
                <div 
                    className="absolute inset-0 bg-black/60 flex items-center justify-center gap-8 animate-fade-in"
                    onClick={(e) => { e.stopPropagation(); setShowOptions(false); }}
                >
                    <button onClick={handleZoomClick} className="text-white/80 hover:text-white hover:scale-110 transition-transform p-3 rounded-full bg-black/40" title="Zoom In">
                        <MagnifyingGlassPlusIcon className="w-8 h-8" />
                    </button>
                    <button onClick={handleLinkClick} className="text-white/80 hover:text-white hover:scale-110 transition-transform p-3 rounded-full bg-black/40" title="Open Link">
                        <ArrowTopRightOnSquareIcon className="w-8 h-8" />
                    </button>
                </div>
            )}
        </div>

        {isLightboxOpen && imgSrc && <Lightbox src={imgSrc} onClose={() => setIsLightboxOpen(false)} />}
    </>
  );
};

export default PictureWidget;
