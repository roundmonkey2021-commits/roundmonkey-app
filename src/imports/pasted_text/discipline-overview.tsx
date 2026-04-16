Create a “Discipline Overview” page for a trading journal application.

The purpose of this page is to evaluate trading discipline, execution quality, and rule adherence using clearly defined, data-driven metrics.

Follow the same design language as the “Emotion Overview” page:

* Clean card-based layout
* Minimalistic and structured UI
* Clear typography and spacing
* Subtle borders and soft shadows
* Green for strong performance, red/orange for attention, neutral otherwise

---

🔷 HEADER

Title: Discipline Overview
Subtitle: Execution quality and rule adherence across all trades

Top right:

* Dropdown (reuse existing component)
* Default: All Time
* Other options (future): Weekly, Monthly

---

🟢 TOP SUMMARY CARDS

1. Discipline Score (PLACEHOLDER ONLY)

Display:

* Score: 7.4 / 10 (dummy)
* Trend: ↑ +0.6 (dummy)
* Breakdown:

  * Risk — 8.0
  * Execution — 7.1
  * Behavior — 6.3

IMPORTANT:
Do NOT calculate this yet. Use placeholder values.

---

2. Best Discipline Area

Display:

* Metric with highest adherence %
* Example: Position Sizing Discipline — 95%
* Add ✓ indicator

---

3. Worst Discipline Area

Display:

* Metric with lowest adherence %
* Example: Overtrading Discipline — 62%
* Add ⚠️ indicator

---

🔽 DISCIPLINE METRICS SECTION

Each metric must be displayed with:

* Metric Name
* Percentage value
* Optional trend placeholder (e.g., ↑ +5%)
* Indicator:

  * ✓ if high (≥85%)
  * ⚠️ if low (<65%)
  * No icon if neutral

---

🟢 RISK DISCIPLINE

1. Stop Loss Adherence

Definition:

* Consider ONLY planned trades

A trade is adherent if:

* Stop loss was defined
* Stop loss was NOT modified

Formula:
(Planned trades where SL not modified) / (Total planned trades)

---

2. Position Sizing Discipline

Definition:

* Compare Actual Lot Size vs Allowed Lot Size

Rule:

* Adherent if Actual Lot Size ≤ Allowed Lot Size
* Undersizing is allowed

Formula:
(Trades where actual size ≤ allowed size) / (Total planned trades)

---

3. Risk-Reward Adherence

Rule:

* Minimum acceptable R:R = 1:3

Formula:
(Trades where planned R:R ≥ 1:3) / (Total planned trades)

---

4. Strike Discipline

Rule:

* Allowed: ITM or ATM options
* Not allowed: OTM options

Formula:
(Trades with ITM or ATM) / (Total trades)

---

🔵 EXECUTION DISCIPLINE

5. Target Achievement Consistency

Definition:

* Consider ONLY trades that did NOT hit stop loss

Classify trades using Exit Reason:

Valid outcomes:

* Target Hit
* Strategy-based exit (e.g., new setup, rule-based exit)

Invalid outcome:

* Early exit due to emotion or unclear reason

Formula:
(Target hit trades + valid strategy exits) / (Trades that did NOT hit SL)

IMPORTANT:
Use Exit Reason field to determine classification.

---

6. Trade Planning Discipline

Definition:
A trade is considered planned ONLY if ALL of the following exist:

* Setup is defined
* Planned Entry is defined
* Planned Stop Loss is defined
* Planned Target is defined

IMPORTANT:
Do NOT rely on a manual “planned trade” flag.
This must be derived from field presence.

Formula:
(Trades with complete plan) / (Total trades)

---

🟡 BEHAVIORAL DISCIPLINE

7. Overtrading Discipline

Based on two rules:

Rule 1 — Max Trades Per Day:

* Each day has a maximum allowed number of trades

Rule 2 — Daily Stop Loss Limit:

* Trading must stop after daily loss limit is reached

A trade is considered a violation if:

* It exceeds the allowed number of trades for that day
  OR
* It occurs AFTER the daily SL limit has already been breached

IMPORTANT:

* Only the violating trades are marked as non-adherent
* Do NOT mark the entire day as a violation

Formula:
(Trades that follow both rules) / (Total trades)

---

🔴 RULE VIOLATIONS SECTION

Display count of violations (simple list, no charts):

* Early Exit
* Overtrading
* SL Modified
* OTM Trades

Definitions:

* Early Exit = exit before target without valid strategy reason
* Overtrading = trades beyond daily limits or after SL breach
* SL Modified = stop loss changed after entry
* OTM Trades = trades taken with disallowed moneyness

---

🟣 EMOTIONAL INFLUENCE SECTION (NO SCORING)

This section shows how emotions are linked to behavior.

Display distributions only (no good/bad classification).

Group as follows:

1. Early Exit → emotions (use exit stage emotions)
2. Overtrading → emotions (use post-exit emotions)
3. Position Sizing Violations → emotions (use entry emotions)
4. SL Modification → emotions (use in-trade emotions)

Display format:
Emotion Name — Count

IMPORTANT:

* Do NOT classify emotions as good or bad
* This is an exploratory insight section

---

🎨 DESIGN RULES

* Match Emotion Overview page styling:

  * Same grid system
  * Same spacing
  * Same typography
* Use subtle icons only:

  * ✓ for strong
  * ⚠️ for weak
* Avoid complex charts
* Use clean grouped sections and readable lists

---

GOAL

The page should feel:

* Analytical
* Structured
* Actionable
* Focused on discipline and accountability (not exploration)
