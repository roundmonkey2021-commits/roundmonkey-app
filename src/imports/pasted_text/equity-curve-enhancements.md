Enhance the Equity Curve section by combining visual polish, phase-based filtering, and phase segmentation using existing phase data.

Goal:

* Make Equity Curve a strong visual anchor
* Enable filtering by trading phases
* Show phase transitions directly on the chart
* Maintain clean, non-cluttered UI

---

1. INTEGRATE PHASE FILTER WITH EXISTING CONTROLS

Use the existing control row (Trades / Daily / Weekly / Monthly).

Add a new control:

[ Phases ▼ ]

Position:

* Place next to timeframe controls (same row)
* Maintain consistent button style

---

2. PHASE FILTER BEHAVIOR

Use existing "Phase" variable from data:
Example: IN-NF-OP-LV-001

Behavior:

* Extract unique phase values dynamically
* Display as multi-select checkbox dropdown

Example UI:

☑ IN-NF-OP-LV-001
☑ IN-BN-OP-SIM-002
☐ IN-NF-FUT-LV-003

Default:

* All phases selected

Interaction:

* Selecting/deselecting phases filters ALL charts
* Applies globally (equity, drawdown, etc.)

---

3. PHASE LABEL SIMPLIFICATION (IMPORTANT)

Do NOT show full raw phase codes in UI.

Transform labels for readability:

IN-NF-OP-LV-001 → "NF Options (Live) - P1"

Rules:

* Extract symbol (NF, BN, etc.)
* Extract instrument (OP, FUT, etc.)
* Extract type (LV = Live, SIM = Sim)
* Convert into readable format

---

4. EQUITY CURVE VISUAL POLISH

Apply enhancements:

* Line thickness: 2.5–3px

* Smooth curve

* Strong green color

* Add subtle gradient fill under line:
  Top: light green
  Bottom: transparent

* Reduce grid opacity

* Remove vertical grid lines

* Keep subtle horizontal guides

---

5. CURRENT & PEAK MARKERS

* Add marker at latest point (current equity)
* Add marker at peak equity

Style:

* Small circular dot
* Same green tone
* Tooltip on hover

---

6. BASELINE EMPHASIS

* Highlight zero baseline slightly more than other grid lines
* Use slightly darker grey

---

7. AXIS CLEANUP

* Reduce x-axis label density
* Show only key intervals
* Keep labels small and muted

---

8. CONTEXT HEADER ALIGNMENT

Above chart, display:

* Peak Equity
* Current Equity
* Max Drawdown
* Best Trade

Style:

* Small labels (muted)
* Medium values
* Align tightly with chart width
* Reduce vertical gap

---

9. PHASE SEGMENTATION ON EQUITY CURVE

Use phase data to mark transitions:

---

A. VERTICAL MARKERS

* Add thin vertical dashed lines at phase boundaries
* Color: light grey
* Low opacity

---

B. PHASE LABELS

* Display phase names above chart
* Use simplified labels (not raw codes)
* Small, muted text

Example:
| NF Options (Live) | BN Options (Sim) |

---

C. OPTIONAL BACKGROUND SEGMENT

* Add very subtle alternating background tint per phase
* Keep extremely light to avoid distraction

---

10. CLARITY RULES

* Do NOT overcrowd chart
* If too many phases:

  * Reduce label frequency
  * Keep only key transitions

---

11. CONSISTENCY

* Ensure phase filtering applies to:

  * Equity curve
  * Drawdown
  * All performance charts

---

FINAL RESULT:

* Equity curve becomes a strong visual story
* User sees both performance and context (phases)
* Full data control via phase filtering
* Clean, professional, and scalable UI
