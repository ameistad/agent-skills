# adversarial-debate

A skill that simulates a structured debate between three personas to help you make better decisions on difficult tradeoffs.

## The Idea

When facing a tough decision, it's easy to fall into confirmation bias. This skill forces consideration of both sides by running a full adversarial debate with:

- **Albert**: Argues FOR the proposal
- **Bart**: Argues AGAINST the proposal
- **Jeff**: The judge who delivers a reasoned ruling

Inspired by Kent C. Dodds.

## Installation

```bash
npx @anthropic-ai/claude-code skills add https://github.com/ameistad/agent-skills --skill adversarial-debate
```

## Usage

Activate the skill by telling your AI agent:
- "Help me decide"
- "Weigh the options"
- "Debate this"
- "Pros and cons"
- `/adversarial-debate`

The agent will ask what decision you're facing, then run a full debate:

1. Opening arguments from both sides
2. Two rounds of rebuttals
3. Final statements (each side must acknowledge the opponent's strongest point)
4. Jeff's ruling with clear reasoning

## Example

You ask: "Should we use a monorepo or multiple repos for our microservices?"

The agent runs the full debate, with Albert arguing for monorepo, Bart arguing for multiple repos, and Jeff delivering a verdict that explains which arguments were most compelling and why.

## When to Use

This works well for:
- Architectural decisions with real tradeoffs
- Technology or framework choices
- Design decisions where reasonable people disagree
- Any decision you want to stress-test

Skip it for trivial decisions or when there's an obviously correct answer.

## License

MIT
