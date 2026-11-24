# Agent Skills

A collection of skills for AI coding agents.

## Available Skills

### [no-rot](./no-rot)

Prevents brain atrophy from LLM over-reliance by leaving engaging challenges for you to complete.

```bash
npx skills add https://github.com/ameistad/agent-skills --skill no-rot
```

### [one-source-of-truth](./one-source-of-truth)

Keeps AI-assisted codebases from rotting their data model. Before any schema change it maps existing concepts, questions ambiguous ownership (should this value be a snapshot or a live reference?), decides a single source of truth, and records meanings in a data dictionary. Also audits existing schemas for duplicate concepts, undecided masters, and half-wired tables. Code is cheap to regenerate; recorded data is not.

```bash
npx skills add https://github.com/ameistad/agent-skills --skill one-source-of-truth
```

### [lucia-auth](./lucia-auth)

Implement production-ready web authentication following the patterns from [Lucia Auth](https://lucia-auth.com) and [The Copenhagen Book](https://thecopenhagenbook.com). Includes reference documentation and starter templates for sessions, password auth, email verification, password reset, CSRF protection, OAuth, MFA, and more.

```bash
npx skills add https://github.com/ameistad/agent-skills --skill lucia-auth
```

### [adversarial-debate](./adversarial-debate)

Simulates a structured debate with three personas to help make difficult decisions. Useful for architectural choices, technology decisions, and any tradeoff where you want to stress-test your thinking.

```bash
npx skills add https://github.com/ameistad/agent-skills --skill adversarial-debate
```

### [native-app-publish-ready](./native-app-publish-ready)

Comprehensive app store submission readiness checker for mobile apps. Audits iOS App Store and Google Play Store requirements including build config, privacy compliance, store assets, metadata, technical requirements, and common rejection causes. Supports native iOS (Swift/ObjC), native Android (Kotlin/Java), Flutter, and React Native (including Expo) projects.

```bash
npx skills add https://github.com/ameistad/agent-skills --skill native-app-publish-ready
```

### [ai-writing-humanizer](./ai-writing-humanizer)

Rewrite generic, formulaic, or overly polished text in a natural voice while preserving its meaning, important details, and the author's personality. Returns the revised text with concise suggestions for further improvement.

```bash
npx skills add https://github.com/ameistad/agent-skills --skill ai-writing-humanizer
```

### [design-jig](./design-jig)

Explore design values by feel instead of by guessing. The agent drops a temporary "jig" into your React or React Native app. It's a dev-only panel with a color wheel, sliders, toggles and variant pickers, and the UI updates live as you change them. When it looks right, press Lock and paste the result back. The agent writes the chosen values into your code the way you would have written them (Tailwind classes, CSS, StyleSheet, theme tokens), then removes every trace of the panel and proves it with a leftover scan, the typecheck, and the diff. Works with Vite, Next.js (including server components), Expo, Expo Router and bare React Native. It installs no packages. Inspired by Maggie Appleton's jigs, from her conversation on The Pragmatic Engineer.

```bash
npx skills add https://github.com/ameistad/agent-skills --skill design-jig
```

## Creating Your Own Skills

See [AGENTS.md](./AGENTS.md) for guidance on creating new skills.

## License

MIT
