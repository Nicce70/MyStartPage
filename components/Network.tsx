
import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';
import { GlobeIcon } from './Icons';

interface NetworkProps {
  themeClasses: typeof themes.default;
}

interface IpData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  org: string;
}

const Network: React.FC<NetworkProps> = ({ themeClasses }) => {
  const [ipData, setIpData] = useState<IpData | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fallback for browser info
  const userAgent = navigator.userAgent;
  let browserName = "Unknown Browser";
  if (userAgent.match(/chrome|chromium|crios/i)) browserName = "Chrome";
  else if (userAgent.match(/firefox|fxios/i)) browserName = "Firefox";
  else if (userAgent.match(/safari/i)) browserName = "Safari";
  else if (userAgent.match(/opr\//i)) browserName = "Opera";
  else if (userAgent.match(/edg/i)) browserName = "Edge";

  let osName = "Unknown OS";
  if (userAgent.indexOf("Win") !== -1) osName = "Windows";
  if (userAgent.indexOf("Mac") !== -1) osName = "MacOS";
  if (userAgent.indexOf("Linux") !== -1) osName = "Linux";
  if (userAgent.indexOf("Android") !== -1) osName = "Android";
  if (userAgent.indexOf("like Mac") !== -1) osName = "iOS";

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = () => {
    setIsLoading(true);
    setError(null);
    
    const start = Date.now();
    
    fetch('https://ipapi.co/json/')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch network data');
        return response.json();
      })
      .then(data => {
        const end = Date.now();
        setLatency(end - start);
        setIpData(data);
      })
      .catch(err => {
        setError('Could not load network info.');
        // Even if IP API fails, we can still check latency to a generic endpoint
        const startPing = Date.now();
        fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
            .then(() => setLatency(Date.now() - startPing))
            .catch(() => {});
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOnline) {
        fetchData();
    }
  }, [isOnline]);

  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char =>  127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="flex flex-col gap-3 p-1">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
            <span className={`font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
            </span>
        </div>
        <div className={`text-xs ${themeClasses.textSubtle} font-mono`}>
            {latency ? `${latency}ms` : '--ms'}
        </div>
      </div>

      {isLoading ? (
        <div className={`text-center py-4 text-sm ${themeClasses.textSubtle}`}>Scanning network...</div>
      ) : error ? (
         <div className={`text-center py-2 text-sm text-red-400`}>{error}</div>
      ) : ipData ? (
        <>
            {/* IP Address */}
            <div className={`text-center p-2 rounded-md ${themeClasses.inputBg} border ${themeClasses.dashedBorder.replace('dashed', 'solid')}`}>
                <div className={`text-xs uppercase tracking-wider ${themeClasses.textSubtle} mb-1`}>Public IP</div>
                <div className={`text-xl font-mono font-bold ${themeClasses.header} break-all`}>{ipData.ip}</div>
            </div>

            {/* Location & ISP */}
            <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{getFlagEmoji(ipData.country_code)}</span>
                    <span className={themeClasses.textMuted}>{ipData.city}, {ipData.country_name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <GlobeIcon className={`w-4 h-4 ${themeClasses.iconMuted}`} />
                    <span className={`font-semibold ${themeClasses.modalText} truncate`}>{ipData.org}</span>
                </div>
            </div>
        </>
      ) : null}
      
      {/* System Info Footer */}
      <div className={`pt-2 mt-1 border-t ${themeClasses.dashedBorder} text-xs ${themeClasses.textSubtle} text-center`}>
        {browserName} on {osName}
      </div>
    </div>
  );
};

export default Network;
