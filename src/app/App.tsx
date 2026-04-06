'use client';

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { Slide, generateSlideId, generateComponentId, CalloutBarComponent } from './types';
import { SlideList } from './components/SlideList';
import { SlidePreviewRouter } from './components/SlidePreviewRouter';
import { SlideEditor } from './components/SlideEditor';
import { Button } from './components/ui/button';
import { Download, Save, HelpCircle, Power, Terminal, Search, SquareTerminal, Play, GitBranch, FileOutput, Braces } from 'lucide-react';
import { generatePowerPoint } from './utils/pptx-generator';
import { parseClaudeResponse, EMMA_SYSTEM_PROMPT, MINIMAL_SYSTEM_PROMPT, WILLS_SYSTEM_PROMPT } from './utils/claude-generator';
import { parseSlideResponse } from './utils/slide-parsers';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { SetupScreen } from './components/SetupScreen';
import { SessionTimer } from './components/SessionTimer';
import { StopServerModal } from './components/StopServerModal';
import { GitWorkflowModal } from './components/GitWorkflowModal';
import { BridgeServerWarning } from './components/BridgeServerWarning';
import { PPTXPreviewModal } from './components/PPTXPreviewModal';
import { PreviewModePromptModal } from './components/PreviewModePromptModal';
import { GenerationLoadingView } from './components/GenerationLoadingView';
import { PPTX_TOOLBAR_H } from './components/UniversalPPTXPreview';
import { SKILLS_CONFIG } from './constants/skillsConfig';

function App() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [showGitWorkflow, setShowGitWorkflow] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMode, setPreviewMode] = useState<'pptx' | 'json'>('pptx');
  const [activeBundleId, setActiveBundleId] = useState<string>('emma-bundle');
  const [showPreviewPrompt, setShowPreviewPrompt] = useState(false);
  const [generationState, setGenerationState] = useState<{ isGenerating: boolean; mode: 'slide' | 'deck'; prompt: string } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Resolve preview mode whenever active bundle changes
  useEffect(() => {
    async function resolvePreviewMode() {
      // 1. Check backend preference for this bundle
      try {
        const res = await fetch('http://localhost:4000/api/preferences');
        if (res.ok) {
          const data = await res.json();
          const saved = data.preferences?.[`previewMode_${activeBundleId}`];
          if (saved === 'pptx' || saved === 'json') {
            setPreviewMode(saved);
            return;
          }
        }
      } catch {
        // Bridge server may not be running — fall through
      }

      // 2. Check bundle config default
      const bundle = SKILLS_CONFIG.bundles.find(b => b.id === activeBundleId);
      if (bundle?.defaultPreview) {
        setPreviewMode(bundle.defaultPreview);
        return;
      }

      // 3. No default found — prompt the user
      setShowPreviewPrompt(true);
    }

    resolvePreviewMode();
  }, [activeBundleId]);

  async function handlePreviewModeChosen(mode: 'pptx' | 'json', remember: boolean) {
    setPreviewMode(mode);
    setShowPreviewPrompt(false);

    if (remember) {
      try {
        await fetch('http://localhost:4000/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [`previewMode_${activeBundleId}`]: mode }),
        });
      } catch {
        // Non-critical — preference just won't persist
      }
    }
  }

  const handleStopServer = useCallback(() => {
    setShowStopModal(true);
  }, []);

  const handleConfirmStop = useCallback(async () => {
    setShowStopModal(false);
    setIsSessionExpired(true);

    try {
      await fetch('/__shutdown', { method: 'POST' });
    } catch {
      // Server dying mid-response is expected
    }
  }, []);

  const handleSessionTimeout = useCallback(async () => {
    setIsSessionExpired(true);

    try {
      await fetch('/__shutdown', { method: 'POST' });
    } catch {
      // Server dying mid-response is expected
    }
  }, []);

  const selectedSlide = slides.find((s) => s.id === selectedSlideId) || null;

  function handleDuplicateSlide(id: string) {
    const slideIndex = slides.findIndex((s) => s.id === id);
    if (slideIndex === -1) return;
    const original = slides[slideIndex];
    const newSlotContent: Record<string, any> = {};
    for (const [slotId, comp] of Object.entries(original.slotContent)) {
      newSlotContent[slotId] = { ...JSON.parse(JSON.stringify(comp)), id: generateComponentId() };
    }
    const newSlide: Slide = {
      ...JSON.parse(JSON.stringify(original)),
      id: generateSlideId(),
      slotContent: newSlotContent,
      calloutBar: original.calloutBar
        ? { ...JSON.parse(JSON.stringify(original.calloutBar)), id: generateComponentId() }
        : undefined,
    };
    const newSlides = [...slides];
    newSlides.splice(slideIndex + 1, 0, newSlide);
    setSlides(newSlides);
    setSelectedSlideId(newSlide.id);
    toast.success('Slide duplicated');
  }

  function handleDeleteSlide(id: string) {
    const newSlides = slides.filter((s) => s.id !== id);
    setSlides(newSlides);
    if (selectedSlideId === id) {
      setSelectedSlideId(newSlides[0]?.id || null);
    }
    toast.success('Slide deleted');
  }

  function handleReorderSlide(id: string, direction: 'up' | 'down') {
    const index = slides.findIndex((s) => s.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    setSlides(newSlides);
  }

  function handleUpdateSlide(updatedSlide: Slide) {
    setSlides(slides.map((s) => (s.id === updatedSlide.id ? updatedSlide : s)));
  }

  function handleGenerateSlide(slide: Slide) {
    setSlides([...slides, slide]);
    setSelectedSlideId(slide.id);
    toast.success('Slide generated');
  }

  function handleAddBlankSlide() {
    const slide: Slide = {
      id: generateSlideId(),
      title: 'New Slide | Add components below',
      soWhat: 'New Slide',
      description: 'Add components below',
      templateId: 'full',
      slotContent: {
        main: {
          id: generateComponentId(),
          type: 'bullet_list',
          items: ['Edit this slide using the right panel'],
          bulletColor: 'navy',
        },
      },
    };
    setSlides([...slides, slide]);
    setSelectedSlideId(slide.id);
    toast.success('Blank slide added');
  }

  function handleGenerateSlides(newSlides: Slide[], replace?: boolean) {
    if (replace) {
      setSlides(newSlides);
      setSelectedSlideId(newSlides[0]?.id || null);
      toast.success(`Deck generated with ${newSlides.length} slides`);
    } else {
      setSlides([...slides, ...newSlides]);
      setSelectedSlideId(newSlides[0]?.id || null);
      toast.success(`${newSlides.length} slides added`);
    }
  }

  async function handleEditSlide(slideId: string, editPrompt: string) {
    const slideToEdit = slides.find(s => s.id === slideId);
    if (!slideToEdit) return;

    setIsEditingSlide(true);
    toast.info('Editing slide with AI...');

    try {
      const currentSlideJSON = JSON.stringify({
        title: slideToEdit.title,
        templateId: slideToEdit.templateId,
        slotContent: slideToEdit.slotContent,
        calloutBar: slideToEdit.calloutBar
      }, null, 2);

      const fullPrompt = `You are editing an existing slide. Here is the current slide structure:

${currentSlideJSON}

User's edit request: ${editPrompt}

Please return the updated slide JSON that incorporates the requested changes. Maintain the same structure and only modify what's necessary to fulfill the edit request. Return ONLY the JSON, no markdown formatting.`;

      const response = await handleRequestAIGeneration(fullPrompt);
      const bundleId = slideToEdit.bundleId || 'emma-bundle'; // Use slide's bundle or default to Emma
      const updatedSlideData = parseSlideResponse(response, bundleId);

      const updatedSlide: Slide = {
        ...slideToEdit,
        title: updatedSlideData.title,
        templateId: updatedSlideData.templateId,
        slotContent: updatedSlideData.slotContent,
        calloutBar: updatedSlideData.calloutBar,
      };

      handleUpdateSlide(updatedSlide);
      toast.success('Slide updated successfully');
    } catch (error) {
      console.error('[Edit Slide] Error:', error);
      toast.error('Failed to edit slide', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsEditingSlide(false);
    }
  }

  async function handleRequestAIGeneration(
    prompt: string,
    referenceImageBase64?: string,
    systemPrompt?: string
  ): Promise<string> {
    const AI_ENDPOINT = 'http://localhost:4000/mcp';

    // Use appropriate system prompt based on active bundle
    let defaultSystemPrompt: string | undefined;
    if (activeBundleId === 'emma-bundle') {
      defaultSystemPrompt = MINIMAL_SYSTEM_PROMPT; // Forces JSON output
    } else if (activeBundleId === 'wills-bundle') {
      defaultSystemPrompt = WILLS_SYSTEM_PROMPT; // Guides PptxGenJS code generation
    } else {
      defaultSystemPrompt = undefined; // No override for other bundles
    }
    const finalSystemPrompt = systemPrompt !== undefined ? systemPrompt : defaultSystemPrompt;

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      let finalPrompt = prompt;

      // Add skill file reference for Will's bundle
      if (activeBundleId === 'wills-bundle') {
        const skillFile = '~/.claude/skills/poc-branded-pptx-slide/SKILL.md';
        finalPrompt = `File: ${skillFile}\n\n${prompt}`;
      }

      if (referenceImageBase64) {
        finalPrompt = `[REFERENCE IMAGE PROVIDED]\n\nUse the layout structure from the reference slide image as your template. Match the visual organization, hierarchy, and layout approach — but use the content below. Do not copy any text from the reference.\n\n${finalPrompt}`;
      }

      const response = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'Emmas-PPT-Generator/1.0',
        },
        mode: 'cors',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'ask_claude',
            arguments: {
              prompt: finalPrompt,
              system: finalSystemPrompt
            }
          }
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.result || !data.result.content || !data.result.content[0]) {
        throw new Error('Invalid AI response structure');
      }

      return data.result.content[0].text;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Generation cancelled by user');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error(
            'Cannot reach AI endpoint. Check if the server is running.\n' +
            `Endpoint: ${AI_ENDPOINT}`
          );
        }
        throw error;
      }
      throw new Error('Failed to generate slide: Unknown error');
    } finally {
      abortControllerRef.current = null;
    }
  }

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      toast.info('Generation cancelled');
    }
  }, []);

  function handleShowPreview() {
    if (slides.length === 0) {
      toast.error('No slides to export');
      return;
    }
    setShowPreviewModal(true);
  }

  async function handleConfirmDownload() {
    try {
      // Check if any slides are Will's code-based
      const hasWillsCode = slides.some(slide =>
        slide.content?.pptxCode || slide.content?.rawOutput
      );

      if (hasWillsCode) {
        // Server-side export for Will's code slides
        toast.info('Generating presentation on server...');

        // For now, export each slide separately
        // TODO: Implement multi-slide deck export for Will's format
        for (const slide of slides) {
          if (slide.content?.pptxCode) {
            const { generateWillsPowerPoint } = await import('./utils/pptx-generator');
            await generateWillsPowerPoint(slide.content.pptxCode, `${slide.title || 'Slide'}.pptx`);
          }
        }

        toast.success('PowerPoint(s) downloaded');
      } else {
        // Browser-side export for Emma's format
        generatePowerPoint(slides);
        toast.success('PowerPoint downloaded');
      }
    } catch (error) {
      console.error(error);
      toast.error('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  function handleSaveDeck() {
    const blob = new Blob([JSON.stringify({ slides }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'deck.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Deck saved');
  }

  // Show "server stopped" screen with restart instructions
  if (isSessionExpired) {
    const currentUrl = window.location.origin;

    return (
      <div className="h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#F3F4F4' }}>
        <Toaster />
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          <div className="h-1.5" style={{ backgroundColor: '#DC2626' }} />
          <div className="p-8">
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#FEE2E2' }}
              >
                <Power className="w-7 h-7" style={{ color: '#DC2626' }} />
              </div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: '#25282A' }}>
                Server Stopped
              </h2>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Both servers have been shut down and your terminal is free.
              </p>
            </div>

            <div className="rounded-lg p-5 mb-4" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#92400E' }}>
                ⚠️ You need to start TWO servers
              </p>
              <p className="text-xs" style={{ color: '#92400E' }}>
                This app requires two terminal tabs: one for the web app, one for the Claude bridge server.
              </p>
            </div>

            <div className="rounded-lg p-5" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <p className="text-xs font-semibold mb-4" style={{ color: '#00446A' }}>
                How to restart:
              </p>

              <div className="space-y-5">
                {/* Step 1: Open first terminal */}
                <div className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: '#00446A' }}
                  >
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2" style={{ color: '#25282A' }}>
                      Open Terminal (Tab 1)
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}>
                        <Search className="w-3 h-3 flex-shrink-0" />
                        <span>
                          Press <code className="px-1 py-0.5 bg-gray-200 rounded text-[10px] font-mono">Cmd + Space</code>, type <code className="px-1 py-0.5 bg-gray-200 rounded text-[10px] font-mono">Terminal</code>
                        </span>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Navigate to project folder:</p>
                        <code
                          className="block text-xs font-mono px-3 py-2 rounded"
                          style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}
                        >
                          cd ~/Documents/Powerpoint-App-main
                        </code>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Start the dev server:</p>
                        <code
                          className="block text-xs font-mono px-3 py-2 rounded"
                          style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}
                        >
                          npm run dev
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Open second terminal */}
                <div className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: '#00446A' }}
                  >
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2" style={{ color: '#25282A' }}>
                      Open New Terminal Tab (Tab 2)
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}>
                        <Terminal className="w-3 h-3 flex-shrink-0" />
                        <span>
                          In Terminal, press <code className="px-1 py-0.5 bg-gray-200 rounded text-[10px] font-mono">Cmd + T</code> for new tab
                        </span>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Navigate again (same folder):</p>
                        <code
                          className="block text-xs font-mono px-3 py-2 rounded"
                          style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}
                        >
                          cd ~/Documents/Powerpoint-App-main
                        </code>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Start the Claude bridge server:</p>
                        <code
                          className="block text-xs font-mono px-3 py-2 rounded"
                          style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}
                        >
                          node claude-bridge-server.js
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Find the URL */}
                <div className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: '#00446A' }}
                  >
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2" style={{ color: '#25282A' }}>
                      Find the localhost URL
                    </p>
                    <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
                      In Terminal Tab 1, look for a line like this:
                    </p>
                    <code
                      className="block text-xs font-mono px-3 py-2 rounded mb-2"
                      style={{ backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}
                    >
                      ➜  Local:   http://localhost:5173/
                    </code>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      The port number might be different (5174, 5175, etc.) if 5173 is busy.
                    </p>
                    {currentUrl !== 'null' && currentUrl !== window.location.origin && (
                      <div className="mt-2 p-2 rounded" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: '#1E40AF' }}>
                          💡 Your URL was:
                        </p>
                        <code className="text-xs font-mono" style={{ color: '#1E40AF' }}>
                          {currentUrl}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 4: Open browser */}
                <div className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: '#00446A' }}
                  >
                    4
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1" style={{ color: '#25282A' }}>
                      Open in browser
                    </p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      Copy the localhost URL from Terminal Tab 1 and paste it into your browser.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-3 mt-4" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p className="text-xs" style={{ color: '#166534' }}>
                ✅ Both servers running? The bridge server should say "Server is running on http://localhost:4000" in Tab 2.
              </p>
            </div>

            <p className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
              You can close this tab once you've started both servers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show setup screen for first-time users
  if (!hasCompletedSetup) {
    return (
      <>
        <Toaster />
        <SetupScreen
          onComplete={() => setHasCompletedSetup(true)}
          onStopServer={handleStopServer}
        />
        <StopServerModal
          isOpen={showStopModal}
          onClose={() => setShowStopModal(false)}
          onConfirm={handleConfirmStop}
        />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F3F4F4' }}>
      <Toaster />
      <StopServerModal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        onConfirm={handleConfirmStop}
      />
      <GitWorkflowModal
        isOpen={showGitWorkflow}
        onClose={() => setShowGitWorkflow(false)}
      />
      <PPTXPreviewModal
        slides={slides}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirmDownload={handleConfirmDownload}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs" style={{ backgroundColor: '#00446A' }}>
            EE
          </div>
          <div>
            <h1 className="text-lg" style={{ color: '#25282A' }}>Emma's Awesome PPT Generator</h1>
            <p className="text-[11px]" style={{ color: '#75787B' }}>Grid Layout Slide Builder</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SessionTimer
            timeoutMinutes={30}
            onTimeout={handleSessionTimeout}
            onStopServer={handleStopServer}
          />

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <Button variant="outline" size="sm" onClick={() => setHasCompletedSetup(false)}>
            <HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Setup Guide
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowGitWorkflow(true)}>
            <GitBranch className="w-3.5 h-3.5 mr-1.5" /> Push to GitHub
          </Button>

          <Button size="sm" onClick={handleShowPreview} className="text-white" style={{ backgroundColor: '#00446A' }}>
            <Search className="w-3.5 h-3.5 mr-1.5" /> Preview & Export
          </Button>
        </div>
      </header>

      {/* Bridge Server Warning */}
      <BridgeServerWarning />

      {/* Preview mode prompt modal */}
      <PreviewModePromptModal
        isOpen={showPreviewPrompt}
        bundleName={SKILLS_CONFIG.bundles.find(b => b.id === activeBundleId)?.name ?? activeBundleId}
        onChoose={handlePreviewModeChosen}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-60 flex-shrink-0">
          <SlideList
            slides={slides}
            selectedSlideId={selectedSlideId}
            onSelectSlide={setSelectedSlideId}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onReorderSlide={handleReorderSlide}
            onGenerateSlide={handleGenerateSlide}
            onAddBlankSlide={handleAddBlankSlide}
            onGenerateSlides={handleGenerateSlides}
            onRequestAIGeneration={handleRequestAIGeneration}
            onStopGeneration={handleStopGeneration}
            onEditSlide={handleEditSlide}
            isEditingSlide={isEditingSlide}
            onBundleChange={setActiveBundleId}
            onGeneratingChange={setGenerationState}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Preview mode toggle */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-200" style={{ minWidth: 0 }}>
              <button
                onClick={() => setPreviewMode('pptx')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: previewMode === 'pptx' ? '#00446A' : 'transparent',
                  color: previewMode === 'pptx' ? '#fff' : '#6B7280',
                }}
              >
                <FileOutput className="w-3.5 h-3.5" />
                PPTX Output
              </button>
              <button
                onClick={() => setPreviewMode('json')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: previewMode === 'json' ? '#6B21A8' : 'transparent',
                  color: previewMode === 'json' ? '#fff' : '#6B7280',
                }}
              >
                <Braces className="w-3.5 h-3.5" />
                JSON View
              </button>
            </div>
            <span className="text-[11px] text-gray-400 ml-3">
              {previewMode === 'pptx' ? 'True PPTX render' : 'Raw slide data'}
            </span>
          </div>

          {/* Preview area — consistent sizing with scrolling */}
          <div className="flex-1 min-h-0 overflow-auto p-6 flex items-center justify-center">
            {generationState?.isGenerating ? (
              <GenerationLoadingView
                mode={generationState.mode}
                prompt={generationState.prompt}
              />
            ) : previewMode === 'json' ? (
              selectedSlide ? (
                selectedSlide.bundleId === 'emma-bundle' ? (
                  <div className="w-full max-w-3xl">
                    <pre
                      className="text-xs rounded-xl p-5 overflow-auto leading-relaxed"
                      style={{
                        backgroundColor: '#1E1B4B',
                        color: '#C4B5FD',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        maxHeight: 'calc(100vh - 200px)',
                      }}
                    >
                      {JSON.stringify(selectedSlide, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl">
                    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-8">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Braces className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            JSON View is for Emma's Bundle
                          </h3>
                          <p className="text-sm text-blue-800 mb-4">
                            You're viewing a slide from <strong>{SKILLS_CONFIG.bundles.find(b => b.id === selectedSlide.bundleId)?.name || selectedSlide.bundleId}</strong>.
                            JSON editing is only available for Emma's bundle, which uses a structured JSON format for slide composition.
                          </p>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1.5">To edit slides with JSON:</p>
                              <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                                <li>Select skills from <strong>Emma's Bundle</strong> in the sidebar</li>
                                <li>Generate a slide using Emma's layout system</li>
                                <li>Use the JSON editor on the right to customize</li>
                              </ol>
                            </div>
                            <div className="pt-3 border-t border-blue-200">
                              <p className="text-sm font-medium text-blue-900 mb-1.5">For this slide:</p>
                              <button
                                onClick={() => setPreviewMode('pptx')}
                                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                Switch to PPTX Output →
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-gray-400 text-sm">No slide selected</div>
              )
            ) : (
              <div
                className="rounded-lg overflow-hidden shadow-lg"
                style={{
                  width: 'min(95%, calc((100vh - 200px) * 16 / 9))',
                  maxWidth: '95%',
                  aspectRatio: '16/9'
                }}
              >
                <SlidePreviewRouter
                  slide={selectedSlide}
                  useUniversalPreview={previewMode === 'pptx'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Only show JSON editor for Emma's bundle */}
        {selectedSlide?.bundleId === 'emma-bundle' && (
          <div className="w-72 flex-shrink-0">
            <SlideEditor slide={selectedSlide} onUpdateSlide={handleUpdateSlide} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
