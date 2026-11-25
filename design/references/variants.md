# Variants of an existing element

For "show me options for the pricing cards", "three takes on this hero", "try a few alternatives". The surface exists and the brand is already chosen. The job is variation **within** that identity, not a choice between identities. The worst outcome is three off-brand options the user cannot accept.

## 1. Parse the request

- **Count.** A number in the request is the count. No number means three. Cap at six.
- **Target.** Resolve the element to its source file and its place on the page. If the request names a repeated component in the plural ("the pricing cards"), the target is the container holding the set.
- **Direction.** Map the wording to a move in [moves.md](moves.md):

| Wording | Move |
|---|---|
| bold, stronger, punchier | bolder |
| quiet, calmer, softer, toned down | quieter |
| simpler, minimal, stripped | distill |
| refined, tightened | polish |
| font and type words | typeset |
| color words | colorize |
| arrangement and spacing words | layout |
| motion words | animate |
| playful words | delight |

Wording that carries intent but no move ("make it feel like a bank", "warmer", "more premium") is freeform: use it as the prompt. If a move fits and extra intent rides along ("bolder, but keep it monochrome"), use the move with the rest as the prompt.

If the wording names no direction at all ("better", "nicer", "some options"), ask one question offering the moves above, then continue. "You pick" is freeform.

## 2. Lock the identity

Not skippable. Sources, in priority order: `DESIGN.md`, CSS custom properties, computed styles on the element and its parent, and how sibling components look.

Write one sentence recording what is actually on screen: the dominant surface color and the accent (real values, not "warm"), the loaded font pairing, the layout topology (stacked, side by side, grid, asymmetric, overlay), the surface treatment (corners, borders, shadows, how much decoration), and the tone of the copy. Be specific. Skip an axis rather than invent one. Do not name an aesthetic family: that is a conclusion, not data.

This sentence is the identity lock. Side by side, every variant must read as the same brand.

## 3. Default or departure

- **Default** keeps the identity and varies expression inside it. Right about nine times in ten.
- **Departure** rejects the identity. Use it only when the current request says so in plain words: "redesign this", "start from scratch", "something completely different". An old note or a past critique is not permission.

When unsure, choose default. Getting default wrong costs three on-brand options with a similar feel, which is recoverable. Getting departure wrong costs three options nobody can use.

## 4. Plan the variants

**Default mode.** Each variant commits to a different primary axis and keeps the identity sentence true:

1. **Hierarchy:** which element commands the eye.
2. **Layout topology:** stacked, side by side, grid, asymmetric, overlay.
3. **Typographic system:** scale ratio, case, weight, pairing logic, within the faces already loaded.
4. **Color strategy:** which existing palette role carries the surface (restrained, committed, full palette, drenched). Existing tokens only.
5. **Density:** minimal, comfortable, dense.
6. **Structure:** merge, split, or progressively disclose.

Three variants, three different axes: the same brand from three angles. New fonts, new hues, and new aesthetic signals belong to departure only.

**Departure mode.** Each variant anchors to a different direction derived from the product, never from a fixed catalog. Read the brand's personality from `PRODUCT.md` or the copy, derive physical or material experiences that embody it, and from those derive directions that differ from each other and from the current surface. Each direction is one concrete sentence naming a real-world referent: "a museum exhibition label system", not "clean and minimal".

**With a named move,** vary along that move's own dimension. [moves.md](moves.md) says how for each one.

**With a freeform prompt,** the prompt is the user's ceiling on direction, and every variant honors it while reading it differently. In default mode it narrows the axes, not the identity: "more confident" could become one variant that amplifies hierarchy, one that commits the accent color, and one that tightens density.

## 5. Squint test

Before writing previews:

- **Default:** hold each plan against the identity lock. Drift in palette, type voice, or tone means it crossed into departure by accident: rework it. Then confirm the three primary axes differ. Three "tighter density" variants is a failure.
- **Departure:** give each variant a one-word family label of your own. Shared or interchangeable labels mean rework. Then read the three one-line descriptions together. Two that rhyme mean rework. If the main axis is color, the three must not share a theme and a dominant hue: three color worlds, not three shades.

## 6. Write the previews

Follow [board.md](board.md), section 3, plus:

- Each variant is a **complete replacement** of the element, not a CSS patch described in words.
- Render it inside a slice of its real page: the section above and below, the real container width, the real background. An element floating on white lies about scale and contrast.
- Use the project's real tokens, fonts, and copy. Do not rewrite factual copy to make a layout work. If a variant needs different words, say so in its `risk`.
- Set `axis` on each option so the user sees what differs.
- If you can capture the current state, include it as a card marked `"reference": true` and named "Current".

Post the round with `kind: "variants"` and wait.

## 7. Write the choice into source

On `pick`:

1. Apply any `suggestion` to the chosen variant first.
2. Read [craft-floor.md](craft-floor.md), then implement the variant in the real source, in the project's own idiom. Styles go in the stylesheet or utility classes that already own this element, with real selectors. Markup changes go in the component or template that renders it, not in a generated file.
3. Reuse existing tokens. Promote a value to a token only if it is used more than once.
4. Leave nothing from the preview behind: no inline style blocks, no preview-only class names, no copied boilerplate.
5. Look at the real page at desktop and mobile widths and fix what the preview hid.
6. Post a review round with the running page as the result and "Before" as the reference.

On `revise` or `reroll`, follow [board.md](board.md), section 6. Nothing in source changes until there is a pick.
