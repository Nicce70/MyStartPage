

import React, { useState, useEffect } from 'react';
import type { Group, Theme } from '../types';
import { PhotoIcon, TrashIcon } from './Icons';

interface PictureSettingsFormProps {
  group: Group;
  themeClasses: Theme;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

const PictureSettingsForm: React.FC<PictureSettingsFormProps> = ({ group, themeClasses }) => {
  const [sourceType, setSourceType] = useState<'url' | 'upload'>(group.widgetSettings?.pictureSourceType || 'url');
  const [url, setUrl] = useState(group.widgetSettings?.pictureUrl || '');
  const [base64, setBase64] = useState(group.widgetSettings?.pictureBase64 || '');
  const [height, setHeight] = useState(group.widgetSettings?.pictureHeight || 200);
  const [fit, setFit] = useState<'cover' | 'contain' | 'fill'>(group.widgetSettings?.pictureFit || 'cover');
  const [borderRadius, setBorderRadius] = useState(group.widgetSettings?.pictureBorderRadius ?? true);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
        setError("File is too large. Max size is 1MB.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        setBase64(result);
    };
    reader.onerror = () => {
        setError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
      setBase64('');
      // Reset file input
      const fileInput = document.getElementById('pictureUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-4">
        {/* Hidden inputs to pass data back to App.tsx */}
        <input type="hidden" name="pictureSourceType" value={sourceType} />
        <input type="hidden" name="pictureUrl" value={url} />
        <input type="hidden" name="pictureBase64" value={base64} />
        
        {/* Source Type Toggle */}
        <div className="flex bg-slate-700 p-1 rounded-lg">
            <button
                type="button"
                onClick={() => setSourceType('url')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${sourceType === 'url' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
            >
                Image URL
            </button>
            <button
                type="button"
                onClick={() => setSourceType('upload')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${sourceType === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
            >
                Upload File
            </button>
        </div>

        {/* Input Area */}
        <div className={`p-4 rounded-lg border ${themeClasses.inputBg} ${themeClasses.dashedBorder} space-y-4`}>
            {sourceType === 'url' ? (
                <>
                    <div>
                        <label htmlFor="pictureUrlInput" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Image Address</label>
                        <input
                            type="url"
                            id="pictureUrlInput"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                        />
                    </div>
                     <div>
                        <label htmlFor="pictureUpdateInterval" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Auto-Refresh Interval</label>
                        <select
                          id="pictureUpdateInterval"
                          name="pictureUpdateInterval"
                          defaultValue={group.widgetSettings?.pictureUpdateInterval || 0}
                          className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                        >
                          <option value="0">Off</option>
                          <option value="1">Every 1 minute</option>
                          <option value="5">Every 5 minutes</option>
                          <option value="15">Every 15 minutes</option>
                          <option value="60">Every 1 hour</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                          Useful for dynamic images like weather maps or webcams. Forces a refresh to bypass browser cache.
                        </p>
                      </div>
                </>
            ) : (
                <div>
                    <label htmlFor="pictureUpload" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Select Image (Max 1MB)</label>
                    
                    {!base64 ? (
                        <input
                            type="file"
                            id="pictureUpload"
                            accept="image/*"
                            onChange={handleFileChange}
                            className={`w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700`}
                        />
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 relative rounded overflow-hidden border border-slate-600">
                                <img src={base64} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <button
                                type="button"
                                onClick={handleClearImage}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-900/20 rounded transition-colors`}
                            >
                                <TrashIcon className="w-4 h-4" />
                                Remove
                            </button>
                        </div>
                    )}
                    {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                </div>
            )}
        </div>

        <div>
            <label htmlFor="pictureClickUrl" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Clickable Link (optional)</label>
            <input
                type="url"
                id="pictureClickUrl"
                name="pictureClickUrl"
                defaultValue={group.widgetSettings?.pictureClickUrl || ''}
                placeholder="https://example.com"
                className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
            />
            <p className="text-xs text-slate-500 mt-1">If set, the entire image will act as a link to this URL.</p>
        </div>

        {/* Appearance Settings */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="pictureHeight" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Height (px)</label>
                <input
                    type="number"
                    id="pictureHeight"
                    name="pictureHeight"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    min="50"
                    max="1000"
                    className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
            </div>
            <div>
                <label htmlFor="pictureFit" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Fit Mode</label>
                <select
                    id="pictureFit"
                    name="pictureFit"
                    value={fit}
                    onChange={(e) => setFit(e.target.value as any)}
                    className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                >
                    <option value="cover">Cover (Crop)</option>
                    <option value="contain">Contain (Full)</option>
                    <option value="fill">Fill (Stretch)</option>
                </select>
            </div>
        </div>

        <div className="flex items-center justify-between pt-2">
            <label htmlFor="pictureBorderRadius" className="text-sm font-medium">Rounded Corners</label>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    id="pictureBorderRadius"
                    name="pictureBorderRadius"
                    checked={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.checked)}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
    </div>
  );
};

export default PictureSettingsForm;