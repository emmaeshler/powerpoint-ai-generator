'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Terminal, Copy, Check, X, KeyRound, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

type ServerStatus = 'checking' | 'running' | 'stopped';
type CredentialState = 'unchecked' | 'ok' | 'missing_env' | 'auth_failed';

interface CredentialStatus {
  state: CredentialState;
  missingVars: string[];
  azureError: string | null;
}

export function BridgeServerWarning() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
  const [credentials, setCredentials] = useState<CredentialStatus>({ state: 'unchecked', missingVars: [], azureError: null });
  const [isDismissed, setIsDismissed] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Credential form state (shown when missing_env)
  const [showCredForm, setShowCredForm] = useState(false);
  const [credValues, setCredValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 3000);
    return () => clearInterval(interval);
  }, []);

  async function checkServer() {
    try {
      const response = await fetch('http://localhost:4000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        const data = await response.json();
        setServerStatus('running');
        if (data.credentials) setCredentials(data.credentials);
        setIsDismissed(false);
      } else {
        setServerStatus('stopped');
      }
    } catch {
      setServerStatus('stopped');
    }
  }

  function copyCommand(cmd: string) {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  }

  async function handleSaveCredentials() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('http://localhost:4000/setup-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credValues),
      });
      const data = await res.json();
      if (data.success) {
        setCredentials(data.credentials);
        setShowCredForm(false);
        setCredValues({});
      } else {
        setSaveError('Failed to save. Check the server terminal for details.');
      }
    } catch {
      setSaveError('Could not reach the server. Is it running?');
    } finally {
      setSaving(false);
    }
  }

  // Nothing to show if everything is good or dismissed
  if (serverStatus === 'checking') return null;
  if (isDismissed) return null;
  if (serverStatus === 'running' && credentials.state === 'ok') return null;

  // ── Server not running ────────────────────────────────────────────────────
  if (serverStatus === 'stopped') {
    return (
      <Banner color="amber" onDismiss={() => setIsDismissed(true)}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold" style={{ color: '#92400E' }}>AI Generation Not Available</h3>
          <StatusPill label="Bridge Server Not Running" color="red" />
        </div>
        <p className="text-sm mb-3" style={{ color: '#92400E' }}>
          The bridge server connects this app to Claude for AI-powered slide generation. Without it, slides will use a basic fallback.
        </p>
        <InstructionBox>
          <ol className="text-xs space-y-1.5 mb-3" style={{ color: '#78350F' }}>
            <li className="flex items-start gap-2"><span className="font-semibold min-w-[16px]">1.</span><span>Open a <strong>new</strong> terminal tab (⌘T)</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold min-w-[16px]">2.</span><span>Navigate to the project folder</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold min-w-[16px]">3.</span><span>Run this command:</span></li>
          </ol>
          <CopyRow command="node claude-bridge-server.js" onCopy={copyCommand} copied={copiedCommand} />
          <p className="text-xs mt-2" style={{ color: '#92400E' }}>
            This warning disappears automatically once the server starts.
          </p>
        </InstructionBox>
      </Banner>
    );
  }

  // ── Server running, missing env vars ────────────────────────────────────
  if (credentials.state === 'missing_env') {
    return (
      <Banner color="red" onDismiss={() => setIsDismissed(true)}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold" style={{ color: '#991B1B' }}>Credentials Required</h3>
          <StatusPill label="Setup Incomplete" color="red" />
        </div>
        <p className="text-sm mb-3" style={{ color: '#991B1B' }}>
          The following environment variables are missing from your <code className="px-1 py-0.5 rounded text-[11px] bg-red-100">.env</code> file:
          {' '}<strong>{credentials.missingVars.join(', ')}</strong>
        </p>

        <button
          onClick={() => setShowCredForm(v => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg mb-2 transition-colors"
          style={{ backgroundColor: '#991B1B', color: '#fff' }}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Enter credentials here
          {showCredForm ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </button>

        {showCredForm && (
          <InstructionBox>
            <div className="space-y-3 mb-3">
              {credentials.missingVars.map(varName => (
                <div key={varName}>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: '#7F1D1D' }}>{varName}</label>
                  <input
                    type="text"
                    value={credValues[varName] || ''}
                    onChange={e => setCredValues(v => ({ ...v, [varName]: e.target.value }))}
                    placeholder={varName === 'FOUNDRY_TARGET_URI' ? 'https://your-resource.openai.azure.com/...' : 'e.g. claude-3-5-sonnet'}
                    className="w-full text-xs px-2 py-1.5 rounded border font-mono"
                    style={{ borderColor: '#FCA5A5', outline: 'none' }}
                  />
                </div>
              ))}
            </div>
            {saveError && <p className="text-xs text-red-700 mb-2">{saveError}</p>}
            <button
              onClick={handleSaveCredentials}
              disabled={saving || credentials.missingVars.some(k => !credValues[k]?.trim())}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#991B1B', color: '#fff' }}
            >
              {saving ? 'Saving…' : 'Save & connect'}
            </button>
            <p className="text-[11px] mt-2" style={{ color: '#78350F' }}>
              Values are saved to <code className="bg-red-50 px-1 rounded">.env</code> and take effect immediately — no restart needed.
            </p>
          </InstructionBox>
        )}
      </Banner>
    );
  }

  // ── Server running, Azure auth failed ───────────────────────────────────
  if (credentials.state === 'auth_failed') {
    return (
      <Banner color="orange" onDismiss={() => setIsDismissed(true)}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold" style={{ color: '#9A3412' }}>Azure Authentication Failed</h3>
          <StatusPill label="Not Authenticated" color="orange" />
        </div>
        <p className="text-sm mb-1" style={{ color: '#9A3412' }}>
          The server can't get an Azure access token. AI generation will fail until this is fixed.
        </p>
        {credentials.azureError && (
          <p className="text-xs mb-3 font-mono opacity-70" style={{ color: '#9A3412' }}>{credentials.azureError}</p>
        )}
        <InstructionBox>
          <p className="text-xs font-semibold mb-2" style={{ color: '#78350F' }}>Option 1 — Azure CLI login (easiest):</p>
          <CopyRow command="az login" onCopy={copyCommand} copied={copiedCommand} />
          <p className="text-xs font-semibold mt-3 mb-2" style={{ color: '#78350F' }}>Option 2 — Service principal (add to .env):</p>
          <pre className="text-[11px] font-mono leading-relaxed p-2 rounded" style={{ backgroundColor: '#FEF3C7', color: '#78350F' }}>
{`AZURE_CLIENT_ID=<your-client-id>
AZURE_CLIENT_SECRET=<your-secret>
AZURE_TENANT_ID=<your-tenant-id>`}
          </pre>
          <button
            onClick={checkServer}
            className="flex items-center gap-1.5 text-xs mt-3 px-2.5 py-1 rounded-lg transition-colors"
            style={{ backgroundColor: '#F59E0B', color: '#fff' }}
          >
            <RefreshCw className="w-3 h-3" /> Re-check authentication
          </button>
        </InstructionBox>
      </Banner>
    );
  }

  return null;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Banner({ color, onDismiss, children }: { color: 'amber' | 'red' | 'orange'; onDismiss: () => void; children: React.ReactNode }) {
  const colors = {
    amber:  { bg: '#FEF3C7', border: '#F59E0B', icon: '#FBBF24' },
    red:    { bg: '#FEF2F2', border: '#F87171', icon: '#EF4444' },
    orange: { bg: '#FFF7ED', border: '#FB923C', icon: '#F97316' },
  }[color];

  return (
    <div className="border-b-2 px-6 py-4" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.icon }}>
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">{children}</div>
        <button onClick={onDismiss} className="p-1 rounded hover:bg-black/5 transition-colors" title="Dismiss">
          <X className="w-4 h-4 opacity-50" />
        </button>
      </div>
    </div>
  );
}

function StatusPill({ label, color }: { label: string; color: 'red' | 'orange' }) {
  const bg = color === 'red' ? '#FEE2E2' : '#FEF3C7';
  const text = color === 'red' ? '#991B1B' : '#92400E';
  const dot = color === 'red' ? '#EF4444' : '#F59E0B';
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: bg, color: text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
      {label}
    </span>
  );
}

function InstructionBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
      {children}
    </div>
  );
}

function CopyRow({ command, onCopy, copied }: { command: string; onCopy: (cmd: string) => void; copied: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 text-xs font-mono px-3 py-2 rounded" style={{ backgroundColor: '#FEF3C7', color: '#78350F', border: '1px solid #FDE68A' }}>
        {command}
      </code>
      <button onClick={() => onCopy(command)} className="p-2 rounded hover:bg-yellow-100 transition-colors" title="Copy">
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 opacity-50" />}
      </button>
    </div>
  );
}
