Implement a universal adaptive X-axis system and enhance bar chart styling across all charts (P&L and Avg Points).

Goal:

* Ensure clean and readable axis behavior across all granularities
* Improve bar chart visual quality and reduce clutter
* Maintain consistency with Equity and Drawdown charts

---

1. UNIVERSAL X-AXIS LABEL SYSTEM

Apply adaptive label density:

Trades Mode:

* Show labels every 10–20 trades

Daily Mode:

* Show labels every 3–5 days

Weekly Mode:

* Show labels every week
* If crowded, skip alternate weeks

Monthly Mode:

* Show labels every month
* If crowded, show every 2 months

---

2. DYNAMIC ADAPTATION

* Adjust label density based on available width
* Do NOT use fixed intervals

---

3. OVERLAP PREVENTION

* Do NOT allow labels to overlap
* Automatically skip labels when spacing is insufficient

---

4. CONSISTENCY

* Apply same axis logic across:

  * Equity chart
  * Drawdown chart
  * P&L chart
  * Avg Points chart

---

5. Y-AXIS CLEANUP

* Remove axis titles completely
* Keep only numeric values
* Match style with Equity chart

---

6. BAR DESIGN ENHANCEMENT

* Add slight rounded corners (2–3px, top only)

* Maintain minimum bar width (especially in trade mode)

* Prevent bars from becoming too thin

* Add small spacing between bars

* Avoid bars touching each other

---

7. COLOR & OPACITY

* Profit bars → green

* Loss bars → red

* Slightly reduce opacity (~85–90%) for dense views

* On hover:

  * Increase opacity to 100%
  * Highlight active bar

* Use slightly softer red tone (avoid harsh saturation)

---

8. ZERO BASELINE EMPHASIS

* Highlight the zero line slightly more than grid lines
* Ensure clear separation between profit and loss

---

9. OPTIONAL GRADIENT (SUBTLE)

* Apply very light vertical gradient to bars:

  * Green → slightly lighter green
  * Red → slightly lighter red

* Keep extremely subtle (avoid visual noise)

---

10. INTERACTION

* On hover show tooltip:

  * Trade number / Date
  * P&L or Points
  * Phase

---

FINAL RESULT:

* Bars feel modern and clean
* Chart remains readable even with large datasets
* Axis behaves intelligently across all views
* Entire system feels consistent and professional
