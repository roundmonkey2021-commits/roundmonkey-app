Create the "Emotion Overview" section on emotional   overview page .

This section replaces Step 1 of the emotional   overview page page.

Purpose:
Provide a quick snapshot of emotional behavior across the four stages of a trade and how those emotions correlate with trading performance.

-------------------------------------

Section Title
Emotion Overview

-------------------------------------

Layout

Display three KPI cards horizontally.

Cards:

1. Most Frequent Emotion
2. Best Performing Emotion
3. Worst Performing Emotion

Each card should have a clean analytics-style layout and contain stage-based rows.

Trade stages should always appear in this order:

Entry
In-Trade
Exit
Post-Exit

-------------------------------------

Card 1 — Most Frequent Emotion

Important rule:
Do NOT display a single global emotion at the top.

Instead show the most frequent emotion separately for each stage.

Display rows in this format:

Entry        Emotion Name        Trade Count
In-Trade     Emotion Name        Trade Count
Exit         Emotion Name        Trade Count
Post-Exit    Emotion Name        Trade Count

Example:

Entry        Greedy        28 trades
In-Trade     Anxious       23 trades
Exit         Confident     28 trades
Post-Exit    Fearful       24 trades

-------------------------------------

Card 2 — Best Performing Emotion

Definition:
Emotion with the highest average performance.

Performance metrics must include:

Average P&L
Average Points Captured
Trade Count

Only emotions with at least 5 trades should be considered.

If fewer than 5 trades exist for an emotion, exclude it from ranking.

Row format:

Stage        Emotion        Avg P&L | Avg Points | Trade Count

Example:

Entry        Greedy        Avg P&L +365 | Avg Points +0.0 | 28 trades
In-Trade     Calm          Avg P&L +584 | Avg Points +0.0 | 20 trades
Exit         Anxious       Avg P&L +568 | Avg Points +0.0 | 19 trades
Post-Exit    Reflective    Avg P&L +1623 | Avg Points +0.0 | 20 trades

-------------------------------------

Card 3 — Worst Performing Emotion

Definition:
Emotion with the lowest average performance.

Apply the same minimum trade rule:

Only emotions with at least 5 trades should be considered.

Row format:

Stage        Emotion        Avg P&L | Avg Points | Trade Count

Example:

Entry        Calm          Avg P&L -700 | Avg Points 0.0 | 10 trades
In-Trade     Greedy        Avg P&L -836 | Avg Points 0.0 | 20 trades
Exit         Fearful       Avg P&L -1117 | Avg Points 0.0 | 21 trades
Post-Exit    Fearful       Avg P&L -756 | Avg Points 0.0 | 24 trades

-------------------------------------

Design Rules

Use a dark trading dashboard theme.

Emotion name should be bold and prominent.

Stage labels should use lighter text color.

Align the rows in a clean table-like structure for easy scanning.

Add subtle separators between rows.

-------------------------------------

Color Logic

Positive Avg P&L → green
Negative Avg P&L → red

-------------------------------------

Tooltip

Hover tooltip for Best/Worst cards should explain:

"Only emotions with at least 5 trades are included."

-------------------------------------

Goal

Allow traders to quickly see:

Which emotions dominate each stage of trading.
Which emotions correlate with profitable behavior.
Which emotions correlate with losses.