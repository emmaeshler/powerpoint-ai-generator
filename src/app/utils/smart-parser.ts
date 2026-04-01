// Emma's Awesome PPT Generator — Smart Local Parser (Template-Based)
// Keyword-driven slide generation without AI

import { Slide, SlideComponent, CalloutBarComponent, generateSlideId, generateComponentId } from '../types';

// ─── MAIN ENTRY ───────────────────────────────────────────────

export function smartParsePrompt(prompt: string): Slide {
  const parsed = analyzePrompt(prompt);
  const result = selectTemplateAndContent(parsed);
  const title = generateTitle(parsed);
  const parts = title.split('|').map(p => p.trim());
  const soWhat = parts[0] || '';
  const description = parts[1] || '';

  return {
    id: generateSlideId(),
    title,
    soWhat,
    description,
    templateId: result.templateId,
    slotContent: result.slotContent,
    calloutBar: result.calloutBar,
  };
}

// ─── PROMPT ANALYSIS ──────────────────────────────────────────

interface PromptAnalysis {
  raw: string;
  lower: string;
  items: string[];
  numbers: { raw: string; value: number; label: string; isPercent: boolean; isCurrency: boolean }[];
  dates: string[];
  quarters: string[];
  hasComparison: boolean;
  hasProblemSolution: boolean;
  hasSequence: boolean;
  hasStats: boolean;
  hasScreenshot: boolean;
  hasWaterfall: boolean;
  topic: string;
}

function analyzePrompt(prompt: string): PromptAnalysis {
  const lower = prompt.toLowerCase();
  return {
    raw: prompt,
    lower,
    items: extractItems(prompt),
    numbers: extractNumbers(prompt),
    dates: extractDates(prompt),
    quarters: (prompt.match(/Q[1-4](?:\s*['']?\d{2,4})?/gi) || []),
    hasComparison: /\bvs\.?\b|\bversus\b|\bbefore\s*(?:and|vs|\/)\s*after\b|\bcurrent\s*state\b|\bfuture\s*state\b|\bcompare\b/i.test(lower),
    hasProblemSolution: /\b(problem|challenge|issue|risk|pain\s*point).+(solution|resolve|address|fix)/i.test(lower) || /\bproblem.*solution\b/i.test(lower),
    hasSequence: /\b(timeline|milestone|rollout|phase|stage|step|process|sequence|workflow)\b/i.test(lower),
    hasStats: extractNumbers(prompt).length >= 2 || /\b(kpi|metric|dashboard|performance)\b/i.test(lower),
    hasScreenshot: /\b(screenshot|demo|mockup|interface|ui|product\s*view)\b/i.test(lower),
    hasWaterfall: /\b(ebitda|waterfall|bridge|walk|buildup|build-up|breakdown|revenue.*expense|cost.*impact|variance)\b/i.test(lower) && extractNumbers(prompt).length >= 3,
    topic: extractTopic(prompt),
  };
}

function extractItems(prompt: string): string[] {
  const numbered = prompt.match(/\d+[.)]\s*([^\n\d][^\n]*)/g);
  if (numbered && numbered.length >= 2) return numbered.map(i => i.replace(/^\d+[.)]\s*/, '').trim());
  const dashed = prompt.match(/(?:^|\n)\s*[-\u2022\u2013]\s*([^\n]+)/g);
  if (dashed && dashed.length >= 2) return dashed.map(i => i.replace(/^\s*[-\u2022\u2013]\s*/, '').trim());
  const colonMatch = prompt.match(/(?::|are|include|such as|like)\s+([^.!?\n]+)/i);
  if (colonMatch) {
    const parts = colonMatch[1].split(/,\s*(?:and\s+)?|\s+and\s+/).map(s => s.trim()).filter(s => s.length > 1);
    if (parts.length >= 2) return parts;
  }
  const commaAndMatch = prompt.match(/([A-Z][^,]+(?:,\s*[A-Z][^,]+)+(?:,?\s*and\s+[A-Z][^.!?\n]+))/);
  if (commaAndMatch) {
    const parts = commaAndMatch[1].split(/,\s*(?:and\s+)?|\s+and\s+/).map(s => s.trim()).filter(s => s.length > 1);
    if (parts.length >= 2) return parts;
  }
  return [];
}

function extractNumbers(prompt: string): { raw: string; value: number; label: string; isPercent: boolean; isCurrency: boolean }[] {
  const results: any[] = [];
  const regex = /(\$?[\d,]+\.?\d*)\s*(%|[kKmMbB])?(?:\s+(?:in\s+)?(\w[\w\s]{0,25}?))?(?=[,.\s;!?]|$)/g;
  let match;
  while ((match = regex.exec(prompt)) !== null) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(value) && value > 0) {
      results.push({ raw: match[0].trim(), value, label: (match[3] || '').trim(), isPercent: match[2] === '%', isCurrency: match[1].startsWith('$') });
    }
  }
  return results;
}

function extractDates(prompt: string): string[] {
  const results: string[] = [];
  const monthYear = prompt.match(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}/gi);
  if (monthYear) results.push(...monthYear);
  const ranges = prompt.match(/(?:Month|Week|Day)\s+\d+(?:\s*[-\u2013]\s*\d+)?/gi);
  if (ranges) results.push(...ranges);
  return results;
}

function extractTopic(prompt: string): string {
  const patterns: [RegExp, string][] = [
    [/cloud\s*migrat/i, 'Cloud Migration'],
    [/digital\s*transform/i, 'Digital Transformation'],
    [/(?:ai|artificial intelligence)/i, 'AI & ML'],
    [/operational\s*excellen/i, 'Operational Excellence'],
    [/cost\s*(?:reduction|optimization)/i, 'Cost Optimization'],
    [/revenue\s*(?:growth|expansion)/i, 'Revenue Growth'],
    [/customer\s*experience/i, 'Customer Experience'],
    [/talent|workforce/i, 'Talent & Workforce'],
    [/supply\s*chain/i, 'Supply Chain'],
    [/cybersecurity|security/i, 'Cybersecurity'],
    [/automation/i, 'Automation'],
    [/pricing/i, 'Pricing Strategy'],
  ];
  for (const [pat, label] of patterns) {
    if (pat.test(prompt)) return label;
  }
  return '';
}

// ─── TEMPLATE + SLOT SELECTION ────────────────────────────────

interface SlideResult {
  templateId: string;
  slotContent: Record<string, SlideComponent>;
  calloutBar?: CalloutBarComponent;
}

function selectTemplateAndContent(p: PromptAnalysis): SlideResult {
  let calloutBar: CalloutBarComponent | undefined;

  // Add callout bar if there's a clear takeaway
  if (p.topic) {
    calloutBar = {
      id: generateComponentId(), type: 'callout_bar',
      text: `${p.topic} represents a strategic imperative \u2014 execution discipline and cross-functional alignment will determine success.`,
    };
  }

  // Waterfall chart → EBITDA bridge, financial flows
  if (p.hasWaterfall && p.numbers.length >= 3) {
    const nums = p.numbers.slice(0, 7);
    const bars = nums.map((n, i) => {
      const isFirst = i === 0;
      const isLast = i === nums.length - 1;
      return {
        label: n.label || `Item ${i + 1}`,
        value: isFirst ? n.value : 0,
        delta: isFirst ? undefined : n.value,
        deltaLabel: isFirst || isLast ? undefined : (n.value > 0 ? `+${n.value}` : `${n.value}`),
        isTotal: isLast,
      };
    });
    return {
      templateId: 'full',
      slotContent: {
        main: {
          id: generateComponentId(), type: 'waterfall_chart',
          bars,
          showConnectors: true,
        },
      },
      calloutBar,
    };
  }

  // Stats/numbers → kpi_cards or stat_hero
  if (p.hasStats && p.numbers.length >= 3) {
    return {
      templateId: 'full',
      slotContent: {
        main: {
          id: generateComponentId(), type: 'kpi_cards',
          metrics: p.numbers.slice(0, 5).map(n => ({
            value: n.isPercent ? `${n.value}%` : n.isCurrency ? `$${n.value}` : String(n.value),
            label: cap(n.label) || 'Metric',
            trend: 'up' as const,
          })),
        },
      },
      calloutBar,
    };
  }

  if (p.numbers.length >= 1 && p.numbers[0].isPercent) {
    const n = p.numbers[0];
    return {
      templateId: 'full',
      slotContent: {
        main: {
          id: generateComponentId(), type: 'stat_hero',
          value: `${n.value}%`, label: cap(n.label) || 'Key Metric',
          supportingText: p.numbers.length > 1 ? `With ${p.numbers[1].raw} additional context` : undefined,
          accentColor: 'navy',
        },
      },
      calloutBar,
    };
  }

  // Problem/solution → two-equal with text blocks
  if (p.hasProblemSolution) {
    return {
      templateId: 'two-equal',
      slotContent: {
        left: {
          id: generateComponentId(), type: 'text_block',
          heading: 'Challenge', headingColor: 'orange',
          text: 'Fragmented processes limit visibility and reduce throughput across the organization.',
        },
        right: {
          id: generateComponentId(), type: 'text_block',
          heading: 'Solution', headingColor: 'navy',
          text: 'Unified platform with real-time dashboards, automated workflows, and standardized governance.',
        },
      },
      calloutBar,
    };
  }

  // Comparison → full with data table
  if (p.hasComparison) {
    return {
      templateId: 'full',
      slotContent: {
        main: {
          id: generateComponentId(), type: 'data_table',
          rowLabels: p.items.length >= 2 ? p.items.slice(0, 4) : ['Capability 1', 'Capability 2', 'Capability 3'],
          columns: [
            { header: 'Current State', rows: ['\u2713', '\u2717', '\u2717'] },
            { header: 'Future State', highlight: true, rows: ['\u2713', '\u2713', '\u2713'] },
          ],
        },
      },
      calloutBar,
    };
  }

  // Sequences → timeline or process flow
  if (p.hasSequence) {
    if (p.dates.length >= 2 || p.quarters.length >= 2) {
      const dates = [...p.dates, ...p.quarters];
      return {
        templateId: 'full',
        slotContent: {
          main: {
            id: generateComponentId(), type: 'timeline_track',
            milestones: (p.items.length >= 2 ? p.items : ['Discovery', 'Design', 'Build', 'Deploy']).slice(0, 5).map((item, i) => ({
              date: dates[i] || `Phase ${i + 1}`,
              title: cap(item),
              description: `Key activities for ${item.toLowerCase()}`,
            })),
          },
        },
        calloutBar,
      };
    }
    return {
      templateId: 'full',
      slotContent: {
        main: {
          id: generateComponentId(), type: 'process_flow',
          stages: (p.items.length >= 2 ? p.items : ['Assess', 'Plan', 'Execute', 'Sustain']).slice(0, 5).map((item, i) => ({
            label: cap(item),
            timeframe: `Phase ${i + 1}`,
            items: [`Define ${item.toLowerCase()} objectives`, `Execute ${item.toLowerCase()} activities`],
          })),
        },
      },
      calloutBar,
    };
  }

  // Screenshots → wide-left with screenshot + bullets
  if (p.hasScreenshot) {
    return {
      templateId: 'wide-left',
      slotContent: {
        main: {
          id: generateComponentId(), type: 'screenshot',
          placeholderText: '[Replace with screenshot]', caption: 'Product interface',
        },
        sidebar: {
          id: generateComponentId(), type: 'bullet_list',
          items: ['Real-time analytics dashboard', 'Role-based access controls', 'Automated reporting', 'Seamless integration'],
          bulletColor: 'teal',
        },
      },
      calloutBar,
    };
  }

  // Items → icon_grid (4+) or icon_columns (2-3) or three-equal
  if (p.items.length >= 4) {
    return {
      templateId: 'full',
      slotContent: {
        main: {
          id: generateComponentId(), type: 'icon_grid',
          blocks: p.items.slice(0, 6).map(item => ({
            icon: '\u26A1', title: cap(item),
            description: `Deliver measurable outcomes through ${item.toLowerCase()}`,
          })),
        },
      },
      calloutBar,
    };
  }

  if (p.items.length === 3) {
    const colors = ['navy', 'teal', 'orange'] as const;
    return {
      templateId: 'three-equal',
      slotContent: {
        left: {
          id: generateComponentId(), type: 'text_block',
          heading: cap(p.items[0]), headingColor: colors[0],
          text: `Define ${p.items[0].toLowerCase()} objectives and align stakeholders.`,
        },
        center: {
          id: generateComponentId(), type: 'text_block',
          heading: cap(p.items[1]), headingColor: colors[1],
          text: `Execute ${p.items[1].toLowerCase()} activities and measure outcomes.`,
        },
        right: {
          id: generateComponentId(), type: 'text_block',
          heading: cap(p.items[2]), headingColor: colors[2],
          text: `Scale ${p.items[2].toLowerCase()} approaches for sustained impact.`,
        },
      },
      calloutBar,
    };
  }

  if (p.items.length === 2) {
    const colors = ['navy', 'teal'] as const;
    return {
      templateId: 'two-equal',
      slotContent: {
        left: {
          id: generateComponentId(), type: 'text_block',
          heading: cap(p.items[0]), headingColor: colors[0],
          text: `Define ${p.items[0].toLowerCase()} objectives and align stakeholders.`,
        },
        right: {
          id: generateComponentId(), type: 'text_block',
          heading: cap(p.items[1]), headingColor: colors[1],
          text: `Execute ${p.items[1].toLowerCase()} activities and measure outcomes.`,
        },
      },
      calloutBar,
    };
  }

  // Fallback: full with bullet_list
  return {
    templateId: 'full',
    slotContent: {
      main: {
        id: generateComponentId(), type: 'bullet_list',
        items: ['Define clear objectives and success criteria', 'Align cross-functional stakeholders', 'Establish governance framework', 'Track KPIs and adjust course'],
        bulletColor: 'navy',
      },
    },
    calloutBar,
  };
}

// ─── TITLE GENERATION ─────────────────────────────────────────

function generateTitle(p: PromptAnalysis): string {
  if (p.hasProblemSolution) return `Targeted Solutions | Addressing Core ${p.topic || 'Business'} Challenges`;
  if (p.hasComparison) return `Comparative Analysis | ${p.topic || 'Capability'} Assessment Reveals Clear Gaps`;
  if (p.hasStats && p.numbers.length > 0) {
    const n = p.numbers[0];
    return `${cap(n.label) || p.topic || 'Performance'} Reaches ${n.raw} | Consistent Improvement Trajectory`;
  }
  if (p.hasSequence) return `Phased Rollout | ${p.items.length || 4}-Stage ${p.topic || 'Execution'} Plan`;
  if (p.items.length >= 3) return `${p.items.length} Strategic Priorities | Accelerating ${p.topic || 'Transformation'}`;
  if (p.topic) return `${p.topic} Strategy | Building the Foundation for Growth`;

  const subject = p.raw.split(/[.!?\n]/)[0].trim();
  if (subject.length > 8 && subject.length < 60) return `${cap(subject)} | Strategic Approach`;
  return 'Strategic Overview | Building the Path Forward';
}

function cap(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}