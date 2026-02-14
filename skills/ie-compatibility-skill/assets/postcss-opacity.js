/**
 * ref https://github.com/iamvdo/postcss-opacity (deprecated and depends on postcss5) only keeps filter conversion for IE
 */

export default () => css => css.walkRules(rule => rule.walkDecls('opacity', decl => {
    // https://stackoverflow.com/questions/8736061/css-opacity-properties/8736225#8736225
    // filter: alpha(opacity=50); // for Internet Explorer 5, 6, 7, 8
    rule.insertBefore(decl, {
        prop  : 'filter',
        value : `alpha(opacity=${Math.floor(decl.value * 100)})${decl.important ? ' !important' : ''}`,
    });
}));
