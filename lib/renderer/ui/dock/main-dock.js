'use strict';

// requires
const DockUtils = require('../utils/dock-utils');
const FocusMgr = require('../utils/focus-mgr');
const Dock = require('./dock');

// ==========================
// exports
// ==========================

class MainDock extends Dock {
  static get tagName () { return 'UI-MAIN-DOCK'; }

  createdCallback () {
    super.createdCallback();
    this.noCollapse = true;
  }

  attachedCallback () {
    window.requestAnimationFrame(() => {
      DockUtils.root = this;
      DockUtils.loadLayout(this, needReset => {
        if ( needReset ) {
          DockUtils.reset();
        }
        FocusMgr._setFocusPanelFrame(null);
      });
    });
  }
}

module.exports = MainDock;
