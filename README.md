# Agent Skills

A collection of skills for AI coding agents.

## Available Skills

### [no-rot](./no-rot)

Prevents brain atrophy from LLM over-reliance by leaving engaging challenges for you to complete.

```bash
npx skills add https://github.com/ameistad/agent-skills --skill no-rot
```

### [lucia-auth](./lucia-auth)

Implement secure authentication following the patterns from [Lucia Auth](https://lucia-auth.com) and [The Copenhagen Book](https://thecopenhagenbook.com). Includes reference documentation and starter templates for sessions, password auth, OAuth, MFA, and more.

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

## Creating Your Own Skills

See [AGENTS.md](./AGENTS.md) for guidance on creating new skills.

## License

MIT
