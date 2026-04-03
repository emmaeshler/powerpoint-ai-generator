/**
 * TypeScript types for Will's PptxGenJS preview data
 */

export interface TextElement {
  type: 'text';
  content: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  fontSize?: number;
  fontFace?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  bullet?: boolean | { type: string; characterCode?: string; color?: string };
  lineSpacing?: number;
  wrap?: boolean;
  shrinkText?: boolean;
  isTextRun?: boolean;
  runIndex?: number;
}

export interface ShapeElement {
  type: 'shape';
  shapeType: 'rect' | 'ellipse' | 'line' | 'triangle' | 'rightTriangle' | 'pentagon' | 'hexagon';
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: {
    color?: string;
    transparency?: number;
  };
  line?: {
    color?: string;
    width?: number;
    dashType?: 'solid' | 'dash' | 'dot';
    type?: 'none' | 'solid';
  };
  rectRadius?: number;
  rotate?: number;
  flipH?: boolean;
  flipV?: boolean;
}

export interface TableElement {
  type: 'table';
  rows: any[][];
  x: number;
  y: number;
  w?: number;
  h?: number;
  colW?: number[];
  rowH?: number[];
  border?: {
    type?: 'solid' | 'dash' | 'none';
    color?: string;
    pt?: number;
  };
  fill?: string;
  fontSize?: number;
  fontFace?: string;
  color?: string;
  valign?: 'top' | 'middle' | 'bottom';
  align?: 'left' | 'center' | 'right';
}

export interface ImageElement {
  type: 'image';
  data?: string;  // base64 data
  path?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  sizing?: {
    type: 'crop' | 'contain' | 'cover';
    w?: number;
    h?: number;
    x?: number;
    y?: number;
  };
}

export interface ChartElement {
  type: 'chart';
  chartType: string;
  data: any[];
  x: number;
  y: number;
  w: number;
  h: number;
  showValue?: boolean;
  showLegend?: boolean;
  chartColors?: string[];
}

export type SlideElement = TextElement | ShapeElement | TableElement | ImageElement | ChartElement;

export interface WillsSlideData {
  elements: SlideElement[];
  notes?: string;
  background?: {
    color?: string;
    transparency?: number;
  };
  masterName?: string;
}

export interface WillsPreviewData {
  success: boolean;
  slides: WillsSlideData[];
  metadata?: {
    slideCount: number;
    elementCount: number;
  };
  error?: string;
  stack?: string;
}

// INSIGHT color palette constants
export const INSIGHT_COLORS = {
  primary: '#00446A',
  accent: '#E56910',
  green: '#339966',
  red: '#CB333B',
  textDark: '#25282A',
  textMid: '#4A6070',
  textLight: '#7A95A5',
  gray: '#75787B',
  white: '#FFFFFF',
  offWhite: '#F3F4F4'
} as const;

// PowerPoint dimensions (16:9)
export const SLIDE_DIMENSIONS = {
  width: 13.3,   // inches
  height: 7.5,   // inches
  scale: 60      // 60px per inch for preview
} as const;
