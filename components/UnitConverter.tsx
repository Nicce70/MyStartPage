
import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';

interface UnitConverterProps {
  themeClasses: typeof themes.default;
}

type Category = 'Length' | 'Weight' | 'Volume' | 'Temperature';

const CATEGORIES: Category[] = ['Length', 'Weight', 'Volume', 'Temperature'];

const UNITS: Record<Category, string[]> = {
  Length: ['Inch', 'Centimeter', 'Foot', 'Meter', 'Mile', 'Kilometer'],
  Weight: ['Pound', 'Kilogram', 'Ounce', 'Gram'],
  Volume: ['US Cup', 'Deciliter', 'Gallon', 'Liter', 'Fluid Ounce', 'Milliliter'],
  Temperature: ['Fahrenheit', 'Celsius'],
};

// Conversion rates relative to a base unit (Meter, Kilogram, Liter)
// Temperature is handled separately due to offsets
const CONVERSION_RATES: Record<string, number> = {
  // Length (Base: Meter)
  Meter: 1,
  Centimeter: 0.01,
  Inch: 0.0254,
  Foot: 0.3048,
  Mile: 1609.34,
  Kilometer: 1000,

  // Weight (Base: Kilogram)
  Kilogram: 1,
  Gram: 0.001,
  Pound: 0.453592,
  Ounce: 0.0283495,

  // Volume (Base: Liter)
  Liter: 1,
  Deciliter: 0.1,
  Milliliter: 0.001,
  Gallon: 3.78541,
  'US Cup': 0.236588,
  'Fluid Ounce': 0.0295735,
};

const UnitConverter: React.FC<UnitConverterProps> = ({ themeClasses }) => {
  const [category, setCategory] = useState<Category>('Length');
  const [unit1, setUnit1] = useState(UNITS['Length'][0]); // Default Inch
  const [unit2, setUnit2] = useState(UNITS['Length'][1]); // Default CM
  const [val1, setVal1] = useState<string>('');
  const [val2, setVal2] = useState<string>('');

  // Reset units when category changes
  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory);
    setUnit1(UNITS[newCategory][0]);
    setUnit2(UNITS[newCategory][1]);
    setVal1('');
    setVal2('');
  };

  const convert = (value: string, fromUnit: string, toUnit: string): string => {
    if (value === '') return '';
    const val = parseFloat(value);
    if (isNaN(val)) return '';

    if (category === 'Temperature') {
      if (fromUnit === toUnit) return value;
      if (fromUnit === 'Fahrenheit' && toUnit === 'Celsius') {
        return ((val - 32) * 5 / 9).toFixed(2);
      }
      if (fromUnit === 'Celsius' && toUnit === 'Fahrenheit') {
        return ((val * 9 / 5) + 32).toFixed(2);
      }
      return '';
    } else {
      // Linear conversion
      const fromRate = CONVERSION_RATES[fromUnit];
      const toRate = CONVERSION_RATES[toUnit];
      if (!fromRate || !toRate) return '';
      
      const baseValue = val * fromRate;
      const result = baseValue / toRate;
      
      // Handle rounding to avoid long floating points, but keep precision
      return parseFloat(result.toPrecision(6)).toString();
    }
  };

  const handleVal1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setVal1(v);
    setVal2(convert(v, unit1, unit2));
  };

  const handleVal2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setVal2(v);
    setVal1(convert(v, unit2, unit1));
  };

  const handleUnit1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const u = e.target.value;
    setUnit1(u);
    if (val1) setVal2(convert(val1, u, unit2));
  };

  const handleUnit2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const u = e.target.value;
    setUnit2(u);
    if (val1) setVal2(convert(val1, unit1, u));
  };

  return (
    <div className="space-y-3">
      {/* Category Select */}
      <div>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value as Category)}
          className={`w-full p-2 rounded-md border text-sm font-semibold ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Converter Rows */}
      <div className="space-y-2">
        {/* Row 1 */}
        <div className="flex gap-2">
            <input
              type="number"
              value={val1}
              onChange={handleVal1Change}
              placeholder="0"
              className={`flex-1 p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing} min-w-0`}
            />
            <select
              value={unit1}
              onChange={handleUnit1Change}
              className={`w-[45%] min-w-0 p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
            >
              {UNITS[category].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
        </div>

        <div className="flex justify-center">
           <span className={`${themeClasses.iconMuted}`}>⇅</span>
        </div>

        {/* Row 2 */}
        <div className="flex gap-2">
            <input
              type="number"
              value={val2}
              onChange={handleVal2Change}
              placeholder="0"
              className={`flex-1 p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing} min-w-0`}
            />
            <select
              value={unit2}
              onChange={handleUnit2Change}
              className={`w-[45%] min-w-0 p-2 rounded-md border text-sm ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
            >
              {UNITS[category].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
        </div>
      </div>
    </div>
  );
};

export default UnitConverter;
