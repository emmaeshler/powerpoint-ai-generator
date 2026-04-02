// Generic Slide Preview Component
// Fallback renderer for slides that don't have a specific bundle renderer

import { Slide } from '../types';

interface GenericSlidePreviewProps {
  slide: Slide;
  isSelected?: boolean;
  onClick?: () => void;
}

export function GenericSlidePreview({ slide, isSelected, onClick }: GenericSlidePreviewProps) {
  return (
    <div
      onClick={onClick}
      className="relative w-full aspect-[16/9] rounded-lg border-2 transition-all cursor-pointer overflow-hidden bg-white"
      style={{
        borderColor: isSelected ? '#6366F1' : '#E5E7EB',
        boxShadow: isSelected ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
      }}
    >
      {/* Slide Header */}
      <div
        className="px-6 py-4 border-b"
        style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
      >
        <h2 className="text-xl font-bold" style={{ color: '#1F2937' }}>
          {slide.title}
        </h2>
        {slide.description && (
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            {slide.description}
          </p>
        )}
      </div>

      {/* Slide Content */}
      <div className="p-6">
        {slide.content ? (
          <GenericContentRenderer content={slide.content} />
        ) : slide.slotContent ? (
          <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
            <p className="text-sm">Using Emma's template system</p>
            <p className="text-xs mt-2">Template: {slide.templateId}</p>
          </div>
        ) : (
          <div className="text-center py-12" style={{ color: '#9CA3AF' }}>
            <p>No content to display</p>
          </div>
        )}
      </div>

      {/* Bundle Badge */}
      <div
        className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium"
        style={{ backgroundColor: '#6366F1', color: 'white' }}
      >
        Generic
      </div>
    </div>
  );
}

/**
 * Generic content renderer - tries to display content in a reasonable way
 */
function GenericContentRenderer({ content }: { content: any }) {
  // If it's a string, just display it
  if (typeof content === 'string') {
    return (
      <div className="prose prose-sm max-w-none" style={{ color: '#4B5563' }}>
        <p>{content}</p>
      </div>
    );
  }

  // If it's an array, render as list
  if (Array.isArray(content)) {
    return (
      <ul className="list-disc list-inside space-y-2">
        {content.map((item: any, idx: number) => (
          <li key={idx} className="text-sm" style={{ color: '#4B5563' }}>
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    );
  }

  // If it's an object, try to render its properties
  if (typeof content === 'object' && content !== null) {
    return (
      <div className="space-y-3">
        {Object.entries(content).map(([key, value]) => (
          <div key={key}>
            <h4 className="font-semibold text-sm mb-1" style={{ color: '#374151' }}>
              {key}
            </h4>
            <div className="text-sm" style={{ color: '#6B7280' }}>
              {typeof value === 'string' ? (
                <p>{value}</p>
              ) : Array.isArray(value) ? (
                <ul className="list-disc list-inside">
                  {value.map((item: any, idx: number) => (
                    <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                  ))}
                </ul>
              ) : (
                <pre className="text-xs font-mono bg-gray-50 p-2 rounded">
                  {JSON.stringify(value, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback: render as JSON
  return (
    <div className="p-4 rounded" style={{ backgroundColor: '#F3F4F6' }}>
      <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#6B7280' }}>
        {JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );
}
