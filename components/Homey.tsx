import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { themes } from '../themes';
import { LightBulbIcon, CpuChipIcon, ArrowPathIcon, PlayIcon } from './Icons';
// @ts-ignore
import { io } from "socket.io-client";

interface HomeyProps {
  localIp: string;
  apiToken: string;
  pollingInterval: number; // in seconds
  selectedCapabilities?: { deviceId: string; capabilityId: string; }[];
  selectedFlows?: { flowId: string; }[];
  themeClasses: typeof themes.default;
  enableScroll?: boolean;
  showOneRow?: boolean;
}

interface HomeyDevice {
  id: string;
  name: string;
  zone: string;
  capabilitiesObj: Record<string, { value: any; title: string; units?: string }>;
}

interface HomeyZone {
    id: string;
    name: string;
}

interface HomeyFlow {
    id: string;
    name: string;
}

const Homey: React.FC<HomeyProps> = ({ 
    localIp, apiToken, pollingInterval = 10, 
    selectedCapabilities = [], selectedFlows = [], themeClasses, 
    enableScroll = true, showOneRow = false
}) => {
  const [devices, setDevices] = useState<Record<string, HomeyDevice>>({});
  const [zones, setZones] = useState<Record<string, HomeyZone>>({});
  const [flows, setFlows] = useState<Record<string, HomeyFlow>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeredFlowId, setTriggeredFlowId] = useState<string | null>(null);
  
  const socketRef = useRef<any>(null);

  const sanitizeToken = (input: string) => input.replace(/^Bearer\s+/i, '').trim();
  const formatUrl = (ip: string) => ip.trim().startsWith('http') ? ip.trim() : `http://${ip.trim()}`;

  const fetchData = useCallback(async (isInitial = false) => {
    if (!localIp || !apiToken) return;
    if (isInitial) setIsLoading(true);

    try {
        const headers = { 'Authorization': `Bearer ${sanitizeToken(apiToken)}` };
        const [devicesRes, zonesRes, flowsRes] = await Promise.all([
            fetch(`${formatUrl(localIp)}/api/manager/devices/device`, { headers }),
            fetch(`${formatUrl(localIp)}/api/manager/zones/zone`, { headers }),
            fetch(`${formatUrl(localIp)}/api/manager/flow/flow`, { headers })
        ]);

        if (!devicesRes.ok || !zonesRes.ok || !flowsRes.ok) throw new Error("REST fetch failed. Check connection & credentials.");

        const [devicesData, zonesData, flowsData] = await Promise.all([devicesRes.json(), zonesRes.json(), flowsRes.json()]);

        setDevices(devicesData);
        setZones(zonesData);
        setFlows(flowsData);
        setError(null);
    } catch (err) {
        console.warn("Homey initial data fetch failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
        if (isInitial) setIsLoading(false);
    }
  }, [localIp, apiToken]);

  // Main Effect for data fetching and WebSocket
  useEffect(() => {
    if (!localIp || !apiToken) {
        setIsLoading(false);
        setError("Please configure Homey in global settings.");
        return;
    }

    fetchData(true);
    const intervalInMs = (pollingInterval || 10) * 1000;
    const pollInterval = setInterval(() => fetchData(false), intervalInMs);

    try {
      const socket = io(formatUrl(localIp), { transports: ["websocket"], reconnection: true, reconnectionDelay: 5000 });
      socket.on('connect', () => {
          socket.emit('authenticate', { token: sanitizeToken(apiToken) }, (err: any, success: boolean) => {
              if (err || !success) console.warn('Homey WebSocket auth failed. Relying on polling.');
          });
      });
      socket.on('capability', (payload: any) => { /* ... existing capability update logic ... */ });
      socket.on('connect_error', (err: any) => console.warn(`Homey WebSocket connection error: ${err.message}. Polling will continue.`));
      socketRef.current = socket;
    } catch(e) { console.warn("Could not init WebSocket. Relying on polling only."); }

    return () => {
        clearInterval(pollInterval);
        if (socketRef.current) socketRef.current.disconnect();
    };
  }, [localIp, apiToken, pollingInterval, fetchData]);
  
  const handleToggle = async (deviceId: string, currentState: boolean) => {
      try {
        const url = `${formatUrl(localIp)}/api/manager/devices/device/${deviceId}/capability/onoff`;
        const headers = { 'Authorization': `Bearer ${sanitizeToken(apiToken)}`, 'Content-Type': 'application/json' };
        const body = JSON.stringify({ value: !currentState });
        const res = await fetch(url, { method: 'PUT', headers, body });
        if (!res.ok) throw new Error(`API returned status ${res.status}`);
        fetchData(false);
      } catch (err) {
        console.error("Homey toggle command failed:", err);
        setError("Command failed.");
        setTimeout(() => setError(null), 3000);
        fetchData(false);
      }
  };

  const handleTriggerFlow = async (flowId: string) => {
    setTriggeredFlowId(flowId);
    setTimeout(() => setTriggeredFlowId(null), 500); // Visual feedback
    try {
        const url = `${formatUrl(localIp)}/api/manager/flow/flow/${flowId}/trigger`;
        const headers = { 'Authorization': `Bearer ${sanitizeToken(apiToken)}`, 'Content-Type': 'application/json' };
        const res = await fetch(url, { method: 'POST', headers, body: '{}' });
        if (!res.ok) throw new Error(`API returned status ${res.status}`);
    } catch (err) {
        console.error("Homey flow trigger failed:", err);
        setError("Flow trigger failed.");
        setTimeout(() => setError(null), 3000);
    }
  };

  const groupedCapabilities = useMemo(() => { /* ... existing memo logic ... */ 
    const groups: Record<string, any[]> = {};
    if (Object.keys(devices).length === 0 || Object.keys(zones).length === 0) return {};

    selectedCapabilities.forEach(({ deviceId, capabilityId }) => {
      const device = devices[deviceId];
      if (!device) return;
      
      const zone = zones[device.zone];
      const zoneName = zone ? zone.name : "Unknown Zone";
      const capability = device.capabilitiesObj[capabilityId];
      if (!capability) return;

      if (!groups[zoneName]) groups[zoneName] = [];
      
      groups[zoneName].push({
        deviceId: device.id,
        deviceName: device.name,
        capabilityId,
        ...capability
      });
    });
    for (const zoneName in groups) {
        groups[zoneName].sort((a, b) => a.deviceName.localeCompare(b.deviceName));
    }
    return groups;
  }, [selectedCapabilities, devices, zones]);

  const flowsToDisplay = useMemo(() => {
    if (!selectedFlows || Object.keys(flows).length === 0) return [];
    return selectedFlows
      .map(({ flowId }) => flows[flowId])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedFlows, flows]);

  if (isLoading) return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Connecting to Homey...</div>;
  if (error) return <div className="flex flex-col items-center justify-center py-4 text-red-400"><p className="text-sm mb-2 text-center">{error}</p><button onClick={() => fetchData(true)} className={`p-2 rounded ${themeClasses.buttonSecondary}`}><ArrowPathIcon className="w-4 h-4" /></button></div>;
  if (selectedCapabilities.length === 0 && selectedFlows.length === 0) return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>No items selected. Add them in settings.</div>;

  const formatValue = (value: any, units?: string) => { /* ... existing format logic ... */ 
      if (typeof value === 'number') {
        const rounded = Math.round(value * 10) / 10;
        return `${rounded}${units || ''}`;
      }
      if (typeof value === 'boolean') return value ? 'On' : 'Off';
      if (value === null || value === undefined) return '-';
      return String(value);
  };

  return (
    <div className={`space-y-4 pr-1 ${enableScroll ? 'max-h-96 overflow-y-auto' : ''}`}>
        {/* Render Devices */}
        {Object.keys(groupedCapabilities).sort().map(zoneName => (
            <div key={zoneName}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400 mb-2">{zoneName}</h4>
                <div className="space-y-2">
                    {groupedCapabilities[zoneName].map(cap => (
                        <div key={`${cap.deviceId}-${cap.capabilityId}`} className={`flex items-center justify-between p-2 rounded-lg ${themeClasses.inputBg} border border-slate-700/50`}>
                            <div className="flex-1 min-w-0">
                                {showOneRow ? (
                                    <div className="truncate text-base font-semibold">
                                        {cap.capabilityId === 'onoff' ? cap.deviceName : (cap.capabilityId === 'onoff' ? 'Toggle' : cap.title)}
                                    </div>
                                ) : (
                                    <>
                                        <div className="truncate text-xs text-slate-400">{cap.deviceName}</div>
                                        <div className={`truncate font-semibold text-sm ${themeClasses.modalText}`}>{cap.capabilityId === 'onoff' ? 'Toggle' : cap.title}</div>
                                    </>
                                )}
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                {cap.capabilityId === 'onoff' ? (
                                    <button
                                        onClick={() => handleToggle(cap.deviceId, !!cap.value)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                            cap.value ? 'bg-green-500' : 'bg-slate-600'
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cap.value ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                ) : (
                                    <span className="font-bold font-mono text-base">{formatValue(cap.value, cap.units)}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}

        {/* Render Flows */}
        {flowsToDisplay.length > 0 && (
             <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-fuchsia-400 mb-2">Flows</h4>
                <div className="grid grid-cols-2 gap-2">
                    {flowsToDisplay.map(flow => {
                         const isTriggered = triggeredFlowId === flow.id;
                         return (
                            <button
                                key={flow.id}
                                onClick={() => handleTriggerFlow(flow.id)}
                                title={flow.name}
                                className={`flex items-center gap-2 p-2 rounded-lg font-semibold text-sm transition-all duration-200 ${isTriggered ? 'bg-green-500 text-white scale-95 shadow-inner' : `${themeClasses.buttonSecondary} hover:brightness-110`}`}
                            >
                                <PlayIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{flow.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
    </div>
  );
};

export default Homey;