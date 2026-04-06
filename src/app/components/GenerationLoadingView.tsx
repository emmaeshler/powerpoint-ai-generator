'use client';

import { useState, useEffect } from 'react';
import { Layers, StickyNote } from 'lucide-react';

interface GenerationLoadingViewProps {
  mode: 'slide' | 'deck';
  prompt: string;
}

const SLIDE_STAGES = [
  { at: 0,  message: 'Sending your request to Claude…' },
  { at: 4,  message: 'Claude is reading the brief…' },
  { at: 9,  message: 'Designing the slide structure…' },
  { at: 16, message: 'Writing the content…' },
  { at: 23, message: 'Almost there…' },
];

const DECK_STAGES = [
  { at: 0,  message: 'Sending your request to Claude…' },
  { at: 4,  message: 'Claude is reading the brief…' },
  { at: 10, message: 'Planning the deck structure…' },
  { at: 20, message: 'Writing slide content…' },
  { at: 35, message: 'Building out each slide…' },
  { at: 55, message: 'Polishing the deck…' },
  { at: 75, message: 'Almost there…' },
];

const SLIDE_ESTIMATE  = '15 – 30 sec';
const DECK_ESTIMATE   = '45 – 90 sec';
const SLIDE_MAX_S     = 30;
const DECK_MAX_S      = 90;

export function GenerationLoadingView({ mode, prompt }: GenerationLoadingViewProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [mode, prompt]);

  const stages    = mode === 'slide' ? SLIDE_STAGES : DECK_STAGES;
  const maxS      = mode === 'slide' ? SLIDE_MAX_S  : DECK_MAX_S;
  const estimate  = mode === 'slide' ? SLIDE_ESTIMATE : DECK_ESTIMATE;

  // Current stage message
  const currentStage = [...stages].reverse().find(s => elapsed >= s.at) ?? stages[0];

  // Progress bar — fills to ~90 % at max, then stays there
  const progress = Math.min((elapsed / maxS) * 90, 90);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="flex-1 flex items-center justify-center w-full h-full">
      <div
        className="w-full max-w-lg rounded-2xl p-8 flex flex-col items-center gap-6"
        style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        {/* Animated icon */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse ring */}
          <div
            className="absolute rounded-full animate-ping opacity-20"
            style={{ width: 72, height: 72, backgroundColor: '#00446A' }}
          />
          {/* Inner circle */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#EEF4F7' }}
          >
            {mode === 'deck'
              ? <Layers  className="w-7 h-7" style={{ color: '#00446A' }} />
              : <StickyNote className="w-7 h-7" style={{ color: '#00446A' }} />
            }
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1" style={{ color: '#25282A' }}>
            {mode === 'deck' ? 'Generating your deck…' : 'Generating your slide…'}
          </h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Estimated time: <span className="font-medium" style={{ color: '#25282A' }}>{estimate}</span>
          </p>
        </div>

        {/* Prompt */}
        <div
          className="w-full rounded-xl px-4 py-3 text-sm italic leading-relaxed"
          style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280' }}
        >
          "{prompt.length > 160 ? prompt.slice(0, 160) + '…' : prompt}"
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%`, backgroundColor: '#00446A' }}
            />
          </div>
        </div>

        {/* Stage + timer */}
        <div className="w-full flex items-center justify-between text-xs" style={{ color: '#9CA3AF' }}>
          <span
            className="transition-all duration-500"
            key={currentStage.message}
            style={{ color: '#6B7280' }}
          >
            {currentStage.message}
          </span>
          <span className="font-mono tabular-nums">{mm}:{ss}</span>
        </div>
      </div>
    </div>
  );
}
