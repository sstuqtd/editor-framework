'use strict';

// requires
const Console = require('../../console');
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

    window.requestAnimationFrame(() => {
      DockUtils.root = this;
      DockUtils.loadLayout(this, err => {
        if ( err ) {
          Console.error(`Failed to load layout: ${err.stack}`);
        }

        FocusMgr._setFocusPanelFrame(null);
      });
    });
  }
}

module.exports = MainDock;
