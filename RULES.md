# AI Code Generation Rules

Please follow these rules strictly when generating or modifying code in this project according to their technology stack.

## JavaScript / TypeScript

### Style & Formatting

- **Indentation**: Use **4 spaces**. Do NOT use tabs.
- **Semicolons**: **Always** use semicolons at the end of statements.
- **Quotes**: Use **single quotes** (`'`) for strings. Use backticks (`` ` ``) only for template literals.
- **Trailing Commas**: **Always** use trailing commas in multi-line objects and arrays. Avoid trailing commas in single-line objects/arrays or function parameters.
- **Object Shorthand**: Use ES6 object shorthand syntax (e.g., `{foo}` instead of `{foo : foo}`).
- **Object Spacing**: **No spaces** inside braces. Use at least one space **before and after** the colon (e.g., `{name : 'Aleen'}`).
- **Object Alignment**: **Align** colons in object properties across multiple lines.
    * Example:
      ```javascript
      const obj = {
          name    : 'Aleen',
          age     : 18,
          country : 'China',
      };
      ```
- **No Space Inside Brackets/Parens**: Do NOT add spaces inside array brackets or function parentheses (e.g., `[1, 2]`, `function(a, b)`).
- **Method Chaining**: Use indentation with a leading dot on new lines for long chains.
- **Operators**: Surround binary operators with spaces; do not space unary operators.
- **Brace Style**: Use **1TBS** (One True Brace Style). The closing curly brace must be on the **same line** as the subsequent keyword (`else`, `catch`, `finally`).
    * Example:
      ```javascript
      // Correct
      if (condition) {
          doSomething();
      } else {
          doOther();
      }

      try {
          riskyOperation();
      } catch (e) {
          handleError(e);
      } finally {
          cleanup();
      }

      // Incorrect
      if (condition) {
          doSomething();
      }
      else {
          doOther();
      }
      ```

### Language Features & Compatibility

- **No Classes**: **DO NOT use ES6 `class` definitions**.
    * *Reason*: Legacy browser compatibility (IE) and project conventions (`cm/no-class` rule).
    * *Alternative*: Use factory functions, plain objects, or prototype-based inheritance.
- **Variables**: Prefer `const` and `let`.
- **Equality**: Prefer strict equality `===`.
- **Modules**: Prefer **ESM** (`import`/`export`), and fall back to **CJS** (`require`/`module.exports`) only when the project's `package.json` does not explicitly declare `"type": "module"`.

## Less / CSS

- **Indentation**: Use **4 spaces**.
- **Syntax**: Use **Less** for styling.
- **Naming**: Follow **BEM** (Block Element Modifier) naming convention.
    * Example: `.block__element--modifier`

## HTML / JSP

- **Indentation**: Use **4 spaces**.
- **Attributes**: Use double quotes (`"`) for attribute values.

## Markdown

- **Lists**: Use asterisks (`-`) for unordered lists.
- **Indentation**: Use **4 spaces** for sub-lists / nested items.
- **Spacing**: Use exactly **1 space** after the list marker (e.g., `* Item`, not `*   Item`).
- **Headers**: Use ATX style headers (`#`, `##`, etc.).
- **Paragraphs**: There must be a new blank line between headers and paragraphs. 

## Tech Stack & Ecosystem

### Core

- **Runtime**: Node.js (CLI tools), Browser (Polyfills, Web Apps).
- **Languages**: JavaScript (Core), HTML5, CSS3/Less.
- **Documentation**: GitBook, Markdown.

### Tooling

- **Build**: Webpack.
- **Testing**: Mocha, Chai, Karma.
- **Linting**: ESLint (Custom [`aleen42`](https://github.com/aleen42/eslint-config-aleen42) config), typically extending standard rules with 4-space indentation.

## General

- **Charset**: UTF-8.
- **Line Endings**: LF (Unix style).
- **Trailing Whitespace**: Remove trailing whitespace from lines.
- **Final Newline**: Ensure exactly one newline at the end of the file.
