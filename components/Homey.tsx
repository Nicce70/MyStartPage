
import React, { useState, useEffect, useRef } from 'react';
import type { themes } from '../themes';
import { LightBulbIcon, CpuChipIcon, ArrowPathIcon } from './Icons';
// @ts-ignore
import { io } from "socket.io-client";

interface HomeyProps {
  localIp: string;
  apiToken: string;
  deviceIds: string[];
  themeClasses: typeof themes.default;
}

interface DeviceStatus {
  id: string;
  name: string;
  class: string;
  onoff?: boolean;
  measure?: Record<string, number | string>;
  alarm?: Record<string, boolean>;
  available: boolean;
}

const Homey: React.FC<HomeyProps> = ({ localIp, apiToken, deviceIds, themeClasses }) => {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<any>(null);

  const sanitizeToken = (input: string) => input.replace(/^Bearer\s+/i, '').trim();

  const formatUrl = (ip: string) => {
      let formatted = ip.trim();
      if (!formatted.startsWith('http')) formatted = `http://${formatted}`;
      return formatted;
  };

  const getDeviceUrl = (ip: string) => `${formatUrl(ip)}/api/manager/devices/device`;

  const parseDeviceData = (d: any): DeviceStatus | null => {
      if (!d) return null;
      
      const measures: Record<string, any> = {};
      const alarms: Record<string, boolean> = {};
      let onoff = undefined;

      // Check capabilities safely
      if (d.capabilitiesObj) {
          for (const cap in d.capabilitiesObj) {
              const val = d.capabilitiesObj[cap]?.value;
              if (cap === 'onoff') onoff = val;
              else if (cap.startsWith('measure_')) measures[cap.replace('measure_', '')] = val;
              else if (cap.startsWith('alarm_')) alarms[cap.replace('alarm_', '')] = val;
          }
      }

      return {
          id: d.id,
          name: d.name,
          class: d.class,
          onoff,
          measure: measures,
          alarm: alarms,
          available: d.ready
      };
  };

  const updateDevicesFromRawData = (allDevicesData: any) => {
      const updatedDevices: DeviceStatus[] = [];
      const allDevices = Array.isArray(allDevicesData) 
        ? allDevicesData 
        : Object.values(allDevicesData) as any[];

      for (const id of deviceIds) {
          const d = allDevices.find((dev: any) => dev.id === id);
          if (d) {
              const parsed = parseDeviceData(d);
              if (parsed) updatedDevices.push(parsed);
          }
      }
      
      if (updatedDevices.length > 0) {
          setDevices(updatedDevices);
      }
  };

  // Fetch Data via REST (Polling)
  const fetchRESTData = async () => {
    if (!localIp || !apiToken || deviceIds.length === 0) return;

    try {
        const res = await fetch(getDeviceUrl(localIp), {
            headers: { 'Authorization': `Bearer ${sanitizeToken(apiToken)}` }
        });

        if (!res.ok) throw new Error("REST fetch failed");

        const data = await res.json();
        updateDevicesFromRawData(data);
        setError(null);
    } catch (err) {
        console.warn("Homey Polling failed:", err);
        // Don't show error UI on poll fail if we already have data
    } finally {
        setIsLoading(false);
    }
  };

  // Main Effect
  useEffect(() => {
    if (!localIp || !apiToken) {
        setIsLoading(false);
        return;
    }

    // 1. Initial Load & Polling
    fetchRESTData();
    const pollInterval = setInterval(fetchRESTData, 10000); // Poll every 10s

    // 2. WebSocket Setup (Only for connection status & commands, avoiding CORS polling issues)
    const url = formatUrl(localIp);
    const token = sanitizeToken(apiToken);

    console.log("Initializing Homey Socket connection to:", url);

    const socket = io(url, {
      transports: ["websocket"], // Force WebSocket to avoid CORS 400 on Polling
      upgrade: false,
      query: { token: token },
      auth: { token: token },
      reconnectionDelay: 5000,
    });

    socket.on("connect", () => {
        console.log("Homey Socket Connected!");
        setIsConnected(true);
    });

    socket.on("disconnect", () => setIsConnected(false));

    socketRef.current = socket;

    return () => {
        clearInterval(pollInterval);
        if (socketRef.current) socketRef.current.disconnect();
    };
  }, [localIp, apiToken, deviceIds]);


  const handleToggle = async (deviceId: string, currentState: boolean) => {
      // Optimistic update
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, onoff: !currentState } : d));

      try {
          // Try REST first as it's simple for commands
          const url = `${getDeviceUrl(localIp)}/${deviceId}/capability/onoff`;
          const res = await fetch(url, {
              method: 'PUT',
              headers: { 
                  'Authorization': `Bearer ${sanitizeToken(apiToken)}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ value: !currentState })
          });
          
          if (!res.ok) {
              throw new Error("REST failed");
          }
      } catch (e) {
          // Fallback to Socket
          if (socketRef.current && isConnected) {
              socketRef.current.emit('manager.devices.device.capability.set', {
                  deviceId: deviceId,
                  capabilityId: 'onoff',
                  value: !currentState
              }, (err: any) => {
                  if (err) {
                      console.error("Socket toggle failed:", err);
                      // Revert
                      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, onoff: currentState } : d));
                  }
              });
          } else {
              // Revert if both fail
              setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, onoff: currentState } : d));
          }
      }
  };

  if (!localIp || !apiToken) return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Configure Homey (Local)<br />Read more in Settings &gt; About.</div>;

  if (isLoading && devices.length === 0) return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Connecting...</div>;

  if (error && devices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-4 text-red-400">
            <p className="text-sm mb-2">{error}</p>
            <button onClick={fetchRESTData} className={`p-2 rounded ${themeClasses.buttonSecondary}`}><ArrowPathIcon className="w-4 h-4" /></button>
        </div>
      );
  }

  return (
    <div className="space-y-2">
        <div className="flex justify-end mb-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} title={isConnected ? "Socket Connected" : "Disconnected"} />
        </div>

        {devices.map(device => {
            const hasSwitch = device.onoff !== undefined;
            const hasMeasures = Object.keys(device.measure || {}).length > 0;
            const hasAlarms = Object.keys(device.alarm || {}).length > 0;

            return (
                <div key={device.id} className={`flex items-center justify-between p-2 rounded-lg ${themeClasses.inputBg} border border-slate-700/50`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-full ${device.onoff ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
                            {device.class === 'sensor' ? <CpuChipIcon className="w-5 h-5" /> : <LightBulbIcon className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                            <div className={`font-semibold text-sm truncate ${themeClasses.modalText}`}>{device.name}</div>
                            <div className="text-xs text-slate-400 flex gap-2 flex-wrap">
                                {!device.available && <span className="text-red-400">Offline</span>}
                                {hasMeasures && Object.entries(device.measure || {}).map(([key, val]) => (
                                    <span key={key}>{typeof val === 'number' ? Math.round(val * 10) / 10 : val} {key === 'temperature' ? '°C' : key === 'power' ? 'W' : ''}</span>
                                ))}
                                {hasAlarms && Object.entries(device.alarm || {}).map(([key, val]) => val && (
                                    <span key={key} className="text-red-400 font-bold uppercase">{key}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {hasSwitch && (
                        <button
                            onClick={() => handleToggle(device.id, !!device.onoff)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                device.onoff ? 'bg-green-500' : 'bg-slate-600'
                            }`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${device.onoff ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    )}
                </div>
            );
        })}
    </div>
  );
};

export default Homey;
