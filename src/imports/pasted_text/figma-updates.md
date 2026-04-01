=============================================================
FIGMA COMPONENT UPDATES + SYSTEM PROMPT CHANGES
=============================================================
Do these in order. Each change has a Figma step and
a system prompt step.


=============================================================
CHANGE 1: SLOT CONTAINER VARIANT
=============================================================

FIGMA:
Open your slot container component (the wrapper that
holds each content block inside a layout).

Add a new property:
  Name: variant
  Type: String enum
  Options: "default" | "muted" | "highlighted"

Design each variant:
  default:
    - Background: white (#FFFFFF)
    - Border: none
    - Text: dark (#002F4A)

  muted:
    - Background: light gray (#F5F5F5)
    - Border: none
    - Text: dark (#002F4A)

  highlighted:
    - Background: light teal (#EDF5F7)
    - Border: 2px dashed #1B6B7B
    - Border radius: 8px
    - Text: dark (#002F4A)

SYSTEM PROMPT ADDITION:
Every slot in slotContent now accepts an optional
"variant" property: "default" | "muted" | "highlighted"

Rules:
- Use "highlighted" on the slot containing the WINNER
  content — the thing the audience should look at first
- Use "muted" for supporting/secondary content
- Use "default" for everything else
- Never highlight more than one slot per slide
- Never use "muted" on the winner

Example:
{
  "templateId": "three-equal",
  "slotContent": {
    "left": { "type": "icon_columns", "variant": "default", ... },
    "center": { "type": "icon_columns", "variant": "default", ... },
    "right": { "type": "icon_columns", "variant": "highlighted", ... }
  }
}


=============================================================
CHANGE 2: ICON_COLUMNS HIGHLIGHTED COLUMN
=============================================================

FIGMA:
Open your icon_columns component. Each individual
column inside it needs a new property:

  Name: highlighted
  Type: Boolean
  Default: false

When highlighted = true:
  - Column background: light teal (#EDF5F7)
  - Border: 2px dashed #1B6B7B
  - Border radius: 6px
  - Padding: 12px
  - Header color stays as set (orange recommended for winner)

When highlighted = false:
  - No background
  - No border
  - Normal rendering

SYSTEM PROMPT ADDITION:
icon_columns columns now accept "highlighted": true/false

Rules:
- When one column matters more than the others,
  set highlighted: true on that column only
- Pair with headerColor: "orange" for maximum emphasis
- Never highlight more than one column
- If all columns are equal, don't highlight any

Example:
{
  "type": "icon_columns",
  "columns": [
    { "icon": "📊", "header": "Measurement & Analytics", "headerColor": "navy", "highlighted": false, "items": [...] },
    { "icon": "🏷️", "header": "Price Setting", "headerColor": "navy", "highlighted": false, "items": [...] },
    { "icon": "🎯", "header": "Price Execution", "headerColor": "orange", "highlighted": true, "items": [...] }
  ]
}


=============================================================
CHANGE 3: STAT_HERO SIZE VARIANT
=============================================================

FIGMA:
Open your stat_hero component.

Add a new property:
  Name: size
  Type: String enum
  Options: "large" | "medium" | "small"

Design each size:
  large:
    - Value font size: 72px (or whatever your current default is)
    - Label font size: 18px
    - Full slot width

  medium:
    - Value font size: 48px
    - Label font size: 14px
    - Works in smaller slots like right_top

  small:
    - Value font size: 32px
    - Label font size: 12px
    - Works as a secondary stat alongside a primary

SYSTEM PROMPT ADDITION:
stat_hero now accepts "size": "large" | "medium" | "small"

Rules:
- Use "large" when the stat IS the slide — it's the
  whole point and goes in the hero or main slot
- Use "medium" when the stat supports a larger visual
  like a chart or icon_columns in the hero slot
- Use "small" when you need multiple stats on the
  same slide and none should overpower the others
- In hero-left-stack-right: use "medium" in right_top
  and right_bottom, never "large" (they won't fit)
- In full layout: use "large"
- In quad layout: use "small"

Example:
{
  "type": "stat_hero",
  "value": "$1.6M",
  "label": "Incremental EBITDA",
  "supportingText": "From improving realization 50% → 65%",
  "accentColor": "orange",
  "size": "medium"
}


=============================================================
CHANGE 4: COMPARISON BARS (NEW COMPONENT)
=============================================================

FIGMA:
Create a new component called comparison_bars.

Structure:
  - Two horizontal bars stacked vertically
  - Each bar has:
    - A label on the left (e.g., "Current: 50%")
    - A filled bar whose width is proportional to
      the percent value
    - The value displayed inside or at the end of
      the bar
  - Between the two bars on the right side:
    - A callout badge showing the delta
      (e.g., "+33%")
  - Bar colors:
    - Top bar (before): gray (#B0B0B0)
    - Bottom bar (after): brand navy (#002F4A)
      or teal (#1B6B7B)

Properties:
  Name: bars
  Type: Array of { label: string, value: string, percent: number }

  Name: callout
  Type: String (the delta label)

  Name: accentColor
  Type: String enum ("navy" | "teal" | "orange")

SYSTEM PROMPT ADDITION:
New component type: comparison_bars

Fields:
- bars: array of { label, value, percent (0-100) }
  (exactly 2 bars — before and after)
- callout: string showing the improvement
- accentColor: navy | teal | orange

Rules:
- Use when showing before/after or current vs target
- Always put the "before" bar first (top), "after"
  bar second (bottom)
- The "after" bar should always be longer (higher
  percent) to show improvement
- Works best in right_top or right_bottom slots of
  hero-left-stack-right, or sidebar of wide-left
- Pair with icon_columns or bullet_list in the
  adjacent slot for context

Example:
{
  "type": "comparison_bars",
  "bars": [
    { "label": "Current Realization", "value": "50%", "percent": 50 },
    { "label": "Target Realization", "value": "65%", "percent": 65 }
  ],
  "callout": "+33% improvement",
  "accentColor": "teal"
}


=============================================================
CHANGE 5: ICON_COLUMNS CONNECTORS
=============================================================

FIGMA:
Open your icon_columns component.

Add a new property:
  Name: connectors
  Type: Boolean
  Default: false

When connectors = true:
  - Add a right-pointing arrow (→) between each
    column, vertically centered
  - Arrow color: #B0B0B0 (gray) or brand navy
  - Arrow sits in the gap between columns

When connectors = false:
  - No arrows, current behavior

SYSTEM PROMPT ADDITION:
icon_columns now accepts "connectors": true/false

Rules:
- Use connectors: true when the columns represent
  a sequence or progression (but you want more
  detail per stage than process_flow allows)
- Use connectors: false when columns are parallel
  categories with no implied order
- If the content is purely sequential with minimal
  detail per stage, prefer process_flow instead

Example:
{
  "type": "icon_columns",
  "connectors": true,
  "columns": [
    { "icon": "🔍", "header": "Diagnose", "headerColor": "navy", "items": ["Data collection", "Margin analysis", "Leakage identification"] },
    { "icon": "🏗️", "header": "Build", "headerColor": "teal", "items": ["Price model design", "Segmentation", "Governance framework"] },
    { "icon": "🚀", "header": "Execute", "headerColor": "orange", "items": ["Sales enablement", "Tool integration", "Change management"] }
  ]
}


=============================================================
PRIORITY ORDER
=============================================================

If you can only do a few of these, do them in
this order:

1. CHANGE 2 (highlighted column) — biggest bang,
   smallest effort. Solves the "one of these matters
   more" problem immediately.

2. CHANGE 1 (slot variant) — works across ALL
   layouts not just icon_columns. Gives Claude a
   universal way to create hierarchy.

3. CHANGE 3 (stat_hero size) — prevents stats from
   being too big in small slots and lets you put
   multiple stats on one slide without them competing.

4. CHANGE 4 (comparison_bars) — new component but
   covers a visual pattern that comes up constantly
   in pricing consulting (before/after, current vs
   target).

5. CHANGE 5 (connectors) — nice to have, adds
   visual flow, but lowest priority since
   process_flow already handles sequences.


=============================================================
UPDATED SYSTEM PROMPT RULES (ADD AFTER CHANGES)
=============================================================

VISUAL HIERARCHY RULES:

1. Every slide has a WINNER. Use these levers to
   make it visually dominant:
   - slot variant: "highlighted" on the winner slot
   - icon_columns: highlighted: true on winner column
   - stat_hero: size "large" for the main number
   - Layout selection: give winner the biggest slot

2. Every slide has SUPPORTING content. Use these
   levers to keep it secondary:
   - slot variant: "default" or "muted"
   - icon_columns: highlighted: false
   - stat_hero: size "medium" or "small"
   - Smaller slots in asymmetric layouts

3. Never highlight everything. If everything is
   highlighted, nothing is.

4. Component variety creates visual texture:
   - GOOD: icon_columns + stat_hero + comparison_bars
   - BAD: icon_columns + icon_columns + icon_columns
   - Use at least 2 different component types per slide

5. When in doubt about hierarchy, ask: "If the
   audience only remembers one thing from this slide,
   what is it?" That thing is the WINNER. Highlight it.