#!/bin/bash
set -e

# design-jig: copy the jig templates into a React (web) or React Native app.
# Usage: add-jig.sh <app-root>
# <app-root> is the folder with the app's package.json (in a monorepo, the app package, not the repo root).
# Prints JSON to stdout describing the project and where the jig was installed.

ROOT="${1:-.}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS="$SKILL_DIR/assets"

if [ ! -f "$ROOT/package.json" ]; then
  echo "No package.json in $ROOT. Pass the app package root." >&2
  echo '{"status":"error","error":"no package.json at the given root"}'
  exit 1
fi
ROOT="$(cd "$ROOT" && pwd)"
PKG="$ROOT/package.json"

has_dep() { grep -Eq "\"$1\"[[:space:]]*:" "$PKG"; }
bool() { if "$@"; then echo true; else echo false; fi; }

PLATFORM=""
FRAMEWORK=""
if has_dep "react-native" || has_dep "expo"; then
  PLATFORM="native"
  if has_dep "expo-router"; then FRAMEWORK="expo-router"
  elif has_dep "expo"; then FRAMEWORK="expo"
  else FRAMEWORK="react-native"; fi
elif has_dep "next"; then
  PLATFORM="web"
  if [ -d "$ROOT/app" ] || [ -d "$ROOT/src/app" ]; then FRAMEWORK="next-app"; else FRAMEWORK="next-pages"; fi
elif has_dep "vite"; then
  PLATFORM="web"; FRAMEWORK="vite"
elif has_dep "react-scripts"; then
  PLATFORM="web"; FRAMEWORK="cra"
elif has_dep "react"; then
  PLATFORM="web"; FRAMEWORK="react"
else
  echo "No react or react-native dependency found in $PKG." >&2
  echo '{"status":"error","error":"not a React or React Native project"}'
  exit 1
fi

# Never inside app/: in Expo Router and Next.js App Router that folder is routes.
if [ -d "$ROOT/src" ]; then DEST_REL="src/__jig__"; else DEST_REL="__jig__"; fi
DEST="$ROOT/$DEST_REL"

# Likely files to mount <JigPanel /> in, most likely first.
CANDIDATES=()
case "$FRAMEWORK" in
  next-app) BASES="app/layout src/app/layout" ;;
  next-pages) BASES="pages/_app src/pages/_app" ;;
  expo-router) BASES="app/_layout src/app/_layout" ;;
  expo|react-native) BASES="App src/App index" ;;
  *) BASES="src/main src/index src/App" ;;
esac
for base in $BASES; do
  for ext in tsx jsx ts js; do
    if [ -f "$ROOT/$base.$ext" ]; then CANDIDATES+=("$base.$ext"); fi
  done
done
MOUNT_JSON=""
for c in "${CANDIDATES[@]}"; do MOUNT_JSON="$MOUNT_JSON${MOUNT_JSON:+,}\"$c\""; done

HAS_TS=$(bool test -f "$ROOT/tsconfig.json")
HAS_TAILWIND=$(bool has_dep "tailwindcss")
HAS_NATIVEWIND=$(bool has_dep "nativewind")

GIT_REPO=false
GIT_CLEAN=false
GIT_HEAD=""
GIT_STATUS=""
if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_REPO=true
  GIT_HEAD="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo "no-commits")"
  GIT_STATUS="$(git -C "$ROOT" status --porcelain -- . 2>/dev/null || true)"
  if [ -z "$GIT_STATUS" ]; then GIT_CLEAN=true; fi
fi

common_json() {
  echo "\"platform\":\"$PLATFORM\",\"framework\":\"$FRAMEWORK\",\"root\":\"$ROOT\",\"dest\":\"$DEST_REL\",\"mountCandidates\":[$MOUNT_JSON],\"hasTypescript\":$HAS_TS,\"hasTailwind\":$HAS_TAILWIND,\"hasNativewind\":$HAS_NATIVEWIND,\"gitRepo\":$GIT_REPO,\"gitClean\":$GIT_CLEAN"
}

if [ -e "$DEST" ]; then
  echo "A jig already exists at $DEST_REL. Extend its controls.ts instead of reinstalling." >&2
  echo "{\"status\":\"exists\",$(common_json)}"
  exit 0
fi

echo "Installing the $PLATFORM jig ($FRAMEWORK) into $DEST_REL..." >&2
mkdir -p "$DEST"
cp "$ASSETS/shared/"*.ts "$ASSETS/shared/"*.tsx "$DEST/"
cp "$ASSETS/$PLATFORM/JigPanel.tsx" "$DEST/"

{
  echo "# design-jig ledger"
  echo
  echo "Temporary file, deleted with this folder when the jig is locked or discarded."
  echo "Record every change made outside this folder so cleanup can undo all of it."
  echo
  echo "- Started: $(date '+%Y-%m-%d %H:%M')"
  echo "- Platform: $PLATFORM ($FRAMEWORK)"
  if [ "$GIT_REPO" = true ]; then
    if [ "$GIT_CLEAN" = true ]; then echo "- Git baseline: $GIT_HEAD, working tree clean"
    else echo "- Git baseline: $GIT_HEAD, with uncommitted changes (listed below; not made by the jig)"; fi
  else
    echo "- Git baseline: not a git repository"
  fi
  echo
  echo "## Uncommitted at start"
  echo
  if [ -n "$GIT_STATUS" ]; then echo '```'; echo "$GIT_STATUS"; echo '```'; else echo "none"; fi
  echo
  echo "## Mount"
  echo
  echo "<!-- File and line where <JigPanel /> is mounted -->"
  echo
  echo "## Touched files"
  echo
  echo "<!-- One line per file outside __jig__/: what the jig override does there -->"
  echo
  echo "## Variant files"
  echo
  echo "<!-- Components written only for select variants. Keep them in __jig__/variants/ -->"
  echo
  echo "## Dependencies added"
  echo
  echo "none"
} > "$DEST/LEDGER.md"

FILES_JSON=""
for f in "$DEST"/*; do FILES_JSON="$FILES_JSON${FILES_JSON:+,}\"$DEST_REL/$(basename "$f")\""; done

echo "Done. Next: define controls in $DEST_REL/controls.ts and mount <JigPanel />." >&2
echo "{\"status\":\"installed\",$(common_json),\"files\":[$FILES_JSON]}"
