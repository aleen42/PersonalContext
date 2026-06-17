---
name: fix-err-i18n-translations
description: Retranslate i18n resource text marked with <err> from the matching *_zh_CN.* baseline while preserving HTML tags, attributes, placeholders, file encoding, and unrelated edits. Use when a user asks to handle machine-translation error markers, fix <err> labels in language resource files, or retranslate only the erroneous parts of properties/js i18n files based on Chinese source text.
---

# Fix Err I18n Translations

## Purpose

Use this skill to repair machine-translated i18n resource entries marked with `<err>`. A marker means the text was detected as wrong and must be translated again from the matching Simplified Chinese baseline, not simply removed.

## Required Workflow

1. Find the latest relevant source of `<err>` markers.
   - Prefer the current working tree if markers still exist.
   - If a previous attempt may have removed markers, recover the marker scope from git with `git log -S'<err>'` and `git show <commit>:<file>`.
   - Do not rely on line numbers alone when files may have shifted; pair line data with key names for `.properties` files.

2. Locate the Simplified Chinese baseline file.
   - For files named like `help_es.properties`, use the sibling `help_zh_CN.properties`.
   - For other suffix patterns, replace the locale suffix with `_zh_CN` while preserving the basename and extension.
   - If no baseline exists, stop and report the missing file.

3. Extract only the marked text fragments.
   - For `.properties`, parse logical entries, including continuation lines ending with `\`.
   - For HTML-valued entries, preserve tags, attributes, paths, entities, indentation, and trailing continuation backslashes.
   - Translate only visible text inside tags or plain text values. Do not translate tag names, attributes, `style`, `class`, `src`, placeholders, variables, or image filenames.
   - If a line has `<err>`, retranslate the corresponding Chinese visible text at the same structural position, then remove `<err>`.

4. Replace narrowly.
   - Keep unrelated translated lines untouched.
   - Keep the original file encoding.
   - For CJK target languages, still preserve HTML structure exactly; only the visible text changes.

5. Validate before reporting completion.
   - Count remaining `<err>` markers; it must be `0` in the handled files.
   - Decode every modified file with the original encoding.
   - Compare HTML tag sequences before and after for every originally marked line; mismatches must be `0`.
   - Run `git diff --check -- <modified files>`.
   - Inspect diffs for accidental baseline changes or unrelated edits.

## Helper Script

Use `scripts/audit_err_i18n.py` to list marker scope and validate structure. The script does not translate; it makes the fragile discovery and verification steps deterministic.

Common usage:

```bash
python3 /path/to/fix-err-i18n-translations/scripts/audit_err_i18n.py \
    --lang-dir <lang-resource-dir> \
    --commit <commit-with-err-markers> \
    --mode report
```

After edits:

```bash
python3 /path/to/fix-err-i18n-translations/scripts/audit_err_i18n.py \
    --lang-dir <lang-resource-dir> \
    --commit <commit-with-err-markers> \
    --mode validate
```

## Translation Rules

- Preserve product terms when the target language commonly uses them: `AI`, `Agent`, `ICS`, `HTML`, `MCP`.
- Preserve UI label quoting consistently with nearby translations in the same file.
- Keep punctuation natural for the target language, but do not alter surrounding HTML structure.
- For very long paragraphs, translate the whole visible paragraph from Chinese to keep terminology consistent.
- If uncertain about a target language phrase, prefer clear literal product UI wording over fluent paraphrase that changes meaning.

## Red Flags

- Deleting `<err>` without changing the text.
- Replacing an entire HTML entry with translated text that drops tags or attributes.
- Translating image paths like `ai_02_zh.jpg` or CSS attributes.
- Changing `*_zh_CN.*` baseline files.
- Letting shell tools corrupt non-UTF-8 resource files.
