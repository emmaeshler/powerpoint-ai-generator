'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Shield, Terminal, Clock, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, MonitorOff, Copy, Check, ChevronDown, Globe, GitBranch, GitCommit, Upload } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

interface SetupScreenProps {
  onComplete: () => void;
  onStopServer: () => void;
}

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'github-skills', label: 'GitHub Skills' },
  { id: 'security', label: 'Security' },
  { id: 'ready', label: 'Get Started' },
];

export function SetupScreen({ onComplete, onStopServer }: SetupScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [localUrl, setLocalUrl] = useState('');
  const [showWillMessage, setShowWillMessage] = useState(false);
  const [bridgeServerStatus, setBridgeServerStatus] = useState<'checking' | 'running' | 'stopped'>('checking');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  useEffect(() => {
    setLocalUrl(window.location.href.replace(/\/$/, ''));

    // Check bridge server status
    checkBridgeServer();
    const interval = setInterval(checkBridgeServer, 5000);
    return () => clearInterval(interval);
  }, []);

  async function checkBridgeServer() {
    try {
      const response = await fetch('http://localhost:4000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        setBridgeServerStatus('running');
      } else {
        setBridgeServerStatus('stopped');
      }
    } catch (error) {
      setBridgeServerStatus('stopped');
    }
  }

  function copyToClipboard(text: string, commandId: string) {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandId);
    setTimeout(() => setCopiedCommand(null), 2000);
  }

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
        <div className="px-8 py-6 min-h-[340px] max-h-[500px] overflow-y-auto flex flex-col">
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-semibold mb-1" style={{ color: '#1E40AF' }}>
                  ⚡ Quick Start
                </p>
                <p className="text-xs" style={{ color: '#1E40AF' }}>
                  Make sure both servers are running. Click "Server Status" below to check and start them if needed.
                </p>
              </div>

              <Accordion type="single" collapsible className="mb-4">
                <AccordionItem value="server-status" className="border rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" style={{ color: '#00446A' }} />
                      <span className="text-sm font-semibold" style={{ color: '#25282A' }}>
                        Server Status
                      </span>
                      {bridgeServerStatus === 'stopped' && (
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ml-2"
                          style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Action Required
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold mb-2" style={{ color: '#00446A' }}>
                  Server Status
                </p>

                {/* Dev Server */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium" style={{ color: '#4B5563' }}>
                      Development Server
                    </p>
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Running
                    </span>
                  </div>
                  <code
                    className="text-xs font-mono px-2 py-1 rounded block mb-2"
                    style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}
                  >
                    {localUrl || 'http://localhost:5173'}
                  </code>
                  <div>
                    <p className="text-xs mb-1 font-medium" style={{ color: '#6B7280' }}>
                      To start this server:
                    </p>
                    <ol className="text-xs space-y-1 mb-2" style={{ color: '#6B7280' }}>
                      <li>1. Open Terminal (Mac/Linux) or Command Prompt (Windows)</li>
                      <li>2. Navigate to the project folder</li>
                      <li>3. Run this command:</li>
                    </ol>
                    <div className="flex items-center gap-1">
                      <code
                        className="text-xs font-mono px-2 py-1 rounded flex-1"
                        style={{ backgroundColor: '#FFFFFF', color: '#1F2937', border: '1px solid #E5E7EB' }}
                      >
                        npm run dev
                      </code>
                      <button
                        onClick={() => copyToClipboard('npm run dev', 'dev-cmd')}
                        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                        title="Copy command"
                      >
                        {copiedCommand === 'dev-cmd' ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bridge Server */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium" style={{ color: '#4B5563' }}>
                      Claude Bridge Server
                    </p>
                    {bridgeServerStatus === 'checking' ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
                        Checking...
                      </span>
                    ) : bridgeServerStatus === 'running' ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Running
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Not Running
                      </span>
                    )}
                  </div>
                  <code
                    className="text-xs font-mono px-2 py-1 rounded block mb-2"
                    style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}
                  >
                    http://localhost:4000
                  </code>
                  <div className={bridgeServerStatus === 'stopped' ? 'p-2 rounded' : ''} style={bridgeServerStatus === 'stopped' ? { backgroundColor: '#FEF3C7' } : {}}>
                    <p className="text-xs mb-1 font-medium" style={{ color: bridgeServerStatus === 'stopped' ? '#92400E' : '#6B7280' }}>
                      To start this server:
                    </p>
                    <ol className="text-xs space-y-1 mb-2" style={{ color: bridgeServerStatus === 'stopped' ? '#92400E' : '#6B7280' }}>
                      <li>1. Open a <strong>new</strong> Terminal tab (⌘T on Mac)</li>
                      <li>2. Navigate to the same project folder</li>
                      <li>3. Run this command:</li>
                    </ol>
                    <div className="flex items-center gap-1">
                      <code
                        className="text-xs font-mono px-2 py-1 rounded flex-1"
                        style={{ backgroundColor: '#FFFFFF', color: '#1F2937', border: '1px solid #E5E7EB' }}
                      >
                        node claude-bridge-server.js
                      </code>
                      <button
                        onClick={() => copyToClipboard('node claude-bridge-server.js', 'bridge-cmd')}
                        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                        title="Copy command"
                      >
                        {copiedCommand === 'bridge-cmd' ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-600" />
                        )}
                      </button>
                    </div>
                    {bridgeServerStatus === 'stopped' && (
                      <p className="text-xs mt-1.5 font-medium" style={{ color: '#92400E' }}>
                        ⚠️ AI-powered generation won't work until this server is running
                      </p>
                    )}
                  </div>
                </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                This app runs entirely on your local machine. Click "Next" to learn more about how it works.
              </p>
            </div>
          )}

          {/* ─── Step 1: How It Works ─── */}
          {currentStep === 1 && (
            <div className="flex-1 flex flex-col">
              <h2 className="text-xl font-semibold mb-1" style={{ color: '#25282A' }}>
                How It Works
              </h2>
              <p className="text-sm mb-4" style={{ color: '#75787B' }}>
                Here's what powers this app:
              </p>

              <Accordion type="single" collapsible className="space-y-2">
                {/* Local Development Server */}
                <AccordionItem value="local-server" className="border rounded-lg" style={{ backgroundColor: '#EEF4F7' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" style={{ color: '#00446A' }} />
                      <span className="text-sm font-semibold" style={{ color: '#25282A' }}>
                        Local Development Server
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
                      This tool runs a local development server inside your terminal.
                    </p>
                    <ul className="text-xs space-y-1 ml-3 list-disc" style={{ color: '#6B7280' }}>
                      <li>Runs only on your machine (not deployed to the internet)</li>
                      <li>Listens on a local network address like <strong>localhost</strong> or your device's local IP</li>
                      <li>Requests handled directly by your terminal session with access to project files</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Network Access */}
                <AccordionItem value="network-access" className="border rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" style={{ color: '#92400E' }} />
                      <span className="text-sm font-semibold" style={{ color: '#25282A' }}>
                        Network Access
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ml-2"
                        style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                      >
                        Important
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
                      If you're connected to a network (like home Wi-Fi), other devices on <strong>that same network</strong> could connect to this server using your local IP address.
                    </p>
                    <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
                      <strong>This does not expose your machine to the public internet</strong>—only to devices on the same network.
                    </p>
                    <div className="mt-2 px-2 py-1.5 rounded" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
                      <p className="text-xs" style={{ color: '#92400E' }}>
                        ⚠️ This setup is standard for local development and is generally safe on trusted, private networks. <strong>Avoid running it on shared or public Wi-Fi</strong> where unknown devices may be connected.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Auto-Disconnect */}
                <AccordionItem value="auto-disconnect" className="border rounded-lg" style={{ backgroundColor: '#F0F9FF' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: '#E8610A' }} />
                      <span className="text-sm font-semibold" style={{ color: '#25282A' }}>
                        30-Minute Auto-Disconnect
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      For safety, the local server session will automatically disconnect after
                      <strong> 30 minutes of inactivity</strong>. You'll see a countdown timer in the app header.
                      You can always restart by running{' '}
                      <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#F3F4F4', fontSize: '10px' }}>
                        npm start
                      </code>
                      {' '}again.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* ─── Step 2: GitHub Skills ─── */}
          {currentStep === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-5 h-5" style={{ color: '#00446A' }} />
                <h2 className="text-xl font-semibold" style={{ color: '#25282A' }}>
                  Collaborative & Open Source
                </h2>
              </div>
              <p className="text-sm mb-4" style={{ color: '#75787B' }}>
                This app and its skills are community-driven via GitHub.
              </p>

              <Accordion type="single" collapsible className="space-y-2">
                {/* GitHub Sign In */}
                <AccordionItem value="github-signin" className="border rounded-lg" style={{ backgroundColor: '#FAF5FF' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" style={{ color: '#7C3AED' }} />
                      <span className="text-sm font-semibold" style={{ color: '#6B21A8' }}>
                        Sign in to GitHub
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-xs mb-3" style={{ color: '#7C3AED' }}>
                      Connect your GitHub account to access skill repositories and contribute to this open-source project.
                    </p>
                    <a
                      href="https://github.com/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs px-3 py-1.5 rounded font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
                    >
                      Sign in to GitHub →
                    </a>
                  </AccordionContent>
                </AccordionItem>

                {/* App is Open Source */}
                <AccordionItem value="open-source" className="border rounded-lg" style={{ backgroundColor: '#F0F9FF' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: '#0EA5E9' }} />
                      <span className="text-sm font-semibold" style={{ color: '#0C4A6E' }}>
                        This app is open source
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-xs leading-relaxed mb-2" style={{ color: '#075985' }}>
                      The app code is hosted as a public GitHub repository. Anyone can view the code,
                      suggest improvements, or contribute changes. When updates are merged to the main branch,
                      all users can pull the latest version.
                    </p>
                    <p className="text-xs font-medium" style={{ color: '#0C4A6E' }}>
                      Want to improve the welcome UI or add features? Submit a pull request!
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Push to GitHub */}
                <AccordionItem value="git-workflow" className="border rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4" style={{ color: '#D97706' }} />
                      <span className="text-sm font-semibold" style={{ color: '#92400E' }}>
                        How Push to GitHub works
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      <p className="text-xs" style={{ color: '#92400E' }}>
                        The app includes a "Push to GitHub" button in the header that lets you contribute changes:
                      </p>

                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#FEF3C7' }}>
                          <span className="text-xs font-bold" style={{ color: '#92400E' }}>1</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: '#92400E' }}>
                            Edit code in your IDE
                          </p>
                          <p className="text-xs" style={{ color: '#A16207' }}>
                            Make changes to the app files locally (just like we're doing now).
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#FEF3C7' }}>
                          <span className="text-xs font-bold" style={{ color: '#92400E' }}>2</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: '#92400E' }}>
                            Create a new branch
                          </p>
                          <p className="text-xs" style={{ color: '#A16207' }}>
                            Click "Push to GitHub" in the header, create a branch like{' '}
                            <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#FFFFFF', fontSize: '10px' }}>
                              feature/emma-welcome-ui
                            </code>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#FEF3C7' }}>
                          <span className="text-xs font-bold" style={{ color: '#92400E' }}>3</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: '#92400E' }}>
                            Commit and push
                          </p>
                          <p className="text-xs" style={{ color: '#A16207' }}>
                            Write a commit message describing your changes, then click "Commit & Push" to send it to GitHub.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#FEF3C7' }}>
                          <span className="text-xs font-bold" style={{ color: '#92400E' }}>4</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: '#92400E' }}>
                            Others can try your branch
                          </p>
                          <p className="text-xs" style={{ color: '#A16207' }}>
                            Other users can switch to your branch to test your changes. If they want to override it,
                            they'll need to provide a note explaining why.
                          </p>
                        </div>
                      </div>

                      <div className="rounded p-2 mt-2" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <p className="text-xs font-medium" style={{ color: '#92400E' }}>
                          💡 Branches let everyone experiment safely without overwriting the main app!
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Skill Bundles */}
                <AccordionItem value="skill-bundles" className="border rounded-lg" style={{ backgroundColor: '#F0FDF4' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                      <span className="text-sm font-semibold" style={{ color: '#065F46' }}>
                        Skill bundles work the same way
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-xs leading-relaxed mb-3" style={{ color: '#047857' }}>
                      Connect GitHub repositories containing skill bundles (AI prompt templates) to guide slide generation.
                      When skills are updated in the repo, everyone gets the latest prompts automatically.
                    </p>
                    <p className="text-xs font-medium" style={{ color: '#065F46' }}>
                      Connect skill repos via the Skills Modal in the main app.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* ─── Step 3: Security ─── */}
          {currentStep === 3 && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5" style={{ color: '#00446A' }} />
                <h2 className="text-xl font-semibold" style={{ color: '#25282A' }}>
                  Security & Privacy
                </h2>
              </div>
              <p className="text-sm mb-4" style={{ color: '#75787B' }}>
                Important things to know before you start.
              </p>

              <Accordion type="single" collapsible className="space-y-2">
                {/* Terminal Exposure */}
                <AccordionItem value="terminal-exposure" className="border rounded-lg" style={{ backgroundColor: '#FFFBEB' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: '#D97706' }} />
                      <span className="text-sm font-semibold" style={{ color: '#92400E' }}>
                        Your terminal is exposed while the server runs
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-xs" style={{ color: '#A16207' }}>
                      The local development server keeps a process running in your terminal. While active,
                      it serves files from this project directory on your network. Only devices on your
                      local network can access it, but be aware of this if you're on a shared or public Wi-Fi.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Data Privacy */}
                <AccordionItem value="data-privacy" className="border rounded-lg" style={{ backgroundColor: '#EFF6FF' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" style={{ color: '#2563EB' }} />
                      <span className="text-sm font-semibold" style={{ color: '#1E40AF' }}>
                        Data stays on your machine
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-xs" style={{ color: '#3B82F6' }}>
                      Slides, decks, and exports are processed locally. AI requests are sent to generate
                      content but no data is stored externally. Your .env.local credentials never leave your machine.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Stop Server */}
                <AccordionItem value="stop-server" className="border rounded-lg" style={{ backgroundColor: '#F0FDF4' }}>
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <MonitorOff className="w-4 h-4" style={{ color: '#16A34A' }} />
                      <span className="text-sm font-semibold" style={{ color: '#166534' }}>
                        You can stop the server at any time
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-xs mb-2" style={{ color: '#15803D' }}>
                      Use the <strong>"Stop Server"</strong> button in the app header, or press <strong>Ctrl+C</strong> in
                      your terminal. The server also auto-disconnects after 30 minutes of inactivity.
                    </p>
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#F9FAFB', border: '1px solid #BBF7D0' }}>
                      <Terminal className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6B7280' }} />
                      <p className="text-xs" style={{ color: '#6B7280' }}>
                        To stop manually: press{' '}
                        <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#FFFFFF', fontSize: '10px' }}>
                          Ctrl + C
                        </code>
                        {' '}in the terminal where you ran{' '}
                        <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#FFFFFF', fontSize: '10px' }}>
                          npm start
                        </code>
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* ─── Step 4: Ready ─── */}
          {currentStep === 4 && (
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
        {currentStep < 4 && (
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
