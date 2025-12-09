import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';
import type { AnyItemType, DraggedItem, HomeyCustomItemType, ModalState, Settings, ButtonHolderItem, FlowButton } from '../types';
import { DragHandleIcon, PencilIcon, TrashIcon, PlayIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface HomeyCustomItemProps {
    item: HomeyCustomItemType;
    liveData?: { value: any, units?: string };
    themeClasses: typeof themes.default;
    isEditMode: boolean;
    groupId: string;
    columnId: string;
    draggedItem: DraggedItem;
    touchDragItem: DraggedItem;
    onDragStart: (item: DraggedItem) => void;
    onDrop: (target: { columnId: string; groupId?: string; itemId?: string }) => void;
    handleTouchStart: (e: React.TouchEvent, item: DraggedItem) => void;
    touchDragOverTarget: { columnId: string; groupId?: string; itemId?: string } | null;
    openModal: (type: ModalState['type'], data?: any) => void;
    homeyGlobalSettings?: Settings['homey'];
    showOneRow?: boolean;
    onOptimisticUpdate: (deviceId: string, capabilityId: string, value: any) => void;
    isFirstItem: boolean;
}

const HomeyCustomItem: React.FC<HomeyCustomItemProps> = ({
    item, liveData, themeClasses, isEditMode, groupId, columnId,
    draggedItem, touchDragItem, onDragStart, onDrop, handleTouchStart, touchDragOverTarget,
    openModal, homeyGlobalSettings, showOneRow, onOptimisticUpdate,
    isFirstItem
}) => {
    const [isMouseDragOver, setIsMouseDragOver] = useState(false);
    const [isTriggered, setIsTriggered] = useState<string | null>(null);
    
    // This state is needed to display names until live data loads
    const [staticData, setStaticData] = useState<{name: string, capabilityTitle?: string, zone?: string}>({name: '...'});

    const isDraggingThis = (draggedItem?.type === 'groupItem' && draggedItem.item.id === item.id) || (touchDragItem?.type === 'groupItem' && touchDragItem.item.id === item.id);

    useEffect(() => {
        if (!draggedItem && !touchDragItem) {
          setIsMouseDragOver(false);
        }
    }, [draggedItem, touchDragItem]);

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
                    if (!deviceRes.ok) throw new Error('Failed to fetch static device data');
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
                    .then(res => {
                        if (!res.ok) throw new Error('Failed to fetch static flow data');
                        return res.json();
                    })
                    .then(data => setStaticData({ name: data.name }))
                    .catch(e => console.error("Failed to fetch static flow data", e));
            }
        }
    }, [item.id, homeyGlobalSettings]);


    const handleToggle = async (deviceId: string, capabilityId: string, currentState: boolean) => {
        const { localIp, apiToken } = homeyGlobalSettings || {};
        if (!localIp || !apiToken) return;
        
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

        setIsTriggered(flowId);
        setTimeout(() => setIsTriggered(null), 500);

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
                const customName = (item as any).customName;
                return (
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                           {showOneRow ? (
                               <div className="break-all text-base font-semibold">
                                   {customName ? customName : (item.capabilityId === 'onoff' ? staticData.name : (staticData.capabilityTitle || '...'))}
                               </div>
                           ) : (
                               customName ? (
                                   <>
                                       <div className="break-all font-semibold text-base">{customName}</div>
                                       <div className={`break-all text-xs text-slate-400`}>{staticData.name} - {staticData.capabilityTitle}</div>
                                   </>
                               ) : (
                                   <>
                                       <div className="break-all text-sm text-slate-400">{staticData.name}</div>
                                       <div className={`break-all font-semibold text-base ${themeClasses.modalText}`}>{staticData.capabilityTitle}</div>
                                   </>
                               )
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
                                <span className="font-bold font-mono text-base">{value !== null && value !== undefined ? `${Math.round(value * 10) / 10}${liveData?.units || ''}` : '-'}</span>
                            )}
                        </div>
                    </div>
                );
            case 'homey_flow':
                 const flowCustomName = (item as any).customName;
                 return (
                    <button
                        onClick={() => handleTriggerFlow(item.flowId)}
                        title={staticData.name}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg font-semibold text-sm transition-all duration-200 ${isTriggered === item.flowId ? 'bg-green-500 text-white scale-95 shadow-inner' : `${themeClasses.buttonSecondary} hover:brightness-110`}`}
                    >
                        <PlayIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{flowCustomName || staticData.name}</span>
                    </button>
                );
            case 'button_holder':
                const holder = item as ButtonHolderItem;
                if (isEditMode) {
                    return (
                        <div className="flex flex-wrap justify-center items-center gap-2">
                            {holder.buttons.map((button, index) => (
                                <div key={button.id} className="relative group/button" title={button.flowName}>
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-slate-700 text-white font-bold ${Array.from(button.symbol).length === 1 ? 'text-xl' : 'text-sm'}`}>
                                        {button.symbol}
                                    </div>
                                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 items-center justify-items-center bg-black/70 rounded-full opacity-0 group-hover/button:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => openModal('moveFlowButton', { direction: 'left', button, holderId: holder.id, groupId, columnId })} 
                                            className="text-white hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={index === 0}
                                        >
                                            <ChevronLeftIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => openModal('moveFlowButton', { direction: 'right', button, holderId: holder.id, groupId, columnId })} 
                                            className="text-white hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={index === holder.buttons.length - 1}
                                        >
                                            <ChevronRightIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => openModal('editFlowButton', { button, holderId: holder.id, groupId, columnId })} className="text-white hover:text-blue-300">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => openModal('deleteFlowButton', { button, holderId: holder.id, groupId, columnId })} className="text-white hover:text-red-400">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => openModal('addFlowButton', { holderId: holder.id, groupId, columnId })}
                                className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-dashed border-slate-600 text-slate-500 hover:border-slate-400 hover:text-slate-400 transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-wrap justify-center items-center gap-2">
                        {holder.buttons.map(button => {
                            const isBtnTriggered = isTriggered === button.flowId;
                            return (
                                <button
                                    key={button.id}
                                    onClick={() => handleTriggerFlow(button.flowId)}
                                    title={button.flowName}
                                    className={`w-12 h-12 flex items-center justify-center rounded-full font-bold transition-all duration-200 ${Array.from(button.symbol).length === 1 ? 'text-xl' : 'text-sm'} ${isBtnTriggered ? 'bg-green-500 text-white scale-95 shadow-inner' : `${themeClasses.buttonSecondary} hover:brightness-110`}`}
                                >
                                    {button.symbol}
                                </button>
                            );
                        })}
                    </div>
                );
            default:
                return null;
        }
    };
    
    const isTouchDragOver = touchDragItem?.type === 'groupItem' &&
        touchDragOverTarget?.itemId === item.id &&
        touchDragItem.item.id !== item.id;
    
    const isDragOver = isMouseDragOver || isTouchDragOver;

    if (!isEditMode) {
        // FIX: Combine checks for 'separator' and 'text' to avoid type narrowing issues.
        if (item.type === 'separator' || item.type === 'text') {
            if (item.type === 'separator') {
                return (
                    <div className={isFirstItem ? 'pb-3' : 'py-3'}>
                        <hr className={`${themeClasses.dashedBorder}`} />
                    </div>
                );
            } else { // item.type === 'text'
                return (
                    <div className={isFirstItem ? 'pb-1' : 'pt-3 pb-1'}>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">{item.content}</h4>
                    </div>
                );
            }
        }

        const isButtonHolder = item.type === 'button_holder';
        const bgClass = isButtonHolder ? '' : themeClasses.inputBg;
        const paddingClass = isButtonHolder ? 'p-1' : 'p-2';
        
        return (
            <div className={`rounded-lg ${bgClass} ${paddingClass}`}>
                {renderContent()}
            </div>
        );
    }

    return (
        <div
            draggable
            onDragStart={(e) => { e.stopPropagation(); onDragStart({ type: 'groupItem', item: item as AnyItemType, sourceGroupId: groupId, sourceColumnId: columnId }); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop({ columnId, groupId, itemId: item.id }); setIsMouseDragOver(false); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsMouseDragOver(true); }}
            onDragLeave={() => setIsMouseDragOver(false)}
            onTouchStart={(e) => handleTouchStart(e, {type: 'groupItem', item: item as AnyItemType, sourceGroupId: groupId, sourceColumnId: columnId})}
            data-drop-target="item"
            data-column-id={columnId}
            data-group-id={groupId}
            data-item-id={item.id}
            className={`flex items-center gap-2 p-1 rounded-md transition-all ${isDraggingThis ? 'opacity-30' : ''} ${isDragOver ? `ring-1 ${themeClasses.ring}` : ''}`}
        >
            <DragHandleIcon className="w-5 h-5 text-slate-500 flex-shrink-0 cursor-grab" />
            <div className={`flex-grow p-2 rounded ${themeClasses.inputBg} min-w-0`}>
                {renderContent()}
            </div>
            <div className="flex items-center gap-1">
                {(item.type === 'text' || item.type === 'homey_capability' || item.type === 'homey_flow') && (
                    <button onClick={() => {
                        if (item.type === 'text') {
                            openModal('addOrEditTextItem', { item, groupId, columnId });
                        } else {
                            openModal('editHomeyCustomItemName', { item, staticData, groupId, columnId });
                        }
                    }} className={`p-1.5 ${themeClasses.iconMuted} hover:text-white rounded-full hover:bg-slate-600`}>
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
