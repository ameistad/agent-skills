# Platform notes

Where to mount `<JigPanel />`, how to gate it to development, and the gotchas per framework. `add-jig.sh` reports `framework` and `mountCandidates`; read only the matching section.

All mounts follow the same shape: one import line and one gated render line, both containing `JigPanel`, so `check-clean.sh` finds them.

## Vite (React)

Mount in `src/main.tsx`, next to `<App />`:

```tsx
import { JigPanel } from './__jig__/JigPanel'
// ...
<StrictMode>
  <App />
  {import.meta.env.DEV && <JigPanel />}
</StrictMode>
```

- Use `import.meta.env.DEV`. `process.env.NODE_ENV` is not typed in Vite's default tsconfig.
- Values persist in `localStorage` across reloads, and HMR keeps them while you edit.

## Next.js App Router

Mount in `app/layout.tsx` (or `src/app/layout.tsx`) as the last child of `<body>`:

```tsx
import { JigPanel } from "@/__jig__/JigPanel";
// ...
<body className="...">
  {children}
  {process.env.NODE_ENV !== "production" && <JigPanel />}
</body>
```

- If the body was a one-liner (`<body className="...">{children}</body>`), restore it to exactly that at cleanup.
- Import `JigPanel` from its own file, not the `__jig__` barrel.
- **Server components** cannot call `useJig()`. Use the no-import paths instead:
  - **Style values:** read `var(--jig-<key>, <original>)` in an inline `style`, or in a CSS or CSS module file.
  - **Booleans and select variants:** wrap the JSX in `<JigShow when="key">` or `<JigShow when="key" is="option">`. It is a client component that takes server-rendered children, so the page stays a server component.
  - **Text:** render `<JigText k="key" />`.

  Import those two from `@/__jig__`. `store.ts` and `JigShow.tsx` are marked `'use client'`, so the barrel is safe to import from server files.
- **Client components** (`'use client'`) can call `useJig()` directly.
- The panel renders nothing on the server and attaches a shadow root on the client, so it causes no hydration mismatch. Saved values are restored on the client after hydration.
- The `--jig-*` variables are set by the client. During the first server paint only the fallback applies, which is why every `var()` must carry the original value as its fallback.

## Next.js Pages Router

Mount in `pages/_app.tsx` after `<Component {...pageProps} />`, gated with `process.env.NODE_ENV !== "production"`. Every component is a client component, so `useJig()` works everywhere.

## Create React App and other React web setups

Mount next to the root `<App />` in `src/index.tsx`, gated with `process.env.NODE_ENV !== 'production'`.

## Expo Router

Mount in `app/_layout.tsx` (or `src/app/_layout.tsx`) as the last child of the root layout's returned tree, after the navigator:

```tsx
import { JigPanel } from '@/__jig__/JigPanel';
// ...
<ThemeProvider value={...}>
  <AppTabs />
  {__DEV__ && <JigPanel />}
</ThemeProvider>
```

- **Never put `__jig__` inside the `app/` routes folder**, because every file there becomes a route. `add-jig.sh` puts it in `src/__jig__` or at the root `__jig__/`, both outside routes.
- Gate with `__DEV__`.
- The panel is a floating "Jig" button that opens an overlay sheet, docked top or bottom with the ⇅ button. It uses only `react-native` core (View, PanResponder, Switch, TextInput, Share), so it runs in Expo Go with no install and no native rebuild.
- **Lock** opens the native share sheet (its Copy action puts the payload on the clipboard). It also logs `[jig:lock] {json}` to the Metro terminal. If you started Metro yourself in the background, read that line from its output instead of asking the user to paste.
- Values are kept in memory and survive Fast Refresh, but not a full reload.

## Expo (classic) and bare React Native

Mount in `App.tsx` as the last child of the root view or provider, gated with `__DEV__`. Make sure the parent fills the screen, because the panel is an absolutely positioned overlay. Bare React Native needs nothing extra: there are no native modules, so there are no pods to install.

## Expo web (react-native-web)

The native panel runs on Expo web unchanged.
- **Lock** copies to the browser clipboard.
- Expo forwards browser console logs to the terminal as `Web LOG [jig:lock] ...`.
- Values persist in `localStorage`.

## NativeWind

Bake into `className` like Tailwind (see bake-in.md). While tuning, override with the `style` prop or a style array: NativeWind merges `style` after `className`, so the override wins.

## Monorepos

Pass the app package (the folder whose `package.json` has `react` or `react-native`) to `add-jig.sh`, not the repo root. Run `check-clean.sh` on the same folder.

## Path aliases

Use the project's existing alias (`@/__jig__`) when one maps to the folder that contains `__jig__`. Otherwise use a relative import. Never add a new alias for the jig, since that would be one more thing to clean up.

## JavaScript-only projects

If `hasTypescript` is false, convert the copied files before mounting:
- rename `.ts` to `.js` and `.tsx` to `.jsx`;
- delete `import type` lines, type annotations, generics and `as` casts.

Vite and Expo compile `.tsx` even without a tsconfig, so converting is optional there. Next.js would try to set up TypeScript, so it is required.
