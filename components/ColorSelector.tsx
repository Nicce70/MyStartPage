import React, { useState } from 'react';
import type { Theme } from '../types';

interface ColorSelectorProps {
  currentColor: string;
  themeClasses: Theme;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ currentColor, themeClasses }) => {
  const [selected, setSelected] = useState(currentColor || 'default');
  const ringColorClass = themeClasses.ring.replace('ring-', 'ring-offset-');

  const colors = [
    { id: 'default', name: 'Default', bgClass: themeClasses.groupBg },
    { id: 'secondary', name: 'Secondary', bgClass: themeClasses.groupBgSecondary },
    { id: 'tertiary', name: 'Tertiary', bgClass: themeClasses.groupBgTertiary },
    { id: 'green', name: 'Green', bgClass: 'bg-[#60B162]' },
    { id: 'gray', name: 'Light Gray', bgClass: 'bg-[#F2F2F2]' },
    { id: 'black', name: 'Almost Black', bgClass: 'bg-[#0a0a0a]' },
    { id: 'dark_blue', name: 'Midnight Blue', bgClass: 'bg-[#172554]' },
  ];

  return (
    <div className="mb-4">
      <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-2`}>Background Color</label>
      <div className="flex gap-3 flex-wrap">
        {colors.map((color) => (
          <label key={color.id} className="relative cursor-pointer group">
            <input
              type="radio"
              name="colorVariant"
              value={color.id}
              checked={selected === color.id}
              onChange={() => setSelected(color.id)}
              className="sr-only"
            />
            <div
              className={`w-10 h-10 rounded-lg ${color.bgClass} border-2 border-black/50 transition-all ${
                selected === color.id 
                  ? `ring-2 ring-white ${ringColorClass}` 
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              title={color.name}
            ></div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ColorSelector;
