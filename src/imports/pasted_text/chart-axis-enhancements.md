Implement dynamic X-axis behavior, correct max drawdown marker placement, and fix Y-axis consistency across Equity and Drawdown charts.

Goal:

* Ensure axis adapts to selected granularity (Trades, Daily, Weekly, Monthly)
* Prevent label overlap and clutter
* Accurately display max drawdown on the curve
* Maintain a single, clean, aligned Y-axis across charts
* Ensure visual consistency between Equity and Drawdown charts

---

1. GRANULARITY-BASED X-AXIS

When user selects:

Trades:

* X-axis shows trade index (T1, T2, T3...)

Daily:

* X-axis shows dates (01 Jan, 02 Jan...)

Weekly:

* X-axis shows week labels (Week 1 Jan, Week 2 Jan)

Monthly:

* X-axis shows months (Jan, Feb, Mar)

---

2. LABEL DENSITY CONTROL

Apply automatic label reduction:

* Trades:
  Show every 10–20 trades

* Daily:
  Show every 3–5 days

* Weekly:
  Show every week

* Monthly:
  Show every month

---

3. OVERLAP PREVENTION

* Do not allow X-axis labels to overlap
* Automatically hide labels if spacing is insufficient
* Maintain clean, readable axis at all times

---

4. PHASE ALIGNMENT

* Ensure phase boundary lines align with current axis:

  Trades → trade index
  Daily → date
  Weekly/Monthly → aggregated period

* Maintain alignment across Equity and Drawdown charts

---

5. MAX DRAWDOWN MARKER (CRITICAL)

* Identify exact point of maximum drawdown

* Place marker ON the drawdown curve:

  * x = correct position (trade/date/week/month)
  * y = actual drawdown value

* Do NOT place marker on axis or baseline

---

6. MARKER STYLING

* Shape: small circular dot

* Size: slightly larger than line thickness

* Color: darker red than drawdown line

* Tooltip:
  "Max Drawdown: ₹XX,XXX"

---

7. Y-AXIS FIX (CRITICAL)

A. SINGLE AXIS ONLY

* Ensure ONLY one Y-axis is present
* Remove any duplicate, secondary, or right-side axis
* Remove overlapping axis lines

---

B. ALIGN WITH EQUITY CHART

* Match exact left alignment of Y-axis with Equity chart
* Use same padding and spacing from chart edge
* Ensure both charts align perfectly vertically

---

C. STYLE CONSISTENCY

* Use same font size as Equity chart axis
* Use same text color (muted grey)
* Use same tick thickness and spacing

---

D. VALUE FORMAT

* Display drawdown values as negative:

  0
  -25K
  -50K
  -75K

* Ensure labels are clean and non-overlapping

---

E. CLEAN APPEARANCE

* Keep axis minimal and subtle
* Avoid bold lines or heavy ticks
* Maintain readability without clutter

---

8. CONSISTENCY ACROSS CHARTS

* Apply all above rules to:

  * Equity chart
  * Drawdown chart
  * All time-based charts

---

FINAL RESULT:

* X-axis adapts intelligently to selected view
* Labels remain clean and readable
* Max drawdown is accurately marked on the curve
* Single, aligned Y-axis across charts
* Charts feel precise, consistent, and professional
