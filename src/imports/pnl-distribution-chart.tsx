Create a trading analytics chart called "P&L Distribution".

Chart Type:
Histogram (bar chart representing frequency distribution).

Purpose:
Show how individual trade profit and loss values are distributed across ranges.

Data Logic:

Input data is trade P&L values.

Example dataset:

[
 -1200,
 -800,
 -600,
 -300,
 200,
 350,
 450,
 700,
 900,
 1200
]

Convert the data into histogram bins.

Example bins:

-1500 to -1000
-1000 to -500
-500 to 0
0 to 500
500 to 1000
1000 to 1500

Count how many trades fall into each bin.

Example result:

[
 {range:"-1500 to -1000", count:1},
 {range:"-1000 to -500", count:3},
 {range:"-500 to 0", count:1},
 {range:"0 to 500", count:3},
 {range:"500 to 1000", count:1},
 {range:"1000 to 1500", count:1}
]

Chart Requirements:

X-axis → P&L range (₹ bins)
Y-axis → Number of trades

Visual Design:

• Bars representing frequency of trades in each P&L range
• Loss ranges colored red
• Profit ranges colored green
• Zero reference line separating profit and loss
• Tooltip showing:
  - P&L range
  - number of trades in that range

Dashboard Style:

• Clean trading analytics style
• Dark mode compatible
• Minimal grid lines
• Responsive container
• Rounded bars

Optional Enhancements:

• Highlight the zero bin (break-even area)
• Show total trades count above the chart
• Use symmetric bin sizes (e.g., ₹500 increments)

Technical Implementation (Recharts):

Use:

ResponsiveContainer  
BarChart  
Bar  
XAxis  
YAxis  
Tooltip  
CartesianGrid  
ReferenceLine