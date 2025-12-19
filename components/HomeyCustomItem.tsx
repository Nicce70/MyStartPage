
import React, { useState, useEffect, useRef } from 'react';
import type { themes } from '../themes';
import type { AnyItemType, DraggedItem, HomeyCustomItemType, ModalState, Settings, ButtonHolderItem, FlowButton } from '../types';
import { DragHandleIcon, PencilIcon, TrashIcon, PlayIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from './Icons';

type DropTarget = { columnId: string; groupId?: string; itemId?: string; } | null;

interface HomeyCustomItemProps {
    item: HomeyCustomItemType;
    liveData?: { value: any, units?: string };
    themeClasses: typeof themes.default;
    isEditMode: boolean;
    groupId: string;
    columnId: string;
    draggedItem: DraggedItem;
    onPointerDown: (e: React.MouseEvent | React.TouchEvent, item: DraggedItem, elementRef: HTMLElement | null) => void;
    dropTarget: DropTarget;
    openModal: (type: ModalState['type'], data?: any) => void;
    homeyGlobalSettings?: Settings['homey'];
    showOneRow?: boolean;
    onOptimisticUpdate: (deviceId: string, capabilityId: string, value: any) => void;
    isFirstItem: boolean;
    onToggle: (deviceId: string, capabilityId: string, currentState: boolean) => void;
    onTriggerFlow: (flowId: string) => void;
}

const SPACER_ID = '---SPACER---';

export const HomeyCustomItem: React.FC<HomeyCustomItemProps> = ({
    item, liveData, themeClasses, isEditMode, groupId, columnId,
    draggedItem, onPointerDown, dropTarget, openModal, homeyGlobalSettings, showOneRow, onOptimisticUpdate,
    isFirstItem, onToggle, onTriggerFlow
}) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [isTriggered, setIsTriggered] = useState<string | null>(null);
    const [staticData, setStaticData] = useState<{name: string, capabilityTitle?: string, zone?: string}>({name: '...'});
    const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);

    const isDraggingThis = draggedItem?.type === 'groupItem' && draggedItem.item.id === item.id;
    const isDropTarget = dropTarget?.itemId === item.id;

    useEffect(() => {
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
    }, [item.id, homeyGlobalSettings, item.type]);

    const handleTriggerFlow = (flowId: string) => {
        setIsTriggered(flowId);
        setTimeout(() => setIsTriggered(null), 500);
        onTriggerFlow(flowId);
    };
    
    const getItemTypeLabel = (currentItem: HomeyCustomItemType): string => {
        switch (currentItem.type) {
            case 'text': return 'HEADER';
            case 'separator': return 'SEPARATOR';
            case 'homey_capability':
                return currentItem.capabilityId === 'onoff' ? 'TOGGLE' : 'SENSOR';
            case 'homey_flow': return 'FLOW';
            case 'button_holder': return 'BUTTON HOLDER';
            default: return '';
        }
    };

    const formatSensorValue = (value: any, units?: string): React.ReactNode => {
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

    const renderContent = () => {
        switch (item.type) {
            case 'text':
                return <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">{item.content}</h4>;
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
                                    onClick={() => onToggle(item.deviceId, item.capabilityId, !!value)}
                                    disabled={isEditMode}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-slate-600'} ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            ) : (
                                <span className="font-bold font-mono text-base">{formatSensorValue(value, liveData?.units)}</span>
                            )}
                        </div>
                    </div>
                );
            case 'homey_flow':
                 const flowCustomName = (item as any).customName;
                 return (
                    <button
                        onClick={() => handleTriggerFlow(item.flowId)}
                        disabled={isEditMode}
                        title={staticData.name}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg font-semibold text-sm transition-all duration-200 ${isTriggered === item.flowId ? 'bg-green-500 text-white scale-95 shadow-inner' : `${themeClasses.buttonSecondary} hover:brightness-110`} ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <PlayIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{flowCustomName || staticData.name}</span>
                    </button>
                );
            case 'button_holder':
                const holder = item as ButtonHolderItem;
                if (isEditMode) {
                    const selectedButton = holder.buttons.find(b => b.id === selectedButtonId);
                    const selectedButtonIndex = holder.buttons.findIndex(b => b.id === selectedButtonId);
                    
                    return (
                        <div 
                            className="flex flex-col gap-4"
                             onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setSelectedButtonId(null);
                                }
                            }}
                        >
                            <div className="flex flex-wrap justify-center items-center gap-2">
                                {holder.buttons.map((button) => {
                                    const isSpacer = button.flowId === SPACER_ID;
                                    const isSelected = selectedButtonId === button.id;
                                    return (
                                        <div 
                                            key={button.id} 
                                            className="relative cursor-pointer" 
                                            title={isSpacer ? 'Spacer' : button.flowName}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedButtonId(isSelected ? null : button.id);
                                            }}
                                        >
                                            <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold transition-all ${Array.from(button.symbol).length === 1 ? 'text-xl' : 'text-sm'} ${isSpacer ? 'border-2 border-solid border-slate-600 text-slate-500' : 'bg-slate-700 text-white'} ${isSelected ? 'ring-2 ring-offset-2 ring-orange-500 ring-offset-slate-800' : ''}`}>
                                                {button.symbol}
                                            </div>
                                        </div>
                                    );
                                })}
                                <button 
                                    onClick={() => openModal('addFlowButton', { holderId: holder.id, groupId, columnId })}
                                    className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-dashed border-slate-600 text-slate-500 hover:border-slate-400 hover:text-slate-400 transition-colors"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {selectedButton && (
                                <div className={`mt-2 p-2 rounded-lg border ${themeClasses.dashedBorder} bg-black/20 flex flex-col items-center gap-2 animate-fade-in-up`}>
                                    <div className="flex justify-center gap-4">
                                        <button 
                                            onClick={() => openModal('moveFlowButton', { direction: 'left', button: selectedButton, holderId: holder.id, groupId, columnId })} 
                                            className="p-2 rounded-md text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={selectedButtonIndex === 0}
                                            title="Move Left"
                                        >
                                            <ChevronLeftIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => openModal('moveFlowButton', { direction: 'right', button: selectedButton, holderId: holder.id, groupId, columnId })} 
                                            className="p-2 rounded-md text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={selectedButtonIndex === holder.buttons.length - 1}
                                            title="Move Right"
                                        >
                                            <ChevronRightIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-center gap-4">
                                        <button onClick={() => openModal('editFlowButton', { button: selectedButton, holderId: holder.id, groupId, columnId })} className="p-2 rounded-md text-slate-300 hover:bg-slate-700" title="Edit">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => openModal('deleteFlowButton', { button: selectedButton, holderId: holder.id, groupId, columnId })} className="p-2 rounded-md text-red-400 hover:bg-red-900/40" title="Delete">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="w-full border-t border-slate-700 my-1"></div>
                                    
                                    <button onClick={() => setSelectedButtonId(null)} className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-md font-semibold text-sm ${themeClasses.buttonSecondary}`} title="Done">
                                      <CheckIcon className="w-4 h-4" /> Done
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                }
                return (
                    <div className="flex flex-wrap justify-center items-center gap-2">
                        {holder.buttons.map(button => {
                            const isSpacer = button.flowId === SPACER_ID;
                            if (isSpacer) {
                                if (!button.symbol) {
                                    return <div key={button.id} className="w-12 h-12 flex-shrink-0" />;
                                }
                                return (
                                    <div key={button.id} title="Spacer" className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-slate-500 ${Array.from(button.symbol).length === 1 ? 'text-xl' : 'text-sm'}`}>
                                        {button.symbol}
                                    </div>
                                );
                            }

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

    if (!isEditMode) {
      if (item.type === 'separator' || item.type === 'text') {
        const isFirstAndSpecial = isFirstItem && (item.type === 'text' || item.type === 'separator');
        if (item.type === 'text') {
          return (
              <div className={isFirstAndSpecial ? 'pb-1' : 'pt-3 pb-1'}>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">{item.content}</h4>
              </div>
          );
        } else {
          return (
            <div className={isFirstAndSpecial ? 'pb-3' : 'py-3'}>
                <hr className={`${themeClasses.dashedBorder}`} />
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
            ref={itemRef}
            id={`item-${item.id}`}
            data-droppable="item"
            data-column-id={columnId}
            data-group-id={groupId}
            data-item-id={item.id}
            onContextMenu={(e) => { if (isEditMode) e.preventDefault(); }}
            style={{ touchAction: 'none', userSelect: 'none' }}
            className={`relative rounded-md transition-all ${isDraggingThis ? 'opacity-30' : ''} ${isDropTarget ? `ring-2 ${themeClasses.ring}` : ''}`}
        >
            <div 
                className="absolute top-1 left-1 z-10 p-1.5 cursor-grab"
                onMouseDown={(e) => onPointerDown(e, { type: 'groupItem', item: item as AnyItemType, sourceGroupId: groupId, sourceColumnId: columnId }, itemRef.current)}
                onTouchStart={(e) => onPointerDown(e, { type: 'groupItem', item: item as AnyItemType, sourceGroupId: groupId, sourceColumnId: columnId }, itemRef.current)}
            >
                <DragHandleIcon className="w-5 h-5 text-slate-400" />
            </div>

            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 px-2 h-4 flex items-center justify-center bg-black/30 rounded-full pointer-events-none">
                 <div className="flex items-center justify-center h-full">
                    <span className="font-bold text-slate-300 tracking-wider uppercase" style={{ fontSize: '9px', lineHeight: '1' }}>
                        {getItemTypeLabel(item)}
                    </span>
                 </div>
            </div>

            <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                {(item.type === 'text' || item.type === 'homey_capability' || item.type === 'homey_flow') && (
                    <button onClick={() => {
                        if (item.type === 'text') {
                            openModal('addOrEditTextItem', { item, groupId, columnId });
                        } else {
                            openModal('editHomeyCustomItemName', { item, staticData, groupId, columnId });
                        }
                    }} className={`p-1.5 ${themeClasses.iconMuted} hover:text-white rounded-full bg-black/40 hover:bg-slate-600`}>
                        <PencilIcon className="w-4 h-4" />
                    </button>
                )}
                {item.type !== 'button_holder' && (
                    <button onClick={() => openModal('deleteItem', { item, groupId, columnId })} className={`p-1.5 ${themeClasses.iconMuted} hover:text-red-400 rounded-full bg-black/40 hover:bg-slate-600`}>
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
                 {item.type === 'button_holder' && (
                    <button onClick={() => openModal('deleteItem', { item, groupId, columnId })} className={`p-1.5 ${themeClasses.iconMuted} hover:text-red-400 rounded-full bg-black/40 hover:bg-slate-600`}>
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            <div className={`w-full min-h-[4rem] rounded ${themeClasses.inputBg} pt-8 pb-2 px-2`}>
                {renderContent()}
            </div>
        </div>
    );
};
