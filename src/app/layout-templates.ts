// Layout Template Registry — 12-column grid system for DeckForge slides

export interface GridPosition {
  row: number;      // 1-based
  col: number;      // 1-based (1–12)
  col_span: number;
  row_span?: number; // defaults to 1
}

export interface LayoutSlot {
  slotId: string;
  label: string;
  grid: GridPosition;
  accepts: string[];   // component types or 'any'
  description: string;
}

export type TemplateCategory = 'simple' | 'comparison' | 'detail' | 'narrative' | 'overview' | 'dashboard';

export interface LayoutTemplate {
  templateId: string;
  displayName: string;
  description: string;
  category: TemplateCategory;
  slotCount: number;
  slots: LayoutSlot[];
}

// ─── TEMPLATE DEFINITIONS ─────────────────────────────────────

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  // ── SINGLE REGION ───────────────────────────────
  {
    templateId: 'full',
    displayName: 'Full Slide',
    description: 'One full-width content area',
    category: 'simple',
    slotCount: 1,
    slots: [
      { slotId: 'main', label: 'Main Content', grid: { row: 1, col: 1, col_span: 12 }, accepts: ['any'], description: 'Full-width content area' },
    ],
  },

  // ── TWO REGIONS ─────────────────────────────────
  {
    templateId: 'two-equal',
    displayName: 'Two Columns',
    description: 'Two equal columns side by side',
    category: 'comparison',
    slotCount: 2,
    slots: [
      { slotId: 'left', label: 'Left', grid: { row: 1, col: 1, col_span: 6 }, accepts: ['any'], description: 'Left half' },
      { slotId: 'right', label: 'Right', grid: { row: 1, col: 7, col_span: 6 }, accepts: ['any'], description: 'Right half' },
    ],
  },
  {
    templateId: 'wide-left',
    displayName: 'Wide Left + Sidebar',
    description: 'Wide main area with narrow sidebar',
    category: 'detail',
    slotCount: 2,
    slots: [
      { slotId: 'main', label: 'Main', grid: { row: 1, col: 1, col_span: 8 }, accepts: ['any'], description: 'Wide main area' },
      { slotId: 'sidebar', label: 'Sidebar', grid: { row: 1, col: 9, col_span: 4 }, accepts: ['any'], description: 'Narrow sidebar' },
    ],
  },
  {
    templateId: 'wide-right',
    displayName: 'Sidebar + Wide Right',
    description: 'Narrow sidebar with wide main area',
    category: 'detail',
    slotCount: 2,
    slots: [
      { slotId: 'sidebar', label: 'Sidebar', grid: { row: 1, col: 1, col_span: 4 }, accepts: ['any'], description: 'Narrow sidebar' },
      { slotId: 'main', label: 'Main', grid: { row: 1, col: 5, col_span: 8 }, accepts: ['any'], description: 'Wide main area' },
    ],
  },
  {
    templateId: 'top-bottom',
    displayName: 'Stacked',
    description: 'Two rows stacked vertically',
    category: 'narrative',
    slotCount: 2,
    slots: [
      { slotId: 'top', label: 'Top', grid: { row: 1, col: 1, col_span: 12 }, accepts: ['any'], description: 'Top section' },
      { slotId: 'bottom', label: 'Bottom', grid: { row: 2, col: 1, col_span: 12 }, accepts: ['any'], description: 'Bottom section' },
    ],
  },
  {
    templateId: 'process-then-teams',
    displayName: 'Process + Team Structure',
    description: 'Full-width process flow top, team structure bottom',
    category: 'narrative',
    slotCount: 2,
    slots: [
      { slotId: 'process', label: 'Process Flow', grid: { row: 1, col: 1, col_span: 12 }, accepts: ['process_flow'], description: 'Full-width process arrow flow' },
      { slotId: 'teams', label: 'Team Structure', grid: { row: 2, col: 1, col_span: 12 }, accepts: ['team_structure'], description: 'Team panels below process' },
    ],
  },
  {
    templateId: 'narrative-then-detail',
    displayName: 'Narrative Flow + Detail Breakdown',
    description: 'Overview flow (icon_columns with badges) + 3 detail columns below',
    category: 'narrative',
    slotCount: 4,
    slots: [
      { slotId: 'narrative', label: 'Narrative', grid: { row: 1, col: 1, col_span: 12 }, accepts: ['icon_columns'], description: 'Full-width narrative flow with numbered badges' },
      { slotId: 'detail_1', label: 'Detail 1', grid: { row: 2, col: 1, col_span: 4 }, accepts: ['any'], description: 'First detail column' },
      { slotId: 'detail_2', label: 'Detail 2', grid: { row: 2, col: 5, col_span: 4 }, accepts: ['any'], description: 'Second detail column' },
      { slotId: 'detail_3', label: 'Detail 3', grid: { row: 2, col: 9, col_span: 4 }, accepts: ['any'], description: 'Third detail column' },
    ],
  },
  {
    templateId: 'outcome-sections',
    displayName: 'Outcome Sections + Foundation',
    description: 'Prominent outcomes/capabilities top (with visual section header), process foundation bottom',
    category: 'overview',
    slotCount: 5,
    slots: [
      { slotId: 'outcome_header', label: 'Outcome Section Header', grid: { row: 1, col: 1, col_span: 12 }, accepts: ['text_block'], description: 'Section label: "WHAT YOU SEE — ENABLEMENT" (use variant: highlighted, orange heading)' },
      { slotId: 'outcomes_left', label: 'Outcomes Left', grid: { row: 2, col: 1, col_span: 6 }, accepts: ['bullet_list', 'kpi_cards'], description: 'Primary capabilities/outcomes' },
      { slotId: 'outcomes_right', label: 'Outcomes Right', grid: { row: 2, col: 7, col_span: 6 }, accepts: ['bullet_list', 'kpi_cards', 'stat_hero'], description: 'Secondary capabilities or key metric' },
      { slotId: 'foundation_header', label: 'Foundation Section Header', grid: { row: 3, col: 1, col_span: 12 }, accepts: ['text_block'], description: 'Section label: "WHAT MAKES IT LAST — THE FOUNDATION"' },
      { slotId: 'foundation', label: 'Foundation Process', grid: { row: 4, col: 1, col_span: 12 }, accepts: ['icon_columns', 'process_flow'], description: 'Full-width process: Discovery → Strategy → Modeling' },
    ],
  },
  {
    templateId: 'visual-hero-context',
    displayName: 'Visual Hero + Context',
    description: 'Large visual element (stat, chart, icon_grid) with minimal supporting text',
    category: 'simple',
    slotCount: 2,
    slots: [
      {
        slotId: 'hero',
        label: 'Visual Hero',
        grid: { row: 1, col: 1, col_span: 12, row_span: 2 },
        accepts: ['stat_hero', 'chart', 'icon_grid', 'kpi_cards', 'waterfall_chart'],
        description: 'Dominant visual element - NO bullet_list allowed'
      },
      {
        slotId: 'context',
        label: 'Supporting Context',
        grid: { row: 3, col: 1, col_span: 12 },
        accepts: ['text_block', 'bullet_list'],
        description: 'Brief context (1-2 sentences) or 2-3 bullets'
      },
    ],
  },
  {
    templateId: 'metrics-dashboard',
    displayName: 'Metrics Dashboard',
    description: '4-6 large metrics displayed as hero stats or KPI cards',
    category: 'dashboard',
    slotCount: 2,
    slots: [
      {
        slotId: 'metrics_primary',
        label: 'Primary Metrics',
        grid: { row: 1, col: 1, col_span: 12 },
        accepts: ['kpi_cards', 'icon_grid'],
        description: 'Main metrics row (3-4 KPIs)'
      },
      {
        slotId: 'metrics_secondary',
        label: 'Secondary Metrics',
        grid: { row: 2, col: 1, col_span: 12 },
        accepts: ['kpi_cards', 'simple_table', 'comparison_bars'],
        description: 'Supporting metrics or trend data'
      },
    ],
  },

  // ── THREE REGIONS ───────────────────────────────
  {
    templateId: 'three-equal',
    displayName: 'Three Columns',
    description: 'Three equal columns across',
    category: 'comparison',
    slotCount: 3,
    slots: [
      { slotId: 'left', label: 'Left', grid: { row: 1, col: 1, col_span: 4 }, accepts: ['any'], description: 'Left column' },
      { slotId: 'center', label: 'Center', grid: { row: 1, col: 5, col_span: 4 }, accepts: ['any'], description: 'Center column' },
      { slotId: 'right', label: 'Right', grid: { row: 1, col: 9, col_span: 4 }, accepts: ['any'], description: 'Right column' },
    ],
  },
  {
    templateId: 'top3-bottom-full',
    displayName: 'Three Columns + Full Width',
    description: 'Three items across the top, one wide below',
    category: 'comparison',
    slotCount: 4,
    slots: [
      { slotId: 'top_left', label: 'Top Left', grid: { row: 1, col: 1, col_span: 4 }, accepts: ['any'], description: 'First top column' },
      { slotId: 'top_center', label: 'Top Center', grid: { row: 1, col: 5, col_span: 4 }, accepts: ['any'], description: 'Second top column' },
      { slotId: 'top_right', label: 'Top Right', grid: { row: 1, col: 9, col_span: 4 }, accepts: ['any'], description: 'Third top column' },
      { slotId: 'bottom', label: 'Bottom', grid: { row: 2, col: 1, col_span: 12 }, accepts: ['any'], description: 'Full-width bottom area' },
    ],
  },
  {
    templateId: 'top-full-bottom3',
    displayName: 'Full Width + Three Columns',
    description: 'Full width top with three columns below',
    category: 'overview',
    slotCount: 4,
    slots: [
      { slotId: 'top', label: 'Top', grid: { row: 1, col: 1, col_span: 12 }, accepts: ['any'], description: 'Full-width top area' },
      { slotId: 'bottom_left', label: 'Bottom Left', grid: { row: 2, col: 1, col_span: 4 }, accepts: ['any'], description: 'Left bottom column' },
      { slotId: 'bottom_center', label: 'Bottom Center', grid: { row: 2, col: 5, col_span: 4 }, accepts: ['any'], description: 'Center bottom column' },
      { slotId: 'bottom_right', label: 'Bottom Right', grid: { row: 2, col: 9, col_span: 4 }, accepts: ['any'], description: 'Right bottom column' },
    ],
  },
  {
    templateId: 'top-full-bottom2',
    displayName: 'Full Width + Two Columns',
    description: 'Full width top with two columns below',
    category: 'overview',
    slotCount: 3,
    slots: [
      { slotId: 'top', label: 'Top', grid: { row: 1, col: 1, col_span: 12 }, accepts: ['any'], description: 'Full-width top area' },
      { slotId: 'bottom_left', label: 'Bottom Left', grid: { row: 2, col: 1, col_span: 6 }, accepts: ['any'], description: 'Left bottom half' },
      { slotId: 'bottom_right', label: 'Bottom Right', grid: { row: 2, col: 7, col_span: 6 }, accepts: ['any'], description: 'Right bottom half' },
    ],
  },

  // ── FOUR REGIONS ────────────────────────────────
  {
    templateId: 'quad',
    displayName: 'Four Quadrants',
    description: '2x2 grid of equal areas',
    category: 'dashboard',
    slotCount: 4,
    slots: [
      { slotId: 'top_left', label: 'Top Left', grid: { row: 1, col: 1, col_span: 6 }, accepts: ['any'], description: 'Top left quadrant' },
      { slotId: 'top_right', label: 'Top Right', grid: { row: 1, col: 7, col_span: 6 }, accepts: ['any'], description: 'Top right quadrant' },
      { slotId: 'bottom_left', label: 'Bottom Left', grid: { row: 2, col: 1, col_span: 6 }, accepts: ['any'], description: 'Bottom left quadrant' },
      { slotId: 'bottom_right', label: 'Bottom Right', grid: { row: 2, col: 7, col_span: 6 }, accepts: ['any'], description: 'Bottom right quadrant' },
    ],
  },

  // ── COMPLEX / ASYMMETRIC ────────────────────────
  {
    templateId: 'hero-left-stack-right',
    displayName: 'Hero Left + Stacked Right',
    description: 'Large left area with two stacked right panels',
    category: 'detail',
    slotCount: 3,
    slots: [
      { slotId: 'hero', label: 'Hero', grid: { row: 1, col: 1, col_span: 7, row_span: 2 }, accepts: ['any'], description: 'Large hero area' },
      { slotId: 'right_top', label: 'Right Top', grid: { row: 1, col: 8, col_span: 5 }, accepts: ['any'], description: 'Top right panel' },
      { slotId: 'right_bottom', label: 'Right Bottom', grid: { row: 2, col: 8, col_span: 5 }, accepts: ['any'], description: 'Bottom right panel' },
    ],
  },
  {
    templateId: 'hero-right-stack-left',
    displayName: 'Stacked Left + Hero Right',
    description: 'Two stacked left panels with large right area',
    category: 'detail',
    slotCount: 3,
    slots: [
      { slotId: 'left_top', label: 'Left Top', grid: { row: 1, col: 1, col_span: 5 }, accepts: ['any'], description: 'Top left panel' },
      { slotId: 'left_bottom', label: 'Left Bottom', grid: { row: 2, col: 1, col_span: 5 }, accepts: ['any'], description: 'Bottom left panel' },
      { slotId: 'hero', label: 'Hero', grid: { row: 1, col: 6, col_span: 7, row_span: 2 }, accepts: ['any'], description: 'Large hero area' },
    ],
  },
  {
    templateId: 'top3-bottom2',
    displayName: 'Three Top + Two Bottom',
    description: 'Three columns top, two columns bottom',
    category: 'comparison',
    slotCount: 5,
    slots: [
      { slotId: 'top_left', label: 'Top Left', grid: { row: 1, col: 1, col_span: 4 }, accepts: ['any'], description: 'First top column' },
      { slotId: 'top_center', label: 'Top Center', grid: { row: 1, col: 5, col_span: 4 }, accepts: ['any'], description: 'Second top column' },
      { slotId: 'top_right', label: 'Top Right', grid: { row: 1, col: 9, col_span: 4 }, accepts: ['any'], description: 'Third top column' },
      { slotId: 'bottom_left', label: 'Bottom Left', grid: { row: 2, col: 1, col_span: 6 }, accepts: ['any'], description: 'Left bottom half' },
      { slotId: 'bottom_right', label: 'Bottom Right', grid: { row: 2, col: 7, col_span: 6 }, accepts: ['any'], description: 'Right bottom half' },
    ],
  },

  // ── CONTEXT-FRAMED LAYOUTS ─────────────────────────
  {
    templateId: 'context-top-bottom2',
    displayName: 'Context Banner + Two Columns',
    description: 'Context/problem frame at top, two equal columns below for parallel solutions',
    category: 'argument',
    slotCount: 5,
    slots: [
      { slotId: 'context', label: 'Context Banner', grid: { row: 1, col: 1, col_span: 12 }, accepts: ['context_banner', 'text_block'], description: 'Problem frame or context statement' },
      { slotId: 'left_header', label: 'Left Result', grid: { row: 2, col: 1, col_span: 6 }, accepts: ['stat_hero', 'kpi_cards'], description: 'Result/conclusion for left capability' },
      { slotId: 'right_header', label: 'Right Result', grid: { row: 2, col: 7, col_span: 6 }, accepts: ['stat_hero', 'kpi_cards'], description: 'Result/conclusion for right capability' },
      { slotId: 'left_body', label: 'Left Capability', grid: { row: 3, col: 1, col_span: 6 }, accepts: ['icon_columns', 'bullet_list'], description: 'How left capability works' },
      { slotId: 'right_body', label: 'Right Capability', grid: { row: 3, col: 7, col_span: 6 }, accepts: ['icon_columns', 'bullet_list'], description: 'How right capability works' },
    ],
  },
];

// ─── HELPERS ──────────────────────────────────────────────────

export function getTemplate(templateId: string): LayoutTemplate {
  return LAYOUT_TEMPLATES.find(t => t.templateId === templateId) || LAYOUT_TEMPLATES[0];
}

export const TEMPLATE_CATEGORIES: { key: TemplateCategory; label: string }[] = [
  { key: 'simple', label: 'Simple' },
  { key: 'comparison', label: 'Comparison' },
  { key: 'narrative', label: 'Narrative' },
  { key: 'detail', label: 'Detail' },
  { key: 'overview', label: 'Overview' },
  { key: 'dashboard', label: 'Dashboard' },
];
