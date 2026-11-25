# Moves

Named ways to change an existing surface. Each one refines inside the established identity. If a move would need a new identity, that is new work: say so and route to [new-work.md](new-work.md).

For every move:

- Touch only the named target. Its neighbors stay as they are.
- Add no color, font, radius, shadow, or system primitive the surface does not already own, unless the user approves the exact addition.
- Keep existing claims and factual copy.
- Read [craft-floor.md](craft-floor.md) before editing, look at the rendered result after, then post a review round.

When a move is run as variants, each variant varies a different dimension of it. The last line of each section says which.

## Contents

bolder, quieter, distill, typeset, colorize, layout, animate, delight, polish

## bolder

Raise one part to the conviction the rest of the page already implies. More effects is the reflex answer and the opposite of bold.

- **Find why it reads flat.** Usually the section opts out of what its neighbors do well: the display type at full strength, the structural devices, the signature motif, the pacing. Bring it up to their level in the system's own vocabulary.
- **Amplify what the system owns.** The bolder version looks more like the same brand, not less.
- **Commit, then clarify.** Make one decisive move completely, then quiet what surrounds it. If every element got louder, the section got flatter.
- **Give it its own rhythm.** It should read as a peak in the scroll, not more of the same.
- **Skeleton test.** Remove the copy. Does the bare structure still say what this section is and why it matters? If it only works with the words back, the boldness is font size, not design.

Variants: amplify a different dimension in each (scale, saturation, structure).

## quieter

Reduce intensity without going generic. Quiet needs more precision than loud.

- **Find the source of the noise:** saturation, too many heavy elements, contrast extremes, motion, decoration, or everything being large.
- **Persuade and Experience:** fewer colors, more air, calmer type. The point of view stays.
- **Operate and Read:** fewer background accents, flatter containers, less color and motion. The tool disappears into the task.
- **Color:** pull saturation back, let neutrals carry more, keep high contrast only where it matters, use tinted grays, and never put gray text on a colored ground (use a darker shade of that color).
- **Weight:** step font weights down, thin or remove borders, build hierarchy from size and space.
- **Effects:** remove gradients, glows, stacked shadows, and decorative blur. Shorten motion distances and drop anything that bounces.
- **Do not** flatten everything to one size, remove all color, or weaken the affordance of real controls. A few anchors stay strong.

Variants: pull back a different dimension in each (color, ornament, spacing).

## distill

Remove what does not earn its place.

- **Find the essence.** What is the one thing this surface is for? What is necessary and what is merely present?
- **Information:** one primary action, a few secondary ones, the rest hidden until needed. Say each thing once.
- **Visual:** one or two brand colors plus neutrals (keep semantic colors, each with a non-color cue), one family, three or four sizes. Remove borders, shadows, and backgrounds that carry no hierarchy. Flatten nesting. Cards are not needed for layout: use spacing and alignment.
- **Layout:** prefer a linear flow, one alignment, one spacing scale.
- **Interaction:** fewer choices, smart defaults, inline editing instead of modals, one fewer step.
- **Copy:** cut filler, not meaning. Active voice. No heading that restates the paragraph under it.
- **Do not** remove function, accessibility labels, or information people need to decide. Mystery is not minimalism.

If you removed a feature or an option, list it in the review round so the user can veto.

Variants: remove a different class of excess in each (visual noise, redundant content, nested structure).

## typeset

Typography carries information, hierarchy, and voice.

Assess first, with a file, selector, or computed value for each answer:

- **Fit:** which faces, weights, and roles exist? Are they chosen or just defaults? Is every family needed?
- **Hierarchy:** can heading, body, label, metadata, and data be told apart at a glance? Are adjacent sizes too close to mean different things?
- **Scale:** a deliberate role scale, or a pile of one-off values?
- **Reading:** body within 45 to 75 characters? Line height, tracking, and contrast tuned to the face and surface?
- **Stress:** long headings, translation, zoom, narrow containers, missing weights, font fallback.

Then apply:

- State the roles the interface needs and the contrast between them. Use the fewest roles and families that make hierarchy unmistakable. Name tokens by purpose.
- Persuade and Experience: display type may carry the voice, with decisive contrast and fluid sizing. Operate and Read: one well-tuned family, a fixed rem scale with a tight ratio (1.125 to 1.2).
- Body at 16px or more on the web. Tune line height to the measure: wider lines need more leading.
- Light text on dark needs slightly more line height, a touch more tracking, and sometimes one step more weight.
- `text-wrap: balance` on headings and short centered blocks, `text-wrap: pretty` on body copy. Break a heading by hand only between phrases, and check it at every width.
- Tabular numerals for data. Load only the weights in use, with metric-matched fallbacks.
- No second family without a job only it can do.

Variants: keep the faces and vary scale ratio, case, and weight in each. In a departure, vary the pairing and the scale.

## colorize

Color as hierarchy, meaning, and atmosphere.

- **Audit first:** confirmed brand colors, current roles for surface, text, action, and status, places where gray hides hierarchy or state, contrast failures, and anything communicated by color alone.
- **Choose a strategy** (restrained, committed, full palette, drenched) and a temperature before picking values. Persuade and Experience may let color own large regions. In Operate and Read color mostly encodes action, selection, status, and wayfinding, and rarity gives an accent its force.
- **Build roles, not swatches:** canvas and raised surfaces, primary and secondary text, action, focus and selection, borders, status colors, data categories.
- Let the strongest color own one deliberate region or role. Do not spend the primary action's color on decoration.
- On colored surfaces, derive secondary text from the surface hue or the foreground, never generic gray.
- Dark mode is composed on its own, not inverted.
- For new palettes on the web, work in OKLCH: vary lightness, and reduce chroma near white and black.
- **Contrast:** body text 4.5:1, large text 3:1, controls, icons, and focus indicators 3:1. Check states, overlays, text on images, and both themes. Anything coded by color also needs text, shape, or position.

Variants: let a different existing palette role carry the surface in each, with a different contrast strategy. In a departure, a different hue family in each.

## layout

Turn product priority into reading order, grouping, and rhythm. Diagnose before moving boxes.

Assess:

- **Squint test:** with detail blurred, can you find the primary element, the secondary one, and the major groups, in order?
- **Grouping:** are related items close and groups separated, or are boxes compensating for weak proximity?
- **Rhythm:** tight and generous intervals in a deliberate cadence, or one spacing value repeated until everything weighs the same?
- **Structure:** does the topology match the content? Are those repeated cards truly equivalent, or a framework default?
- **Density:** does it fit how often this is used and how hard the decision is?
- **Adaptation:** at narrow, medium, wide, and zoomed sizes, what reorders, collapses, or wraps? Does focus order still match visual order?

Apply:

- Name the primary path, what belongs together, what leads, and how it changes across sizes. Choose the simplest structure that expresses that.
- Group by proximity before adding containers. Create rhythm with contrast between tight and generous.
- Use a spacing scale, not one-off values. A 4-unit base gives the middle steps an 8-only scale lacks.
- Responsive behavior is structural: reorder, collapse, reveal. Prefer container-aware components. Use `gap` for sibling rhythm.
- Persuade and Experience may be asymmetric when the world earns it. Operate and Read want predictable structure and stable density.
- Variation is not a goal. Break repetition only where content or priority changes.

Variants: a different structural arrangement in each, not spacing tweaks.

## animate

Motion that explains state, relationship, or hierarchy, or one authored moment the surface has earned.

- **Find the job.** Animate only where motion acknowledges an action, makes a state change legible, preserves continuity, directs attention at a meaningful moment, or embodies the page's world. Do not animate an area because it is static.
- **Write a motion plan:** the one focal moment (if any), the continuity needs, the feedback needs, and the performance budget. A fade-and-rise, a hover lift, or a scroll reveal is not a plan.
- **Persuade and Experience:** one rehearsed sequence beats repeated section reveals. **Operate and Read:** 150 to 250ms, state and feedback only, no page-load choreography.
- **Timing:** 100 to 150ms for immediate feedback, 150 to 300ms for state changes, 300 to 500ms for layout and overlays, 500 to 800ms for a deliberate entrance. Exits are faster than entrances. Ease out with something like `cubic-bezier(0.16, 1, 0.3, 1)`. No bounce by reflex.
- **Material:** transform and opacity are the base, not the whole palette. Clip paths, masks, blur, and view transitions are available when they stay smooth and mean something.
- **Hover:** the hovered element stays put and a child moves. An element that moves itself slides out from under the pointer and flickers.
- **Robustness:** content is visible by default so a failed script hides nothing. Avoid animating layout properties. Loops stop when offscreen.
- **Reduced motion:** every animation has a `prefers-reduced-motion` path that removes spatial movement and keeps the feedback.

Variants: a different motion vocabulary in each (staggered cascade, clip wipe, scale and focus, morph).

## delight

Personality at moments that earn it. Not a layer of whimsy.

- **Find the opportunity:** effort worth acknowledging, a wait that could inform, an empty or first-use state that could orient, an error that needs empathy, an interaction whose response could express the brand.
- **One thesis.** One sentence on what the user should feel and why that feeling belongs to this product. Then the smallest thing that delivers it.
- **By moment:** success scales with effort (a routine save just feels certain). Waiting shows truthful progress, never faked. Empty states make the next action clear before adding personality. Errors lead with the problem and the fix, and never joke about loss, money, or privacy.
- **It must survive the hundredth use.** It never delays or blocks the task, breaks platform conventions, plays sound without consent, or adds a dependency out of proportion to the moment.
- **Specificity test:** a neighboring product could not use it unchanged.

Variants: a different kind of personality in each (micro-interaction, typographic surprise, illustrated accent, a discoverable extra).

## polish

The last pass before shipping. Refinement only. If the concept is wrong, say so and recommend a redesign or `bolder` instead of sneaking one in.

1. **Establish the system.** Read tokens, shared components, and neighboring flows. Classify each drift before fixing it: a missing token, a one-off that should use a shared component, a mismatch with how comparable areas work, or a plain local defect. Fix the cause at the narrowest correct level.
2. **Use the feature** at desktop and mobile sizes, with mouse and keyboard.
3. **Triage in this order:** broken or blocked tasks and misleading state, missing loading, empty, error, success, and disabled states, flow, hierarchy, and responsive drift, visual and motion inconsistencies, then code cleanup. Do not perfect one corner while the rest sits below the same bar.
4. **Fix the whole path:**
   - Alignment, optical as well as mathematical. Same-role type identical everywhere.
   - Every control has default, hover, focus, active, disabled, loading, and error behavior.
   - Contrast in every state. One icon family at one weight. No layout shift from images.
   - Long, missing, and translated content does not break anything.
   - Terminology, capitalization, and punctuation are consistent. Ask before changing a claim.
   - Remove debug output, dead styles, and duplication the pass itself created.
5. **Verify** by walking the path again, then read the source diff and remove accidental churn.

Variants: a different refinement axis in each (rhythm, hierarchy, micro-details).
