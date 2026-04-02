// Slide Preview Router
// Routes slide rendering: Emma's bundle gets full renderer, everything else gets simple preview

import { Slide } from '../types';
import { EmmaSlidePreview } from './EmmaSlidePreview';
import { SimpleSlidePreview } from './SimpleSlidePreview';

interface SlidePreviewRouterProps {
  slide: Slide;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: (slide: Slide) => void;
}

/**
 * Routes to the correct slide preview component
 * - Emma's bundle: Full template/slot renderer
 * - Everything else: Simple preview with edit capability
 */
export function SlidePreviewRouter({ slide, isSelected, onClick, onEdit }: SlidePreviewRouterProps) {
  // Handle null/undefined slide
  if (!slide) {
    return <div className="text-gray-500 text-sm p-4">No slide selected</div>;
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
