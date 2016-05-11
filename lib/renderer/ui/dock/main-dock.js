'use strict';

// requires
const DockUtils = require('../utils/dock-utils');

// ==========================
// exports
// ==========================

class MainDock extends window.HTMLElement {
  static get tagName () { return 'UI-MAIN-DOCK'; }

  createdCallback () {
    this.style.cssText = `
      position: relative;
    `;
    this.innerHTML = `
      <ui-dock id="root" class="fit" no-collapse></ui-dock>
    `;
  }

  attachedCallback () {
    window.requestAnimationFrame(() => {
      DockUtils.root = this.querySelector('#root');
      DockUtils.loadLayout(DockUtils.root.parentNode, needReset => {
        if ( needReset ) {
          DockUtils.reset();
        }
      });
    });
  }
}

module.exports = MainDock;
