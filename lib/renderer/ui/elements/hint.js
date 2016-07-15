'use strict';

const ElementUtils = require('./utils');
const ResMgr = require('../utils/resource-mgr');

module.exports = ElementUtils.registerElement('ui-hint', {
  template: `
    <div class="arrow-box">
      <content></content>
    </div>
  `,

  style: ResMgr.getResource('editor-framework://dist/css/elements/hint.css'),

  factoryImpl (text) {
    if ( text ) {
      this.innerText = text;
    }
  },

  ready () {
  },
});
