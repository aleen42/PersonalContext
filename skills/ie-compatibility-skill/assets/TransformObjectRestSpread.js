/**
 * Replacement with '@babel/plugin-transform-object-rest-spread', using `_.assign` instead of `Object.assign`.
 */

import Super from '@babel/plugin-transform-object-rest-spread';

export default function TransformObjectRestSpread() {
    return {
        inherits : Super.default,
        visitor  : {
            ObjectExpression({parent : {type, callee}, scope}) {
                if (type === 'CallExpression'
                    && callee.type === 'MemberExpression'
                    && callee.object.type === 'Identifier' && callee.object.name === 'Object'
                    && callee.property.type === 'Identifier' && callee.property.name === 'assign'
                    /** Skips if '_' is declared in scopes, ref: [marked@16.1.1]({@link import('marked/lib/marked.esm.js')}) `12:5973` & `67:205` */
                    /** Importing `_` from `cui/util/js/fn` will be removed by {@link import('./NormalModulePreprocessLoader.js')} */
                    && !scope.getBinding('_')
                ) {
                    callee.object.name = '_';
                }
            },
        },
    };
}
