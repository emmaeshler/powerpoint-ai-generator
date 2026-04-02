# Will's Slide Design System (PRICE-FOR-PROFIT)

**IMPORTANT:** This is a browser-based slide preview app. You MUST return JSON, not PptxGenJS code.

## Brand Identity: INSIGHT/PFP Theme

### Color Palette
- **Primary:** `00446A` (dark blue) - titles, headers, section bands
- **Accent:** `E56910` (orange) - highlights, callouts, arrows
- **Text Dark:** `25282A` (near-black) - body text
- **Text Mid:** `4A6070` (medium) - secondary text  
- **Text Light:** `7A95A5` (light gray) - tertiary text
- **Dark Navy:** `051C2C` (darkest) - dark backgrounds
- **Off White:** `F3F4F4` (light gray) - backgrounds
- **Gray:** `75787B` - muted elements
- **Green:** `339966` - success/positive
- **Red:** `CB333B` - error/warning
- **White:** `FFFFFF` - clean backgrounds

### Typography
- **Primary Font:** Arial Narrow
- **Body Text:** 13pt (target), 11pt (dense fallback, never below)
- **Tables:** 11-13pt adaptive
- **Subtitle:** 13pt minimum
- **Max Sizes:** body 14pt, labels 14pt, stats/callouts 36pt

## Core Design Rules

### R1. One Idea Per Slide
Each slide has ONE takeaway. If content splits into "overview" and "detail," that's two slides.

### R2. Hierarchy & Visual Flow
- What the eye sees: title → main visual → detail
- Plan before coding: How many columns/panels? What's the primary flow? Which color dominates?

### R3. Color Consistency
- Each color gets ONE semantic role per slide
- Adjacent panels use distinct accent colors
- No random color rotation - every color must encode meaning

### R4. Icon Usage
- Cover-the-label test: Can someone guess what the icon represents without the label?
- Icons should fill 30-40% of their container
- If two icons could be swapped without notice, drop both

### R5. Semantic Content
- Process flows get 8-15 word descriptors (not just bare labels)
- Bullets are last resort: max 4 per block, max 10 words each, max 2 blocks per slide

### R6. Spacing & Alignment
- Body text: 1.2-1.35x line spacing
- Fill available space - don't leave whitespace when content fits larger
- Consistent padding between elements

## JSON Output Format

Return slides as JSON with this structure:

```json
{
  "title": "Main slide title",
  "subtitle": "Optional subtitle or context",
  "theme": "insight",
  "layout": "panels" | "flow" | "table" | "mixed",
  "sections": [
    {
      "type": "panel" | "flow" | "table" | "text",
      "header": "Section header",
      "accentColor": "00446A" | "E56910" | "339966",
      "content": {
        // Panel type
        "icon": "📊",
        "title": "Panel title",
        "description": "Panel content..."
      } | {
        // Flow type
        "steps": [
          { "label": "Step 1", "description": "8-15 word description", "icon": "🔍" }
        ]
      } | {
        // Table type
        "headers": ["Column 1", "Column 2"],
        "rows": [
          ["Data A", "Data B"]
        ]
      }
    }
  ]
}
```

## Key Differences from Emma's System

- **Color palette:** Navy/orange vs Emma's teal/orange
- **Typography:** Arial Narrow vs Emma's system
- **Design philosophy:** Structured panels and flows vs Emma's slot-based templates
- **Visual weight:** More emphasis on icons and color coding

## Adaptation for Browser App

Since you're generating JSON (not .pptx files):
- Use the color palette and design rules above
- Return structured JSON that can be rendered by the browser
- Focus on semantic content (what goes where) not pixel-perfect coordinates
- Let the browser handle actual rendering
