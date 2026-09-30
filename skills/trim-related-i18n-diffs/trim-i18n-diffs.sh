#!/usr/bin/env bash
# trim-i18n-diffs.sh — Keep only uncommitted i18n changes that correspond to
# keys added/removed/modified in a baseline *_zh_CN.js file within a given
# commit range.
#
# Usage:
#   trim-i18n-diffs.sh <baseline_file> <commit_range> [target_file ...]
#
# Examples:
#   # Auto-discover all modified sibling .js files
#   trim-i18n-diffs.sh path/to/lang_zh_CN.js abc123..HEAD
#
#   # Explicit target files
#   trim-i18n-diffs.sh path/to/lang_zh_CN.js abc123..HEAD path/to/lang_ja.js path/to/lang_ko.js
#
# Safety:
#   - The baseline *_zh_CN.js file is NEVER modified.
#   - Only files explicitly passed or auto-discovered as modified siblings are touched.
#   - The script operates purely on git show / working-tree reads and writes;
#     no git checkout or git restore is called.

set -euo pipefail

# ── Arguments ────────────────────────────────────────────────────────────────

BASELINE_FILE="${1:?Usage: $0 <baseline_file> <commit_range> [target_file ...]}"
COMMIT_RANGE="${2:?Missing commit range, e.g. abc123..HEAD}"
shift 2

# ── Helpers ──────────────────────────────────────────────────────────────────

info()  { printf '\033[36m[INFO]\033[0m %s\n' "$*"; }
warn()  { printf '\033[33m[WARN]\033[0m %s\n' "$*" >&2; }
die()   { printf '\033[31m[FATAL]\033[0m %s\n' "$*" >&2; exit 1; }

# Extract the i18n key from a JS object-entry line like:  'foo.bar' : 'value',
extract_key() {
    sed -n "s/^[+-]\?\s*'\\([^']*\\)'\\s*:.*/\\1/p" | head -1
}

# ── 1. Discover baseline directory & guard ───────────────────────────────────

BASELINE_DIR="$(dirname "$BASELINE_FILE")"
BASELINE_NAME="$(basename "$BASELINE_FILE")"

[[ "$BASELINE_NAME" == *_zh_CN.js ]] || warn "Baseline file does not match *_zh_CN.js — proceeding anyway"

# ── 2. Extract changed keys from baseline diff ──────────────────────────────

info "Inspecting baseline diff: $COMMIT_RANGE -- $BASELINE_FILE"

BASELINE_DIFF="$(git diff "$COMMIT_RANGE" -- "$BASELINE_FILE" 2>/dev/null)"

[[ -n "$BASELINE_DIFF" ]] || die "No diff found for baseline file in range $COMMIT_RANGE"

# Added keys
ADDED_KEYS=()
while IFS= read -r line; do
    key="$(echo "$line" | extract_key)"
    [[ -n "$key" ]] && ADDED_KEYS+=("$key")
done < <(echo "$BASELINE_DIFF" | grep "^+" | grep -E "^\+\s*'" | grep -v "^+++")

# Removed keys
REMOVED_KEYS=()
while IFS= read -r line; do
    key="$(echo "$line" | extract_key)"
    [[ -n "$key" ]] && REMOVED_KEYS+=("$key")
done < <(echo "$BASELINE_DIFF" | grep "^-" | grep -E "^\-\s*'" | grep -v "^---")

# Build the relevant key set (unique, sorted)
ALL_KEYS_FILE="$(mktemp)"
{
    printf '%s\n' "${ADDED_KEYS[@]+"${ADDED_KEYS[@]}"}"
    printf '%s\n' "${REMOVED_KEYS[@]+"${REMOVED_KEYS[@]}"}"
} | sort -u > "$ALL_KEYS_FILE"

KEY_COUNT="$(wc -l < "$ALL_KEYS_FILE" | tr -d ' ')"
info "Found $KEY_COUNT relevant keys in baseline diff"

if [[ "$KEY_COUNT" -le 30 ]]; then
    while IFS= read -r key; do
        echo "  + $key"
    done < "$ALL_KEYS_FILE"
else
    head -20 "$ALL_KEYS_FILE" | while IFS= read -r key; do echo "  + $key"; done
    echo "  ... ($((KEY_COUNT - 20)) more)"
fi

# ── 3. Discover target files ────────────────────────────────────────────────

TARGET_FILES=()
if [[ $# -gt 0 ]]; then
    TARGET_FILES=("$@")
else
    while IFS= read -r f; do
        [[ "$(basename "$f")" != "$BASELINE_NAME" ]] && TARGET_FILES+=("$f")
    done < <(git diff --name-only -- "$BASELINE_DIR"/*.js)
fi

TARGET_COUNT="${#TARGET_FILES[@]}"
[[ "$TARGET_COUNT" -gt 0 ]] || { info "No modified target files found — nothing to do."; exit 0; }
info "Discovered $TARGET_COUNT target files to trim"

# ── 4. Build key-value maps and trim ────────────────────────────────────────

build_key_value_map() {
    local file="$1"
    grep -E "^\s*'[^']*'\s*:" "$file" | while IFS= read -r line; do
        key="$(echo "$line" | sed -n "s/\s*'\\([^']*\\)'\\s*:.*/\\1/p")"
        if [[ -n "$key" ]]; then
            printf '%s\t%s\n' "$key" "$line"
        fi
    done
}

TRIMMED=0
UNCHANGED=0

for target in "${TARGET_FILES[@]}"; do
    target_name="$(basename "$target")"

    if git diff --quiet -- "$target" 2>/dev/null; then
        info "  $target_name — no uncommitted changes, skipping"
        UNCHANGED=$((UNCHANGED + 1))
        continue
    fi

    HEAD_FILE="$(mktemp)"
    git show "HEAD:$target" > "$HEAD_FILE" 2>/dev/null || {
        warn "  $target_name — not tracked in HEAD, skipping"
        rm -f "$HEAD_FILE"
        continue
    }

    WT_MAP_FILE="$(mktemp)"
    build_key_value_map "$target" > "$WT_MAP_FILE"

    HEAD_MAP_FILE="$(mktemp)"
    build_key_value_map "$HEAD_FILE" > "$HEAD_MAP_FILE"

    # Determine which relevant keys have working-tree changes
    CHANGED_RELEVANT=()
    while IFS= read -r key; do
        wt_line="$(grep -F "$key	" "$WT_MAP_FILE" | head -1)"
        head_line="$(grep -F "$key	" "$HEAD_MAP_FILE" | head -1)"

        wt_val="$(echo "$wt_line" | cut -f2-)"
        head_val="$(echo "$head_line" | cut -f2-)"

        if [[ -n "$wt_val" && "$wt_val" != "$head_val" ]]; then
            CHANGED_RELEVANT+=("$key")
        elif [[ -z "$wt_val" && -n "$head_val" ]]; then
            CHANGED_RELEVANT+=("$key")
        elif [[ -n "$wt_val" && -z "$head_val" ]]; then
            CHANGED_RELEVANT+=("$key")
        fi
    done < "$ALL_KEYS_FILE"

    if [[ ${#CHANGED_RELEVANT[@]} -eq 0 ]]; then
        cp "$HEAD_FILE" "$target"
        info "  $target_name — no relevant changes, restored to HEAD"
        UNCHANGED=$((UNCHANGED + 1))
        rm -f "$HEAD_FILE" "$WT_MAP_FILE" "$HEAD_MAP_FILE"
        continue
    fi

    # Rebuild: start from HEAD, overlay relevant changes
    OUTPUT_FILE="$(mktemp)"

    while IFS= read -r line; do
        key="$(echo "$line" | sed -n "s/\s*'\\([^']*\\)'\\s*:.*/\\1/p")"

        if [[ -n "$key" ]]; then
            is_relevant=false
            for rk in "${CHANGED_RELEVANT[@]}"; do
                if [[ "$rk" == "$key" ]]; then
                    is_relevant=true
                    break
                fi
            done

            if $is_relevant; then
                wt_line_val="$(grep -F "$key	" "$WT_MAP_FILE" | head -1 | cut -f2-)"
                if [[ -n "$wt_line_val" ]]; then
                    echo "$wt_line_val" >> "$OUTPUT_FILE"
                fi
            else
                echo "$line" >> "$OUTPUT_FILE"
            fi
        else
            echo "$line" >> "$OUTPUT_FILE"
        fi
    done < "$HEAD_FILE"

    # Add new relevant keys that exist in WT but NOT in HEAD
    while IFS= read -r key; do
        head_has="$(grep -F "$key	" "$HEAD_MAP_FILE" | head -1)"
        wt_has="$(grep -F "$key	" "$WT_MAP_FILE" | head -1)"

        if [[ -z "$head_has" && -n "$wt_has" ]]; then
            wt_full_line="$(echo "$wt_has" | cut -f2-)"

            preceding_head_key=""
            while IFS= read -r wt_entry; do
                wt_key="$(echo "$wt_entry" | cut -f1)"
                if [[ "$wt_key" == "$key" ]]; then
                    break
                fi
                if grep -qF "$wt_key	" "$HEAD_MAP_FILE"; then
                    preceding_head_key="$wt_key"
                fi
            done < "$WT_MAP_FILE"

            if [[ -n "$preceding_head_key" ]]; then
                sed -i "" "/${preceding_head_key}/a\\
${wt_full_line}
" "$OUTPUT_FILE"
            else
                sed -i "" '$ i\
'"${wt_full_line}"'
' "$OUTPUT_FILE"
            fi
        fi
    done < "$ALL_KEYS_FILE"

    cp "$OUTPUT_FILE" "$target"
    TRIMMED=$((TRIMMED + 1))

    diff_lines="$(git diff --stat -- "$target" | tail -1 | awk '{print $4, $5, $6}')"
    info "  $target_name — trimmed ($diff_lines)"

    rm -f "$HEAD_FILE" "$WT_MAP_FILE" "$HEAD_MAP_FILE" "$OUTPUT_FILE"
done

rm -f "$ALL_KEYS_FILE"

# ── 5. Summary ──────────────────────────────────────────────────────────────

echo ""
info "Done: $TRIMMED files trimmed, $UNCHANGED files unchanged"
info "Baseline: $BASELINE_FILE ($COMMIT_RANGE)"
info "Relevant keys: $KEY_COUNT"
