import React, { useState, useEffect, useMemo } from 'react';
import type { Group, Theme } from '../types';
import { ArrowPathIcon } from './Icons';
import ColorSelector from './ColorSelector';

interface HomeySettingsFormProps {
  group: Group;
  themeClasses: Theme;
  globalIp?: string;
  globalToken?: string;
}

interface HomeyDevice {
  id: string;
  name: string;
  zone: string; // zone ID
  capabilities: string[];
  capabilitiesObj: Record<string, { title: string }>;
}

interface HomeyZone {
    id: string;
    name: string;
}

interface HomeyFlow {
    id: string;
    name: string;
    triggerable: boolean; // Is it startable?
}

type SelectedCapability = { deviceId: string; capabilityId: string; };
type SelectedFlow = { flowId: string; };
type FilterType = 'all' | 'toggle' | 'sensor' | 'flow';
type TabType = 'items' | 'display';

const HomeySettingsForm: React.FC<HomeySettingsFormProps> = ({ group, themeClasses, globalIp, globalToken }) => {
  // State for "Items" tab
  const [selectedCapabilities, setSelectedCapabilities] = useState<SelectedCapability[]>(group.widgetSettings?.homeySettings?.selectedCapabilities || []);
  const [selectedFlows, setSelectedFlows] = useState<SelectedFlow[]>(group.widgetSettings?.homeySettings?.selectedFlows || []);
  
  // State for fetching data
  const [availableDevices, setAvailableDevices] = useState<Record<string, HomeyDevice>>({});
  const [availableZones, setAvailableZones] = useState<Record<string, HomeyZone>>({});
  const [availableFlows, setAvailableFlows] = useState<Record<string, HomeyFlow>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  
  // State for "Display" tab
  const [enableScroll, setEnableScroll] = useState(group.widgetSettings?.homeySettings?.enableScroll ?? true);
  const [showOneRow, setShowOneRow] = useState(group.widgetSettings?.homeySettings?.showOneRow ?? false);
  
  const [activeTab, setActiveTab] = useState<TabType>('items');

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
      
      const [devicesRes, zonesRes, flowsRes] = await Promise.all([
          fetch(`${formattedIp}/api/manager/devices/device`, { headers }),
          fetch(`${formattedIp}/api/manager/zones/zone`, { headers }),
          fetch(`${formattedIp}/api/manager/flow/flow`, { headers })
      ]);
      
      if (!devicesRes.ok || !zonesRes.ok || !flowsRes.ok) {
          if ([devicesRes.status, zonesRes.status, flowsRes.status].includes(0)) throw new Error('Connection Refused. Ensure you are on HTTP.');
          throw new Error('Failed to fetch data. Check global settings.');
      }
      
      const [devicesData, zonesData, flowsData] = await Promise.all([devicesRes.json(), zonesRes.json(), flowsRes.json()]);

      setAvailableDevices(devicesData);
      setAvailableZones(zonesData);

      const triggerableFlows: Record<string, HomeyFlow> = {};
      for (const flowId in flowsData) {
          if (flowsData[flowId].triggerable) {
              triggerableFlows[flowId] = flowsData[flowId];
          }
      }
      setAvailableFlows(triggerableFlows);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error. Mixed Content issue?");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [globalIp, globalToken]);


  const isCapabilitySelected = (deviceId: string, capabilityId: string) => {
    return selectedCapabilities.some(sc => sc.deviceId === deviceId && sc.capabilityId === capabilityId);
  };

  const toggleCapability = (deviceId: string, capabilityId: string) => {
    if (isCapabilitySelected(deviceId, capabilityId)) {
        setSelectedCapabilities(prev => prev.filter(sc => !(sc.deviceId === deviceId && sc.capabilityId === capabilityId)));
    } else {
        setSelectedCapabilities(prev => [...prev, { deviceId, capabilityId }]);
    }
  };

  const isFlowSelected = (flowId: string) => {
    return selectedFlows.some(sf => sf.flowId === flowId);
  };

  const toggleFlow = (flowId: string) => {
    if (isFlowSelected(flowId)) {
        setSelectedFlows(prev => prev.filter(sf => sf.flowId !== flowId));
    } else {
        setSelectedFlows(prev => [...prev, { flowId }]);
    }
  };
  
  // FIX: Add explicit types to sort callback parameters to resolve type inference errors.
  const sortedZones = useMemo(() => Object.values(availableZones).sort((a: HomeyZone, b: HomeyZone) => a.name.localeCompare(b.name)), [availableZones]);
  const sortedFlows = useMemo(() => Object.values(availableFlows).sort((a: HomeyFlow, b: HomeyFlow) => a.name.localeCompare(b.name)), [availableFlows]);

  const TabButton: React.FC<{ name: string, type: TabType }> = ({ name, type }) => (
    <button
        type="button"
        onClick={() => setActiveTab(type)}
        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === type ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
    >
        {name}
    </button>
  );

  const FilterButton: React.FC<{ name: string, type: FilterType }> = ({ name, type }) => (
      <button
          type="button"
          onClick={() => setFilter(type)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === type ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
      >
          {name}
      </button>
  );

  return (
    <div className="space-y-4">
      {/* Hidden inputs to pass ALL data back to the form handler */}
      <input type="hidden" name="selectedCapabilitiesJSON" value={JSON.stringify(selectedCapabilities)} />
      <input type="hidden" name="selectedFlowsJSON" value={JSON.stringify(selectedFlows)} />
      {/* Conditionally render hidden inputs for checkboxes to work with formData.has() */}
      {enableScroll && <input type="hidden" name="enableScroll" value="on" />}
      {showOneRow && <input type="hidden" name="showOneRow" value="on" />}


      <div className="flex bg-slate-700 p-1 rounded-lg gap-1">
        <TabButton name="Items" type="items" />
        <TabButton name="Display" type="display" />
      </div>

      {activeTab === 'items' && (
        <div className="space-y-4">
            {!globalIp || !globalToken ? (
                 <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-sm text-yellow-200 text-center">
                    Please configure your Homey's IP Address and API Token in the main <strong>Settings → Homey</strong> tab first.
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center">
                        <h3 className={`font-bold ${themeClasses.modalText}`}>Select Items to Display</h3>
                        <button 
                            type="button" 
                            onClick={fetchData} 
                            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${themeClasses.iconMuted}`}
                            title="Refresh List"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="flex bg-slate-700 p-1 rounded-lg gap-1">
                        <FilterButton name="All" type="all" />
                        <FilterButton name="Toggles" type="toggle" />
                        <FilterButton name="Sensors" type="sensor" />
                        <FilterButton name="Flows" type="flow" />
                    </div>
                    
                    {error && <div className="text-red-400 text-sm">{error}</div>}

                    <div className={`max-h-80 overflow-y-auto border rounded-md ${themeClasses.inputBg} ${themeClasses.dashedBorder} space-y-2 p-2`}>
                        {isLoading ? (
                            <div className="p-4 text-center text-sm text-slate-500">Loading devices &amp; flows...</div>
                        ) : (
                            <>
                                {/* Devices Section */}
                                {(filter === 'all' || filter === 'toggle' || filter === 'sensor') && sortedZones.map(zone => {
                                    // FIX: Add explicit type to filter callback parameter to resolve type inference errors.
                                    const devicesInZone = Object.values(availableDevices).filter((device: HomeyDevice) => {
                                        if (device.zone !== zone.id) return false;
                                        
                                        const hasToggle = device.capabilities.includes('onoff');
                                        const hasSensor = device.capabilities.some(c => c !== 'onoff');

                                        if (filter === 'toggle') return hasToggle;
                                        if (filter === 'sensor') return hasSensor;
                                        return true; // 'all'
                                    });

                                    if (devicesInZone.length === 0) return null;
                                    
                                    return (
                                        <div key={zone.id}>
                                            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400 mb-2 mt-3 px-1">{zone.name}</h4>
                                            {/* FIX: Add explicit type for 'device' to resolve type inference errors. */}
                                            {devicesInZone.map((device: HomeyDevice) => (
                                                <div key={device.id} className="p-2 rounded-md bg-black/20 mb-2">
                                                    <div className="font-medium text-sm mb-2">{device.name}</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {/* FIX: Add explicit type for 'capDetails' to resolve type inference errors. */}
                                                        {Object.entries(device.capabilitiesObj).map(([capId, capDetails]: [string, { title: string }]) => (
                                                            <label key={capId} className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 rounded p-1 text-xs">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={isCapabilitySelected(device.id, capId)}
                                                                    onChange={() => toggleCapability(device.id, capId)}
                                                                    className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                                <span>{capId === 'onoff' ? 'Toggle' : capDetails.title}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}

                                {/* Flows Section */}
                                {(filter === 'all' || filter === 'flow') && sortedFlows.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-xs uppercase tracking-wider text-fuchsia-400 mb-2 mt-4 px-1">Flows</h4>
                                        <div className="p-2 rounded-md bg-black/20 mb-2 space-y-3">
                                        <div className="space-y-1">
                                                {sortedFlows.map(flow => (
                                                    <label key={flow.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 rounded p-1 text-sm">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isFlowSelected(flow.id)}
                                                            onChange={() => toggleFlow(flow.id)}
                                                            className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="truncate">{flow.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isLoading && Object.keys(availableDevices).length === 0 && Object.keys(availableFlows).length === 0 && (
                                    <div className="p-4 text-center text-sm text-slate-500">No devices or flows found.</div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
      )}

      {activeTab === 'display' && (
        <div className="space-y-4">
            <div className="mb-4">
                <label htmlFor="name" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Name <span className="text-xs font-normal opacity-70">(max 30 chars)</span></label>
                <input type="text" id="name" name="name" defaultValue={group.name} required maxLength={30} className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`} />
            </div>
            
            <ColorSelector currentColor={group.colorVariant || 'default'} themeClasses={themeClasses} />

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-700">
                <label htmlFor="enableScroll" className="text-sm font-medium">Enable Vertical Scroll</label>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="enableScroll" 
                        name="enableScroll" // Name is still needed here for form submission when this tab is active
                        checked={enableScroll} 
                        onChange={(e) => setEnableScroll(e.target.checked)}
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>
            <p className="text-xs text-slate-500 -mt-2">If disabled, the widget will grow to fit all its content.</p>

            <div className="pt-4 mt-4 border-t border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                    <label htmlFor="showOneRow" className="text-sm font-medium">Show One Row</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            id="showOneRow" 
                            name="showOneRow" // Name is still needed here
                            checked={showOneRow}
                            onChange={(e) => setShowOneRow(e.target.checked)}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
                <p className="text-xs text-slate-500">Condenses each item to a single line. Toggles show the device name; sensors show the capability name.</p>
            </div>

        </div>
      )}
    </div>
  );
};

export default HomeySettingsForm;