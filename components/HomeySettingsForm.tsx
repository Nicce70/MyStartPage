
import React, { useState } from 'react';
import type { Group, Theme } from '../types';
import { LightBulbIcon, CpuChipIcon, ExclamationCircleIcon, ArrowPathIcon } from './Icons';

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
  const [token, setToken] = useState(group.widgetSettings?.homeySettings?.apiToken || '');
  const [homeyId, setHomeyId] = useState(group.widgetSettings?.homeySettings?.homeyId || '');
  const [selectedDevices, setSelectedDevices] = useState<string[]>(group.widgetSettings?.homeySettings?.deviceIds || []);
  
  const [availableDevices, setAvailableDevices] = useState<HomeyDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(group.widgetSettings?.homeySettings?.homeyId ? 2 : 1);

  const sanitizeToken = (input: string) => {
      return input.replace(/^Bearer\s+/i, '').trim();
  };

  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    
    const cleanToken = sanitizeToken(token);

    try {
      // Step 1: Get Current User (to find Homey ID)
      if (!homeyId) {
          const meRes = await fetch('https://api.athom.com/api/manager/users/user/me', {
            headers: { 'Authorization': `Bearer ${cleanToken}` }
          });
          
          if (!meRes.ok) throw new Error('Invalid Token or API Error');
          
          const meData = await meRes.json();
          // Assuming the first homey is the one we want for now, or finding the connected one
          // This part simplifies finding the Homey ID. In a full app, you might list Homeys.
          // We look for a homey in the user's list.
          // Note: Athom API structure varies, simplified here for PoC.
          // We will try to use the first available Homey ID if not set.
          // A more robust way is asking user to select Homey if multiple exist.
          // For this widget, let's assume we find one.
          
          // Since direct structure might be complex, let's try to fetch devices assuming we can get the ID or the user provides it if we fail.
          // Actually, let's try to hit a known endpoint if we had the ID.
          // If we don't have ID, we can't easily list devices without listing homes first.
          
          // Hack: For this PoC, we'll fetch devices from the *Cloud URL* directly if we can find the ID.
          // But we need the ID.
          // Let's assume the user might need to look up their ID or we find it in the `me` response profile.
          
          // Let's look at `meData`. usually `meData.data.properties.homeys` or similar.
          // Due to CORS and structure, let's try a direct approach: 
          // If user saves token, we try to proceed.
      }

      // Step 2: Fetch Devices using the Cloud API (requires Homey ID)
      // If we don't have a Homey ID, we can't construct the URL: https://<HOMEY_ID>.connect.athom.com/api/manager/devices/device
      
      // Fallback: We really need the Homey ID. 
      // Let's try to get it from the user object if possible, otherwise user might need to input it.
      // For a smooth UX, let's try to find it.
      
      const userRes = await fetch('https://api.athom.com/api/manager/users/user/me', {
         headers: { 'Authorization': `Bearer ${cleanToken}` }
      });
      const userData = await userRes.json();
      
      // Try to find a homey
      let foundHomeyId = homeyId;
      if (!foundHomeyId && userData && userData.data) {
          // This path is a guess based on standard API responses; structure differs by account type.
          // If this fails, we might need to ask user for Homey ID manually.
          // For now, let's see if we can proceed.
      }
      
      // If we still don't have an ID, we can't fetch devices.
      // BUT, to make this widget work for the user NOW, let's allow them to manually input ID if auto-detection fails?
      // Or simpler: The user provided flow implies we should just work. 
      
      // Let's fetch devices assuming we have the ID or just want to validate token.
      // Since we can't easily browse Homeys without a complex UI, 
      // I'll assume for this widget that we might need to let the user input the ID manually if we can't find it,
      // OR we try to list devices from the first homey we find in the /me endpoint.
      
      // Let's assume success for a moment to render the UI.
      // In a real scenario, we'd iterate `userData.data.homeys`.
      
      // Mocking the device fetch if we can't hit the real API due to CORS/Auth complexity in this specific environment.
      // However, the user wants it to work.
      
      // Let's try to hit the generic endpoint.
      if (!foundHomeyId) {
          // Attempt to extract from response if possible
          // If userData.data.homeys exists
          if (userData.data && Array.isArray(userData.data.homeys) && userData.data.homeys.length > 0) {
              foundHomeyId = userData.data.homeys[0]._id;
              setHomeyId(foundHomeyId);
          }
      }
      
      if (!foundHomeyId) {
          throw new Error("Could not automatically find Homey ID. Please ensure you have a Homey connected.");
      }

      const devicesUrl = `https://${foundHomeyId}.connect.athom.com/api/manager/devices/device`;
      const devicesRes = await fetch(devicesUrl, {
          headers: { 'Authorization': `Bearer ${cleanToken}` }
      });
      
      if (!devicesRes.ok) throw new Error('Failed to fetch devices. Check Token/Homey status.');
      
      const devicesData = await devicesRes.json();
      // devicesData is usually an object { "device-id": { ... } } or array
      
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
      setError(err instanceof Error ? err.message : "Unknown error");
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
      <input type="hidden" name="apiToken" value={sanitizeToken(token)} />
      <input type="hidden" name="homeyId" value={homeyId} />
      {selectedDevices.map(id => (
          <input key={id} type="hidden" name="deviceIds" value={id} />
      ))}

      {step === 1 && (
        <div className="space-y-4">
            <div>
                <label className={`block text-sm font-medium ${themeClasses.modalMutedText} mb-1`}>Homey API Bearer Token</label>
                <input 
                    type="password" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Bearer ..."
                    className={`w-full p-2 rounded-md border ${themeClasses.inputBg} ${themeClasses.inputFocusRing}`}
                />
                <p className="text-xs text-slate-500 mt-1">
                    Create at <a href="https://tools.developer.homey.app/tools/api-playground" target="_blank" rel="noreferrer" className="underline hover:text-indigo-400">Homey API Playground</a>. Copy the 'Bearer' token.
                </p>
            </div>
            
            {error && <div className="text-red-400 text-sm">{error}</div>}
            
            <button
                type="button"
                onClick={fetchDevices}
                disabled={!token || isLoading}
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
                Change Token / Re-connect
            </button>
        </div>
      )}
    </div>
  );
};

export default HomeySettingsForm;
