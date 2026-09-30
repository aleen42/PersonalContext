/**
 * Console Polyfill for IE8
 *
 * Ensures that `console` methods are available even in IE8 where the `console` object
 * might be null or undefined when developer tools are closed. It also normalizes
 * `console.log` behavior.
 */

// In IE8, the console object is null if developer tools are not open.

// https://stackoverflow.com/questions/3326650/console-is-undefined-error-for-internet-explorer

const console = (self.console = self.console || {});
// define undefined methods as noop to prevent errors
const noop = () => {};
// Union of Chrome, Firefox, IE, Opera, and Safari console methods
const methods = [
    'assert', 'cd', 'clear', 'count', 'countReset',
    'dir', 'dirxml', 'exception', 'group', 'groupCollapsed',
    'groupEnd', 'markTimeline', 'profile', 'profileEnd',
    'select', 'table', 'time', 'timeEnd', 'timeStamp', 'timeline',
    'timelineEnd',
];

['log', 'debug', 'info', 'warn', 'error'].forEach(method => {
    if (console[method] instanceof Function) {
        // just fine
    } else if (console[method] == null) {
        console[method] = console.log || noop;
    } else {
        // IE problem: console.log.call(...) does not work (because typeof console.log === 'object')
        console[method] = Function.prototype.call.bind(console[method], console);
    }
});

methods.forEach(method => {
    if (console[method] == null) {
        console[method] = noop;
    }
});
