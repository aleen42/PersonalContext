---
name: git-commit-convention
description: Enforces conventional commit message format for consistent and readable Git commit history. Use when writing commit messages, creating changelogs, or reviewing commit practices.
---

# Git Commit Convention Skill

This skill provides guidelines for writing consistent and meaningful Git commit messages following the Conventional Commits
specification.

## Overview

Conventional Commits is a specification for adding human and machine readable meaning to commit messages. It makes it easier to
write automated tools on top of the commit history.

## Commit Message Format

Each commit message consists of a **header**, an optional **body**, and an optional **footer**.

```
<type>(<scope>): <subject> #<issue> !<mr|pr>

[optional body]

[optional footer(s)]
```

### Header (Required)

The header is mandatory and must conform to the format:

```
<type>(<scope>): <subject> #<issue> !<mr|pr>
```

- **type**: Required. Describes the kind of change.
- **scope**: Optional. Describes the module/component affected.
- **subject**: Required. A brief description of the change.
- **issue**: Optional. Issue ID prefixed with `#` (e.g., `#123`).
- **mr|pr**: Optional. Merge Request or Pull Request ID prefixed with `!` (e.g., `!456`).

#### Types

| Type           | Description                                                        |
|----------------|--------------------------------------------------------------------|
| `feat`         | New feature                                                        |
| `perf`         | Performance improvement or functionality enhancement               |
| `breaking`     | Backwards-incompatible change that causes compatibility issues     |
| `fix`          | General bug fix that is externally perceivable                     |
| `security`     | Security issue fix (prefer over `fix` for security issues)         |
| `cosmetic`     | UI issue fix, can be abbreviated as `cos`                          |
| `exception`    | Exception-triggering issue fix, including frontend JS exceptions   |
| `test`         | Writing, correcting, or supplementing test cases                   |
| `docs` / `doc` | Documentation update                                               |
| `refactor`     | Code refactoring                                                   |
| `lint`         | Code style changes (formatting, convention compliance adjustments) |
| `style`        | (*lint) Prefer `lint`; use only for pure formatting changes        |
| `typo`         | Typo correction                                                    |
| `chore`        | Miscellaneous tasks (avoid when a more specific type can be used)  |
| `ci`           | CI/CD tasks                                                        |
| `build`        | Build tasks (boundary with CI/CD may be fuzzy)                     |
| `release`      | Release tasks (e.g., version bump operations)                      |
| `revert`       | Code revert                                                        |

#### Type Aliases

The following types from [kazupon/git-commit-message-convention](https://github.com/kazupon/git-commit-message-convention) are
also supported as aliases:

| Type          | Maps To | Description                                       |
|---------------|---------|---------------------------------------------------|
| `new`         | `feat`  | for new feature implementing commit               |
| `feature`     | `feat`  | for new feature implementing commit (equal `new`) |
| `bug`         | `fix`   | for bug fix commit                                |
| `performance` | `perf`  | for performance issue fix commit                  |
| `improvement` | `perf`  | for backwards-compatible enhancement commit       |
| `deprecated`  | -       | for deprecated feature commit                     |
| `examples`    | `docs`  | for example code commit                           |
| `dependency`  | `build` | for dependencies upgrading or downgrading commit  |
| `config`      | `chore` | for configuration commit                          |
| `update`      | -       | for update commit                                 |
| `wip`         | -       | for work in progress commit                       |

#### Scope (Optional)

The scope should be the name of the module/component affected. Examples:

- `core`
- `api`
- `ui`
- `auth`
- `config`
- `deps`

#### Subject (Required)

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end
- Keep it under 72 characters

**Good Examples:**

- `feat(auth): add OAuth2 login support`
- `fix(api): resolve null pointer exception in user service`
- `docs(readme): update installation instructions`
- `feat(auth): add OAuth2 login support #123`
- `fix(api): resolve null pointer in user service #456 !789`
- `chore(deps): update webpack to v5 #100 !200`

**Bad Examples:**

- `Added new feature` (missing type, capitalized)
- `feat: Added OAuth2 login support.` (capitalized, ends with dot)
- `fix(api): Fixed the bug.` (too vague, capitalized, ends with dot)

#### Issue Reference (Optional)

Add issue ID prefixed with `#` to link the commit to a specific issue:

- Format: `#<issue-number>`
- Example: `feat(auth): add login #123`

#### MR/PR Reference (Optional)

Add Merge Request or Pull Request ID prefixed with `!` to link the commit:

- Format: `!<mr|pr-number>`
- Example: `feat(auth): add login #123 !456`

### Body (Optional)

- Use the imperative, present tense
- Should include the motivation for the change and contrast with previous behavior
- Separate from subject with a blank line

**Example:**

```
feat(auth): add OAuth2 login support

Implement OAuth2 authentication flow to allow users to sign in with
third-party providers. This replaces the previous basic auth mechanism
which was less secure and harder to maintain.

The implementation supports Google, GitHub, and Microsoft providers.
```

### Footer (Optional)

The footer can contain:

- **Breaking changes**: Start with `BREAKING CHANGE:` followed by description
- **Issue references**: e.g., `Closes #123`, `Fixes #456`

**Breaking Change Example:**

```
feat(api): redesign user endpoint response format

BREAKING CHANGE: The user API endpoint now returns a different JSON
structure. The `userId` field has been renamed to `id`, and the
`userName` field has been renamed to `username`.

Closes #789
```

## Complete Examples

### Simple Commit

```
fix(button): resolve click event not firing on iOS
```

### Commit with Issue Reference

```
feat(auth): add OAuth2 login support #123
```

### Commit with Issue and MR/PR Reference

```
fix(api): resolve null pointer in user service #456 !789
```

### Commit with Body

```
feat(dropdown): add keyboard navigation support #101

Users can now navigate dropdown options using arrow keys and select
with Enter. This improves accessibility and user experience for
keyboard-only users.
```

### Breaking Change

```
refactor(core): rename configuration options #200 !300

BREAKING CHANGE: Configuration options have been renamed for clarity:
- `maxItems` is now `maxLimit`
- `showAll` is now `displayAll`

Update your configuration files accordingly.
```

### Multiple Issues

```
fix(parser): handle malformed JSON input #123 !456

Add validation to prevent crashes when parsing invalid JSON data.

Fixes #123
Closes #456
```

## Best Practices

1. **Be Specific**: Vague messages like "fix bug" or "update code" are unhelpful.

2. **Keep It Short**: Subject line should be under 72 characters.

3. **Use Imperative Mood**: Write as if you're giving a command: "add feature" not "added feature".

4. **Explain Why, Not What**: The diff shows what changed; the message should explain why.

5. **Reference Issues**: Link to relevant issues, PRs, or tickets.

6. **Atomic Commits**: Each commit should represent one logical change.

## Tools Integration

This convention works well with:

- **commitlint**: Lint commit messages
- **standard-version**: Automatic versioning and CHANGELOG generation
- **semantic-release**: Full automated release workflow
- **conventional-changelog**: Generate changelogs from commit history

### commitlint.config.js Example

```javascript
module.exports = {
    extends : ['@commitlint/config-conventional'],
    rules   : {
        'type-enum'         : [2, 'always', [
            // Recommended types
            'feat',
            'perf',
            'breaking',
            'fix',
            'security',
            'cosmetic',
            'cos',
            'exception',
            'test',
            'docs',
            'doc',
            'refactor',
            'lint',
            'style',
            'typo',
            'chore',
            'ci',
            'build',
            'release',
            'revert',
            // Type aliases
            'new',
            'feature',
            'bug',
            'performance',
            'improvement',
            'deprecated',
            'examples',
            'dependency',
            'config',
            'update',
            'wip',
        ]],
        'subject-case'      : [2, 'never', ['upper-case']],
        'subject-full-stop' : [2, 'never', '.'],
        'header-max-length' : [2, 'always', 72],
    },
};
```

### package.json Scripts

```json
{
  "scripts" : {
    "commit"       : "cz",
    "release"      : "standard-version",
    "release:beta" : "standard-version --prerelease beta"
  }
}
```

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)
- [commitlint](https://commitlint.js.org/)
- [standard-version](https://github.com/conventional-changelog/standard-version)
