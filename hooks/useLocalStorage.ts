// FIX: Import `React` to resolve namespace errors for type annotations.
import React, { useState } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      const parsedItem = item ? JSON.parse(item) : initialValue;
      // For objects, merge stored settings with defaults to handle new settings properties gracefully.
      if (typeof initialValue === 'object' && initialValue !== null && !Array.isArray(initialValue) && typeof parsedItem === 'object' && parsedItem !== null && !Array.isArray(parsedItem)) {
        return { ...(initialValue as object), ...(parsedItem as object) } as T;
      }
      return parsedItem;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;