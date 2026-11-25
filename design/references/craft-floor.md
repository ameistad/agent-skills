# Craft floor

Read this right before any UI edit, once the direction is settled. Build to it without announcing the checklist. A pinned brief or the committed direction overrides anything here except the one line marked as a ban. Your own habit does not.

The floor holds the mechanics. It never picks the direction.

## Verify

Each of these is a check on the built result, not an intention. Run them together on one look at the render, not as separate trips.

- **Contrast:** body and placeholder text at 4.5:1 or better, large text at 3:1. On colored surfaces, tint secondary text from that hue or from the foreground. Never gray.
- **Depth:** shadows have an offset and a soft blur. A zero-offset colored glow is decoration.
- **Spacing:** tight inside groups, generous between them, more space above a heading than below it. Read the computed values.
- **Type:** body measure of 65 to 75 characters (up to 80 at most), display size capped near 6rem, tracking no tighter than -0.04em, balanced headings, obvious steps in scale and weight. Serif body gets slightly more line height than sans. Run the real copy at every breakpoint and fix what overflows.
- **Motion:** one authored moment. Not scattered effects, and not the same entrance on every section. Ease out from a default state that is already visible. Motion that answers the user's action is welcome when it shows what changed.
- **States:** hover, focus, active, disabled, loading, error, empty. Real content, working controls, keyboard focus you can see.
- **Responsive:** composed down to a phone, not just shrunk.
- **Reduced motion** is respected.
- **Browser surfaces:** the parts you did not draw still carry the design. Text selection, the caret, scrollbars, focus rings, underline offset, and numerals in tables ship with browser defaults that belong to no design system. Theme them from the palette. This is the cheapest sign that a page was built rather than assembled.
- **Copy:** in the product's own language. See "Words" below.
- **Coverage:** every requirement in the brief is present and can be found within seconds.

## Refuse

These are the category's defaults. They are not bans: the brief's own words can earn any of them. But reaching for one when the choice was open means you were not deciding. When you catch one, rewrite the element. Do not soften it.

Page scaffolds:

- Same-size cards of icon plus heading plus text as the page structure. Cards are the lazy container. Cards nested in cards are always wrong.
- The hero-metric template: big number, small label, supporting stats, gradient accent.
- **A kicker or eyebrow label above a heading. This one is a ban.** The heading carries its own weight. Delete the label.
- Section numbers (01 / 02 / 03) when the content is not actually a sequence.
- A modal for a task that needs neither interruption nor protected focus.

Type habits:

- One word or phrase in a headline set in italic, bold, or a different color.
- All caps for labels.
- Monospace as a costume for "technical" rather than for code, data, or measurement.
- A system display face (Impact, Arial Black) as the display voice of a page with its own world.

Surface habits:

- Gradient text. Emphasis comes from weight or size.
- Glass and blur as decoration rather than as a specific effect.
- A colored bar down one side of a rounded box. Use a full border, a tint, or a leading icon.
- Hard offset shadows (`4px 4px 0`) outside a world that is actually brutalist.
- One border radius and one soft gray shadow on everything regardless of hierarchy.
- Sparklines, progress rings, and rounded rectangles standing in for content.
- Emoji or Unicode glyphs as an icon system. Icons are drawn, from one library or as authored SVG, at one stroke weight.
- Meta strings joined with middle dots, an arrow appended to every link and button, and tinted near-black standing in for black.
- Light or dark chosen by category. Choose it from the scene of use: who, where, under what light.
- Fade-and-slide-up on every section and a hover transition on every card.

Structure is information. Outlines, borders, numbering, dividers, and labels should encode something true about the content. If one is only there to decorate, remove it.

## Words

Words are in a design to make it easier to understand and use. They are content, not decoration, and generic copy makes a design feel as templated as generic layout does.

- **Write from the user's side.** Name things by what people understand, not by how the system is built. A person manages notifications, not webhook config.
- **Say what it is.** Describe what something does in plain terms rather than selling it. Specific and legible beats clever.
- **Active voice.** A button says exactly what happens: "Save changes", not "Submit".
- **One name per action** through the whole flow. The button that says "Publish" produces a message that says "Published".
- **Errors and empty states give direction.** Say what went wrong and how to fix it, in the interface's voice. Errors do not apologize and are never vague. An empty screen is an invitation to act.
- **Plain verbs, sentence case, no filler.** Each written element does one job.
- **Do not add labels above content that the content already explains.**

## Before you call it done

Look in the mirror and remove one accessory: find the decoration that serves nothing in the brief and cut it.

Then, when torn between a refined version and a committed one, commit.
