
import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';
import { HeartIcon } from './Icons';

interface DonationPopupProps {
  themeClasses: typeof themes.default;
}

const STORAGE_KEY = 'startpage_donation_hidden_until';
const FIRST_VISIT_KEY = 'startpage_first_visit';

const DonationPopup: React.FC<DonationPopupProps> = ({ themeClasses }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const now = Date.now();

    // 1. Check if explicitly snoozed (by clicking Donate previously)
    const hiddenUntil = localStorage.getItem(STORAGE_KEY);
    if (hiddenUntil) {
      if (now < parseInt(hiddenUntil, 10)) {
        setIsVisible(false);
        return;
      }
    }

    // 2. Check first visit timestamp
    const firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
    if (!firstVisit) {
      // First time user is here. Mark the time, but don't show popup yet.
      localStorage.setItem(FIRST_VISIT_KEY, now.toString());
      setIsVisible(false);
      return;
    }

    // 3. Check if 7 days have passed since first visit
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (now - parseInt(firstVisit, 10) < sevenDaysMs) {
      // Less than 7 days since first visit, keep hidden
      setIsVisible(false);
      return;
    }

    // If we passed all checks, show the popup
    setIsVisible(true);
  }, []);

  const handleDonate = () => {
    // Hide for 90 days after clicking donate
    const hideDuration = 90 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, (Date.now() + hideDuration).toString());
    
    // Open PayPal
    window.open('https://www.paypal.com/us/fundraiser/charity/4858974', '_blank');
    
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-40 max-w-sm p-5 rounded-lg shadow-xl border ${themeClasses.modalBg} ${themeClasses.dashedBorder} animate-fade-in-up`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-red-400">
            <HeartIcon className="w-6 h-6 animate-pulse" />
            <h3 className={`font-bold text-lg ${themeClasses.header}`}>Support a Cat Shelter</h3>
        </div>
      </div>
      
      <p className={`text-sm mb-4 leading-relaxed ${themeClasses.textMuted}`}>
        This app is free! If you find it useful, please consider making a small donation to help cats in need.
      </p>
      
      <button
        onClick={handleDonate}
        className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-md transition-colors ${themeClasses.buttonPrimary}`}
      >
        <HeartIcon className="w-4 h-4" />
        Donate via PayPal
      </button>
    </div>
  );
};

export default DonationPopup;
