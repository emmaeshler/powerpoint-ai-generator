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
                      slide.bundleId === 'wills-bundle' ? '#00446A' :
                      slide.bundleId === 'test-bundle' ? '#8B5CF6' :
                      '#6B7280';

  // PowerPoint dimensions (16:9 aspect ratio)
  // Standard slide: 13.333" x 7.5" = 1280px x 720px at 96 DPI
  const isWillsSlide = slide.bundleId === 'wills-bundle';

  return (
    <div
      onClick={onClick}
      className="relative w-full aspect-[16/9] rounded-lg border-2 transition-all cursor-pointer bg-white"
      style={{
        borderColor: isSelected ? bundleColor : '#E5E7EB',
        boxShadow: isSelected ? `0 0 0 3px ${bundleColor}22` : 'none',
        overflow: 'hidden',
      }}
    >
      {isEditing ? (
        // Edit mode - full overlay
        <div className="absolute inset-0 bg-white z-10 p-4 flex flex-col">
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
      ) : isWillsSlide ? (
        // Will's Bundle - INSIGHT PowerPoint template
        <div className="h-full flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
          {/* PowerPoint Header */}
          <div className="px-6 py-3 flex-shrink-0">
            <h3 className="font-bold text-base leading-tight" style={{ color: '#00446A', fontFamily: 'Arial, sans-serif' }}>
              {slide.title || 'Untitled Slide'}
            </h3>
            {slide.content?.subtitle && (
              <p className="text-xs mt-1" style={{ color: '#4A6070' }}>
                {slide.content.subtitle}
              </p>
            )}
            {/* Divider line */}
            <div className="h-[2px] mt-2" style={{ backgroundColor: '#00446A' }} />
          </div>

          {/* Content Area - no scrolling, must fit */}
          <div className="flex-1 px-6 py-2 min-h-0">
            <ContentPreview slide={slide} />
          </div>

          {/* PowerPoint Footer */}
          <div className="flex-shrink-0 px-6 py-2 border-t" style={{ borderColor: '#E56910', borderTopWidth: '2px' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold" style={{ color: '#00446A', fontFamily: 'Arial, sans-serif' }}>
                INSIGHT2PROFIT
              </span>
              <span className="text-[10px]" style={{ color: '#E56910' }}>
                1
              </span>
            </div>
          </div>

          {/* Bundle Badge */}
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white z-10"
            style={{ backgroundColor: bundleColor }}
          >
            PFP
          </div>

          {/* Edit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="absolute top-2 left-2 px-2 py-1 text-xs rounded hover:bg-gray-200 bg-white border z-10"
            style={{ color: '#6B7280' }}
          >
            Edit JSON
          </button>
        </div>
      ) : (
        // Other bundles - original layout
        <>
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
                Edit
              </button>
            </div>
          </div>
          <div className="p-4 overflow-auto h-[calc(100%-60px)]">
            <ContentPreview slide={slide} />
          </div>
          {slide.bundleId && (
            <div
              className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: bundleColor }}
            >
              {slide.bundleId.replace('-bundle', '')}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ContentPreview({ slide }: { slide: Slide }) {
  const content = slide.content || slide;

  // If it has sections (Will's structure with type: flow/panel/table)
  if (content.sections && Array.isArray(content.sections)) {
    return (
      <div className="h-full space-y-2" style={{ backgroundColor: '#FFFFFF', fontFamily: 'Arial, sans-serif' }}>
        {content.sections.map((section: any, idx: number) => {
          const accentColor = section.accentColor ? `#${section.accentColor}` : '#00446A';

          return (
            <div key={idx} className="space-y-1">
              {/* Section Header - Will's style with colored top rule */}
              {(section.header || section.heading || section.title) && (
                <div className="mb-1">
                  <div className="h-[3px] w-12 mb-1" style={{ backgroundColor: accentColor }}></div>
                  <h4 className="font-bold text-sm leading-tight" style={{ color: '#25282A', fontFamily: 'Arial Narrow, Arial, sans-serif' }}>
                    {section.header || section.heading || section.title}
                  </h4>
                </div>
              )}

              {/* Flow Type - Process steps with Will's card styling */}
              {section.type === 'flow' && section.content?.steps && (
                <div className="grid grid-cols-3 gap-2">
                  {section.content.steps.map((step: any, i: number) => (
                    <div
                      key={i}
                      className="bg-white rounded p-2 border-t-[3px]"
                      style={{
                        borderTopColor: accentColor,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                      }}
                    >
                      {step.icon && (
                        <div className="text-xl mb-1 opacity-90">{step.icon}</div>
                      )}
                      <div
                        className="font-bold text-[11px] mb-1 leading-tight"
                        style={{ color: accentColor, fontFamily: 'Arial Narrow, Arial, sans-serif' }}
                      >
                        {step.label}
                      </div>
                      {step.description && (
                        <div className="text-[9px] leading-snug" style={{ color: '#4A6070' }}>
                          {step.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Panel Type - Large card with Will's branding */}
              {section.type === 'panel' && section.content && (
                <div
                  className="bg-white rounded p-3 border-l-[3px]"
                  style={{
                    borderLeftColor: accentColor,
                    backgroundColor: '#F9FAFB',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                  }}
                >
                  {section.content.icon && (
                    <div className="text-2xl mb-1 opacity-80">{section.content.icon}</div>
                  )}
                  {section.content.title && (
                    <div
                      className="font-bold text-sm mb-1 leading-tight"
                      style={{ color: accentColor, fontFamily: 'Arial Narrow, Arial, sans-serif' }}
                    >
                      {section.content.title}
                    </div>
                  )}
                  {section.content.description && (
                    <div className="text-[11px] leading-snug" style={{ color: '#25282A' }}>
                      {section.content.description}
                    </div>
                  )}
                </div>
              )}

              {/* Table Type - Will's branded table style */}
              {section.type === 'table' && section.content?.headers && section.content?.rows && (
                <div className="rounded overflow-hidden border" style={{ borderColor: '#E5E7EB' }}>
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr style={{ backgroundColor: accentColor }}>
                        {section.content.headers.map((header: string, i: number) => (
                          <th
                            key={i}
                            className="px-2 py-1 text-left font-bold"
                            style={{
                              color: '#FFFFFF',
                              fontFamily: 'Arial Narrow, Arial, sans-serif',
                              fontSize: '10px'
                            }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.content.rows.map((row: string[], i: number) => (
                        <tr
                          key={i}
                          style={{
                            backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                          }}
                        >
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="px-2 py-1 border-t"
                              style={{
                                color: '#25282A',
                                borderColor: '#E5E7EB',
                                fontSize: '10px'
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Metric Type - Large stat display */}
              {section.type === 'metric' && section.content && (
                <div className="text-center py-2 bg-white rounded">
                  {section.content.value && (
                    <div
                      className="font-bold mb-1"
                      style={{
                        fontSize: '24px',
                        color: accentColor,
                        fontFamily: 'Arial Narrow, Arial, sans-serif',
                        lineHeight: '1'
                      }}
                    >
                      {section.content.value}
                    </div>
                  )}
                  {section.content.label && (
                    <div className="text-[10px]" style={{ color: '#75787B' }}>
                      {section.content.label}
                    </div>
                  )}
                </div>
              )}

              {/* Text Type or Generic Content */}
              {(section.type === 'text' || (!section.type && section.content)) && (
                <div className="text-xs text-gray-700">
                  {typeof section.content === 'string' ? section.content : JSON.stringify(section.content, null, 2)}
                </div>
              )}

              {/* Bullets (if present) */}
              {section.bullets && (
                <ul className="text-xs space-y-1">
                  {section.bullets.map((bullet: string, i: number) => (
                    <li key={i} className="text-gray-700 flex items-start">
                      <span className="mr-2" style={{ color: accentColor }}>•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
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
