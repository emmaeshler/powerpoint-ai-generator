import { Slide, SlideComponent, BrandColor, getSlideComponents } from '../types';
import { DECK_THEME } from '../constants';
import { compose, LayoutRect } from '../utils/composition-engine';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T = DECK_THEME.colors;
const F = 'Calibri, Arial, sans-serif';

// Scale: 800px / 13.333" = 60 px/inch
const SCALE = 60;
const toP = (inches: number) => inches * SCALE;

// Convert PowerPoint pt sizes to preview px sizes
// 1 pt = 1/72 inch; at 60px/inch: 1pt = 60/72 = 0.833px
const ptToPx = (pt: number) => Math.round(pt * SCALE / 72);

// Convert PowerPoint lineSpacing (in points) to CSS line-height
// lineSpacing in PPTX is spacing between lines in points
const lineSpacingToHeight = (spacing: number) => `${spacing * SCALE / 72}px`;

interface SlidePreviewProps {
  slide: Slide | null;
}

export function EmmaSlidePreview({ slide }: SlidePreviewProps) {
  if (!slide) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-400">
          <p className="text-lg">No slide selected</p>
          <p className="text-sm mt-1">Select or generate a slide to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-100 p-8">
      <div
        className="bg-white shadow-xl relative mx-auto"
        style={{ width: '800px', height: '450px', fontFamily: F }}
      >
        <SlideLayout slide={slide} />
        <SlideFooter />
      </div>
    </div>
  );
}

// ─── LAYOUT ENGINE (Grid-based composition) ───────────────────

function SlideLayout({ slide }: { slide: Slide }) {
  const layout = compose(slide.templateId, slide.slotContent, slide.calloutBar);
  const allComponents = getSlideComponents(slide);

  const positioned = allComponents
    .map(comp => ({ comp, rect: layout.get(comp.id) }))
    .filter((item): item is { comp: SlideComponent; rect: LayoutRect } => item.rect != null);

  return (
    <div className="w-full h-full relative">
      <div style={{ position: 'absolute', left: toP(0.75), top: toP(0.6), width: toP(11.833) }}>
        <TitleBar slide={slide} />
      </div>
      {positioned.map(({ comp, rect }) => (
        <div
          key={comp.id}
          style={{
            position: 'absolute',
            left: toP(rect.x),
            top: toP(rect.y),
            width: toP(rect.w),
            height: toP(rect.h),
            overflow: 'hidden',
          }}
        >
          <ComponentRenderer comp={comp} />
        </div>
      ))}
    </div>
  );
}

// ─── SHARED ELEMENTS ──────────────────────────────────────────

function SlideFooter() {
  return (
    <div className="absolute bottom-0 left-0 right-0" style={{ paddingLeft: toP(0.75), paddingRight: toP(0.75), paddingBottom: toP(0.15) }}>
      <div style={{ height: toP(0.015), marginBottom: toP(0.1), backgroundColor: T.accent1 }} />
      <div className="flex justify-between items-center">
        <span style={{ fontSize: ptToPx(10), color: T.dk1, fontWeight: 'bold', letterSpacing: '0.05em' }}>INSIGHT2PROFIT</span>
        <span style={{ fontSize: ptToPx(10), color: T.accent1 }}>1</span>
      </div>
    </div>
  );
}

function TitleBar({ slide }: { slide: Slide }) {
  const parts = slide.title.split('|').map(p => p.trim());
  // Dynamic font sizing based on title length (matching pptx-generator.ts lines 84-91)
  const totalLength = slide.title.length;
  let fontSize = 24;
  if (totalLength > 80) fontSize = 16;
  else if (totalLength > 60) fontSize = 18;

  return (
    <div style={{ marginBottom: toP(0.1) }}>
      {/* Title */}
      <h2 style={{ fontSize: ptToPx(fontSize), lineHeight: '1.2', margin: 0, padding: 0 }}>
        <span style={{ fontWeight: 'bold', color: T.dk1 }}>{parts[0]}</span>
        {parts[1] && <span style={{ color: T.dk1 }}> | {parts[1]}</span>}
      </h2>

      {/* Key Metric Area */}
      {slide.keyMetric && (
        <div style={{
          textAlign: 'center',
          marginTop: toP(0.15),
          marginBottom: toP(0.1),
          position: 'relative',
          zIndex: 20
        }}>
          <div style={{
            fontSize: ptToPx(36),
            fontWeight: 'bold',
            color: T.accent3,  // Teal color
            lineHeight: '1.1'
          }}>
            {slide.keyMetric}
          </div>
          {slide.keyMetricLabel && (
            <div style={{
              fontSize: ptToPx(14),
              color: T.accent1,  // Gray
              marginTop: toP(0.05)
            }}>
              {slide.keyMetricLabel}
            </div>
          )}
        </div>
      )}

      {/* Divider Line */}
      <div style={{
        height: toP(0.02),
        marginTop: toP(slide.keyMetric ? 0.05 : 0.05),
        backgroundColor: T.accent1
      }} />
    </div>
  );
}

function getColor(name: BrandColor | undefined): string {
  switch (name) {
    case 'navy': return T.dk1;
    case 'teal': return T.accent3;
    case 'orange': return T.accent2;
    default: return T.dk1;
  }
}

// ─── COMPONENT ROUTER ─────────────────────────────────────────

function ComponentRenderer({ comp }: { comp: SlideComponent }) {
  switch (comp.type) {
    case 'bullet_list': return <BulletListPreview comp={comp} />;
    case 'stat_hero': return <StatHeroPreview comp={comp} />;
    case 'kpi_cards': return <KpiCardsPreview comp={comp} />;
    case 'icon_columns': return <IconColumnsPreview comp={comp} />;
    case 'process_flow': return <ProcessFlowPreview comp={comp} />;
    case 'data_table': return <DataTablePreview comp={comp} />;
    case 'simple_table': return <SimpleTablePreview comp={comp} />;
    case 'chart': return <ChartPreview comp={comp} />;
    case 'callout_bar': return <CalloutBarPreview text={(comp as any).text} />;
    case 'timeline_track': return <TimelineTrackPreview comp={comp} />;
    case 'icon_grid': return <IconGridPreview comp={comp} />;
    case 'screenshot': return <ScreenshotPreview comp={comp} />;
    case 'text_block': return <TextBlockPreview comp={comp} />;
    case 'comparison_bars': return <ComparisonBarsPreview comp={comp} />;
    case 'team_structure': return <TeamStructurePreview comp={comp} />;
    case 'waterfall_chart': return <WaterfallChartPreview comp={comp} />;
    case 'context_banner': return <ContextBannerPreview comp={comp} />;
    default: return <div className="text-xs text-gray-400">Unknown component</div>;
  }
}

// ─── COMPONENT PREVIEWS ───────────────────────────────────────

// PPTX: heading 14pt bold, bullets 14pt with lineSpacing 18, indent 0.2"
function BulletListPreview({ comp }: { comp: any }) {
  const color = getColor(comp.bulletColor);
  return (
    <div className="h-full flex flex-col">
      {comp.heading && (
        <p style={{
          fontSize: ptToPx(14),
          fontWeight: 'bold',
          color: T.dk1,
          margin: 0,
          marginBottom: toP(0.05),
          lineHeight: '1.2'
        }}>
          {comp.heading}
        </p>
      )}
      <div className="flex-1 overflow-hidden" style={{ paddingLeft: toP(0.2) }}>
        {(comp.items || []).map((item: string, i: number) => (
          <p key={i} style={{
            fontSize: ptToPx(14),
            color: T.dk1,
            lineHeight: lineSpacingToHeight(18),
            margin: 0,
            display: 'flex',
            alignItems: 'flex-start',
            gap: toP(0.1)
          }}>
            <span style={{ color, fontSize: ptToPx(14), marginTop: '0.1em', flexShrink: 0 }}>{'\u2022'}</span>
            <span>{item}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

// PPTX: value 64pt bold, label 16pt bold, supporting 12pt
function StatHeroPreview({ comp }: { comp: any }) {
  const color = getColor(comp.accentColor);
  const hasBaseline = comp.baseline || comp.comparisonLabel;
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <span style={{ fontSize: ptToPx(hasBaseline ? 56 : 64), fontWeight: 'bold', color, lineHeight: '1' }}>
        {comp.value || '\u2014'}
      </span>
      <span style={{ fontSize: ptToPx(hasBaseline ? 14 : 16), fontWeight: 'bold', color: T.accent3, marginTop: toP(0.08) }}>
        {comp.label}
      </span>
      {hasBaseline && (
        <span style={{ fontSize: ptToPx(11), fontStyle: 'italic', color: T.accent1, marginTop: toP(0.05), textAlign: 'center', maxWidth: '85%' }}>
          {comp.baseline || comp.comparisonLabel}
        </span>
      )}
      {comp.supportingText && (
        <span style={{ fontSize: ptToPx(11), color: T.accent1, marginTop: toP(0.08), textAlign: 'center', maxWidth: '80%' }}>
          {comp.supportingText}
        </span>
      )}
    </div>
  );
}

// PPTX: value 32pt bold, label 11pt, trend 18pt bold
function KpiCardsPreview({ comp }: { comp: any }) {
  const metrics = comp.metrics || [];
  return (
    <div className="h-full flex gap-2 justify-center">
      {metrics.map((m: any, i: number) => (
        <div key={i} style={{
          backgroundColor: T.lt2,
          flex: '1 1 0',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: toP(0.1),
          position: 'relative'
        }}>
          {m.trend && (
            <span style={{
              position: 'absolute',
              top: toP(0.05),
              right: toP(0.05),
              fontSize: ptToPx(18),
              fontWeight: 'bold',
              color: m.trend === 'up' ? T.accent3 : m.trend === 'down' ? T.accent5 : T.accent1
            }}>
              {m.trend === 'up' ? '^' : m.trend === 'down' ? 'v' : '-'}
            </span>
          )}
          <span style={{ fontSize: ptToPx(32), fontWeight: 'bold', color: T.dk1, lineHeight: '1' }}>
            {m.value}
          </span>
          <span style={{ fontSize: ptToPx(11), color: T.accent1, marginTop: toP(0.05), textAlign: 'center' }}>
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// PPTX: icon 16-18pt, header 13-14pt bold, bullets 12pt with lineSpacing 14
function IconColumnsPreview({ comp }: { comp: any }) {
  const columns = comp.columns || [];
  return (
    <div className="h-full flex flex-col">
      {/* Section label */}
      {comp.sectionLabel && (
        <div style={{
          fontSize: ptToPx(10),
          fontWeight: 'bold',
          color: getColor(comp.sectionLabelColor || 'teal'),
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          marginBottom: toP(0.08),
          paddingLeft: toP(0.02)
        }}>
          {comp.sectionLabel}
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', gap: toP(0.05) }}>
      {columns.map((col: any, i: number) => {
        const color = getColor(col.headerColor);
        const isHighlighted = col.highlighted === true;
        const useIconCircle = col.iconCircle === true;
        const headerBarH = 0.60;
        const hasTitledItems = (col.items || []).some((item: any) => typeof item === 'object' && item.title);
        return (
          <div key={i} style={{
            flex: '1 1 0',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {col.badge && (
              <div style={{
                position: 'absolute',
                top: toP(-0.4),
                left: col.badgePosition === 'top-center' ? '50%' : toP(0.1),
                transform: col.badgePosition === 'top-center' ? 'translateX(-50%)' : 'none',
                width: toP(0.35),
                height: toP(0.35),
                borderRadius: '50%',
                backgroundColor: color,
                border: `2px solid ${T.lt1}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: ptToPx(18),
                fontWeight: 'bold',
                color: T.lt1,
                zIndex: 10
              }}>
                {col.badge}
              </div>
            )}
            <div style={{
              backgroundColor: color,
              height: toP(headerBarH),
              display: 'flex',
              alignItems: 'center',
              gap: toP(0.05),
              paddingLeft: toP(0.1),
              paddingRight: toP(0.1)
            }}>
              {useIconCircle ? (
                <span style={{
                  width: toP(0.35),
                  height: toP(0.35),
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: ptToPx(16),
                  color: T.lt1,
                  flexShrink: 0
                }}>
                  {col.icon || '\u2022'}
                </span>
              ) : (
                <span style={{ fontSize: ptToPx(16), color: T.lt1, flexShrink: 0 }}>
                  {col.icon || '\u2022'}
                </span>
              )}
              <span style={{ fontSize: ptToPx(13), fontWeight: 'bold', color: T.lt1 }}>
                {col.header}
              </span>
            </div>
            <div style={{
              flex: 1,
              backgroundColor: isHighlighted ? '#EDF6F7' : T.lt2,
              paddingLeft: toP(0.15),
              paddingRight: toP(0.15),
              paddingTop: toP(0.1),
              paddingBottom: toP(0.1),
              overflow: 'hidden',
              borderLeft: isHighlighted ? `4px solid ${T.accent2}` : 'none',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Items */}
              <div style={{ flex: 1 }}>
                {(col.items || []).slice(0, 5).map((item: any, bi: number) => {
                  if (typeof item === 'object' && item.title) {
                    // Titled detail item
                    return (
                      <div key={bi} style={{ marginBottom: toP(0.06) }}>
                        <div style={{ fontSize: ptToPx(11), fontWeight: 'bold', color: T.dk1, lineHeight: '1.3' }}>
                          {item.title}
                        </div>
                        {item.detail && (
                          <div style={{ fontSize: ptToPx(10), color: T.accent1, lineHeight: '1.3', marginTop: 1 }}>
                            {item.detail}
                          </div>
                        )}
                      </div>
                    );
                  }
                  // Plain string item
                  const text = typeof item === 'string' ? item : '';
                  return (
                    <p key={bi} style={{
                      fontSize: ptToPx(12),
                      color: T.dk1,
                      lineHeight: lineSpacingToHeight(14),
                      margin: 0,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: toP(0.05)
                    }}>
                      <span style={{ color, fontSize: ptToPx(12), marginTop: '0.1em', flexShrink: 0 }}>{'\u2022'}</span>
                      <span>{text}</span>
                    </p>
                  );
                })}
              </div>

              {/* Divider + Result section */}
              {col.resultLabel && (
                <div style={{ marginTop: 'auto' }}>
                  {col.showDivider && (
                    <div style={{
                      borderTop: `1px dashed ${T.accent1}`,
                      marginBottom: toP(0.08),
                      opacity: 0.5
                    }} />
                  )}
                  <div style={{
                    fontSize: ptToPx(8),
                    fontWeight: 'bold',
                    color,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const
                  }}>
                    {col.resultLabel}
                  </div>
                  {col.resultValue && (
                    <div style={{ fontSize: ptToPx(20), fontWeight: 'bold', color: T.dk1, lineHeight: '1.2' }}>
                      {col.resultValue}
                    </div>
                  )}
                  {col.resultDetail && (
                    <div style={{ fontSize: ptToPx(9), fontStyle: 'italic', color: T.accent1 }}>
                      {col.resultDetail}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

// PPTX: timeframe 10pt, label 12pt bold, bullets 11pt with lineSpacing 13
function ProcessFlowPreview({ comp }: { comp: any }) {
  const stages = comp.stages || [];
  // Individual phase colors: dark teal, muted teal, orange
  const getStageColor = (i: number, stage: any): string => {
    // If stage is highlighted and has accentColor, use it
    if (stage.highlighted && stage.accentColor) {
      const colorMap: Record<string, string> = {
        'navy': '#002F4A',
        'teal': '#1B6B7B',
        'orange': '#D4792A'
      };
      return colorMap[stage.accentColor] || '#D4792A';
    }
    // Otherwise use default color rotation
    const colors = ['#1B3A4B', '#4A7C8A', '#D4792A', '#4472C4'];
    return colors[i % colors.length];
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-shrink-0" style={{ gap: '6px' }}>
        {stages.map((stage: any, i: number) => {
          const color = getStageColor(i, stage);
          const isHighlighted = stage.highlighted === true;
          const arrowHeight = isHighlighted ? 0.7 : 0.55;
          const fontSize = isHighlighted ? 13 : 11;

          // First shape has rounded left edge, all shapes have arrow point on right
          const clipPath = i === 0
            ? 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)'
            : 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%)';

          return (
            <div key={i} style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {stage.timeframe && (
                <span style={{
                  fontSize: ptToPx(10),
                  color: '#808080',
                  marginBottom: toP(0.05),
                  textAlign: 'center',
                  width: '100%'
                }}>
                  {stage.timeframe}
                </span>
              )}
              <div style={{
                width: '100%',
                height: toP(arrowHeight),
                backgroundColor: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                clipPath: clipPath,
                borderRadius: i === 0 ? '8px 0 0 8px' : '0',
                boxShadow: isHighlighted ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
              }}>
                <span style={{
                  fontSize: ptToPx(fontSize),
                  fontWeight: 'bold',
                  color: 'white',
                  paddingLeft: i === 0 ? toP(0.1) : toP(0.15),
                  paddingRight: toP(0.2),
                  textAlign: 'center',
                  lineHeight: '1.1',
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  display: 'block',
                  width: '100%'
                }}>
                  {stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-1" style={{ marginTop: toP(0.15), minHeight: 0, gap: '6px' }}>
        {stages.map((stage: any, i: number) => {
          const isHighlighted = stage.highlighted === true;
          return (
            <div key={i} style={{
              flex: 1,
              backgroundColor: isHighlighted ? '#EDF5F7' : T.lt2,
              paddingLeft: toP(0.15),
              paddingRight: toP(0.15),
              paddingTop: toP(0.1),
              paddingBottom: toP(0.1),
              overflow: 'hidden',
              border: isHighlighted ? '2px solid #1B6B7B' : 'none',
              borderRadius: isHighlighted ? '4px' : '0'
            }}>
              {(stage.items || []).slice(0, 4).map((item: string, bi: number) => (
                <p key={bi} style={{
                  fontSize: ptToPx(11),
                  color: T.dk1,
                  lineHeight: lineSpacingToHeight(13),
                  margin: 0,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: toP(0.05)
                }}>
                  <span style={{ color: isHighlighted ? '#1B6B7B' : T.dk1, fontSize: ptToPx(11), marginTop: '0.1em', flexShrink: 0 }}>{'\u2022'}</span>
                  <span>{item}</span>
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// PPTX: header 12pt bold, row label 11pt bold, cell 11pt (14pt for Y/N)
function DataTablePreview({ comp }: { comp: any }) {
  const rowLabels = comp.rowLabels || [];
  const columns = comp.columns || [];
  const colCount = columns.length + 1;
  const colW = 100 / colCount;
  const rowH = Math.min(toP(0.5), 100 / (rowLabels.length + 1));

  return (
    <div className="h-full overflow-hidden" style={{ border: `1px solid ${T.accent1}30` }}>
      <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{
              width: `${colW}%`,
              height: rowH,
              backgroundColor: T.lt2,
              padding: toP(0.05),
              fontSize: ptToPx(11),
              fontWeight: 'bold',
              color: T.accent1,
              textAlign: 'left',
              borderBottom: `1px solid ${T.accent1}30`
            }}>Criteria</th>
            {columns.map((col: any, i: number) => (
              <th key={i} style={{
                height: rowH,
                backgroundColor: col.highlight ? T.accent4 : T.dk1,
                padding: toP(0.05),
                fontSize: ptToPx(12),
                fontWeight: 'bold',
                color: T.lt1,
                textAlign: 'center',
                borderBottom: `1px solid ${T.accent1}30`
              }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((label: string, ri: number) => (
            <tr key={ri}>
              <td style={{
                padding: toP(0.05),
                fontSize: ptToPx(11),
                fontWeight: 'bold',
                color: T.dk1,
                backgroundColor: ri % 2 === 0 ? T.lt1 : T.accent6,
                borderBottom: `1px solid ${T.accent1}30`,
                textAlign: 'left'
              }}>{label}</td>
              {columns.map((col: any, ci: number) => {
                const val = col.rows?.[ri] || '\u2014';
                const isCheck = val === '\u2713' || val.toLowerCase() === 'yes';
                const isX = val === '\u2717' || val.toLowerCase() === 'no';
                const displayVal = isCheck ? 'Y' : isX ? 'N' : val;
                return (
                  <td key={ci} style={{
                    padding: toP(0.05),
                    fontSize: ptToPx(isCheck || isX ? 14 : 11),
                    fontWeight: isCheck || isX ? 'bold' : 'normal',
                    color: isCheck ? T.accent3 : isX ? T.accent5 : T.dk1,
                    backgroundColor: ri % 2 === 0 ? T.lt1 : T.accent6,
                    borderBottom: `1px solid ${T.accent1}30`,
                    textAlign: 'center'
                  }}>{displayVal}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleTablePreview({ comp }: { comp: any }) {
  const headers = comp.headers || [];
  const rows = comp.rows || [];
  const title = comp.title;
  const colCount = headers.length + 1; // +1 for the label column
  const colW = 100 / colCount;

  // Smaller font for dense tables (match PPTX logic)
  const fontSize = rows.length >= 4 ? 10 : 11;

  return (
    <div className="h-full overflow-hidden flex flex-col" style={{ border: `1px solid ${T.accent1}30` }}>
      {title && (
        <div style={{
          padding: toP(0.08),
          fontSize: ptToPx(14),
          fontWeight: 'bold',
          color: T.dk1,
          textAlign: 'left',
          borderBottom: `1px solid ${T.accent1}30`,
          backgroundColor: T.lt2
        }}>
          {title}
        </div>
      )}
      <table style={{ width: '100%', flex: '1', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{
              width: `${colW}%`,
              backgroundColor: T.lt2,
              padding: toP(0.05),
              fontSize: ptToPx(12),
              fontWeight: 'bold',
              color: T.dk1,
              textAlign: 'left',
              borderBottom: `2px solid ${T.accent1}`
            }}></th>
            {headers.map((header: string, i: number) => (
              <th key={i} style={{
                backgroundColor: T.lt2,
                padding: toP(0.05),
                fontSize: ptToPx(12),
                fontWeight: 'bold',
                color: T.dk1,
                textAlign: 'center',
                borderBottom: `2px solid ${T.accent1}`
              }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, ri: number) => (
            <tr key={ri}>
              <td style={{
                padding: toP(0.05),
                fontSize: ptToPx(fontSize),
                fontWeight: 'bold',
                color: T.dk1,
                backgroundColor: ri % 2 === 0 ? T.lt1 : T.accent6,
                borderBottom: `1px solid ${T.accent1}30`,
                textAlign: 'left'
              }}>{row.label}</td>
              {(row.values || []).map((val: string, vi: number) => (
                <td key={vi} style={{
                  padding: toP(0.05),
                  fontSize: ptToPx(fontSize),
                  color: T.dk1,
                  backgroundColor: ri % 2 === 0 ? T.lt1 : T.accent6,
                  borderBottom: `1px solid ${T.accent1}30`,
                  textAlign: 'center'
                }}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartPreview({ comp }: { comp: any }) {
  const data = comp.data || [];
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        {comp.chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 8, right: 16, left: 40, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.accent6} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: ptToPx(10), fill: T.accent1 }}
              axisLine={{ stroke: T.accent6 }}
              tickLine={false}
              label={comp.xAxisTitle ? {
                value: comp.xAxisTitle,
                position: 'insideBottom',
                offset: -5,
                style: { fontSize: ptToPx(11), fill: T.dk1 }
              } : undefined}
            />
            <YAxis
              tick={{ fontSize: ptToPx(10), fill: T.accent1 }}
              axisLine={false}
              tickLine={false}
              label={comp.yAxisTitle ? {
                value: comp.yAxisTitle,
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: ptToPx(11), fill: T.dk1, textAnchor: 'middle' }
              } : undefined}
            />
            {comp.targetLine && <ReferenceLine y={comp.targetLine.value} stroke={T.accent5} strokeDasharray="4 4" label={{ value: comp.targetLine.label, fontSize: ptToPx(10), fill: T.accent5 }} />}
            <Line type="monotone" dataKey="value" stroke={T.accent3} strokeWidth={2} dot={{ r: 3, fill: T.accent3, stroke: '#fff', strokeWidth: 2 }} />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 16, left: 40, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.accent6} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: ptToPx(10), fill: T.accent1 }}
              axisLine={{ stroke: T.accent6 }}
              tickLine={false}
              label={comp.xAxisTitle ? {
                value: comp.xAxisTitle,
                position: 'insideBottom',
                offset: -5,
                style: { fontSize: ptToPx(11), fill: T.dk1 }
              } : undefined}
            />
            <YAxis
              tick={{ fontSize: ptToPx(10), fill: T.accent1 }}
              axisLine={false}
              tickLine={false}
              label={comp.yAxisTitle ? {
                value: comp.yAxisTitle,
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: ptToPx(11), fill: T.dk1, textAnchor: 'middle' }
              } : undefined}
            />
            {comp.targetLine && <ReferenceLine y={comp.targetLine.value} stroke={T.accent5} strokeDasharray="4 4" label={{ value: comp.targetLine.label, fontSize: ptToPx(10), fill: T.accent5 }} />}
            <Bar dataKey="value" fill={T.accent3} radius={[3, 3, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// PPTX: text 13pt bold white on navy background
function CalloutBarPreview({ text }: { text: string }) {
  if (!text) return null;

  // Dynamic font sizing based on length (match PPTX logic)
  let fontSize = 13;
  let displayText = text;

  if (text.length > 140) {
    fontSize = 11;
    // Truncate with ellipsis if still too long
    if (text.length > 280) {
      displayText = text.substring(0, 277) + '...';
    }
  } else if (text.length > 100) {
    fontSize = 12;
  }

  return (
    <div style={{
      height: '100%',
      backgroundColor: T.dk1,
      display: 'flex',
      alignItems: 'center',
      paddingLeft: toP(0.2),
      paddingRight: toP(0.2)
    }}>
      <p style={{ fontSize: ptToPx(fontSize), fontWeight: 'bold', color: 'white', margin: 0, lineHeight: '1.3' }}>
        {displayText}
      </p>
    </div>
  );
}

function TimelineTrackPreview({ comp }: { comp: any }) {
  const milestones = comp.milestones || [];
  const nodeColors = [T.accent3, T.accent2, T.accent4, T.accent3, T.accent2, T.accent4];
  return (
    <div className="h-full flex items-center">
      <div className="w-full relative">
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: toP(0.04),
          top: '50%',
          transform: 'translateY(-50%)',
          background: `linear-gradient(to right, ${T.accent3}, ${T.accent2})`
        }} />
        <div className="flex justify-between relative">
          {milestones.map((ms: any, i: number) => {
            const isAbove = i % 2 === 0;
            const color = nodeColors[i % nodeColors.length];
            return (
              <div key={i} className="flex flex-col items-center relative" style={{ width: `${100 / milestones.length}%` }}>
                {isAbove ? (
                  <>
                    <div className="text-center" style={{ marginBottom: toP(0.05) }}>
                      <p style={{ fontSize: ptToPx(10), fontWeight: 'bold', color, margin: 0, textTransform: 'uppercase' }}>{ms.date}</p>
                      <p style={{ fontSize: ptToPx(11), fontWeight: 'bold', color: T.dk1, margin: 0, marginTop: toP(0.02) }}>{ms.title}</p>
                      <p style={{ fontSize: ptToPx(9), color: T.accent1, margin: 0, marginTop: toP(0.02), lineHeight: '1.2' }}>{ms.description}</p>
                    </div>
                    <div style={{ width: '1px', height: toP(0.12), backgroundColor: color, opacity: 0.4 }} />
                    <div style={{
                      width: toP(0.3),
                      height: toP(0.3),
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: `${toP(0.02)}px solid white`,
                      boxShadow: `0 0 0 1px ${color}`,
                      flexShrink: 0
                    }} />
                  </>
                ) : (
                  <>
                    <div style={{
                      width: toP(0.3),
                      height: toP(0.3),
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: `${toP(0.02)}px solid white`,
                      boxShadow: `0 0 0 1px ${color}`,
                      flexShrink: 0
                    }} />
                    <div style={{ width: '1px', height: toP(0.12), backgroundColor: color, opacity: 0.4 }} />
                    <div className="text-center" style={{ marginTop: toP(0.05) }}>
                      <p style={{ fontSize: ptToPx(10), fontWeight: 'bold', color, margin: 0, textTransform: 'uppercase' }}>{ms.date}</p>
                      <p style={{ fontSize: ptToPx(11), fontWeight: 'bold', color: T.dk1, margin: 0, marginTop: toP(0.02) }}>{ms.title}</p>
                      <p style={{ fontSize: ptToPx(9), color: T.accent1, margin: 0, marginTop: toP(0.02), lineHeight: '1.2' }}>{ms.description}</p>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function IconGridPreview({ comp }: { comp: any }) {
  const blocks = comp.blocks || [];
  const cols = blocks.length <= 4 ? 2 : 3;
  return (
    <div className="h-full grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {blocks.map((block: any, i: number) => (
        <div key={i} style={{
          backgroundColor: T.lt2,
          padding: toP(0.1),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: toP(0.05)
        }}>
          <div style={{
            width: toP(0.6),
            height: toP(0.6),
            borderRadius: '50%',
            backgroundColor: T.dk1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: toP(0.05),
            fontSize: ptToPx(16),
            color: 'white'
          }}>
            {block.icon || '\u2022'}
          </div>
          <span style={{ fontSize: ptToPx(12), fontWeight: 'bold', color: T.dk1, textAlign: 'center' }}>
            {block.title}
          </span>
          <span style={{ fontSize: ptToPx(10), color: T.accent1, textAlign: 'center', marginTop: toP(0.05), lineHeight: '1.2' }}>
            {block.description}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScreenshotPreview({ comp }: { comp: any }) {
  return (
    <div style={{
      height: '100%',
      backgroundColor: T.lt2,
      border: `1px dashed ${T.accent1}40`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <span style={{ fontSize: ptToPx(12), color: T.accent1 }}>
        {comp.placeholderText || '[Screenshot / Image]'}
      </span>
      {comp.caption && (
        <span style={{ fontSize: ptToPx(9), color: T.accent1, marginTop: toP(0.05) }}>
          {comp.caption}
        </span>
      )}
    </div>
  );
}

// PPTX: heading 13pt bold white, text 12pt
function TextBlockPreview({ comp }: { comp: any }) {
  const headingColor = getColor(comp.headingColor);
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {comp.heading && (
        <div style={{
          backgroundColor: headingColor,
          padding: toP(0.15),
          height: toP(0.4)
        }}>
          <span style={{ fontSize: ptToPx(13), fontWeight: 'bold', color: 'white' }}>
            {comp.heading}
          </span>
        </div>
      )}
      <div style={{
        flex: 1,
        backgroundColor: T.lt2,
        padding: toP(0.15),
        overflow: 'hidden'
      }}>
        <p style={{ fontSize: ptToPx(12), color: T.dk1, margin: 0, lineHeight: '1.4' }}>
          {comp.text}
        </p>
      </div>
    </div>
  );
}

// PPTX: bars show side-by-side comparison with callout text (supports before/after mode)
function ComparisonBarsPreview({ comp }: { comp: any }) {
  const bars = comp.bars || [];
  const accentColor = getColor(comp.accentColor || 'navy');
  const barHeight = 0.35;
  const gap = 0.2;

  if (bars.length === 0) return null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: toP(gap) }}>
        {bars.map((bar: any, idx: number) => {
          const isBeforeAfter = bar.beforePercent !== undefined && bar.afterPercent !== undefined;

          if (isBeforeAfter) {
            // BEFORE/AFTER MODE: Dual bars
            return (
              <div key={idx} style={{ flex: 1 }}>
                {/* Label */}
                <div style={{ fontSize: ptToPx(11), fontWeight: 'bold', color: T.dk1, marginBottom: toP(0.05) }}>
                  {bar.label}
                </div>

                {/* Before Bar */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: toP(0.08) }}>
                  <div style={{ width: toP(1.2), fontSize: ptToPx(9), color: T.accent1 }}>Before:</div>
                  <div style={{ flex: 1, height: toP(0.25), backgroundColor: T.lt2, position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${bar.beforePercent}%`,
                      backgroundColor: T.accent1,  // Gray
                    }} />
                  </div>
                  <div style={{ width: toP(1), textAlign: 'right', fontSize: ptToPx(9), color: T.accent1 }}>
                    {bar.beforeValue}
                  </div>
                </div>

                {/* After Bar */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: toP(1.2), fontSize: ptToPx(9), color: accentColor }}>After:</div>
                  <div style={{ flex: 1, height: toP(0.25), backgroundColor: T.lt2, position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${bar.afterPercent}%`,
                      backgroundColor: accentColor,
                    }} />
                  </div>
                  <div style={{ width: toP(1), textAlign: 'right', fontSize: ptToPx(9), fontWeight: 'bold', color: accentColor }}>
                    {bar.afterValue}
                  </div>
                </div>

                {/* Annotation (reduction %) */}
                {bar.annotation && (
                  <div style={{ fontSize: ptToPx(9), fontStyle: 'italic', color: T.accent1, marginTop: toP(0.05) }}>
                    {bar.annotation}
                  </div>
                )}
              </div>
            );
          } else {
            // SINGLE-VALUE MODE (legacy)
            return (
              <div key={idx} style={{ flex: 1 }}>
                <div style={{ fontSize: ptToPx(11), fontWeight: 'bold', color: T.dk1, marginBottom: toP(0.05) }}>
                  {bar.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ flex: 1, height: toP(barHeight), backgroundColor: T.lt2, position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${bar.percent}%`,
                      backgroundColor: accentColor,
                    }} />
                  </div>
                  <div style={{ width: toP(1), textAlign: 'right', fontSize: ptToPx(14), fontWeight: 'bold', color: accentColor, marginLeft: toP(0.15) }}>
                    {bar.value}
                  </div>
                </div>
                {bar.annotation && (
                  <div style={{ fontSize: ptToPx(9), fontStyle: 'italic', color: T.accent1, marginTop: toP(0.05) }}>
                    {bar.annotation}
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>

      {/* Callout Bar */}
      {comp.callout && (
        <div style={{
          marginTop: toP(0.2),
          padding: `${toP(0.1)} ${toP(0.15)}`,
          backgroundColor: accentColor,
          color: T.lt1,
          fontSize: ptToPx(11),
          fontWeight: 'bold',
          borderLeft: `4px solid ${T.accent2}`
        }}>
          {comp.callout}
        </div>
      )}
    </div>
  );
}

function TeamStructurePreview({ comp }: { comp: any }) {
  const teams = comp.teams || [];
  const connector = comp.connector || '+';
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#F8FAFB' }}>
      <div style={{ height: '1px', backgroundColor: T.accent1 }} />
      <div className="flex-1 flex items-center justify-center" style={{ padding: toP(0.2) }}>
        {teams.map((team: any, i: number) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div style={{
                width: toP(0.8),
                height: toP(0.8),
                borderRadius: '50%',
                backgroundColor: T.dk1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: ptToPx(20),
                marginBottom: toP(0.1)
              }}>
                {team.icon || '\u{1F464}'}
              </div>
              <span style={{ fontSize: ptToPx(13), fontWeight: 'bold', color: T.dk1, textAlign: 'center', marginBottom: toP(0.15) }}>
                {team.name}
              </span>
              <div style={{ width: '100%', paddingLeft: toP(0.1), paddingRight: toP(0.1) }}>
                {(team.sections || []).map((section: any, si: number) => (
                  <div key={si} style={{ marginBottom: toP(0.05) }}>
                    <p style={{ fontSize: ptToPx(11), fontWeight: 'bold', color: T.dk1, margin: 0 }}>
                      {section.heading}
                    </p>
                    {(section.items || []).slice(0, 2).map((item: string, ii: number) => (
                      <p key={ii} style={{
                        fontSize: ptToPx(10),
                        fontStyle: 'italic',
                        color: T.accent1,
                        margin: 0,
                        marginLeft: toP(0.1),
                        lineHeight: lineSpacingToHeight(12)
                      }}>
                        {'\u2022'} {item}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {i < teams.length - 1 && (
              <div style={{
                padding: `0 ${toP(0.2)}px`,
                fontSize: ptToPx(24),
                fontWeight: 'bold',
                color: T.accent1
              }}>
                {connector}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WaterfallChartPreview({ comp }: { comp: any }) {
  const bars = comp.bars || [];
  if (bars.length === 0) return <div className="text-xs text-gray-400">No data</div>;

  // Calculate cumulative values for positioning
  let cumulative = 0;
  const values = bars.map((bar: any) => {
    const isFirst = bar.value > 0 && !bar.delta;
    const isTotal = bar.isTotal;

    if (isFirst) {
      cumulative = bar.value;
      return { ...bar, startValue: 0, endValue: bar.value, cumulative };
    } else if (isTotal) {
      return { ...bar, startValue: 0, endValue: bar.value, cumulative: bar.value };
    } else {
      const delta = bar.delta || 0;
      const startValue = cumulative;
      cumulative += delta;
      return { ...bar, startValue, endValue: cumulative, cumulative };
    }
  });

  const allValues = values.flatMap((v: any) => [v.startValue, v.endValue]);
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;

  const toY = (val: number) => {
    if (range === 0) return 50;
    return ((maxValue - val) / range) * 70 + 5; // 5% padding top, 25% bottom for labels
  };

  const barWidth = 85 / bars.length;
  const gapWidth = barWidth * 0.1;
  const actualBarWidth = barWidth - gapWidth;

  return (
    <div className="h-full w-full flex flex-col" style={{ padding: toP(0.1) }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Zero line */}
        {minValue < 0 && (
          <line
            x1="5" x2="95"
            y1={toY(0)} y2={toY(0)}
            stroke={T.accent1}
            strokeWidth="0.3"
            strokeDasharray="2,2"
            opacity="0.5"
          />
        )}

        {values.map((bar: any, i: number) => {
          const x = 7.5 + i * barWidth;
          const isTotal = bar.isTotal;
          const isFirst = i === 0;

          const yStart = toY(bar.startValue);
          const yEnd = toY(bar.endValue);
          const height = Math.abs(yEnd - yStart);
          const yTop = Math.min(yStart, yEnd);

          const delta = bar.delta || 0;
          const isPositive = delta > 0;
          const barColor = isTotal || isFirst ? T.dk1 : isPositive ? T.accent3 : T.accent5;

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={x}
                y={yTop}
                width={actualBarWidth}
                height={Math.max(height, 1)}
                fill={barColor}
                opacity={isTotal || isFirst ? 1 : 0.85}
                stroke={T.dk1}
                strokeWidth="0.15"
              />

              {/* Connector line to next bar */}
              {comp.showConnectors && i < values.length - 1 && (
                <line
                  x1={x + actualBarWidth}
                  x2={x + barWidth}
                  y1={yEnd}
                  y2={yEnd}
                  stroke={T.accent1}
                  strokeWidth="0.3"
                  strokeDasharray="1.5,1"
                  opacity="0.5"
                />
              )}

              {/* Value label on top of bar */}
              <text
                x={x + actualBarWidth / 2}
                y={yTop - 2}
                textAnchor="middle"
                fontSize="3.5"
                fontWeight="bold"
                fill={T.dk1}
              >
                {isFirst || isTotal ? `$${bar.endValue}M` : (delta > 0 ? `+$${delta}M` : `$${delta}M`)}
              </text>

              {/* Bar label at bottom */}
              <text
                x={x + actualBarWidth / 2}
                y="82"
                textAnchor="middle"
                fontSize="2.8"
                fill={T.dk1}
                fontWeight="500"
              >
                {bar.label.length > 15 ? bar.label.substring(0, 13) + '...' : bar.label}
              </text>

              {/* Delta label inside bar if provided */}
              {bar.deltaLabel && height > 8 && (
                <text
                  x={x + actualBarWidth / 2}
                  y={yTop + height / 2 + 1}
                  textAnchor="middle"
                  fontSize="2.5"
                  fill="white"
                  fontWeight="bold"
                >
                  {bar.deltaLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ContextBannerPreview({ comp }: { comp: any }) {
  const colorMap: Record<string, string> = { navy: T.dk1, teal: T.accent3, orange: T.accent2 };
  const accentColor = colorMap[comp.accentColor || 'orange'] || T.accent2;
  const labelColor = colorMap[comp.labelColor || 'orange'] || T.accent2;
  const bgMap: Record<string, string> = { teal: '#EDF5F7', navy: '#EEF1F4', orange: '#FDF2EA' };
  const bgColor = bgMap[comp.accentColor || 'orange'] || '#FDF2EA';

  return (
    <div style={{
      height: '100%',
      backgroundColor: bgColor,
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      paddingLeft: toP(0.25),
      paddingRight: toP(0.15),
    }}>
      {/* Left accent bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: toP(0.06),
        backgroundColor: accentColor,
      }} />
      <p style={{ margin: 0, fontSize: ptToPx(11), lineHeight: '1.4', color: T.dk1 }}>
        {comp.label && (
          <span style={{ fontWeight: 700, color: labelColor, marginRight: 4 }}>{comp.label}</span>
        )}
        <span>{comp.text}</span>
      </p>
    </div>
  );
}
