#!/bin/bash
set -e

# design: preview board launcher.
# Usage: board.sh <start|wait|update|status|stop|schema> [flags]
# Prints JSON to stdout. See references/board.md for the protocol.

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18 or newer is required for the preview board." >&2
  echo '{"ok":false,"error":"node_missing","message":"Node.js not found. Present the options in chat instead."}'
  exit 2
fi

exec node "$DIR/board.mjs" "$@"
