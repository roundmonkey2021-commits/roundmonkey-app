Create a trading performance visualization with two synchronized charts.

The charts must share the same X-axis timeline so traders can easily relate equity growth with drawdowns.

-------------------------------------

SECTION 1 — Equity Curve

Chart Type:
Line Chart

Purpose:
Show cumulative profit and loss growth over time.

Data Logic:

Input data contains trade P&L values.

Example:

[
 {date:"01 Jan", pnl: 2000},
 {date:"02 Jan", pnl: -500},
 {date:"03 Jan", pnl: 1500},
 {date:"04 Jan", pnl: -1000}
]

Convert to cumulative equity:

[
 {date:"01 Jan", equity: 2000},
 {date:"02 Jan", equity: 1500},
 {date:"03 Jan", equity: 3000},
 {date:"04 Jan", equity: 2000}
]

Chart requirements:

X-axis → Date or Trade Number  
Y-axis → Equity (₹)

Visual Style:

• Smooth line chart
• Green line
• Small data point markers
• Light grid lines
• Tooltip showing:
  - Date
  - Daily P&L
  - Cumulative equity

-------------------------------------

SECTION 2 — Drawdown Chart (Underwater Chart)

Chart Type:
Area Chart below zero

Purpose:
Show how far equity falls below its previous peak.

Drawdown Formula:

drawdown = equity - max_equity_so_far

Example:

[
 {date:"01 Jan", equity:2000, drawdown:0},
 {date:"02 Jan", equity:1500, drawdown:-500},
 {date:"03 Jan", equity:3000, drawdown:0},
 {date:"04 Jan", equity:2000, drawdown:-1000}
]

Chart requirements:

X-axis → Same as equity curve  
Y-axis → Drawdown value (₹)

Visual Style:

• Red filled area
• Always below zero
• Zero reference line
• Tooltip showing drawdown amount

-------------------------------------

LAYOUT

Stack both charts vertically.

Top Chart:
Equity Curve

Bottom Chart:
Drawdown Chart

Both charts must share the same X-axis timeline.

-------------------------------------

INTERACTION

When hovering on the equity curve, the drawdown chart must highlight the same time point.

Tooltips should show both:

• equity value
• drawdown value

-------------------------------------

DESIGN STYLE

• Dark trading dashboard theme
• Minimal grid lines
• Clean professional quant-style layout
• Responsive container

-------------------------------------

TECHNICAL COMPONENTS (Recharts)

ResponsiveContainer
LineChart
Line
AreaChart
Area
XAxis
YAxis
Tooltip
CartesianGrid
ReferenceLine