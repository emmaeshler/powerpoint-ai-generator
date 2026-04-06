# Clarification Questions Skill

**Capability**: Interactive Follow-up Questions  
**Use Case**: When user requests are ambiguous or lack critical information

---

## When to Use This Skill

⚠️ **CRITICAL**: If the prompt is vague or ambiguous, REQUEST CLARIFICATION instead of guessing. Users often don't know exactly what they want — your job is to ask the right questions to understand their intent.

---

## Requesting Clarifications

When the user's request is ambiguous or lacks critical information, you should REQUEST CLARIFICATION instead of guessing.

To request clarification, respond with a JSON object containing a "clarifications" array:

```json
{
  "clarifications": [
    {
      "question": "What time period should the chart cover?",
      "type": "choice",
      "options": ["Q1-Q4 2023", "Monthly for 2023", "Quarterly for last 3 years"],
      "required": true
    },
    {
      "question": "What unit should the Y-axis use?",
      "type": "choice",
      "options": ["Dollars ($)", "Thousands ($K)", "Millions ($M)", "Percentage (%)"],
      "required": true
    },
    {
      "question": "Any specific callouts or annotations needed?",
      "type": "text",
      "required": false
    }
  ]
}
```

---

## When to Request Clarification

### 1. Missing Critical Data
- Chart requested but no values or time periods given
- Process flow mentioned but number of stages unclear
- Comparison requested but unclear what's being compared

**Examples:**
- ❌ "Show our growth" → ✅ Ask: revenue growth? customer growth? market share growth?
- ❌ "Compare options" → ✅ Ask: what options? how many? what criteria?
- ❌ "Timeline of events" → ✅ Ask: what timeframe? which events?

### 2. Ambiguous Requirements
- Multiple valid interpretations exist
- Structure is unclear (2-column vs 3-column?)
- Hierarchy isn't obvious (what's the main point?)

**Examples:**
- ❌ "Our 3 strategic pillars" → ✅ Ask: Equal emphasis or is one primary?
- ❌ "Customer journey" → ✅ Ask: How many stages? What touchpoints matter most?
- ❌ "Competitive landscape" → ✅ Ask: How many competitors? What dimensions to compare?

### 3. Structural Uncertainty
- Number of items/sections unclear
- Layout preference not specified
- Visual hierarchy ambiguous

**Examples:**
- ❌ "Show enablement process" → ✅ Ask: How many steps? What are they?
- ❌ "Compare pricing tiers" → ✅ Ask: How many tiers? What features to highlight?

---

## Clarification Question Types

### `choice` - Single Selection
User picks ONE option from a list.

```json
{
  "question": "What time period?",
  "type": "choice",
  "options": ["Q1 2024", "H1 2024", "Full Year 2024"],
  "required": true
}
```

### `multiChoice` - Multiple Selections
User can pick MULTIPLE options.

```json
{
  "question": "Which metrics should we include?",
  "type": "multiChoice",
  "options": ["Revenue", "Profit Margin", "Customer Count", "Retention Rate"],
  "required": true
}
```

### `text` - Free-form Input
User types their own answer.

```json
{
  "question": "Any specific callouts or insights to highlight?",
  "type": "text",
  "required": false
}
```

---

## Best Practices

### Ask 2-4 Targeted Questions Maximum
- Don't overwhelm with too many questions
- Focus on the most critical uncertainties
- Combine related questions when possible

### Provide Specific Options When Possible
✅ Good: `["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024"]`  
❌ Bad: `"What time period?"` (with text input)

Options make it easier and faster for users to answer.

### Mark Required vs Optional Clearly
```json
{
  "question": "What's the primary metric?",
  "required": true  // User MUST answer
}

{
  "question": "Any additional notes?",
  "required": false  // User can skip
}
```

### Explain Why When Not Obvious
```json
{
  "question": "Should this be percentage or absolute numbers? (This affects whether we show 5% or $2M)",
  "type": "choice",
  "options": ["Percentage (%)", "Absolute ($)"],
  "required": true
}
```

---

## Clarification Threshold

**When in doubt, ASK.**  
Better to spend 30 seconds getting clarity than to generate a slide that misses the point.

### REQUEST CLARIFICATION if:
- ✅ The prompt is vague about structure ("show our process" - how many steps? what are they?)
- ✅ Multiple interpretations are equally valid ("enablement through 3 steps" - are the steps the focus or the outcomes?)
- ✅ You're uncertain about the WINNER (what's the dominant message?)
- ✅ Missing concrete details (values, timeframes, specific labels)
- ✅ The relationship between concepts isn't clear

### You CAN Proceed Without Clarification if:
- ✅ The prompt explicitly defines structure, content, and hierarchy
- ✅ There's clearly ONE dominant interpretation
- ✅ You have enough detail to identify the WINNER with confidence

---

## Response Format

### When Requesting Clarification
Return ONLY the clarifications JSON - no slide, no other text:

```json
{
  "clarifications": [
    {
      "question": "...",
      "type": "choice",
      "options": ["...", "..."],
      "required": true
    }
  ]
}
```

### After User Answers
The system will send your original prompt back with:
```
CLARIFICATIONS PROVIDED:
- Question 1: Answer 1
- Question 2: Answer 2

Please regenerate the slide(s) with these clarifications in mind.
```

Now generate the slide normally using the enriched prompt.

---

## Examples

### Example 1: Vague Chart Request
**User Prompt**: "Show our sales performance"

**Your Response**:
```json
{
  "clarifications": [
    {
      "question": "What time period should the chart cover?",
      "type": "choice",
      "options": ["Last Quarter", "Last 6 Months", "Full Year", "Year-over-Year"],
      "required": true
    },
    {
      "question": "What metric(s) should we show?",
      "type": "multiChoice",
      "options": ["Revenue", "Units Sold", "Average Deal Size", "Win Rate"],
      "required": true
    },
    {
      "question": "Any specific trend or insight to highlight?",
      "type": "text",
      "required": false
    }
  ]
}
```

### Example 2: Ambiguous Process
**User Prompt**: "Show our customer onboarding process"

**Your Response**:
```json
{
  "clarifications": [
    {
      "question": "How many stages are in the onboarding process?",
      "type": "choice",
      "options": ["3 stages", "4 stages", "5 stages", "6+ stages"],
      "required": true
    },
    {
      "question": "What should each stage be called?",
      "type": "text",
      "required": true
    },
    {
      "question": "Should we emphasize timeline/duration?",
      "type": "choice",
      "options": ["Yes - show how long each stage takes", "No - just show the flow"],
      "required": false
    }
  ]
}
```

### Example 3: Comparison Uncertainty
**User Prompt**: "Compare our product tiers"

**Your Response**:
```json
{
  "clarifications": [
    {
      "question": "How many pricing tiers do you have?",
      "type": "choice",
      "options": ["2 tiers", "3 tiers", "4 tiers", "5+ tiers"],
      "required": true
    },
    {
      "question": "What are the tier names?",
      "type": "text",
      "required": true
    },
    {
      "question": "Which features should we highlight in the comparison?",
      "type": "multiChoice",
      "options": ["Storage", "Users", "Support", "Integrations", "Custom Features"],
      "required": true
    },
    {
      "question": "Is there a 'recommended' or 'most popular' tier?",
      "type": "choice",
      "options": ["Yes - highlight the middle tier", "Yes - highlight the premium tier", "No - treat all equally"],
      "required": false
    }
  ]
}
```

---

## Integration Notes

This skill works seamlessly with the app's clarification modal UI:
- Multi-step wizard for answering questions
- Progress bar showing completion
- Back/Next navigation
- Required vs optional indicators
- The enriched prompt is automatically sent back for regeneration

**No code changes needed** - just include this skill in your selected skills and the system will handle the rest.
