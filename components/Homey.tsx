
import React, { useState, useMemo } from 'react';
import type { themes } from '../themes';
import { PlayIcon } from './Icons';

interface HomeyProps {
  themeClasses: typeof themes.default;
  enableScroll?: boolean;
  showOneRow?: boolean;
  selectedCapabilities: { deviceId: string; capabilityId: string; }[];
  selectedFlows: { flowId: string; }[];
  devices: any; // From central state
  zones: any;   // From central state
  flows: any;   // From central state
  onToggle: (deviceId: string, capabilityId: string, currentState: boolean) => void;
  onTriggerFlow: (flowId: string) => void;
  onOptimisticUpdate: (deviceId: string, capabilityId: string, value: any) => void;
  isEditMode: boolean;
}

const Homey: React.FC<HomeyProps> = ({ 
    themeClasses, 
    enableScroll = true, 
    showOneRow = false,
    selectedCapabilities = [],
    selectedFlows = [],
    devices,
    zones,
    flows,
    onToggle,
    onTriggerFlow,
    onOptimisticUpdate,
    isEditMode
}) => {
  const [triggeredFlowId, setTriggeredFlowId] = useState<string | null>(null);
  
  const handleToggle = (deviceId: string, capabilityId: string, currentState: boolean) => {
    if (isEditMode) return;
    onOptimisticUpdate(deviceId, capabilityId, !currentState);
    onToggle(deviceId, capabilityId, currentState);
  };

  const handleTriggerFlow = (flowId: string) => {
    if (isEditMode) return;
    setTriggeredFlowId(flowId);
    setTimeout(() => setTriggeredFlowId(null), 500);
    onTriggerFlow(flowId);
  };

  const groupedCapabilities = useMemo(() => {
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

  if (Object.keys(devices).length === 0) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Waiting for data from Homey...</div>;
  }
  if (selectedCapabilities.length === 0 && selectedFlows.length === 0) return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>No items selected. Add them in settings.</div>;

  const formatValue = (value: any, units?: string): React.ReactNode => {
      if (value === null || value === undefined) return '-';

      if (typeof value === 'boolean' || (typeof value === 'number' && (value === 0 || value === 1) && !units)) {
          const isYes = !!value;
          return (
              <span className="flex items-center justify-end">
                  <span className={`inline-block w-2.5 h-2.5 mr-2 rounded-full ${isYes ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {isYes ? 'Yes' : 'No'}
              </span>
          );
      }

      if (typeof value === 'number') {
          const rounded = Math.round(value * 10) / 10;
          return `${rounded}${units || ''}`;
      }

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
                                    <div className="break-all text-base font-semibold">
                                        {cap.capabilityId === 'onoff' ? cap.deviceName : (cap.capabilityId === 'onoff' ? 'Toggle' : cap.title)}
                                    </div>
                                ) : (
                                    <>
                                        <div className="break-all text-xs text-slate-400">{cap.deviceName}</div>
                                        <div className={`break-all font-semibold text-sm ${themeClasses.modalText}`}>{cap.capabilityId === 'onoff' ? 'Toggle' : cap.title}</div>
                                    </>
                                )}
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                {cap.capabilityId === 'onoff' ? (
                                    <button
                                        onClick={() => handleToggle(cap.deviceId, cap.capabilityId, !!cap.value)}
                                        disabled={isEditMode}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                            cap.value ? 'bg-green-500' : 'bg-slate-600'
                                        } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                disabled={isEditMode}
                                title={flow.name}
                                className={`flex items-center gap-2 p-2 rounded-lg font-semibold text-sm transition-all duration-200 ${isTriggered ? 'bg-green-500 text-white scale-95 shadow-inner' : `${themeClasses.buttonSecondary} hover:brightness-110`} ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
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
