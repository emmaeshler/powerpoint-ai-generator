// Emma's Awesome PPT Generator — Component-Based Slide System
// Slides use a template grid + slot content model

// ─── COMPONENT TYPES ──────────────────────────────────────────

export type ComponentType =
  | 'bullet_list'
  | 'stat_hero'
  | 'kpi_cards'
  | 'icon_columns'
  | 'process_flow'
  | 'data_table'
  | 'simple_table'
  | 'chart'
  | 'callout_bar'
  | 'timeline_track'
  | 'icon_grid'
  | 'screenshot'
  | 'text_block'
  | 'comparison_bars'
  | 'team_structure'
  | 'waterfall_chart'
  | 'context_banner';

export type Region = 'full' | 'left' | 'right';
export type BrandColor = 'navy' | 'teal' | 'orange';
export type SlotVariant = 'default' | 'muted' | 'highlighted';

// ─── BASE COMPONENT ───────────────────────────────────────────

interface BaseComponent {
  id: string;
  type: ComponentType;
  region?: Region; // kept for backward compat / AI output; ignored by grid engine
  variant?: SlotVariant; // visual hierarchy control for the slot container
}

// ─── INDIVIDUAL COMPONENTS ────────────────────────────────────

export interface BulletListComponent extends BaseComponent {
  type: 'bullet_list';
  heading?: string;
  items: string[];
  bulletColor?: BrandColor;
}

export interface StatHeroComponent extends BaseComponent {
  type: 'stat_hero';
  value: string;
  label: string;
  supportingText?: string;
  accentColor?: BrandColor;
  size?: 'large' | 'medium' | 'small';
  baseline?: string;           // e.g., "from industry avg of 18 mo"
  comparisonLabel?: string;    // e.g., "vs. prior year"
}

export interface KpiCardsComponent extends BaseComponent {
  type: 'kpi_cards';
  metrics: KpiMetric[];
}

export interface KpiMetric {
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface IconColumnsComponent extends BaseComponent {
  type: 'icon_columns';
  columns: IconColumn[];
  connectors?: boolean;
  sectionLabel?: string;       // uppercase label above content, e.g., "HOW IT ELIMINATES DELAYS"
  sectionLabelColor?: BrandColor; // default: teal
}

export interface IconColumnItem {
  title: string;               // bold title, e.g., "Predictive Models"
  detail?: string;             // lighter detail, e.g., "ML-driven demand sensing reduces forecast error"
}

export interface IconColumn {
  icon: string;
  header: string;
  headerColor: BrandColor;
  highlighted?: boolean;
  items: (string | IconColumnItem)[];  // plain strings or titled details
  badge?: string;           // e.g., "1", "2", "3" or emoji "①②③"
  badgePosition?: 'top-left' | 'top-center';  // default: 'top-left'
  iconCircle?: boolean;     // render icon in a colored circle background (default: false)
  showDivider?: boolean;    // dashed divider line after this column's header section
  resultLabel?: string;     // e.g., "THE RESULT" — rendered as a small label before a closing stat
  resultValue?: string;     // e.g., "18→12.5 mo" — rendered prominently after resultLabel
  resultDetail?: string;    // e.g., "from industry avg of 18 mo" — smaller text under resultValue
}

export interface ProcessFlowComponent extends BaseComponent {
  type: 'process_flow';
  stages: ProcessStage[];
}

export interface ProcessStage {
  label: string;
  timeframe?: string;
  items: string[];
  highlighted?: boolean;
  accentColor?: BrandColor;
}

export interface DataTableComponent extends BaseComponent {
  type: 'data_table';
  rowLabels: string[];
  columns: TableColumn[];
}

export interface TableColumn {
  header: string;
  highlight?: boolean;
  rows: string[];
}

export interface SimpleTableComponent extends BaseComponent {
  type: 'simple_table';
  title?: string;
  headers: string[];
  rows: SimpleTableRow[];
}

export interface SimpleTableRow {
  label: string;
  values: string[];
}

export interface ChartComponent extends BaseComponent {
  type: 'chart';
  chartType: 'bar' | 'line';
  data: ChartDataPoint[];
  targetLine?: { value: number; label: string };
  yAxisTitle?: string;  // e.g., "Revenue ($M)", "Growth Rate (%)"
  xAxisTitle?: string;  // optional, category labels often sufficient
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface CalloutBarComponent extends BaseComponent {
  type: 'callout_bar';
  text: string;
}

export interface TimelineTrackComponent extends BaseComponent {
  type: 'timeline_track';
  milestones: Milestone[];
}

export interface Milestone {
  date: string;
  title: string;
  description: string;
}

export interface IconGridComponent extends BaseComponent {
  type: 'icon_grid';
  blocks: IconBlock[];
}

export interface IconBlock {
  icon: string;
  title: string;
  description: string;
}

export interface ScreenshotComponent extends BaseComponent {
  type: 'screenshot';
  imageUrl?: string;
  caption?: string;
  placeholderText?: string;
}

export interface TextBlockComponent extends BaseComponent {
  type: 'text_block';
  heading?: string;
  headingColor?: BrandColor;
  text: string;
}

export interface ComparisonBarsComponent extends BaseComponent {
  type: 'comparison_bars';
  bars: ComparisonBar[];
  callout: string;
  accentColor?: BrandColor;
}

export interface ComparisonBar {
  label: string;

  // Single-value mode (legacy, for simple progress bars)
  value?: string;
  percent?: number;

  // Before/after mode (for visual comparisons)
  beforeValue?: string;     // e.g., "100%"
  afterValue?: string;      // e.g., "70%"
  beforePercent?: number;   // e.g., 100
  afterPercent?: number;    // e.g., 70

  annotation?: string;
}

export interface TeamStructureComponent extends BaseComponent {
  type: 'team_structure';
  teams: TeamPanel[];
  connector?: string; // e.g. "+" symbol between teams
}

export interface TeamPanel {
  icon?: string;        // person/team icon emoji
  name: string;         // e.g. "INSIGHT Team"
  sections: TeamSection[];
}

export interface TeamSection {
  heading: string;      // e.g. "Delivery + Data Science Teams"
  items: string[];      // bullet points
}

export interface ContextBannerComponent extends BaseComponent {
  type: 'context_banner';
  label?: string;              // e.g., "The problem:", "Context:", "Why this matters:"
  labelColor?: BrandColor;     // color for the label text (default: orange)
  text: string;                // the main problem/context statement
  accentColor?: BrandColor;    // left accent bar color (default: orange)
}

export interface WaterfallChartComponent extends BaseComponent {
  type: 'waterfall_chart';
  bars: WaterfallBar[];
  showConnectors?: boolean;
  annotations?: WaterfallAnnotation[];
}

export interface WaterfallBar {
  label: string;
  value: number;
  delta?: number;        // e.g. +2 (shown as increment)
  deltaLabel?: string;   // e.g. "+$2M cost controls"
  isTotal?: boolean;     // marks this bar as a total/subtotal (different styling)
}

export interface WaterfallAnnotation {
  targetBar: number;     // index of bar to annotate
  text: string;          // annotation text
  side: 'above' | 'right' | 'below';
  color?: BrandColor;
}

// ─── UNION TYPE ───────────────────────────────────────────────

export type SlideComponent =
  | BulletListComponent
  | StatHeroComponent
  | KpiCardsComponent
  | IconColumnsComponent
  | ProcessFlowComponent
  | DataTableComponent
  | SimpleTableComponent
  | ChartComponent
  | CalloutBarComponent
  | TimelineTrackComponent
  | IconGridComponent
  | ScreenshotComponent
  | TextBlockComponent
  | ComparisonBarsComponent
  | TeamStructureComponent
  | WaterfallChartComponent
  | ContextBannerComponent;

// ─── SLIDE ────────────────────────────────────────────────────

export interface Slide {
  id: string;
  title: string;
  soWhat: string;                                // "So What?" — the key takeaway
  soWhatLocked?: boolean;                        // true if user manually edited soWhat
  description: string;                           // supporting context / topic description
  keyMetric?: string;                            // key numeric takeaway (e.g., "-2M ha/yr", "$2.4M")
  keyMetricLabel?: string;                       // context for the metric (e.g., "Reduction Since 2018")
  prompt?: string;                               // original prompt used to generate this slide
  templateId: string;                            // layout template id
  slotContent: Record<string, SlideComponent>; // slot_id → component
  calloutBar?: CalloutBarComponent;            // optional footer callout (not in grid)
  deckGroupId?: string;                        // groups slides generated as part of a deck
  deckGroupLabel?: string;                     // display label for the deck group
}

// ─── DECK THEME ───────────────────────────────────────────────

export interface DeckTheme {
  fonts: {
    heading: string;
    body: string;
  };
  colors: {
    dk1: string;
    lt1: string;
    dk2: string;
    lt2: string;
    accent1: string;
    accent2: string;
    accent3: string;
    accent4: string;
    accent5: string;
    accent6: string;
    hyperlink: string;
    followedHyperlink: string;
  };
  slideSize: {
    width: number;
    height: number;
  };
}

// ─── HELPERS ──────────────────────────────────────────────────

export function generateComponentId(): string {
  return `comp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export function generateSlideId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Get all components from a slide (slot content + callout bar) as a flat array */
export function getSlideComponents(slide: Slide): SlideComponent[] {
  const comps = Object.values(slide.slotContent);
  if (slide.calloutBar) comps.push(slide.calloutBar);
  return comps;
}

// Component display metadata
export const COMPONENT_META: Record<ComponentType, { label: string; icon: string; description: string }> = {
  bullet_list: { label: 'Bullet List', icon: 'List', description: 'Focused list of key points' },
  stat_hero: { label: 'Hero Stat', icon: 'Hash', description: 'One big prominent number' },
  kpi_cards: { label: 'KPI Cards', icon: 'BarChart3', description: 'Side-by-side metric cards' },
  icon_columns: { label: 'Icon Columns', icon: 'Columns3', description: '2-3 columns with icons and content' },
  process_flow: { label: 'Process Flow', icon: 'ArrowRight', description: 'Sequential stages with arrows' },
  data_table: { label: 'Data Table', icon: 'Table', description: 'Matrix/comparison table' },
  simple_table: { label: 'Simple Table', icon: 'Table2', description: 'Simple before/after data table' },
  chart: { label: 'Chart', icon: 'TrendingUp', description: 'Bar or line chart' },
  callout_bar: { label: 'Callout Bar', icon: 'MessageSquare', description: 'Bottom emphasis bar' },
  timeline_track: { label: 'Timeline', icon: 'Clock', description: 'Horizontal milestone timeline' },
  icon_grid: { label: 'Icon Grid', icon: 'Grid2x2', description: 'Grid of icon blocks' },
  screenshot: { label: 'Screenshot', icon: 'Monitor', description: 'Image or screenshot area' },
  text_block: { label: 'Text Block', icon: 'Type', description: 'Headed text content panel' },
  comparison_bars: { label: 'Comparison Bars', icon: 'BarChart2', description: 'Side-by-side comparison bars' },
  team_structure: { label: 'Team Structure', icon: 'Users', description: 'Team panels with roles and responsibilities' },
  waterfall_chart: { label: 'Waterfall Chart', icon: 'TrendingDown', description: 'Sequential value changes showing EBITDA or financial flow' },
  context_banner: { label: 'Context Banner', icon: 'AlertTriangle', description: 'Problem frame or context statement above main content' },
};