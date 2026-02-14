/**
 * IE Compatibility Configuration Skill
 *
 * This module exports configurations for Babel, PostCSS, and Webpack to support Internet Explorer.
 */

import TerserPlugin from 'terser-webpack-plugin';
import CSSSplitWebpackPlugin from 'css-split-webpack-plugin';
import HarmonyPlugin from './HarmonyWebpackPlugin.js';
import TransformObjectRestSpread from './TransformObjectRestSpread.js';
import postcssOpacity from './postcss-opacity.js';
import postcssSelectorNot from 'postcss-selector-not';
import autoprefixer from 'autoprefixer';

/**
 * Babel Loader Rule
 *
 * Configured with @babel/preset-env in loose mode and modules: false.
 */
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

/**
 * PostCSS Plugins
 *
 * - postcss-selector-not: Transforms :not() selectors for better compatibility.
 * - postcss-opacity: Adds fallback for opacity in IE.
 * - autoprefixer: Adds vendor prefixes.
 */
export const postcssPlugins = [
    postcssSelectorNot(),
    postcssOpacity(),
    autoprefixer(),
];

/**
 * CSS Split Webpack Plugin
 *
 * Splits CSS files to avoid the IE9 limit of 4095 selectors per file.
 */
export const cssSplitPlugin = new CSSSplitWebpackPlugin({});

/**
 * Terser Minification Options
 *
 * Configured to be safe for IE8 (quoting property names, removing `console.debug`).
 */
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

/**
 * Harmony Plugin
 *
 * Patches webpack output to quote ES3 reserved keywords (like default, catch) when used as property names.
 */
export const harmonyPlugin = HarmonyPlugin.es3();
