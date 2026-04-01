import { DeckTheme, ComponentType } from './types';

export const DECK_THEME: DeckTheme = {
  fonts: {
    heading: 'Calibri',
    body: 'Calibri',
  },
  colors: {
    dk1: '#002F4A',      // Primary Navy
    lt1: '#FFFFFF',      // White
    dk2: '#0D2B45',      // Dark Navy (title slides)
    lt2: '#EEF4F7',      // Light blue bg
    accent1: '#6B7280',  // Muted gray (supporting text)
    accent2: '#E8610A',  // Orange (accent only)
    accent3: '#1B6B7B',  // Teal (secondary headers)
    accent4: '#4472C4',  // Blue highlight
    accent5: '#CB333B',  // Red (warnings)
    accent6: '#F5F5F5',  // Light gray bg
    hyperlink: '#E8610A',
    followedHyperlink: '#1B6B7B',
  },
  slideSize: {
    width: 13.333,
    height: 7.5,
  },
};

// Component palette for the "Add Component" picker
export const COMPONENT_PALETTE: { type: ComponentType; category: 'content' | 'data' | 'layout' | 'visual' }[] = [
  { type: 'bullet_list', category: 'content' },
  { type: 'text_block', category: 'content' },
  { type: 'icon_columns', category: 'content' },
  { type: 'icon_grid', category: 'content' },
  { type: 'stat_hero', category: 'data' },
  { type: 'kpi_cards', category: 'data' },
  { type: 'chart', category: 'data' },
  { type: 'waterfall_chart', category: 'data' },
  { type: 'comparison_bars', category: 'data' },
  { type: 'data_table', category: 'data' },
  { type: 'simple_table', category: 'data' },
  { type: 'process_flow', category: 'layout' },
  { type: 'timeline_track', category: 'layout' },
  { type: 'team_structure', category: 'layout' },
  { type: 'screenshot', category: 'visual' },
  { type: 'callout_bar', category: 'layout' },
];

export const MAX_CONSTRAINTS = {
  bulletsPerList: 8,
  bulletsPerColumn: 5,
  kpiMetricsMax: 6,
  columnsMax: 4,
  stagesMax: 6,
  milestonesMax: 6,
  gridBlocksMax: 6,
  tableRowsMax: 8,
  tableColumnsMax: 5,
  simpleTableRowsMax: 5,
  calloutBarMaxChars: 140,
  chartDataMax: 10,
  componentsPerSlide: 6,
};
