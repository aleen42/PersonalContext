---
name: ie-compatibility-skill
description: Provides a comprehensive solution for ensuring Internet Explorer (IE8+) compatibility in modern web applications built with Webpack. Use when configuring Babel, PostCSS, or Webpack for IE support, adding polyfills, or debugging IE-specific issues.
---

# IE Compatibility Skill

This skill provides a comprehensive solution for ensuring Internet Explorer (IE8+) compatibility in modern web applications
built with Webpack. It encapsulates configurations for Babel, PostCSS, and Webpack, along with necessary polyfills.

## Overview

The solution addresses compatibility issues in four main layers:

1. **JavaScript Transpilation (Babel)**: Converts ES6+ syntax to ES5, ensuring code runs on older JS engines.
2. **CSS Compatibility (PostCSS)**: Handles CSS prefixes, opacity fallbacks, and selector limitations.
3. **Build Optimization (Webpack)**: Manages chunk splitting (to avoid IE selector limits) and minification settings safe for
   IE8.
4. **Runtime Polyfills (Core-js)**: Provides standard library features missing in older browsers.

## Directory Structure

```
ie-compatibility-skill/
├── SKILL.md                        # This documentation
└── assets/
    ├── index.js                    # Main exports: babelRule, postcssPlugins, etc.
    ├── polyfills.js                # Entry point for all polyfills
    ├── console.js                  # Console polyfill for IE8
    ├── IE-polyfills.js             # IE-specific DOM polyfills
    ├── HarmonyWebpackPlugin.js     # Webpack plugin for ES3 compatibility
    ├── postcss-opacity.js          # PostCSS plugin for opacity fallback
    └── TransformObjectRestSpread.js # Babel plugin for object rest spread
```

## Configuration Components

### 1. Babel Configuration (`babelRule`)

The Babel configuration transpiles ES6+ JavaScript to ES5 compatible code.

**Features:**

- `@babel/preset-env` in loose mode with `forceAllTransforms: true`
- `modules: false` to preserve ES modules for Webpack
- Excludes `@babel/transform-function-name` to avoid IE issues
- Custom `TransformObjectRestSpread` plugin using `_.assign` instead of `Object.assign`

**Export:**

```javascript
export const babelRule = {
    enforce : 'post',
    test    : /\.js$/,
    use     : {
        loader  : 'babel-loader',
        options : {
            presets : [
                ['@babel/env', {
                    forceAllTransforms : true,
                    loose              : true,
                    modules            : false,
                    exclude            : ['@babel/transform-function-name'],
                }],
            ],
            plugins : [
                ['@babel/transform-runtime', {
                    helpers     : false,
                    regenerator : true,
                }],
                [TransformObjectRestSpread, {loose : true, useBuiltIns : true}],
            ],
        },
    },
};
```

### 2. PostCSS Configuration (`postcssPlugins`)

PostCSS plugins for CSS compatibility with older browsers.

**Plugins:**

- `postcss-selector-not`: Transforms `:not()` selectors for better compatibility
- `postcss-opacity`: Adds `filter: alpha(opacity=X)` fallback for IE
- `autoprefixer`: Adds vendor prefixes automatically

**Export:**

```javascript
export const postcssPlugins = [
    postcssSelectorNot(),
    postcssOpacity(),
    autoprefixer(),
];
```

### 3. Webpack Plugins

#### CSS Split Plugin (`cssSplitPlugin`)

Splits CSS files to avoid the IE9 limit of 4095 selectors per file.

```javascript
export const cssSplitPlugin = new CSSSplitWebpackPlugin({});
```

#### Harmony Plugin (`harmonyPlugin`)

Patches Webpack output to quote ES3 reserved keywords (like `default`, `catch`) when used as property names. This is critical
for IE8 which doesn't support ES5+ syntax.

**Patches applied:**

- ESM module exports registration
- Property definition getters (removes `Object.defineProperty`)
- `__esModule` marker (simplifies assignment)
- `document.head` to `document.getElementsByTagName("head")[0]`

```javascript
export const harmonyPlugin = HarmonyPlugin.es3();
```

### 4. Terser Minification (`terserOptions`)

Minification options configured to be safe for IE8.

**Features:**

- `ie8: true` - Enables IE8-safe transformations
- `quote_style: 1` - Always quote property names
- Removes `console.debug` calls in production

```javascript
export const terserOptions = {
    ie8      : true,
    output   : {
        quote_style : 1,
    },
    mangle   : {},
    compress : {
        warnings   : false,
        dead_code  : true,
        pure_funcs : ['debug', 'console.debug'],
    },
};
```

## Polyfills

### Main Entry (`polyfills.js`)

Import this file at the very beginning of your application entry point.

```javascript
// Core-js stable polyfills (ES6+ features)
import 'core-js/stable';

// Additional polyfills for specific DOM features
import 'classlist-polyfill';

// Custom Console Methods under IE
import './console.js';

// Custom IE hacks (if any, e.g., for HTML5 tags in IE8)
import './IE-polyfills.js';
```

### Console Polyfill (`console.js`)

Ensures `console` methods are available in IE8 where the `console` object might be null or undefined when developer tools are
closed.

**Features:**

- Creates stub console object if missing
- Normalizes `console.log` behavior
- Binds methods properly for IE compatibility

### IE DOM Polyfills (`IE-polyfills.js`)

Contains fixes for specific Internet Explorer issues:

1. **HTML5 Element Shiv**: Creates HTML5 semantic tags for IE8
2. **Focus Handling Fix**: Prevents IE8 exception when focusing invisible elements
3. **Event Polyfills**: Adds `preventDefault` and `stopPropagation` to `Event.prototype`

## Usage

### Complete Webpack Configuration

```javascript
import {
    babelRule,
    postcssPlugins,
    cssSplitPlugin,
    terserOptions,
    harmonyPlugin
} from './ie-compatibility-skill/assets/index.js';
import TerserPlugin from 'terser-webpack-plugin';

export default {
    entry        : {
        app : './src/index.js',
    },
    module       : {
        rules : [
            babelRule, // Add Babel loader rule
            {
                test : /\.css$/,
                use  : [
                    'style-loader',
                    'css-loader',
                    {
                        loader  : 'postcss-loader',
                        options : {
                            postcssOptions : {
                                plugins : postcssPlugins,
                            },
                        },
                    },
                ],
            },
        ],
    },
    plugins      : [
        cssSplitPlugin,  // Handle IE CSS selector limit
        harmonyPlugin,   // Handle ES3 keywords
    ],
    optimization : {
        minimizer : [
            new TerserPlugin({terserOptions}), // IE8 safe minification
        ],
    },
};
```

### Application Entry Point

Include polyfills at the very beginning of your entry file:

```javascript
// Import polyfills first - MUST be before any other imports
import './ie-compatibility-skill/assets/polyfills.js';

// Then import your application
import './app.js';
```

### Using with SCSS/Less

```javascript
module.exports = {
    module : {
        rules : [
            babelRule,
            {
                test : /\.scss$/,
                use  : [
                    'style-loader',
                    'css-loader',
                    {
                        loader  : 'postcss-loader',
                        options : {
                            postcssOptions : {
                                plugins : postcssPlugins,
                            },
                        },
                    },
                    'sass-loader',
                ],
            },
        ],
    },
};
```

## Dependencies

Ensure the following packages are installed:

```bash
npm install --save-dev \
    # Babel
    babel-loader \
    @babel/core \
    @babel/preset-env \
    @babel/plugin-transform-runtime \
    # PostCSS
    postcss-loader \
    autoprefixer \
    postcss-selector-not \
    # Webpack plugins
    terser-webpack-plugin \
    css-split-webpack-plugin

# Runtime dependencies
npm install core-js classlist-polyfill
```

## IE Version Support Matrix

| Feature                              | IE8 | IE9 | IE10 | IE11 |
|--------------------------------------|-----|-----|------|------|
| ES5 Syntax                           | ✅   | ✅   | ✅    | ✅    |
| ES6+ Syntax (transpiled)             | ✅   | ✅   | ✅    | ✅    |
| CSS Opacity                          | ✅   | ✅   | ✅    | ✅    |
| CSS Selector Limit                   | ⚠️  | ✅   | ✅    | ✅    |
| HTML5 Tags                           | ✅   | ✅   | ✅    | ✅    |
| Console API                          | ✅   | ✅   | ✅    | ✅    |
| Event.preventDefault/stopPropagation | ✅   | ✅   | ✅    | ✅    |

## Common Issues and Solutions

### Issue: "Object doesn't support property or method 'bind'"

**Solution**: Ensure `core-js/stable` is imported at the very top of your entry file before any other code.

```javascript
// WRONG - other code may execute before polyfills
import './app.js';
import './polyfills.js';

// CORRECT - polyfills load first
import './polyfills.js';
import './app.js';
```

### Issue: CSS styles not applied in IE

**Possible causes:**

1. CSS selector limit exceeded (>4095 selectors)
2. Missing vendor prefixes

**Solution**: Ensure `cssSplitPlugin` and `postcssPlugins` are configured correctly.

### Issue: "Expected identifier" error in IE8

**Cause**: ES3 reserved keywords used as property names without quotes.

**Solution**: Ensure `harmonyPlugin` is added to your Webpack plugins array.

### Issue: Console errors in IE8 when dev tools closed

**Solution**: The `console.js` polyfill handles this. Ensure it's imported in your polyfills entry.

### Issue: Focus exception "Can't move focus to the control"

**Solution**: The `IE-polyfills.js` includes a focus patch. Ensure it's imported.

## Best Practices

### 1. Load Polyfills First

Always import polyfills before any application code to ensure all features are available.

```javascript
// polyfills.js should be your first import
import './ie-compatibility-skill/assets/polyfills.js';
```

### 2. Test in Real IE Environments

Don't rely solely on IE emulation modes. Test in:

- Real IE8/IE9/IE10/IE11 browsers
- BrowserStack or similar services
- Virtual Machines with native IE

### 3. Keep Polyfills Minimal

Only include polyfills you actually need. Consider using `@babel/preset-env` with `useBuiltIns: 'usage'` for smaller bundles.

### 4. Handle CSS Selector Limits

Monitor your CSS bundle sizes. If approaching 4095 selectors per file, the `cssSplitPlugin` will automatically split them.

### 5. Use `loose` Mode Carefully

Babel's `loose` mode produces smaller, faster code but may deviate slightly from spec. Test thoroughly.

### 6. Avoid `class` Syntax

Per project conventions, avoid ES6 `class` definitions. Use factory functions or prototype-based inheritance instead.

## Advanced Configuration

### Custom Terser Options

```javascript
import {terserOptions} from './ie-compatibility-skill/assets/index.js';

const customTerserOptions = {
    ...terserOptions,
    compress : {
        ...terserOptions.compress,
        // Add custom compress options
        drop_console : true, // Remove all console.* calls
    },
};
```

### Extending PostCSS Plugins

```javascript
import {postcssPlugins} from './ie-compatibility-skill/assets/index.js';

const customPostcssPlugins = [
    ...postcssPlugins,
    // Add additional plugins
    require('postcss-preset-env')({
        stage : 3,
    }),
];
```

### Conditional Loading

Load polyfills only when needed:

```javascript
// In your entry file
if (typeof window !== 'undefined' && !window.Promise) {
    // Browser needs polyfills
    require('./ie-compatibility-skill/assets/polyfills.js');
}
```

## Debugging Tips

### 1. Check Bundle Order

Ensure polyfills appear first in your bundle:

```bash
# Analyze bundle composition
npx webpack-bundle-analyzer dist/app.js
```

### 2. Inspect Generated CSS

Check that opacity fallbacks are generated:

```css
/* Input */
.element {
    opacity: 0.5;
}

/* Output */
.element {
    filter: alpha(opacity=50);
    opacity: 0.5;
}
```

### 3. Verify ES3 Compatibility

Check that reserved keywords are quoted in output:

```javascript
// Input (ESM)
export default function () {}

// Output (ES3 compatible)
exports['default'] = function () {};
```

## References

- [Babel Documentation](https://babeljs.io/docs/en/)
- [PostCSS Documentation](https://postcss.org/)
- [Webpack Documentation](https://webpack.js.org/)
- [core-js Documentation](https://github.com/zloirock/core-js)
- [IE8 Compatibility Guide](https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/)
- [ES3 Specification](https://www.ecma-international.org/publications-and-standards/standards/ecma-262/)
