---
name: code-review
description: Use when the user asks for a review, code review, codereview, commit review, PR review, diff review, or wants a bug-focused assessment of changes. Default to a code review mindset that prioritizes findings about correctness, regressions, risks, and missing tests over summaries.
---

# Code Review

Use this skill when the task is to evaluate code rather than to implement changes immediately.

## Goal

Produce a review that mirrors Codex's built-in review behavior:

- Prioritize bugs, behavioral regressions, risky assumptions, and missing tests.
- Treat findings as the primary output.
- Keep summaries brief and secondary.
- Focus on the changed code and its likely runtime impact.
- If no findings are discovered, say that explicitly and mention residual risk or testing gaps.

## What To Inspect

Review with the following order of attention:

1. Correctness and broken behavior
2. Regressions versus prior behavior
3. Edge cases and unsafe assumptions
4. Compatibility or integration risks
5. Missing, weak, or misleading tests
6. Maintainability issues only when they create real risk

Do not spend most of the review on style nits unless the user explicitly asks for style review.
Do not drift into implementation unless the user also asks for changes.

## Review Workflow

1. Identify the review scope.
   - Current working tree, staged changes, a commit, a diff, a branch, or a specific file set.
   - If the scope is ambiguous but one reasonable default exists, use it and state the assumption.
2. Read the relevant diff before reading large amounts of surrounding code.
3. Open only the files needed to validate suspicious changes, call sites, and tests.
4. Look for behavior changes, not just syntax issues.
5. Check whether tests cover the changed paths and important failure modes.
6. Stop once the highest-signal findings are supported by evidence.

## Default Scope Assumptions

When the user does not specify scope, prefer these defaults:

1. Review the latest local changes when the conversation is already about a recent edit.
2. Review the latest commit when the user says `latest commit` or similar.
3. Review the current diff or working tree when the user says `review this` with no other detail.

State the assumption briefly instead of blocking on a question unless the ambiguity is materially risky.

## Findings Bar

Only raise a finding when all of the following are true:

- There is a concrete problem or meaningful risk.
- You can point to the file and line that caused the concern.
- You can explain the user-visible or system-visible impact.

Prefer fewer high-confidence findings over many speculative comments.
Do not pad the review with weak observations just to make the review feel substantial.

## Response Format

Present findings first, ordered by severity.

For each finding, include:

- A short severity label if useful, such as `P1`, `P2`, or `P3`
- The affected file and line reference
- The problem
- Why it matters in behavior or risk terms

After findings, include:

- Open questions or assumptions
- A brief change summary only if it helps
- Residual risk or testing gaps when there are no findings

If there are no findings, explicitly say no findings were identified.

## Default Review Stance

- Assume the author may be correct; verify before criticizing.
- Be direct and specific, not dramatic.
- Do not rewrite code or propose large redesigns unless needed to explain a finding.
- Do not fix the code unless the user also asks for implementation.
- Prefer evidence from the diff, surrounding code, and tests over intuition.
- Keep overviews short. The review should center on actionable findings, not retelling the patch.

## Evidence Standards

- Read enough surrounding code to confirm whether a suspicious diff is actually wrong.
- Check call sites, data flow, and tests before claiming a regression.
- Distinguish confirmed findings from open questions.
- When uncertain, lower confidence and phrase it as an assumption or question instead of a hard finding.

## Example Triggers

This skill should trigger for requests such as:

- `review this`
- `help me to review the last commit`
- `code review`
- `review this diff`
- `check this PR for bugs`
- `look for regressions`

## Non-Goals

- Full style or lint review unless explicitly requested
- Large-scale redesign proposals unless needed to explain a concrete issue
- Silent implementation of fixes during a review-only request
