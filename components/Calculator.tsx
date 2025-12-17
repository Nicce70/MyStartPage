
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { themes } from '../themes';
import type { CalculatorState } from '../types';

interface CalculatorProps {
  themeClasses: typeof themes.default;
  state: CalculatorState;
  onStateChange: (newState: CalculatorState) => void;
  isEditMode: boolean;
}

const CalculatorButtonGrid: React.FC<any> = ({ handleDigitClick, handleOperatorClick, handleClearClick, handleDecimalClick, handleEqualsClick, buttonClass, operatorButtonClass, isEditMode }) => (
    <div className="grid grid-cols-4 grid-rows-5 gap-2">
        {/* Row 1 */}
        <button onClick={handleClearClick} disabled={isEditMode} className={`${buttonClass} col-span-2`}>C</button>
        <button onClick={() => handleOperatorClick('/')} disabled={isEditMode} className={operatorButtonClass}>÷</button>
        <button onClick={() => handleOperatorClick('*')} disabled={isEditMode} className={operatorButtonClass}>×</button>

        {/* Row 2 */}
        <button onClick={() => handleDigitClick('7')} disabled={isEditMode} className={buttonClass}>7</button>
        <button onClick={() => handleDigitClick('8')} disabled={isEditMode} className={buttonClass}>8</button>
        <button onClick={() => handleDigitClick('9')} disabled={isEditMode} className={buttonClass}>9</button>
        <button onClick={() => handleOperatorClick('-')} disabled={isEditMode} className={operatorButtonClass}>-</button>

        {/* Row 3 */}
        <button onClick={() => handleDigitClick('4')} disabled={isEditMode} className={buttonClass}>4</button>
        <button onClick={() => handleDigitClick('5')} disabled={isEditMode} className={buttonClass}>5</button>
        <button onClick={() => handleDigitClick('6')} disabled={isEditMode} className={buttonClass}>6</button>
        <button onClick={() => handleOperatorClick('+')} disabled={isEditMode} className={operatorButtonClass}>+</button>

        {/* Row 4 & 5 */}
        <button onClick={() => handleDigitClick('1')} disabled={isEditMode} className={buttonClass}>1</button>
        <button onClick={() => handleDigitClick('2')} disabled={isEditMode} className={buttonClass}>2</button>
        <button onClick={() => handleDigitClick('3')} disabled={isEditMode} className={buttonClass}>3</button>
        <button onClick={handleEqualsClick} disabled={isEditMode} className={`${operatorButtonClass} row-span-2`}>=</button>
        
        <button onClick={() => handleDigitClick('0')} disabled={isEditMode} className={`${buttonClass} col-span-2`}>0</button>
        <button onClick={handleDecimalClick} disabled={isEditMode} className={buttonClass}>.</button>
    </div>
);

const Calculator: React.FC<CalculatorProps> = ({ themeClasses, state, onStateChange, isEditMode }) => {
  const [isFocused, setIsFocused] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);

  const calculate = (val1: string, op: string, val2: string): string => {
    const num1 = parseFloat(val1);
    const num2 = parseFloat(val2);
    let result;
    switch (op) {
      case '+': result = num1 + num2; break;
      case '-': result = num1 - num2; break;
      case '*': result = num1 * num2; break;
      case '/': result = num2 === 0 ? NaN : num1 / num2; break;
      default: return val2;
    }
    return Number.isFinite(result) ? parseFloat(result.toPrecision(12)).toString() : 'Error';
  };
  
  const handleDigitClick = useCallback((digit: string) => {
    if (state.currentValue.length >= 14 && !state.isNewEntry) return;

    const newCurrentValue = (state.isNewEntry || state.currentValue === '0' || state.currentValue === 'Error')
      ? digit
      : state.currentValue + digit;
      
    onStateChange({ ...state, currentValue: newCurrentValue, isNewEntry: false });
  }, [state, onStateChange]);

  const handleDecimalClick = useCallback(() => {
    if (state.isNewEntry) {
      onStateChange({ ...state, currentValue: '0.', isNewEntry: false });
    } else if (!state.currentValue.includes('.')) {
      onStateChange({ ...state, currentValue: state.currentValue + '.', isNewEntry: false });
    }
  }, [state, onStateChange]);

  const handleClearClick = useCallback(() => {
    onStateChange({
      currentValue: '0',
      previousValue: null,
      operator: null,
      isNewEntry: true,
    });
  }, [onStateChange]);

  const handleOperatorClick = useCallback((op: string) => {
    if (state.currentValue === 'Error') {
      handleClearClick();
      return;
    }
    if (state.operator && !state.isNewEntry && state.previousValue) {
      const result = calculate(state.previousValue, state.operator, state.currentValue);
      onStateChange({
        ...state,
        currentValue: result,
        previousValue: result,
        operator: op,
        isNewEntry: true,
      });
    } else {
      onStateChange({
        ...state,
        previousValue: state.currentValue,
        operator: op,
        isNewEntry: true,
      });
    }
  }, [state, onStateChange, handleClearClick]);
  
  const handleEqualsClick = useCallback(() => {
    if (state.operator && state.previousValue && !state.isNewEntry) {
      const result = calculate(state.previousValue, state.operator, state.currentValue);
      onStateChange({
        currentValue: result,
        previousValue: null,
        operator: null,
        isNewEntry: true,
      });
    }
  }, [state, onStateChange]);

  // Effect for handling clicks outside the calculator to lose focus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (calculatorRef.current && !calculatorRef.current.contains(event.target as Node)) {
            setIsFocused(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effect for handling keyboard input when focused
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (!isFocused || isEditMode) return;

        const key = event.key;

        if (key >= '0' && key <= '9') {
            event.preventDefault();
            handleDigitClick(key);
        } else if (['+', '-', '*', '/'].includes(key)) {
            event.preventDefault();
            handleOperatorClick(key);
        } else if (key === '.') {
            event.preventDefault();
            handleDecimalClick();
        } else if (key === 'Enter' || key === '=') {
            event.preventDefault();
            handleEqualsClick();
        } else if (key === 'Backspace' || key === 'Escape') {
            event.preventDefault();
            handleClearClick();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocused, isEditMode, handleDigitClick, handleOperatorClick, handleDecimalClick, handleEqualsClick, handleClearClick]);

  
  const buttonClass = `${themeClasses.buttonSecondary} font-semibold py-2 rounded-lg transition-colors text-lg focus:outline-none focus:ring-1 ${themeClasses.ring.replace('ring-', 'ring-offset-')} disabled:opacity-50 disabled:cursor-not-allowed`;
  const operatorButtonClass = `${themeClasses.buttonPrimary} font-semibold py-2 rounded-lg transition-colors text-lg focus:outline-none focus:ring-1 ${themeClasses.ring.replace('ring-', 'ring-offset-')} disabled:opacity-50 disabled:cursor-not-allowed`;

  const displayValue = state.currentValue === 'Error' ? 'Error' : parseFloat(state.currentValue).toLocaleString('en-US', { maximumFractionDigits: 8, useGrouping: false });
  const displayFontSize = displayValue.length > 10 ? 'text-2xl' : 'text-3xl';

  return (
    <div
      ref={calculatorRef}
      onClick={() => { if (!isEditMode) setIsFocused(true); }}
      tabIndex={-1}
      className={`p-1 space-y-2 rounded-lg transition-shadow outline-none ${isFocused && !isEditMode ? `ring-2 ${themeClasses.ring}` : ''}`}
    >
      <div className={`p-2 rounded-lg ${themeClasses.inputBg} text-right font-mono break-all overflow-hidden ${displayFontSize}`}>
        {displayValue}
      </div>
      <CalculatorButtonGrid 
        handleDigitClick={handleDigitClick}
        handleOperatorClick={handleOperatorClick}
        handleClearClick={handleClearClick}
        handleDecimalClick={handleDecimalClick}
        handleEqualsClick={handleEqualsClick}
        buttonClass={buttonClass}
        operatorButtonClass={operatorButtonClass}
        isEditMode={isEditMode}
      />
    </div>
  );
};

export default Calculator;
