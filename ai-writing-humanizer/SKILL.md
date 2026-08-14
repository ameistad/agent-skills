---
name: ai-writing-humanizer
description: Rewrite text that sounds generic, formulaic, overly polished, or AI-generated into natural, specific writing while preserving the author's meaning and voice. Use when users ask to "make this sound human", "de-AI this", "reduce AI tone", "rewrite naturally", "spot AI tells", or improve authenticity in emails, essays, posts, documentation, and product copy. Return a revised version with concise improvement suggestions. Do not use for grammar-only proofreading, plagiarism checks, authorship detection, or fact-check-only requests.
---

# AI Writing Humanizer

Rewrite text into natural, specific language that sounds like its author. Do not diagnose authorship, score AI-likeness, or expose an analysis rubric.

## Workflow

1. Capture or infer the audience, channel, target tone, and text type.
2. Classify the text as a message, narrative or essay, promotional or product copy, technical or procedural writing, or a mixture by section.
3. Mark content that must remain exact: claims, numbers, proper nouns, quotations, code, commands, file paths, error messages, and quoted UI labels.
4. Identify the author's usable voice signals, including cadence, directness, warmth, vocabulary, humor, and point of view.
5. Rewrite for clarity, specificity, natural rhythm, and the conventions of the text type.
6. Run the self-check before responding.
7. Return the revised text and concise suggestions.

## Defaults

If context is missing, infer it from the text and use:

- Audience: peer professional.
- Channel: short-form written message.
- Tone: clear-neutral.
- Edit depth: moderate.

Follow an explicit tone or edit-depth request over these defaults. Do not ask for context when a safe inference is sufficient.

## Rewrite Priorities

1. Preserve meaning, intent, factual claims, numbers, and necessary nuance.
2. Preserve and strengthen the author's existing voice instead of inventing a new persona.
3. Replace generic claims with concrete language already supported by the source.
4. Cut throat-clearing, empty emphasis, repetition, canned framing, and unnecessary conclusions.
5. Prefer direct verbs and natural phrasing over noun-heavy abstractions and rhetorical templates.
6. Use plain words when they fit, but keep technical terms and precise vocabulary when they carry meaning.
7. Vary sentence and paragraph length without manufacturing quirks, slang, fragments, or errors.
8. Use only as much formatting as the content needs. Do not force headings, bullets, bold text, or groups of three.
9. Keep uncertainty that matters. Do not turn a qualified claim into a certainty or weaken a requirement.
10. Never invent facts, experiences, opinions, anecdotes, quotations, or biographical details.

## Text-Type Guidance

- For messages, start near the point and retain the level of warmth the relationship requires.
- For narratives and essays, preserve point of view and distinctive phrasing; leave gaps that require lived experience for the author to fill.
- For product and promotional copy, favor concrete benefits and evidence over inflated claims.
- For technical or procedural writing, favor an explicit sequence, put a condition before the action it governs, and separate actions when combining them could cause mistakes.
- For non-English text, keep the original language unless asked to translate. Judge formality and naturalness by that language rather than applying English word lists mechanically.

## Protected Content

Keep code blocks, inline code, command strings, file paths, URLs, error messages, quoted UI text, identifiers, numbers, and proper nouns unchanged unless the user explicitly asks to edit them. Preserve quoted passages verbatim unless the task is specifically to rewrite the quotation.

If smoother prose would require changing a protected item or a factual claim, keep it and raise the issue as a suggestion instead.

## Self-Check

Before responding, silently check that the rewrite:

1. Starts and ends without formulaic scene-setting or recap.
2. Advances rather than restates ideas.
3. Uses concrete subjects and direct verbs where they improve the sentence.
4. Removes filler, hollow intensifiers, stock transitions, and unnecessary hedges.
5. Avoids repeated sentence templates, uniform cadence, and forced structure.
6. Uses vocabulary appropriate to the audience and purpose rather than rotating synonyms for variety.
7. Retains the author's voice and all protected content.
8. Adds no unsupported detail and changes no meaningful modality.

Use these checks as editing guidance, not as findings to report.

## Suggestions

Give 1-3 short, actionable suggestions when author input or a contextual choice could materially improve the result. Point to a concrete place or decision, such as adding a real example, choosing a firmer position, clarifying the audience, or replacing a generic claim with evidence.

Do not fabricate the missing material. Do not label suggestions as AI tells or attach scores, confidence levels, or pattern names. If the text needs no meaningful follow-up, say so briefly rather than inventing suggestions.

Skip suggestions when the user explicitly requests only the rewritten text.

## Reference Files

- Read [references/rewrite-patterns.md](references/rewrite-patterns.md) for jargon-heavy, highly formal, promotional, or technical and procedural text, or when the first rewrite still feels stiff.
- Read [references/examples.md](references/examples.md) when the appropriate edit depth is unclear, the text mixes formats, or the user asks for alternatives.

## Output Format

Use this structure unless the user requests another format:

```markdown
## Revised Text

[final rewrite]

## Suggestions

- [specific, actionable suggestion]
```

Return the result without a diagnostic preamble, AI-likeness assessment, or explanation of the internal editing process.

## Edge Cases

- For very short text, make only changes supported by the available signal.
- If the original already sounds natural, preserve it and make minimal edits.
- If a passage has more than one plausible meaning, preserve the safest reading and flag the ambiguity in Suggestions.
- For legal, compliance, medical, safety, or other high-stakes text, preserve exact requirements and recommend subject-matter review when needed.
