---
name: simplify-for-readability
description: Use before any code generation, code modification, or refactor to check whether the implementation can be made simpler, more direct, and more readable without changing behavior. Also use when a user explicitly asks to simplify code, reduce indirection, improve readability, or remove over-engineering.
---

# Simplify For Readability

## Overview

Prefer the simplest code that preserves behavior and defaults.

This skill is for refactors where the main goal is not “more architecture”, but “less to read, less to remember, less to mentally simulate”.

Apply this skill by default before finalizing any code change, even when the user did not explicitly ask for simplification.

## Core Rules

1. Delete indirection before adding structure.
   Inline helper methods if they are only forwarding state or hiding a one-line operation.

2. Convert at the boundary when different implementations need different concrete values.
   Keep shared state generic, then map it to tool-specific values only where the concrete API is called.

3. Preserve native defaults.
   Do not eagerly overwrite built-in defaults just because shared state exists. Only apply shared state after it is meaningfully set.

4. Extract constants only when they are real constants and referenced in multiple places.
   Do not introduce constants for single-use values, temporary mappings, or values that exist only to make code look more abstract.

5. Optimize for scanability.
   A reader should understand the control flow without jumping between multiple tiny helpers.

6. Prefer a single expression for small return-only branches.
   When a function only selects one value from a short ordered set of conditions, prefer a ternary expression over multiple `if` returns, as long as the result is still easy to scan top-to-bottom.

## Refactor Order

1. Identify the real state being shared.
2. Collapse duplicate storage into the minimum number of variables.
3. Move conversion logic to the call site or a single lookup helper when implementations differ.
4. Remove leftover helpers, wrappers, and dead branches.

## Required Check

Before finishing any code change, explicitly check:

- Can one layer of helpers, wrappers, or state be removed?
- Can the same behavior be expressed more directly?
- Did any extracted constant, helper, or abstraction actually improve readability?
- Is there a simpler version that preserves defaults and behavior?

## Decision Tests

Choose the version that makes more of these true:

- Fewer moving parts
- Fewer state variables
- Fewer helper hops
- Fewer places where defaults can be broken
- Easier to explain in one short paragraph

## Session Pattern

Bad:

- Different call sites each handle the same special case differently
- Helpers exist only to shuffle values around
- Shared state and concrete state drift apart

Better:

- Shared behavior is expressed once
- Special handling is concentrated at the boundary
- Readers can see the real control flow without chasing helpers
- Small ordered choices can be read as one expression instead of several return branches

## Anti-Patterns

- Introducing a manager/helper layer for a single direct assignment
- Restoring shared state before checking whether the user ever changed it
- Storing the same idea in multiple representations at once
- Extracting constants that are not truly constant
- Extracting single-use constants
- Extracting constants that make the code longer but not clearer
- Converting long or side-effecting branches into nested ternaries that are harder to scan than the original `if`
