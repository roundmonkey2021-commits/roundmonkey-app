We are designing the next section of the Emotion Overview page.

Create a UI for Emotional Carryover Analysis, showing how emotions from one trade influence the next trade within the same day.

This screen should follow the same design style and structure as the existing Emotion Path Explorer (same cards, spacing, typography, and layout system).

Layout:

4 vertical columns:

Exit (Trade N)

Post-Exit (Trade N)

Entry (Trade N+1)

In-Trade (Trade N+1)

Each column contains emotion cards with:

Emotion name

Percentage (based on filtered transitions)

Trade count

Small horizontal progress bar

Data Context:

Show only within-day transitions

Exclude last trade of each day (no next trade)

Add small text at top:

“Showing emotional carryover within the same trading day”

“Transitions analyzed: XX”

Default State:

Show overall distribution of emotions across all 4 columns

Interaction (same as Emotion Path Explorer):

User can click any emotion in any column

On selection:

Highlight selected card

Filter all other columns based on conditional probabilities

Show:

Previous stage transitions (within same trade)

Next trade emotional outcomes

Insight Clarity Enhancements:

Add a top Insight Summary box:

“After [Emotion] at [Stage]:”

“Next trade most common entry: [Emotion + %]”

“Next trade behavior: [Emotion + %]”

Optional interpretation line

Highlight top 3 emotions in each column:

🥇 Most common

🥈 Second

🥉 Third

Emphasize dominant values:

Bold text or stronger color for highest %

Add Dominant Path indicator:

“Most common path: Fearful → Frustrated → Hesitant → Fearful”

Visual Behavior:

Fade non-relevant nodes when filtering

Maintain alignment across columns

Optional subtle connectors for dominant path

Design Style:

Clean, minimal dashboard UI

Card-based layout with rounded corners

Soft shadows and clear spacing

Consistent with existing Emotion Overview page

Do not change structure — ensure this feels like a natural extension of the Emotion Path Explorer, not a new component.