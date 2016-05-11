'use strict';

// ==========================
// exports
// ==========================

function ui_checkbox (text) {
  let el = document.createElement('ui-checkbox');
  el.innerText = text;

  return el;
}

module.exports = ui_checkbox;

// ==========================
// internal
// ==========================

const JS = require('../../../share/js-utils');
const Focusable = require('../behaviors/focusable');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');

JS.addon(CheckboxElement.prototype, Focusable);
