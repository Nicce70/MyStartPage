
import React, { useState } from 'react';
import type { Group, Theme } from '../types';

interface HomeyCustomSettingsFormProps {
  group: Group;
  themeClasses: Theme;
}

const HomeyCustomSettingsForm: React.FC<HomeyCustomSettingsFormProps> = ({ group, themeClasses }) => {
  const [showOneRow, setShowOneRow] = useState(group.widgetSettings?.homeyCustomSettings?.showOneRow ?? false);
  const [flowsInTwoColumns, setFlowsInTwoColumns] = useState(group.widgetSettings?.homeyCustomSettings?.flowsInTwoColumns ?? false);

  return (
    <div className="space-y-3 pt-4 mt-4 border-t border-slate-700">
        {/* Hidden inputs to ensure value is sent when checked */}
        {showOneRow && <input type="hidden" name="homeyCustomShowOneRow" value="on" />}
        {flowsInTwoColumns && <input type="hidden" name="homeyCustomFlowsInTwoColumns" value="on" />}
        
        <div className="flex items-center justify-between">
            <label htmlFor="homeyCustomShowOneRow" className="text-sm font-medium">Show One Row</label>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    id="homeyCustomShowOneRow" 
                    checked={showOneRow}
                    onChange={(e) => setShowOneRow(e.target.checked)}
                    className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
        <p className="text-xs text-slate-500">Condenses each item to a single line. Toggles show the device name; sensors show the capability name.</p>
        
        <div className="pt-3 border-t border-slate-700"></div>

        <div className="flex items-center justify-between">
            <label htmlFor="homeyCustomFlowsInTwoColumns" className="text-sm font-medium">Flows in Two Columns</label>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    id="homeyCustomFlowsInTwoColumns" 
                    checked={flowsInTwoColumns}
                    onChange={(e) => setFlowsInTwoColumns(e.target.checked)}
                    className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
        <p className="text-xs text-slate-500">Displays consecutive flow buttons side-by-side to save space.</p>
    </div>
  );
};

export default HomeyCustomSettingsForm;
