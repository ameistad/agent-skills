# design

A design skill that works like a studio review. The agent decides a direction before it writes code, shows you real options side by side in your browser, and gives you a suggestion box after every update.

- **Preview board.** Directions for a new page, or variants of an existing component, appear as live, scrollable previews with a desktop and mobile toggle. Choose one, send notes for another round, or ask for different options.
- **Suggestion box on every update.** When a change lands in your code, the board shows the real page next to how it was, with a box for what to change next.
- **Direction from the subject.** New work starts from the product's own world instead of the looks every AI-built page converges on.
- **Named moves.** Bolder, quieter, distill, typeset, colorize, layout, animate, delight, polish.
- **Critique.** A scored review with ranked issues and a plan.

The board is one zero-dependency Node script. It installs nothing into your project and writes its files to a temp folder.

## Installation

```bash
npx skills add https://github.com/ameistad/agent-skills --skill design
```

Requires Node.js 18 or newer for the preview board. Without it, the skill presents options in chat.

## Usage

Ask for design work in plain words, or call it by name:

```
/design design a landing page for the bakery
/design show me three variants of the pricing cards
/design make the hero bolder
/design critique the onboarding flow
/design polish the settings screen
```

Other phrases that trigger it: "redesign this", "give me some options", "this looks generic", "make it calmer", "fix the typography".

For dialing in an exact value by feel (a color, a radius, a duration), the skill works with [design-jig](../design-jig). When a request calls for it and design-jig is installed, the agent asks whether you want a temporary panel of live controls instead of more preview rounds. It never adds one without asking.

## Examples

**New page.** You ask for a landing page. The agent asks two or three questions about who it is for and what it must prove, derives directions from the subject, and opens a board with three of them. You pick "Quay ledger" and type "use the yellow from Oven door as the accent". The agent builds it, then shows the running page on the board. You write "headline smaller on phones", it fixes that and shows you again. You approve.

**Variants.** You ask for options on the pricing cards. The agent records what the current identity is, then shows three takes that each change one thing (layout, hierarchy, density) while staying on brand, next to the current version. Your pick is written into the real stylesheet and component, with nothing from the preview left behind.

**Critique.** You ask what is wrong with a screen. You get a heuristic score, the three to five issues that matter most with a fix for each, and a question about which to tackle first.

## The board on its own

```bash
bash scripts/board.sh schema                       # payload format
bash scripts/board.sh start --payload round.json --open
bash scripts/board.sh wait                         # prints the answer as JSON
bash scripts/board.sh update --payload round-2.json
bash scripts/board.sh stop
```

The server listens on 127.0.0.1 only, behind a random key in the URL, and shuts down after four hours without activity.

## Credits

The design flows are adapted from [Impeccable](https://github.com/pbakaus/impeccable) by Paul Bakaus and from Anthropic's [frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) skill. See [NOTICE.md](NOTICE.md). The preview board is original to this skill.

## License

Apache-2.0. See [LICENSE.txt](LICENSE.txt).
