---
name: design
description: Design direction and visual iteration for frontend work, with a browser preview board. Builds new pages and components with a committed point of view, shows alternative directions or variants as side-by-side live previews the user picks from, and puts a suggestion box in front of them after every update. Also critiques and refines existing UI. Use for "design this page", "redesign the hero", "show me some options", "give me variants of the pricing cards", "make this bolder", "calmer", "simpler", "fix the typography", "add color", "fix the layout", "critique this UI", "polish this screen", "this looks generic", or /design. When a request is about dialing in exact values by feel, it offers to hand off to the design-jig skill if that is installed. Do not use for backend work or for refactors that change nothing visible.
license: Apache-2.0
compatibility: The preview board needs Node.js 18 or newer and a browser on the same machine. Without them the skill presents options in chat instead.
metadata:
  author: ameistad
  version: "1.0.0"
---

# Design

Work the way a design director runs a studio review. Pin up a few real options, let the client point, take their notes, come back with the next round. This skill gives you that loop plus the craft rules that keep the options worth choosing between.

Three things make it different from just writing UI code:

1. **You decide a direction before you write code**, and the direction comes from the subject, not from your defaults.
2. **Choices are shown, not described.** Options go on a preview board in the browser as rendered pages the user can scroll, compare, and choose.
3. **Every update ends with a suggestion box.** After you change something visible, the user sees it on the board with a box for what to change next.

## How It Works

1. **Read the room.** Find the visual truth already in the project and the surface's mode.
2. **Route the request** to a flow in the table below and read its reference.
3. **Open a board** when there is a real choice to make: directions for new work, variants for an existing element.
4. **Take the answer.** A pick, suggestions for another round, or a request for different options.
5. **Build** the chosen thing in the real source, to the craft floor.
6. **Review round.** Show the result on the board with the suggestion box. Loop until approved.
7. **Close the board** and report.

## Step 1: Read the room

Before any design decision:

- Read `DESIGN.md` and `PRODUCT.md` if they exist. `DESIGN.md` wins on visual decisions, `PRODUCT.md` on product facts and voice.
- With or without those files, read the real thing: CSS custom properties, the Tailwind or theme config, loaded fonts, two or three representative components. A missing `DESIGN.md` does not mean there is no identity. If the code has a coherent look, that look is the authority.
- Name the surface's **mode**. It decides how much expression the work can carry:

| Mode | The visitor wants to | Examples | What wins |
|---|---|---|---|
| Persuade | decide and act | landing pages, marketing, pricing | a point of view, a clear offer, a visible action |
| Operate | finish a task | app UI, dashboards, settings, tools | scanability, consistency, familiar controls |
| Read | understand something | docs, articles, guides, changelogs | structure, measure, wayfinding |
| Experience | be inside the work | portfolios, galleries, showcases | the work itself, the interface recedes |

Pick the mode from the surface, not the product. A developer tool's landing page is Persuade. A fashion brand's help center is Read.

## Step 2: Route the request

| The user wants | Flow | Reference |
|---|---|---|
| A new page, screen, or a whole new look | New work: derive directions, board, build | [references/new-work.md](references/new-work.md) |
| Options for something that exists ("variants", "alternatives", "try a few") | Variants: three takes within the current identity, board, write back | [references/variants.md](references/variants.md) |
| One named move: bolder, quieter, simpler, typography, color, layout, motion, delight, polish | Move: apply the playbook to the named target | [references/moves.md](references/moves.md) |
| An opinion: "critique", "review", "what's wrong with this" | Critique: scored review, ranked issues, then ask what to fix | [references/critique.md](references/critique.md) |
| To dial in exact values by feel: "a bit rounder", "find the right green", "play with the spacing" | Offer the design-jig handoff | "Handing off to design-jig" below |

Read [references/craft-floor.md](references/craft-floor.md) immediately before any UI edit, in every flow. Do not load it for planning or critique alone.

If two flows fit, ask once. If the request is `/design` with nothing else, look at the project, suggest the two or three most useful things to do with one line of reasoning each, and wait.

## Rules that hold in every flow

- **The brief wins.** If the user pinned an aesthetic, a font, a palette, or a reference, honor it even where this skill warns against it. Steering a clear brief toward your own taste is a failure.
- **Refinement preserves. Redesign replaces.** Refining keeps the existing identity, copy, and behavior, and touches only the named target. A redesign keeps product truth and function but treats the old look as evidence, not authority. Never land in between by polishing a look the user asked to replace.
- **Scope is literal.** "Make the hero bolder" does not restyle the nav. If the existing system cannot express what is asked, name the exact addition you need and ask.
- **Do not invent facts.** Authoring demo content is fine and expected. Prices, customers, benchmarks, testimonials, and capabilities are claims: use real ones or label placeholders clearly and list them at the end.
- **Verify by looking.** Judge the rendered result at the sizes it ships at, not the code. Take screenshots when a browser tool is available and batch your fixes between looks.

## The preview board

The board is a local page that shows up to six options as scaled, scrollable previews with a description, palette, and tradeoff for each. The user can switch between desktop and mobile frames, expand any option, leave a note per option, write in the suggestion box, and then do one of three things. You get the result as JSON.

```bash
bash <skill-path>/scripts/board.sh start --payload <dir>/round-1.json --open   # prints {url, key}
bash <skill-path>/scripts/board.sh wait                                        # blocks until the user answers
bash <skill-path>/scripts/board.sh update --payload <dir>/round-2.json         # next round, same tab
bash <skill-path>/scripts/board.sh stop --message "Building Quay ledger."      # close when done
```

| The user | You receive | You do |
|---|---|---|
| chooses an option | `action: "pick"`, `optionId`, plus any `suggestion` and `notes` | Build that option. Treat the suggestion as tweaks to apply to it. |
| sends suggestions | `action: "revise"`, `suggestion`, `notes` per option | Rework the options as asked and `update` the same board. |
| asks for different options | `action: "reroll"`, optional `suggestion` as a steer | Deal new options. Never repeat one already shown. |

Read [references/board.md](references/board.md) before the first board of a session. It has the payload format, how to author previews, how to wait without stranding the tab, and the fallback when the board cannot run.

**When to open a board**

- New work with an open direction: always, with three directions.
- "Show me options" or "variants" on an existing element: always.
- After you finish a visible change in any flow: a review round (see below).

**When not to**

- The request is precise and has one reasonable outcome ("make the button 44px tall").
- The user said to just do it, or is clearly not at the keyboard.
- Critique alone. Nothing changed, so there is nothing to preview.

## The review round

After a build or a move lands in source, do not just say it is done. Put it in front of the user:

1. Make sure the dev server is running, or render the changed file to a standalone HTML preview.
2. Post a `kind: "review"` round: one card for the result, with `notes` listing what changed, and optionally a second card marked `"reference": true` showing the state before.
3. `wait`. On `pick` the user approved: stop the board and finish. On `revise`: make the changes in source, then `update` the board with a new review round whose notes say what you changed this time.

Reuse the board that is already open when there is one. If no board is open and the change is small, ask in chat instead: one line on what changed and where to look.

Stop after an approval, or when the user says so in chat. Always `stop` the board before your final message.

## Handing off to design-jig

The board is for choosing between designs. It is a poor tool for landing on an exact value: a color, a radius, a spacing step, a duration. For that, the user is better served by dragging a slider than by reading three more previews. The `design-jig` skill does this: it adds a temporary panel of live controls to the app, and writes the chosen values into the code when the user locks it.

**Notice when a request calls for it.** Typical signs:

- The request is about a value, not a design: "find the right shade", "how round should these be", "tune the animation".
- A board suggestion asks for degree: "a bit darker", "slightly tighter", "somewhere between A and B".
- A review round has gone two rounds on the same value without an approval. More rounds will not converge. A slider will.

Do not suggest it for choices between structures, for anything the user has already decided, or for a single obvious change you can just make.

**Check that it can be used.**

1. Is it installed? Look for `design-jig` in your list of available skills. If you cannot tell from that, look for a `design-jig` folder in the project's and the user's skill directories (for example `.claude/skills/`, `.agents/skills/`, `~/.claude/skills/`).
2. Does the project fit? `design-jig` supports React on the web (Vite, Next.js, CRA) and React Native (Expo, bare). In any other stack, do not offer it.

**Always ask before using it.** It edits the app to mount a panel, so it is the user's call. Ask one short question, and say what would be on the panel:

> These are small adjustments to the card radius and the accent color. I can add a temporary panel with a slider and a color picker so you can dial them in live, then write your values into the code. Want that, or should I make my best guess?

- **Yes:** finish or stop any open board round first so the user is not left with two things waiting on them. Then invoke `design-jig` with the specific values to expose and their current values. When the jig is locked and cleaned up, come back here and post a review round if the work is not yet approved.
- **No:** make the change yourself and continue with the normal review round.
- **Not installed, but the project fits:** do not install anything on your own. Mention it once, in one line, with the command: `npx skills add https://github.com/ameistad/agent-skills --skill design-jig`. Then carry on without it. If the user declines or ignores it, do not bring it up again in this session.

## Output Format

While a board is open, keep chat short: one line with the URL and what is on the board. No recap of the options, since the board shows them.

When the work is done, the final message has:

1. One line: what is ready and how to open it (dev server URL, command, or file path).
2. The direction that was built, in a sentence, and which suggestions were applied.
3. What was verified by looking, and at which sizes.
4. Anything left open: placeholder claims to replace, findings you did not fix, decisions that are the user's.

For a critique, the report format is in [references/critique.md](references/critique.md).

## If the board cannot run

`start` exits with code 2 when Node.js is missing or the server cannot bind a port. Do not retry. Say in one line that the preview board is unavailable, then present the same options in chat: a name, a two-sentence description, the palette as hex values, and the tradeoff for each, plus the path of each preview file so the user can open it directly. Ask which one to build and what to change. The rest of the flow is unchanged.
