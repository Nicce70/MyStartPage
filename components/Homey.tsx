
import React, { useState, useEffect, useRef } from 'react';
import type { themes } from '../themes';
import { LightBulbIcon, CpuChipIcon, ExclamationCircleIcon, ArrowPathIcon } from './Icons';

interface HomeyProps {
  apiToken: string;
  homeyId: string;
  deviceIds: string[];
  themeClasses: typeof themes.default;
}

interface DeviceStatus {
  id: string;
  name: string;
  class: string;
  capabilitiesObj?: Record<string, any>;
  onoff?: boolean;
  measure?: Record<string, number | string>;
  alarm?: Record<string, boolean>;
  available: boolean;
}

const Homey: React.FC<HomeyProps> = ({ apiToken, homeyId, deviceIds, themeClasses }) => {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollInterval = useRef<number | null>(null);

  const sanitizeToken = (input: string) => {
      return input.replace(/^Bearer\s+/i, '').trim();
  };

  const fetchData = async () => {
    if (!apiToken || !homeyId || deviceIds.length === 0) {
        setIsLoading(false);
        return;
    }

    const cleanToken = sanitizeToken(apiToken);

    try {
        // We'll fetch specific devices. 
        // Ideally we'd fetch only selected ones, but the API typically gives all or one.
        // Fetching all is easier for a bulk update.
        const url = `https://${homeyId}.connect.athom.com/api/manager/devices/device`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${cleanToken}` }
        });

        if (!res.ok) {
            if (res.status === 401) throw new Error("Unauthorized. Check Token.");
            throw new Error("Failed to fetch status.");
        }

        const data = await res.json();
        
        // Filter and map data
        const updatedDevices: DeviceStatus[] = [];
        const allDevices = Object.values(data) as any[];

        for (const id of deviceIds) {
            const d = allDevices.find((dev: any) => dev.id === id);
            if (d) {
                // Extract capabilities
                const measures: Record<string, any> = {};
                const alarms: Record<string, boolean> = {};
                let onoff = undefined;

                for (const cap in d.capabilitiesObj) {
                    const val = d.capabilitiesObj[cap]?.value;
                    if (cap === 'onoff') onoff = val;
                    else if (cap.startsWith('measure_')) measures[cap.replace('measure_', '')] = val;
                    else if (cap.startsWith('alarm_')) alarms[cap.replace('alarm_', '')] = val;
                }

                updatedDevices.push({
                    id: d.id,
                    name: d.name,
                    class: d.class,
                    capabilitiesObj: d.capabilitiesObj,
                    onoff,
                    measure: measures,
                    alarm: alarms,
                    available: d.ready
                });
            }
        }
        setDevices(updatedDevices);
        setError(null);
    } catch (err) {
        // console.error(err); // Suppress console noise
        setError("Connection lost");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    pollInterval.current = window.setInterval(fetchData, 10000); // Poll every 10s

    return () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [apiToken, homeyId, deviceIds]); // Re-run if settings change

  const handleToggle = async (deviceId: string, currentState: boolean) => {
      const cleanToken = sanitizeToken(apiToken);
      
      // Optimistic update
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, onoff: !currentState } : d));

      try {
          const url = `https://${homeyId}.connect.athom.com/api/manager/devices/device/${deviceId}/capability/onoff`;
          await fetch(url, {
              method: 'PUT',
              headers: { 
                  'Authorization': `Bearer ${cleanToken}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ value: !currentState })
          });
          // No need to refetch immediately if optimistic worked, polling will catch up
      } catch (e) {
          console.error("Toggle failed", e);
          // Revert on fail
          setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, onoff: currentState } : d));
      }
  };

  if (!apiToken || !homeyId) {
      return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Configure Homey in settings.</div>;
  }

  if (isLoading && devices.length === 0) {
      return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Connecting to Homey...</div>;
  }

  if (error && devices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-4 text-red-400">
            <p className="text-sm mb-2">{error}</p>
            <button onClick={fetchData} className={`p-2 rounded ${themeClasses.buttonSecondary}`}><ArrowPathIcon className="w-4 h-4" /></button>
        </div>
      );
  }

  return (
    <div className="space-y-2">
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
                            {/* Status Line */}
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
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    device.onoff ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    )}
                </div>
            );
        })}
        {devices.length === 0 && !isLoading && (
            <div className={`text-sm text-center py-2 ${themeClasses.textSubtle}`}>No devices selected.</div>
        )}
    </div>
  );
};

export default Homey;
