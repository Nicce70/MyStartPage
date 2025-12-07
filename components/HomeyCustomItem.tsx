import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';
import type { AnyItemType, DraggedItem, HomeyCustomItemType, ModalState, Settings } from '../types';
import { DragHandleIcon, PencilIcon, TrashIcon, PlayIcon } from './Icons';

interface HomeyCustomItemProps {
    item: HomeyCustomItemType;
    liveData?: { value: any, units?: string };
    themeClasses: typeof themes.default;
    isEditMode: boolean;
    groupId: string;
    columnId: string;
    draggedItem: DraggedItem;
    onDragStart: (item: DraggedItem) => void;
    onDrop: (target: { columnId: string; groupId?: string; itemId?: string }) => void;
    openModal: (type: ModalState['type'], data?: any) => void;
    homeyGlobalSettings?: Settings['homey'];
    showOneRow?: boolean;
    onOptimisticUpdate: (deviceId: string, capabilityId: string, value: any) => void;
}

const HomeyCustomItem: React.FC<HomeyCustomItemProps> = ({
    item, liveData, themeClasses, isEditMode, groupId, columnId,
    draggedItem, onDragStart, onDrop, openModal, homeyGlobalSettings, showOneRow, onOptimisticUpdate
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isTriggered, setIsTriggered] = useState(false);
    
    // This state is needed to display names until live data loads
    const [staticData, setStaticData] = useState<{name: string, capabilityTitle?: string, zone?: string}>({name: '...'});

    const isDraggingThis = draggedItem?.type === 'groupItem' && draggedItem.item.id === item.id;

    useEffect(() => {
        // Fetch static data once for display names if needed
        if (item.type === 'homey_capability' || item.type === 'homey_flow') {
            const { localIp, apiToken } = homeyGlobalSettings || {};
            if (!localIp || !apiToken) return;
            
            const url = localIp.trim().startsWith('http') ? localIp.trim() : `http://${localIp.trim()}`;
            const headers = { 'Authorization': `Bearer ${apiToken.replace(/^Bearer\s+/i, '').trim()}` };
            
            if (item.type === 'homey_capability') {
                Promise.all([
                    fetch(`${url}/api/manager/devices/device/${item.deviceId}`, { headers }),
                    fetch(`${url}/api/manager/zones/zone`, { headers })
                ]).then(async ([deviceRes, zonesRes]) => {
                    const deviceData = await deviceRes.json();
                    const zonesData = await zonesRes.json();
                    const cap = deviceData.capabilitiesObj[item.capabilityId];
                    setStaticData({
                        name: deviceData.name,
                        capabilityTitle: item.capabilityId === 'onoff' ? 'Toggle' : cap?.title || 'N/A',
                        zone: zonesData[deviceData.zone]?.name
                    });
                }).catch(e => console.error("Failed to fetch static item data", e));
            } else if (item.type === 'homey_flow') {
                fetch(`${url}/api/manager/flow/flow/${item.flowId}`, { headers })
                    .then(res => res.json())
                    .then(data => setStaticData({ name: data.name }))
                    .catch(e => console.error("Failed to fetch static flow data", e));
            }
        }
    }, [item.id, homeyGlobalSettings]);


    const handleToggle = async (deviceId: string, capabilityId: string, currentState: boolean) => {
        const { localIp, apiToken } = homeyGlobalSettings || {};
        if (!localIp || !apiToken) return;
        
        // Optimistically update the UI state immediately.
        onOptimisticUpdate(deviceId, capabilityId, !currentState);

        try {
            const url = `${localIp.trim().startsWith('http') ? localIp.trim() : `http://${localIp.trim()}`}/api/manager/devices/device/${deviceId}/capability/${capabilityId}`;
            const headers = { 'Authorization': `Bearer ${apiToken.replace(/^Bearer\s+/i, '').trim()}`, 'Content-Type': 'application/json' };
            const body = JSON.stringify({ value: !currentState });
            await fetch(url, { method: 'PUT', headers, body });
        } catch (e) {
            console.error("Homey command failed", e);
        }
    };
    
    const handleTriggerFlow = async (flowId: string) => {
        const { localIp, apiToken } = homeyGlobalSettings || {};
        if (!localIp || !apiToken) return;

        setIsTriggered(true);
        setTimeout(() => setIsTriggered(false), 500);

        try {
            const url = `${localIp.trim().startsWith('http') ? localIp.trim() : `http://${localIp.trim()}`}/api/manager/flow/flow/${flowId}/trigger`;
            const headers = { 'Authorization': `Bearer ${apiToken.replace(/^Bearer\s+/i, '').trim()}`, 'Content-Type': 'application/json' };
            await fetch(url, { method: 'POST', headers, body: '{}' });
        } catch (err) {
            console.error("Homey flow trigger failed:", err);
        }
    };
    
    const renderContent = () => {
        switch (item.type) {
            case 'text':
                return <h4 className={`font-bold text-xs uppercase tracking-wider ${themeClasses.header}`}>{item.content}</h4>;
            case 'separator':
                return <hr className={themeClasses.dashedBorder} />;
            case 'homey_capability':
                const value = liveData?.value;
                return (
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                           {showOneRow ? (
                               <div className="break-all text-base font-semibold">
                                   {item.capabilityId === 'onoff' ? staticData.name : (staticData.capabilityTitle || '...')}
                               </div>
                           ) : (
                               <>
                                   <div className="break-all text-sm text-slate-400">{staticData.name}</div>
                                   <div className={`break-all font-semibold text-base ${themeClasses.modalText}`}>{staticData.capabilityTitle}</div>
                               </>
                           )}
                        </div>
                        <div className="flex-shrink-0 ml-2">
                            {item.capabilityId === 'onoff' ? (
                                <button
                                    onClick={() => handleToggle(item.deviceId, item.capabilityId, !!value)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-slate-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            ) : (
                                <span className="font-bold font-mono text-lg">{value !== null && value !== undefined ? `${Math.round(value * 10) / 10}${liveData?.units || ''}` : '-'}</span>
                            )}
                        </div>
                    </div>
                );
            case 'homey_flow':
                 return (
                    <button
                        onClick={() => handleTriggerFlow(item.flowId)}
                        title={staticData.name}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg font-semibold text-sm transition-all duration-200 ${isTriggered ? 'bg-green-500 text-white scale-95 shadow-inner' : `${themeClasses.buttonSecondary} hover:brightness-110`}`}
                    >
                        <PlayIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{staticData.name}</span>
                    </button>
                );
            default:
                return null;
        }
    };

    if (!isEditMode) {
        if (item.type === 'separator') return <div className="py-3"><hr className={`${themeClasses.dashedBorder}`} /></div>;
        return <div className={`p-2 rounded-lg ${item.type === 'text' ? '' : `${themeClasses.inputBg}`}`}>{renderContent()}</div>;
    }

    return (
        <div
            draggable
            onDragStart={(e) => { e.stopPropagation(); onDragStart({ type: 'groupItem', item: item as AnyItemType, sourceGroupId: groupId, sourceColumnId: columnId }); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop({ columnId, groupId, itemId: item.id }); setIsDragOver(false); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            className={`flex items-center gap-2 p-1 rounded-md transition-all ${isDraggingThis ? 'opacity-30' : ''} ${isDragOver ? `ring-1 ${themeClasses.ring}` : ''}`}
        >
            <DragHandleIcon className="w-5 h-5 text-slate-500 flex-shrink-0 cursor-grab" />
            <div className={`flex-grow p-2 rounded ${themeClasses.inputBg} min-w-0`}>
                {renderContent()}
            </div>
            <div className="flex items-center gap-1">
                {item.type === 'text' && (
                    <button onClick={() => openModal('addOrEditTextItem', { item, groupId, columnId })} className={`p-1.5 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-600`}>
                        <PencilIcon className="w-4 h-4" />
                    </button>
                )}
                <button onClick={() => openModal('deleteItem', { item, groupId, columnId })} className={`p-1.5 ${themeClasses.iconMuted} hover:text-red-400 rounded-full hover:bg-slate-600`}>
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default HomeyCustomItem;