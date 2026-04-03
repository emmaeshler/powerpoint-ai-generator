'use client';

// Slide Preview Router
// Routes slide rendering: Emma's bundle gets full renderer, Will's PptxGenJS gets preview, everything else gets simple preview

import { useState, useEffect } from 'react';
import { Slide } from '../types';
import { EmmaSlidePreview } from './EmmaSlidePreview';
import { SimpleSlidePreview } from './SimpleSlidePreview';
import { WillsSlidePreview } from './WillsSlidePreview';
import { UniversalPPTXPreview } from './UniversalPPTXPreview';
import { WillsPreviewData } from '../types/wills-preview';

interface SlidePreviewRouterProps {
  slide: Slide;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: (slide: Slide) => void;
  useUniversalPreview?: boolean;
}

/**
 * Routes to the correct slide preview component
 * - Universal preview mode: Generate actual PPTX and show PDF (all formats)
 * - Emma's bundle: Full template/slot renderer
 * - Will's PptxGenJS: Sandbox preview
 * - Everything else: Simple preview with edit capability
 */
export function SlidePreviewRouter({ slide, isSelected, onClick, onEdit, useUniversalPreview = false }: SlidePreviewRouterProps) {
  const [previewData, setPreviewData] = useState<WillsPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Check if this is Will's PptxGenJS output (before early returns to satisfy Rules of Hooks)
  const pptxCode = slide?.content?.pptxCode || slide?.content?.rawOutput;
  const isPptxGenJS = pptxCode && (
    pptxCode.includes('module.exports') ||
    pptxCode.includes('pres.addSlide') ||
    pptxCode.includes('pptxgenjs')
  );

  // Load preview data for PptxGenJS slides (must be called before any early returns)
  useEffect(() => {
    if (isPptxGenJS && pptxCode && !previewData) {
      setIsLoadingPreview(true);
      fetch('http://localhost:4000/preview-pptxgen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pptxCode })
      })
        .then(res => res.json())
        .then(data => {
          setPreviewData(data);
          setIsLoadingPreview(false);
        })
        .catch(err => {
          console.error('Failed to load PptxGenJS preview:', err);
          setIsLoadingPreview(false);
        });
    }
  }, [isPptxGenJS, pptxCode, previewData]);

  // Handle null/undefined slide (after all hooks)
  if (!slide) {
    return <div className="text-gray-500 text-sm p-4">No slide selected</div>;
  }

  // Universal preview mode: Generate actual PPTX and show PDF (bypasses all format-specific rendering)
  if (useUniversalPreview) {
    // Detect format
    let format: 'emma' | 'will-code' | 'will-sections' = 'emma';

    if (pptxCode) {
      format = 'will-code';
    } else if (slide.content?.sections && Array.isArray(slide.content.sections)) {
      format = 'will-sections';
    } else if (slide.bundleId === 'emma-bundle' || slide.templateId) {
      format = 'emma';
    }

    return (
      <UniversalPPTXPreview
        slides={[slide]}
        format={format}
        isSelected={isSelected}
        onClick={onClick}
      />
    );
  }

  // If this is a PptxGenJS slide, render with WillsSlidePreview
  if (isPptxGenJS) {
    if (isLoadingPreview) {
      return (
        <div className="flex items-center justify-center" style={{ width: 13.3 * 60, height: 7.5 * 60 }}>
          <div className="text-gray-500 text-sm">Loading preview...</div>
        </div>
      );
    }

    if (previewData && previewData.success && previewData.slides[0]) {
      return (
        <WillsSlidePreview
          slideData={previewData.slides[0]}
          isSelected={isSelected}
          onClick={onClick}
        />
      );
    }

    if (previewData && !previewData.success) {
      return (
        <div className="flex flex-col items-center justify-center p-4" style={{ width: 13.3 * 60, height: 7.5 * 60 }}>
          <div className="text-red-500 text-sm font-semibold">Preview Error</div>
          <div className="text-xs text-gray-600 mt-2">{previewData.error}</div>
        </div>
      );
    }
  }

  // Use Emma's complex renderer only for Emma's bundle
  if (slide.bundleId === 'emma-bundle' || (slide.templateId && slide.slotContent && !slide.bundleId)) {
    return <EmmaSlidePreview slide={slide} isSelected={isSelected} onClick={onClick} />;
  }

  // Everything else uses simple preview
  return <SimpleSlidePreview slide={slide} isSelected={isSelected} onClick={onClick} onEdit={onEdit} />;
}

/**
 * Infer render type from slide structure if not explicitly set
 */
function inferRenderType(slide: Slide): 'emma' | 'pfp' | 'generic' {
  // Check bundleId first
  if (slide.bundleId === 'emma-bundle') return 'emma';
  if (slide.bundleId === 'pfp-bundle') return 'pfp';

  // Check structure - if it has templateId and slotContent, it's Emma's format
  if (slide.templateId && slide.slotContent) return 'emma';

  // If it has generic content field, use generic renderer
  if (slide.content) return 'generic';

  // Default to Emma for backward compatibility
  return 'emma';
}
