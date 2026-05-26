import React, { useEffect, useState } from 'react';
import { BridgeConnection } from '../../lib/bridge/bridgeTypes';
import { fetchBridgeConnections, disconnectBridgeService, getBridgeOAuthUrl } from '../../lib/bridge/bridgeApi';

export function BridgeConnections() {
  const [connections, setConnections] = useState<BridgeConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConns = async () => {
    try {
      const data = await fetchBridgeConnections();
      setConnections(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConns();
  }, []);

  const handleConnect = () => {
    window.location.href = getBridgeOAuthUrl();
  };

  const handleDisconnect = async (service: 'gmail' | 'drive') => {
    if (confirm(`Are you sure you want to disconnect ${service}?`)) {
      await disconnectBridgeService(service);
      loadConns();
    }
  };

  const hasGmail = connections.some(c => c.service === 'gmail');
  const hasDrive = connections.some(c => c.service === 'drive');

  return (
    <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Connected Services</h2>
      {loading ? (
        <div className="text-gray-400 animate-pulse">Loading connections...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Gmail */}
          <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">Gmail</h3>
              <p className="text-sm text-gray-400">
                {hasGmail ? 'Connected' : 'Not connected'}
              </p>
            </div>
            {hasGmail ? (
              <button onClick={() => handleDisconnect('gmail')} className="px-3 py-1 text-sm text-red-400 border border-red-500/30 rounded hover:bg-red-500/10">Disconnect</button>
            ) : (
              <button onClick={handleConnect} className="px-3 py-1 text-sm text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/10">Connect</button>
            )}
          </div>
          
          {/* Drive */}
          <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">Google Drive</h3>
              <p className="text-sm text-gray-400">
                {hasDrive ? 'Connected' : 'Not connected'}
              </p>
            </div>
            {hasDrive ? (
              <button onClick={() => handleDisconnect('drive')} className="px-3 py-1 text-sm text-red-400 border border-red-500/30 rounded hover:bg-red-500/10">Disconnect</button>
            ) : (
              <button onClick={handleConnect} className="px-3 py-1 text-sm text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/10">Connect</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
