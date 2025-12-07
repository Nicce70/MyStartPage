import React, { useState, useEffect, useMemo } from 'react';
import type { Group, Theme } from '../types';
import { ArrowPathIcon } from './Icons';

interface HomeyImageSettingsFormProps {
  group: Group;
  themeClasses: Theme;
  globalIp?: string;
  globalToken?: string;
}

interface ImageSourceOption {
  id: string; // "deviceId:sourceType:sourceId"
  deviceName: string;
  sourceName: string;
}

const updateIntervalOptions = [
  { label: 'Every second', value: 1 },
  { label: 'Every 5 seconds', value: 5 },
  { label: 'Every 30 seconds', value: 30 },
  { label: 'Every minute', value: 60 },
  { label: 'Every 5 minutes', value: 300 },
  { label: 'Every 15 minutes', value: 900 },
  { label: 'Every hour', value: 3600 },
  { label: 'Every day', value: 86400 },
];

const HomeyImageSettingsForm: React.FC<HomeyImageSettingsFormProps> = ({ group, themeClasses, globalIp, globalToken }) => {
  const [imageSources, setImageSources] = useState<ImageSourceOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!globalIp || !globalToken) {
        setError("Homey IP and Token must be configured in global Settings first.");
        return;
    }
    setIsLoading(true);
    setError(null);
    
    const cleanToken = globalToken.replace(/^Bearer\s+/i, '').trim();
    let formattedIp = globalIp.trim();
    if (!formattedIp.startsWith('http')) {
        formattedIp = `http://${formattedIp}`;
    }

    try {
      const headers = { 'Authorization': `Bearer ${cleanToken}` };
      const res = await fetch(`${formattedIp}/api/manager/devices/device`, { headers });
      
      if (!res.ok) throw new Error('Failed to fetch devices. Check global settings.');
      
      const devicesData: Record<string, any> = await res.json();
      
      const sources: ImageSourceOption[] = [];
      Object.values(devicesData).forEach(device => {
          // 1. Check for Device Images (e.g., from cameras)
          if (device.images && typeof device.images === 'object') {
              Object.values(device.images).forEach((image: any) => {
                  if (image && image.id) {
                      sources.push({
                          id: `${device.id}:deviceImage:${image.id}`,
                          deviceName: device.name,
                          sourceName: image.title || image.id.replace(/_/g, ' '), // e.g. "camera image"
                      });
                  }
              });
          }
          // 2. Check for Capability Images (e.g., from Chromecast)
          if (device.capabilitiesObj) {
              Object.entries(device.capabilitiesObj).forEach(([capId, capDetails]: [string, any]) => {
                  if (capDetails.type === 'image') {
                      sources.push({
                          id: `${device.id}:capabilityImage:${capId}`,
                          deviceName: device.name,
                          sourceName: capDetails.title || capId,
                      });
                  }
              });
          }
      });
      
      setImageSources(sources.sort((a, b) => a.deviceName.localeCompare(b.deviceName)));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [globalIp, globalToken]);

  if (!globalIp || !globalToken) {
    return (
        <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-sm text-yellow-200 text-center">
            Please configure your Homey's IP and API Token in the <strong>Settings → Homey</strong> tab first.
        </div>
    );
  }

  const currentSelection = `${group.widgetSettings?.homeyImageSettings?.deviceId || ''}:${group.widgetSettings?.homeyImageSettings?.sourceType || ''}:${group.widgetSettings?.homeyImageSettings?.sourceId || ''}`;

  return (
    <div className="space-y-4">
        <div className="mb-4">
            <label htmlFor="name" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Name</label>
            <input type="text" id="name" name="name" defaultValue={group.name} required maxLength={30} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
        </div>

        <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="source" className={`block text-sm font-medium ${themeClasses.modalMutedText}`}>Image Source</label>
                <button 
                    type="button" 
                    onClick={fetchData} 
                    className={`p-1.5 rounded hover:bg-white/10 transition-colors ${themeClasses.iconMuted}`}
                    title="Refresh List"
                    disabled={isLoading}
                >
                    <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            
            {isLoading ? (
                <div className={`text-sm text-center py-2 ${themeClasses.textSubtle}`}>Loading devices...</div>
            ) : error ? (
                <div className="text-red-400 text-sm">{error}</div>
            ) : (
                <select
                    id="source"
                    name="source"
                    defaultValue={currentSelection}
                    required
                    className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                >
                    {imageSources.length === 0 ? (
                        <option value="::" disabled>No image sources found</option>
                    ) : (
                       <>
                        <option value="::" disabled>Select an image source</option>
                        {imageSources.map(src => (
                            <option key={src.id} value={src.id}>
                                {src.deviceName} - {src.sourceName}
                            </option>
                        ))}
                       </>
                    )}
                </select>
            )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
                <label htmlFor="updateInterval" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Refresh Interval</label>
                <select
                    id="updateInterval"
                    name="updateInterval"
                    defaultValue={group.widgetSettings?.homeyImageSettings?.updateInterval || 300}
                    className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                >
                    {updateIntervalOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="height" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Height (px)</label>
                <input
                    type="number"
                    id="height"
                    name="height"
                    defaultValue={group.widgetSettings?.homeyImageSettings?.height || 200}
                    min="50"
                    max="1000"
                    className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
            </div>
        </div>

        <div>
            <label htmlFor="fit" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Image Fit</label>
            <select
                id="fit"
                name="fit"
                defaultValue={group.widgetSettings?.homeyImageSettings?.fit || 'cover'}
                className={`w-full p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
            >
                <option value="cover">Cover (Crop)</option>
                <option value="contain">Contain (Full)</option>
                <option value="fill">Fill (Stretch)</option>
            </select>
        </div>
    </div>
  );
};

export default HomeyImageSettingsForm;