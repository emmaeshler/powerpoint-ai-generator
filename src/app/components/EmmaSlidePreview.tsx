'use client';

import { Slide } from '../types';
import { SlidePreview } from './SlidePreview';

interface EmmaSlidePreviewProps {
  slide: Slide;
  isSelected?: boolean;
  onClick?: () => void;
}

const PREVIEW_SCALE = 0.25; // Scale down the 800x450 SlidePreview to thumbnail size
const THUMB_W = 800 * PREVIEW_SCALE;
const THUMB_H = 450 * PREVIEW_SCALE;

export function EmmaSlidePreview({ slide, isSelected, onClick }: EmmaSlidePreviewProps) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200 hover:ring-gray-300'
      }`}
      style={{ width: THUMB_W, height: THUMB_H }}
    >
      {/* Scale down the full SlidePreview */}
      <div
        style={{
          width: 800,
          height: 450,
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      >
        <SlidePreview slide={slide} />
      </div>
    </div>
  );
}
