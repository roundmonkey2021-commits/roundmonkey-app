You are modifying an existing page called **"Emotional Overview"** in a trading psychology analytics dashboard.

Sections 1–3 already exist.
Section 4 already exists and contains a Sankey diagram showing emotional transitions during trades.

Do not create a new section.
**Update the existing Sankey visualization to improve readability and interaction.**

---

Section Title

Emotion Transitions During Trades

Subtitle:
How emotional states evolve throughout the trade lifecycle.

---

Chart Structure (Keep Existing)

The Sankey diagram must continue to represent emotion transitions across four stages:

Entry → In-Trade → Exit → Post-Exit

Each node represents an emotion recorded at that stage.

Each link represents trades that followed that emotional transition.

Link width must remain proportional to the number of trades following that pathway.

---

New Interaction Behavior

Node-Based Path Highlighting

When a user hovers or clicks on a node (for example: Entry: Greedy), the chart should:

• Highlight **all emotional pathways that originate from that node**
• Propagate the highlight across all downstream stages
• Dim all unrelated flows to low opacity (around 20–30%)

The highlighted flows should appear visually like **branching arteries** originating from the selected emotion.

Example behavior:

Selecting **Entry: Greedy** should highlight all flows starting from Greedy and continuing across In-Trade, Exit, and Post-Exit nodes.

---

Flow Hover Highlight

When hovering a specific link:

• Highlight the entire emotional path across stages
• Dim all unrelated flows

This allows users to trace a full emotional journey across the trade lifecycle.

---

Click-to-Lock Interaction

Clicking a node should lock the highlight until the user clicks elsewhere.

This allows deeper exploration of emotional pathways.

---

Tooltip Behavior

The tooltip should not obstruct the Sankey flows.

Instead:

• Display the tooltip slightly offset from the cursor
OR
• Display details in a side information panel on the right side of the chart.

Tooltip content should include:

Entry Emotion
In-Trade Emotion
Exit Emotion
Post-Exit Emotion

Trades
Win Rate
Average P&L
Average Points Captured

Example tooltip:

Entry: Greedy
In-Trade: Calm
Exit: Confident
Post-Exit: Calm

Trades: 3
Win Rate: 100%
Avg P&L: ₹1,583
Avg Points: 13.3

---

Flow Coloring

Current flow coloring based on entry nodes should be removed.

Instead:

• Default flows should appear in a **neutral light gray tone**
• Highlighted flows should appear in a **bright accent color**
• Dimmed flows should appear with reduced opacity

This improves readability and prevents visual clutter.

The system should remain compatible with future emotion color mapping from the Emotion Settings page.

---

Node Labels

Each node should display:

Emotion name
Number of trades

Example:

Entry: Greedy (7)
In-Trade: Calm (9)

---

Flow Visibility Controls

Replace the existing flow filters with the following options:

All Trades
Winning Trades
Losing Trades
Top Winning Flows
Top Losing Flows

Definitions:

Winning Trades
Trades where total points captured > 0

Losing Trades
Trades where total points captured < 0

Top Winning Flows
Show emotional pathways ranked by **highest total points captured**

Top Losing Flows
Show emotional pathways ranked by **lowest total points captured**

---

Top Flow Logic

Top flow views should show the most impactful emotional pathways to improve readability.

Example:

Top Winning Flows
Display the emotional paths that generated the highest total points.

Top Losing Flows
Display the emotional paths that lost the most points.

This helps traders quickly identify emotional journeys associated with success or failure.

---

Flow Scaling

Flow thickness should scale strongly with trade count so dominant emotional pathways appear visually like **highways**, while minor paths remain thinner.

---

Design Style

Use the same dark trading dashboard theme used throughout the Emotional Overview page.

Ensure:

Smooth curved Sankey links
Clear stage spacing between Entry, In-Trade, Exit, and Post-Exit
Minimal visual clutter
Readable emotional pathways

---

Goal

Make emotional journeys easier to understand by allowing traders to:

• Trace how emotions evolve within a trade
• Identify dominant emotional pathways
• Discover emotional sequences that produce the best or worst trading outcomes
