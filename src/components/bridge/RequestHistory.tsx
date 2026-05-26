import React, { useEffect, useState } from 'react';
import { BridgeRequest } from '../../lib/bridge/bridgeTypes';
import { fetchBridgeRequests } from '../../lib/bridge/bridgeApi';

export function RequestHistory() {
  const [requests, setRequests] = useState<BridgeRequest[]>([]);

  useEffect(() => {
    // Basic polling
    const loadReqs = async () => {
      try {
        const data = await fetchBridgeRequests();
        setRequests(data.reverse()); // newest first
      } catch (e) {
        console.error(e);
      }
    };
    loadReqs();
    const interval = setInterval(loadReqs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 mt-6 bg-gray-900 border border-gray-800 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Action Log</h2>
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="text-gray-500">No requests yet.</div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="p-3 flex items-center justify-between border border-gray-800 rounded-lg bg-gray-800/30">
              <div>
                <p className="text-white text-sm font-medium">
                  <span className="capitalize">{req.service}</span>: <span className="font-mono text-xs">{req.action}</span>
                </p>
                <p className="text-xs text-gray-400">{req.reason}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  req.status === 'executed' ? 'bg-green-500/20 text-green-400' :
                  req.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                  req.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {req.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
