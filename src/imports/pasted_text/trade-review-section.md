Add a final step called “Trade Review” after the Trade Psychology section.

IMPORTANT:

* This is a read-only section (except Notes)
* Do NOT duplicate fields from earlier steps
* All values must be derived from existing inputs
* Follow the formulas exactly as defined below
* Maintain consistency with previous steps

---

SECTION TITLE: Trade Review

---

1. HEADER FORMATTING

* Use same typography as previous steps
* Add divider below title

---

2. PERFORMANCE SUMMARY

Fields (read-only):

* Points Captured per Lot
* PnL
* Return %

Formulas:

For BUY:
Points per Lot = exitPremium - entryPremium

For SELL:
Points per Lot = entryPremium - exitPremium

PnL = Points per Lot × noOfLots × lotUnitSize

Return % = (PnL / (entryPremium × noOfLots × lotUnitSize)) × 100

---

3. CAPITAL

Fields (read-only):

* Invested Amount

Formula:

Invested Amount = entryPremium × noOfLots × lotUnitSize

---

4. RISK ANALYSIS

Fields (read-only):

* Actual Risk
* Actual Reward
* Actual R:R

Formulas:

For BUY:
Actual Risk = entryPremium - plannedStopLoss
Actual Reward = exitPremium - entryPremium

For SELL:
Actual Risk = plannedStopLoss - entryPremium
Actual Reward = entryPremium - exitPremium

Actual R:R = Actual Reward / Actual Risk

---

5. PLAN VS ACTUAL (Optional Section)

Fields:

* Planned Entry vs Actual Entry
* Planned Exit vs Actual Exit
* Planned Quantity vs Actual Quantity
* Planned R:R vs Actual R:R

Show this section ONLY if planned trade exists

---

6. NOTES (INPUT FIELD)

Field:

* Notes → form: notes → stored as: notes

This is a general trade summary field

---

7. SAVE BUTTON

* Place “Save Trade” button at the bottom
* Full-width button

---

8. UI & STYLING RULES

* Use card-based layout for each section
* Use color coding:

  * Profit values → green
  * Loss values → red
* All metric fields should be read-only
* Maintain spacing consistency with previous steps

---

GOAL:

Provide a clear and accurate summary of trade performance using correct formulas, align with trader mental model (lot-based), and finalize trade entry with all key insights visible.
