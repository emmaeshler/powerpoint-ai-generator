'use client';

import { useState, useCallback, useRef } from 'react';
import { Slide, generateSlideId, generateComponentId, CalloutBarComponent } from './types';
import { SlideList } from './components/SlideList';
import { SlidePreviewRouter } from './components/SlidePreviewRouter';
import { SlideEditor } from './components/SlideEditor';
import { Button } from './components/ui/button';
import { Download, Save, HelpCircle, Power, Terminal, Search, SquareTerminal, Play, GitBranch } from 'lucide-react';
import { generatePowerPoint } from './utils/pptx-generator';
import { parseClaudeResponse, EMMA_SYSTEM_PROMPT, MINIMAL_SYSTEM_PROMPT } from './utils/claude-generator';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { SetupScreen } from './components/SetupScreen';
import { SessionTimer } from './components/SessionTimer';
import { StopServerModal } from './components/StopServerModal';
import { GitWorkflowModal } from './components/GitWorkflowModal';
import { BridgeServerWarning } from './components/BridgeServerWarning';
import { PPTXPreviewModal } from './components/PPTXPreviewModal';

function App() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [showGitWorkflow, setShowGitWorkflow] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [useUniversalPreview, setUseUniversalPreview] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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
      const updatedSlideData = parseClaudeResponse(response);

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
    systemPrompt: string = MINIMAL_SYSTEM_PROMPT
  ): Promise<string> {
    const AI_ENDPOINT = 'http://localhost:4000/mcp';

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      let finalPrompt = prompt;
      if (referenceImageBase64) {
        finalPrompt = `[REFERENCE IMAGE PROVIDED]\n\nUse the layout structure from the reference slide image as your template. Match the visual organization, hierarchy, and layout approach — but use the content below. Do not copy any text from the reference.\n\n${prompt}`;
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
              system: systemPrompt
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

  function handleConfirmDownload() {
    try {
      generatePowerPoint(slides);
      toast.success('PowerPoint downloaded');
    } catch (error) {
      console.error(error);
      toast.error('Export failed');
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
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Preview mode toggle */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={useUniversalPreview}
                onChange={(e) => setUseUniversalPreview(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">
                Show PPTX Preview (true output)
              </span>
            </label>
            {useUniversalPreview && (
              <span className="text-xs text-gray-500">
                Generates actual PPTX for preview
              </span>
            )}
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            <SlidePreviewRouter
              slide={selectedSlide}
              useUniversalPreview={useUniversalPreview}
            />
          </div>
        </div>

        <div className="w-72 flex-shrink-0">
          <SlideEditor slide={selectedSlide} onUpdateSlide={handleUpdateSlide} />
        </div>
      </div>
    </div>
  );
}

export default App;
