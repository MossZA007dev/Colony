import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BridgeRequest, BridgeRiskLevel } from '../../lib/bridge/bridgeTypes';

interface PermissionModalProps {
  request: BridgeRequest;
  onApprove: () => void;
  onReject: () => void;
  isOpen: boolean;
}

export function PermissionModal({ request, onApprove, onReject, isOpen }: PermissionModalProps) {
  const [confirmText, setConfirmText] = useState('');
  
  if (!isOpen) return null;

  const isHighRisk = request.risk === 'high';
  const canApprove = !isHighRisk || confirmText.toLowerCase() === 'approve';

  const getRiskColor = (risk: BridgeRiskLevel) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md p-6 border rounded-xl bg-gray-900 border-gray-800 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Action Required</h2>
            <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider border rounded-full ${getRiskColor(request.risk)}`}>
              {request.risk} RISK
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-800/50">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Service</p>
              <p className="text-white capitalize">{request.service}</p>
            </div>

            <div className="p-4 rounded-lg bg-gray-800/50">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Action</p>
              <p className="text-white font-mono text-sm">{request.action}</p>
            </div>

            <div className="p-4 rounded-lg bg-gray-800/50">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Reason</p>
              <p className="text-gray-300">{request.reason}</p>
            </div>

            {isHighRisk && (
              <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5">
                <p className="text-sm text-red-400 mb-2">
                  This is a high-risk action. Please type <strong>approve</strong> to confirm.
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-red-500/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-red-400"
                  placeholder="Type 'approve'"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onReject}
              className="flex-1 px-4 py-2 font-medium text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
            >
              Reject
            </button>
            <button
              onClick={onApprove}
              disabled={!canApprove}
              className={`flex-1 px-4 py-2 font-medium rounded-lg transition-colors ${
                canApprove
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-blue-600/50 text-white/50 cursor-not-allowed'
              }`}
            >
              Approve
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
