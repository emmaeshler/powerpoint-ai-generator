'use client';

// Simple Slide Preview - just shows Claude's output
// No complex rendering, just display the response

import { Slide } from '../types';
import { useState } from 'react';

interface SimpleSlidePreviewProps {
  slide: Slide;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: (slide: Slide) => void;
}

export function SimpleSlidePreview({ slide, isSelected, onClick, onEdit }: SimpleSlidePreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(JSON.stringify(slide.content || slide, null, 2));

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedContent);
      onEdit?.({ ...slide, content: parsed });
      setIsEditing(false);
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  const bundleColor = slide.bundleId === 'emma-bundle' ? '#1B6B7B' :
                      slide.bundleId === 'test-bundle' ? '#8B5CF6' :
                      '#6B7280';

  return (
    <div
      onClick={onClick}
      className="relative w-full aspect-[16/9] rounded-lg border-2 transition-all cursor-pointer overflow-hidden bg-white"
      style={{
        borderColor: isSelected ? bundleColor : '#E5E7EB',
        boxShadow: isSelected ? `0 0 0 3px ${bundleColor}22` : 'none',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm" style={{ color: '#1F2937' }}>
              {slide.title}
            </h3>
            {slide.description && (
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                {slide.description}
              </p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="px-2 py-1 text-xs rounded hover:bg-gray-200"
            style={{ color: '#6B7280' }}
          >
            {isEditing ? 'Preview' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 overflow-auto h-[calc(100%-60px)]">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1 font-mono text-xs p-2 border rounded"
              style={{ backgroundColor: '#F9FAFB' }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="px-3 py-1 text-xs rounded text-white"
                style={{ backgroundColor: bundleColor }}
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                  setEditedContent(JSON.stringify(slide.content || slide, null, 2));
                }}
                className="px-3 py-1 text-xs rounded border"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <ContentPreview slide={slide} />
        )}
      </div>

      {/* Bundle Badge */}
      {slide.bundleId && (
        <div
          className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white"
          style={{ backgroundColor: bundleColor }}
        >
          {slide.bundleId.replace('-bundle', '')}
        </div>
      )}
    </div>
  );
}

function ContentPreview({ slide }: { slide: Slide }) {
  const content = slide.content || slide;

  // If it has sections (narrative structure)
  if (content.sections && Array.isArray(content.sections)) {
    return (
      <div className="space-y-3">
        {content.sections.map((section: any, idx: number) => (
          <div key={idx} className="border-l-2 pl-3" style={{ borderColor: '#E5E7EB' }}>
            {section.heading && (
              <h4 className="font-semibold text-sm mb-1">{section.heading}</h4>
            )}
            {section.content && (
              <p className="text-xs text-gray-600 mb-2">{section.content}</p>
            )}
            {section.bullets && (
              <ul className="text-xs space-y-1">
                {section.bullets.map((bullet: string, i: number) => (
                  <li key={i} className="text-gray-700">• {bullet}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }

  // If it has Emma's slotContent structure
  if (slide.slotContent) {
    return (
      <div className="text-xs space-y-2">
        <div className="font-semibold" style={{ color: '#6B7280' }}>
          Template: {slide.templateId}
        </div>
        {Object.entries(slide.slotContent).map(([slotId, component]: [string, any]) => (
          <div key={slotId} className="border rounded p-2" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="font-medium text-gray-700">{slotId}</div>
            <div className="text-gray-600 mt-1">{component.type}</div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback: show as JSON
  return (
    <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#4B5563' }}>
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}
