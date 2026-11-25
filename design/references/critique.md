# Critique

A design review of something that exists. The chat report is the deliverable. Nothing in source changes during a critique, and no board is opened.

## 1. Resolve the target

Pin "the homepage" or "this modal" to a concrete file or URL. Prefer a source path, since ports drift and paths do not. Read `DESIGN.md` and `PRODUCT.md` if present, and name the surface's mode.

## 2. Two assessments, kept apart

Mechanical findings anchor judgment, so the design review comes first and is done without them.

**A. Design review.** Read the source and look at the rendered page (desktop and mobile) when a browser tool is available. If you can spawn a subagent, give it this section and the target and let it run in a fresh context while you do B. Otherwise do A fully before starting B.

- **Specificity.** Is the composition and visual language grounded in this product, or could an unrelated product use it unchanged? Decide this first.
- **The whole design:** hierarchy, information architecture, emotional fit, discoverability, composition, typography, color, states, copy, edge cases.
- **Cognitive load.** Count the options at each decision point. More than four visible choices at once needs a reason. Look for walls of options, information the user has to carry between screens, hidden navigation, jargon, and inconsistent patterns.
- **Emotional journey.** Where is the peak, how does it end, and is there reassurance at high-stakes moments (payment, deletion, publishing)?
- **Heuristics.** Score each of Nielsen's ten from 0 to 4 (table below).
- **Personas.** Walk two or three of these through the main action and write down exactly what breaks for them:
  - *Power user:* wants shortcuts, bulk actions, and no forced tours.
  - *First-timer:* needs labels, plain language, and visible help.
  - *Assistive technology user:* keyboard only, screen reader, high zoom.
  - *Stress tester:* long names, empty data, double clicks, the back button.
  - *Distracted mobile user:* one thumb, interruptions, poor connection.

**B. Mechanical checks.** Evidence you can count:

- Contrast of text, controls, and focus indicators in the states you can reach.
- Heading order, landmarks, labels, alt text, focus visibility, and tab order.
- Overflow and wrapping at 390px wide and at 200 percent zoom.
- Console errors and layout shift on load.
- The defaults listed under "Refuse" in [craft-floor.md](craft-floor.md), with counts and file locations.

Then combine the two. Do not just concatenate: note where they agree, what the checks caught that the review missed, and which mechanical findings are false alarms in context.

## 3. The report

Write it in this order.

**Method line.** How A and B were run. If A was not isolated from B, or you could not see the rendered page, say so here in plain words.

**Design health score.**

| # | Heuristic | Score (0 to 4) | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | | |
| 2 | Match between system and real world | | |
| 3 | User control and freedom | | |
| 4 | Consistency and standards | | |
| 5 | Error prevention | | |
| 6 | Recognition rather than recall | | |
| 7 | Flexibility and efficiency | | |
| 8 | Aesthetic and minimalist design | | |
| 9 | Error recovery | | |
| 10 | Help and documentation | | |

Be honest. A 4 means genuinely excellent, and most real interfaces land between 20 and 32 out of 40. On Persuade and Experience surfaces, heuristics 7 and 10 often do not apply: mark them n/a with a one-line reason and total out of the applicable maximum. Bands by percentage: 90 and up excellent, 70 and up good, 50 and up acceptable, 30 and up poor, below that critical.

**Specificity verdict.** Does it feel authored for this product or interchangeable within its category? Give your own read first, then what the mechanical checks counted.

**Overall impression.** A short gut reaction: what works, what does not, and the single biggest opportunity.

**What is working.** Two or three things, with why.

**Priority issues.** The three to five that matter most, in order. For each:

- **[P0 to P3] What:** the problem, named plainly. "The submit button", not "some elements".
- **Why it matters:** the cost to the user or the goal.
- **Fix:** concrete.
- **Move:** which flow addresses it (bolder, quieter, distill, typeset, colorize, layout, animate, delight, polish, or new work).

| Priority | Meaning |
|---|---|
| P0 | Blocks the task. Fix now. |
| P1 | Causes real difficulty or confusion. Fix before release. |
| P2 | An annoyance with a workaround. Next pass. |
| P3 | Polish. If time allows. |

Unsure between two levels? If a user would contact support about it, it is at least P1.

**Persona red flags.** For each persona, the exact elements and interactions that failed them.

**Minor observations.** Short.

**Questions worth asking.** Two or three that might unlock a better answer, such as "What would a confident version of this look like?"

Tone: direct and specific. Do not soften, do not pad with "consider exploring", and do not rank everything as important.

## 4. Ask what to do next

The questions come last in the same message as the report, after everything else. Use a structured question tool if available. Two to four questions, each tied to actual findings, each with two or three concrete options:

1. **Priority:** "I found problems with hierarchy, color, and overload. Which first?"
2. **Intent**, only if the tone looked off: "It reads clinical. Intended, or should it be warmer?"
3. **Scope:** "Top three only, everything, or just the blockers?"
4. **Off limits**, only if findings touch many areas: "Should any section stay as it is?"

Skip the questions only when there are fewer than three priority issues. Then end with a one-line recommendation instead.

## 5. After the answers

Give a short ordered plan: the moves to run, each with enough context that it knows what to focus on, ending with `polish` if anything was fixed. Skip moves that would address nothing, and respect the scope and off-limits answers.

When the user says go, run the moves. Each one ends in a review round on the board as usual.
