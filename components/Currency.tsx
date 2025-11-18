import React, { useState, useEffect, useMemo } from 'react';
import type { themes } from '../themes';

interface CurrencyProps {
  base: string;
  targets: string[];
  themeClasses: typeof themes.default;
}

interface Rates {
  [key: string]: number;
}

const Currency: React.FC<CurrencyProps> = ({ base, targets, themeClasses }) => {
  const [rates, setRates] = useState<Rates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use useMemo to create a stable dependency key for the useEffect hook.
  // This prevents infinite re-renders if the parent component passes a new array reference on every render.
  // Importantly, we clone the array with [...targets] before sorting to avoid mutating the 'targets' prop directly,
  // which violates React's immutability principles and can cause subtle bugs or crashes (like Error #310).
  const targetsKey = useMemo(() => {
      if (!Array.isArray(targets)) return '';
      return [...targets].sort().join(',');
  }, [targets]);

  useEffect(() => {
    if (!base || !targetsKey) {
      if (!base) {
          setError('Please configure currencies in the settings.');
      } else {
          // If no targets selected, just stop loading and clear rates
          setError(null);
      }
      setIsLoading(false);
      setRates(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setRates(null);

    const cacheKey = `currency-${base}-${targetsKey}`;
    try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            // Cache for 1 hour
            if (Date.now() - timestamp < 60 * 60 * 1000) {
                setRates(data.rates);
                setIsLoading(false);
                return;
            }
        }
    } catch(e) {
        console.error("Could not read from session storage", e);
    }

    fetch(`https://api.frankfurter.app/latest?from=${base}&to=${targetsKey}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates.');
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setRates(data.rates);
        try {
            const cachePayload = { data, timestamp: Date.now() };
            sessionStorage.setItem(cacheKey, JSON.stringify(cachePayload));
        } catch(e) {
            console.error("Could not write to session storage", e);
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [base, targetsKey]);

  if (isLoading) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Loading rates...</div>;
  }

  if (error) {
    return <div className={`text-sm text-center py-4 text-red-400`}>{error}</div>;
  }
  
  if (!rates || Object.keys(rates).length === 0) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>No rates available. Select currencies in settings.</div>;
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
      {Object.entries(rates).map(([currency, rate]) => {
        // Safety check to ensure rate is a number
        if (typeof rate !== 'number') return null;

        // Calculate the inverse rate: Price of 1 Unit of Target Currency in Base Currency
        const inverseRate = 1 / rate;
        
        return (
            <div key={currency} className="flex justify-between items-center p-1 font-mono">
            <span className={`text-base ${themeClasses.textMuted}`}>1 {currency}</span>
            <span className="text-base">=</span>
            <span className={`text-base font-bold ${themeClasses.header}`}>{inverseRate.toFixed(2)} {base}</span>
            </div>
        );
      })}
    </div>
  );
};

export default Currency;