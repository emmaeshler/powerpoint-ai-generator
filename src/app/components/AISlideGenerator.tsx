'use client';

import { useState, useRef, useEffect } from 'react';
import { Slide, generateSlideId, generateComponentId } from '../types';
import { Button } from './ui/button';
import { Sparkles, Loader2, AlertCircle, RefreshCw, Layers, StickyNote, ChevronDown, Image as ImageIcon, Users, Briefcase, HelpCircle } from 'lucide-react';
import { smartParsePrompt } from '../utils/smart-parser';
import { parseClaudeResponse, parseClaudeDeckResponse } from '../utils/claude-generator';
import { DeckBriefingModal } from './DeckBriefingModal';
import { SkillsModal } from './SkillsModal';
import { REFERENCE_SLIDES } from '../constants/referenceSlides';
import { SKILLS_CONFIG } from '../constants/skillsConfig';
import { SkillsSelection } from '../types/skills';

type GenerateMode = 'slide' | 'deck';

const AUDIENCES = [
  { id: 'executive', label: 'Executive / C-Suite', description: 'High-level, strategic, minimal detail' },
  { id: 'team', label: 'Team / Internal', description: 'Collaborative, detailed, action-oriented' },
  { id: 'client', label: 'Client / External', description: 'Polished, persuasive, results-focused' },
  { id: 'board', label: 'Board of Directors', description: 'Governance-focused, data-backed, concise' },
  { id: 'investor', label: 'Investor / Stakeholder', description: 'ROI-focused, growth narrative, metrics-heavy' },
];

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => { clearTimeout(timeoutRef.current); setShow(true); }}
      onMouseLeave={() => { timeoutRef.current = setTimeout(() => setShow(false), 150); }}
    >
      <HelpCircle className="w-3 h-3 cursor-help" style={{ color: '#9CA3AF' }} />
      {show && (
        <span
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-md text-[11px] leading-tight whitespace-normal w-48 text-center shadow-lg pointer-events-none"
          style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}
        >
          {text}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1F2937' }}
          />
        </span>
      )}
    </span>
  );
}

interface AISlideGeneratorProps {
  onGenerateSlide: (slide: Slide) => void;
  onGenerateSlides?: (slides: Slide[]) => void;
  onRequestAIGeneration?: (prompt: string, referenceImageBase64?: string) => Promise<string>;
}

export function AISlideGenerator({ onGenerateSlide, onGenerateSlides, onRequestAIGeneration }: AISlideGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [mode, setMode] = useState<GenerateMode>('slide');
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [selectedReference, setSelectedReference] = useState<string | undefined>(undefined);
  const [showReferenceDropdown, setShowReferenceDropdown] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<string | undefined>(undefined);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showAddSkillGuide, setShowAddSkillGuide] = useState(false);
  const [userDefaultBundle, setUserDefaultBundle] = useState<string>('emma-bundle');

  const selectedSlide = REFERENCE_SLIDES.find(s => s.id === selectedReference);
  const selectedAudienceObj = AUDIENCES.find(a => a.id === selectedAudience);

  // Load skills selection from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem('skillsSelection');
    if (cached) {
      try {
        const data: SkillsSelection = JSON.parse(cached);
        setSelectedSkills(data.selectedSkills);
        if (data.defaultBundle) setUserDefaultBundle(data.defaultBundle);
      } catch (e) {
        console.error('Failed to load skills selection:', e);
      }
    } else {
      // First time: select default bundle's skills
      const defaultBundle = SKILLS_CONFIG.bundles.find(b => b.id === userDefaultBundle);
      if (defaultBundle) setSelectedSkills(defaultBundle.skills);
    }
  }, []);

  // Save skills selection to localStorage when it changes
  useEffect(() => {
    if (selectedSkills.length > 0) {
      const data: SkillsSelection = {
        selectedSkills,
        lastModified: Date.now(),
        defaultBundle: userDefaultBundle,
      };
      localStorage.setItem('skillsSelection', JSON.stringify(data));
    }
  }, [selectedSkills, userDefaultBundle]);

  /** Enrich a user prompt with audience & skill context */
  function enrichPrompt(basePrompt: string): string {
    const parts = [basePrompt];
    if (selectedAudienceObj) {
      parts.push(`\nAUDIENCE: ${selectedAudienceObj.label} — ${selectedAudienceObj.description}. Tailor the tone, detail level, and framing for this audience.`);
    }
    if (selectedSkills.length > 0) {
      const selectedSkillFiles = selectedSkills
        .map(skillId => SKILLS_CONFIG.skills.find(s => s.id === skillId))
        .filter(Boolean);

      parts.push(`\nREFERENCE SKILL FILES (${selectedSkillFiles.length}):`);
      selectedSkillFiles.forEach(skill => {
        parts.push(`- ${skill!.label} (${skill!.file}): ${skill!.description}`);
      });
      parts.push('\nPrioritize the rules and patterns defined in these skill files when generating the slide.');
    }
    return parts.join('');
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // If deck mode, open briefing modal instead of generating directly
    if (mode === 'deck') {
      setShowBriefingModal(true);
      return;
    }

    // For single slide mode, generate directly
    setIsGenerating(true);
    setError(null);
    setFallbackUsed(false);
    await handleGenerateSlide();
    setIsGenerating(false);
  };

  const handleBriefingComplete = async (enrichedPrompt: string, referenceImageBase64?: string) => {
    setShowBriefingModal(false);
    setIsGenerating(true);
    setError(null);
    setFallbackUsed(false);

    // Use enriched prompt for deck generation with optional reference image
    await handleGenerateDeck(enrichedPrompt, referenceImageBase64);

    setIsGenerating(false);
  };

  const handleGenerateSlide = async () => {
    if (onRequestAIGeneration) {
      try {
        // Use the base64 image from the selected reference slide
        let referenceImageBase64: string | undefined;
        const selectedRefSlide = REFERENCE_SLIDES.find(s => s.id === selectedReference);

        if (selectedRefSlide?.imageBase64) {
          referenceImageBase64 = selectedRefSlide.imageBase64;
        }

        const response = await onRequestAIGeneration(enrichPrompt(prompt.trim()), referenceImageBase64);
        const slide = parseClaudeResponse(response);
        slide.prompt = prompt.trim();
        onGenerateSlide(slide);
        setPrompt('');
      } catch (err) {
        console.warn('[AISlideGenerator] AI unreachable, falling back to local parser:', err);
        const slide = smartParsePrompt(prompt.trim());
        slide.prompt = prompt.trim();
        onGenerateSlide(slide);
        setPrompt('');
        setFallbackUsed(true);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        const isNetwork = msg.includes('Failed to fetch') || msg.includes('AI request timed out') || msg.includes('Cannot reach');
        setError(
          isNetwork
            ? 'AI endpoint unreachable — slide was generated with the local parser instead. Check that the server is running.'
            : `AI error (local fallback used): ${msg}`
        );
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const slide = smartParsePrompt(prompt.trim());
      slide.prompt = prompt.trim();
      onGenerateSlide(slide);
      setPrompt('');
    }
  };

  const handleGenerateDeck = async (enrichedPrompt: string, referenceImageBase64?: string) => {
    const groupId = `deck-${Date.now()}`;
    const groupLabel = prompt.trim().slice(0, 50) + (prompt.trim().length > 50 ? '…' : '');
    const originalPrompt = prompt.trim();

    const stampGroup = (slides: Slide[]) =>
      slides.map(s => ({ ...s, deckGroupId: groupId, deckGroupLabel: groupLabel, prompt: originalPrompt }));

    if (onRequestAIGeneration) {
      try {
        const deckInstructions = `IMPORTANT: The user wants a FULL DECK (multiple slides). Return a JSON array of slide objects.
Each slide follows the exact same format as a single slide.

Return ONLY a JSON array like:
[
  { "title": "So What | Description", "templateId": "...", "slotContent": {...}, "calloutBar": {...} },
  { "title": "So What | Description", "templateId": "...", "slotContent": {...} }
]

Guidelines for deck creation:
- Start with a title/agenda slide
- Include 4-8 slides depending on topic complexity
- End with a summary or next-steps slide
- Each slide should have a distinct, opinionated "So What" claim
- Vary template choices across the deck for visual interest
- Use pricing/consulting context where appropriate

USER REQUEST:
${enrichPrompt(enrichedPrompt)}

Remember: Return ONLY the JSON array. No explanation, no markdown code blocks.`;

        const response = await onRequestAIGeneration(deckInstructions, referenceImageBase64);
        const slides = stampGroup(parseClaudeDeckResponse(response));
        if (onGenerateSlides) {
          onGenerateSlides(slides);
        } else {
          slides.forEach(s => onGenerateSlide(s));
        }
        setPrompt('');
      } catch (err) {
        console.warn('[AISlideGenerator] AI unreachable for deck, falling back to local multi-slide:', err);
        const slides = stampGroup(generateLocalDeck(prompt.trim()));
        if (onGenerateSlides) {
          onGenerateSlides(slides);
        } else {
          slides.forEach(s => onGenerateSlide(s));
        }
        setPrompt('');
        setFallbackUsed(true);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(`AI unreachable — deck generated with local parser: ${msg}`);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const slides = stampGroup(generateLocalDeck(prompt.trim()));
      if (onGenerateSlides) {
        onGenerateSlides(slides);
      } else {
        slides.forEach(s => onGenerateSlide(s));
      }
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: '#00446A' }} />
          <h3 className="text-sm" style={{ color: '#25282A' }}>Create a single slide or a full deck?</h3>
        </div>
      </div>

      {/* Mode toggle: Slide vs Deck */}
      <div className="mb-2 flex rounded-lg overflow-hidden border" style={{ borderColor: '#D0D3D4' }}>
        <button
          onClick={() => setMode('slide')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: mode === 'slide' ? '#00446A' : '#fff',
            color: mode === 'slide' ? '#fff' : '#75787B',
          }}
        >
          <StickyNote className="w-3.5 h-3.5" />
          Single Slide
        </button>
        <button
          onClick={() => setMode('deck')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors border-l"
          style={{
            backgroundColor: mode === 'deck' ? '#00446A' : '#fff',
            color: mode === 'deck' ? '#fff' : '#75787B',
            borderColor: '#D0D3D4',
          }}
        >
          <Layers className="w-3.5 h-3.5" />
          Full Deck
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={mode === 'slide'
          ? `Describe your slide in natural language...\n\ne.g. "Show our Q1-Q4 revenue growth from $1.2M to $2.4M with a 15% target line, plus key insights"`
          : `Describe the full deck you want to create...\n\ne.g. "Build a pricing strategy review deck covering market analysis, competitive benchmarking, price optimization results, and next steps"`
        }
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 resize-none"
        style={{ '--tw-ring-color': '#1B6B7B' } as any}
        rows={4}
        disabled={isGenerating}
      />

      {/* Audience & Skill selectors — stacked */}
      <div className="mt-2 space-y-2">
        {/* Audience selector */}
        <div className="relative">
          <button
            onClick={() => { setShowAudienceDropdown(!showAudienceDropdown); setShowSkillDropdown(false); setShowReferenceDropdown(false); }}
            disabled={isGenerating}
            className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B7B] focus:border-transparent transition-colors text-xs"
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span style={{ color: selectedAudienceObj ? '#002F4A' : '#75787B' }}>
                {selectedAudienceObj ? selectedAudienceObj.label : 'Audience'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip text="Who will see this presentation? This tailors the tone, level of detail, and framing of your slides." />
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showAudienceDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showAudienceDropdown && (
            <div className="absolute z-40 left-0 right-0 mt-1 p-1.5 border border-gray-200 rounded-md bg-white shadow-lg max-h-52 overflow-y-auto">
              <button
                onClick={() => { setSelectedAudience(undefined); setShowAudienceDropdown(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-gray-50 transition-colors"
                style={{ color: !selectedAudience ? '#00446A' : '#4B5563', fontWeight: !selectedAudience ? 600 : 400 }}
              >
                None (default)
              </button>
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setSelectedAudience(a.id); setShowAudienceDropdown(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-gray-50 transition-colors"
                  style={{ backgroundColor: selectedAudience === a.id ? '#EEF4F7' : undefined }}
                >
                  <div className="text-xs font-medium" style={{ color: '#25282A' }}>{a.label}</div>
                  <div className="text-[10px]" style={{ color: '#9CA3AF' }}>{a.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Skill selector - modal trigger */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSkillsModal(true);
              setShowAudienceDropdown(false);
              setShowReferenceDropdown(false);
            }}
            disabled={isGenerating}
            className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B7B] focus:border-transparent transition-colors text-xs"
          >
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-gray-400" />
              <span style={{ color: selectedSkills.length > 0 ? '#002F4A' : '#75787B' }}>
                {selectedSkills.length > 0
                  ? `${selectedSkills.length} Skill${selectedSkills.length === 1 ? '' : 's'}`
                  : 'Select Skills'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip text="Choose which design skill files the AI references when generating your slides. You can select multiple skills from different bundles." />
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </button>
        </div>
      </div>

      {/* Reference Layout Selection - Only for Single Slide mode */}
      {mode === 'slide' && (
        <div className="mt-2">
          {/* Dropdown Trigger */}
          <button
            onClick={() => { setShowReferenceDropdown(!showReferenceDropdown); setShowAudienceDropdown(false); setShowSkillDropdown(false); }}
            disabled={isGenerating}
            className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B7B] focus:border-transparent transition-colors text-xs"
          >
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
              <span style={{ color: selectedSlide ? '#002F4A' : '#75787B' }}>
                {selectedSlide ? `Reference: ${selectedSlide.label}` : 'Reference layout'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip text="Pick a reference slide layout to guide the visual structure of your generated slide." />
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showReferenceDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Dropdown Panel */}
          {showReferenceDropdown && (
            <div className="mt-1.5 p-2 border border-gray-200 rounded-md bg-gray-50 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {/* None Option */}
                <button
                  onClick={() => {
                    setSelectedReference(undefined);
                    setShowReferenceDropdown(false);
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all hover:shadow-sm"
                  style={{
                    borderColor: !selectedReference ? '#E8610A' : '#d1d5db',
                    backgroundColor: 'white'
                  }}
                >
                  <div
                    className="w-full aspect-video rounded bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-medium"
                    style={{
                      border: !selectedReference ? '2px solid #E8610A' : '1px solid #e5e7eb'
                    }}
                  >
                    None
                  </div>
                  <div className="text-[10px] font-medium" style={{ color: '#002F4A' }}>
                    Default
                  </div>
                </button>

                {/* Reference Slide Options */}
                {REFERENCE_SLIDES.map((slide) => (
                  <button
                    key={slide.id}
                    onClick={() => {
                      setSelectedReference(slide.id);
                      setShowReferenceDropdown(false);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all hover:shadow-sm"
                    style={{
                      borderColor: selectedReference === slide.id ? '#E8610A' : '#d1d5db',
                      backgroundColor: 'white'
                    }}
                  >
                    <div
                      className="w-full aspect-video rounded bg-gray-100 flex items-center justify-center overflow-hidden"
                      style={{
                        border: selectedReference === slide.id ? '2px solid #E8610A' : '1px solid #e5e7eb'
                      }}
                    >
                      {slide.imagePath ? (
                        <img
                          src={slide.imagePath}
                          alt={slide.label}
                          className="w-full h-full object-cover"
                        />
                      ) : slide.imageBase64 ? (
                        <img
                          src={`data:image/png;base64,${slide.imageBase64}`}
                          alt={slide.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400">Preview</span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-medium leading-tight" style={{ color: '#002F4A' }}>
                        {slide.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className={`mt-2 p-2 rounded-md flex items-start gap-2 ${fallbackUsed ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
          {fallbackUsed
            ? <RefreshCw className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          }
          <p className={`text-xs ${fallbackUsed ? 'text-amber-700' : 'text-red-600'}`}>{error}</p>
        </div>
      )}
      {mode === 'deck' && (
        <div className="mt-2 px-2 py-1.5 rounded-md text-[11px] flex items-start gap-1.5" style={{ backgroundColor: '#F0F7FA', color: '#1B6B7B' }}>
          <Layers className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Deck mode generates 4–8 grouped slides appended to your current deck.</span>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Cmd+Enter to generate
        </span>
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          size="sm"
          className="text-white"
          style={{ backgroundColor: mode === 'deck' ? '#1B6B7B' : '#00446A' }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {mode === 'deck' ? 'Building Deck...' : 'Generating...'}
            </>
          ) : (
            <>
              {mode === 'deck' ? <Layers className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {mode === 'deck' ? 'Generate Deck' : 'Generate'}
            </>
          )}
        </Button>
      </div>
      {showBriefingModal && (
        <DeckBriefingModal
          isOpen={showBriefingModal}
          originalPrompt={prompt}
          onClose={() => setShowBriefingModal(false)}
          onComplete={handleBriefingComplete}
        />
      )}

      {/* Skills Selection Modal */}
      {showSkillsModal && (
        <SkillsModal
          isOpen={showSkillsModal}
          onClose={() => setShowSkillsModal(false)}
          selectedSkills={selectedSkills}
          onSelectionChange={(skills) => {
            setSelectedSkills(skills);
            setShowSkillsModal(false);
          }}
          userDefaultBundle={userDefaultBundle}
          onShowGuide={() => setShowAddSkillGuide(true)}
        />
      )}

      {/* Reference Skill File Guide Modal */}
      {showAddSkillGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto" style={{ border: '1px solid #E5E7EB' }}>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5" style={{ color: '#1B6B7B' }} />
              <h3 className="text-base font-semibold" style={{ color: '#25282A' }}>
                Reference Skill Files
              </h3>
            </div>

            <p className="text-sm mb-4" style={{ color: '#4B5563' }}>
              Skill files are design documents that teach the AI how to generate slides. Each file focuses on a different aspect — layout rules, brand guidelines, composition, etc.
            </p>

            {/* How It Works Section */}
            <details className="mb-4 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <summary className="px-3 py-2 cursor-pointer text-xs font-semibold" style={{ color: '#00446A' }}>
                How it works
              </summary>
              <div className="px-3 pb-3 pt-1 text-[11px] space-y-2 max-h-48 overflow-y-auto" style={{ color: '#4B5563' }}>
                <p className="font-medium" style={{ color: '#25282A' }}>Local Development Server</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Runs only on your machine (not on the internet)</li>
                  <li>Listens on localhost or your device's local IP</li>
                  <li>Handled directly by your terminal session</li>
                  <li><strong>Auto-disconnects after 30 minutes of inactivity</strong></li>
                </ul>

                <p className="font-medium pt-2" style={{ color: '#25282A' }}>Network Access</p>
                <p>
                  Other devices on your <strong>same network</strong> (like home Wi-Fi) could connect using your local IP address.
                </p>
                <p className="pt-1">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>⚠</span>
                  {' '}Not exposed to the public internet—only devices on your network. Avoid shared/public Wi-Fi.
                </p>
              </div>
            </details>

            <div className="space-y-3 mb-4">
              <p className="text-xs font-semibold" style={{ color: '#00446A' }}>Current skill files</p>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                {SKILLS_CONFIG.skills.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-start gap-2.5 px-3 py-2"
                    style={{ backgroundColor: idx % 2 === 0 ? '#FAFAFA' : '#fff' }}
                  >
                    <code className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5" style={{ backgroundColor: '#EEF4F7', color: '#00446A' }}>{s.file}</code>
                    <span className="text-[11px]" style={{ color: '#4B5563' }}>{s.description}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                Located in <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#F3F4F6' }}>src/imports/pasted_text/</code>
              </p>
            </div>

            <div className="rounded-lg p-3.5 mb-3" style={{ backgroundColor: '#F0F7FA', border: '1px solid #BAE6FD' }}>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#00446A' }}>How to add a new skill file</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00446A', color: '#fff' }}>1</span>
                  <p className="text-xs" style={{ color: '#4B5563' }}>
                    Create a new <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#E5E7EB' }}>.md</code> or <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#E5E7EB' }}>.txt</code> file in <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#E5E7EB' }}>src/imports/pasted_text/</code> describing your design rules.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00446A', color: '#fff' }}>2</span>
                  <p className="text-xs" style={{ color: '#4B5563' }}>
                    Add an entry to the <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#E5E7EB' }}>skills</code> array in <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#E5E7EB' }}>src/app/constants/skillsConfig.ts</code> and assign it to a bundle.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00446A', color: '#fff' }}>3</span>
                  <p className="text-xs" style={{ color: '#4B5563' }}>
                    Restart the server with <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#E5E7EB' }}>npm start</code> — your new skill file will appear in the dropdown.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-3" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p className="text-xs" style={{ color: '#92400E' }}>
                <strong>Or use Claude Code:</strong> Open your terminal, run <code className="px-1 py-0.5 bg-yellow-100 rounded text-[10px]">claude</code> in the project folder, and ask it to create a new skill file for you. It will handle both the file and the dropdown entry.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={() => setShowAddSkillGuide(false)}
                className="text-white px-5"
                size="sm"
                style={{ backgroundColor: '#00446A' }}
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Generate a simple multi-slide deck using the local parser */
function generateLocalDeck(prompt: string): Slide[] {
  const topic = prompt.trim();
  const slides: Slide[] = [];

  // Title slide
  slides.push({
    id: generateSlideId(),
    title: `${topic} | Strategic Overview`,
    soWhat: topic,
    description: 'Strategic Overview',
    templateId: 'full',
    slotContent: {
      main: {
        id: generateComponentId(),
        type: 'text_block',
        heading: topic,
        headingColor: 'navy',
        text: 'A comprehensive analysis prepared by INSIGHT2PROFIT.',
      },
    },
  });

  // Context slide
  slides.push({
    id: generateSlideId(),
    title: 'Market Context Demands Action | Current landscape assessment',
    soWhat: 'Market Context Demands Action',
    description: 'Current landscape assessment',
    templateId: 'three-equal',
    slotContent: {
      left: {
        id: generateComponentId(),
        type: 'bullet_list',
        heading: 'Challenges',
        items: ['Increasing competitive pressure', 'Margin erosion across segments', 'Customer expectations shifting'],
        bulletColor: 'orange',
      },
      center: {
        id: generateComponentId(),
        type: 'bullet_list',
        heading: 'Opportunities',
        items: ['Price optimization potential', 'New market segments', 'Technology-enabled insights'],
        bulletColor: 'teal',
      },
      right: {
        id: generateComponentId(),
        type: 'bullet_list',
        heading: 'Priorities',
        items: ['Data-driven pricing', 'Customer segmentation', 'Operational excellence'],
        bulletColor: 'navy',
      },
    },
  });

  // Metrics slide
  slides.push({
    id: generateSlideId(),
    title: 'Key Metrics Show Momentum | Performance dashboard',
    soWhat: 'Key Metrics Show Momentum',
    description: 'Performance dashboard',
    templateId: 'full',
    slotContent: {
      main: {
        id: generateComponentId(),
        type: 'kpi_cards',
        metrics: [
          { value: '$2.4M', label: 'Revenue Impact', trend: 'up' },
          { value: '15%', label: 'Margin Improvement', trend: 'up' },
          { value: '94%', label: 'Client Retention', trend: 'flat' },
          { value: '3.2x', label: 'ROI', trend: 'up' },
        ],
      },
    },
  });

  // Process slide
  slides.push({
    id: generateSlideId(),
    title: 'Proven Methodology Drives Results | Implementation approach',
    soWhat: 'Proven Methodology Drives Results',
    description: 'Implementation approach',
    templateId: 'full',
    slotContent: {
      main: {
        id: generateComponentId(),
        type: 'process_flow',
        stages: [
          { label: 'Discover', timeframe: 'Weeks 1-2', items: ['Data collection', 'Stakeholder interviews'] },
          { label: 'Analyze', timeframe: 'Weeks 3-4', items: ['Price waterfall analysis', 'Segmentation modeling'] },
          { label: 'Optimize', timeframe: 'Weeks 5-6', items: ['Strategy development', 'Tool configuration'] },
          { label: 'Sustain', timeframe: 'Ongoing', items: ['Performance tracking', 'Continuous improvement'] },
        ],
      },
    },
    calloutBar: {
      id: generateComponentId(),
      type: 'callout_bar',
      text: 'Our four-phase approach ensures sustainable pricing transformation.',
    },
  });

  // Next steps slide
  slides.push({
    id: generateSlideId(),
    title: 'Clear Path Forward | Recommended next steps',
    soWhat: 'Clear Path Forward',
    description: 'Recommended next steps',
    templateId: 'full',
    slotContent: {
      main: {
        id: generateComponentId(),
        type: 'icon_columns',
        columns: [
          { icon: '📋', header: 'Immediate', headerColor: 'orange', items: ['Align on scope and timeline', 'Secure data access'] },
          { icon: '🎯', header: 'Short-term', headerColor: 'teal', items: ['Launch discovery phase', 'Build pricing analytics'] },
          { icon: '🚀', header: 'Long-term', headerColor: 'navy', items: ['Deploy optimization engine', 'Scale across business units'] },
        ],
      },
    },
  });

  return slides;
}
