// Composition Engine — 12-column grid layout that sizes to content, then centers.
// White space surrounds the composition, not inside components.

import { SlideComponent, CalloutBarComponent } from '../types';
import { LayoutTemplate, LayoutSlot, getTemplate } from '../layout-templates';

// ─── CANVAS ZONES (13.333" x 7.5" slide) ─────────────────────

export const BODY_TOP = 1.3;    // Reduced from 1.8 to minimize gap after title
export const BODY_BOTTOM = 6.4;
export const CALLOUT_Y = 6.3;   // Moved from 5.85 to sit closer to footer
export const CALLOUT_H = 0.4;
export const FOOTER_Y = 6.85;
export const BODY_LEFT = 0.75;
export const BODY_W = 11.833;

export const COL_GUTTER = 0.2;       // gutter between grid columns
export const ROW_GUTTER = 0.2;       // gutter between grid rows
export const GRID_COLS = 12;

// Card layout helpers
export const CARD_GUTTER = 0.25;
export const MAX_CARD_W = 4.2;

// ─── TYPES ────────────────────────────────────────────────────

export interface LayoutRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Measurement {
  minHeight: number;
  preferredHeight: number;
}

// ─── 12-COLUMN GRID MATH ──────────────────────────────────────

const TOTAL_GUTTERS = COL_GUTTER * (GRID_COLS - 1);
const SINGLE_COL_W = (BODY_W - TOTAL_GUTTERS) / GRID_COLS;

/** Left edge of a 1-based column index */
function colLeft(col: number): number {
  return BODY_LEFT + (col - 1) * (SINGLE_COL_W + COL_GUTTER);
}

/** Right edge of a 1-based column index */
function colRight(col: number): number {
  return colLeft(col) + SINGLE_COL_W;
}

/** X position and width for a slot's grid spec */
function slotX(slot: LayoutSlot): number {
  return colLeft(slot.grid.col);
}

function slotW(slot: LayoutSlot): number {
  const lastCol = slot.grid.col + slot.grid.col_span - 1;
  return colRight(lastCol) - colLeft(slot.grid.col);
}

// ─── MEASUREMENT FUNCTIONS ────────────────────────────────────

export function measureComponent(comp: SlideComponent): Measurement {
  switch (comp.type) {
    case 'bullet_list':     return measureBulletList(comp);
    case 'stat_hero':       return { minHeight: 1.5, preferredHeight: 2.0 };
    case 'kpi_cards':       return measureKpiCards(comp);
    case 'icon_columns':    return measureIconColumns(comp);
    case 'process_flow':    return measureProcessFlow(comp);
    case 'data_table':      return measureDataTable(comp);
    case 'simple_table':    return measureSimpleTable(comp);
    case 'chart':           return { minHeight: 2.0, preferredHeight: 3.0 };
    case 'callout_bar':     return { minHeight: 0.4, preferredHeight: 0.5 };
    case 'timeline_track':  return measureTimeline(comp);
    case 'icon_grid':       return measureIconGrid(comp);
    case 'screenshot':      return { minHeight: 1.5, preferredHeight: 2.5 };
    case 'text_block':      return measureTextBlock(comp);
    case 'comparison_bars': return measureComparisonBars(comp);
    case 'team_structure':  return measureTeamStructure(comp);
    case 'waterfall_chart': return { minHeight: 3.0, preferredHeight: 4.5 };
    case 'context_banner':  return measureContextBanner(comp);
    default:                return { minHeight: 1.5, preferredHeight: 2.0 };
  }
}

function measureBulletList(comp: any): Measurement {
  const bulletCount = Math.max((comp.items || []).length, 1);
  const lineHeight = 0.28;
  const headingHeight = comp.heading ? 0.4 : 0;
  const padding = 0.3;
  const min = headingHeight + bulletCount * lineHeight + padding;
  return { minHeight: min, preferredHeight: min * 1.25 };
}

function measureKpiCards(comp: any): Measurement {
  const count = (comp.metrics || []).length;
  const extra = count > 3 ? (count - 3) * 0.1 : 0;
  return { minHeight: 1.2 + extra, preferredHeight: 1.5 + extra };
}

function measureIconColumns(comp: any): Measurement {
  const columns = comp.columns || [];
  if (columns.length === 0) return { minHeight: 1.5, preferredHeight: 2.0 };
  const maxBullets = Math.max(...columns.map((c: any) => (c.items || []).length), 1);
  const hasTitledItems = columns.some((c: any) => (c.items || []).some((item: any) => typeof item === 'object' && item.title));
  const hasResultSection = columns.some((c: any) => c.resultLabel);
  const sectionLabelH = comp.sectionLabel ? 0.3 : 0;
  const iconAndHeader = 0.55 + 0.05;
  const lineHeight = hasTitledItems ? 0.48 : 0.28; // titled details need more space
  const resultH = hasResultSection ? 0.65 : 0;
  const padding = 0.3;
  const contentHeight = maxBullets * lineHeight + padding + resultH;
  const min = sectionLabelH + iconAndHeader + contentHeight;
  return { minHeight: min, preferredHeight: min * 1.15 };
}

function measureProcessFlow(comp: any): Measurement {
  const stages = comp.stages || [];
  if (stages.length === 0) return { minHeight: 1.5, preferredHeight: 2.0 };
  const hasTimeframes = stages.some((s: any) => s.timeframe);
  const timeframeH = hasTimeframes ? 0.35 : 0;
  // Check if any stage is highlighted (uses 0.7" instead of 0.55")
  const hasHighlighted = stages.some((s: any) => s.highlighted === true);
  const arrowH = hasHighlighted ? 0.7 : 0.55;
  const maxItems = Math.max(...stages.map((s: any) => (s.items || []).length), 1);
  const lineHeight = 0.25;
  const contentH = maxItems * lineHeight + 0.3;
  const min = timeframeH + arrowH + 0.15 + contentH;
  return { minHeight: min, preferredHeight: min * 1.2 };
}

function measureDataTable(comp: any): Measurement {
  const rowCount = Math.max((comp.rowLabels || []).length, 1);
  const headerH = 0.45;
  const rowH = 0.4;
  const min = headerH + rowCount * rowH + 0.1;
  return { minHeight: min, preferredHeight: min * 1.15 };
}

function measureSimpleTable(comp: any): Measurement {
  const rowCount = Math.max((comp.rows || []).length, 1);
  const titleH = comp.title ? 0.25 : 0;
  const headerH = 0.35;
  const rowH = 0.35;
  const min = titleH + headerH + rowCount * rowH;
  return { minHeight: min, preferredHeight: min };
}

function measureTimeline(comp: any): Measurement {
  const milestoneCount = (comp.milestones || []).length;
  const extra = milestoneCount > 4 ? (milestoneCount - 4) * 0.3 : 0;
  return { minHeight: 1.5 + extra, preferredHeight: 2.0 + extra };
}

function measureIconGrid(comp: any): Measurement {
  const blocks = comp.blocks || [];
  const count = Math.max(blocks.length, 1);
  const cols = count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const blockH = 1.4;
  const gap = 0.25;
  const min = rows * blockH + (rows - 1) * gap;
  return { minHeight: min, preferredHeight: min * 1.15 };
}

function measureTextBlock(comp: any): Measurement {
  const headingH = comp.heading ? 0.45 : 0;
  const text = comp.text || '';
  const charsPerLine = 90;
  const lines = Math.max(Math.ceil(text.length / charsPerLine), 1);
  const lineHeight = 0.25;
  const min = headingH + lines * lineHeight + 0.3;
  return { minHeight: min, preferredHeight: min * 1.2 };
}

function measureComparisonBars(comp: any): Measurement {
  const bars = comp.bars || [];
  const barCount = Math.max(bars.length, 1);
  const labelValueHeight = 0.25;  // Label/value row
  const barHeight = 0.25;  // Actual bar
  const barSpacing = 0.25;  // Gap between bars

  // Check if any bars have annotations
  const hasAnnotations = bars.some((b: any) => b.annotation);
  const annotationHeight = hasAnnotations ? 0.15 : 0;

  const calloutHeight = comp.callout ? 0.4 : 0;
  const padding = 0.15;  // Top padding
  const min = padding + barCount * (labelValueHeight + annotationHeight + 0.05 + barHeight + barSpacing) + calloutHeight;
  return { minHeight: min, preferredHeight: min * 1.05 };
}

function measureTeamStructure(comp: any): Measurement {
  const teams = comp.teams || [];
  if (teams.length === 0) return { minHeight: 2.0, preferredHeight: 2.5 };

  // Icon (0.8) + name (0.35) + sections
  const iconAndName = 1.2;

  // Find max section height across all teams
  let maxSectionHeight = 0;
  for (const team of teams) {
    let teamSectionHeight = 0;
    for (const section of team.sections || []) {
      teamSectionHeight += 0.28; // heading
      teamSectionHeight += (section.items || []).length * 0.22; // bullets
      teamSectionHeight += 0.15; // spacing
    }
    maxSectionHeight = Math.max(maxSectionHeight, teamSectionHeight);
  }

  const min = iconAndName + maxSectionHeight + 0.3;
  return { minHeight: min, preferredHeight: min * 1.15 };
}

function measureContextBanner(comp: any): Measurement {
  const text = comp.text || '';
  const label = comp.label || '';
  const totalChars = text.length + label.length;
  // Compact component — typically 1-2 lines of text in a colored strip
  const lineCount = Math.max(Math.ceil(totalChars / 120), 1);
  const min = 0.4 + (lineCount - 1) * 0.2;
  return { minHeight: min, preferredHeight: min + 0.1 };
}

// ─── GRID COMPOSITION ENGINE ──────────────────────────────────

export function compose(
  templateId: string,
  slotContent: Record<string, SlideComponent>,
  calloutBar?: CalloutBarComponent,
): Map<string, LayoutRect> {
  const template = getTemplate(templateId);
  const regions = new Map<string, LayoutRect>();

  // Body zone boundaries
  const bodyBottom = calloutBar ? CALLOUT_Y - 0.1 : BODY_BOTTOM;
  const availableHeight = bodyBottom - BODY_TOP;

  // Callout bar — fixed position, not in grid
  if (calloutBar) {
    regions.set(calloutBar.id, { x: BODY_LEFT, y: CALLOUT_Y, w: BODY_W, h: CALLOUT_H });
  }

  // Find all unique rows in the template
  const allRows = new Set<number>();
  for (const slot of template.slots) {
    const span = slot.grid.row_span || 1;
    for (let r = slot.grid.row; r < slot.grid.row + span; r++) {
      allRows.add(r);
    }
  }
  const sortedRows = [...allRows].sort((a, b) => a - b);
  const numRows = sortedRows.length;

  if (numRows === 0) return regions;

  // ── Step 1: Measure single-row-span slots per row → row preferred heights
  const rowPreferred = new Map<number, number>();
  const rowMin = new Map<number, number>();

  for (const row of sortedRows) {
    rowPreferred.set(row, 0.5); // minimum default
    rowMin.set(row, 0.3);
  }

  for (const slot of template.slots) {
    const comp = slotContent[slot.slotId];
    if (!comp) continue;
    const rowSpan = slot.grid.row_span || 1;
    if (rowSpan > 1) continue; // handle multi-row separately

    const m = measureComponent(comp);
    const curPref = rowPreferred.get(slot.grid.row) || 0;
    const curMin = rowMin.get(slot.grid.row) || 0;
    rowPreferred.set(slot.grid.row, Math.max(curPref, m.preferredHeight));
    rowMin.set(slot.grid.row, Math.max(curMin, m.minHeight));
  }

  // ── Step 2: Handle row_span > 1 — expand rows if needed
  for (const slot of template.slots) {
    const comp = slotContent[slot.slotId];
    if (!comp) continue;
    const rowSpan = slot.grid.row_span || 1;
    if (rowSpan <= 1) continue;

    const m = measureComponent(comp);
    const spannedRows = sortedRows.filter(
      r => r >= slot.grid.row && r < slot.grid.row + rowSpan,
    );
    const currentTotal =
      spannedRows.reduce((s, r) => s + (rowPreferred.get(r) || 0.5), 0) +
      (spannedRows.length - 1) * ROW_GUTTER;

    if (m.preferredHeight > currentTotal) {
      const extra = (m.preferredHeight - currentTotal) / spannedRows.length;
      for (const r of spannedRows) {
        rowPreferred.set(r, (rowPreferred.get(r) || 0.5) + extra);
      }
    }
  }

  // ── Step 3: Calculate total and center vertically
  const totalGaps = (numRows - 1) * ROW_GUTTER;
  const totalPreferred = sortedRows.reduce((s, r) => s + (rowPreferred.get(r) || 0), 0) + totalGaps;
  const totalMin = sortedRows.reduce((s, r) => s + (rowMin.get(r) || 0), 0) + totalGaps;

  let rowHeights: Map<number, number>;
  let topPadding: number;

  if (totalPreferred <= availableHeight) {
    rowHeights = new Map(rowPreferred);
    // Cap top padding at 0.3" to prevent excessive white space above content
    // Still provides visual breathing room while maximizing usable space for dense layouts
    const fullCentering = (availableHeight - totalPreferred) / 2;
    topPadding = Math.min(fullCentering, 0.3);
  } else if (totalMin <= availableHeight) {
    // Scale between min and preferred
    const prefOnly = sortedRows.reduce((s, r) => s + (rowPreferred.get(r) || 0), 0);
    const minOnly = sortedRows.reduce((s, r) => s + (rowMin.get(r) || 0), 0);
    const avail = availableHeight - totalGaps;
    const range = prefOnly - minOnly;
    const t = range > 0.01 ? (avail - minOnly) / range : 0;
    rowHeights = new Map<number, number>();
    for (const r of sortedRows) {
      const mn = rowMin.get(r) || 0;
      const pf = rowPreferred.get(r) || 0;
      rowHeights.set(r, mn + t * (pf - mn));
    }
    topPadding = 0;
  } else {
    rowHeights = new Map(rowMin);
    topPadding = 0;
  }

  // ── Step 4: Compute row Y positions
  const rowTops = new Map<number, number>();
  let y = BODY_TOP + topPadding;
  for (const r of sortedRows) {
    rowTops.set(r, y);
    y += (rowHeights.get(r) || 0) + ROW_GUTTER;
  }

  // ── Step 5: Assign absolute positions to each component
  for (const slot of template.slots) {
    const comp = slotContent[slot.slotId];
    if (!comp) continue;

    const rowSpan = slot.grid.row_span || 1;
    const slotTop = rowTops.get(slot.grid.row) || BODY_TOP;
    let slotHeight: number;

    if (rowSpan === 1) {
      slotHeight = rowHeights.get(slot.grid.row) || 1.0;
    } else {
      const lastRow = slot.grid.row + rowSpan - 1;
      const lastRowTop = rowTops.get(lastRow) || slotTop;
      const lastRowH = rowHeights.get(lastRow) || 1.0;
      slotHeight = lastRowTop + lastRowH - slotTop;
    }

    regions.set(comp.id, {
      x: slotX(slot),
      y: slotTop,
      w: slotW(slot),
      h: slotHeight,
    });
  }

  // ── Step 6: Hard clamp — nothing extends past the safe boundary
  const hardMax = calloutBar ? CALLOUT_Y - 0.05 : FOOTER_Y - 0.15;
  for (const [id, rect] of regions) {
    if (calloutBar && id === calloutBar.id) continue;
    const bottom = rect.y + rect.h;
    if (bottom > hardMax) {
      rect.h = Math.max(0.3, hardMax - rect.y);
    }
    if (rect.y > hardMax) {
      rect.y = hardMax - 0.3;
      rect.h = 0.3;
    }
  }

  return regions;
}

// ─── CARD WIDTH HELPERS ───────────────────────────────────────

export function computeCardLayout(
  cardCount: number,
  regionX: number,
  regionW: number,
  gutter: number = CARD_GUTTER,
  maxCardW: number = MAX_CARD_W,
): { x: number; w: number }[] {
  if (cardCount === 0) return [];
  const naturalW = (regionW - (cardCount - 1) * gutter) / cardCount;
  const cardW = Math.min(naturalW, maxCardW);
  const groupW = cardCount * cardW + (cardCount - 1) * gutter;
  const offsetX = regionX + (regionW - groupW) / 2;
  return Array.from({ length: cardCount }, (_, i) => ({
    x: offsetX + i * (cardW + gutter),
    w: cardW,
  }));
}
