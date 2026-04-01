'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Shield, Terminal, Clock, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, MonitorOff } from 'lucide-react';

interface SetupScreenProps {
  onComplete: () => void;
  onStopServer: () => void;
}

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'security', label: 'Security' },
  { id: 'ready', label: 'Get Started' },
];

export function SetupScreen({ onComplete, onStopServer }: SetupScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [localUrl, setLocalUrl] = useState('');
  const [showWillMessage, setShowWillMessage] = useState(false);

  useEffect(() => {
    setLocalUrl(window.location.href.replace(/\/$/, ''));
  }, []);

  function nextStep() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#F3F4F4' }}>
      {/* Card container */}
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden"
        style={{ border: '1px solid #E5E7EB' }}
      >
        {/* Top accent bar */}
        <div className="h-1.5" style={{ background: 'linear-gradient(to right, #00446A, #1B6B7B, #E8610A)' }} />

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-8 pt-6 pb-2">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: idx <= currentStep ? '#00446A' : '#E5E7EB',
                    color: idx <= currentStep ? '#FFFFFF' : '#9CA3AF',
                  }}
                >
                  {idx < currentStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className="text-xs font-medium hidden sm:inline"
                  style={{ color: idx <= currentStep ? '#25282A' : '#9CA3AF' }}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className="w-8 h-px mx-3"
                  style={{ backgroundColor: idx < currentStep ? '#00446A' : '#E5E7EB' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="px-8 py-6 min-h-[340px] flex flex-col">
          {/* ─── Step 0: Welcome ─── */}
          {currentStep === 0 && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: '#00446A' }}
                >
                  EE
                </div>
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: '#25282A' }}>
                    Welcome to Emma's Awesome PPT Generator
                  </h2>
                  <p className="text-sm" style={{ color: '#75787B' }}>
                    AI-Powered Presentation Builder
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: '#4B5563' }}>
                Emma's Awesome PPT Generator helps you create professional PowerPoint presentations using AI.
                Describe what you want, and it generates polished slides with charts, tables,
                and layouts — ready to export as .pptx files.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4" style={{ border: '1px solid #E5E7EB' }}>
                <p className="text-xs font-medium mb-2" style={{ color: '#00446A' }}>
                  Your local server is running at:
                </p>
                <div className="flex items-center gap-2">
                  <code
                    className="text-sm font-mono px-3 py-1.5 rounded"
                    style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}
                  >
                    {localUrl || 'http://localhost:5173'}
                  </code>
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Running
                  </span>
                </div>
              </div>

              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                This app runs entirely on your machine. Let's walk through how it works and a few important things to know.
              </p>
            </div>
          )}

          {/* ─── Step 1: How It Works ─── */}
          {currentStep === 1 && (
            <div className="flex-1 flex flex-col">
              <h2 className="text-xl font-semibold mb-1" style={{ color: '#25282A' }}>
                How It Works
              </h2>
              <p className="text-sm mb-5" style={{ color: '#75787B' }}>
                Here's what powers this app:
              </p>

              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                <div className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#EEF4F7' }}
                  >
                    <Terminal className="w-4 h-4" style={{ color: '#00446A' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#25282A' }}>
                      Local Development Server
                    </p>
                    <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
                      This tool runs a local development server inside your terminal.
                    </p>
                    <ul className="text-xs space-y-1 ml-3 list-disc" style={{ color: '#6B7280' }}>
                      <li>Runs only on your machine (not deployed to the internet)</li>
                      <li>Listens on a local network address like <strong>localhost</strong> or your device's local IP</li>
                      <li>Requests handled directly by your terminal session with access to project files</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#FEF3C7' }}
                  >
                    <Shield className="w-4 h-4" style={{ color: '#92400E' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#25282A' }}>
                      Network Access
                    </p>
                    <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
                      If you're connected to a network (like home Wi-Fi), other devices on <strong>that same network</strong> could connect to this server using your local IP address.
                    </p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      <strong>This does not expose your machine to the public internet</strong>—only to devices on the same network.
                    </p>
                    <div className="mt-2 px-2 py-1.5 rounded" style={{ backgroundColor: '#FEF3C7' }}>
                      <p className="text-xs" style={{ color: '#92400E' }}>
                        ⚠️ This setup is standard for local development and is generally safe on trusted, private networks. <strong>Avoid running it on shared or public Wi-Fi</strong> where unknown devices may be connected.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#EEF4F7' }}
                  >
                    <Clock className="w-4 h-4" style={{ color: '#E8610A' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#25282A' }}>
                      30-Minute Auto-Disconnect
                    </p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      For safety, the local server session will automatically disconnect after
                      <strong> 30 minutes of inactivity</strong>. You'll see a countdown timer in the app header.
                      You can always restart by running <code className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">npm start</code> again.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Security ─── */}
          {currentStep === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5" style={{ color: '#00446A' }} />
                <h2 className="text-xl font-semibold" style={{ color: '#25282A' }}>
                  Security & Privacy
                </h2>
              </div>
              <p className="text-sm mb-5" style={{ color: '#75787B' }}>
                Important things to know before you start.
              </p>

              <div className="space-y-3 flex-1">
                <div className="rounded-lg p-3.5" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#D97706' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#92400E' }}>
                        Your terminal is exposed while the server runs
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#A16207' }}>
                        The local development server keeps a process running in your terminal. While active,
                        it serves files from this project directory on your network. Only devices on your
                        local network can access it, but be aware of this if you're on a shared or public Wi-Fi.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-3.5" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#2563EB' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1E40AF' }}>
                        Data stays on your machine
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#3B82F6' }}>
                        Slides, decks, and exports are processed locally. AI requests are sent to generate
                        content but no data is stored externally. Your .env.local credentials never leave your machine.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-3.5" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div className="flex items-start gap-2">
                    <MonitorOff className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#16A34A' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#166534' }}>
                        You can stop the server at any time
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#15803D' }}>
                        Use the <strong>"Stop Server"</strong> button in the app header, or press <strong>Ctrl+C</strong> in
                        your terminal. The server also auto-disconnects after 30 minutes of inactivity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <Terminal className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6B7280' }} />
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  To stop the server manually from your terminal, press <code className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">Ctrl + C</code> in the window where you ran <code className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">npm start</code>
                </p>
              </div>
            </div>
          )}

          {/* ─── Step 3: Ready ─── */}
          {currentStep === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4"
                style={{ backgroundColor: '#00446A' }}
              >
                EE
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: '#25282A' }}>
                You're all set!
              </h2>
              <p className="text-sm mb-6 max-w-md" style={{ color: '#6B7280' }}>
                Start creating slides by typing a prompt in the left panel. The app will use AI
                to generate polished presentation slides you can edit and export.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 w-full max-w-sm" style={{ border: '1px solid #E5E7EB' }}>
                <p className="text-xs font-medium mb-2" style={{ color: '#25282A' }}>Quick recap:</p>
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#4B5563' }}>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16A34A' }} />
                    Server running at {localUrl || 'http://localhost:5173'}
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#4B5563' }}>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16A34A' }} />
                    Auto-disconnects after 30 min of inactivity
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#4B5563' }}>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16A34A' }} />
                    Use "Stop Server" in the header to shut down
                  </div>
                </div>
              </div>

              <Button
                onClick={onComplete}
                className="text-white px-8 py-2.5 text-sm"
                style={{ backgroundColor: '#00446A' }}
              >
                Launch App
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {currentStep < 3 && (
          <div className="px-8 pb-6 flex items-center justify-between">
            <div>
              {currentStep > 0 && (
                <Button variant="ghost" size="sm" onClick={prevStep} style={{ color: '#6B7280' }}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWillMessage(true)}
                style={{ color: '#9CA3AF' }}
              >
                Skip
              </Button>
              <Button
                onClick={nextStep}
                className="text-white px-5"
                size="sm"
                style={{ backgroundColor: '#00446A' }}
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Stop server option at the bottom */}
        <div
          className="px-8 py-3 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}
        >
          <button
            onClick={onStopServer}
            className="flex items-center gap-1.5 text-xs hover:underline cursor-pointer"
            style={{ color: '#991B1B', background: 'none', border: 'none' }}
          >
            <MonitorOff className="w-3 h-3" />
            Stop exposing terminal & shut down server
          </button>
        </div>
      </div>

      {/* Version info */}
      <p className="mt-4 text-xs" style={{ color: '#9CA3AF' }}>
        Emma's Awesome PPT Generator v0.0.1
      </p>

      {/* Will Hayes skip message */}
      {showWillMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl text-center" style={{ border: '1px solid #E5E7EB' }}>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#FEF2F2' }}
            >
              <AlertTriangle className="w-7 h-7" style={{ color: '#DC2626' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#25282A' }}>
              Will Hayes, please read this first!
            </h3>
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
              This setup guide explains how the app works, important security info, and how to stop the server. Please go through each step before using the app.
            </p>
            <div className="flex flex-col gap-2 items-center">
              <Button
                onClick={() => setShowWillMessage(false)}
                className="text-white px-6"
                style={{ backgroundColor: '#00446A' }}
              >
                OK, I'll read it
              </Button>
              <button
                onClick={() => { setShowWillMessage(false); onComplete(); }}
                className="text-xs hover:underline cursor-pointer"
                style={{ color: '#9CA3AF', background: 'none', border: 'none' }}
              >
                Skip anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
