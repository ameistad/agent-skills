# New work

For a new page or screen, or a replacement look. The goal is a direction the user chose from real previews, built with full commitment.

## 1. Decide what is already true

Read `DESIGN.md`, tokens, representative components, and assets, then place the request in one of these:

- **Extension.** A section, component, or state inside a surface that already has a look. Inherit that look. No directions round. Go to step 6 and resolve only the new content, hierarchy, and states. Never turn a local addition into an identity exercise.
- **New surface, established world.** A whole new page inside an existing identity. The visual system is fixed. What is open is structure. Run steps 2 to 4 with **structures** instead of worlds: derive five to seven materially different compositions from the content and the task, and put three on the board.
- **New world.** No coherent identity exists, or the user asked for a redesign. Everything below applies. In a redesign, keep product truth, content, function, and explicit brand commitments. The old look tells you what the subject is. It has no say over what it becomes.

If the user or the brief pins the whole direction in words you can quote (the world and what the first screen does), there is nothing to choose. Confirm it in one line and go to step 5.

## 2. Ask what will change the work

Ask two or three questions, in one round, before designing. Use a structured question tool if you have one. A precise request needs only a short confirmation of how you read it.

Pick by mode:

- **Persuade:** who must act, what they should believe, which real proof or assets earn that belief.
- **Operate:** the task, the information, the states that matter, how often it is used.
- **Read:** the reader's question, the source material, how they find their way.
- **Experience:** what leads, how exploration unfolds, which interaction matters.

In any mode: what does success look like, what must stay untouched, and what would make a polished result feel wrong.

Never ask for CSS values, colors, or a pick from canned styles like "minimal or playful". And do not float a look of your own in these questions. A direction named in a question is the one the answer confirms.

If the brief does not say what the product or subject is, work it out and state it as a proposal: one concrete subject, its audience, and the page's main job.

## 3. Derive directions from the subject

Distinctive choices come from the subject's own world: its industry, materials, vocabulary, and the things its audience already knows by heart. A page for a children's toy and a dashboard for analysts should share almost nothing.

1. **Name the mechanism.** One sentence on what is uniquely true of this product, the audience's real scene, and what this first surface must prove.
2. **Name the rut.** Write down the page this category always ships, and its predictable opposite. Both are out. If the brief contains an obvious picture (a product name, a metaphor), its literal reading is part of the rut too. Spend at most one candidate on it.
3. **List seven candidates.** Concrete visual systems, artifacts, places, or rituals from the audience's world, each with one line on why it fits and one on how it looks: its ground and main colors, its type voices, the one signature that makes it recognizable. Include graphic and screen traditions (notation, publications, identity programs, data graphics), not only physical objects. Ask what this thing would look like as a physical object, and what its world looked like before the web.
4. **Check the spread.** Near-duplicates count once. If more than three share a material family, you stopped at the obvious artifact. Dig until the list spans three families.
5. **Turn candidates into directions.** Each direction joins a visual world to a concrete first screen: what is where, at what scale, and where the main action sits.

Every direction must be viable before it reaches the board: every claim true, a real palette, a distinctive composition, buildable with the assets and tools at hand. Replace a candidate that fails on truth. Do not refuse a bold one because its demo content does not exist yet. Authoring that content is part of the job.

### What the mode allows

- **Persuade and Experience.** The world may own and structure the page. Its material is the ground and the major surfaces, and its type sets the headlines. A world reduced to an accent color on a standard template is the category default with a sticker on it. But the page still has to work as a page: navigation reads as links, the offer is intelligible in one line, and the main action is unmistakable in its working form (a real search, a real booking control, a real add to cart).
- **Operate.** Someone who uses tools like this should know where everything is before they notice the world. The world lends four things only: type, palette, density, and one signature move. It never supplies the layout, the navigation model, or the controls. Controls are the standard ones people already know. A terminal's command bar or an instrument's bezel on a working screen is a costume. Color still does real work: a committed shell, states, data series, selection. A gray screen with one accent is not restraint.
- **Read.** The world owns the frame: masthead, navigation, ground, title and section openers, and how code, tables, and callouts are set. The reading column stays calm: a reading face, real contrast, a real measure, nothing performing behind the text. Documentation still reads as documentation.

## 4. Put three on the board

Do not present the three you rank highest. Your ranking is where the sameness comes from. From your seven, take your first choice, then pick the other two at random from the rest (roll for it, for example `echo $((RANDOM % 6))`), and replace a pick only if it fails the viability test above.

Write one preview per direction, following [board.md](board.md): the real first viewport and the start of the section below it, real content, each in its own palette and type, committed all the way. Fairness between cards means equal fidelity, each in its own grammar. It does not mean equally unfinished.

Each card carries: `name`, `summary` (the thesis in a sentence), `palette`, `fonts`, and `risk` (the honest tradeoff, including "this is the familiar one" when that is true).

If the user asks for the safe option, give them the category standard played straight and at full quality, without irony and without a smuggled quirk. Familiar and effective is a legitimate choice. It is theirs to make, never yours to recommend, and it never softens the other cards.

Post the round, wait, and handle the answer as [board.md](board.md) describes.

## 5. Commit the world

With a direction chosen, write a short plan before code.

**Color.** Choose a strategy before choosing colors:

- *Restrained:* neutrals tinted from the world plus one accent. Common on Operate and Read.
- *Committed:* one saturated color carries 30 to 60 percent of the surface.
- *Full palette:* three or four named roles.
- *Drenched:* the surface is the color.

Persuade and Experience surfaces have permission for the bolder strategies. Color commits at page scale: fields that own whole regions, not accents sprinkled on a neutral ground. Light or dark is never a default. Write one sentence of physical scene (who uses this, where, under what light) and let it decide. Then name four to six hex values with a role for each.

**Type.** Choose faces like objects from the subject's world. One family or two. If two, make them clearly different. Operate and Read are well served by system stacks and workhorse UI faces. Persuade and Experience want faces with a point of view, and reaching for one of these means you stopped looking: Fraunces, Playfair Display, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk, Space Mono, IBM Plex, Inter as a display face, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans. A subject association (books want a serif, tech wants a mono) is not a reason. Set a clear scale with intentional weights and spacing. When type is the headline, make the treatment part of the design, not a neutral container for words.

**Layout.** One sentence for the concept and a quick ASCII wireframe of the first viewport. State the alignment.

**Principles.** Two or three lines on what makes this page this page.

**Then check the plan against the default.** AI-generated interfaces cluster around a few looks whatever the subject:

1. Warm cream ground, high-contrast serif display, terracotta or clay accent.
2. Near-black ground with one neon or acid accent and glowing edges.
3. Broadsheet layout: hairline rules, zero radius, italic display serif, small tracked mono labels.
4. The SaaS card kit: content chopped into identical rounded cards, one radius everywhere, the same soft gray shadow, gradient washes.
5. Flat saturated ink, black boxes, hard offset shadows, heavy condensed type.

All are legitimate when the brief asks for them. Where the brief left the look open, landing on one means the plan is a default wearing the subject's clothes. The test: could someone guess this aesthetic from the category alone? If yes, revise that part, and say what you changed and why. A warm, bookish, or child-facing subject does not excuse cream and a serif. Its world has a full range of saturated materials.

## 6. Write the direction contract

Keep this in the conversation or the session folder. Five short blocks, about 120 words in all:

- **THESIS:** the one idea this surface owns, and the category default it refuses.
- **WORLD:** palette and component language, specific enough to recognize with the content removed.
- **STORY:** what the visitor understands, believes, and does.
- **FIRST VIEWPORT:** the exact composition. What is where, at what scale, where the action sits.
- **SIGNATURE:** the one interaction or motion moment that belongs to this page.

If a block reads like a mood, the direction is not decided yet. Never copy the contract into source, comments, hidden DOM, or anything the browser receives.

## 7. Build with full commitment

Build the chosen direction, not a safer reading of it. Read [craft-floor.md](craft-floor.md) first.

- **Commit every atom.** Navigation, buttons, inputs, and links are rebuilt in the direction's vocabulary. A stock component inside a committed page is a lapse.
- **The first viewport is a thesis, not a header.** Show the mechanism right away, at real scale. The memory test: if someone left after one screen, what would they describe an hour later? If the honest answer is a mood, it has not committed.
- **Prove, do not claim.** Show the subject doing its job: the interface at work, specifics a competitor could not paste in.
- **Author the assets.** Names, entries, copy, covers, thumbnails. Every blank the brief left is yours to fill at production quality. Gradients, glass, and generic icon tiles where real content belongs are the gap wearing decoration.
- **Spend boldness in one place.** One element is the memorable thing. Everything around it is quiet and disciplined.
- **Pace the scroll.** Vary density, scale, image, and quiet inside one grammar. One spacing rhythm throughout. End on a real close.
- **Motion is one authored moment,** not a fade-up on every section.
- **Keep the floor:** semantics, accessibility, responsiveness, performance, and the project's conventions.

Watch CSS specificity as you write. A section class and an element class often fight over the same padding or margin, and one silently cancels the other.

## 8. Inspect, then review with the user

Look at the result at the sizes it ships at, in one capture pass per size. Settle or disable entrance animation first, or a hidden element will read as a missing one. On anything interactive, also drive each state: open, closed, hover, focus, error, empty, overlong content.

Walk the contract against what you see. Does the first viewport match? Does every action the STORY promises have a working control? Fix material gaps in one batch, then look once more. Then remove one thing: before shipping, find the decoration that serves nothing and cut it.

Then post a review round ([board.md](board.md), section 7) so the user can approve or send changes.

## 9. Offer to record it

After approval of a new world, offer once to write `DESIGN.md` from what was actually built: colors with roles, type roles and scale, layout rules, component character, and a short list of do and do not. Write it only on a yes. A rulebook written before the build ends up defended against reality, so it comes last. Extensions never rewrite `DESIGN.md`.
