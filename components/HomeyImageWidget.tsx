import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { themes } from '../themes';
import { CameraIcon, ArrowPathIcon, ExclamationCircleIcon } from './Icons';

interface HomeyImageWidgetProps {
  localIp?: string;
  apiToken?: string;
  deviceId?: string;
  updateInterval?: number; 
  fit?: 'cover' | 'contain' | 'fill';
  height?: number;
  themeClasses: typeof themes.default;
}

const HomeyImageWidget: React.FC<HomeyImageWidgetProps> = ({
  localIp,
  apiToken,
  deviceId,
  updateInterval = 300,
  fit = 'cover',
  height = 200,
  themeClasses
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const fetchImage = useCallback(async () => {
    if (!localIp || !apiToken || !deviceId) {
      setError("Not configured");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const base = localIp.startsWith("http")
      ? localIp
      : `http://${localIp}`;

    const token = apiToken.replace(/^Bearer\s+/i, "").trim();

    try {
      // 1. Hämta device metadata
      const metaRes = await fetch(
        `${base}/api/manager/devices/device/${deviceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!metaRes.ok)
        throw new Error(`Device metadata failed (${metaRes.status})`);

      const device = await metaRes.json();

      // 2. Leta efter en användbar bild-URL
      const possibleUrls = [
        device?.camera_image?.snapshot,
        device?.camera_image?.url,
        device?.camera_image?.stream,
        device?.image?.url,
        device?.capabilitiesObj?.camera_image?.value?.url,
        device?.capabilitiesObj?.image?.value?.url,
        device?.capabilitiesObj?.camera_image?.url
      ].filter(Boolean);

      if (possibleUrls.length === 0)
        throw new Error("No image URL found in device");

      // Ta första kandidaten
      let url = possibleUrls[0];

      // Gör absolut URL om den börjar med "/"
      if (url.startsWith("/")) {
        url = `${base}${url}`;
      }

      // 3. Hämta själva bilden
      const imgRes = await fetch(url);
      if (!imgRes.ok)
        throw new Error(`Image fetch failed (${imgRes.status})`);

      const blob = await imgRes.blob();

      if (objectUrlRef.current)
        URL.revokeObjectURL(objectUrlRef.current);

      const objUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objUrl;
      setImageUrl(objUrl);

    } catch (err: any) {
      setError(err.message || "Unknown error");
      setImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [localIp, apiToken, deviceId]);

  // Polling
  useEffect(() => {
    fetchImage();
    const id = setInterval(fetchImage, updateInterval * 1000);

    return () => {
      clearInterval(id);
      if (objectUrlRef.current)
        URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [fetchImage, updateInterval]);

  const renderContent = () => {
    if (isLoading && !imageUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <ArrowPathIcon className="w-8 h-8 animate-spin opacity-50" />
          <span className="text-sm mt-2">Loading...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400 p-2">
          <ExclamationCircleIcon className="w-8 h-8 mb-2" />
          <span className="text-sm text-center">{error}</span>
        </div>
      );
    }

    if (!imageUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <CameraIcon className="w-8 h-8 opacity-50 mb-2" />
          <span className="text-sm">No image</span>
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt="Homey Image"
        className="w-full h-full"
        style={{ objectFit: fit }}
      />
    );
  };

  return (
    <div
      className={`w-full overflow-hidden rounded-lg ${themeClasses.inputBg} flex items-center justify-center text-sm ${themeClasses.textSubtle}`}
      style={{ height: `${height}px` }}
    >
      {renderContent()}
    </div>
  );
};

export default HomeyImageWidget;
