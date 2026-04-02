'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Terminal, Copy, Check, X } from 'lucide-react';
import { Button } from './ui/button';

export function BridgeServerWarning() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'running' | 'stopped'>('checking');
  const [isDismissed, setIsDismissed] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);

  async function checkServer() {
    try {
      const response = await fetch('http://localhost:4000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        setServerStatus('running');
        setIsDismissed(false); // Auto-show if server comes back up
      } else {
        setServerStatus('stopped');
      }
    } catch (error) {
      setServerStatus('stopped');
    }
  }

  function copyCommand() {
    navigator.clipboard.writeText('node claude-bridge-server.js');
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  }

  // Don't show anything if server is running or user dismissed
  if (serverStatus === 'running' || isDismissed) {
    return null;
  }

  // Show checking state briefly
  if (serverStatus === 'checking') {
    return null;
  }

  return (
    <div
      className="border-b-2 px-6 py-4"
      style={{
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B'
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#FBBF24' }}
        >
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold" style={{ color: '#92400E' }}>
              AI Generation Not Available
            </h3>
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Claude Bridge Server Not Running
            </span>
          </div>

          <p className="text-sm mb-3" style={{ color: '#92400E' }}>
            The bridge server connects this app to Claude Code for AI-powered slide generation.
            Without it, slides will use a basic fallback template.
          </p>

          <div className="rounded-lg p-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #FDE68A' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#92400E' }}>
              <Terminal className="w-3.5 h-3.5 inline mr-1" />
              Quick Fix:
            </p>

            <ol className="text-xs space-y-1.5 mb-3" style={{ color: '#78350F' }}>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[16px]">1.</span>
                <span>Open a <strong>new</strong> terminal tab (⌘T on Mac)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[16px]">2.</span>
                <span>Navigate to: <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#FEF3C7' }}>~/Documents/Powerpoint-App-main</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[16px]">3.</span>
                <span>Run this command:</span>
              </li>
            </ol>

            <div className="flex items-center gap-2">
              <code
                className="flex-1 text-xs font-mono px-3 py-2 rounded"
                style={{
                  backgroundColor: '#FEF3C7',
                  color: '#78350F',
                  border: '1px solid #FDE68A'
                }}
              >
                node claude-bridge-server.js
              </code>
              <button
                onClick={copyCommand}
                className="p-2 rounded hover:bg-yellow-100 transition-colors"
                title="Copy command"
              >
                {copiedCommand ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" style={{ color: '#92400E' }} />
                )}
              </button>
            </div>

            <p className="text-xs mt-2" style={{ color: '#92400E' }}>
              💡 This warning will disappear automatically once the server starts.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded hover:bg-yellow-200 transition-colors"
          title="Dismiss (will reappear on reload)"
        >
          <X className="w-4 h-4" style={{ color: '#92400E' }} />
        </button>
      </div>
    </div>
  );
}
