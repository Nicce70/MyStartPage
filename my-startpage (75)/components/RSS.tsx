import React, { useState, useEffect } from 'react';
import type { themes } from '../themes';

interface RSSProps {
  rssUrl: string;
  itemCount: number;
  themeClasses: typeof themes.default;
  openLinksInNewTab: boolean;
}

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
}

interface RssFeed {
    items: RssItem[];
    feed: {
        title: string;
    }
}

const RSS: React.FC<RSSProps> = ({ rssUrl, itemCount, themeClasses, openLinksInNewTab }) => {
  const [feed, setFeed] = useState<RssFeed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rssUrl) {
      setError('Please set an RSS feed URL in the settings.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setFeed(null);

    const cacheKey = `rss-feed-${rssUrl}`;
    try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            // Cache for 15 minutes
            if (Date.now() - timestamp < 15 * 60 * 1000) {
                setFeed(data);
                setIsLoading(false);
                return;
            }
        }
    } catch(e) {
        console.error("Could not read from session storage", e);
    }
    
    // Using a proxy to avoid CORS issues
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    fetch(proxyUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        return response.json();
      })
      .then(data => {
        if (data.status !== 'ok') {
            throw new Error(data.message || 'Failed to fetch or parse RSS feed.');
        }
        setFeed(data);
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

  }, [rssUrl]);

  if (isLoading) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Loading feed...</div>;
  }

  if (error) {
    return <div className={`text-sm text-center py-4 text-red-400`}>{error}</div>;
  }
  
  if (!feed || !feed.items || feed.items.length === 0) {
    return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>No items in this feed.</div>;
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {feed.items.slice(0, itemCount).map((item) => (
        <a 
          key={item.link} 
          href={item.link}
          target={openLinksInNewTab ? "_blank" : "_self"}
          rel="noopener noreferrer"
          className={`block p-2 rounded-md transition-colors text-left ${themeClasses.linkBg} ${themeClasses.linkHoverBg}`}
        >
          <p className={`text-base font-semibold break-words ${themeClasses.linkText} ${themeClasses.linkHoverText}`}>{item.title}</p>
          <p className={`text-sm ${themeClasses.textSubtle}`}>
            {new Date(item.pubDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </a>
      ))}
    </div>
  );
};

export default RSS;