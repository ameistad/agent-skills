# The preview board

A local page for showing design options and collecting the user's choice and suggestions. One script, no dependencies, nothing installed into the project.

## Contents

1. Session folder
2. Payload
3. Authoring previews
4. Commands and exit codes
5. Waiting
6. Handling the answer
7. Review rounds
8. Closing
9. Fallback

## 1. Session folder

Keep every board file outside the project's source tree so nothing can be committed by accident:

```bash
BOARD_DIR="$(mktemp -d)/design-board"; mkdir -p "$BOARD_DIR"
```

Use a scratch directory instead if your harness provides one. Put each round's payload and preview files in that folder. Preview files must sit inside the payload's folder: the board serves that folder and nothing above it.

If the user wants to keep the previews, copy them where they ask after the session. Do not create a folder in their project on your own.

## 2. Payload

One JSON file per round. `bash <skill-path>/scripts/board.sh schema` prints the full field list.

```json
{
  "title": "Pricing section: three directions",
  "question": "Which structure should carry the three plans?",
  "kind": "variants",
  "viewport": "desktop",
  "options": [
    {
      "id": "ledger",
      "name": "Ledger",
      "summary": "One table, plans as columns, the differences in the rows. Reads like a comparison because it is one.",
      "axis": "Layout topology",
      "palette": ["#101418", "#f3efe6", "#c8402a"],
      "fonts": ["Söhne", "Söhne Mono for prices"],
      "risk": "Dense on phones. Needs a stacked fallback under 600px.",
      "file": "ledger.html"
    }
  ]
}
```

- **`kind`**: `directions` (new work), `variants` (takes on an existing element), or `review` (the result of an update).
- **`viewport`**: `desktop` (1280 by 800), `mobile` (390 by 844), or `{"width": n, "height": n}`. Choose the size the surface is mostly used at. The user can toggle between desktop and mobile on the board.
- **`options`**: one to six. Three is the right number for a choice. One option invites a rubber stamp, and more than four stops being a choice.
- **Each option** has `id`, `name`, and at most one preview: `file` (an HTML file next to the payload), `html` (a full document as a string), `url` (an http address, usually the dev server), or `image`. Set `"reference": true` on a card that is only there for comparison.
- **`summary`** is the idea in one or two sentences. Name what the option does, not a mood. "Plans as columns in one table" is a summary. "Clean and modern" is not.
- **`risk`** is the honest tradeoff. Every real option has one. If you cannot name it, you have not thought about the option yet.

## 3. Authoring previews

A preview is a real rendered page, not a wireframe and not a description.

- **Self-contained HTML.** One file per option, with its CSS inline or in a file beside it. Fonts may load from a CDN. No build step.
- **Real content.** The product's actual name, copy, numbers, and labels. Lorem ipsum makes every option look the same.
- **Show the decision in context.** For a whole page, render the first viewport and the start of what follows. For a component, render it inside a slice of its real surroundings so scale and neighbors are honest.
- **Equal fidelity.** Every option gets the same care. A polished favorite next to two sketches is a choice already made for the user.
- **Use the project's own tokens** when the work sits inside an existing identity: copy the real custom properties, fonts, and spacing values into the preview. For a running app, you can also link the dev server's compiled stylesheet by URL.
- **Works at both frame sizes.** The user will flip the mobile toggle.
- **Apply the craft floor while writing.** Contrast, spacing, and type rules apply to previews too. Full verification happens once, on the option that gets built.

Do not screenshot and QA every option before showing it. The board is the review channel. Write the options, post them, and let the user look.

## 4. Commands and exit codes

```bash
bash <skill-path>/scripts/board.sh start  --payload <file> [--open]
bash <skill-path>/scripts/board.sh wait   [--timeout <seconds>]
bash <skill-path>/scripts/board.sh update --payload <file>
bash <skill-path>/scripts/board.sh status
bash <skill-path>/scripts/board.sh stop   [--message "<text shown on the closed board>"]
```

All commands print one line of JSON. With one board running you never need `--key`. With several, pass the `key` that `start` printed.

| Exit code | Meaning | What to do |
|---|---|---|
| 0 | Success. For `wait`: the answer is on stdout. | Continue. |
| 1 | Bad usage or an invalid payload. The message lists every problem. | Fix the payload and rerun. |
| 2 | The board could not start. | Do not retry. Use the fallback in section 9. |
| 3 | `wait` timed out. No answer yet. | See section 5. |
| 4 | No board is running. | Start a new one if you still need an answer. |

**Opening the page.** If you have a browser tool, navigate it to the `url` from `start`. Otherwise pass `--open` to use the system browser. Either way, tell the user the URL in one line so they can open it themselves.

The server listens on 127.0.0.1 only, behind a random key in the URL. It shuts itself down after four hours without activity.

## 5. Waiting

`wait` blocks until the user answers, for up to 540 seconds by default.

- Run it with your tool's longest timeout, or as a background task if your harness notifies you when a background command finishes. Do not poll on a short timer.
- **Exit 3** returns `{"type":"timeout","pageSeen":..,"pageOpen":..}`. The user is still deciding. Run `wait` again.
- After three timeouts in a row, stop waiting. Tell the user the board is still open at its URL and to tell you once they have answered, then end your turn. Their answer is held by the server. When they come back, one `wait` collects it.
- If `pageSeen` is false after the first timeout, the page never opened. Give the user the URL again.

Never start a second board while one is waiting on the same decision, and never fall back to chat while the tab is open. Either one leaves the user looking at a board that will never update.

## 6. Handling the answer

```json
{"type":"answer","round":1,"action":"pick","optionId":"ledger","optionName":"Ledger",
 "suggestion":"use the red from Poster for the selected plan","notes":{"poster":"too loud for us"},"viewport":"desktop"}
```

- **`pick`**: build `optionId`. The `suggestion` is a set of tweaks to that option. Notes on the other options are still useful: they say what to avoid. Read the whole answer before writing code.
- **`revise`**: the user wants another round before choosing. Apply the suggestion and per-option notes, then `update` with a new payload. Keep the options the user did not criticize, change the ones they did, and say what changed in each option's `notes`. If the suggestion asks to combine options ("the layout of A with the colors of C"), make that combination one of the new options and name it plainly.
- **`reroll`**: none of these. Deal a fresh set. Options already shown are spent and never come back, including in disguise. If there is a `suggestion`, it is a steer for the new set. After two rerolls in a row, stop and ask in chat what quality is missing. More options will not find it.

A suggestion is the user's ceiling on direction, not a hint. If it conflicts with a commitment in `DESIGN.md` or something they pinned earlier, do not quietly pick one: say what conflicts in the next round's `question` line and show the option both ways if you can.

After `update`, run `wait` again. The tab the user already has open shows the new round on its own.

## 7. Review rounds

Use these after a change has landed in source.

```json
{
  "title": "Pricing section: Ledger, built",
  "question": "This is the real page. Approve it, or say what to change.",
  "kind": "review",
  "viewport": "desktop",
  "options": [
    {"id": "after", "name": "Now", "url": "http://localhost:5173/pricing",
     "notes": ["Plans are columns in one table", "Selected plan uses the brand red", "Stacks into cards under 600px"]},
    {"id": "before", "name": "Before", "reference": true, "image": "before.png"}
  ]
}
```

- Prefer `url` on the result card so the user sees the real, running page. Some dev servers refuse to be framed. If the preview comes up blank, the user still has the "New tab" link on the card, and you can switch to a screenshot `image` or a standalone `file` for the next round.
- A "before" card needs something captured before you edited: take a screenshot first, or keep a copy of the old markup as an HTML file. Skip the card if you have neither.
- `notes` are the changelog for this round, three to five short lines. On later rounds, list only what changed since the previous one.
- `pick` on the result card means approved. `revise` means make those changes in source, then post the next review round.

## 8. Closing

Run `stop` as soon as the decision is final, with a message that says what happens next, such as "Approved. Nothing more to do here." The open tab shows the message and stops polling.

Then delete the session folder unless the user asked to keep the previews.

## 9. Fallback

When `start` exits 2, or you are in an environment with no browser on the same machine:

1. Say in one line that the preview board is not available here.
2. Still write the preview files. Give the user each file's full path so they can open it.
3. Present the options in chat: name, summary, palette, tradeoff. If a structured question tool is available, use it with one choice per option.
4. Ask for a choice and for changes in the same message. Treat the reply exactly like a board answer.
