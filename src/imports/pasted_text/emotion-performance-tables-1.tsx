Sections 1 and 2 already exist.

**Section 3 already exists and should be replaced with the design below.**
Do not create a new section — update the current Section 3.

Purpose of Section 3:
Analyze how different emotional states influence trading performance.

Section title:
Emotion Impact on Performance

Subtitle:
How emotional states affect trade outcomes.

---

Layout

Create four tables arranged in a **2 × 2 grid layout**.

Top row:
Entry Emotion Performance
In-Trade Emotion Performance

Bottom row:
Exit Emotion Performance
Post-Exit Emotion Performance

Each table analyzes only the emotions recorded for that specific stage of the trade.

---

Table Columns

Each table should contain the following columns:

Emotion
Trades
Win Rate
Avg Points (Net)
Avg Points (Winning Trades)
Avg Points (Losing Trades)
Avg P&L
Expectancy

---

Column Definitions

Emotion
Name of the recorded emotion.

Trades
Number of trades where this emotion occurred.

Win Rate
Percentage of winning trades when this emotion was recorded.

Avg Points (Net)
Average points captured across all trades with this emotion.

Avg Points (Winning Trades)
Average points captured on winning trades.

Avg Points (Losing Trades)
Average points lost on losing trades.

Avg P&L
Average profit or loss in currency terms.

Expectancy
Expected profit per trade based on win rate and average win/loss.

---

Sorting

All columns must support sorting.

Users should be able to sort tables by:

Trades
Win Rate
Avg Points (Net)
Avg P&L
Expectancy

Default sorting should be by **Expectancy (highest to lowest)**.

---

Visual Enhancements

Add **mini performance bars** inside the Avg Points (Net) column.

Example:

+16 █████████
+8  ████
-5  ██

Bars should visually represent the magnitude of the value.

Positive values should appear green.
Negative values should appear red.

---

Best and Worst Indicators

Add indicators showing best and worst values.

Example:

Highest expectancy → ▲ indicator
Lowest expectancy → ▼ indicator

This allows users to quickly identify the best and worst performing emotions.

---

Low Sample Indicator

Do not filter emotions based on trade count.

Instead, if the number of trades is low (for example fewer than 5), display a **small warning indicator next to the trade count**.

Example:

3 ⚠

Tooltip text:

"Low sample size. Metrics may change as more trades are recorded."

---

Tooltip Information

Hovering over metric headers should show explanations.

Example tooltip for Expectancy:

Average profit expected per trade
= (Win Rate × Avg Win) − (Loss Rate × Avg Loss)

Example tooltip for Avg Points:

Average number of points captured per trade.

---

Design Style

Use the same dark trading dashboard theme used throughout the Emotional Overview page.

Tables should have:

Clean minimal design
Subtle row separators
Readable column alignment
Responsive layout for different screen sizes

---

Goal

Allow traders to quickly identify:

Which emotional states produce the best trading outcomes.

Which emotions lead to poor trade execution.

How emotional states influence profitability and consistency.
