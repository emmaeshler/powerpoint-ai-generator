import { Slide } from '../types';
import { ChevronUp, ChevronDown, Copy, Trash2, Pencil, Plus, Sparkles, Layers, ChevronRight } from 'lucide-react';
import { AISlideGenerator } from './AISlideGenerator';
import { SlideEditDialog } from './SlideEditDialog';
import { Button } from './ui/button';
import { COMPONENT_META } from '../types';
import { useState } from 'react';

interface SlideListProps {
  slides: Slide[];
  selectedSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onReorderSlide: (id: string, direction: 'up' | 'down') => void;
  onGenerateSlide: (slide: Slide) => void;
  onGenerateSlides?: (slides: Slide[]) => void;
  onRequestAIGeneration?: (prompt: string, referenceImageBase64?: string) => Promise<string>;
  onEditSlide?: (slideId: string, editPrompt: string) => void;
  isEditingSlide?: boolean;
  onAddBlankSlide?: () => void;
}

export function SlideList({
  slides,
  selectedSlideId,
  onSelectSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlide,
  onGenerateSlide,
  onGenerateSlides,
  onRequestAIGeneration,
  onEditSlide,
  isEditingSlide,
  onAddBlankSlide,
}: SlideListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // Build render items: interleave group headers with slides, skip collapsed slides
  const renderItems: Array<
    | { kind: 'slide'; slide: Slide; index: number; isInGroup: boolean; isFirstInGroup: boolean; isLastInGroup: boolean; groupSlideIndex: number }
    | { kind: 'group-header'; groupId: string; label: string; count: number; collapsed: boolean }
  > = [];

  const seenGroups = new Set<string>();

  slides.forEach((slide, index) => {
    const groupId = slide.deckGroupId;
    const isInGroup = !!groupId;

    if (isInGroup && groupId && !seenGroups.has(groupId)) {
      seenGroups.add(groupId);
      const groupSlides = slides.filter(s => s.deckGroupId === groupId);
      const collapsed = collapsedGroups.has(groupId);
      renderItems.push({
        kind: 'group-header',
        groupId,
        label: slide.deckGroupLabel || 'Generated Deck',
        count: groupSlides.length,
        collapsed,
      });
    }

    if (isInGroup && groupId && collapsedGroups.has(groupId)) {
      return; // skip collapsed slides
    }

    const isFirstInGroup = isInGroup && (index === 0 || slides[index - 1]?.deckGroupId !== slide.deckGroupId);
    const isLastInGroup = isInGroup && (index === slides.length - 1 || slides[index + 1]?.deckGroupId !== slide.deckGroupId);
    const groupSlideIndex = isInGroup
      ? slides.slice(0, index + 1).filter(s => s.deckGroupId === slide.deckGroupId).length
      : 0;

    renderItems.push({
      kind: 'slide',
      slide,
      index,
      isInGroup,
      isFirstInGroup,
      isLastInGroup,
      groupSlideIndex,
    });
  });

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <AISlideGenerator onGenerateSlide={onGenerateSlide} onGenerateSlides={onGenerateSlides} onRequestAIGeneration={onRequestAIGeneration} />

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm" style={{ color: '#25282A' }}>Slides ({slides.length})</h2>
          {onAddBlankSlide && (
            <button
              onClick={onAddBlankSlide}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors text-gray-500 border-gray-300 hover:border-gray-400"
              title="Add a blank slide"
            >
              <Plus className="w-3 h-3" />
              Blank
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {slides.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No slides yet. Generate one above.
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {renderItems.map((item) => {
              if (item.kind === 'group-header') {
                return (
                  <button
                    key={`group-${item.groupId}`}
                    onClick={() => toggleGroup(item.groupId)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium cursor-pointer transition-colors hover:opacity-80 mt-1"
                    style={{ backgroundColor: '#E8F4F6', color: '#1B6B7B' }}
                  >
                    <ChevronRight
                      className="w-3 h-3 transition-transform flex-shrink-0"
                      style={{ transform: item.collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
                    />
                    <Layers className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    <span
                      className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                      style={{ backgroundColor: '#1B6B7B', color: '#fff' }}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              }

              const { slide, index, isInGroup, isLastInGroup, groupSlideIndex } = item;

              return (
                <div
                  key={slide.id}
                  className={`
                    relative group border rounded p-3 cursor-pointer transition-all
                    ${selectedSlideId === slide.id
                      ? 'border-blue-500 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  style={{
                    backgroundColor: selectedSlideId === slide.id ? '#EFF6FF' : '#fff',
                    borderLeft: isInGroup ? '3px solid #1B6B7B' : undefined,
                    marginLeft: isInGroup ? '8px' : undefined,
                    marginBottom: isInGroup && !isLastInGroup ? '1px' : undefined,
                  }}
                  onClick={() => onSelectSlide(slide.id)}
                >
                  <div className="flex items-start gap-2">
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <button
                        className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                        onClick={(e) => { e.stopPropagation(); onReorderSlide(slide.id, 'up'); }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                        onClick={(e) => { e.stopPropagation(); onReorderSlide(slide.id, 'down'); }}
                        disabled={index === slides.length - 1}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] tracking-wide mb-0.5" style={{ color: '#75787B' }}>
                        {index + 1}. {getComponentsSummary(slide)}
                        {isInGroup && (
                          <span style={{ color: '#1B6B7B' }}> · D{groupSlideIndex}</span>
                        )}
                      </div>
                      <div className="text-xs truncate" style={{ color: '#25282A' }}>
                        {slide.title || 'Untitled Slide'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={(e) => { e.stopPropagation(); onDuplicateSlide(slide.id); }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); onDeleteSlide(slide.id); }}
                      disabled={slides.length === 1}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    {onEditSlide && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSlideId(slide.id);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SlideEditDialog
        isOpen={editDialogOpen}
        slideTitle={editingSlideId ? slides.find(s => s.id === editingSlideId)?.title || 'Untitled Slide' : ''}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingSlideId(null);
        }}
        onSubmit={(editPrompt) => {
          if (editingSlideId && onEditSlide) {
            onEditSlide(editingSlideId, editPrompt);
            setEditDialogOpen(false);
            setEditingSlideId(null);
          }
        }}
        isLoading={isEditingSlide || false}
      />
    </div>
  );
}

function getComponentsSummary(slide: Slide): string {
  const comps = Object.values(slide.slotContent);
  if (slide.calloutBar) comps.push(slide.calloutBar);
  if (comps.length === 0) return 'EMPTY';
  const types = comps.map(c => COMPONENT_META[c.type]?.label || c.type);
  if (types.length <= 2) return types.join(' + ').toUpperCase();
  return `${types[0]} + ${types.length - 1} more`.toUpperCase();
}