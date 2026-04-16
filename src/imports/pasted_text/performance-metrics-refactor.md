Refactor the Performance Metrics page layout using a structured hierarchy and a collapsible section while keeping ALL charts.

Goal:

* Improve visual hierarchy
* Reduce initial overload
* Keep all data accessible
* Make page readable within 5 seconds

---

1. HERO SECTION (Top Priority)

* Place Equity Curve as full-width hero chart

* Height: ~320px

* Make it visually dominant

* Place Drawdown chart directly below it

* Full width

* Spacing between them: 16px

* Add clear section title: "Equity & Drawdown"

---

2. CORE PERFORMANCE (Always Visible)

Create a 2-column grid layout

Row 1:

* P&L per Trade
* Avg Points per Trade

Row 2:

* P&L Distribution (full width)

Spacing:

* 16px between cards
* 32px from hero section

---

3. COLLAPSIBLE SECTION

Create a collapsible container titled:

"Detailed Analysis"

Default state: collapsed

Style:

* Full width card
* Padding: 16px
* Border: 1px solid light grey (#E5E7EB)
* Border radius: 12px
* Background: white
* Arrow icon on right (rotates on expand)

Add small helper text:
"Advanced performance insights"

---

4. INSIDE COLLAPSIBLE (All remaining charts)

Use structured grouping:

---

Group 1: Distribution Deep Dive

Row:

* Daily P&L Distribution
* Daily Winners vs Losers

---

Group 2: Risk vs Reward

Row:

* Avg Winners vs Losers
* (empty or spacing placeholder for alignment)

---

Group 3: Performance Trends

Row:

* Expectancy Trend (full width)

Row:

* Win Rate Trend (full width)

---

Maintain:

* 16px spacing between all cards
* Consistent card styling across all charts

---

5. INTERACTION

* Clicking "Detailed Analysis" expands/collapses section
* Animate smoothly (200–300ms ease)
* Rotate arrow icon when expanded

Optional:

* Show hint when collapsed:
  "4+ additional insights hidden"

---

6. VISUAL HIERARCHY RULES

* Hero section = most prominent

* Core charts = medium emphasis

* Detailed section = lower emphasis

* Do NOT make all charts same size

* Use size and spacing to guide attention

---

7. CONSISTENCY

* All cards same padding (16px)
* All charts same axis style
* Same grid opacity
* Same typography scale

---

FINAL RESULT:

* Equity curve becomes visual anchor
* Important metrics visible instantly
* Advanced charts accessible but not overwhelming
* Page feels structured, clean, and professional
