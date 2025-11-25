
import React, { useState } from 'react';
import type { Group, Theme } from '../types';
import { ArrowPathIcon } from './Icons';

interface HomeySettingsFormProps {
  group: Group;
  themeClasses: Theme;
}

interface HomeyDevice {
  id: string;
  name: string;
  class: string;
  capabilities: string[];
}

const HomeySettingsForm: React.FC<HomeySettingsFormProps> = ({ group, themeClasses }) => {
  const [localIp, setLocalIp] = useState(group.widgetSettings?.homeySettings?.localIp || '');
  const [token, setToken] = useState(group.widgetSettings?.homeySettings?.apiToken || '');
  const [selectedDevices, setSelectedDevices] = useState<string[]>(group.widgetSettings?.homeySettings?.deviceIds || []);
  
  const [availableDevices, setAvailableDevices] = useState<HomeyDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(group.widgetSettings?.homeySettings?.localIp ? 2 : 1);

  const sanitizeToken = (input: string) => {
      return input.replace(/^Bearer\s+/i, '').trim();
  };

  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    
    const cleanToken = sanitizeToken(token);
    let formattedIp = localIp.trim();
    if (!formattedIp.startsWith('http')) {
        formattedIp = `http://${formattedIp}`;
    }

    try {
      // Fetch Devices from Local API
      const devicesUrl = `${formattedIp}/api/manager/devices/device`;
      const devicesRes = await fetch(devicesUrl, {
          headers: { 'Authorization': `Bearer ${cleanToken}` }
      });
      
      if (!devicesRes.ok) {
          if (devicesRes.status === 0) throw new Error('Connection Refused. Ensure you are viewing this page via HTTP (not HTTPS) and the IP is correct.');
          throw new Error('Failed to fetch devices. Check Token and IP.');
      }
      
      const devicesData = await devicesRes.json();
      const deviceList: HomeyDevice[] = Object.values(devicesData).map((d: any) => ({
          id: d.id,
          name: d.name,
          class: d.class,
          capabilities: d.capabilities
      }));
      
      setAvailableDevices(deviceList);
      setStep(2);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error. Mixed Content issue?");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDevice = (deviceId: string) => {
    if (selectedDevices.includes(deviceId)) {
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId));
    } else {
      setSelectedDevices([...selectedDevices, deviceId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="localIp" value={localIp} />
      <input type="hidden" name="apiToken" value={sanitizeToken(token)} />
      {selectedDevices.map(id => (
          <input key={id} type="hidden" name="deviceIds" value={id} />
      ))}

      {step === 1 && (
        <div className="space-y-4">
            <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-xs text-yellow-200">
                <strong>Requirement:</strong> This widget connects directly to your Homey on your local network.
                You MUST run this dashboard via <strong>HTTP</strong> (e.g., localhost) for this to work. HTTPS will block the connection.
            </div>

            <div>
                <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Homey Local IP</label>
                <input 
                    type="text" 
                    value={localIp}
                    onChange={(e) => setLocalIp(e.target.value)}
                    placeholder="192.168.1.x"
                    className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
            </div>

            <div>
                <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>API Token</label>
                <input 
                    type="password" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Bearer ..."
                    className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Get your Personal Access Token from the Homey app: 
                  <span className="font-semibold"> Settings → API Keys → Create New Key</span>.
                </p>

            </div>
            
            {error && <div className="text-red-400 text-sm">{error}</div>}
            
            <button
                type="button"
                onClick={fetchDevices}
                disabled={!token || !localIp || isLoading}
                className={`w-full py-2 rounded-md font-bold transition-colors flex items-center justify-center gap-2 ${themeClasses.buttonPrimary} disabled:opacity-50`}
            >
                {isLoading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Connecting...' : 'Connect & Load Devices'}
            </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className={`font-bold ${themeClasses.modalText}`}>Select Devices</h3>
                <button 
                    type="button" 
                    onClick={fetchDevices} 
                    className={`p-1.5 rounded hover:bg-white/10 transition-colors ${themeClasses.iconMuted}`}
                    title="Refresh List"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            
            <div className={`max-h-60 overflow-y-auto border rounded-md ${themeClasses.inputBg} ${themeClasses.dashedBorder}`}>
                {availableDevices.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No devices found.</div>
                ) : (
                    availableDevices.map(device => (
                        <label key={device.id} className="flex items-center p-2 hover:bg-black/20 cursor-pointer border-b border-slate-700/50 last:border-0">
                            <input 
                                type="checkbox" 
                                checked={selectedDevices.includes(device.id)}
                                onChange={() => toggleDevice(device.id)}
                                className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 mr-3"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-sm">{device.name}</div>
                                <div className="text-xs text-slate-500 flex gap-2">
                                    <span>{device.class}</span>
                                    {device.capabilities.includes('onoff') && <span className="text-green-500/70">Switch</span>}
                                    {device.capabilities.some(c => c.startsWith('measure')) && <span className="text-blue-500/70">Sensor</span>}
                                </div>
                            </div>
                        </label>
                    ))
                )}
            </div>
            
            <button
                type="button"
                onClick={() => { setStep(1); setAvailableDevices([]); }}
                className={`text-xs underline ${themeClasses.textSubtle}`}
            >
                Change IP / Token
            </button>
        </div>
      )}
    </div>
  );
};

export default HomeySettingsForm;