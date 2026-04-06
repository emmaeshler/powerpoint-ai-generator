'use client';

import { useState } from 'react';
import { FileOutput, Braces, Check } from 'lucide-react';
import { Button } from './ui/button';

interface PreviewModePromptModalProps {
  isOpen: boolean;
  bundleName: string;
  onChoose: (mode: 'pptx' | 'json', remember: boolean) => void;
}

const OPTIONS = [
  {
    mode: 'pptx' as const,
    icon: FileOutput,
    title: 'PPTX Output',
    subtitle: 'True preview',
    description:
      'Generates the actual PowerPoint file and renders it as a PDF preview. What you see is exactly what you\'ll download — real fonts, colors, layouts, and positioning.',
    bestFor: 'Final review, sharing screenshots, checking brand accuracy',
    tradeoff: 'Slower — requires a round-trip to the server to render',
    color: '#00446A',
    bg: '#EEF4F7',
  },
  {
    mode: 'json' as const,
    icon: Braces,
    title: 'JSON View',
    subtitle: 'Editable data',
    description:
      'Exposes the raw slide data so you can directly manipulate the output — move fields around, change values, restructure content, and build custom edit panels on top of it.',
    bestFor: 'Fine-grained editing, building custom controls, tweaking output',
    tradeoff: 'No visual render — you\'re working with structured data, not a slide preview',
    color: '#6B21A8',
    bg: '#F5F3FF',
  },
];

export function PreviewModePromptModal({ isOpen, bundleName, onChoose }: PreviewModePromptModalProps) {
  const [selected, setSelected] = useState<'pptx' | 'json' | null>(null);
  const [remember, setRemember] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ backgroundColor: '#002F4A' }}>
          <h2 className="text-base font-semibold text-white">Choose a preview mode</h2>
          <p className="text-sm text-white/60 mt-0.5">
            <span className="text-white/80 font-medium">{bundleName}</span> doesn't have a default set — pick what works best for you
          </p>
        </div>

        {/* Options */}
        <div className="p-6 grid grid-cols-2 gap-4">
          {OPTIONS.map(({ mode, icon: Icon, title, subtitle, description, bestFor, tradeoff, color, bg }) => {
            const isSelected = selected === mode;
            return (
              <button
                key={mode}
                onClick={() => setSelected(mode)}
                className="text-left rounded-xl border-2 p-4 transition-all hover:shadow-md"
                style={{
                  borderColor: isSelected ? color : '#e5e7eb',
                  backgroundColor: isSelected ? bg : 'white',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: color + '18' }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <span className="font-semibold text-sm" style={{ color: '#111827' }}>{title}</span>
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: color + '18', color }}>
                    {subtitle}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed mb-3">{description}</p>

                <div className="space-y-1.5">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-semibold text-green-700 mt-0.5 flex-shrink-0">✓ Best for</span>
                    <span className="text-[10px] text-gray-500">{bestFor}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-semibold text-amber-600 mt-0.5 flex-shrink-0">⚠ Trade-off</span>
                    <span className="text-[10px] text-gray-500">{tradeoff}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            Remember for <span className="font-medium text-gray-800 ml-1">{bundleName}</span>
          </label>
          <Button
            onClick={() => selected && onChoose(selected, remember)}
            disabled={!selected}
            className="text-white px-6"
            style={{ backgroundColor: selected ? (selected === 'pptx' ? '#00446A' : '#6B21A8') : undefined }}
          >
            Use {selected === 'pptx' ? 'PPTX Output' : selected === 'json' ? 'JSON View' : '…'}
          </Button>
        </div>
      </div>
    </div>
  );
}
