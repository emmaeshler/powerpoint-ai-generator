import { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { REFERENCE_SLIDES } from '../constants/referenceSlides';

interface DeckBriefingModalProps {
  isOpen: boolean;
  originalPrompt: string;
  onClose: () => void;
  onComplete: (enrichedPrompt: string, referenceImageBase64?: string) => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

const AUDIENCE_OPTIONS = ['Client', 'Internal Team', 'PE / Investor', 'Executive Leadership'];
const OUTCOME_OPTIONS = ['Approve a project', 'Align on a problem', 'Present findings', 'Sell our services'];

export function DeckBriefingModal({ isOpen, originalPrompt, onClose, onComplete }: DeckBriefingModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [audience, setAudience] = useState<string>('');
  const [audienceCustom, setAudienceCustom] = useState<string>('');
  const [coreArgument, setCoreArgument] = useState<string>('');
  const [keyData, setKeyData] = useState<string>('');
  const [outcome, setOutcome] = useState<string>('');
  const [outcomeCustom, setOutcomeCustom] = useState<string>('');
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 5) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const canProceed = () => {
    if (step === 1) return audience || audienceCustom;
    if (step === 2) return coreArgument.trim();
    if (step === 3) return true; // Optional step (key data)
    if (step === 4) return outcome || outcomeCustom;
    if (step === 5) return true; // Optional step (reference image)
    return false;
  };

  const handleBuildDeck = () => {
    const finalAudience = audienceCustom || audience;
    const finalOutcome = outcomeCustom || outcome;

    const enrichedPrompt = `${originalPrompt}

AUDIENCE: ${finalAudience}
CORE ARGUMENT: ${coreArgument}
KEY DATA: ${keyData || 'None specified'}
DESIRED OUTCOME: ${finalOutcome}

Build a consultant-grade deck that serves this audience, makes this argument, uses this data, and achieves this outcome.`;

    onComplete(enrichedPrompt, referenceImageBase64);
  };

  const handleChipSelect = (value: string, type: 'audience' | 'outcome') => {
    if (type === 'audience') {
      setAudience(audience === value ? '' : value);
      if (value) setAudienceCustom(''); // Clear custom when selecting chip
    } else {
      setOutcome(outcome === value ? '' : value);
      if (value) setOutcomeCustom(''); // Clear custom when selecting chip
    }
  };

  const handleReferenceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: '#002F4A' }}>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Deck Briefing</h2>
            <p className="text-sm text-white/70 mt-0.5">Step {step} of 5</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(step / 5) * 100}%`,
              backgroundColor: '#1B6B7B'
            }}
          />
        </div>

        {/* Content */}
        <div className="px-6 py-8 min-h-[320px]">
          {/* Step 1: Audience */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold" style={{ color: '#002F4A' }}>
                Who is the audience?
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleChipSelect(option, 'audience')}
                    className="px-4 py-2 rounded-full border-2 transition-all font-medium"
                    style={{
                      borderColor: audience === option ? '#1B6B7B' : '#d1d5db',
                      backgroundColor: audience === option ? '#1B6B7B' : 'white',
                      color: audience === option ? 'white' : '#374151'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or specify your own:
                </label>
                <input
                  type="text"
                  value={audienceCustom}
                  onChange={(e) => {
                    setAudienceCustom(e.target.value);
                    if (e.target.value) setAudience(''); // Clear chips when typing
                  }}
                  placeholder="e.g., Board of Directors"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B6B7B] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Core Argument */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold" style={{ color: '#002F4A' }}>
                What should they believe when this deck is done?
              </h3>
              
              <textarea
                value={coreArgument}
                onChange={(e) => setCoreArgument(e.target.value)}
                placeholder="e.g., Their pricing problem is fixable in 90 days"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B6B7B] focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Step 3: Key Data */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold" style={{ color: '#002F4A' }}>
                  Any specific data points to include?
                </h3>
                <p className="text-sm text-gray-500 mt-1">Optional — skip if not applicable</p>
              </div>
              
              <textarea
                value={keyData}
                onChange={(e) => setKeyData(e.target.value)}
                placeholder="e.g., 3% margin erosion, $280M revenue, 47% of losses cite price"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B6B7B] focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Step 4: Desired Outcome */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold" style={{ color: '#002F4A' }}>
                What's the desired outcome of this meeting?
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {OUTCOME_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleChipSelect(option, 'outcome')}
                    className="px-4 py-2 rounded-full border-2 transition-all font-medium"
                    style={{
                      borderColor: outcome === option ? '#1B6B7B' : '#d1d5db',
                      backgroundColor: outcome === option ? '#1B6B7B' : 'white',
                      color: outcome === option ? 'white' : '#374151'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or specify your own:
                </label>
                <input
                  type="text"
                  value={outcomeCustom}
                  onChange={(e) => {
                    setOutcomeCustom(e.target.value);
                    if (e.target.value) setOutcome(''); // Clear chips when typing
                  }}
                  placeholder="e.g., Get budget approval for Phase 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B6B7B] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 5: Reference Image */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold" style={{ color: '#002F4A' }}>
                  Choose a layout style (optional)
                </h3>
                <p className="text-sm text-gray-500 mt-1">Select a reference layout or skip to use default</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {REFERENCE_SLIDES.map((slide) => (
                  <button
                    key={slide.id}
                    onClick={() => setReferenceImageBase64(slide.imageBase64 || undefined)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-md"
                    style={{
                      borderColor: referenceImageBase64 === slide.imageBase64 ? '#E8610A' : '#d1d5db',
                      backgroundColor: 'white'
                    }}
                  >
                    {/* Thumbnail placeholder */}
                    <div 
                      className="w-full aspect-video rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs"
                      style={{
                        border: referenceImageBase64 === slide.imageBase64 ? '2px solid #E8610A' : '1px solid #e5e7eb'
                      }}
                    >
                      {slide.imageBase64 ? (
                        <img 
                          src={`data:image/png;base64,${slide.imageBase64}`} 
                          alt={slide.label}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        'Preview coming soon'
                      )}
                    </div>
                    
                    {/* Label */}
                    <div className="text-center">
                      <div className="text-sm font-medium" style={{ color: '#002F4A' }}>
                        {slide.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {slide.description}
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Custom upload option */}
                <label className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:shadow-md hover:border-[#1B6B7B]"
                  style={{
                    borderColor: referenceImageBase64 && !REFERENCE_SLIDES.some(s => s.imageBase64 === referenceImageBase64) ? '#E8610A' : '#d1d5db',
                    backgroundColor: 'white'
                  }}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleReferenceImageUpload}
                    className="hidden"
                  />
                  
                  {/* Upload icon area */}
                  <div 
                    className="w-full aspect-video rounded bg-gray-50 flex items-center justify-center"
                    style={{
                      border: referenceImageBase64 && !REFERENCE_SLIDES.some(s => s.imageBase64 === referenceImageBase64) ? '2px solid #E8610A' : '1px solid #e5e7eb'
                    }}
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  
                  {/* Label */}
                  <div className="text-center">
                    <div className="text-sm font-medium" style={{ color: '#002F4A' }}>
                      Custom
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Upload your own
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 text-white"
                style={{ backgroundColor: canProceed() ? '#1B6B7B' : '#9ca3af' }}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleBuildDeck}
                disabled={!canProceed()}
                className="flex items-center gap-2 text-white font-semibold"
                style={{ backgroundColor: canProceed() ? '#E8610A' : '#9ca3af' }}
              >
                Build Deck
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}