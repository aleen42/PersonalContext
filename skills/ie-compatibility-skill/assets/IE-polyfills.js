/**
 * IE Specific Polyfills and Fixes
 *
 * This file contains fixes for specific Internet Explorer issues:
 * 1. HTML5 element shiv for IE8
 * 2. Focus handling fix
 * 3. Event.preventDefault/stopPropagation polyfills
 */

'use strict';

(function (win) {
    if (!win.ActiveXObject) {
        // this patch is only for IE
        return;
    }

    // Enable HTML5 semantic tags in IE8
    ['header', 'footer', 'section', 'aside', 'article', 'nav', 'hgroup', 'figure', 'figcaption', 'time', 'mark', 'output', 'meter']
        .forEach(tagName => document.createElement(tagName));

    if (win.attachEvent && !win.addEventListener) {
        win.attachEvent('onload', function () {
            let html = document.documentElement,
                clazz = html.className;

            html.className = clazz + ' ie-force-pseudo-refresh';
            setTimeout(function () { html.className = clazz; }, 10);
        });
    }


    patchFocus(/* IE9+ */ win.HTMLElement) || patchFocus(/* IE8 */ win.Element);

    function patchFocus(type) {
        let focus = type && type.prototype && type.prototype.focus;
        return focus && (type.prototype.focus = function focusResetCursor() {
            // Prevent IE8 exception: "Can't move focus to the control because it is invisible,
            //                  not enabled, or of a type that does not accept the focus"
            // https://stackoverflow.com/a/18691478/5698182
            try {
                focus.call(this);
                // set cursor to the end under IE
                let tmp = this.value;
                this.value = '';
                this.value = tmp;
            } catch (ignore) { }
        });
    }

    if (win.Event /* IE6 does not have global Event object */ && Event.prototype) {
        Event.prototype.preventDefault || (Event.prototype.preventDefault = function () { this.returnValue = false; });
        Event.prototype.stopPropagation || (Event.prototype.stopPropagation = function () { this.cancelBubble = true; });
    }
})(window);
