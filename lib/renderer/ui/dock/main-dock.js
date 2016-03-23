'use strict';

// requires
const DockUtils = require('../utils/dock-utils');

class MainDock extends window.HTMLElement {
  static get tagName () { return 'MAIN-DOCK'; }

  createdCallback () {
    this.style.cssText = `
    position: relative;
    `;
    this.innerHTML = `
    <editor-dock id="root" class="fit" no-collapse></editor-dock>
    `;
  }

  attachedCallback () {
    window.requestAnimationFrame(() => {
      DockUtils.root = this.querySelector('#root');

      let rootDOM = Polymer.dom(DockUtils.root);
      DockUtils.loadLayout(rootDOM.parentNode, needReset => {
        if ( needReset ) {
          DockUtils.reset();
        }
      });
    });
  }
}

module.exports = MainDock;
