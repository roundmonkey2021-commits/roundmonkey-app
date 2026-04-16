Refine the visual layout and formatting of the existing “Planned Trade” section.

IMPORTANT:

* Do NOT add new fields
* Do NOT change any variable names or bindings
* Do NOT duplicate fields
* Only improve layout, grouping, and visual clarity
* Reuse all existing elements and reorganize them

---

1. SECTION HEADER ALIGNMENT

* Move the “Planned” (Yes/No) radio buttons into the same row as the “Planned Trade” title

Layout:
Planned Trade        ( ) Yes   ( ) No

* Add a horizontal divider line below the header
* Match the exact style used in “Trade Context” (Step 1)

---

2. GROUP STRUCTURE & ORDER

Reorder sections in this exact sequence:

1. Price Plan
2. Position Plan
3. Plan Action
4. Capital
5. Risk:Reward Analysis

---

3. PRICE PLAN (TIGHTEN LAYOUT)

* Keep Planned Entry, Target, and Stop Loss in a single row
* Ensure equal width and consistent spacing
* Reduce unnecessary horizontal gaps

---

4. POSITION PLAN (CLARITY FIX)

* Ensure Plan Quantity is clearly read-only:

  * Use disabled styling (grey background or muted text)
  * Add helper text: “Auto-calculated”

* Keep layout:
  Plan No of Lots | Plan Lot Size | Plan Quantity

---

5. PLAN ACTION (REPOSITION)

* Move “Plan Action (Buy/Sell)” directly below Position Plan
* Keep it visually separated as its own block

---

6. CAPITAL (READ-ONLY STYLE)

* Planned Capital Required should NOT look like an editable input
* Apply read-only styling:

  * Remove strong input border
  * Use subtle background highlight
  * Keep it clearly visible but non-editable

---

7. RISK:REWARD ANALYSIS (REDUCE DENSITY)

* Break the section into clearer sub-groups:

Group 1:

* Ratio (highlighted)

Group 2:

* Risk (points) | Reward (points)

Group 3:

* Risk (₹) | Reward (₹)

Group 4:

* ROI %

* Add spacing between groups to improve readability

* Maintain color coding (green for reward, red for risk)

---

8. CONSISTENCY RULES

* Use same typography, spacing, and divider style as Step 1
* Ensure clear distinction between:

  * Editable inputs
  * Auto-calculated fields
* Maintain clean card layout with proper padding

---

GOAL:

Improve clarity, hierarchy, and usability of the Planned Trade section without changing any logic or data structure. The section should feel structured, easy to scan, and clearly distinguish between user inputs and system-calculated values.
