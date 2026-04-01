import { Plus, Trash2, LayoutGrid, X, ChevronDown } from 'lucide-react';
import { Slide, SlideComponent, ComponentType, generateComponentId, COMPONENT_META, BrandColor, CalloutBarComponent } from '../types';
import { COMPONENT_PALETTE, MAX_CONSTRAINTS } from '../constants';
import { LAYOUT_TEMPLATES, getTemplate, TEMPLATE_CATEGORIES, LayoutTemplate } from '../layout-templates';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, Move } from 'lucide-react';

// ─── CURATED ICON LIBRARY (pricing consultancy / tech context) ─────

const ICON_CATEGORIES: { label: string; icons: { emoji: string; name: string }[] }[] = [
  {
    label: 'Pricing & Revenue',
    icons: [
      { emoji: '💰', name: 'Money Bag' },
      { emoji: '💵', name: 'Dollar' },
      { emoji: '💲', name: 'Price Tag' },
      { emoji: '📈', name: 'Growth' },
      { emoji: '📉', name: 'Decline' },
      { emoji: '🏷️', name: 'Tag' },
      { emoji: '💎', name: 'Value' },
      { emoji: '🪙', name: 'Coin' },
      { emoji: '🏦', name: 'Bank' },
      { emoji: '💳', name: 'Payment' },
    ],
  },
  {
    label: 'Strategy & Analytics',
    icons: [
      { emoji: '🎯', name: 'Target' },
      { emoji: '📊', name: 'Bar Chart' },
      { emoji: '📋', name: 'Clipboard' },
      { emoji: '🔍', name: 'Analysis' },
      { emoji: '🧮', name: 'Calculate' },
      { emoji: '⚖️', name: 'Balance' },
      { emoji: '🗺️', name: 'Roadmap' },
      { emoji: '🧭', name: 'Navigate' },
      { emoji: '♟️', name: 'Strategy' },
      { emoji: '🏆', name: 'Win' },
    ],
  },
  {
    label: 'Technology & Data',
    icons: [
      { emoji: '⚙️', name: 'Gear' },
      { emoji: '🖥️', name: 'Desktop' },
      { emoji: '☁️', name: 'Cloud' },
      { emoji: '🔗', name: 'Integration' },
      { emoji: '🤖', name: 'AI / ML' },
      { emoji: '📡', name: 'Data Feed' },
      { emoji: '🔒', name: 'Security' },
      { emoji: '⚡', name: 'Speed' },
      { emoji: '🧠', name: 'Intelligence' },
      { emoji: '🔧', name: 'Tools' },
    ],
  },
  {
    label: 'Business & People',
    icons: [
      { emoji: '🤝', name: 'Partnership' },
      { emoji: '👥', name: 'Team' },
      { emoji: '🏢', name: 'Enterprise' },
      { emoji: '📞', name: 'Support' },
      { emoji: '🌐', name: 'Global' },
      { emoji: '🚀', name: 'Launch' },
      { emoji: '📦', name: 'Product' },
      { emoji: '🛡️', name: 'Protect' },
      { emoji: '✅', name: 'Approved' },
      { emoji: '⏱️', name: 'Efficiency' },
    ],
  },
  {
    label: 'Concepts',
    icons: [
      { emoji: '💡', name: 'Insight' },
      { emoji: '🔄', name: 'Cycle' },
      { emoji: '📐', name: 'Framework' },
      { emoji: '🧩', name: 'Puzzle' },
      { emoji: '📌', name: 'Pin' },
      { emoji: '🔑', name: 'Key' },
      { emoji: '🎓', name: 'Expertise' },
      { emoji: '🔥', name: 'Hot / Urgent' },
      { emoji: '⭐', name: 'Star' },
      { emoji: '✨', name: 'Sparkle' },
    ],
  },
];

// ─── ICON PICKER DROPDOWN ─────────────────────────────────────

function IconPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const lowerSearch = search.toLowerCase();
  const filteredCategories = ICON_CATEGORIES.map(cat => ({
    ...cat,
    icons: cat.icons.filter(ic => ic.name.toLowerCase().includes(lowerSearch)),
  })).filter(cat => cat.icons.length > 0);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 h-7 px-1.5 rounded border border-gray-200 hover:border-gray-400 bg-white transition-colors text-sm min-w-[52px] justify-between"
      >
        <span className="text-base leading-none">{value || '?'}</span>
        <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-8 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredCategories.length === 0 && (
              <p className="text-[10px] text-gray-400 text-center py-3">No icons match "{search}"</p>
            )}
            {filteredCategories.map(cat => (
              <div key={cat.label} className="mb-2 last:mb-0">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 px-0.5">{cat.label}</p>
                <div className="grid grid-cols-5 gap-0.5">
                  {cat.icons.map(ic => (
                    <button
                      key={ic.emoji}
                      type="button"
                      onClick={() => { onChange(ic.emoji); setOpen(false); setSearch(''); }}
                      className={`
                        flex flex-col items-center gap-0.5 p-1.5 rounded transition-all
                        ${value === ic.emoji ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}
                      `}
                      title={ic.name}
                    >
                      <span className="text-lg leading-none">{ic.emoji}</span>
                      <span className="text-[8px] text-gray-500 leading-tight truncate w-full text-center">{ic.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN EDITOR ──────────────────────────────────────────────

interface SlideEditorProps {
  slide: Slide | null;
  onUpdateSlide: (slide: Slide) => void;
}

export function SlideEditor({ slide, onUpdateSlide }: SlideEditorProps) {
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [swapSource, setSwapSource] = useState<string | null>(null);

  if (!slide) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">No slide selected</p>
      </div>
    );
  }

  const template = getTemplate(slide.templateId);

  // Compute display title from soWhat + description (backward compat)
  function updateField(field: 'soWhat' | 'description' | 'keyMetric' | 'keyMetricLabel', value: string) {
    const updated = { ...slide!, [field]: value };
    // Keep title in sync as "soWhat | description"
    const sw = field === 'soWhat' ? value : slide!.soWhat;
    const desc = field === 'description' ? value : slide!.description;
    updated.title = desc ? `${sw} | ${desc}` : sw;
    // Lock soWhat if user manually edits it or key metrics
    if (field === 'soWhat' || field === 'keyMetric' || field === 'keyMetricLabel') {
      updated.soWhatLocked = true;
    }
    onUpdateSlide(updated);
  }

  function updateSlotComponent(slotId: string, updated: SlideComponent) {
    onUpdateSlide({
      ...slide!,
      slotContent: { ...slide!.slotContent, [slotId]: updated },
    });
  }

  function clearSlot(slotId: string) {
    const newContent = { ...slide!.slotContent };
    delete newContent[slotId];
    onUpdateSlide({ ...slide!, slotContent: newContent });
  }

  function setSlotComponent(slotId: string, type: ComponentType) {
    const comp = createDefaultComponent(type);
    onUpdateSlide({
      ...slide!,
      slotContent: { ...slide!.slotContent, [slotId]: comp },
    });
  }

  function updateCalloutBar(callout: CalloutBarComponent | undefined) {
    onUpdateSlide({ ...slide!, calloutBar: callout });
  }

  function changeTemplate(newTemplateId: string) {
    const newTemplate = getTemplate(newTemplateId);
    const oldComponents = Object.values(slide!.slotContent);
    const newSlotContent: Record<string, SlideComponent> = {};

    const remaining = [...oldComponents];
    for (const slot of newTemplate.slots) {
      if (remaining.length === 0) break;
      newSlotContent[slot.slotId] = remaining.shift()!;
    }

    onUpdateSlide({ ...slide!, templateId: newTemplateId, slotContent: newSlotContent });
    setShowLayoutPicker(false);
  }

  function swapSlots(slotA: string, slotB: string) {
    const compA = slide!.slotContent[slotA];
    const compB = slide!.slotContent[slotB];
    const newContent = { ...slide!.slotContent };
    if (compA && compB) {
      newContent[slotA] = compB;
      newContent[slotB] = compA;
    } else if (compA) {
      delete newContent[slotA];
      newContent[slotB] = compA;
    } else if (compB) {
      delete newContent[slotB];
      newContent[slotA] = compB;
    }
    onUpdateSlide({ ...slide!, slotContent: newContent });
    setSwapSource(null);
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-white border-l border-gray-200">
      <div className="p-5">
        {/* Slide Header — So What + Description */}
        <div className="mb-4 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label className="text-sm font-semibold" style={{ color: '#002F4A' }}>So What?</Label>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: '#E8610A20', color: '#E8610A' }}>Required</span>
            </div>
            <span className="text-[10px] text-gray-400 block mb-1">The key takeaway — what should the audience remember?</span>
            <Input
              value={slide.soWhat || ''}
              onChange={(e) => updateField('soWhat', e.target.value)}
              placeholder="e.g. Pricing optimization drove 12% margin improvement"
              className="text-sm"
              style={!slide.soWhat ? { borderColor: '#E8610A60' } : undefined}
            />
            {!slide.soWhat && (
              <p className="text-[10px] mt-1" style={{ color: '#E8610A' }}>Every slide needs a "So What" — the bold claim displayed in the title.</p>
            )}
          </div>

          {/* Key Metric Field */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label className="text-sm font-semibold" style={{ color: '#002F4A' }}>Key Metric</Label>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-gray-500" style={{ backgroundColor: '#F3F4F4' }}>Optional</span>
            </div>
            <span className="text-[10px] text-gray-400 block mb-1">The most important number displayed prominently in the title area</span>
            <Input
              value={slide.keyMetric || ''}
              onChange={(e) => updateField('keyMetric', e.target.value)}
              placeholder="e.g. -2M ha/yr, $2.4M, +15%"
              className="text-sm"
            />
          </div>

          {/* Metric Label Field - only show if keyMetric exists */}
          {slide.keyMetric && (
            <div>
              <Label className="text-xs text-gray-500">Metric Label</Label>
              <span className="text-[10px] text-gray-400 block mb-1">Explains what the metric means</span>
              <Input
                value={slide.keyMetricLabel || ''}
                onChange={(e) => updateField('keyMetricLabel', e.target.value)}
                placeholder="e.g. Reduction Since 2018, Annual Revenue"
                className="text-xs"
              />
            </div>
          )}

          <div>
            <Label className="text-xs text-gray-500">Description</Label>
            <span className="text-[10px] text-gray-400 block mb-1">Supporting context shown after the bold takeaway</span>
            <Input
              value={slide.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="e.g. Q3 results across all product lines"
              className="text-xs"
            />
          </div>

          {/* Original Prompt - Read Only */}
          {slide.prompt && (
            <div>
              <Label className="text-xs text-gray-500">Original Prompt</Label>
              <span className="text-[10px] text-gray-400 block mb-1">The prompt used to generate this slide</span>
              <textarea
                value={slide.prompt}
                readOnly
                className="w-full text-xs p-2 border rounded bg-gray-50 text-gray-600 resize-none"
                rows={3}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          )}
        </div>

        {/* Layout Template */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Layout</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLayoutPicker(!showLayoutPicker)}
              className="h-7 text-xs gap-1"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {showLayoutPicker ? 'Close' : 'Change Layout'}
            </Button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded border border-gray-200 bg-gray-50 mb-2">
            <TemplateMiniPreview template={template} size={40} />
            <div>
              <p className="text-xs font-medium" style={{ color: '#25282A' }}>{template.displayName}</p>
              <p className="text-[10px] text-gray-400">{template.slotCount} slot{template.slotCount !== 1 ? 's' : ''} &middot; {template.category}</p>
            </div>
          </div>

          {showLayoutPicker && (
            <LayoutPickerPanel
              currentTemplateId={slide.templateId}
              onSelect={changeTemplate}
              onClose={() => setShowLayoutPicker(false)}
            />
          )}
        </div>

        {/* Slot Arrangement Map */}
        {template.slots.length > 1 && (
          <SlotArrangementMap
            template={template}
            slotContent={slide.slotContent}
            swapSource={swapSource}
            onSlotClick={(slotId) => {
              if (!swapSource) {
                setSwapSource(slotId);
              } else if (swapSource === slotId) {
                setSwapSource(null);
              } else {
                swapSlots(swapSource, slotId);
              }
            }}
            onCancel={() => setSwapSource(null)}
          />
        )}

        {/* Slot content editors */}
        <div className="space-y-3">
          {template.slots.map((slot) => {
            const comp = slide.slotContent[slot.slotId];
            return (
              <div key={slot.slotId} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">{slot.label}</span>
                  <span className="flex-1" />
                  {comp ? (
                    <>
                      <Select
                        value={comp.type}
                        onValueChange={(v) => setSlotComponent(slot.slotId, v as ComponentType)}
                      >
                        <SelectTrigger className="h-6 w-28 text-[10px] px-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COMPONENT_META)
                            .filter(([k]) => k !== 'callout_bar')
                            .map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <button onClick={() => clearSlot(slot.slotId)} className="text-red-300 hover:text-red-600 ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-300 italic">Empty</span>
                  )}
                </div>

                <div className="p-3">
                  {comp ? (
                    <ComponentFieldEditor comp={comp} onUpdate={(c) => updateSlotComponent(slot.slotId, c)} />
                  ) : (
                    <SlotComponentPicker onPick={(type) => setSlotComponent(slot.slotId, type)} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add more content nudge — when all slots are filled */}
        {(() => {
          const filledCount = template.slots.filter(s => slide.slotContent[s.slotId]).length;
          const allFilled = filledCount === template.slots.length;

          if (!allFilled) return null;

          const upgradeTemplates = LAYOUT_TEMPLATES
            .filter(t => t.slotCount > template.slotCount && t.templateId !== template.templateId)
            .sort((a, b) => a.slotCount - b.slotCount)
            .slice(0, 6);

          if (upgradeTemplates.length === 0) return null;

          return (
            <div className="mt-3 border border-dashed rounded-lg p-3" style={{ borderColor: '#1B6B7B80' }}>
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-4 h-4" style={{ color: '#1B6B7B' }} />
                <span className="text-xs font-medium" style={{ color: '#25282A' }}>Want more content?</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-2.5">
                All {template.slotCount} slot{template.slotCount !== 1 ? 's' : ''} filled. Switch to a layout with more slots to add components:
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {upgradeTemplates.map(t => (
                  <button
                    key={t.templateId}
                    onClick={() => changeTemplate(t.templateId)}
                    className="flex flex-col items-center gap-1 p-2 rounded border border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 transition-all text-center"
                  >
                    <TemplateMiniPreview template={t} size={32} />
                    <span className="text-[9px] leading-tight" style={{ color: '#25282A' }}>{t.displayName}</span>
                    <span className="text-[8px] text-gray-400">{t.slotCount} slots</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Callout Bar (footer zone) */}
        <div className="mt-4 border rounded-lg overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Callout Bar</span>
            <span className="text-[10px] text-gray-300 ml-1">(footer)</span>
            <span className="flex-1" />
            {slide.calloutBar ? (
              <button onClick={() => updateCalloutBar(undefined)} className="text-red-300 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateCalloutBar({ id: generateComponentId(), type: 'callout_bar', text: '', region: 'full' })}
                className="h-6 text-[10px] text-gray-500"
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            )}
          </div>
          {slide.calloutBar && (
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <FieldLabel hint="The one line the audience should remember">Message</FieldLabel>
                <span className={`text-[10px] ${(slide.calloutBar.text || '').length > MAX_CONSTRAINTS.calloutBarMaxChars ? 'text-red-500' : 'text-gray-500'}`}>
                  {(slide.calloutBar.text || '').length} / {MAX_CONSTRAINTS.calloutBarMaxChars}
                </span>
              </div>
              <Textarea
                value={slide.calloutBar.text || ''}
                onChange={(e) => {
                  const text = e.target.value;
                  if (text.length <= MAX_CONSTRAINTS.calloutBarMaxChars) {
                    updateCalloutBar({ ...slide.calloutBar!, text });
                  }
                }}
                placeholder="Key takeaway (keep concise)..."
                rows={2}
                className="text-xs"
              />
              {(slide.calloutBar.text || '').length > MAX_CONSTRAINTS.calloutBarMaxChars && (
                <p className="text-[10px] text-red-500">Text exceeds recommended limit. Shorten for better readability.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LAYOUT PICKER PANEL ──────────────────────────────────────

function LayoutPickerPanel({ currentTemplateId, onSelect, onClose }: {
  currentTemplateId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: '#25282A' }}>Choose Layout</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {TEMPLATE_CATEGORIES.map(({ key, label }) => {
        const templates = LAYOUT_TEMPLATES.filter(t => t.category === key);
        if (templates.length === 0) return null;
        return (
          <div key={key} className="mb-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {templates.map(t => (
                <button
                  key={t.templateId}
                  onClick={() => onSelect(t.templateId)}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded border transition-all text-center
                    ${currentTemplateId === t.templateId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-400'}
                  `}
                >
                  <TemplateMiniPreview template={t} size={36} />
                  <span className="text-[9px] leading-tight" style={{ color: '#25282A' }}>{t.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── TEMPLATE MINI PREVIEW ────────────────────────────────────

function TemplateMiniPreview({ template, size = 36 }: { template: LayoutTemplate; size?: number }) {
  const maxRow = Math.max(...template.slots.map(s => s.grid.row + (s.grid.row_span || 1) - 1));
  const h = size * 0.6;
  const w = size;
  const gap = 1;
  const colors = ['#002F4A', '#1B6B7B', '#E8610A', '#4472C4', '#6B7280'];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      {template.slots.map((slot, i) => {
        const colW = (w - (11 * gap)) / 12;
        const rowH = (h - (maxRow - 1) * gap) / maxRow;
        const x = (slot.grid.col - 1) * (colW + gap);
        const y2 = (slot.grid.row - 1) * (rowH + gap);
        const sw = slot.grid.col_span * colW + (slot.grid.col_span - 1) * gap;
        const rowSpan = slot.grid.row_span || 1;
        const sh = rowSpan * rowH + (rowSpan - 1) * gap;
        return (
          <rect
            key={slot.slotId}
            x={x}
            y={y2}
            width={sw}
            height={sh}
            rx={1}
            fill={colors[i % colors.length]}
            opacity={0.7}
          />
        );
      })}
    </svg>
  );
}

// ─── SLOT COMPONENT PICKER ────────────────────────────────────

function SlotComponentPicker({ onPick }: { onPick: (type: ComponentType) => void }) {
  const categories = ['content', 'data', 'layout', 'visual'] as const;
  const categoryLabels = { content: 'Content', data: 'Data & Metrics', layout: 'Layout', visual: 'Visual' };

  return (
    <div>
      <p className="text-[10px] text-gray-400 mb-2">Choose a component for this slot:</p>
      {categories.map(cat => {
        const items = COMPONENT_PALETTE.filter(p => p.category === cat && p.type !== 'callout_bar');
        if (items.length === 0) return null;
        return (
          <div key={cat} className="mb-1.5">
            <p className="text-[9px] text-gray-300 uppercase tracking-wider mb-0.5">{categoryLabels[cat]}</p>
            <div className="flex flex-wrap gap-1">
              {items.map(({ type }) => (
                <button
                  key={type}
                  onClick={() => onPick(type)}
                  className="text-[10px] px-2 py-0.5 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  style={{ color: '#25282A' }}
                >
                  {COMPONENT_META[type].label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── COMPONENT FIELD EDITORS ──────────────────────────────────

function ComponentFieldEditor({ comp, onUpdate }: { comp: SlideComponent; onUpdate: (c: SlideComponent) => void }) {
  switch (comp.type) {
    case 'bullet_list': return <BulletListEditor comp={comp} onUpdate={onUpdate} />;
    case 'stat_hero': return <StatHeroEditor comp={comp} onUpdate={onUpdate} />;
    case 'kpi_cards': return <KpiCardsEditor comp={comp} onUpdate={onUpdate} />;
    case 'icon_columns': return <IconColumnsEditor comp={comp} onUpdate={onUpdate} />;
    case 'process_flow': return <ProcessFlowEditor comp={comp} onUpdate={onUpdate} />;
    case 'data_table': return <DataTableEditor comp={comp} onUpdate={onUpdate} />;
    case 'simple_table': return <SimpleTableEditor comp={comp} onUpdate={onUpdate} />;
    case 'chart': return <ChartEditor comp={comp} onUpdate={onUpdate} />;
    case 'callout_bar': return <CalloutBarEditor comp={comp} onUpdate={onUpdate} />;
    case 'timeline_track': return <TimelineEditor comp={comp} onUpdate={onUpdate} />;
    case 'icon_grid': return <IconGridEditor comp={comp} onUpdate={onUpdate} />;
    case 'screenshot': return <ScreenshotEditor comp={comp} onUpdate={onUpdate} />;
    case 'text_block': return <TextBlockEditor comp={comp} onUpdate={onUpdate} />;
    case 'waterfall_chart': return <WaterfallChartEditor comp={comp as any} onUpdate={onUpdate} />;
    case 'comparison_bars': return <ComparisonBarsEditor comp={comp as any} onUpdate={onUpdate} />;
    case 'team_structure': return <TeamStructureEditor comp={comp as any} onUpdate={onUpdate} />;
    default: return <p className="text-xs text-gray-400">No editor for this component type</p>;
  }
}

// ─── SHARED HELPERS ───────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1">
      <Label className="text-xs">{children}</Label>
      {hint && <span className="text-[10px] text-gray-400 ml-1.5">{hint}</span>}
    </div>
  );
}

function ColorSelect({ value, onChange }: { value: BrandColor | undefined; onChange: (v: BrandColor) => void }) {
  return (
    <Select value={value || 'navy'} onValueChange={(v) => onChange(v as BrandColor)}>
      <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="navy">Navy</SelectItem>
        <SelectItem value="teal">Teal</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ItemListEditor({ items, max, onUpdate, placeholder }: {
  items: string[];
  max: number;
  onUpdate: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1.5">
            <Input
              value={item}
              onChange={(e) => { const u = [...items]; u[i] = e.target.value; onUpdate(u); }}
              placeholder={placeholder || `Item ${i + 1}`}
              className="text-xs h-8"
            />
            <Button size="icon" variant="ghost" onClick={() => onUpdate(items.filter((_, idx) => idx !== i))} className="h-8 w-8 flex-shrink-0" disabled={items.length <= 1}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      {items.length < max && (
        <Button size="sm" variant="ghost" onClick={() => onUpdate([...items, ''])} className="h-6 text-[10px] mt-1.5 text-gray-500">
          <Plus className="w-3 h-3 mr-1" /> Add item
        </Button>
      )}
    </div>
  );
}

function createDefaultComponent(type: ComponentType): SlideComponent {
  const id = generateComponentId();
  switch (type) {
    case 'bullet_list': return { id, type, items: [''], bulletColor: 'navy' };
    case 'stat_hero': return { id, type, value: '', label: '', accentColor: 'navy' };
    case 'kpi_cards': return { id, type, metrics: [{ value: '', label: '', trend: 'flat' }] };
    case 'icon_columns': return { id, type, columns: [{ icon: '💰', header: '', headerColor: 'navy', items: [''] }] };
    case 'process_flow': return { id, type, stages: [{ label: '', timeframe: '', items: [''] }] };
    case 'data_table': return { id, type, rowLabels: [''], columns: [{ header: '', rows: [''] }] };
    case 'simple_table': return { id, type, title: '', headers: ['Before', 'After'], rows: [{ label: '', values: ['', ''] }] };
    case 'chart': return { id, type, chartType: 'bar', data: [{ label: '', value: 0 }, { label: '', value: 0 }] };
    case 'callout_bar': return { id, type, text: '' };
    case 'timeline_track': return { id, type, milestones: [{ date: '', title: '', description: '' }, { date: '', title: '', description: '' }] };
    case 'icon_grid': return { id, type, blocks: [{ icon: '📊', title: '', description: '' }] };
    case 'screenshot': return { id, type, placeholderText: '[Screenshot / Image]' };
    case 'text_block': return { id, type, heading: '', headingColor: 'navy', text: '' };
    case 'waterfall_chart': return { id, type, bars: [{ label: 'Starting Value', value: 10, isTotal: false }, { label: 'Change', value: 0, delta: 2, deltaLabel: '+$2M', isTotal: false }, { label: 'Ending Value', value: 12, isTotal: true }], showConnectors: true };
    case 'comparison_bars': return { id, type, bars: [{ label: 'Before', value: '8%', percent: 8 }, { label: 'After', value: '12%', percent: 12 }], callout: '', accentColor: 'teal' };
    case 'team_structure': return { id, type, teams: [{ icon: '👥', name: 'Team Name', sections: [{ heading: 'Section', items: ['Role 1', 'Role 2'] }] }], connector: '+' };
    default: return { id, type: 'bullet_list', items: [''], bulletColor: 'navy' } as any;
  }
}

// ─── INDIVIDUAL EDITORS ───────────────────────────────────────

function WaterfallChartEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  return (
    <div className="space-y-3">
      {/* Bars editor */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Bars
        </label>
        {(comp.bars || []).map((bar: any, i: number) => (
          <div key={i} className="mt-2 p-2 bg-gray-50 rounded border space-y-1">
            <div className="flex gap-2">
              <input
                className="flex-1 text-xs border rounded px-2 py-1"
                value={bar.label}
                placeholder="Label"
                onChange={e => {
                  const bars = [...comp.bars];
                  bars[i] = { ...bars[i], label: e.target.value };
                  onUpdate({ ...comp, bars });
                }}
              />
              <input
                className="w-20 text-xs border rounded px-2 py-1"
                value={bar.value}
                placeholder="Value"
                type="number"
                onChange={e => {
                  const bars = [...comp.bars];
                  bars[i] = { ...bars[i], value: Number(e.target.value) };
                  onUpdate({ ...comp, bars });
                }}
              />
            </div>
            <input
              className="w-full text-xs border rounded px-2 py-1"
              value={bar.deltaLabel || ''}
              placeholder="Delta label (e.g. +$2M cost controls)"
              onChange={e => {
                const bars = [...comp.bars];
                bars[i] = { ...bars[i], deltaLabel: e.target.value };
                onUpdate({ ...comp, bars });
              }}
            />
          </div>
        ))}
      </div>

      {/* Annotations editor */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Annotations
          </label>
          <button
            className="text-xs text-teal-600 hover:text-teal-800"
            onClick={() => {
              const annotations = [...(comp.annotations || []),
                { targetBar: 0, text: '', side: 'above', color: 'orange' }
              ];
              onUpdate({ ...comp, annotations });
            }}
          >
            + Add
          </button>
        </div>
        {(comp.annotations || []).map((ann: any, i: number) => (
          <div key={i} className="mt-2 p-2 bg-orange-50 rounded border space-y-1">
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-500">Bar</span>
              <input
                className="w-12 text-xs border rounded px-2 py-1"
                value={ann.targetBar}
                type="number"
                min={0}
                onChange={e => {
                  const annotations = [...(comp.annotations || [])];
                  annotations[i] = { ...annotations[i],
                    targetBar: Number(e.target.value) };
                  onUpdate({ ...comp, annotations });
                }}
              />
              <select
                className="text-xs border rounded px-1 py-1"
                value={ann.side || 'above'}
                onChange={e => {
                  const annotations = [...(comp.annotations || [])];
                  annotations[i] = { ...annotations[i], side: e.target.value };
                  onUpdate({ ...comp, annotations });
                }}
              >
                <option value="above">Above</option>
                <option value="right">Right</option>
                <option value="below">Below</option>
              </select>
              <button
                className="text-xs text-red-400 hover:text-red-600 ml-auto"
                onClick={() => {
                  const annotations = (comp.annotations || [])
                    .filter((_: any, j: number) => j !== i);
                  onUpdate({ ...comp, annotations });
                }}
              >
                ✕
              </button>
            </div>
            <textarea
              className="w-full text-xs border rounded px-2 py-1 resize-none"
              rows={2}
              value={ann.text}
              placeholder="Annotation text..."
              onChange={e => {
                const annotations = [...(comp.annotations || [])];
                annotations[i] = { ...annotations[i], text: e.target.value };
                onUpdate({ ...comp, annotations });
              }}
            />
          </div>
        ))}
        {(comp.annotations || []).length === 0 && (
          <p className="text-xs text-gray-400 mt-1">
            No annotations — AI will generate these automatically,
            or click + Add to create one manually.
          </p>
        )}
      </div>
    </div>
  );
}

function ComparisonBarsEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  return (
    <div className="space-y-3">
      {(comp.bars || []).map((bar: any, i: number) => (
        <div key={i} className="p-2 bg-gray-50 rounded border space-y-1">
          <div className="flex gap-2">
            <input
              className="flex-1 text-xs border rounded px-2 py-1"
              value={bar.label}
              placeholder="Label"
              onChange={e => {
                const bars = [...comp.bars];
                bars[i] = { ...bars[i], label: e.target.value };
                onUpdate({ ...comp, bars });
              }}
            />
            <input
              className="w-20 text-xs border rounded px-2 py-1"
              value={bar.value}
              placeholder="Value"
              onChange={e => {
                const bars = [...comp.bars];
                bars[i] = { ...bars[i], value: e.target.value };
                onUpdate({ ...comp, bars });
              }}
            />
          </div>
        </div>
      ))}
      <div>
        <label className="text-xs text-gray-500">Callout text</label>
        <input
          className="w-full text-xs border rounded px-2 py-1 mt-1"
          value={comp.callout || ''}
          placeholder="e.g. +33% improvement"
          onChange={e => onUpdate({ ...comp, callout: e.target.value })}
        />
      </div>
    </div>
  );
}

function TeamStructureEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  return (
    <div className="space-y-3">
      {(comp.teams || []).map((team: any, ti: number) => (
        <div key={ti} className="p-2 bg-gray-50 rounded border space-y-2">
          <input
            className="w-full text-xs border rounded px-2 py-1 font-medium"
            value={team.name}
            placeholder="Team name"
            onChange={e => {
              const teams = [...comp.teams];
              teams[ti] = { ...teams[ti], name: e.target.value };
              onUpdate({ ...comp, teams });
            }}
          />
          {(team.sections || []).map((section: any, si: number) => (
            <div key={si} className="pl-2 border-l-2 border-teal-200 space-y-1">
              <input
                className="w-full text-xs border rounded px-2 py-1"
                value={section.heading}
                placeholder="Section heading"
                onChange={e => {
                  const teams = [...comp.teams];
                  const sections = [...teams[ti].sections];
                  sections[si] = { ...sections[si], heading: e.target.value };
                  teams[ti] = { ...teams[ti], sections };
                  onUpdate({ ...comp, teams });
                }}
              />
              {(section.items || []).map((item: string, ii: number) => (
                <input
                  key={ii}
                  className="w-full text-xs border rounded px-2 py-1"
                  value={item}
                  placeholder="Role or detail"
                  onChange={e => {
                    const teams = [...comp.teams];
                    const sections = [...teams[ti].sections];
                    const items = [...sections[si].items];
                    items[ii] = e.target.value;
                    sections[si] = { ...sections[si], items };
                    teams[ti] = { ...teams[ti], sections };
                    onUpdate({ ...comp, teams });
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function BulletListEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel hint="optional">Heading</FieldLabel>
        <Input value={comp.heading || ''} onChange={(e) => onUpdate({ ...comp, heading: e.target.value })} placeholder="Section heading" className="text-xs h-8" />
      </div>
      <div className="flex items-center gap-2">
        <FieldLabel>Color</FieldLabel>
        <ColorSelect value={comp.bulletColor} onChange={(v) => onUpdate({ ...comp, bulletColor: v })} />
      </div>
      <div>
        <FieldLabel hint={`max ${MAX_CONSTRAINTS.bulletsPerList}`}>Items</FieldLabel>
        <ItemListEditor items={comp.items || ['']} max={MAX_CONSTRAINTS.bulletsPerList} onUpdate={(items) => onUpdate({ ...comp, items })} placeholder="Bullet point" />
      </div>
    </div>
  );
}

function StatHeroEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Stat Value</FieldLabel>
        <Input value={comp.value || ''} onChange={(e) => onUpdate({ ...comp, value: e.target.value })} placeholder="89%" className="text-xs h-8" />
      </div>
      <div>
        <FieldLabel>Label</FieldLabel>
        <Input value={comp.label || ''} onChange={(e) => onUpdate({ ...comp, label: e.target.value })} placeholder="Customer Satisfaction" className="text-xs h-8" />
      </div>
      <div>
        <FieldLabel hint="optional">Supporting Text</FieldLabel>
        <Input value={comp.supportingText || ''} onChange={(e) => onUpdate({ ...comp, supportingText: e.target.value })} placeholder="Based on 2,400 responses" className="text-xs h-8" />
      </div>
      <div className="flex items-center gap-2">
        <FieldLabel>Color</FieldLabel>
        <ColorSelect value={comp.accentColor} onChange={(v) => onUpdate({ ...comp, accentColor: v })} />
      </div>
    </div>
  );
}

function KpiCardsEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  const metrics = comp.metrics || [];
  const updateMetric = (i: number, field: string, value: any) => {
    const m = [...metrics]; m[i] = { ...m[i], [field]: value }; onUpdate({ ...comp, metrics: m });
  };
  return (
    <div className="space-y-2">
      {metrics.map((m: any, i: number) => (
        <div key={i} className="border rounded p-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Metric {i + 1}</span>
            <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, metrics: metrics.filter((_: any, idx: number) => idx !== i) })} className="h-5 px-1" disabled={metrics.length <= 1}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Input value={m.value} onChange={(e) => updateMetric(i, 'value', e.target.value)} placeholder="42%" className="text-xs h-7" />
            <Select value={m.trend || 'flat'} onValueChange={(v) => updateMetric(i, 'trend', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="up">Up</SelectItem>
                <SelectItem value="down">Down</SelectItem>
                <SelectItem value="flat">Flat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input value={m.label} onChange={(e) => updateMetric(i, 'label', e.target.value)} placeholder="Metric label" className="text-xs h-7" />
        </div>
      ))}
      {metrics.length < MAX_CONSTRAINTS.kpiMetricsMax && (
        <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, metrics: [...metrics, { value: '', label: '', trend: 'flat' }] })} className="h-6 text-[10px] text-gray-500">
          <Plus className="w-3 h-3 mr-1" /> Add metric
        </Button>
      )}
    </div>
  );
}

function IconColumnsEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  const columns = comp.columns || [];
  const updateCol = (i: number, field: string, value: any) => {
    const c = [...columns]; c[i] = { ...c[i], [field]: value }; onUpdate({ ...comp, columns: c });
  };
  return (
    <div className="space-y-2">
      {columns.map((col: any, i: number) => (
        <div key={i} className="border rounded p-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Column {i + 1}</span>
            <div className="flex items-center gap-1">
              <ColorSelect value={col.headerColor} onChange={(v) => updateCol(i, 'headerColor', v)} />
              <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, columns: columns.filter((_: any, idx: number) => idx !== i) })} className="h-5 px-1" disabled={columns.length <= 1}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex gap-1.5 items-center">
            <div>
              <FieldLabel>Icon</FieldLabel>
              <IconPicker value={col.icon || ''} onChange={(emoji) => updateCol(i, 'icon', emoji)} />
            </div>
            <div className="flex-1">
              <FieldLabel>Header</FieldLabel>
              <Input value={col.header} onChange={(e) => updateCol(i, 'header', e.target.value)} placeholder="Header" className="text-xs h-7" />
            </div>
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="flex-1">
              <FieldLabel>Badge (optional)</FieldLabel>
              <Input value={col.badge || ''} onChange={(e) => updateCol(i, 'badge', e.target.value || undefined)} placeholder="1, 2, 3, ①, ②, ③" maxLength={3} className="text-xs h-7" />
            </div>
            <div className="flex-1">
              <FieldLabel>Badge Position</FieldLabel>
              <select value={col.badgePosition || 'top-left'} onChange={(e) => updateCol(i, 'badgePosition', e.target.value)} className="text-xs h-7 px-2 border rounded">
                <option value="top-left">Top Left</option>
                <option value="top-center">Top Center</option>
              </select>
            </div>
          </div>
          <ItemListEditor items={col.items || ['']} max={MAX_CONSTRAINTS.bulletsPerColumn} onUpdate={(items) => updateCol(i, 'items', items)} placeholder="Bullet" />
        </div>
      ))}
      {columns.length < MAX_CONSTRAINTS.columnsMax && (
        <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, columns: [...columns, { icon: '💰', header: '', headerColor: 'navy', items: [''] }] })} className="h-6 text-[10px] text-gray-500">
          <Plus className="w-3 h-3 mr-1" /> Add column
        </Button>
      )}
    </div>
  );
}

function ProcessFlowEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  const stages = comp.stages || [];
  const updateStage = (i: number, field: string, value: any) => {
    const s = [...stages]; s[i] = { ...s[i], [field]: value }; onUpdate({ ...comp, stages: s });
  };
  return (
    <div className="space-y-2">
      {stages.map((stage: any, i: number) => (
        <div key={i} className="border rounded p-2 space-y-1.5" style={{ backgroundColor: stage.highlighted ? '#EDF5F7' : 'transparent' }}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Stage {i + 1}</span>
            <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, stages: stages.filter((_: any, idx: number) => idx !== i) })} className="h-5 px-1" disabled={stages.length <= 1}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex gap-1.5">
            <Input value={stage.label} onChange={(e) => updateStage(i, 'label', e.target.value)} placeholder="Stage name" className="text-xs h-7 flex-1" />
            <Input value={stage.timeframe || ''} onChange={(e) => updateStage(i, 'timeframe', e.target.value)} placeholder="2-4 weeks" className="text-xs h-7 w-24" />
          </div>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-1.5 text-[10px] text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={stage.highlighted || false}
                onChange={(e) => updateStage(i, 'highlighted', e.target.checked)}
                className="w-3 h-3"
              />
              <span>Emphasize (winner)</span>
            </label>
            {stage.highlighted && (
              <Select value={stage.accentColor || 'orange'} onValueChange={(val) => updateStage(i, 'accentColor', val)}>
                <SelectTrigger className="h-6 text-[10px] w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="navy">Navy</SelectItem>
                  <SelectItem value="teal">Teal</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <ItemListEditor items={stage.items || ['']} max={4} onUpdate={(items) => updateStage(i, 'items', items)} placeholder="Activity" />
        </div>
      ))}
      {stages.length < MAX_CONSTRAINTS.stagesMax && (
        <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, stages: [...stages, { label: '', timeframe: '', items: [''] }] })} className="h-6 text-[10px] text-gray-500">
          <Plus className="w-3 h-3 mr-1" /> Add stage
        </Button>
      )}
    </div>
  );
}

function DataTableEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  const rowLabels = comp.rowLabels || [];
  const columns = comp.columns || [];
  const updateRowLabel = (i: number, val: string) => { const l = [...rowLabels]; l[i] = val; onUpdate({ ...comp, rowLabels: l }); };
  const updateCell = (ci: number, ri: number, val: string) => { const c = [...columns]; const r = [...c[ci].rows]; r[ri] = val; c[ci] = { ...c[ci], rows: r }; onUpdate({ ...comp, columns: c }); };

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Columns</FieldLabel>
        <div className="space-y-1">
          {columns.map((col: any, ci: number) => (
            <div key={ci} className="flex gap-1.5">
              <Input value={col.header} onChange={(e) => { const c = [...columns]; c[ci] = { ...c[ci], header: e.target.value }; onUpdate({ ...comp, columns: c }); }} placeholder={`Column ${ci + 1}`} className="text-xs h-7 flex-1" />
              <Button size="icon" variant="ghost" onClick={() => onUpdate({ ...comp, columns: columns.filter((_: any, idx: number) => idx !== ci) })} disabled={columns.length <= 1} className="h-7 w-7">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {columns.length < MAX_CONSTRAINTS.tableColumnsMax && (
            <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, columns: [...columns, { header: '', rows: rowLabels.map(() => '') }] })} className="h-6 text-[10px] text-gray-500">
              <Plus className="w-3 h-3 mr-1" /> Add column
            </Button>
          )}
        </div>
      </div>
      <div>
        <FieldLabel>Rows</FieldLabel>
        {rowLabels.map((label: string, ri: number) => (
          <div key={ri} className="border rounded p-1.5 mb-1.5 space-y-1">
            <div className="flex gap-1.5">
              <Input value={label} onChange={(e) => updateRowLabel(ri, e.target.value)} placeholder="Row label" className="text-xs h-7 flex-1" />
              <Button size="icon" variant="ghost" onClick={() => {
                onUpdate({ ...comp, rowLabels: rowLabels.filter((_: any, idx: number) => idx !== ri), columns: columns.map((c: any) => ({ ...c, rows: c.rows.filter((_: any, idx: number) => idx !== ri) })) });
              }} disabled={rowLabels.length <= 1} className="h-7 w-7">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-1">
              {columns.map((col: any, ci: number) => (
                <Input key={ci} value={col.rows?.[ri] || ''} onChange={(e) => updateCell(ci, ri, e.target.value)} placeholder={col.header || `Col ${ci + 1}`} className="text-[10px] h-6 flex-1" />
              ))}
            </div>
          </div>
        ))}
        {rowLabels.length < MAX_CONSTRAINTS.tableRowsMax && (
          <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, rowLabels: [...rowLabels, ''], columns: columns.map((c: any) => ({ ...c, rows: [...c.rows, ''] })) })} className="h-6 text-[10px] text-gray-500">
            <Plus className="w-3 h-3 mr-1" /> Add row
          </Button>
        )}
      </div>
    </div>
  );
}

function SimpleTableEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  const headers = comp.headers || [];
  const rows = comp.rows || [];

  const updateHeader = (i: number, val: string) => {
    const h = [...headers];
    h[i] = val;
    onUpdate({ ...comp, headers: h });
  };

  const updateRow = (ri: number, field: 'label' | number, val: string) => {
    const r = [...rows];
    if (field === 'label') {
      r[ri] = { ...r[ri], label: val };
    } else {
      const values = [...(r[ri].values || [])];
      values[field] = val;
      r[ri] = { ...r[ri], values };
    }
    onUpdate({ ...comp, rows: r });
  };

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Table Title (optional)</FieldLabel>
        <Input
          value={comp.title || ''}
          onChange={(e) => onUpdate({ ...comp, title: e.target.value })}
          placeholder="e.g., Quantified Impact Example"
          className="text-xs h-7"
        />
      </div>

      <div>
        <FieldLabel>Column Headers</FieldLabel>
        <div className="flex gap-1.5">
          {headers.map((header: string, i: number) => (
            <Input
              key={i}
              value={header}
              onChange={(e) => updateHeader(i, e.target.value)}
              placeholder={`Column ${i + 1}`}
              className="text-xs h-7 flex-1"
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Data Rows</FieldLabel>
        {rows.map((row: any, ri: number) => (
          <div key={ri} className="border rounded p-1.5 mb-1.5 space-y-1">
            <div className="flex gap-1.5">
              <Input
                value={row.label || ''}
                onChange={(e) => updateRow(ri, 'label', e.target.value)}
                placeholder="Row label"
                className="text-xs h-7 flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onUpdate({ ...comp, rows: rows.filter((_: any, idx: number) => idx !== ri) })}
                disabled={rows.length <= 1}
                className="h-7 w-7"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-1">
              {headers.map((_: string, hi: number) => (
                <Input
                  key={hi}
                  value={(row.values || [])[hi] || ''}
                  onChange={(e) => updateRow(ri, hi, e.target.value)}
                  placeholder={headers[hi] || `Value ${hi + 1}`}
                  className="text-[10px] h-6 flex-1"
                />
              ))}
            </div>
          </div>
        ))}
        {rows.length < MAX_CONSTRAINTS.simpleTableRowsMax && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onUpdate({ ...comp, rows: [...rows, { label: '', values: headers.map(() => '') }] })}
            className="h-6 text-[10px] text-gray-500"
          >
            <Plus className="w-3 h-3 mr-1" /> Add row
          </Button>
        )}
      </div>
    </div>
  );
}

function ChartEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  const data = comp.data || [];
  const updatePoint = (i: number, field: string, value: any) => {
    const d = [...data]; d[i] = { ...d[i], [field]: field === 'value' ? parseFloat(value) || 0 : value }; onUpdate({ ...comp, data: d });
  };
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Chart Type</FieldLabel>
        <Select value={comp.chartType} onValueChange={(v) => onUpdate({ ...comp, chartType: v })}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar</SelectItem>
            <SelectItem value="line">Line</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <FieldLabel>Data Points</FieldLabel>
        {data.map((dp: any, i: number) => (
          <div key={i} className="flex gap-1.5 mb-1.5">
            <Input value={dp.label} onChange={(e) => updatePoint(i, 'label', e.target.value)} placeholder="Label" className="text-xs h-7 flex-1" />
            <Input value={dp.value} onChange={(e) => updatePoint(i, 'value', e.target.value)} placeholder="Value" className="text-xs h-7 w-16" type="number" />
            <Button size="icon" variant="ghost" onClick={() => onUpdate({ ...comp, data: data.filter((_: any, idx: number) => idx !== i) })} disabled={data.length <= 2} className="h-7 w-7">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {data.length < MAX_CONSTRAINTS.chartDataMax && (
          <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, data: [...data, { label: '', value: 0 }] })} className="h-6 text-[10px] text-gray-500">
            <Plus className="w-3 h-3 mr-1" /> Add point
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel hint="optional">Target Value</FieldLabel>
          <Input value={comp.targetLine?.value ?? ''} onChange={(e) => { const val = parseFloat(e.target.value); onUpdate({ ...comp, targetLine: isNaN(val) ? undefined : { value: val, label: comp.targetLine?.label || 'Target' } }); }} placeholder="80" type="number" className="text-xs h-7" />
        </div>
        <div>
          <FieldLabel hint="optional">Target Label</FieldLabel>
          <Input value={comp.targetLine?.label ?? ''} onChange={(e) => onUpdate({ ...comp, targetLine: comp.targetLine ? { ...comp.targetLine, label: e.target.value } : undefined })} placeholder="Target" className="text-xs h-7" />
        </div>
      </div>
    </div>
  );
}

function CalloutBarEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  return (
    <div>
      <FieldLabel hint="The one line the audience should remember">Message</FieldLabel>
      <Textarea value={comp.text || ''} onChange={(e) => onUpdate({ ...comp, text: e.target.value })} placeholder="Key takeaway..." rows={2} className="text-xs" />
    </div>
  );
}

function TimelineEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  const milestones = comp.milestones || [];
  const updateMs = (i: number, field: string, value: string) => {
    const m = [...milestones]; m[i] = { ...m[i], [field]: value }; onUpdate({ ...comp, milestones: m });
  };
  return (
    <div className="space-y-2">
      {milestones.map((ms: any, i: number) => (
        <div key={i} className="border rounded p-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Milestone {i + 1}</span>
            <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, milestones: milestones.filter((_: any, idx: number) => idx !== i) })} className="h-5 px-1" disabled={milestones.length <= 2}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Input value={ms.date} onChange={(e) => updateMs(i, 'date', e.target.value)} placeholder="Q1 2026" className="text-xs h-7" />
          <Input value={ms.title} onChange={(e) => updateMs(i, 'title', e.target.value)} placeholder="Milestone title" className="text-xs h-7" />
          <Input value={ms.description} onChange={(e) => updateMs(i, 'description', e.target.value)} placeholder="Description" className="text-xs h-7" />
        </div>
      ))}
      {milestones.length < MAX_CONSTRAINTS.milestonesMax && (
        <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, milestones: [...milestones, { date: '', title: '', description: '' }] })} className="h-6 text-[10px] text-gray-500">
          <Plus className="w-3 h-3 mr-1" /> Add milestone
        </Button>
      )}
    </div>
  );
}

function IconGridEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  const blocks = comp.blocks || [];
  const updateBlock = (i: number, field: string, value: string) => {
    const b = [...blocks]; b[i] = { ...b[i], [field]: value }; onUpdate({ ...comp, blocks: b });
  };
  return (
    <div className="space-y-2">
      {blocks.map((block: any, i: number) => (
        <div key={i} className="border rounded p-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Block {i + 1}</span>
            <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, blocks: blocks.filter((_: any, idx: number) => idx !== i) })} className="h-5 px-1" disabled={blocks.length <= 1}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex gap-1.5 items-center">
            <div>
              <FieldLabel>Icon</FieldLabel>
              <IconPicker value={block.icon || ''} onChange={(emoji) => updateBlock(i, 'icon', emoji)} />
            </div>
            <div className="flex-1">
              <FieldLabel>Title</FieldLabel>
              <Input value={block.title} onChange={(e) => updateBlock(i, 'title', e.target.value)} placeholder="Title" className="text-xs h-7" />
            </div>
          </div>
          <Input value={block.description} onChange={(e) => updateBlock(i, 'description', e.target.value)} placeholder="Description" className="text-xs h-7" />
        </div>
      ))}
      {blocks.length < MAX_CONSTRAINTS.gridBlocksMax && (
        <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...comp, blocks: [...blocks, { icon: '📊', title: '', description: '' }] })} className="h-6 text-[10px] text-gray-500">
          <Plus className="w-3 h-3 mr-1" /> Add block
        </Button>
      )}
    </div>
  );
}

function ScreenshotEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel hint="optional">Image URL</FieldLabel>
        <Input value={comp.imageUrl || ''} onChange={(e) => onUpdate({ ...comp, imageUrl: e.target.value })} placeholder="https://..." className="text-xs h-7" />
      </div>
      <div>
        <FieldLabel>Caption</FieldLabel>
        <Input value={comp.caption || ''} onChange={(e) => onUpdate({ ...comp, caption: e.target.value })} placeholder="Image caption" className="text-xs h-7" />
      </div>
      <div>
        <FieldLabel>Placeholder Text</FieldLabel>
        <Input value={comp.placeholderText || ''} onChange={(e) => onUpdate({ ...comp, placeholderText: e.target.value })} placeholder="[Screenshot Placeholder]" className="text-xs h-7" />
      </div>
    </div>
  );
}

function TextBlockEditor({ comp, onUpdate }: { comp: any; onUpdate: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <FieldLabel hint="optional">Heading</FieldLabel>
          <Input value={comp.heading || ''} onChange={(e) => onUpdate({ ...comp, heading: e.target.value })} placeholder="Section heading" className="text-xs h-7" />
        </div>
        <div>
          <FieldLabel>Color</FieldLabel>
          <ColorSelect value={comp.headingColor} onChange={(v) => onUpdate({ ...comp, headingColor: v })} />
        </div>
      </div>
      <div>
        <FieldLabel>Content</FieldLabel>
        <Textarea value={comp.text || ''} onChange={(e) => onUpdate({ ...comp, text: e.target.value })} placeholder="Block content..." rows={3} className="text-xs" />
      </div>
    </div>
  );
}

// ─── SLOT ARRANGEMENT MAP ─────────────────────────────────────

function SlotArrangementMap({ template, slotContent, swapSource, onSlotClick, onCancel }: {
  template: LayoutTemplate;
  slotContent: Record<string, SlideComponent>;
  swapSource: string | null;
  onSlotClick: (slotId: string) => void;
  onCancel: () => void;
}) {
  const maxRow = Math.max(...template.slots.map(s => s.grid.row + (s.grid.row_span || 1) - 1));

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <ArrowLeftRight className="w-3.5 h-3.5" style={{ color: '#1B6B7B' }} />
          <Label className="text-xs font-medium">Arrange Content</Label>
        </div>
        {swapSource && (
          <button
            onClick={onCancel}
            className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {swapSource && (
        <p className="text-[10px] mb-2 px-2 py-1 rounded" style={{ backgroundColor: '#FFF3E0', color: '#E8610A' }}>
          Now click the slot you want to swap with
        </p>
      )}

      {/* Interactive grid map */}
      <div
        className="relative rounded-lg border border-gray-200 bg-white overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      >
        <div
          className="absolute inset-1"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridTemplateRows: `repeat(${maxRow}, 1fr)`,
            gap: '3px',
          }}
        >
          {template.slots.map((slot, i) => {
            const comp = slotContent[slot.slotId];
            const isSource = swapSource === slot.slotId;
            const isTarget = swapSource && swapSource !== slot.slotId;
            const isEmpty = !comp;
            const colors = ['#002F4A', '#1B6B7B', '#E8610A', '#4472C4', '#6B7280'];
            const baseColor = colors[i % colors.length];

            return (
              <button
                key={slot.slotId}
                onClick={() => onSlotClick(slot.slotId)}
                className="relative rounded flex flex-col items-center justify-center text-center transition-all overflow-hidden"
                style={{
                  gridColumn: `${slot.grid.col} / span ${slot.grid.col_span}`,
                  gridRow: `${slot.grid.row} / span ${slot.grid.row_span || 1}`,
                  backgroundColor: isSource ? '#FFF3E0' : isEmpty ? '#F9FAFB' : `${baseColor}12`,
                  border: isSource
                    ? '2px solid #E8610A'
                    : isTarget
                    ? '2px dashed #1B6B7B'
                    : `1px solid ${isEmpty ? '#E5E7EB' : baseColor}40`,
                  cursor: isTarget ? 'pointer' : swapSource ? 'pointer' : 'pointer',
                  opacity: isTarget ? 0.9 : 1,
                }}
                title={`${slot.label}: ${comp ? COMPONENT_META[comp.type]?.label : 'Empty'} — click to ${swapSource ? 'swap here' : 'select for swap'}`}
              >
                <span
                  className="text-[8px] font-semibold uppercase tracking-wider leading-tight"
                  style={{ color: isSource ? '#E8610A' : isEmpty ? '#9CA3AF' : baseColor }}
                >
                  {slot.label}
                </span>
                {comp ? (
                  <span
                    className="text-[7px] mt-0.5 px-1 py-px rounded-sm leading-tight"
                    style={{ backgroundColor: `${baseColor}20`, color: baseColor }}
                  >
                    {COMPONENT_META[comp.type]?.label}
                  </span>
                ) : (
                  <span className="text-[7px] text-gray-300 mt-0.5 italic">empty</span>
                )}
                {isSource && (
                  <Move className="w-2.5 h-2.5 mt-0.5" style={{ color: '#E8610A' }} />
                )}
                {isTarget && (
                  <ArrowLeftRight className="w-2.5 h-2.5 mt-0.5" style={{ color: '#1B6B7B' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!swapSource && (
        <p className="text-[10px] text-gray-400 mt-1.5">Click a slot to start swapping its content with another slot</p>
      )}
    </div>
  );
}