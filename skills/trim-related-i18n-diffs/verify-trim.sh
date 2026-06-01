#!/usr/bin/env bash
# verify-trim.sh — Verify that the remaining uncommitted diff in target i18n
# files only touches keys that belong to the relevant key set extracted from
# a baseline *_zh_CN.js file.
#
# Usage:
#   verify-trim.sh <baseline_file> <commit_range> [target_file ...]
#
# The script exits with code 0 when all target files are clean, or code 1
# when one or more files contain unexpected keys.
#
# Examples:
#   # Auto-discover modified sibling .js files
#   verify-trim.sh path/to/lang_zh_CN.js abc123..HEAD
#
#   # Explicit target files
#   verify-trim.sh path/to/lang_zh_CN.js abc123..HEAD \
#       path/to/lang_ja.js path/to/lang_ko.js

set -euo pipefail

# ── Arguments ────────────────────────────────────────────────────────────────

BASELINE_FILE="${1:?Usage: $0 <baseline_file> <commit_range> [target_file ...]}"
COMMIT_RANGE="${2:?Missing commit range, e.g. abc123..HEAD}"
shift 2

# ── Helpers ──────────────────────────────────────────────────────────────────

info()  { printf '\033[36m[INFO]\033[0m %s\n' "$*"; }
warn()  { printf '\033[33m[WARN]\033[0m %s\n' "$*" >&2; }
pass()  { printf '\033[32m[PASS]\033[0m %s\n' "$*"; }
fail()  { printf '\033[31m[FAIL]\033[0m %s\n' "$*" >&2; }

# Extract the i18n key from a JS object-entry line like:  'foo.bar' : 'value',
extract_key() {
    sed -n "s/^[+-]\?\s*'\\([^']*\\)'\\s*:.*/\\1/p" | head -1
}

# ── 1. Compute the relevant key set from baseline diff ──────────────────────

BASELINE_DIR="$(dirname "$BASELINE_FILE")"
BASELINE_NAME="$(basename "$BASELINE_FILE")"

info "Computing relevant keys from baseline: $COMMIT_RANGE -- $BASELINE_FILE"

BASELINE_DIFF="$(git diff "$COMMIT_RANGE" -- "$BASELINE_FILE" 2>/dev/null)"

if [[ -z "$BASELINE_DIFF" ]]; then
    warn "No diff found for baseline file in range $COMMIT_RANGE"
    echo "0"
    exit 0
fi

ALL_KEYS_FILE="$(mktemp)"
{
    echo "$BASELINE_DIFF" | grep "^+" | grep -E "^\+\s*'" | grep -v "^+++" | extract_key
    echo "$BASELINE_DIFF" | grep "^-" | grep -E "^\-\s*'" | grep -v "^---" | extract_key
} | sort -u > "$ALL_KEYS_FILE"

KEY_COUNT="$(wc -l < "$ALL_KEYS_FILE" | tr -d ' ')"
info "Relevant key set: $KEY_COUNT keys"

if [[ "$KEY_COUNT" -le 30 ]]; then
    while IFS= read -r key; do
        echo "  . $key"
    done < "$ALL_KEYS_FILE"
else
    head -20 "$ALL_KEYS_FILE" | while IFS= read -r key; do echo "  . $key"; done
    echo "  ... ($((KEY_COUNT - 20)) more)"
fi

# ── 2. Discover target files ────────────────────────────────────────────────

TARGET_FILES=()
if [[ $# -gt 0 ]]; then
    TARGET_FILES=("$@")
else
    while IFS= read -r f; do
        [[ "$(basename "$f")" != "$BASELINE_NAME" ]] && TARGET_FILES+=("$f")
    done < <(git diff --name-only -- "$BASELINE_DIR"/*.js)
fi

TARGET_COUNT="${#TARGET_FILES[@]}"
if [[ "$TARGET_COUNT" -eq 0 ]]; then
    info "No modified target files found — nothing to verify."
    rm -f "$ALL_KEYS_FILE"
    exit 0
fi
info "Verifying $TARGET_COUNT target file(s)"

# ── 3. Check each target file ───────────────────────────────────────────────

OVERALL_RESULT=0
PASS_COUNT=0
FAIL_COUNT=0

for target in "${TARGET_FILES[@]}"; do
    target_name="$(basename "$target")"

    # Skip files with no uncommitted changes
    if git diff --quiet -- "$target" 2>/dev/null; then
        pass "$target_name — no remaining diff"
        PASS_COUNT=$((PASS_COUNT + 1))
        continue
    fi

    # Extract keys that appear in the current uncommitted diff
    DIFF_KEYS_FILE="$(mktemp)"
    git diff -- "$target" | grep "^[+-]" | grep -E "^[+-]\s*'" | grep -v "^[+-][+-][+-]" | extract_key | sort -u > "$DIFF_KEYS_FILE"

    # Find keys in the diff that are NOT in the relevant set
    UNEXPECTED_FILE="$(mktemp)"
    comm -23 "$DIFF_KEYS_FILE" "$ALL_KEYS_FILE" > "$UNEXPECTED_FILE"

    UNEXPECTED_COUNT="$(wc -l < "$UNEXPECTED_FILE" | tr -d ' ')"

    if [[ "$UNEXPECTED_COUNT" -eq 0 ]]; then
        DIFF_LINES="$(git diff --stat -- "$target" | tail -1 | awk '{print $4, $5, $6}')"
        pass "$target_name — all diff keys are relevant ($DIFF_LINES)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        OVERALL_RESULT=1
        FAIL_COUNT=$((FAIL_COUNT + 1))
        fail "$target_name — $UNEXPECTED_COUNT unexpected key(s):"
        while IFS= read -r key; do
            echo "    ✗ $key" >&2
        done < "$UNEXPECTED_FILE"
    fi

    rm -f "$DIFF_KEYS_FILE" "$UNEXPECTED_FILE"
done

rm -f "$ALL_KEYS_FILE"

# ── 4. Summary ──────────────────────────────────────────────────────────────

echo ""
info "Verification complete: $PASS_COUNT passed, $FAIL_COUNT failed"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
    echo ""
    warn "Unexpected keys found — the trim may have been too broad."
    warn "Review the failed files above and re-run trim or edit manually."
fi

exit "$OVERALL_RESULT"
