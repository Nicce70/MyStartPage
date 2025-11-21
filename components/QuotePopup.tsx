
import React, { useState, useEffect, useCallback } from 'react';
import type { Settings, Theme } from '../types';
import { XMarkIcon, ClipboardIcon, CheckIcon, SparklesIcon, ArrowPathIcon } from './Icons';

interface QuotePopupProps {
  settings: Settings;
  themeClasses: Theme;
}

interface Quote {
  text: string;
  author: string;
  category?: string;
}

// Large curated list of quotes to ensure offline functionality and reliability
const LOCAL_QUOTES: Record<string, Quote[]> = {
  inspirational: [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "Do not wait to strike till the iron is hot, but make it hot by striking.", author: "William Butler Yeats" },
    { text: "It is never too late to be what you might have been.", author: "George Eliot" },
    { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" }
  ],
  programming: [
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
    { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
    { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
    { text: "Java is to JavaScript what car is to Carpet.", author: "Chris Heilmann" },
    { text: "Knowledge is power.", author: "Francis Bacon" },
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" }
  ],
  philosophy: [
    { text: "The unexamined life is not worth living.", author: "Socrates" },
    { text: "I think, therefore I am.", author: "René Descartes" },
    { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "Man is condemned to be free.", author: "Jean-Paul Sartre" },
    { text: "The only thing I know is that I know nothing.", author: "Socrates" },
    { text: "Life must be understood backward. But it must be lived forward.", author: "Søren Kierkegaard" },
    { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
    { text: "Happiness depends upon ourselves.", author: "Aristotle" },
    { text: "No man's knowledge here can go beyond his experience.", author: "John Locke" }
  ],
  funny: [
    { text: "I am so clever that sometimes I don't understand a single word of what I am saying.", author: "Oscar Wilde" },
    { text: "People say nothing is impossible, but I do nothing every day.", author: "A.A. Milne" },
    { text: "Behind every great man is a woman rolling her eyes.", author: "Jim Carrey" },
    { text: "If you think you are too small to make a difference, try sleeping with a mosquito.", author: "Dalai Lama" },
    { text: "My bed is a magical place where I suddenly remember everything I forgot to do.", author: "Unknown" },
    { text: "Common sense is like deodorant. The people who need it most never use it.", author: "Unknown" },
    { text: "I'm not lazy, I'm on energy saving mode.", author: "Unknown" },
    { text: "Life is short. Smile while you still have teeth.", author: "Unknown" },
    { text: "The road to success is dotted with many tempting parking spaces.", author: "Will Rogers" },
    { text: "A day without sunshine is like, you know, night.", author: "Steve Martin" }
  ]
};

const CACHE_KEY = 'startpage_cached_quote';
const DISMISS_KEY = 'startpage_quote_dismissed';

const QuotePopup: React.FC<QuotePopupProps> = ({ settings, themeClasses }) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const getRandomQuote = useCallback((category: string) => {
    const list = LOCAL_QUOTES[category] || LOCAL_QUOTES['inspirational'];
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  }, []);

  useEffect(() => {
    if (!settings.showQuotes) {
      setIsVisible(false);
      return;
    }

    const now = new Date();
    const todayStr = now.toDateString(); // e.g. "Mon Oct 27 2023"

    // 1. Check Dismissal (Only for daily frequency)
    if (settings.quoteFrequency === 'daily') {
      const dismissedDate = localStorage.getItem(DISMISS_KEY);
      if (dismissedDate === todayStr) {
        setIsVisible(false);
        return;
      }
    }

    // 2. Load or Generate Quote
    let quoteToDisplay: Quote | null = null;

    if (settings.quoteFrequency === 'daily') {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const { quote, date, category } = JSON.parse(cachedData);
          // Use cached quote if it's from today AND matches the selected category
          if (date === todayStr && category === settings.quoteCategory) {
            quoteToDisplay = quote;
          }
        } catch (e) {
          // Invalid cache
        }
      }
    }

    // If no valid cached quote, generate a new one
    if (!quoteToDisplay) {
      quoteToDisplay = getRandomQuote(settings.quoteCategory);
      
      // Save to cache if daily
      if (settings.quoteFrequency === 'daily') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          quote: quoteToDisplay,
          date: todayStr,
          category: settings.quoteCategory
        }));
      }
    }

    setQuote(quoteToDisplay);
    setIsVisible(true);

  }, [settings.showQuotes, settings.quoteCategory, settings.quoteFrequency, getRandomQuote]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (settings.quoteFrequency === 'daily') {
      localStorage.setItem(DISMISS_KEY, new Date().toDateString());
    }
  };

  const handleRefresh = () => {
    const newQuote = getRandomQuote(settings.quoteCategory);
    setQuote(newQuote);
    if (settings.quoteFrequency === 'daily') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          quote: newQuote,
          date: new Date().toDateString(),
          category: settings.quoteCategory
        }));
    }
  };

  const handleCopy = () => {
    if (!quote) return;
    const textToCopy = `"${quote.text}" — ${quote.author}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!isVisible || !quote) return null;

  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-[90%] max-w-2xl`}>
      <div className={`relative p-6 rounded-xl shadow-2xl backdrop-blur-md border ${themeClasses.modalBg.replace('bg-', 'bg-opacity-90 bg-')} ${themeClasses.dashedBorder} transition-all duration-300 animate-fade-in-up`}>
        
        {/* Background Icon Decoration */}
        <div className="absolute -top-4 -left-4 opacity-10 rotate-12 pointer-events-none">
            <SparklesIcon className={`w-16 h-16 ${themeClasses.modalText}`} />
        </div>

        {/* Close Button */}
        <button 
            onClick={handleDismiss}
            className={`absolute top-2 right-2 p-1 rounded-full ${themeClasses.iconMuted} hover:text-white hover:bg-white/10 transition-colors`}
            title={settings.quoteFrequency === 'daily' ? "Close for today" : "Close"}
        >
            <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-4">
            <p className={`text-lg md:text-xl font-serif italic leading-relaxed ${themeClasses.modalText}`}>
                "{quote.text}"
            </p>
            <p className={`text-sm font-semibold uppercase tracking-wider ${themeClasses.textSubtle}`}>
                — {quote.author}
            </p>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <button
                onClick={handleRefresh}
                className={`p-1.5 rounded-md ${themeClasses.iconMuted} hover:text-white hover:bg-white/10 transition-colors`}
                title="New Quote"
            >
                <ArrowPathIcon className="w-4 h-4" />
            </button>
            <button
                onClick={handleCopy}
                className={`p-1.5 rounded-md ${themeClasses.iconMuted} hover:text-white hover:bg-white/10 transition-colors`}
                title="Copy to Clipboard"
            >
                {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default QuotePopup;
