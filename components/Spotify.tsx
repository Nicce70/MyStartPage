
import React from 'react';
import type { themes } from '../themes';

interface SpotifyProps {
  url: string;
  themeClasses: typeof themes.default;
}

const Spotify: React.FC<SpotifyProps> = ({ url, themeClasses }) => {
  const getEmbedUrl = (inputUrl: string) => {
    if (!inputUrl) return '';

    // Check if it's already an embed URL
    if (inputUrl.includes('open.spotify.com/embed')) {
      return inputUrl;
    }

    // Handle standard open.spotify.com URLs
    // e.g. https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
    // to   https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M
    try {
      const urlObj = new URL(inputUrl);
      if (urlObj.hostname === 'open.spotify.com') {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        // Expected path: ['type', 'id']
        if (pathParts.length >= 2) {
          const type = pathParts[0];
          const id = pathParts[1];
          return `https://open.spotify.com/embed/${type}/${id}`;
        }
      }
    } catch (e) {
      console.error('Invalid Spotify URL', e);
    }
    return '';
  };

  const embedUrl = getEmbedUrl(url);
  
  if (!url) {
      return <div className={`text-sm text-center py-4 ${themeClasses.textSubtle}`}>Please set a Spotify URL in the settings.</div>;
  }

  if (!embedUrl) {
    return <div className={`text-sm text-center py-4 text-red-400`}>Invalid Spotify URL. Please use a standard Link (e.g., https://open.spotify.com/playlist/...).</div>;
  }

  // Determine height based on type (compact for tracks, tall for playlists/albums)
  const isCompact = embedUrl.includes('/track/');
  const height = isCompact ? 152 : 352;

  return (
    <div className="w-full overflow-hidden rounded-xl">
      <iframe
        style={{ borderRadius: '12px' }}
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Embed"
      ></iframe>
    </div>
  );
};

export default Spotify;
