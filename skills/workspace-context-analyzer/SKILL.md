---
name: workspace-context-analyzer
description: Analyze current workspace code context to understand project structure, identify key technologies, map code relationships, and provide comprehensive codebase insights. Use when you need to understand a new codebase, perform code reviews, identify technical debt, or assess project complexity and architecture.
---

# Workspace Context Analyzer Skill

This skill helps you systematically analyze and understand the current workspace's code context, providing deep insights into project structure, technology stack, code relationships, and architectural patterns.

## Overview

When working with unfamiliar codebases or performing code reviews, it's crucial to quickly understand the project's structure, technologies, and key components. This skill provides a systematic approach to analyze the workspace and extract meaningful insights.

## Analysis Workflow

### Step 1: Project Structure Analysis

First, examine the overall project structure to understand the organization:

1. **Directory Layout**
    - Identify main directories and their purposes
    - Note conventional directories (src/, lib/, test/, docs/, etc.)
    - Locate configuration files and build scripts

2. **File Distribution**
    - Count files by type and extension
    - Identify the predominant languages and technologies
    - Note any unusual file patterns or structures

3. **Project Metadata**
    - Examine package.json, pom.xml, requirements.txt, etc.
    - Extract project name, version, dependencies
    - Identify build tools and frameworks

### Step 2: Technology Stack Identification

Analyze the codebase to identify the technology ecosystem:

1. **Programming Languages**
    - Primary and secondary languages used
    - Language versions and compatibility requirements

2. **Frameworks and Libraries**
    - Frontend frameworks (React, Vue, Angular, etc.)
    - Backend frameworks (Express, Django, Spring, etc.)
    - Database libraries and ORMs
    - Utility libraries and tooling

3. **Build and Deployment Tools**
    - Build systems (Webpack, Rollup, Gradle, etc.)
    - Package managers (npm, yarn, pip, etc.)
    - CI/CD configurations
    - Containerization (Docker, Kubernetes)

### Step 3: Code Architecture Analysis

Understand the architectural patterns and code organization:

1. **Design Patterns**
    - Identify common design patterns in use
    - Note architectural styles (MVC, MVVM, microservices, etc.)

2. **Component Relationships**
    - Map module dependencies
    - Identify circular dependencies
    - Trace data flow patterns

3. **Code Quality Indicators**
    - Spot duplicated code patterns
    - Identify overly complex functions
    - Note inconsistent coding styles

### Step 4: Key Components Mapping

Create a mental map of the most important components:

1. **Entry Points**
    - Main application entry points
    - API endpoints and routes
    - Service initialization points

2. **Core Modules**
    - Business logic components
    - Data models and services
    - Utility functions and helpers

3. **External Interfaces**
    - Database connections
    - API integrations
    - Third-party service dependencies

## Detailed Analysis Techniques

### File System Exploration

Use systematic approaches to explore the workspace:

```bash
# List all files recursively with size and modification time
find . -type f -exec ls -lh {} \; | sort -k5 -hr

# Count files by extension
find . -name "*.*" -type f | sed 's/.*\.//' | sort | uniq -c | sort -nr

# Find configuration files
find . -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.xml" -o -name "*.toml"

# Identify executable scripts
find . -name "*.sh" -o -name "*.js" -o -name "*.py" -exec grep -l "^#!" {} \;
```

### Dependency Analysis

Examine project dependencies to understand the ecosystem:

**For Node.js projects:**
```bash
# Analyze package.json dependencies
cat package.json | jq '.dependencies, .devDependencies'

# Check for security vulnerabilities
npm audit

# List dependency tree
npm ls --depth=0
```

**For Python projects:**
```bash
# Analyze requirements.txt
cat requirements.txt

# Check for security issues
pip-audit -r requirements.txt

# List installed packages with versions
pip list
```

### Code Pattern Recognition

Identify common patterns and anti-patterns:

1. **Framework Detection**
    - Look for framework-specific file names and structures
    - Identify configuration patterns
    - Spot boilerplate code

2. **Architecture Hints**
    - Directory naming conventions
    - File organization patterns
    - Import/require statement patterns

3. **Quality Indicators**
    - Consistent naming conventions
    - Proper error handling patterns
    - Test coverage indicators

## Context Reporting Template

ALWAYS use this structured format for workspace analysis reports:

```markdown
# Workspace Context Analysis: [Project Name]

## Executive Summary
[Brief overview of key findings - 2-3 sentences]

## Project Structure
### Directory Layout
[Tree-like representation of main directories]

### Key Files
[List of important configuration and entry point files]

## Technology Stack
### Languages
- [Primary language and version]
- [Secondary languages if any]

### Frameworks & Libraries
- [Main framework]
- [Key libraries and their purposes]

### Build & Deployment
- [Build tools]
- [Deployment strategy]

## Architecture Overview
### Design Patterns
[List of identified patterns]

### Component Structure
[High-level component relationships]

### Entry Points
[List of main entry points]

## Key Insights
### Strengths
- [Notable strengths of the codebase]

### Areas for Improvement
- [Potential issues or technical debt]

### Risks
- [Critical risks or concerns]

## Next Steps
[Recommended actions based on analysis]
```

## Best Practices for Context Analysis

### 1. Start Broad, Then Narrow

Begin with high-level structure analysis before diving into specific files:

- First: Understand the overall organization
- Second: Identify key technologies and frameworks
- Third: Examine specific components in detail

### 2. Look for Documentation First

Check for existing documentation that can provide context:

- README.md files
- Documentation directories
- Code comments and annotations
- Configuration file comments

### 3. Identify Communication Patterns

Pay attention to how components interact:

- API contracts and interfaces
- Data flow patterns
- Event handling mechanisms
- State management approaches

### 4. Note Inconsistencies

Document any inconsistencies that might indicate issues:

- Mixed coding styles
- Inconsistent naming conventions
- Different approaches to similar problems
- Deprecated or outdated code patterns

### 5. Focus on Business Logic

Prioritize understanding the core business functionality:

- Where is the main business logic located?
- How is data processed and transformed?
- What are the key workflows?

## Common Analysis Scenarios

### Scenario 1: New Project Onboarding

When joining a new project, use this analysis to:

1. Quickly understand the codebase structure
2. Identify key technologies and frameworks
3. Locate important entry points and configuration
4. Recognize existing patterns and conventions

### Scenario 2: Code Review Preparation

Before performing a code review:

1. Understand the project's architectural patterns
2. Identify key components that might be affected
3. Recognize established coding conventions
4. Spot areas that might need special attention

### Scenario 3: Technical Debt Assessment

When evaluating technical debt:

1. Identify inconsistent code patterns
2. Spot duplicated functionality
3. Note outdated dependencies
4. Recognize architectural anti-patterns

### Scenario 4: Migration Planning

When planning migrations or upgrades:

1. Identify version dependencies
2. Map component interdependencies
3. Recognize breaking change risks
4. Plan migration order and strategy

## Tools and Techniques

### Static Analysis Commands

Use these commands to gather insights:

```bash
# Find all unique file extensions
find . -type f -name "*.*" | sed 's/.*\.//' | sort | uniq -c | sort -nr

# Search for specific patterns across files
grep -r "TODO\|FIXME\|HACK" --include="*.js" --include="*.ts" .

# Find large files that might need attention
find . -type f -size +100k -exec ls -lh {} \; | awk '{ print $5 ": " $9 }'
```

### Dependency Visualization

Create mental maps of dependencies:

1. **Import/Require Analysis**
    - Track module imports and exports
    - Identify dependency chains
    - Spot circular dependencies

2. **Configuration Dependencies**
    - Environment variables
    - External service configurations
    - Database connection settings

## Example Analysis

### Example 1: React Application

**Analysis Focus:**
- Component structure and hierarchy
- State management patterns
- API integration approaches
- Build configuration and optimization

**Key Indicators:**
- Presence of `components/`, `containers/`, `hooks/` directories
- Redux or Context API usage patterns
- API service layer organization
- Webpack/Babel configuration files

### Example 2: Node.js API Service

**Analysis Focus:**
- Route organization and middleware
- Database integration patterns
- Error handling strategies
- Authentication and authorization

**Key Indicators:**
- `routes/`, `controllers/`, `middleware/` directories
- Database ORM usage (Sequelize, Mongoose, etc.)
- JWT or session-based authentication
- Logging and monitoring setup

## Output Quality Guidelines

### Depth vs. Breadth

Balance comprehensive coverage with meaningful insights:

- **Breadth**: Cover all major aspects of the workspace
- **Depth**: Provide detailed analysis of key components
- **Relevance**: Focus on information that aids understanding

### Actionable Insights

Ensure your analysis provides actionable information:

- Clear identification of key components
- Specific recommendations for improvement
- Concrete next steps for deeper investigation
- Risk assessment for critical areas

### Contextual Awareness

Consider the broader context:

- Project maturity and lifecycle stage
- Team size and development practices
- Business domain and requirements
- Performance and scalability needs

## Integration with Other Skills

This skill works well in conjunction with:

- **code-to-sdd-docs**: After analyzing context, use this to create detailed documentation
- **git-commit-convention**: Understanding project history and changes
- **superpowers-systematic-debugging**: When investigating specific issues identified during context analysis

## References

- Project structure best practices
- Common framework patterns and conventions
- Code quality assessment techniques
- Technical debt identification methods