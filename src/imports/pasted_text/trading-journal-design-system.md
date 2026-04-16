Create a clean, minimal, professional design system for a trading journal dashboard web app.

STYLE GOAL:

* Calm, structured, data-focused
* Premium (like Zerodha / Notion / Linear)
* Avoid clutter and excessive colors
* Emphasize readability and hierarchy

---

1. SPACING SYSTEM (8pt grid)

Define spacing tokens:

* xs: 4px
* sm: 8px
* md: 16px
* lg: 24px
* xl: 32px
* 2xl: 40px

Rules:

* Section spacing: 32px
* Card spacing: 16px
* Internal padding: 16px (standard)
* Tight spacing (labels): 8px

---

2. TYPOGRAPHY SYSTEM

Font: Inter (or similar clean sans-serif)

Define text styles:

* Page Title:
  28px, Bold

* Section Title:
  18px, Semi-Bold

* Card Title:
  14px, Medium

* Primary Metric (KPI):
  28–32px, Bold

* Secondary Metric:
  16px, Medium

* Body Text:
  13–14px, Regular

* Caption / Labels:
  11–12px, Regular, muted color

---

3. COLOR SYSTEM

Define semantic colors:

* Background:
  #F8FAFC (page background)

* Card Background:
  #FFFFFF

* Border:
  #E5E7EB

* Text Primary:
  #111827

* Text Secondary:
  #6B7280

* Profit (Green):
  #16A34A

* Loss (Red):
  #DC2626

* Info (Blue):
  #2563EB

* Warning (Orange):
  #F59E0B

Rules:

* Use green ONLY for profit/positive
* Use red ONLY for loss/risk
* Avoid random colors in charts
* Use opacity instead of new colors

---

4. CARD COMPONENT

Create a reusable Card component:

Properties:

* Border radius: 12px
* Padding: 16px
* Background: white
* Border: 1px solid #E5E7EB
* No heavy shadows

Structure:

* Title (top-left)
* Optional subtitle (small grey)
* Content area (chart / metric)

Spacing:

* Title → content: 12px

---

5. KPI CARD VARIANT

Create KPI card:

* Large number (28–32px bold)
* Label above or below (12px grey)
* Optional change indicator (+ / -)

Example:
Net P&L
₹4,34,200 (green)

---

6. CHART SYSTEM

Standardize all charts:

* Axis font: 11–12px
* Axis color: grey (#6B7280)
* Grid lines: very light (#E5E7EB, low opacity)
* Smooth curves (no harsh lines)

Color rules:

* P&L → green/red
* Neutral charts → blue or grey
* Emotion charts → fixed palette (max 3–4 colors)

Padding inside charts: consistent

---

7. LAYOUT GRID

* Use 12-column grid
* Max width: 1200–1320px
* Consistent margins

Page structure:

[ Page Title ]

[ Filters / Controls ]

[ Hero Section (full width) ]

[ KPI Cards Row ]

[ Main Charts (2-column grid) ]

[ Secondary Charts ]

---

8. BUTTON SYSTEM

Primary Button:

* Dark background (black/navy)
* White text
* Rounded (8px)

Secondary Button:

* Light background
* Border

Danger Button:

* Red text or outline

---

9. TAGS / BADGES

Use for:

* Status (Win/Loss)
* Instrument (CALL/PUT)
* Phase (Live)

Style:

* Small pill
* Light background + colored text

---

10. CONSISTENCY RULES

* All cards same padding
* All charts same style
* All sections follow same spacing
* No random font sizes
* No random colors

---

OUTPUT:

* Create components:
  Card
  KPI Card
  Button
  Badge
  Chart container

* Apply system to a sample dashboard layout
