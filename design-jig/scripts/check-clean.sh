#!/bin/bash
set -e

# design-jig: verify that no jig code is left in a project after lock or discard.
# Usage: check-clean.sh <app-root>
# Prints JSON to stdout. Exits 0 when clean, 1 when leftovers remain.

ROOT="${1:-.}"
if [ ! -d "$ROOT" ]; then
  echo "No such directory: $ROOT" >&2
  echo '{"clean":false,"error":"no such directory"}'
  exit 1
fi
ROOT="$(cd "$ROOT" && pwd)"
cd "$ROOT"

echo "Scanning $ROOT for jig leftovers..." >&2

PATTERN='__jig__|useJig|JigPanel|JigShow|JigText|--jig-|\[jig:lock\]|design-jig|(^|[^A-Za-z0-9_$.])jig\.[A-Za-z_]'

escape() {
  tr '\t' ' ' | tr -d '\000-\010\013\014\016-\037' | cut -c1-200 | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

MATCHES="$(grep -rnIE \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build \
  --exclude-dir=.next --exclude-dir=.expo --exclude-dir=.turbo --exclude-dir=.vercel --exclude-dir=out \
  --exclude-dir=coverage --exclude-dir=Pods --exclude-dir=.gradle --exclude-dir=web-build \
  --exclude-dir=.claude --exclude-dir=.agents --exclude-dir=.cursor --exclude-dir=.codex \
  --exclude-dir=.windsurf --exclude-dir=.opencode --exclude-dir=__jig__ \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.mjs' --include='*.cjs' \
  --include='*.css' --include='*.scss' --include='*.sass' --include='*.less' --include='*.html' \
  --include='*.vue' --include='*.svelte' --include='*.json' \
  --exclude='package-lock.json' --exclude='*.tsbuildinfo' \
  "$PATTERN" . 2>/dev/null | grep -Ev '^[^:]*/design-jig/' || true)"

LEFTOVERS=""
COUNT=0
if [ -n "$MATCHES" ]; then
  while IFS=: read -r file line text; do
    file="${file#./}"
    text="$(printf '%s' "$text" | escape)"
    LEFTOVERS="$LEFTOVERS${LEFTOVERS:+,}{\"file\":\"$file\",\"line\":$line,\"text\":\"$text\"}"
    COUNT=$((COUNT + 1))
  done <<< "$MATCHES"
fi

DIRS=""
while IFS= read -r dir; do
  if [ -n "$dir" ]; then DIRS="$DIRS${DIRS:+,}\"${dir#./}\""; fi
done <<< "$(find . -type d -name '__jig__' -not -path '*/node_modules/*' -not -path './.git/*' 2>/dev/null)"

if [ "$COUNT" -eq 0 ] && [ -z "$DIRS" ]; then
  echo "Clean: no jig code found." >&2
  echo '{"clean":true,"jigDirs":[],"leftovers":[]}'
  exit 0
fi

echo "Found $COUNT leftover line(s)$([ -n "$DIRS" ] && echo " and a __jig__ folder")." >&2
echo "{\"clean\":false,\"jigDirs\":[$DIRS],\"leftovers\":[$LEFTOVERS]}"
exit 1
