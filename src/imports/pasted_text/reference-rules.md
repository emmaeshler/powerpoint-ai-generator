=============================================================
REFERENCE SLIDE COMPOSITION RULES
=============================================================

These rules pair with the visual reference thumbnails in the
AI panel. Each reference has an INTENT LABEL, a LAYOUT
mapping, a COMPOSITION RULE for how to fill the slots, and
WHEN TO USE guidance including keywords and anti-patterns.

=============================================================
REFERENCE 1: PROCESS FLOW
=============================================================

INTENT: "Here's How It Works in Sequence"

LAYOUT: full

COMPOSITION RULE:
- main slot → process_flow (3-5 stages with arrows)
- Each stage gets a label, optional timeframe,
  and 2-4 bullet items underneath
- callout_bar → Optional. One sentence summarizing
  the end outcome of the full process

WHEN TO USE:
User describes steps, phases, stages, or a journey
from point A to point B.
Keywords: "process," "steps," "phases," "how we do it,"
"workflow," "journey," "rollout plan,"
"first...then...finally"

ANTI-PATTERN:
If the items are not sequential and don't depend on
each other → use Three Column instead.

=============================================================
REFERENCE 2: THREE COLUMN
=============================================================

INTENT: "These Are Different but Equal"

LAYOUT: three-equal

COMPOSITION RULE:
- left, center, right → icon_columns (one column each)
  OR bullet_list in each slot
- Each column gets an icon, a header, and 3-4 bullets
- All three columns should feel visually balanced —
  same number of bullets, same level of detail
- No column should dominate. If one matters more,
  this is the WRONG reference — use Direction + Proof
- callout_bar → Optional. Ties the three together
  with one unifying statement

WHEN TO USE:
User has exactly three parallel ideas, categories,
or pillars that are equally weighted.
Keywords: "three pillars," "three areas," "three types,"
"our capabilities," "we do three things"

ANTI-PATTERN:
If the user says "but X is the most important" or
"X is where we focus" → DO NOT use this layout.
Use Direction + Proof instead.

=============================================================
REFERENCE 3: DIRECTION + PROOF
=============================================================

INTENT: "One of These Matters More Than the Others"

LAYOUT: hero-left-stack-right

COMPOSITION RULE:
- hero slot (left, 7 cols) → The WINNER. Use
  icon_columns showing all options (2-3) but visually
  emphasize the dominant one with orange headerColor.
  The others stay navy. OR use a chart or process_flow
  if the winner is best shown that way.
- right_top slot → stat_hero with the proof point
  number. This is the undeniable "so what" — the one
  number that makes the case. Use orange or teal
  accentColor.
- right_bottom slot → text_block or bullet_list with
  supporting context, explanation, or secondary proof.
- callout_bar → One sentence takeaway reinforcing
  the winner. Should feel like the sentence you'd
  remember walking out of the room.

WHEN TO USE:
User mentions 2-3 things but clearly emphasizes one.
There is a hierarchy — not everything is equal.
Keywords: "focus," "biggest impact," "where we win,"
"most important," "drives results," "this is where,"
"the key is," "but execution is what matters"

ANTI-PATTERN:
If all items are truly equal with no hierarchy →
use Three Column instead.

=============================================================
REFERENCE 4: FEATURE MATRIX
=============================================================

INTENT: "Here's How Things Compare Across Dimensions"

LAYOUT: full

COMPOSITION RULE:
- main slot → data_table
- rowLabels = the features, criteria, or dimensions
  being compared
- columns = the options, tiers, products, or
  competitors being evaluated
- Use highlight on the recommended or winning column
- Keep cells concise — checkmarks, yes/no,
  high/med/low, or short phrases. Not sentences.
- callout_bar → Optional. States which option wins
  and why in one sentence.

WHEN TO USE:
User needs to evaluate multiple options against
multiple criteria. The audience needs to see the
full picture in a grid.
Keywords: "compare," "features," "which option,"
"tiers," "plans," "vs," "criteria," "evaluate,"
"trade-offs," "pros and cons across"

ANTI-PATTERN:
If there are only two things to compare with no
shared dimensions → use Two Column (two-equal)
with text_block in each slot instead.

=============================================================
REFERENCE 5: TABLE + CHART
=============================================================

INTENT: "Here's the Evidence"

LAYOUT: wide-left OR hero-left-stack-right

COMPOSITION RULE (wide-left):
- main slot (8 cols) → chart (bar or line) showing
  the primary data visualization. This is the visual
  proof — the thing the eye goes to first.
- sidebar slot (4 cols) → bullet_list or kpi_cards
  with context, key takeaways, or supporting metrics
  that explain what the chart means.
- callout_bar → Optional. The "so what" of the data
  in one sentence.

COMPOSITION RULE (hero-left-stack-right, alternate):
- hero slot → chart as the dominant visual
- right_top → stat_hero pulling out the single most
  important number from the chart
- right_bottom → bullet_list with 2-3 takeaways

WHEN TO USE:
User has data to visualize and needs context around
it. The slide needs to both SHOW and EXPLAIN.
Keywords: "data," "chart," "graph," "trend," "growth,"
"revenue," "performance," "results," "metrics,"
"show the numbers," "prove," "evidence"

ANTI-PATTERN:
If the user just wants a big number with no chart →
use full + stat_hero instead.
If the user wants multiple charts side by side →
use quad layout.

=============================================================
REFERENCE 6: PRIORITIZATION MATRIX
=============================================================

INTENT: "Here's What to Do First and Why"

LAYOUT: two-equal

COMPOSITION RULE:
- left slot (6 cols) → data_table listing all the
  items being prioritized. Columns should include:
  a numbered label, description, and the two
  dimensions being evaluated (e.g., Impact Potential
  and Estimated Effort, or Value and Feasibility).
  Keep dimension values simple: high / moderate / low.
  Number each row (1, 2, 3...) so they can be
  referenced on the plot.
- right slot (6 cols) → chart (bar type as proxy)
  OR text_block describing the 2x2 quadrant plot.
  Since a true scatter/quadrant plot is not a native
  component, approximate with a text_block that
  describes the four quadrants and where each
  numbered item falls:
    - Top-left quadrant label (e.g., "Additional
      Investment" — high effort, low impact)
    - Top-right quadrant label (e.g., "Strategic
      Priorities" — high effort, high impact)
    - Bottom-left quadrant label (e.g., "Just Go Do"
      — low effort, low impact)
    - Bottom-right quadrant label (e.g., implied
      quick wins — low effort, high impact)
  Reference items by their number from the table.
- callout_bar → One sentence stating the
  prioritization takeaway (e.g., "Focus on items
  1 and 3 for highest impact with lowest effort")

WHEN TO USE:
User has a list of options, initiatives, features,
or investments and needs to prioritize them based
on two dimensions (typically impact vs effort,
value vs feasibility, urgency vs importance).
Keywords: "prioritize," "rank," "what should we do
first," "effort vs impact," "trade-offs," "backlog,"
"roadmap decisions," "where to invest," "quick wins
vs long-term," "matrix"

ANTI-PATTERN:
If the user just wants a ranked list with no
two-dimensional evaluation → use full + bullet_list
with items ordered by priority.
If the user wants a detailed comparison of features
across options → use Feature Matrix instead.

=============================================================
LAYOUT SELECTION OVERRIDE RULES
=============================================================

These rules take precedence over the default
section-counting logic:

1. If the user emphasizes ONE thing over others
   → hero-left-stack-right or hero-right-stack-left
   NEVER three-equal

2. If the user says "compare" or "vs"
   → two-equal or data_table
   NEVER icon_columns

3. If the user describes a sequence
   → process_flow or timeline_track
   NEVER bullet_list

4. If the user provides numbers with a clear winner
   → stat_hero for the winner number
   NEVER bury it in a bullet point

5. If the user mentions "prioritize" or "effort vs
   impact"
   → Prioritization Matrix pattern
   NEVER a simple list

6. If the user says "dashboard" or asks for multiple
   metrics at once
   → quad layout
   NEVER cram everything into full

=============================================================
NARRATIVE STRUCTURE RULE
=============================================================

EVERY slide must have three narrative parts:

1. DIRECTION — What is the point of this slide?
   → Lives in the title as the "So What | description"
   → Must be an insight or claim, NOT a topic label
   → BAD: "Our Three Capabilities"
   → GOOD: "Price Execution Drives the Highest Client
   Impact | Three capabilities work together but
   execution is where margin is won or lost"

2. WINNER — What is the dominant visual element?
   → This is the single component the eye should go
   to first
   → It gets the largest slot (hero, main, or the
   visually heaviest component type like stat_hero
   or chart)
   → If everything feels equal, you haven't found
   the winner yet — re-read the prompt

3. PROOF — What supports the winner?
   → Lives in secondary slots (sidebar, stacked
   panels, smaller columns)
   → Uses supporting component types (bullet_list,
   text_block, kpi_cards)
   → callout_bar is the final proof — the sentence
   the audience remembers

WHEN COMPOSING ANY SLIDE:
- Identify the WINNER first
- Place the WINNER in the dominant slot
- Fill supporting slots with PROOF
- Write the DIRECTION as a "So What" title
- If the prompt has no clear winner, ASK the user
  what matters most before generating