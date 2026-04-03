'use client';

import { Slide } from '../types';

interface SimpleSlidePreviewProps {
  slide: Slide;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: (slide: Slide) => void;
}

export function SimpleSlidePreview({ slide, isSelected, onClick, onEdit }: SimpleSlidePreviewProps) {
  const content = slide.content;

  // Extract a preview text from the content
  function getPreviewLines(): string[] {
    if (!content) return [];
    if (typeof content === 'string') return [content];
    if (content.sections && Array.isArray(content.sections)) {
      return content.sections.slice(0, 3).map((s: any) =>
        typeof s === 'string' ? s : s.title || s.text || JSON.stringify(s)
      );
    }
    if (content.text) return [content.text];
    if (content.rawOutput) return [content.rawOutput.slice(0, 120) + '...'];
    return [];
  }

  const lines = getPreviewLines();

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded overflow-hidden p-3 bg-white transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200 hover:ring-gray-300'
      }`}
      style={{ width: 200, height: 113, fontFamily: 'Calibri, Arial, sans-serif' }}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ backgroundColor: '#F8FAFB' }} />

      {/* Title bar */}
      <div
        className="absolute top-0 left-0 right-0 h-5 flex items-center px-2"
        style={{ backgroundColor: '#00446A' }}
      >
        <span className="text-white text-[8px] font-semibold truncate">
          {slide.title || 'Untitled'}
        </span>
      </div>

      {/* Content area */}
      <div className="absolute top-5 left-0 right-0 bottom-0 p-2 overflow-hidden">
        {lines.length > 0 ? (
          <div className="space-y-0.5">
            {lines.map((line, i) => (
              <div key={i} className="text-[7px] leading-tight text-gray-600 truncate">
                • {line}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[7px] text-gray-400 italic">No content preview</div>
        )}
      </div>

      {/* Edit overlay */}
      {onEdit && (
        <button
          className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 group-hover:opacity-100 text-[7px] px-1.5 py-0.5 rounded bg-blue-500 text-white transition-opacity"
          onClick={(e) => { e.stopPropagation(); onEdit(slide); }}
        >
          Edit
        </button>
      )}
    </div>
  );
}
