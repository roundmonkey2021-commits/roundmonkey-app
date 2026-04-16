Enhance the Drawdown chart to align with the Equity Curve design while clearly communicating risk and pain periods.

Goal:

* Maintain visual consistency with Equity chart
* Highlight drawdowns without overwhelming the user
* Clearly show worst drawdown and phase transitions

---

1. CHART HIERARCHY

* Keep drawdown chart slightly smaller than equity (~220–260px height)
* Place directly below equity chart
* Maintain consistent spacing (16px gap)

---

2. COLOR SYSTEM

* Use controlled red palette:

  Line:

  * Medium red (#DC2626)

  Area fill:

  * Light red with low opacity

  Deep drawdowns:

  * Slightly darker tone (optional gradient)

* Avoid harsh or neon red

---

3. AREA FILL

* Fill area between drawdown line and zero baseline
* Keep fill subtle and breathable
* Do not use heavy solid blocks

---

4. BASELINE EMPHASIS

* Highlight zero line clearly
* Slightly stronger than other grid lines
* Acts as reference level

---

5. GRID CLEANUP

* Reduce grid opacity
* Remove vertical grid lines
* Keep only subtle horizontal guides

---

6. PHASE SEGMENTATION (MANDATORY)

* Use same phase boundaries as Equity Curve

* Draw vertical dashed lines at phase transitions:

  * 1px width
  * Grey color (#9CA3AF)
  * 40–60% opacity

* Ensure perfect alignment with Equity chart

---

7. WORST DRAWDOWN MARKER

* Add marker at maximum drawdown point

Style:

* Small circular dot
* Slightly darker red
* Tooltip on hover

---

8. AXIS CLEANUP

* Reduce x-axis labels
* Show only key intervals
* Keep labels small and muted

---

9. CONSISTENCY

* Match spacing, padding, and style with Equity chart
* Ensure both charts feel like a pair

---

FINAL RESULT:

* Drawdown chart clearly shows risk periods
* Visually aligned with equity curve
* User can immediately identify worst loss phases
* Clean, controlled, and professional appearance
