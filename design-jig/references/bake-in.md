# Baking locked values into code

The lock payload lists `changed` controls (`from`, `to`, `unit`, `file`) and `unchanged` keys. Baking turns each jig override back into ordinary code, written the way the project already writes it. The diff afterwards should look like a careful hand-written design change.

## Rules

1. **Unchanged controls: delete the override, nothing else.** The override wrapped the original value, so removing it brings the original code back exactly. Never rewrite an unchanged value in a new form.
2. **Changed controls: write the new value where the original lived, then delete the override.**
   - **CSS file:** turn `var(--jig-x, 5px)` into a literal in that same rule.
   - **Tailwind:** edit the class the original came from, then remove the inline `style` override.
   - **React Native:** edit the `StyleSheet.create` entry, then remove the style-array override.

   Never leave the inline override in as the final code.
3. **Bake at the scope the control covered.** If the control only affected one element but the original value lived in a shared rule or token, write the new value at the narrower scope instead.
   - Example: `h1, h2 { font-weight: 500 }`, where the control only targeted the h1. Add `font-weight: 700` to the `h1 {}` rule.
   - Change a shared token or variable only if the control was explicitly attached to it (lab view). In that case, tell the user what else uses it.
4. **Prefer existing tokens on an exact match.**
   - A value of 2 where the theme has `Spacing.half = 2` becomes `Spacing.half`.
   - `#0f172a` in a Tailwind project becomes `slate-900` when the theme defines it.
   - With no exact match, write the literal in the project's syntax, and mention the nearest token in the report (for example "7px, between rounded-md and rounded-lg"). Never snap to a token the user did not choose.
5. **Match the project's value format.** Use the existing color syntax (hex, `rgb()`, `hsl()`, `oklch()`), case, units (`px` vs `rem`) and quote style. Round numbers to the control's step.
6. **Booleans and select variants: keep only the chosen branch.**
   - Unwrap `<JigShow>` and `jig.x && ...` around kept code.
   - Delete the losing branches.
   - Delete anything those branches alone used: imports (the type checker flags unused ones), components in `__jig__/variants/`, and helper functions.
   - If a stylesheet rule or asset file is now unused, do not delete it. Mention it in the report as orphaned and offer to remove it.
7. **Theme-aware originals need a decision.** If the original value came from a light/dark theme (a theme hook, a `prefers-color-scheme` block, `dark:` classes) and the override applied in every theme, ask whether the new value is for one theme or both. Ask before baking, unless the user already said.
8. **Text values:** write the literal and escape for the context. In JSX use `{"let's go"}` or `&apos;`. Keep translations in mind: if the original went through an i18n function, update the message catalog, not the component.

## Per idiom

| Idiom | While tuning | Bake changed value | Bake unchanged value |
|---|---|---|---|
| CSS, CSS modules, SCSS | `prop: var(--jig-x, orig)` | `prop: new` | `prop: orig` |
| Tailwind / NativeWind | class kept, `style={{ prop: 'var(--jig-x, orig)' }}` (web) or style array (native) | replace the class for that property (`rounded-full` to `rounded-[7px]` or a theme class), remove `style` | remove `style` |
| Inline style object | `style={{ prop: jig.x }}` | `style={{ prop: new }}` | restore `orig` |
| styled-components, Emotion | `prop: var(--jig-x, orig);` inside the template | `prop: new;` | `prop: orig;` |
| React Native StyleSheet | `style={[styles.card, { prop: jig.x }]}` | edit `styles.card.prop`, back to `style={styles.card}` | back to `style={styles.card}` |
| JS constants (durations, springs, copy) | `jig.x` in place of the literal | literal or updated constant | original literal |
| Server component boolean or variant | `<JigShow when="x" is="a">` | keep chosen children, unwrap | unwrap original children |
| Server component text | `<JigText k="x" />` | literal text | original text |

## Worked example

Payload: `counterRadius` changed from 5 to 22 (unit px), `showHero` changed from true to false, `headingWeight` changed from "500" to "700", `counterLabel` unchanged.

- `App.css`: `border-radius: var(--jig-counter-radius, 5px);` becomes `border-radius: 22px;`
- `App.tsx`:
  - delete the whole hero block that `{jig.showHero && ...}` wrapped;
  - delete the now-unused `heroImg` import;
  - report the orphaned `.hero` CSS.
- `App.tsx`: remove `style={{ fontWeight: Number(jig.headingWeight) }}` from the h1.
- `index.css`: add `font-weight: 700;` to the `h1 {}` rule, not to the shared `h1, h2` rule.
- `App.tsx`: `{jig.counterLabel} {count}` becomes `Count is {count}`, exactly as before.
