import React, { useState } from 'react';
import type { themes } from '../themes';
import { ClipboardIcon, XCircleIcon, CheckIcon } from './Icons';

interface ScratchpadProps {
  content: string;
  onChange: (newContent: string) => void;
  themeClasses: typeof themes.default;
  isEditMode: boolean;
}

const CHARACTER_LIMIT = 500;

const Scratchpad: React.FC<ScratchpadProps> = ({ content, onChange, themeClasses, isEditMode }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleClear = () => {
    onChange('');
  };

  const currentLength = content.length;

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing your notes here..."
        className={`w-full h-48 p-2 rounded-md border text-base resize-none
          ${themeClasses.inputBg} 
          ${themeClasses.inputFocusRing} 
          placeholder:text-slate-500
          overflow-auto break-words
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        disabled={isEditMode}
        maxLength={CHARACTER_LIMIT}
      />
      <div className="flex items-center justify-end gap-3 px-1">
        <span className={`text-sm ${themeClasses.textSubtle}`}>
          {currentLength}/{CHARACTER_LIMIT}
        </span>
        <button
          onClick={handleClear}
          title="Clear"
          className={`${themeClasses.iconMuted} ${themeClasses.buttonIconHoverText} ${themeClasses.buttonIconHoverBg} p-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isEditMode || content.length === 0}
        >
          <XCircleIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleCopy}
          title="Copy to clipboard"
          className={`${themeClasses.iconMuted} ${themeClasses.buttonIconHoverText} ${themeClasses.buttonIconHoverBg} p-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isEditMode || content.length === 0}
        >
          {isCopied ? (
            <CheckIcon className="w-5 h-5 text-green-400" />
          ) : (
            <ClipboardIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Scratchpad;