Refactor the existing Plan section of the Trade Entry page into a structured “Planned Trade” step.

IMPORTANT:

* Do NOT create duplicate fields
* Reuse all existing fields and REORGANIZE layout
* Do NOT change any existing variable names or bindings
* Keep the existing “Planned” radio button (Yes/No)
* This radio maps to: isPlanned (boolean)
* Only ONE new field is allowed: planLotUnitSize
* Remove or replace any old layout that conflicts with this structure

---

SECTION TITLE: Planned Trade

1. CONTROL (Top of Section)

* Radio Button: Planned (Yes / No)
* Variable: isPlanned

Behavior:

* If "No" → hide entire Planned Trade section
* If "Yes" → show all fields below

---

2. PRICE PLAN (Group 1)

Fields:

* Planned Entry Premium → planEntryPrice
* Planned Target Premium → planExitPrice
* Planned Stop Loss → planStopLoss

Layout:

* Place all 3 fields in a single row or tight group

---

3. POSITION PLAN (Group 2)

Fields:

* Plan No of Lots → planLotSize
* Plan Lot Size (NEW, mandatory) → planLotUnitSize
* Plan Quantity (read-only) → planQuantity

Behavior:

* planQuantity = planLotSize × planLotUnitSize
* Auto-calculated in real time
* Must be disabled (non-editable)

Add helper text under Plan Lot Size:
“Units per lot (e.g., 65 for NIFTY)”

---

4. CAPITAL (Group 3 — Read-only)

Field:

* Planned Capital Required (derived)

Formula:
planCapital = planEntryPrice × planQuantity

Behavior:

* Auto-calculated
* Disabled / read-only styling

---

5. RISK / REWARD (Group 4 — Read-only)

Field:

* Planned R:R (derived)

Formula:
Risk = planEntryPrice - planStopLoss
Reward = planExitPrice - planEntryPrice
R:R = Reward / Risk

Display format:
1 : X.X

Behavior:

* Auto-calculated
* Disabled / read-only styling

---

6. PLAN ACTION (Group 5)

Field:

* Plan Action → planAction
* Options: Buy / Sell

Behavior:

* Default value = Step 1 Action
* User can change it

---

DESIGN REQUIREMENTS:

* Replace the existing flat form layout with structured blocks:
  Price → Position → Capital → Risk → Action

* Use a card or shaded container to visually separate “Planned Trade”

* Clearly distinguish:

  * Editable inputs
  * Auto-calculated fields (disabled style)

* Maintain clean spacing and alignment

* Ensure no duplicate fields exist

* Ensure progressive visibility (only visible when isPlanned = Yes)

---

GOAL:

Create a clean, structured planning step that captures intended trade details clearly, enables discipline tracking (plan vs execution), and integrates seamlessly with the existing data model without breaking any downstream calculations or CSV exports.
