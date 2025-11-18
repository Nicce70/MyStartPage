import React, { useState, useEffect } from 'react';
import { themes } from '../themes';
import { GCalEvent } from '../types';
import { CalendarDaysIcon } from './Icons';

// This is a workaround for the fact that the gapi object is loaded from a script tag.
declare const gapi: any;

interface CalendarEventsProps {
  themeClasses: typeof themes.default;
}

const CalendarEvents: React.FC<CalendarEventsProps> = ({ themeClasses }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // NOTE: These should be replaced with your actual Google Cloud project credentials.
  // They are expected to be available as environment variables.
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client:auth2', initializeClient);
    };
    document.body.appendChild(script);

    function initializeClient() {
        if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
            setError("Google Calendar API is not configured.");
            setIsLoading(false);
            return;
        }

        gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            clientId: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.readonly',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        }).then(() => {
            const authInstance = gapi.auth2.getAuthInstance();
            authInstance.isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(authInstance.isSignedIn.get());
        }).catch((err: any) => {
            setError(err.error?.message || "Failed to initialize Google API client.");
            setIsLoading(false);
        });
    }

    const updateSigninStatus = (isSignedIn: boolean) => {
      setIsAuthorized(isSignedIn);
      if (isSignedIn) {
        listUpcomingEvents();
      } else {
        setIsLoading(false);
        setEvents([]);
      }
    };

    const listUpcomingEvents = () => {
        setIsLoading(true);
        setError(null);
        gapi.client.calendar.events.list({
          'calendarId': 'primary',
          'timeMin': (new Date()).toISOString(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 5,
          'orderBy': 'startTime'
        }).then((response: any) => {
          setEvents(response.result.items);
          setIsLoading(false);
        }).catch((err: any) => {
          setError(err.result?.error?.message || "Failed to fetch calendar events.");
          setIsLoading(false);
        });
    };
    
    // Cleanup the script tag on component unmount
    return () => {
      const gapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      if (gapiScript) {
        // gapiScript.remove(); // This might cause issues if another component needs it
      }
    };

  }, [GOOGLE_API_KEY, GOOGLE_CLIENT_ID]);

  const handleAuthClick = () => {
    gapi.auth2.getAuthInstance().signIn();
  };

  const formatEventTime = (start: GCalEvent['start']): string => {
    if (!start) return '';
    const startDate = new Date(start.dateTime || start.date!);
    if (start.dateTime) {
      return startDate.toLocaleString(navigator.language, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
    return startDate.toLocaleString(navigator.language, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  if (isLoading) {
    return <div className={`text-sm ${themeClasses.textSubtle} py-2`}>Loading events...</div>;
  }
  
  if (error) {
     return <div className={`text-sm text-red-400 py-2`}>{error}</div>;
  }
  
  if (!isAuthorized) {
    return (
        <div className="text-center py-2">
            <button
                onClick={handleAuthClick}
                className={`flex w-full items-center justify-center gap-2 ${themeClasses.buttonSecondary} font-semibold py-2 px-3 rounded-lg transition-colors`}
            >
                <CalendarDaysIcon className="w-4 h-4" />
                Connect Google Calendar
            </button>
        </div>
    );
  }

  if (events.length === 0) {
    return <div className={`text-sm ${themeClasses.textSubtle} py-2`}>No upcoming events.</div>;
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
      {events.map((event, i) => (
        <a 
          key={i} 
          href={event.htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`block p-2 rounded-md transition-colors text-left ${themeClasses.linkBg} ${themeClasses.linkHoverBg}`}
        >
          <p className={`text-sm font-semibold truncate ${themeClasses.linkText} ${themeClasses.linkHoverText}`}>{event.summary}</p>
          <p className={`text-xs ${themeClasses.textSubtle}`}>{formatEventTime(event.start)}</p>
        </a>
      ))}
    </div>
  );
};

export default CalendarEvents;