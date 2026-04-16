You are modifying an existing page called **"Emotional Overview"** in a trading psychology analytics dashboard.

Sections 1, 2, and 3 already exist.

**Section 4 already exists and should be replaced with the design below.**
Do not create a new section — update the existing Section 4. 

Purpose of Section 4:
Visualize how emotions evolve throughout the lifecycle of a trade.

This section should reveal emotional pathways across the stages:

Entry → In-Trade → Exit → Post-Exit.

---

Section Title

Emotion Transitions During Trades

Subtitle:
How emotional states evolve throughout the trade lifecycle.

---

Primary Visualization

Create a **Sankey diagram** representing emotion transitions across trade stages.

Stages should appear in the following order from left to right:

Entry
In-Trade
Exit
Post-Exit

Each node represents an emotion recorded at that stage.

Each connection represents the number of trades that followed that emotional transition.

The width of each connection should represent the number of trades following that emotional pathway.

Example flow:

Entry: Confident
→ In-Trade: Calm
→ Exit: Patient
→ Post-Exit: Satisfied

---

Node Labels

Each node should display:

Emotion name
Number of trades

Example:

Entry: Greedy (28)
In-Trade: Calm (20)

---

Hover Tooltip for Connections

Hovering over a connection should display:

Entry Emotion
In-Trade Emotion
Exit Emotion
Post-Exit Emotion

Number of trades
Win rate
Average P&L
Average points captured

Example tooltip:

Entry: Greedy
In-Trade: Anxious
Exit: Panic
Post-Exit: Regret

Trades: 12
Win Rate: 33%
Avg P&L: -₹540
Avg Points: -8

---

Filters Above the Chart

Add filter controls above the Sankey diagram:

All Trades
Winning Trades
Losing Trades

These filters should update the Sankey visualization dynamically.

---

Flow Visibility Control

Add an additional control:

Show Top Flows
Show All Flows

Top flows should display the most frequent emotional pathways to improve readability.

---

Color Logic

Connection colors should reflect trade outcomes:

Profitable pathways → green tones
Losing pathways → red tones

If outcome-based coloring is not available initially, use neutral colors but keep the design ready for future outcome-based coloring.

Emotion nodes should later support color mapping from the global **Emotion Settings** configuration.

---

Design Style

Use the same dark trading dashboard theme used throughout the Emotional Overview page.

Ensure:

Smooth curved Sankey connections
Readable node spacing
Clear stage separation
Subtle transitions between nodes

The diagram should remain readable even when many emotional transitions are present.

---

Goal

Help traders understand:

How emotional states evolve during a trade.
Which emotional journeys lead to profitable outcomes.
Which emotional pathways frequently result in losses.

The Sankey diagram should make emotional trading patterns visually discoverable.
