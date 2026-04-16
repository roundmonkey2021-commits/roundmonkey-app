Fix critical bugs in Trade Journal page related to date selection, calculations, navigation behavior, and layout.

IMPORTANT:

* Do NOT change variable names
* Do NOT break existing structure
* Ensure all calculations and behaviors are logically correct across all scenarios
* Handle Buy & Sell cases separately where required

---

1. FIX DATE SELECTION BUG (CRITICAL)

Issue:
Calendar selects previous date instead of clicked date

Fix:

* Ensure selected date = exact clicked date

* Remove any offset or incorrect date transformation logic

* Standardize date handling across:

  * Expiry Date
  * Entry Date
  * Exit Date

* Ensure no timezone or minus-one-day shift occurs

---

2. FIX TRADE REVIEW CALCULATIONS (CRITICAL)

Ensure correct formulas for ALL scenarios:

---

A. POINTS CAPTURED PER LOT

For BUY:
Points = exitPremium - entryPremium

For SELL:
Points = entryPremium - exitPremium

---

B. PnL

PnL = Points × noOfLots × lotUnitSize

---

C. INVESTED AMOUNT

Invested Amount = entryPremium × noOfLots × lotUnitSize

---

D. RETURN %

Return % = (PnL / Invested Amount) × 100

Ensure:

* No negative return when trade is profitable
* No unrealistic values (e.g. -400%)

---

E. ACTUAL RISK

For BUY:
Actual Risk = entryPremium - plannedStopLoss

For SELL:
Actual Risk = plannedStopLoss - entryPremium

Ensure:

* Always positive value

---

F. ACTUAL REWARD

For BUY:
Actual Reward = exitPremium - entryPremium

For SELL:
Actual Reward = entryPremium - exitPremium

Ensure:

* Correct sign handling

---

G. ACTUAL R:R

Actual R:R = Actual Reward / Actual Risk

Ensure:

* No division by zero
* Proper formatting (e.g. 1:2, not 1:0.00)

---

H. HANDLE ALL SCENARIOS

Ensure correctness for:

* Buy + Profit
* Buy + Loss
* Sell + Profit
* Sell + Loss

---

3. FIX SAVE WARNING LOGIC

Issue:
Warning appears even after saving

Fix:

* Track form state using:
  isSaved flag

Behavior:

* If NOT saved:
  Show warning on navigation

* If saved:
  Do NOT show warning

* Reset isSaved = false when user edits any field after saving

---

4. FIX DOUBLE SCROLLBAR (REAPPLY CORRECTLY)

Issue:
Still seeing double scrollbar

Fix:

* Ensure ONLY one scroll container exists

* Keep scrolling at main page level

* Remove overflow/scroll from inner containers

* Ensure no nested scroll frames exist

---

5. VALIDATION CHECKS

* Ensure exit date/time > entry date/time
* Ensure calculations update dynamically on input change

---

GOAL:

Ensure correct date selection, accurate trade calculations, proper navigation behavior, and clean layout without duplication or inconsistencies.
