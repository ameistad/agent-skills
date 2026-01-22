# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, Copilot, etc.) when working with code in this repository.

## Repository Overview

A collection of skills for AI coding agents. Skills are packaged instructions and optional scripts that extend an agent's capabilities. This repository follows the [Agent Skills format](https://agentskills.io).

## Creating a New Skill

### Directory Structure

```
skill-name/
├── SKILL.md              # Required: instructions for the agent
├── README.md             # Required: documentation for humans
├── scripts/              # Optional: executable scripts
├── references/           # Optional: supporting documentation
└── assets/               # Optional: templates, images, data files
```

### Naming Conventions

- **Skill directory**: lowercase letters, numbers, and hyphens only (e.g., `no-rot`, `test-reminder`)
- **Name constraints**: max 64 characters, no leading/trailing hyphens, no consecutive hyphens
- **SKILL.md name field**: must match the parent directory name exactly
- **Scripts**: kebab-case.sh (e.g., `deploy.sh`, `fetch-logs.sh`)

### SKILL.md Format

The SKILL.md file has two parts: YAML frontmatter and markdown content.

#### Frontmatter

```yaml
---
name: skill-name
description: A description of what this skill does and when to use it. Include trigger phrases. Max 1024 characters.
license: MIT
compatibility: Requires git and access to the internet
metadata:
  author: your-username
  version: "1.0.0"
---
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Must match directory name. Max 64 chars. |
| `description` | Yes | What it does and when to use it. Max 1024 chars. |
| `license` | No | License name (e.g., MIT, Apache-2.0) |
| `compatibility` | No | Environment requirements. Max 500 chars. |
| `metadata` | No | Arbitrary key-value pairs (author, version, etc.) |

**Description tips:**
- Be specific about trigger phrases ("deploy my app", "review my code")
- Explain what task the skill helps with
- This is what the agent sees to decide whether to activate the skill

#### Content Sections

Structure the markdown body to help the agent use the skill effectively:

1. **Title and overview** - What the skill does
2. **How It Works** - Step-by-step workflow
3. **When to Use** - Specific scenarios and triggers
4. **Usage/Examples** - How to invoke scripts or apply guidance
5. **Output Format** - What the user should see

### README.md Format

The README is for humans browsing GitHub:

```markdown
# skill-name

Brief description of what the skill does.

## Installation

\`\`\`bash
npx skills add https://github.com/username/repo --skill skill-name
\`\`\`

## Usage

How to activate and use the skill. Include trigger phrases.

## Examples

Show what it looks like in practice.

## License

MIT
```

### Script Requirements (if applicable)

```bash
#!/bin/bash
set -e

# Write status to stderr
echo "Processing..." >&2

# Write machine-readable output to stdout
echo '{"status": "success"}'
```

- Use `#!/bin/bash` shebang
- Use `set -e` for fail-fast behavior
- Status messages to stderr
- Machine-readable output (JSON) to stdout
- Include a cleanup trap for temp files if needed

## Best Practices for Context Efficiency

Skills use progressive disclosure to minimize context usage:

- **Metadata** (~100 tokens): `name` and `description` loaded at startup
- **Instructions** (<5000 tokens): Full SKILL.md body loaded when skill activates
- **Resources** (on-demand): Files in `scripts/`, `references/`, `assets/` loaded only when needed

**Recommendations:**
- Keep SKILL.md under 500 lines
- Move detailed reference material to `references/` directory
- Prefer scripts over inline code (script execution doesn't consume context, only output does)
- Keep file references one level deep from SKILL.md

## Workflow for Creating a Skill

1. **Clarify the concept** - What problem does it solve? When should it activate?
2. **Choose a name** - lowercase, hyphens allowed, descriptive, memorable
3. **Write the description** - Specific triggers and use cases (max 1024 chars)
4. **Draft SKILL.md** - Instructions for the agent
5. **Draft README.md** - Documentation for humans
6. **Add scripts if needed** - For automation tasks
7. **Validate** - Run `skills-ref validate ./skill-name` if using the reference library
8. **Test it** - Install locally and verify it works

## Publishing

1. Create a GitHub repository (or add to an existing one)
2. Add your skill directory with SKILL.md and README.md
3. Users install with: `npx skills add https://github.com/username/repo --skill skill-name`
4. Skills appear on [skills.sh](https://skills.sh) automatically through install telemetry

## Alternative Installation Methods

For **Claude.ai** (without CLI):
- Add the skill folder to project knowledge, or
- Paste the SKILL.md contents directly into the conversation

## Example Skill

See the [no-rot](./no-rot) skill in this repository for a complete example.
