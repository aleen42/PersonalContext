---
name: ie-compatibility-skill
description: Provides a comprehensive solution for ensuring Internet Explorer (IE8+) compatibility in modern web applications built with Webpack.
---

# IE Compatibility Skill

This skill provides a comprehensive solution for ensuring Internet Explorer (IE8+) compatibility in modern web applications built with Webpack. It encapsulates configurations for Babel, PostCSS, and Webpack, along with necessary polyfills.

## Overview

The solution addresses compatibility issues in three main layers:

1.  **JavaScript Transpilation (Babel)**: Converts ES6+ syntax to ES5, ensuring code runs on older JS engines.
2.  **CSS Compatibility (PostCSS)**: Handles CSS prefixes, opacity fallbacks, and selector limitations.
3.  **Build Optimization (Webpack)**: Manages chunk splitting (to avoid IE selector limits) and minification settings safe for IE8.
4.  **Runtime Polyfills (Core-js)**: Provides standard library features missing in older browsers.

## Directory Structure

- `assets/index.js`: Exports the configuration objects for Babel, PostCSS, and Webpack.
- `assets/polyfills.js`: Entry point for importing the necessary polyfills.

## Usage

### 1. Webpack Configuration

Import the configurations in your `webpack.config.js`:

```javascript
import {babelRule, postcssPlugins, cssSplitPlugin, terserOptions, harmonyPlugin} from './ie-compatibility-skill/assets/index.js';

export default {
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
                        options : {postcssOptions : {plugins : postcssPlugins}},
                    },
                ],
            },
        ],
    },
    plugins      : [
        cssSplitPlugin, // Handle IE CSS selector limit
        harmonyPlugin,  // Handle ES3 keywords
    ],
    optimization : {
        minimizer : [
            new TerserPlugin({terserOptions}), // IE8 safe minification
        ],
    },
};
```

### 2. Polyfills

Include `polyfills.js` at the very beginning of your application entry point:

```javascript
import './ie-compatibility-skill/assets/polyfills.js';
import './app.js';
```

## Dependencies

Ensure the following packages are installed:

- `core-js`
- `babel-loader`, `@babel/core`, `@babel/preset-env`, `@babel/plugin-transform-runtime`
- `postcss-loader`, `autoprefixer`, `postcss-opacity`, `postcss-selector-not`
- `css-split-webpack-plugin`
- `terser-webpack-plugin`
