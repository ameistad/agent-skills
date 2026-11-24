---
name: design-jig
description: Adds a temporary "jig" to a React or React Native UI. A jig is a dev-only panel of color wheels, sliders, toggles and variant pickers that updates the UI live so the user can tune design values by feel. When the user locks it, the skill writes the chosen values into the code in the project's own style and removes every trace of the panel. Use when the user wants to explore or fine-tune visual values: "make a jig", "add a tweak panel", "let me tweak the colors", "explore background colors", "add sliders for spacing / radius / font size", "give me a color picker for this", "try a few layout variants", "dial in the animation". While a jig is active, also use it for "lock it", "bake it in", a pasted JIG LOCK payload, or "discard the jig". Supports React web (Vite, Next.js App and Pages Router, CRA) and React Native (Expo, Expo Router, bare). Ships zero-dependency panel templates and installs no packages. Do not use for value changes the user has already decided, or to build a permanent settings screen.
---

# Design Jig

Code is a poor medium for judging a color or a corner radius. Maggie Appleton (The Pragmatic Engineer, "Design Engineering with Maggie Appleton") builds "jigs": throwaway controls for exactly the values she is unsure about. She tweaks them live, then commits what she lands on. This skill does that in four steps:
1. Copy a ready-made panel into the app.
2. Wire it to the values the user wants to explore.
3. When the user presses **Lock**, write the chosen values back as if a person had typed them.
4. Delete everything the jig added.

The jig is scaffolding. It never ships, it never gets committed, and when it is gone the diff contains only the design decision.

## How It Works

1. **Scope**: pick the few values worth exploring.
2. **Install**: `add-jig.sh` copies the panel into a single `__jig__/` folder and writes a ledger.
3. **Wire**: point each value at the jig with a small override that leaves the original code intact, then mount the panel.
4. **Tune**: the user drags, picks and toggles. The UI updates live.
5. **Lock**: the user presses Lock and pastes the payload. You bake each value into the code in the project's idiom.
6. **Clean**: delete the folder and every override, then prove it with `check-clean.sh`, the typecheck, lint, and the diff.

At any time the user can instead say **discard**: remove everything and keep the original values.

## Step 1: Scope

- Make controls only for the values the user is unsure about. One request often implies a companion control. For "explore background colors", add the foreground text color with `contrastWith` so they see the WCAG ratio as they go.
- Default to 8 or fewer controls, and never more than 12. A wall of sliders is not a jig.
- Give every number a real range, step and unit. Base the range on the design, not 0 to 1000: a radius of 0 to 32px, a duration of 100 to 800ms.
- For colors, add `presets` taken from the project's own palette or tokens.
- If the request is concrete, proceed without asking. If it is vague ("make it look better"), propose the control list in one short message and wait.

## Step 2: Install

```bash
bash <skill-path>/scripts/add-jig.sh <app-root>
```

`<app-root>` is the folder with the app's `package.json`. In a monorepo, that is the app package.

The script prints JSON:
- **`status`**: `installed`, or `exists` when a session is already active. If it exists, extend `controls.ts` instead of reinstalling.
- **Project facts:** `platform` (`web` or `native`), `framework`, `dest`, `mountCandidates`, `hasTypescript`, `hasTailwind`, `hasNativewind`, `gitClean`.
- **`files`**: what it copied.

It also writes `dest/LEDGER.md`, holding the git baseline and any changes that were already uncommitted. If `gitClean` is false, tell the user that cleanup will leave those pre-existing changes alone.

Read the matching section of [references/platforms.md](references/platforms.md) before wiring.

## Step 3: Define controls

Edit `<dest>/controls.ts`. `value` is always the **original** value from the code, which keeps Reset, Discard and the lock payload exact. Write colors as hex. If the original is a token or a named color, use its resolved hex.

```ts
export const controls = defineControls({
  heroBg:     { type: 'color', value: '#0f172a', label: 'Hero background', group: 'Hero', file: 'src/Hero.tsx', contrastWith: 'heroText', presets: ['#0f172a', '#1e293b', '#ffffff'] },
  heroText:   { type: 'color', value: '#f8fafc', group: 'Hero', file: 'src/Hero.tsx' },
  cardRadius: { type: 'number', value: 12, min: 0, max: 32, step: 1, unit: 'px', group: 'Card', file: 'src/Card.module.css' },
  showBadge:  { type: 'boolean', value: true, group: 'Card', file: 'src/Card.tsx' },
  heroLayout: { type: 'select', value: 'stacked', options: ['stacked', 'split'], file: 'src/Hero.tsx' },
  ctaLabel:   { type: 'text', value: 'Get started', file: 'src/Hero.tsx' },
});
```

Each key becomes a CSS variable on web: `heroBg` becomes `--jig-hero-bg`. Numbers get their `unit` appended, and booleans become `1` or `0`.

## Step 4: Wire the touch points

**Override, don't replace.** Each touch point wraps or overrides the original and leaves it visible in the code. Then unchanged values cost nothing to restore, and discard is exact.

| Where the value lives | Wire it like this |
|---|---|
| CSS, CSS module, SCSS, styled-components | `border-radius: var(--jig-card-radius, 12px);` (always keep the original as the fallback) |
| Tailwind class (web) | Keep the class and add `style={{ backgroundColor: 'var(--jig-hero-bg, #0f172a)' }}`. Inline style beats the class. |
| Client component, any JS value | `const jig = useJig();` then `jig.heroLayout`, `jig.cardRadius`, `{jig.showBadge && ...}` |
| Next.js server component | CSS vars for styles. `<JigShow when="showBadge">`, `<JigShow when="heroLayout" is="split">` and `<JigText k="ctaLabel" />` for JSX. |
| React Native StyleSheet | `style={[styles.card, { borderRadius: jig.cardRadius }]}`. Leave `StyleSheet.create` untouched. |
| Layout variants | Render each option behind `jig.heroLayout === '...'` or `<JigShow>`. Put new variant-only components in `<dest>/variants/` so they die with the folder. |

Imports come from `<dest>` (`useJig`, `JigShow`, `JigText`), using the project's alias or a relative path.

Every line you change outside `<dest>` must contain one of these strings, so `check-clean.sh` can find it:
- `__jig__`
- `useJig`
- `JigPanel`
- `JigShow`
- `JigText`
- `--jig-`
- `jig.`

Under "Touched files" in `LEDGER.md`, add one line per file saying what the override does. Do not reformat, refactor, or "improve" anything near a touch point.

## Step 5: Mount and hand over

Mount `<JigPanel />` once at the root, gated to development. Use `import.meta.env.DEV` (Vite), `process.env.NODE_ENV !== 'production'` (Next, CRA) or `__DEV__` (React Native). Record the mount in the ledger.

Typecheck. If you can see the app (browser tools, simulator), check that the panel renders and one control visibly changes the UI. Then tell the user:

```markdown
**Jig ready** with [n] controls: [label (type), ...]
- Web: the panel is on the right. Alt+J hides it, ⇆ docks it on the other side.
- Native: tap the "Jig" button. ⇅ moves the panel between top and bottom.
- Tweak until it feels right, then press **Lock** and paste the result here.
  Say "add a control for X" to extend it, or "discard the jig" to throw it away.
```

## Step 6: Lock and bake

- **Getting the values:**
  - Use the pasted `JIG LOCK` payload.
  - If the user just says "lock it", look for the latest `[jig:lock] {...}` line in output you can read: a dev server you started in the background (Metro and Expo web both print it), or the browser console through browser tools.
  - If neither is available, ask the user to press Lock and paste.
  - Never guess values from screenshots or memory.
- **Baking:** follow [references/bake-in.md](references/bake-in.md). In short:
  - Unchanged controls just lose their override.
  - Changed values are written where the original lived, in the project's idiom and at the scope the control covered.
  - Use tokens on exact matches.
  - Booleans and variants keep only the chosen branch, plus whatever only that branch uses.
  - Ask first when the original was theme-aware (light/dark).

## Step 7: Clean and prove it

1. Delete `<dest>/` entirely: panel, store, controls, ledger, variants.
2. Remove the mount and its import, restoring those lines exactly.
3. If the ledger lists added dependencies (it should say none), uninstall exactly those.
4. Run `bash <skill-path>/scripts/check-clean.sh <app-root>`. It must print `"clean":true`. Fix every leftover it reports and run it again.
5. Run the project's existing typecheck and lint. Do not set up new tooling. Compare errors against the baseline: only pre-existing ones may remain.
6. Read `git diff` against the ledger's baseline. Every hunk must be a baked value or a removed losing branch. Anything else is jig residue: remove it.

Then report:

```markdown
## Jig locked
| Control | Before | After | Where |
|---|---|---|---|
| Hero background | #0f172a | #1e293b (slate-800) | src/Hero.tsx |

Kept as is: [unchanged controls]
Removed with the jig: panel, [n] overrides, mount in [file]. check-clean: clean. Typecheck: passing.
Orphaned (not deleted): [unused CSS rules or assets, if any]
```

## Discard

When the user says "discard the jig", "cancel", or "keep it as it was":
1. Remove every override, restoring the originals. Delete variant branches that were not the original.
2. Run the cleanup in Step 7.
3. Confirm that `git diff` against the baseline is empty, apart from changes listed as uncommitted at start.

## Lab view (optional)

This is for tuning a shared design token, Maggie's "show me every component that uses grey 400":
1. Offer a temporary screen or route that renders every affected component side by side, with the panel open.
2. Put it in `<dest>/lab/` and register it with a jig-marked touch point. On Expo Router or Next, add a minimal route file that only re-exports the lab screen, and list it in the ledger.
3. The token control's `file` is the token definition. Baking edits the token itself, so the report must say which components changed with it.

## Rules

- **The jig never ships and is never committed.** If the user asks to commit while a jig is active, say so and offer to lock or discard first.
- **Install no packages.** The templates use only React, react-dom (web) and react-native core. If the user insists on a library, record it in the ledger and remove it at cleanup.
- **Never edit the copied panel files to restyle them.** They render in a shadow root (web) or a self-styled overlay (native), so app styles cannot reach them. If the panel blocks something, use dock, collapse, Alt+J, or the ⇅ button.
- **The `__jig__` folder never goes inside a routes folder** (`app/` in Expo Router or Next).
- **One session at a time.** Extend the existing `controls.ts` rather than reinstalling.

## When to Skip

- The user already knows the value ("make the radius 8px"). Just change it.
- The value is not visual or not adjustable at runtime: build config, server-rendered data, native config files.
- The project is not React or React Native. Say so and offer to make the change directly.
