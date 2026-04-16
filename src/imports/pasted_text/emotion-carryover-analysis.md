Purpose:
Analyze how emotions from one trade influence the next trade. The goal is to help traders understand emotional carryover between trades and detect patterns such as revenge trading.

Important rule:
This analysis must operate at the day level.

If multiple trades occur within the same day, emotional transitions should be tracked between trades.

Example:
Trade 1 Post-Exit Emotion → Trade 2 Entry Emotion
Trade 2 Post-Exit Emotion → Trade 3 Entry Emotion

The system must also detect transitions across days:

Example:
Last trade yesterday (Post-Exit Emotion) → First trade today (Entry Emotion)

-------------------------------------

Chart 1 — Emotion Transition Heatmap

Chart type:
Heatmap matrix.

Rows:
Previous Trade Post-Exit Emotion.

Columns:
Next Trade Entry Emotion.

Each cell represents the number of occurrences where a previous emotion leads to the next trade's entry emotion.

Example emotions:
Calm
Confident
Fear
Anxiety
Greed
FOMO
Frustration
Relief
Regret

Color intensity represents frequency.

Darker color = higher number of transitions.

Tooltip must display:
Previous Emotion
Next Entry Emotion
Number of occurrences
Percentage of total transitions

Example tooltip:
Previous Emotion: Regret
Next Entry Emotion: FOMO
Occurrences: 6
Percentage: 32%

-------------------------------------

Insight Highlight

Above the heatmap, display a small insight card showing the most frequent emotional transition.

Example:
Most Common Emotional Transition
Frustration → Revenge (9 trades)

This helps traders quickly identify their strongest emotional pattern.

-------------------------------------

Chart 2 — Next Trade Performance After Emotion

Chart type:
Horizontal bar chart.

X-axis:
Average P&L of the next trade.

Y-axis:
Previous trade's post-exit emotion.

Bars should be colored:
Green for positive average P&L
Red for negative average P&L

Tooltip should display:
Previous emotion
Average next trade P&L
Number of trades analyzed

Example:
Previous Emotion: Regret
Next Trade Avg P&L: −₹420
Trades analyzed: 12

-------------------------------------

Revenge Trading Detection

Add a small insight card called:

Revenge Trading Indicator

Purpose:
Detect patterns where negative emotions lead to aggressive or impulsive next trades.

Possible trigger pattern:
Loss or negative post-exit emotion → FOMO / Revenge / Impulsive entry emotion in the next trade.

Example output:
Revenge Trading Detected
Frustration → Revenge Entry
Occurred in 8 trades.

This card should highlight the most common negative emotional carryover pattern.

-------------------------------------

Layout

Section Title:
Emotional Carryover Analysis

Layout order:

Top:
Insight cards
• Most Common Emotional Transition
• Revenge Trading Indicator

Middle:
Emotion Transition Heatmap (full width)

Bottom:
Next Trade Performance by Previous Emotion (horizontal bar chart)

-------------------------------------

Design Style

Dark trading dashboard theme
Minimal grid lines
Clear labels
Consistent emotion color mapping
Interactive tooltips
Responsive layout

-------------------------------------

Insight Goal

Help traders understand:

• How emotions from one trade affect the next trade
• Which emotional states trigger impulsive decisions
• Whether calm emotional states lead to more stable trading behaviour
• How emotional patterns evolve across trades within a day