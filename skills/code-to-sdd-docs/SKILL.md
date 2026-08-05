---
name: code-to-sdd-docs
description: Analyze code snippets and reverse-engineer comprehensive documentation following OpenSpec specification. Generates proposal.md (requirements analysis), specs.md (functional specifications with edge cases), design.md (technical design document), and tasks.md (implementation task breakdown). Use when documenting existing code, creating specs from implementations, or onboarding to unfamiliar codebases.
---

# Code to SDD Docs Skill

This skill helps you reverse-engineer comprehensive specification documents from existing code snippets, following
the [OpenSpec](https://github.com/Fission-AI/OpenSpec) philosophy and structure.

## Overview

When working with existing codebases, documentation often lags behind implementation. This skill enables you to analyze code and
generate structured documentation that captures:

- **Why** the code exists (proposal.md)
- **What** it does and its boundaries (specs.md)
- **How** it works technically (design.md)
- **How** it can be decomposed into tasks (tasks.md)

## Philosophy

Following OpenSpec principles:

```
→ behavior-first not implementation-first
→ progressive rigor not heavy upfront process
→ testable scenarios not vague descriptions
→ brownfield-friendly not greenfield-only
```

## Workflow

### Step 1: Code Analysis

When provided with code snippets, analyze:

1. **Purpose & Intent**
    - What problem does this code solve?
    - What business need does it address?
    - Who are the users/consumers?

2. **Inputs & Outputs**
    - What data does it accept?
    - What does it produce/return?
    - What side effects does it have?

3. **Dependencies**
    - External libraries/modules used
    - Internal dependencies
    - Configuration requirements

4. **Edge Cases & Error Handling**
    - How does it handle invalid inputs?
    - What error states exist?
    - What are the boundary conditions?

5. **Patterns & Architecture**
    - Design patterns employed
    - Architectural decisions
    - Code organization

### Step 2: Generate proposal.md

The proposal captures **intent**, **scope**, and **approach** at a high level.

```markdown
# Proposal: [Feature/Module Name]

## Intent

[Why does this code exist? What problem does it solve? What business need does it address?]

## Scope

In scope:

- [What functionality is covered]
- [What use cases are supported]

Out of scope:

- [What is explicitly not handled]
- [Future considerations]

## Approach

[High-level technical approach taken]

## Success Criteria

- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk description] | Low/Medium/High | Low/Medium/High | [How to mitigate] |

## Dependencies

- [External dependency 1]
- [Internal dependency 2]

## Timeline Estimate

- [Estimated effort or complexity]
```

### Step 3: Generate specs.md

The spec captures **requirements** and **scenarios** using Given/When/Then format.

```markdown
# [Domain] Specification

## Purpose

[High-level description of this spec's domain]

## Requirements

### Requirement: [Requirement Name]

The system SHALL/MUST/SHOULD [behavior description].

**Rationale**: [Why this requirement exists]

#### Scenario: [Happy Path Scenario]

- GIVEN [initial context/preconditions]
- WHEN [action/trigger]
- THEN [expected outcome]
- AND [additional assertions]

#### Scenario: [Edge Case Scenario]

- GIVEN [edge case context]
- WHEN [action/trigger]
- THEN [expected behavior]

#### Scenario: [Error Scenario]

- GIVEN [error-prone context]
- WHEN [invalid action]
- THEN [error handling behavior]

### Requirement: [Another Requirement]

[Continue pattern...]

## Constraints

- [Technical constraint]
- [Business constraint]
- [Security/privacy constraint]

## Assumptions

- [Assumption made]
- [Another assumption]

## Out of Scope

- [Explicitly excluded functionality]
```

#### RFC 2119 Keywords

Use these keywords to indicate requirement strength:

| Keyword              | Meaning                          | Usage                       |
|----------------------|----------------------------------|-----------------------------|
| **MUST** / **SHALL** | Absolute requirement             | Critical functionality      |
| **MUST NOT**         | Absolute prohibition             | Security/safety constraints |
| **SHOULD**           | Recommended but exceptions exist | Best practices              |
| **SHOULD NOT**       | Not recommended                  | Anti-patterns to avoid      |
| **MAY**              | Optional                         | Nice-to-have features       |

### Step 4: Generate design.md

The design document captures the **technical approach** and **implementation details**.

```markdown
# Design: [Feature/Module Name]

## Overview

[High-level technical summary]

## Architecture

### Component Diagram
```

[ASCII or description of component relationships]

```markdown

### Data Flow
```

[ASCII or description of data movement]

```markdown

## Technical Decisions

### Decision 1: [Decision Title]
**Context**: [What situation necessitated this decision]

**Options Considered**:
1. [Option A] - [Pros/Cons]
2. [Option B] - [Pros/Cons]

**Decision**: [Chosen option]

**Rationale**: [Why this option was chosen]

### Decision 2: [Another Decision]
[Continue pattern...]

## Implementation Details

### [Module/Component 1]
- **Purpose**: [What it does]
- **Key Functions**:
  - `functionName()`: [Description]
  - `anotherFunction()`: [Description]
- **State Management**: [How state is handled]
- **Error Handling**: [How errors are handled]

### [Module/Component 2]
[Continue pattern...]

## Data Models

### [Model Name]
```

[Schema or structure definition]

```markdown

## API Contracts

### [Endpoint/Function Name]
- **Input**: [Parameters and types]
- **Output**: [Return type and structure]
- **Errors**: [Possible error conditions]

## Security Considerations
- [Security measure 1]
- [Security measure 2]

## Performance Considerations
- [Performance optimization 1]
- [Performance optimization 2]

## Testing Strategy
- **Unit Tests**: [What is unit tested]
- **Integration Tests**: [What is integration tested]
- **Edge Cases**: [Special scenarios to test]

## Trade-offs
| Trade-off | Chosen | Alternative | Reason |
|-----------|--------|-------------|--------|
| [Trade-off description] | [Choice] | [Alternative] | [Reasoning] |
```

### Step 5: Generate tasks.md

The tasks document provides an **implementation checklist** broken down into manageable pieces.

**Important**: When reverse-engineering from existing code, you MUST check the input context to determine if each task has
already been implemented. Mark tasks as done (`[x]`) when the implementation satisfies the task requirements, and leave them as
incomplete (`[ ]`) only for missing or partial implementations.

#### Task Completion Verification Process

For each identified task, verify against the input code:

1. **Check Implementation Existence**: Does the code contain the functionality described?
2. **Verify Completeness**: Is the implementation complete and functional?
3. **Validate Against Acceptance Criteria**: Does it meet the expected behavior?
4. **Mark Accordingly**:
    - `[x]` for fully implemented tasks
    - `[ ]` for not implemented or partial implementations
    - `[~]` for partially implemented (optional, with note on what's missing)

```markdown
# Tasks: [Feature/Module Name]

## Overview

[Summary of the work to be done]

**Implementation Status**: [Summary of what's already done vs. what remains]

## Task Breakdown

### Phase 1: [Phase Name]

**Estimated Effort**: [Time/Complexity]

- [x] **1.1** [Task description] ✅ Already implemented
    - **Details**: [Additional context]
    - **Acceptance**: [How to verify completion]
    - **Dependencies**: [Any prerequisite tasks]
    - **Implementation Note**: [Brief note on how it's implemented in the code]

- [ ] **1.2** [Task description] ❌ Not implemented
    - **Details**: [Additional context]
    - **Acceptance**: [How to verify completion]
    - **Dependencies**: [Any prerequisite tasks]
    - **Gap Analysis**: [What's missing from the implementation]

- [~] **1.3** [Task description] ⚠️ Partially implemented
    - **Details**: [Additional context]
    - **Acceptance**: [How to verify completion]
    - **Dependencies**: [Any prerequisite tasks]
    - **Missing Parts**: [What still needs to be done]

### Phase 2: [Phase Name]

**Estimated Effort**: [Time/Complexity]

- [x] **2.1** [Task description] ✅ Already implemented
    - **Details**: [Additional context]
    - **Acceptance**: [How to verify completion]
    - **Dependencies**: [Any prerequisite tasks]

- [ ] **2.2** [Task description] ❌ Not implemented
    - **Details**: [Additional context]
    - **Acceptance**: [How to verify completion]
    - **Dependencies**: [Any prerequisite tasks]

### Phase 3: Testing & Validation

**Estimated Effort**: [Time/Complexity]

- [x] **3.1** Write unit tests for [component] ✅ Tests exist
    - **Coverage Target**: [Percentage or specific cases]
    - **Dependencies**: [Prerequisite tasks]
    - **Test Files**: [List existing test files if found]

- [ ] **3.2** Write integration tests for [feature] ❌ No tests found
    - **Scenarios**: [Key scenarios to test]
    - **Dependencies**: [Prerequisite tasks]

- [ ] **3.3** Perform edge case testing
    - **Edge Cases**: [List edge cases]
    - **Dependencies**: [Prerequisite tasks]

### Phase 4: Documentation & Cleanup

**Estimated Effort**: [Time/Complexity]

- [x] **4.1** Update API documentation ✅ Documented
- [ ] **4.2** Update README if needed
- [ ] **4.3** Code review and refactoring

## Task Dependencies
```

[ASCII diagram showing task dependencies]

```markdown

## Implementation Status Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Complete | [X] | [X]% |
| ⚠️ Partial | [X] | [X]% |
| ❌ Not Started | [X] | [X]% |

## Notes
- [Any additional notes or context]
- [Link to related resources]
```

## Usage Examples

### Example 1: Analyzing a Function

**Input Code**:

```javascript
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return {valid : false, error : 'Email is required'};
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {valid : false, error : 'Invalid email format'};
    }

    if (email.length > 254) {
        return {valid : false, error : 'Email exceeds maximum length'};
    }

    return {valid : true};
}
```

**Expected Output**: Generate all four documents capturing:

- **proposal.md**: Why email validation is needed
- **specs.md**: Requirements for validation, edge cases (null, invalid format, length)
- **design.md**: Regex pattern choice, error handling approach
- **tasks.md**: Implementation tasks with completion status:

```markdown
# Tasks: Email Validation

## Overview

Email validation functionality implementation.

**Implementation Status**: All core functionality implemented. No tests found.

## Task Breakdown

### Phase 1: Core Implementation

**Estimated Effort**: Low

- [x] **1.1** Implement null/undefined check ✅ Already implemented
    - **Details**: Check if email is null, undefined, or not a string
    - **Acceptance**: Returns error object for invalid inputs
    - **Implementation Note**: `if (!email || typeof email !== 'string')` handles this

- [x] **1.2** Implement email format validation ✅ Already implemented
    - **Details**: Validate email against regex pattern
    - **Acceptance**: Returns error for invalid format
    - **Implementation Note**: Uses regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

- [x] **1.3** Implement length validation ✅ Already implemented
    - **Details**: Check email doesn't exceed 254 characters
    - **Acceptance**: Returns error for oversized emails
    - **Implementation Note**: `if (email.length > 254)` check exists

### Phase 2: Testing & Validation

**Estimated Effort**: Medium

- [ ] **2.1** Write unit tests for validateEmail ❌ No tests found
    - **Coverage Target**: 100% branch coverage
    - **Test Cases Needed**:
        - Valid email format
        - Null/undefined input
        - Non-string input
        - Invalid format (no @, no domain, etc.)
        - Max length boundary

## Implementation Status Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Complete | 3 | 75% |
| ❌ Not Started | 1 | 25% |
```

### Example 2: Analyzing a React Component

**Input Code**:

```jsx
function UserProfile({userId}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                const response = await api.getUser(userId);
                setUser(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [userId]);

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;
    return <UserCard user={user} />;
}
```

**Expected Output**: Generate documents capturing:

- **proposal.md**: User profile display requirement
- **specs.md**: Loading states, error handling, data requirements
- **design.md**: Component structure, state management, API integration
- **tasks.md**: Component creation, API integration, testing with completion status:

```markdown
# Tasks: UserProfile Component

## Overview

User profile display component with data fetching and state management.

**Implementation Status**: Core component implemented. Testing and accessibility incomplete.

## Task Breakdown

### Phase 1: Component Structure

**Estimated Effort**: Low

- [x] **1.1** Set up component with props interface ✅ Already implemented
    - **Acceptance**: Component accepts userId prop
    - **Implementation Note**: `function UserProfile({userId})`

- [x] **1.2** Implement state management ✅ Already implemented
    - **Details**: user, loading, error states
    - **Implementation Note**: Uses `useState` for all three states

### Phase 2: Data Fetching

**Estimated Effort**: Medium

- [x] **2.1** Implement API integration ✅ Already implemented
    - **Acceptance**: Fetches user data from API
    - **Implementation Note**: `api.getUser(userId)` in useEffect

- [x] **2.2** Handle loading state ✅ Already implemented
    - **Implementation Note**: `if (loading) return <Spinner />`

- [x] **2.3** Handle error state ✅ Already implemented
    - **Implementation Note**: `if (error) return <ErrorMessage error={error} />`

- [x] **2.4** Implement userId dependency tracking ✅ Already implemented
    - **Implementation Note**: `useEffect(..., [userId])`

### Phase 3: Testing

**Estimated Effort**: Medium

- [ ] **3.1** Write unit tests ❌ No tests found
    - **Test Cases Needed**:
        - Renders loading state initially
        - Renders user card on success
        - Renders error message on failure
        - Re-fetches when userId changes

- [ ] **3.2** Write integration tests ❌ No tests found
    - **Scenarios**: API interaction, state transitions

### Phase 4: Accessibility & Polish

**Estimated Effort**: Low

- [~] **4.1** Add accessibility attributes ⚠️ Partially implemented
    - **Missing Parts**: ARIA labels, role attributes for loading/error states

- [ ] **4.2** Add error boundary handling ❌ Not implemented

## Implementation Status Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Complete | 6 | 67% |
| ⚠️ Partial | 1 | 11% |
| ❌ Not Started | 3 | 22% |
```

## Best Practices

### 1. Analyze Before Documenting

- Read code thoroughly before generating docs
- Identify implicit requirements from implementation
- Note any discrepancies or potential bugs

### 2. Capture Intent, Not Just Implementation

- Document *why* decisions were made
- Include business context when inferable
- Preserve rationale for future maintainers

### 3. Identify Edge Cases

- Look for boundary conditions in code
- Document error handling as scenarios
- Consider race conditions and async issues

### 4. Keep It Lightweight

- Start with the essentials
- Add detail progressively
- Don't over-document obvious things

### 5. Make It Testable

- Write scenarios that could be tests
- Use Given/When/Then format consistently
- Include both happy path and error cases

### 6. Verify Task Completion Status

When generating tasks.md from existing code:

- **Cross-reference code against tasks**: For each task, explicitly verify if the implementation exists
- **Mark completed tasks honestly**: Use `[x]` only when the code fully satisfies the task requirements
- **Document gaps clearly**: For incomplete tasks, note what specifically is missing
- **Provide implementation notes**: Briefly explain how each completed task is implemented in the code
- **Include status summary**: Add a summary table showing completion percentage
- **Be specific about partial work**: Use `[~]` for partial implementations with details on what's missing

**Verification Checklist**:

- [ ] Does the code implement the core functionality?
- [ ] Are all edge cases handled?
- [ ] Is error handling present?
- [ ] Do tests exist for the functionality?
- [ ] Is documentation complete?

## Document Relationships

```
proposal.md ──────► specs.md ──────► design.md ──────► tasks.md
     │                  │                 │                │
   intent             what              how              steps
  + scope          + scenarios      + decisions       + checklist
```

Each document builds on the previous:

- **proposal.md** sets the context
- **specs.md** defines the contract
- **design.md** explains the implementation
- **tasks.md** breaks down the work

## References

- [OpenSpec GitHub](https://github.com/Fission-AI/OpenSpec)
- [OpenSpec Concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md)
- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) - Key words for use in RFCs
- [Given/When/Then](https://martinfowler.com/bliki/GivenWhenThen.html) - BDD Scenario Format
