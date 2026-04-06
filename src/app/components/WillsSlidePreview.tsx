'use client';

import { WillsSlideData, SlideElement, TextElement, ShapeElement, SLIDE_DIMENSIONS } from '../types/wills-preview';

interface WillsSlidePreviewProps {
  slideData: WillsSlideData;
  isSelected?: boolean;
  onClick?: () => void;
}

const { width: SLIDE_W, height: SLIDE_H, scale: SCALE } = SLIDE_DIMENSIONS;
const W = SLIDE_W * SCALE;
const H = SLIDE_H * SCALE;

function toP(inches: number) { return inches * SCALE; }
function ptToPx(pt: number) { return Math.round(pt * SCALE / 72); }

function renderElement(el: SlideElement, i: number) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: toP(el.x),
    top: toP(el.y),
    overflow: 'hidden',
  };
  if ('w' in el && el.w != null) style.width = toP(el.w);
  if ('h' in el && el.h != null) style.height = toP(el.h);

  if (el.type === 'shape') {
    const shape = el as ShapeElement;
    const fill = shape.fill?.color ? `#${shape.fill.color}` : 'transparent';
    const borderColor = shape.line?.color ? `#${shape.line.color}` : 'transparent';
    const borderWidth = shape.line?.width ?? 0;
    let borderRadius = '0';
    if (shape.shapeType === 'ellipse') borderRadius = '50%';
    if (shape.rectRadius) borderRadius = `${toP(shape.rectRadius)}px`;
    return (
      <div
        key={i}
        style={{
          ...style,
          backgroundColor: fill,
          border: borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
          borderRadius,
          opacity: shape.fill?.transparency ? 1 - shape.fill.transparency / 100 : 1,
        }}
      />
    );
  }

  if (el.type === 'text') {
    const text = el as TextElement;
    const fontSize = text.fontSize ? ptToPx(text.fontSize) : 11;
    const color = text.color ? `#${text.color}` : '#000';
    return (
      <div
        key={i}
        style={{
          ...style,
          fontSize,
          color,
          fontWeight: text.bold ? 'bold' : 'normal',
          fontStyle: text.italic ? 'italic' : 'normal',
          textDecoration: text.underline ? 'underline' : 'none',
          textAlign: text.align || 'left',
          fontFamily: text.fontFace || 'Calibri, Arial, sans-serif',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {text.bullet ? `• ${text.content}` : text.content}
      </div>
    );
  }

  if (el.type === 'image') {
    const img = el as any;
    return (
      <div key={i} style={{ ...style, backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {img.data ? (
          <img
            src={`data:image/png;base64,${img.data}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            alt=""
          />
        ) : (
          <span style={{ fontSize: 8, color: '#9ca3af' }}>Image</span>
        )}
      </div>
    );
  }

  return null;
}

export function WillsSlidePreview({ slideData, isSelected, onClick }: WillsSlidePreviewProps) {
  const bgColor = slideData.background?.color ? `#${slideData.background.color}` : '#FFFFFF';

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200 hover:ring-gray-300'
      }`}
      style={{ width: W, height: H, backgroundColor: bgColor }}
    >
      {slideData.elements.map((el, i) => renderElement(el, i))}
    </div>
  );
}
