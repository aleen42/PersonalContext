// modified from https://github.com/inferpse/es3-harmony-webpack-plugin

import webpack from 'webpack';

const name = 'HarmonyWebpackPlugin';

/**
 * @class HarmonyPlugin
 * @returns HarmonyPlugin
 */
export default function HarmonyPlugin() {

    /** @typedef {function(string, import('webpack').Compilation): ?string} PatchFn */
    const /** @type {Object<string, PatchFn>} */ runtimeModulePatches = {};
    const /** @type {[RegExp, string][]} */ moduleSourcePatches = [];
    const self = Object.assign(Object.create(HarmonyPlugin.prototype), /** @lends HarmonyPlugin# */{
        /**
         * @param {Object<string, PatchFn>} data - `{identity : patched generate function}`
         * @returns HarmonyPlugin
         */
        patchRuntimeModule : data => Object.assign(runtimeModulePatches, data) && self,

        /**
         * @param {[RegExp, string]} data
         * @returns HarmonyPlugin
         */
        patchModuleSource : (...data) => moduleSourcePatches.push(...data) && self,
    });

    self.apply = compiler => {
        compiler.hooks.compilation.tap(name, compilation => {
            compilation.hooks.afterRuntimeRequirements.tap(name, () => {
                for (const module of compilation.modules) {
                    if (module instanceof webpack.RuntimeModule) {
                        const patchFn = runtimeModulePatches[module.identifier()];
                        patchFn && (module.generate = () => patchFn(
                            Object.getPrototypeOf(module).generate.call(module), compilation));
                    }
                }
            });

            const javascriptHooks = webpack.javascript.JavascriptModulesPlugin.getCompilationHooks(compilation);
            if (runtimeModulePatches['']) {
                javascriptHooks.renderRequire.tap(name, content => runtimeModulePatches[''](content));
            }
            if (moduleSourcePatches.length) {
                javascriptHooks.renderModuleContent.tap(name, replaceSourceBy(moduleSourcePatches));
            }
        });
    }
    return self;
}

/** Helper function which handles replacements in the module source */
const replaceSourceBy = replacements => (source, module) => {
    const origin = source, originSource = origin.source();
    replacements.forEach(([/* RegExp */regex, /* string */replacement]) => {
        if (module.type === 'javascript/esm') {
            // The signature of the ES module init method is inconsistent with the init method signature triggered by javascript/auto for ESM, as follows:
            // - javascript/auto => cjs : function(module, (__unused_webpack_)?exports, __webpack_require__)
            // - javascript/auto => esm : function(__unused_webpack_module, __webpack_exports__, __webpack_require__)
            // -  (concatenated) => esm : function(__unused_webpack_module, __webpack_exports__, __webpack_require__)
            // - javascript/esm  => esm : function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__)
            replacement = replacement.replace(/\b__unused_webpack_module\b/g, `__unused_webpack_${module.moduleArgument}`);
        }
        regex.lastIndex = 0;
        for (let match; (match = regex.exec(originSource));) {
            source = source === origin ? new webpack.sources.ReplaceSource(source) : source;
            source.replace(match.index, match.index + match[0].length - 1, replacement);
            if (!regex.global) break;
        }
    });
    return source;
};

HarmonyPlugin.es3 = (plugin = HarmonyPlugin()) => plugin.patchModuleSource([
    /\b__webpack_require__\.d\(__webpack_exports__, /, /* language=JavaScript */
    `__unused_webpack_module._ /* patch ESM module exports by ${name} */ = (`,
]).patchRuntimeModule({
    '' /* (runtime root) renderRequire */     : /* language=JavaScript */ result => result.replace(
        // __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
        // __webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
        /(?<=__webpack_modules__\[moduleId](\.call|\()[^\n]+\n)/, `
        // patch ESM module exports by ${name} (register esm exports after module code executed)
        if (module._) {
            __webpack_require__.d(module.exports, module._);
            delete module._;
        }
        `.replace(/\n {8}/g, '\n'),
    ),
    'webpack/runtime/define property getters' : /* language=JavaScript */ result => result.replace(
        'Object.defineProperty(exports, key, { enumerable: true, get: definition[key] })',
        `exports[key] = definition[key](); // patched by ${name}`,
    ),
    'webpack/runtime/make namespace object'   : /* language=JavaScript */ result => result.replace(
        "Object.defineProperty(exports, '__esModule', { value: true });",
        `exports.__esModule = true; // patched by ${name}`,
    ),
    'webpack/runtime/load script'             : /* language=JavaScript */ result => result.replace(
        /\bdocument\.head\b/g,
        `document.getElementsByTagName("head")[0]/* patched by ${name} */`,
    ),
});
