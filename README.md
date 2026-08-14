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

## Creating Your Own Skills

See [AGENTS.md](./AGENTS.md) for guidance on creating new skills.

## License

MIT
