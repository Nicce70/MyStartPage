import React, { useMemo } from 'react';
import type { themes } from '../themes';
import type { Group, Settings, AnyItemType, ModalState, DraggedItem, HomeyCustomItemType } from '../types';
import { PlusIcon } from './Icons';
// FIX: Changed to a named import to resolve module resolution error.
import { HomeyCustomItem } from './HomeyCustomItem';

type DropTarget = { columnId: string; groupId?: string; itemId?: string; } | null;

interface HomeyCustomWidgetProps {
    group: Group;
    columnId: string;
    themeClasses: typeof themes.default;
    homeyGlobalSettings?: Settings['homey'];
    isEditMode: boolean;
    openModal: (type: ModalState['type'], data?: any) => void;
    onPointerDown: (e: React.MouseEvent | React.TouchEvent, item: DraggedItem, elementRef: HTMLElement | null) => void;
    draggedItem: DraggedItem;
    dropTarget: DropTarget;
    // New props from central engine
    homeyDevices: any;
    onToggle: (deviceId: string, capabilityId: string, currentState: boolean) => void;
    onTriggerFlow: (flowId: string) => void;
    onOptimisticUpdate: (deviceId: string, capabilityId: string, value: any) => void;
}


const HomeyCustomWidget: React.FC<HomeyCustomWidgetProps> = ({
    group,
    columnId,
    themeClasses,
    homeyGlobalSettings,
    isEditMode,
    openModal,
    onPointerDown,
    draggedItem,
    dropTarget,
    homeyDevices,
    onToggle,
    onTriggerFlow,
    onOptimisticUpdate,
}) => {
    
    const liveData = useMemo(() => {
        const data: { [key: string]: { value: any; units?: string } } = {};
        if (!homeyDevices || Object.keys(homeyDevices).length === 0) return data;
        
        group.items.forEach(item => {
            if (item.type === 'homey_capability') {
                const device = homeyDevices[item.deviceId];
                if (device && device.capabilitiesObj[item.capabilityId]) {
                    const cap = device.capabilitiesObj[item.capabilityId];
                    data[`${item.deviceId}-${item.capabilityId}`] = { value: cap.value, units: cap.units };
                }
            }
        });
        return data;
    }, [group.items, homeyDevices]);

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
                    onPointerDown={onPointerDown}
                    dropTarget={dropTarget}
                    openModal={openModal}
                    homeyGlobalSettings={homeyGlobalSettings}
                    showOneRow={showOneRow}
                    onOptimisticUpdate={onOptimisticUpdate}
                    onToggle={onToggle}
                    onTriggerFlow={onTriggerFlow}
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