import React, { useState, useEffect, useMemo } from 'react';
import type { Theme } from '../types';
import { ArrowPathIcon, MagnifyingGlassIcon } from './Icons';

interface HomeyItemSelectorProps {
    themeClasses: Theme;
    globalIp?: string;
    globalToken?: string;
    itemType: 'capability' | 'flow';
    onSelect: (data: { deviceId: string; capabilityId: string } | { flowId: string }) => void;
}

const HomeyItemSelector: React.FC<HomeyItemSelectorProps> = ({ themeClasses, globalIp, globalToken, itemType, onSelect }) => {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        if (!globalIp || !globalToken) {
            setError("Homey IP and Token must be configured in global Settings first.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        const cleanToken = globalToken.replace(/^Bearer\s+/i, '').trim();
        const formattedIp = globalIp.trim().startsWith('http') ? globalIp.trim() : `http://${globalIp.trim()}`;
        const headers = { 'Authorization': `Bearer ${cleanToken}` };

        try {
            if (itemType === 'capability') {
                const [devicesRes, zonesRes] = await Promise.all([
                    fetch(`${formattedIp}/api/manager/devices/device`, { headers }),
                    fetch(`${formattedIp}/api/manager/zones/zone`, { headers })
                ]);
                if (!devicesRes.ok || !zonesRes.ok) throw new Error('Failed to fetch devices or zones.');
                
                const [devicesData, zonesData] = await Promise.all([devicesRes.json(), zonesRes.json()]);
                
                const capabilitiesList = Object.values(devicesData).flatMap((device: any) => 
                    Object.entries(device.capabilitiesObj).map(([capId, capDetails]: [string, any]) => ({
                        id: `${device.id}-${capId}`,
                        name: `${device.name} - ${capId === 'onoff' ? 'Toggle' : capDetails.title}`,
                        zone: zonesData[device.zone]?.name || 'Unknown Zone',
                        deviceId: device.id,
                        capabilityId: capId
                    }))
                );
                setItems(capabilitiesList);

            } else { // 'flow'
                const flowsRes = await fetch(`${formattedIp}/api/manager/flow/flow`, { headers });
                if (!flowsRes.ok) throw new Error('Failed to fetch flows.');
                const flowsData = await flowsRes.json();

                const flowsList = Object.values(flowsData)
                    .filter((flow: any) => flow.triggerable)
                    .map((flow: any) => ({
                        id: flow.id,
                        name: flow.name,
                        flowId: flow.id
                    }));
                setItems(flowsList);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [globalIp, globalToken, itemType]);

    const filteredItems = useMemo(() => {
        return items.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.zone && item.zone.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [items, searchTerm]);

    const handleSelect = (item: any) => {
        if (itemType === 'capability') {
            onSelect({ deviceId: item.deviceId, capabilityId: item.capabilityId });
        } else {
            onSelect({ flowId: item.flowId });
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className={`h-4 w-4 ${themeClasses.iconMuted}`} aria-hidden="true" />
                </div>
                <input
                    type="search"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full p-2 pl-9 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
            </div>
            
            {error && <div className="text-red-400 text-sm">{error}</div>}

            <div className={`h-80 overflow-y-auto border rounded-md ${themeClasses.inputBg} ${themeClasses.dashedBorder} p-1`}>
                {isLoading ? (
                    <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                ) : (
                    <ul className="space-y-1">
                        {filteredItems.map(item => (
                            <li key={item.id}>
                                <button
                                    onClick={() => handleSelect(item)}
                                    className={`w-full text-left p-2 rounded transition-colors ${themeClasses.linkHoverBg}`}
                                >
                                    <div className="font-medium text-sm">{item.name}</div>
                                    {item.zone && <div className="text-xs text-indigo-400">{item.zone}</div>}
                                </button>
                            </li>
                        ))}
                        {filteredItems.length === 0 && <div className="p-4 text-center text-sm text-slate-500">No items found.</div>}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default HomeyItemSelector;
