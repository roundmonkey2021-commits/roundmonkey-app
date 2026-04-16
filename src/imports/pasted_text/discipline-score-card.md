Refine the “Discipline Score” card in the Discipline Overview page to improve visual hierarchy, clarity, and meaning.

The goal is to make this card the primary anchor of the page.

---

🟦 VISUAL HIERARCHY (MOST IMPORTANT)

1. Make the main score dominant:

* Increase size of “7.4” significantly (20–30% larger than current)
* Keep “/10” smaller and lighter
* Ensure the score is the first thing the eye sees

---

2. Adjust change indicator (+0.6):

* Display with arrow: ↑ +0.6
* Slightly increase size (but keep smaller than main score)
* Use green color for positive change

Add context text below it:
“vs previous period”

* This text should be smaller and subtle (secondary text color)

---

🟨 BREAKDOWN (Risk / Execution / Behavior)

Current issue: These are visually competing with the main score

Fix:

* Reduce font size of breakdown values
* Use lighter color (muted grey)
* Reduce spacing between rows
* Make them clearly secondary information

Example layout:

Risk        8.0
Execution   7.1
Behavior    6.3

(should feel like supporting data, not primary focus)

---

🟪 PLACEHOLDER HANDLING

Current: “(Placeholder)” is too explicit and breaks UI feel

Replace with:

Option A (Recommended):

* Change title to: “Discipline Score (Preview)”

Option B:

* Add tooltip on hover:
  “Score logic will be finalized later”

Do NOT show “(Placeholder)” as plain text.

---

🟩 VISUAL TONE

Add subtle visual meaning to the card:

* If score ≥ 7 → very light green background tint or border accent
* If score < 6 → light red tint
* Keep it subtle, not distracting

(This can be static for now with dummy data)

---

🟫 ALIGNMENT & SPACING

* Align score (7.4) to left
* Place change indicator (+0.6) aligned to right or just below score
* Maintain clear spacing between:

  * Score
  * Change indicator
  * Breakdown

Ensure card feels breathable, not dense

---

🧠 OPTIONAL MICROCOPY (if space allows)

Add a short interpretation below score:

Example:
“Moderate discipline — needs improvement in behavior”

* Small font
* Neutral tone

---

🎨 DESIGN CONSISTENCY

* Match typography, spacing, and card styling from Emotion Overview page
* Keep borders, shadows, and radius consistent
* Do not introduce new visual styles

---

GOAL

The card should feel:

* Like the primary anchor of the page
* Easy to read in 2 seconds
* Slightly judgmental (not neutral)
* Informative but not cluttered
