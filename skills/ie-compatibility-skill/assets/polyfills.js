/**
 * IE Polyfills Entry
 *
 * Import this file at the top of your application entry point.
 */

// Core-js stable polyfills (ES6+ features)
import 'core-js/stable';

// Additional polyfills for specific DOM features
import 'classlist-polyfill';

// Custom Console Methods under IE
import './console.js';

// Custom IE hacks (if any, e.g., for HTML5 tags in IE8)
import './IE-polyfills.js';
