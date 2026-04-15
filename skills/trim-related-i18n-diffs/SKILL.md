---
name: trim-related-i18n-diffs
description: Use when the user wants to keep only the still-uncommitted i18n changes in sibling language files that truly correspond to a known change range in one baseline Simplified Chinese file, such as any `*_zh_CN.js` file, while dropping unrelated edits from other language files in the same directory.
---

# Trim Related I18n Diffs

Use this skill when a commit range in one Simplified Chinese language file is the source of truth, and the task is to keep only the current uncommitted changes in sibling i18n files that correspond to those real changes.

Typical requests:

- "Keep only the uncommitted translation changes in sibling language files that truly correspond to the real changes in a baseline `*_zh_CN.js` file."
- "Use the diff of a `*_zh_CN.js` file as the source of truth, then trim unrelated pending edits from other language files in the same directory."
- "Extract the actual changed i18n keys from a Chinese baseline file and preserve only those still-uncommitted edits in other locale files."
- "Do not keep changes by raw line-number overlap alone; determine which keys were really changed and keep only matching edits in sibling translations."

## Goal

Turn a noisy set of uncommitted i18n edits into a focused diff that keeps only the changes that are semantically tied to a baseline file's real modifications.

## Inputs To Identify

Gather these inputs before editing:

- A commit range, usually `A..B`
- One baseline i18n file inside that range, matching `*_zh_CN.js`
- The current uncommitted target files, discovered from sibling language files in the same directory
- Whether the baseline file itself should stay untouched

If the user does not say otherwise, assume the baseline file is only used for analysis and you should trim the other currently modified sibling language files in the same directory.

## Workflow

### 1. Inspect the baseline diff

Run a diff for the baseline file over the requested range and determine the real changed keys.

Preferred command pattern:

```bash
git diff <range> -- <baseline-file>
```

Do not rely on line numbers alone. Treat these as the real changes:

- Added keys
- Removed keys
- Renamed keys
- Existing keys whose values changed and therefore imply corresponding translation updates elsewhere

When reading the patch, extract the i18n keys from changed object entries, for example lines that look like:

```js
'reset' : '重置',
```

### 2. Build the relevant key set

Create the smallest possible key set from the baseline diff.

Include:

- Added keys
- Removed keys
- Replacement pairs such as `foo.old` and `foo.new`
- Existing keys whose text changed in the baseline file

Do not include unrelated neighbors just because they share nearby line numbers.

### 3. Find the uncommitted candidate files

List the currently modified sibling language files in the same directory as the baseline file and narrow to the intended scope.

Preferred command pattern:

```bash
git diff --name-only -- <baseline-dir>/*.js
git status --short
```

Usually this means:

```text
all `*.js` language files in the same directory as the chosen `*_zh_CN.js`
```

Selection rules:

- Start from the baseline file's parent directory
- Discover sibling files in that directory instead of hardcoding one filename pattern when possible
- Exclude the baseline `*_zh_CN.js` itself unless the user explicitly asks to trim it too
- If the directory contains multiple Chinese baselines such as `foo_zh_CN.js` and `bar_zh_CN.js`, only use the one the user named, or the one whose diff range was explicitly provided

### 4. Trim each target file against `HEAD`

For each modified target file:

- Use `HEAD` as the clean baseline
- Compare `HEAD` content with the working tree content
- Keep only edits for keys inside the relevant key set
- Revert all other uncommitted edits in that file

This is the important rule:

- Preserve current working tree content for relevant keys
- Preserve `HEAD` content for irrelevant keys

That means the output file should effectively be:

- `HEAD` file content
- plus only the working tree edits for relevant keys

### 5. Handle add, remove, rename correctly

Key-specific handling:

- If a relevant key exists in `HEAD` and in working tree, copy the working tree line back onto the `HEAD` structure
- If a relevant key exists only in working tree, insert it near its natural neighboring keys
- If a relevant key exists only in `HEAD` and was intentionally removed in working tree, keep that removal

Do not reorder the whole file unless the file was already reordered. Prefer minimal diffs.

### 6. Verify the trimmed result

After editing, verify that the remaining diff is limited to the relevant key set.

Recommended checks:

- `git diff --stat -- <targets>`
- `git diff -- <sample-target>`
- spot-check 2 to 3 representative files

The remaining hunks should only touch keys from the relevant key set. If unrelated strings like search, AI, or text mode keys remain, the trim was too broad and should be corrected.

## Safe Editing Rules

- Never revert unrelated files outside the intended i18n target set
- Never trust line-number overlap by itself
- Prefer key-based matching over hunk-based matching
- Preserve file encoding, LF endings, and existing formatting
- Make the smallest possible diff that satisfies the user's request

## Practical Strategy

For many sibling language files, scripting the trim is safer than manual editing.

A reliable approach is:

1. Extract relevant keys from the baseline range diff
2. Read each target file from `HEAD`
3. Read each target file from working tree
4. Rebuild the output from `HEAD`, overlaying only relevant key changes from the working tree
5. Write back only if the rebuilt file differs from the current working tree

This approach is especially useful when many language files contain mixed relevant and irrelevant edits.

## Output Expectations

When reporting back to the user, summarize:

- Which baseline file and commit range were used
- Which key groups were identified as real changes
- Which target files were trimmed
- That unrelated uncommitted edits in those files were removed
- Any assumptions you made

## Example Fit

This skill is a strong fit for workflows like:

- baseline: any sibling file matching `*_zh_CN.js`
- targets: other modified language files in the same directory
- range: `<sha>..HEAD`

Where the goal is to keep only the still-uncommitted translation changes in sibling files that truly map to the baseline file's changed keys.
