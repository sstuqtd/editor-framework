'use strict';

// ==========================
// exports
// ==========================

class PanelFrame extends window.HTMLElement {
  static get tagName () { return 'UI-PANEL-FRAME'; }

  createdCallback () {
    this.createShadowRoot();
    this.classList.add('fit');
    this.tabIndex = -1;
  }
}

module.exports = PanelFrame;
