import React, { useState } from 'react';
import type { Theme } from '../types';

interface ColorSelectorProps {
  currentColor: string;
  themeClasses: Theme;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ currentColor, themeClasses }) => {
  const [selected, setSelected] = useState(currentColor || 'default');
  const ringColorClass = themeClasses.ring.replace('ring-', 'ring-offset-');

  // SVG for checkerboard pattern
  const transparentBgSVG = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='8' height='8' fill-opacity='1'%3e%3cpath d='M0 0h4v4H0V0zm4 4h4v4H4V4z' fill='%23E5E7EB'/%3e%3cpath d='M4 0h4v4H4V0zm0 8V4H0v4h4z' fill='%23FFFFFF'/%3e%3c/svg%3e")`;

  const colors = [
    { id: 'default', name: 'Default', bgClass: themeClasses.groupBg },
    { id: 'secondary', name: 'Secondary', bgClass: themeClasses.groupBgSecondary },
    { id: 'tertiary', name: 'Tertiary', bgClass: themeClasses.groupBgTertiary },
    { id: 'green', name: 'Green', bgClass: 'bg-[#60B162]' },
    { id: 'gray', name: 'Light Gray', bgClass: 'bg-[#F2F2F2]' },
    { id: 'black', name: 'Almost Black', bgClass: 'bg-[#0a0a0a]' },
    { id: 'dark_blue', name: 'Midnight Blue', bgClass: 'bg-[#172554]' },
    { id: 'transparent', name: 'Transparent', bgStyle: { backgroundImage: transparentBgSVG } },
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
              className={`w-10 h-10 rounded-lg border-2 border-black/50 transition-all ${color.bgClass || ''} ${
                selected === color.id 
                  ? `ring-2 ring-white ${ringColorClass}` 
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              style={color.bgStyle || {}}
              title={color.name}
            ></div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ColorSelector;