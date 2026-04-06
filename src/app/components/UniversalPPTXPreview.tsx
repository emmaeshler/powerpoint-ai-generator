'use client';

import { useState, useEffect, useRef } from 'react';
import { Slide } from '../types';
import { generatePowerPointBlob } from '../utils/pptx-generator';

interface UniversalPPTXPreviewProps {
  slides: Slide[];
  format: 'emma' | 'will-code' | 'will-sections';
  isSelected?: boolean;
  onClick?: () => void;
}

// Height of Chrome's PDF viewer toolbar — included in the container so the full slide is visible
export const PPTX_TOOLBAR_H = 52;

export function UniversalPPTXPreview({ slides, format, isSelected, onClick }: UniversalPPTXPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setIsLoading(true);
      setError(null);
      setPdfUrl(null);

      try {
        let pptxBlob: Blob;

        // For Will's code-based slides, execute on server
        if (format === 'will-code' && slides[0]?.content?.pptxCode) {
          const code = slides[0].content.pptxCode;

          const exportResponse = await fetch('http://localhost:4000/export-pptxgen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, fileName: 'preview.pptx' })
          });

          if (!exportResponse.ok) {
            throw new Error('Failed to generate PPTX from code');
          }

          pptxBlob = await exportResponse.blob();
        } else {
          // For other slides, generate in browser
          pptxBlob = await generatePowerPointBlob(slides);
        }

        const base64 = await blobToBase64(pptxBlob);

        const response = await fetch('http://localhost:4000/api/upload-pptx-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pptxBase64: base64 }),
        });

        const data = await response.json();

        if (!cancelled) {
          if (data.success && data.pdfUrl) {
            setPdfUrl(`http://localhost:4000${data.pdfUrl}`);
          } else {
            setError(data.error || 'Preview unavailable');
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to generate preview');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPreview();
    return () => { cancelled = true; };
  }, [slides, format]);

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setContainerWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Height = slide height (16:9) + toolbar
  const totalHeight = containerWidth ? containerWidth * 9 / 16 + PPTX_TOOLBAR_H : undefined;

  return (
    <div
      ref={wrapperRef}
      onClick={onClick}
      className={`relative w-full overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200 hover:ring-gray-300'
      }`}
      style={{ height: totalHeight ?? 'auto', backgroundColor: '#f3f4f6' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-2" style={{ borderColor: '#00446A' }} />
            <div className="text-xs text-gray-500">Generating preview...</div>
          </div>
        </div>
      )}
      {!isLoading && error && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-xs text-red-500 font-medium">Preview unavailable</div>
            <div className="text-[10px] text-gray-400 mt-1">{error}</div>
          </div>
        </div>
      )}
      {!isLoading && pdfUrl && (
        <iframe
          src={pdfUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Slide Preview"
        />
      )}
    </div>
  );
}
