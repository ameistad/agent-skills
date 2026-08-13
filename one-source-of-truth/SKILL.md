---
name: one-source-of-truth
description: Prevents data model rot in AI-assisted codebases by mapping existing concepts, questioning ambiguous ownership, deciding a single source of truth for every value, and recording what each table and field means in a data dictionary. Use proactively whenever a task adds or changes tables, models, migrations, or persisted fields, even when the user only asked for a feature. Also triggers on "audit my data model", "check my schema for rot", "where is the source of truth", or "update the data dictionary". Do not use for query performance tuning, index-only migrations, non-persisted UI state, or code that reads but never changes the schema.
---

# One Source of Truth

Code is cheap to regenerate. Recorded data cannot be un-recorded, and a year of orders written against a schema that never made sense is the most expensive bug there is. Deciding what data means is the step AI-assisted workflows skip: you ask for a feature, you get a feature, and nobody asks what a "product" is supposed to mean here. This skill makes you the developer who asks, decides, writes the answer down, and adds the test that keeps it true.

## Rot Patterns

Five ways a data model rots. Use these slugs in reports and decision records.

1. **`duplicate-concept`**: one business idea lives in multiple tables under different names (items vs products vs menu_entries), created at different points in the build. Detect: near-synonym table names, overlapping column sets, code that writes to one and reads from another.
2. **`undecided-source-of-truth`**: a value is stored in two places with no declared master, so an edit in one silently diverges from or rewrites the other. Detect: same-shaped columns in related tables, denormalized copies with no constraint, no comment, and no sync logic.
3. **`snapshot-vs-reference-ambiguity`**: a child record either copies a value at write time (immutable snapshot) or points at a live row (reference), and nobody decided which. Editing the menu rewrites what old orders cost. Detect: a foreign key to a mutable row where the domain implies history (orders, invoices, payroll, logs), or a copied value alongside a foreign key to its source.
4. **`meaning-drift`**: an enum or status column accumulated values with overlapping or forgotten semantics ("pending" vs "processing" vs "queued"), or a field's real meaning changed while its name did not. Detect: enums checked inconsistently across code paths, status values written but never read.
5. **`half-wired-relation`**: a table or relation that was started and abandoned. Detect: foreign keys only some code paths populate, join tables with no readers, columns never written outside one migration, relations traversed in only one direction.

## Finding the Schema

Look in this order and stop when you have the full picture:

1. Declarative schema files: `prisma/schema.prisma`, drizzle `schema.ts`, `db/schema.rb`, `schema.sql`, `structure.sql`, `*.dbml`.
2. ORM model directories: `app/models/` (Rails), `models.py` per Django app, SQLAlchemy models, TypeORM or MikroORM entities, `app/Models/` (Laravel).
3. Migration directories: `migrations/`, `db/migrate/`, `prisma/migrations/`, `alembic/versions/`. Migrations show when duplicates were introduced, which the current schema alone cannot.
4. Raw SQL fallback: search for `CREATE TABLE` across `*.sql`.
5. Non-SQL stores: Mongoose schemas in `models/`, Firestore or DynamoDB access wrappers. When there is no schema file, the write paths are the schema, so search for the collection or table names.

Always also check the repo root and `docs/` for an existing `DATA-MODEL.md`. If you find no schema at all, say so and ask where persisted data lives instead of guessing.

## Guardrail Mode

Run this before any task that adds or changes tables, models, migrations, or persisted fields, even when the request never mentions the schema. "Add a discounts feature" implies persisted data; that is enough.

1. Locate the schema and read `DATA-MODEL.md` if it exists. Recorded decisions are binding unless the user explicitly overrides them.
2. Map the concepts the task touches: list existing tables and models that overlap the new data in name or shape.
3. Say the feature back in data-model terms before implementing: "Discounts means the `orders` table gains a `discount_amount`, snapshotted at checkout." One or two plain sentences. A bare "I want [feature]" is a spec for behavior, not for meaning; this sentence is where the user catches the mismatch between what they meant and what the schema is about to say.
4. Resist additive bias. Adding a table or column is not the safe default; it is how duplicate concepts and half-wired relations are born. Before any addition, check whether an existing table or column should be modified, merged, or removed instead, and prefer the change that leaves the schema smaller or the same size. Creating a structure parallel to an existing concept requires an explicit user decision. If the task reveals a simplification (two tables that should be one, a column made obsolete), propose it now rather than building around it.
5. Ask clarifying questions only where meaning is genuinely ambiguous, three at most. The canonical one: "When X changes later, should records that already captured X keep the old value (snapshot) or show the new one (reference)?" Others worth asking: which table owns this concept, and what happens to dependent records on delete.
6. For low-stakes ambiguity, do not block. State the assumption you are making in one line and proceed.
7. Record each decision in your response using the Decision Record format, and in `DATA-MODEL.md`, creating the file if it does not exist.
8. Enforce the decision, do not just record it. A decision that lives only in prose gets re-broken by the next change, because nothing stops a field from being duplicated again. For a snapshot decision, add a database-level guard where the stack supports it (trigger, insert-only column) and always add a regression test in the project's existing test style that mutates the live source and asserts the recorded value is unchanged: edit the menu item, assert an old order total did not move. For an ownership decision, add the uniqueness or foreign key constraint that is missing. Ten minutes of test is the only reason anyone gets to trust the table.
9. Only then write the migration and model code, invariants included.

## Audit Mode

Run this when asked to audit the data model or check the schema for rot. Never run it uninvited.

1. Locate and read the full schema plus `DATA-MODEL.md` if present.
2. Build a concept inventory: map every table or model to the business concept it represents. Flag any table you cannot name a concept for.
3. On large schemas (roughly 25 tables or more), do not sweep everything at once. Audit in passes: first tables recording money, identity, and history (orders, payments, invoices, users, ledgers, audit logs), where rot destroys data; then their direct relations; then the rest. A partial audit must never read as a clean bill of health, so the report always ends by listing the tables not yet audited.
4. Sweep all five rot patterns against the inventory. For suspected duplicates and copies, search the code for read and write paths to confirm which side is actually used.
5. Rank findings by data damage, not code ugliness: wrong data being recorded right now is high, wrong data recordable on the next edit is medium, merely confusing is low.
6. Where a value may have already drifted, say so and provide a one-off reconciliation query. Users who notice numbers moving tend to assume they are misreading the report, so silent drift is often months old by the time anyone asks.
7. Produce the Audit Report. Each finding names the simplifying move (merge these tables, drop this column, declare this copy a snapshot), the invariant that would enforce the decision, and the question the user must answer. Never fix findings silently; every resolution is a meaning decision only the user can make.
8. Offer to bootstrap or update `DATA-MODEL.md` from the findings and to fix findings one at a time.

## The Data Dictionary: DATA-MODEL.md

The written-down answers. Create it at the repo root on the first recorded decision, read it at the start of both modes, and update it with every schema decision. One entry per business concept:

```markdown
## Concept: Order Line
- Meaning: one purchased item on a confirmed order, as sold at that moment
- Owning table: `order_lines`
- Source of truth: `order_lines.price` is an immutable snapshot copied from
  `menu_items.price` at order time; never recomputed from the menu
- Related concepts: Menu Item (live catalog entry; price there is editable)
- Enforced by: `tests/orders/price_snapshot.test.ts` (edits a menu item, asserts
  an existing order total is unchanged)
- Decided: 2026-08-13, while adding menu price editing
```

## Worked Example

User asks: "Let restaurant owners edit their menu prices."

The naive path is one line: make `menu_items.price` editable, done. And every past order total that joins through `menu_items` now silently shows today's prices on last year's receipts.

With this skill you instead:

1. Map the concepts: `menu_items`, `order_lines`, and a `products` table from an earlier build step that only one code path still writes to. Surface that as `duplicate-concept` before adding anything.
2. Say it back: "Editing prices means `menu_items.price` becomes mutable, which changes what `order_lines` joined against it will display."
3. Ask the canonical question: "Should a receipt from March still show the March price after you raise prices today?" User: yes, obviously.
4. Record the decision: order lines snapshot the price at order time; `menu_items` is the live master; `products` gets merged into `menu_items`.
5. Implement: copy `price` onto `order_lines` at insert, backfill existing rows from current data with an explicit warning that pre-decision history is unrecoverable, and add the regression test that edits a menu item and asserts an old order total is unchanged.
6. Write the dictionary entry, including its Enforced by line.

## Output Format

After a guardrail decision:

```markdown
## Data Model Decision
- Concept: [name]
- Question: [what was ambiguous]
- Decision: [snapshot|reference|owner|extend|merge|remove] - [one sentence]
- Enforced by: [constraint, trigger, or test path]
- Recorded in: DATA-MODEL.md
```

For an audit:

```markdown
## Data Model Audit
Scanned [n] tables, identified [n] concepts.

### [severity: high|medium|low] [pattern-slug]: [short title]
- Tables: [tables and columns involved]
- Evidence: [what the schema and code paths show]
- Fix: [the simplifying move]
- Invariant: [what would enforce it]
- To resolve: [the question the user must answer]

Clean: [patterns with no findings]
```

## When to Skip

Skip the guardrail questions when:

- The user says "just do it" or is firefighting a production incident
- The change is mechanical with no meaning change: an index, an ORM-tracked rename, a type widening
- The data is explicitly throwaway: spikes, seed data, test fixtures
- The store is a cache or derived view with a declared rebuild path

Even when skipping questions, still state assumptions in one line and update `DATA-MODEL.md` if the change touches a recorded concept.
