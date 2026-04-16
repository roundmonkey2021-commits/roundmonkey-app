Refactor the existing Execution (Entry) section into a structured and visually consistent “Trade Entry” step.

IMPORTANT:

* Do NOT create duplicate fields
* Reuse existing fields and reorganize layout
* Do NOT change any existing variable names or bindings
* Only ONE new field is allowed: lotUnitSize
* Remove or replace any conflicting old layout
* Ensure full visual consistency with Step 1 (Trade Context) and Step 2 (Planned Trade)

---

SECTION TITLE: Trade Entry

---

1. HEADER FORMAT (MATCH STEP 1 & 2)

* Use same typography as “Trade Context” and “Planned Trade”
* Add horizontal divider below title

Spacing:

* Title → 8–12px → Divider
* Divider → 16px → Content

---

2. ENTRY DETAILS (Group 1)

Fields:

* Entry Date → date (stored as timestamp)
* Day → day (auto-calculated from Entry Date)
* Entry Time → entryTime
* Entry Premium → entryPremium

Layout:

* Keep all 4 fields in a single row (if space allows)
  OR split into 2 rows if needed

Behavior:

* Entry Date: calendar input (no restriction)
* Day: read-only (auto-calculated)
* Entry Time: manual input (NOT dropdown)
* Entry Premium: numeric input

UI Styling:

* Day must have disabled/read-only styling
* Add subtle helper text under Day:
  “Auto-calculated from date”

---

3. POSITION (Group 2)

Fields:

* No of Lots → lotSize
* Lot Size (NEW, mandatory) → lotUnitSize
* Quantity (read-only) → quantity

Layout:

* Single row: Lots | Lot Size | Quantity

Behavior:

* quantity = lotSize × lotUnitSize
* Auto-calculated in real time
* Quantity must be disabled

UI Styling:

* Quantity:

  * Disabled styling (grey background)
  * Add helper text: “Auto-calculated”

* Lot Size:

  * Add helper text:
    “Units per lot (e.g., 65 for NIFTY)”

---

4. CAPITAL (Group 3 — OUTPUT)

Field:

* Total Invested → totalInvested

Formula:
totalInvested = entryPremium × quantity

UI Styling:

* Must NOT look like editable input
* Use subtle background tint (light highlight)
* Reduce strong border emphasis
* Clearly indicate read-only

---

5. ENTRY ORDER TYPE (Group 4)

Field:

* Entry Order Type → entryOrderType
* Options: Market / Limit

UI:

* Radio buttons or dropdown (consistent with rest of app)

---

6. GROUP ORDER (IMPORTANT)

Maintain this exact flow:

1. Entry Details
2. Position
3. Capital
4. Entry Order Type

---

7. CONSISTENCY RULES (VERY IMPORTANT)

* Match Step 1 and Step 2 for:

  * Title size
  * Divider style
  * Spacing between sections
  * Input vs read-only styling

* Clearly distinguish:

  * Editable fields
  * Auto-calculated fields

* Maintain clean card layout and consistent padding

---

8. DO NOT INCLUDE

* Do NOT include Spot Price (already in Step 1)
* Do NOT include Moneyness (Step 1)
* Do NOT include Plan-related fields

---

GOAL:

Create a clean, structured execution step that mirrors the planning logic (lots × lot size = quantity), ensures accurate calculation of quantity and capital, and maintains full visual and UX consistency with previous steps.
