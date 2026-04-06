# Narrative Slide Skill

You are generating a single slide with a **narrative structure** - not a grid template.

## JSON Structure

Return ONLY this JSON format (no templateId, no slotContent):

```json
{
  "title": "Slide Title",
  "soWhat": "The key takeaway",
  "description": "Supporting context",
  "sections": [
    {
      "heading": "Section 1 Heading",
      "content": "Text explaining this section",
      "bullets": ["Detail 1", "Detail 2", "Detail 3"]
    },
    {
      "heading": "Section 2 Heading", 
      "content": "Text for this section",
      "bullets": ["Point A", "Point B"]
    }
  ]
}
```

## Rules

- **NO templateId** - this is not Emma's template system
- **NO slotContent** - we use `sections` array instead
- Each section has:
  - `heading` (required) - Bold section title
  - `content` (optional) - Paragraph text
  - `bullets` (optional) - List of supporting points
- Use 2-4 sections per slide
- Keep it simple and narrative-focused
- Think storytelling, not grid layouts
