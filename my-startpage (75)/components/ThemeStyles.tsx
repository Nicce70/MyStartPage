import React from 'react';
// FIX: The 'Theme' type is defined in '../types', not '../themes'.
import type { Theme } from '../types';

interface ThemeStylesProps {
  theme: Theme;
}

const ThemeStyles: React.FC<ThemeStylesProps> = ({ theme }) => {
  const styles = `
    /* For Webkit-based browsers (Chrome, Safari) */
    ::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }

    ::-webkit-scrollbar-track {
      background: ${theme.scrollbarTrack};
    }

    ::-webkit-scrollbar-thumb {
      background-color: ${theme.scrollbarThumb};
      border-radius: 6px;
      border: 3px solid ${theme.scrollbarTrack};
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.scrollbarThumbHover};
    }
  `;

  return <style>{styles}</style>;
};

export default ThemeStyles;