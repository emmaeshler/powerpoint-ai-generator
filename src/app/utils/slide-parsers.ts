// Slide Parser Abstraction Layer
// Routes slide parsing to bundle-specific parsers based on which skill bundle was used

import { Slide, SlideComponent, CalloutBarComponent, generateSlideId, generateComponentId } from '../types';
import { getTemplate } from '../layout-templates';

// ─── PARSER REGISTRY ──────────────────────────────────────────

type SlideParser = (response: string, bundleId?: string) => Slide;

const PARSERS: Record<string, SlideParser> = {
  'emma-bundle': parseEmmaSlide,
  'wills-bundle': parseGenericSlide,
  'test-bundle': parseGenericSlide,
  'generic': parseGenericSlide,
};

/**
 * Main entry point - routes to the correct parser based on bundleId
 */
export function parseSlideResponse(response: string, bundleId?: string): Slide {
  const parserId = bundleId || 'emma-bundle'; // default to Emma for backward compatibility
  const parser = PARSERS[parserId] || parseGenericSlide;

  return parser(response, bundleId);
}

// ─── EMMA BUNDLE PARSER ───────────────────────────────────────

/**
 * Parser for Emma's bundle - expects templateId + slotContent structure
 */
function parseEmmaSlide(response: string, bundleId?: string): Slide {
  // Strip markdown code blocks before parsing
  let cleaned = response.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
  }

  cleaned = cleaned.trim();
  let jsonStr = cleaned;

  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Helper: split title into soWhat + description
    function splitTitle(title: string): { soWhat: string; description: string } {
      const parts = (title || '').split('|').map(p => p.trim());
      return { soWhat: parts[0] || '', description: parts[1] || '' };
    }

    // Handle slotContent format (template-based)
    if (parsed.slotContent) {
      const slotContent: Record<string, SlideComponent> = {};
      for (const [slotId, compData] of Object.entries(parsed.slotContent as Record<string, any>)) {
        slotContent[slotId] = {
          ...compData,
          id: compData.id || generateComponentId(),
        };
      }

      let calloutBar: CalloutBarComponent | undefined;
      if (parsed.calloutBar && parsed.calloutBar.text) {
        calloutBar = {
          id: generateComponentId(),
          type: 'callout_bar' as const,
          text: parsed.calloutBar.text,
        };
      }

      const title = parsed.title || 'Generated Slide';
      const { soWhat, description } = splitTitle(title);

      const slide: Slide = {
        id: generateSlideId(),
        title,
        soWhat,
        description,
        keyMetric: parsed.keyMetric || undefined,
        keyMetricLabel: parsed.keyMetricLabel || undefined,
        templateId: parsed.templateId || 'full',
        slotContent,
        calloutBar,
        bundleId: bundleId || 'emma-bundle',
        renderType: 'emma',
      };

      return slide;
    }

    throw new Error('Emma parser: Response missing slotContent');
  } catch (error) {
    console.error('[Emma Parser] Failed to parse JSON:', error);
    console.error('[Emma Parser] Response was:', response);
    throw new Error('Failed to parse Emma slide JSON');
  }
}

// ─── PFP BUNDLE PARSER ────────────────────────────────────────

/**
 * Parser for PFP bundle - flexible structure defined by PFP's skill file
 */
function parsePFPSlide(response: string, bundleId?: string): Slide {
  // Check if skill is trying to ask questions instead of generating
  const lowerResponse = response.toLowerCase();
  if (
    (lowerResponse.includes('question') && lowerResponse.includes('**question')) ||
    lowerResponse.includes('i need to') ||
    lowerResponse.includes('let me ask') ||
    lowerResponse.includes('clarif')
  ) {
    console.warn('[PFP Parser] Skill tried to ask questions. Creating fallback slide.');

    // Create a fallback slide explaining the issue
    return {
      id: generateSlideId(),
      title: 'Skill Configuration Issue',
      soWhat: 'This skill tried to start a conversation instead of generating a slide',
      description: 'The skill needs to be updated to work in single-shot mode',
      content: {
        message: response.substring(0, 500),
        note: 'Try providing more detail in your prompt, or use a different skill designed for single-slide generation.'
      },
      bundleId: bundleId || 'pfp-bundle',
      renderType: 'pfp',
    };
  }

  // Strip markdown code blocks
  let cleaned = response.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
  }

  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    const slide: Slide = {
      id: generateSlideId(),
      title: parsed.title || 'Generated Slide',
      soWhat: parsed.soWhat || '',
      description: parsed.description || '',
      content: parsed, // Store entire structure in content field
      bundleId: bundleId || 'pfp-bundle',
      renderType: 'pfp',
    };

    return slide;
  } catch (error) {
    console.error('[PFP Parser] Failed to parse JSON:', error);
    console.error('[PFP Parser] Response was:', response);

    // Create a fallback slide showing the raw response
    return {
      id: generateSlideId(),
      title: 'Unable to Parse Response',
      soWhat: 'The skill returned content that could not be parsed as JSON',
      description: 'Check the content below to see what was returned',
      content: {
        rawResponse: response.substring(0, 1000),
        parseError: error instanceof Error ? error.message : 'Unknown error'
      },
      bundleId: bundleId || 'pfp-bundle',
      renderType: 'pfp',
    };
  }
}

// ─── GENERIC PARSER ───────────────────────────────────────────

/**
 * Generic fallback parser - tries to extract basic slide information
 */
function parseGenericSlide(response: string, bundleId?: string): Slide {
  // Strip markdown code blocks
  let cleaned = response.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
  }

  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    const slide: Slide = {
      id: generateSlideId(),
      title: parsed.title || 'Generated Slide',
      soWhat: parsed.soWhat || parsed.title || '',
      description: parsed.description || '',
      content: parsed,
      bundleId: bundleId || 'generic',
      renderType: 'generic',
    };

    return slide;
  } catch (error) {
    console.error('[Generic Parser] Failed to parse JSON:', error);
    console.error('[Generic Parser] Response was:', response);
    throw new Error('Failed to parse slide JSON');
  }
}

// ─── DECK PARSERS ─────────────────────────────────────────────

/**
 * Parse multiple slides from an array response
 */
export function parseDeckResponse(response: string, bundleId?: string): Slide[] {
  let cleaned = response.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
  }

  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      // Single slide returned, wrap in array
      return [parseSlideResponse(JSON.stringify(parsed), bundleId)];
    }

    // Parse each slide in the array
    return parsed.map(slideData => parseSlideResponse(JSON.stringify(slideData), bundleId));
  } catch (error) {
    console.error('[Deck Parser] Failed to parse JSON array:', error);
    throw new Error('Failed to parse deck JSON');
  }
}
