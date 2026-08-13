---
name: adversarial-debate
description: Runs a structured debate between independent advocates (one per option) and an impartial judge to help make difficult decisions. Use when the user says "help me decide", "weigh the options", "debate this", "pros and cons", "A or B", "which should I choose", or invokes /adversarial-debate. Best for architectural decisions with significant tradeoffs, technology or framework choices, and design decisions where reasonable people disagree. Supports 2-4 options. Skip for trivial decisions or when there's an obviously correct answer.
compatibility: Works best in agents that can spawn subagents (e.g. Claude Code's Agent tool). Falls back to single-context personas otherwise.
---

# Adversarial Debate

Helps you make better decisions on difficult tradeoffs by running a structured debate: one independent advocate per option, then a ruling from an impartial judge.

When subagents are available, each advocate argues from its own fresh context. This produces genuinely independent arguments instead of one mind negotiating with itself.

## The Court

- **Advocates**: One per option, each named after the option it defends (e.g. "Advocate for Postgres"). For a binary adopt/reject debate, you may call them **Albert** (for) and **Bart** (against). Each is skilled, knowledgeable, and fair, and argues its side as strongly as honesty allows.
- **Jeff**: The judge. Impartial and thorough. Rules only after hearing every side. Runs in the main context.

## Phase 1: Setup

1. **Frame the decision.** Identify the decision and enumerate 2-4 concrete options. A yes/no proposal becomes two options: adopt it, or keep the status quo. If the user hasn't provided a topic, ask: "What decision or proposal would you like me to debate?"
2. **Ground the debate.** Before any arguing, gather the concrete context the arguments must engage with:
   - If the decision concerns the current project, read the relevant files, configs, and dependencies.
   - Note real constraints: scale, team size and expertise, timeline, budget, existing stack.
   - Ask the user only for constraints that are both unknown and likely decisive.
3. **Neutralize bias.** If the user has already revealed a preference, record it, but Jeff must explicitly disregard it when ruling.

## Phase 2: The Debate

### With subagents (preferred)

1. **Opening arguments.** Spawn one advocate subagent per option, all in parallel (a single message with multiple Agent calls). Give each advocate:
   - The decision and the full list of options
   - All grounding context from Phase 1
   - Its assignment: argue FOR its option, attack the alternatives, and stay concrete to this specific project and its constraints. Generic textbook arguments that would apply to any project are worthless here.
2. **Rebuttals.** Continue each advocate in its own context (e.g. via SendMessage), passing it the opening arguments of every other advocate. Each advocate must:
   - Rebut the strongest attacks on its option
   - Attack weaknesses in the opponents' actual arguments, not strawmen
   - Explicitly acknowledge the single strongest point an opponent made
3. Collect both rounds and proceed to the ruling.

### Fallback: single context

If subagents are unavailable, run the same rounds as personas in one response, in this order: every advocate's opening argument, then every advocate's rebuttal (including the mandatory acknowledgment of the strongest opposing point), then the ruling. Keep the advocates honest: each must engage with the grounding context, not generic tradeoffs.

## Phase 3: The Ruling

Jeff delivers the verdict in the main context. The ruling must contain, in order:

1. **Verdict**: one line, up front, naming the winning option (or a nuanced middle ground if the debate genuinely earned one).
2. **Decision criteria**: which criteria drove the ruling and why they matter for this situation in particular.
3. **Decisive arguments**: which arguments won and which impressive-sounding arguments were discounted.
4. **Cost of being wrong**: how reversible the choice is, and what it costs to back out later.
5. **What would flip this ruling**: the specific new information or changed circumstances that would change the verdict.
6. **Confidence and next step**: how confident the ruling is, and the single concrete next action the user should take.

## Output Format

Use clear headers for each round and speaker:

```
## Opening Arguments

**Advocate for [Option A]:** [argument]

**Advocate for [Option B]:** [argument]

## Rebuttals

**Advocate for [Option A]:** [rebuttal, including strongest opposing point acknowledged]

**Advocate for [Option B]:** [rebuttal, including strongest opposing point acknowledged]

## Ruling

**Jeff:**

**Verdict:** [one line]

[Decision criteria]
[Decisive arguments]
[Cost of being wrong]
[What would flip this ruling]
[Confidence and next step]
```
