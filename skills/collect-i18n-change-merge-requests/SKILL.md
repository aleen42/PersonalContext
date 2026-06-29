---
name: collect-i18n-change-merge-requests
description: Collect strict whitespace-prefixed merge request ids and corresponding changed i18n files from the source commits behind translation changes. Use when asked to analyze a git commit that changes language resource files such as `*_ar.properties`, `*_ja.js`, `*_fr_FR.jsp`, install templates, or `zh-CN.js` style editor resources; choose one language file per language group, map changed resources back to zh_CN or zh-CN baseline files, blame those source lines, and return deduplicated `\s!123` ids with file mappings while excluding repository-qualified ids such as `wmweb!123`.
---

# Collect I18n Change Merge Requests

## Workflow

Use the bundled script for this task. It codifies the fragile parts of the workflow:

* Group language files by removing locale suffixes such as `_ar.properties`, `_ja.properties`, `_fr_FR.properties`, `_ar.js`, and basename locale files such as `ar.js`.
* Pick one representative file per group, defaulting to the alphabetically first locale file.
* For `.properties`, extract only property keys changed by the target commit's diff.
* For other translation resources, extract changed new-file line numbers from the target commit's diff.
* Map each representative file to the matching `*_zh_CN.<ext>` or `zh-CN.js` baseline.
* Use `git blame` on each changed key or changed line in the baseline file to find the source commit for that text.
* Extract only merge request ids matching strict whitespace-prefixed `!123` with `(?<=\s)!\d+`.
* Exclude repository-qualified ids such as `wmweb!1025`.
* Output both file-group to id mappings and id to changed-file-group mappings.

Default supported extensions mirror `template.NG/build/i18n/collectResources.js`: `.properties`, `.js`, `.jsp`, `.letter`, `.eml`, `.html`, `.cf`, and `.txt`.

## Quick Start

Run from the git repository root:

```bash
python3 /path/to/collect-i18n-change-merge-requests/scripts/collect_i18n_change_mrs.py HEAD
```

Useful options:

```bash
python3 /path/to/collect-i18n-change-merge-requests/scripts/collect_i18n_change_mrs.py <commit> --json
python3 /path/to/collect-i18n-change-merge-requests/scripts/collect_i18n_change_mrs.py <commit> --no-groups
python3 /path/to/collect-i18n-change-merge-requests/scripts/collect_i18n_change_mrs.py <commit> --locales ar,ja,ko,vi
python3 /path/to/collect-i18n-change-merge-requests/scripts/collect_i18n_change_mrs.py <commit> --extensions properties,js,jsp,letter,eml,html,cf,txt
```

## Reporting

Report the total deduplicated ids first, then include the corresponding changed file groups for each id. State the commit analyzed and the strict extraction rule. If the script reports missing baseline keys, include that as residual risk rather than inventing ids from full file history.

Use the script output as the source of truth. Do not fall back to `git log -- <file>` for the whole file unless the user explicitly asks for full-file history.
