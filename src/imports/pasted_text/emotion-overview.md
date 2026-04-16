Create the "Emotion Overview" section in emotional over view Page

This section replaces the existing Step 1 of the Emotion overviewa page.

Purpose:
Provide a quick high-level snapshot of the trader's emotional behavior and its relationship to trading performance.

The section should be compact, easy to scan, and expandable to reveal deeper insights.

-------------------------------------

Section Title
Emotion Overview

-------------------------------------

Layout

Display three KPI cards in a horizontal row.

Cards:
1. Most Frequent Emotion
2. Best Performing Emotion
3. Worst Performing Emotion

Each card should support an expandable interaction using a chevron or accordion style.

Collapsed state shows a summary.
Expanded state shows a breakdown by trading stage.

Stages:
Entry
In-Trade
Exit
Post-Exit

-------------------------------------

Card 1 — Most Frequent Emotion

Collapsed view should show:
Emotion name
Total occurrences across all trades

Example:
Most Frequent Emotion
Calm
78 trades

Expanded view should show the most frequent emotion at each stage.

Example:
Most Frequent Entry Emotion → Confident (42 trades)
Most Frequent In-Trade Emotion → Anxiety (31 trades)
Most Frequent Exit Emotion → Relief (28 trades)
Most Frequent Post-Exit Emotion → Satisfaction (34 trades)

Purpose:
Help traders understand which emotions dominate each stage of trading.

-------------------------------------

Card 2 — Best Performing Emotion

Definition:
Emotion with the highest average performance.

Performance should be calculated using:
Average P&L
Average Points Captured
Trade Count

Collapsed view example:
Best Performing Emotion
Calm
Avg P&L +₹720
Avg Points +18

Expanded view should display the best emotion for each stage.

Example:

Best Entry Emotion
Calm
Avg P&L +₹650 | Avg Points +16 | 18 trades

Best In-Trade Emotion
Focused
Avg P&L +₹720 | Avg Points +18 | 15 trades

Best Exit Emotion
Patient
Avg P&L +₹540 | Avg Points +14 | 12 trades

Best Post-Exit Emotion
Reflective
Avg P&L +₹610 | Avg Points +15 | 10 trades

Purpose:
Reveal emotional states associated with profitable behavior.

-------------------------------------

Card 3 — Worst Performing Emotion

Definition:
Emotion with the lowest average performance.

Collapsed view example:
Worst Performing Emotion
Fear
Avg P&L −₹540
Avg Points −7

Expanded view example:

Worst Entry Emotion
FOMO
Avg P&L −₹620 | Avg Points −8 | 14 trades

Worst In-Trade Emotion
Panic
Avg P&L −₹580 | Avg Points −6 | 11 trades

Worst Exit Emotion
Impulsive
Avg P&L −₹430 | Avg Points −5 | 9 trades

Worst Post-Exit Emotion
Regret
Avg P&L −₹470 | Avg Points −6 | 10 trades

Purpose:
Identify emotional states that negatively impact trading performance.

-------------------------------------

Interaction Design

Cards should support expand and collapse behavior using a chevron or accordion pattern.

Collapsed:
▶ Card title

Expanded:
▼ Card title
Stage breakdown items appear below.

-------------------------------------

Data Integrity Rule

Stage-level metrics should only display when the number of trades for that emotion is at least 5.

If fewer than 5 trades exist, display:
"Insufficient data".

-------------------------------------

Design Style

Dark trading dashboard theme
Clean minimal card design
Large emotion label text
Smaller secondary metrics
Subtle icons for emotional states
Soft card shadows
Responsive layout