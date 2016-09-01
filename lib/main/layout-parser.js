/**
 * @module Editor.LayoutParser
 *
 */
let LayoutParser = {};
module.exports = LayoutParser;

// requires
const Yaml = require('js-yaml');

// ========================================
// exports
// ========================================

/**
 * @method parse
 * @param {string} text
 * @param {object} opts
 * @param {string} opts.format - Support 'json' and 'yaml'
 */
LayoutParser.parse = function (text, opts) {
  let obj;
  if ( opts.format === 'json' ) {
    obj = JSON.parse(text);
  } else {
    obj = Yaml.safeLoad(text);
  }

  // TODO
  // check and merge unused docks
  //   1: if we only have one child, and the child is a dock type, unwrap it.
  //   2: if children have the same dock type as the parent, unwrap it.

  return obj;
};

/**
 * @method stringify
 * @param {object} obj
 * @param {object} opts
 * @param {string} opts.format - Support 'json' and 'yaml'
 */
LayoutParser.stringify = function (obj, opts) {
  let text;
  if ( opts.format === 'json' ) {
    text = JSON.stringify(obj, null, 2);
  } else {
    text = Yaml.safeDump(obj);
  }

  return text;
};

// ========================================
// Internal
// ========================================

// function _walk (obj, func) {
// }
