'use strict';

const Hljs = require('highlight.js');
const Marked = require('marked');

const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');

module.exports = ElementUtils.registerElement('ui-markdown', {
  /**
   * @property value
   */
  get value () {
    return this._value;
  },
  set value (val) {
    if (this._value !== val) {
      this._value = val;
      this._render();
    }
  },

  template: `
    <div class="container"></div>
  `,

  style: ResMgr.getResource('editor-framework://dist/css/elements/markdown.css'),

  $: {
    container: '.container',
  },

  factoryImpl (text) {
    if ( text ) {
      this.value = text;
    }
  },

  ready () {
    // TODO: src, if we have src, ignore textContent
    // let text = Fs.readFileSync( this.path, {encoding: 'utf-8'} );

    this.value = this._unindent(this.textContent);

    // TODO: MutationObserver for characterData
  },

  _render () {
    Marked.setOptions({
      highlight (code) {
        return Hljs.highlightAuto(code).value;
      }
    });

    let text = this.value;
    let result = Marked( text );

    this.$container.innerHTML = result;
  },

  _unindent (text) {
    if (!text) {
      return text;
    }

    let lines  = text.replace(/\t/g, '  ').split('\n');
    let indent = lines.reduce((prev, line) => {
      // Completely ignore blank lines.
      if (/^\s*$/.test(line)) {
        return prev;
      }

      let lineIndent = line.match(/^(\s*)/)[0].length;
      if (prev === null) {
        return lineIndent;
      }

      return lineIndent < prev ? lineIndent : prev;
    }, null);

    return lines.map(l => { return l.substr(indent); }).join('\n');
  }
});
