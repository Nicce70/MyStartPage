import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { themes } from '../themes';
import type { Group, Settings, AnyItemType, ModalState, DraggedItem, HomeyCustomItemType } from '../types';
import { PlusIcon } from './Icons';
import HomeyCustomItem from './HomeyCustomItem';
// @ts-ignore
import { io } from "socket.io-client";

interface HomeyCustomWidgetProps {
    group: Group;
    columnId: string;
    themeClasses: typeof themes.default;
    homeyGlobalSettings?: Settings['homey'];
    isEditMode: boolean;
    openModal: (type: ModalState['type'], data?: any) => void;
    onDragStart: (item: DraggedItem) => void;
    onDrop: (target: { columnId: string; groupId?: string; itemId?: string }) => void;
    draggedItem: DraggedItem;
    touchDragItem: DraggedItem;
    handleTouchStart: (e: React.TouchEvent, item: DraggedItem) => void;
    touchDragOverTarget: { columnId: string; groupId?: string; itemId?: string } | null;
}

interface LiveData {
    [key: string]: { // key is `deviceId-capabilityId`
        value: any;
        units?: string;
    };
}

const HomeyCustomWidget: React.FC<HomeyCustomWidgetProps> = ({
    group,
    columnId,
    themeClasses,
    homeyGlobalSettings,
    isEditMode,
    openModal,
    onDragStart,
    onDrop,
    draggedItem,
    touchDragItem,
    handleTouchStart,
    touchDragOverTarget
}) => {
    const [liveData, setLiveData] = useState<LiveData>({});
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<any>(null);

    const { localIp, apiToken, pollingInterval } = homeyGlobalSettings || {};

    const capabilityItems = useMemo(() =>
        (group.items as HomeyCustomItemType[]).filter(item => item.type === 'homey_capability')
    , [group.items]);

    const fetchData = useCallback(async () => {
        if (!localIp || !apiToken || capabilityItems.length === 0) return;

        const headers = { 'Authorization': `Bearer ${apiToken.replace(/^Bearer\s+/i, '').trim()}` };
        const url = localIp.trim().startsWith('http') ? localIp.trim() : `http://${localIp.trim()}`;

        try {
            const res = await fetch(`${url}/api/manager/devices/device`, { headers });
            if (!res.ok) throw new Error("Failed to fetch device data");
            const devicesData = await res.json();
            
            const newLiveData: LiveData = {};
            capabilityItems.forEach(item => {
                if (item.type === 'homey_capability') {
                    const device = devicesData[item.deviceId];
                    if (device && device.capabilitiesObj[item.capabilityId]) {
                        const cap = device.capabilitiesObj[item.capabilityId];
                        newLiveData[`${item.deviceId}-${item.capabilityId}`] = { value: cap.value, units: cap.units };
                    }
                }
            });
            setLiveData(newLiveData);
            setError(null);
        } catch (err) {
            console.error("Homey Custom fetch error:", err);
            setError("Connection error");
        }
    }, [localIp, apiToken, capabilityItems]);

    useEffect(() => {
        if (!localIp || !apiToken) {
            setError("Configure Homey in global settings.");
            return;
        }

        fetchData();
        const poll = setInterval(fetchData, (pollingInterval || 10) * 1000);

        try {
            const socket = io(localIp.trim().startsWith('http') ? localIp.trim() : `http://${localIp.trim()}`, { transports: ["websocket"], reconnection: true, reconnectionDelay: 5000 });
            socket.on('connect', () => {
                socket.emit('authenticate', { token: apiToken.replace(/^Bearer\s+/i, '').trim() }, (err: any, success: boolean) => {
                    if (err || !success) console.warn('Homey Custom WebSocket auth failed.');
                });
            });
            socket.on('capability', (payload: any) => {
                const { deviceId, capabilityId, value } = payload;
                setLiveData(prev => ({
                    ...prev,
                    [`${deviceId}-${capabilityId}`]: { ...prev[`${deviceId}-${capabilityId}`], value }
                }));
            });
            socketRef.current = socket;
        } catch(e) { console.warn("Could not init Homey Custom WebSocket."); }

        return () => {
            clearInterval(poll);
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [localIp, apiToken, pollingInterval, fetchData]);

    const handleOptimisticUpdate = (deviceId: string, capabilityId: string, value: any) => {
        const key = `${deviceId}-${capabilityId}`;
        setLiveData(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || {}), // Keep units, handle case where key doesn't exist yet
                value: value
            }
        }));
    };

    const showOneRow = group.widgetSettings?.homeyCustomSettings?.showOneRow ?? false;

    return (
        <div className="space-y-2">
            {(group.items as HomeyCustomItemType[]).map((item, index) => (
                <HomeyCustomItem
                    key={item.id}
                    item={item}
                    isFirstItem={index === 0}
                    liveData={liveData[`${(item as any).deviceId}-${(item as any).capabilityId}`]}
                    themeClasses={themeClasses}
                    isEditMode={isEditMode}
                    groupId={group.id}
                    columnId={columnId}
                    draggedItem={draggedItem}
                    touchDragItem={touchDragItem}
                    onDragStart={onDragStart}
                    onDrop={onDrop}
                    handleTouchStart={handleTouchStart}
                    touchDragOverTarget={touchDragOverTarget}
                    openModal={openModal}
                    homeyGlobalSettings={homeyGlobalSettings}
                    showOneRow={showOneRow}
                    onOptimisticUpdate={handleOptimisticUpdate}
                />
            ))}

            {isEditMode && (
                <button
                    onClick={() => openModal('addHomeyCustomItem', { groupId: group.id, columnId })}
                    className={`w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg transition-colors ${themeClasses.dashedBorder} ${themeClasses.textSubtle} hover:border-slate-500 hover:text-slate-300 mt-2`}
                >
                    <PlusIcon className="w-5 h-5" /> Add Item
                </button>
            )}

            {!isEditMode && group.items.length === 0 && (
                 <div className="text-center py-4 text-slate-500 text-sm">
                    This widget is empty. Click 'Edit' to add items.
                </div>
            )}
        </div>
    );
};

export default HomeyCustomWidget;