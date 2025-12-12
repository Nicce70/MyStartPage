

import React, { useState } from 'react';
import type { themes } from '../themes';
import type { Settings } from '../types';
import { BoltIcon, ArrowPathIcon, ExclamationTriangleIcon, ClipboardIcon, CheckIcon } from './Icons';

interface HomeyStatusProps {
  themeClasses: typeof themes.default;
  homeyGlobalSettings?: Settings['homey'];
  // New props from central engine
  connectionState: 'websocket' | 'polling' | 'disconnected';
  lastUpdate: Date | null;
  countdown: number;
  log: string[];
}

const HomeyStatus: React.FC<HomeyStatusProps> = ({ 
    themeClasses, 
    homeyGlobalSettings,
    connectionState,
    lastUpdate,
    countdown,
    log
}) => {
    const [isLogVisible, setIsLogVisible] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const { localIp, pollingInterval = 10 } = homeyGlobalSettings || {};

    const handleCopyLog = () => {
        navigator.clipboard.writeText(log.join('\n')).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const StatusHeader = () => {
        switch (connectionState) {
            case 'websocket':
                return <div className="flex items-center gap-2 font-bold text-green-400"><BoltIcon className="w-4 h-4" /><span>REAL-TIME (WEBSOCKET)</span></div>;
            case 'polling':
                return <div className="flex items-center gap-2 font-bold text-yellow-400"><ArrowPathIcon className="w-4 h-4" /><span>PERIODIC (POLLING)</span></div>;
            case 'disconnected':
                return <div className="flex items-center gap-2 font-bold text-red-400"><ExclamationTriangleIcon className="w-4 h-4" /><span>DISCONNECTED</span></div>;
            default:
                 return <div className="flex items-center gap-2 font-bold text-slate-400"><ArrowPathIcon className="w-4 h-4 animate-spin" /><span>CONNECTING...</span></div>;
        }
    };

    return (
        <div className={`p-3 text-sm space-y-3 ${themeClasses.modalText}`}>
            <div className="text-center text-xs uppercase tracking-wider">
                <StatusHeader />
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
                <div className={`p-2 rounded ${themeClasses.inputBg}`}>
                    <div className={`text-xs uppercase ${themeClasses.textSubtle}`}>Next Update</div>
                    <div className="font-mono font-bold text-lg">
                        {connectionState === 'polling' ? `${countdown}s` : 'Live'}
                    </div>
                </div>
                <div className={`p-2 rounded ${themeClasses.inputBg}`}>
                    <div className={`text-xs uppercase ${themeClasses.textSubtle}`}>Last Success</div>
                    <div className="font-mono font-bold text-lg">
                        {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
                    </div>
                </div>
            </div>

            <div className={`p-2 rounded ${themeClasses.inputBg} text-xs`}>
                <div className="flex justify-between">
                    <span className={themeClasses.textSubtle}>Polling Interval:</span>
                    <span className="font-mono">{pollingInterval}s</span>
                </div>
                <div className="flex justify-between">
                    <span className={themeClasses.textSubtle}>Target IP:</span>
                    <span className="font-mono break-all">{localIp || 'Not set'}</span>
                </div>
            </div>

            <div>
                <button onClick={() => setIsLogVisible(!isLogVisible)} className={`w-full text-xs text-center p-1 rounded ${themeClasses.buttonSecondary}`}>
                    {isLogVisible ? 'Hide Log' : 'Show Log'}
                </button>
                {isLogVisible && (
                    <div className={`mt-2 p-2 rounded border ${themeClasses.dashedBorder} bg-black/30 max-h-40 overflow-y-auto`}>
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                            {log.join('\n')}
                        </pre>
                        <button onClick={handleCopyLog} className={`w-full flex items-center justify-center gap-2 text-xs mt-2 p-1 rounded ${themeClasses.buttonSecondary}`}>
                           {isCopied ? <><CheckIcon className="w-3 h-3 text-green-400" /> Copied!</> : <><ClipboardIcon className="w-3 h-3" /> Copy Log</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeyStatus;