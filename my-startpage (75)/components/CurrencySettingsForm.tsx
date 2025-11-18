import React, { useState } from 'react';
import type { Group, Theme } from '../types';

const CURRENCIES = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP',
  'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR',
  'NOK', 'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
];

interface CurrencySettingsFormProps {
  group: Group;
  themeClasses: Theme;
}

const CurrencySettingsForm: React.FC<CurrencySettingsFormProps> = ({ group, themeClasses }) => {
  const currentBase = group.widgetSettings?.currencyBase || 'USD';
  const currentTargets = group.widgetSettings?.currencyTargets || [];
  
  const [base, setBase] = useState(currentBase);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="currencyBase" className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>
          Base Currency (Your Currency)
        </label>
        <select
          id="currencyBase"
          name="currencyBase"
          value={base}
          onChange={(e) => setBase(e.target.value)}
          className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
        >
          {CURRENCIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-2`}>
          Currencies to Monitor
        </label>
        <div className={`grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-md border ${themeClasses.inputBg} border-slate-600`}>
          {CURRENCIES.filter(c => c !== base).map(currency => (
            <label key={currency} className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 rounded p-1">
              <input
                type="checkbox"
                name="currencyTargets"
                value={currency}
                defaultChecked={currentTargets.includes(currency)}
                className={`rounded text-indigo-600 bg-slate-700 border-slate-600 focus:ring-indigo-500`}
              />
              <span className="text-sm">{currency}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurrencySettingsForm;