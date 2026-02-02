#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$SCRIPT_DIR/.."
REFS_DIR="$SKILL_DIR/references"
TEMP_DIR=$(mktemp -d)

echo "Fetching auth resources..." >&2

cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

mkdir -p "$REFS_DIR/copenhagen-book"
mkdir -p "$REFS_DIR/lucia"

echo "Cloning Copenhagen Book..." >&2
git clone --depth 1 --quiet https://github.com/pilcrowOnPaper/copenhagen "$TEMP_DIR/copenhagen"
COPENHAGEN_COMMIT=$(git -C "$TEMP_DIR/copenhagen" rev-parse HEAD)

echo "Cloning Lucia..." >&2
git clone --depth 1 --quiet https://github.com/lucia-auth/lucia "$TEMP_DIR/lucia"
LUCIA_COMMIT=$(git -C "$TEMP_DIR/lucia" rev-parse HEAD)

add_metadata_header() {
    local source_file="$1"
    local dest_file="$2"
    local source_url="$3"
    local commit="$4"

    local date_str=$(date -u +"%Y-%m-%d")

    cat > "$dest_file" << EOF
<!--
Source: $source_url
Commit: $commit
Fetched: $date_str
-->

EOF
    cat "$source_file" >> "$dest_file"
}

echo "Processing Copenhagen Book pages..." >&2

COPENHAGEN_PAGES=(
    "sessions.md"
    "password-authentication.md"
    "email-verification.md"
    "password-reset.md"
    "oauth.md"
    "mfa.md"
    "webauthn.md"
    "csrf.md"
    "server-side-tokens.md"
    "random-values.md"
    "open-redirect.md"
)

for page in "${COPENHAGEN_PAGES[@]}"; do
    if [ -f "$TEMP_DIR/copenhagen/pages/$page" ]; then
        add_metadata_header \
            "$TEMP_DIR/copenhagen/pages/$page" \
            "$REFS_DIR/copenhagen-book/$page" \
            "https://github.com/pilcrowOnPaper/copenhagen/blob/main/pages/$page" \
            "$COPENHAGEN_COMMIT"
        echo "  Copied: $page" >&2
    else
        echo "  Warning: $page not found" >&2
    fi
done

echo "Processing Lucia pages..." >&2

copy_lucia_page() {
    local dest_name="$1"
    local source_path="$2"
    if [ -f "$TEMP_DIR/lucia/pages/$source_path" ]; then
        add_metadata_header \
            "$TEMP_DIR/lucia/pages/$source_path" \
            "$REFS_DIR/lucia/$dest_name" \
            "https://github.com/lucia-auth/lucia/blob/main/pages/$source_path" \
            "$LUCIA_COMMIT"
        echo "  Copied: $dest_name" >&2
    else
        echo "  Warning: $source_path not found" >&2
    fi
}

copy_lucia_page "sessions-overview.md" "sessions/overview.md"
copy_lucia_page "sessions-basic.md" "sessions/basic.md"
copy_lucia_page "sessions-inactivity-timeout.md" "sessions/inactivity-timeout.md"
copy_lucia_page "sessions-stateless-tokens.md" "sessions/stateless-tokens.md"
copy_lucia_page "rate-limit-token-bucket.md" "rate-limit/token-bucket.md"
copy_lucia_page "tutorial-github-oauth.md" "tutorials/github-oauth/index.md"
copy_lucia_page "tutorial-google-oauth.md" "tutorials/google-oauth/index.md"
copy_lucia_page "example-email-password-2fa.md" "examples/email-password-2fa.md"
copy_lucia_page "example-email-password-2fa-webauthn.md" "examples/email-password-2fa-webauthn.md"

echo "Writing VERSION.md..." >&2
cat > "$REFS_DIR/VERSION.md" << EOF
# Resource Versions

Last updated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Copenhagen Book
- **Repository**: https://github.com/pilcrowOnPaper/copenhagen
- **Commit**: $COPENHAGEN_COMMIT
- **Website**: https://thecopenhagenbook.com

## Lucia
- **Repository**: https://github.com/lucia-auth/lucia
- **Commit**: $LUCIA_COMMIT
- **Website**: https://lucia-auth.com

## How to Update

Run \`./scripts/fetch-resources.sh\` to pull the latest documentation.
EOF

echo "Done! Resources saved to $REFS_DIR" >&2
