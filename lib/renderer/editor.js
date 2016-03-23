'use strict';

/**
 * @module EditorR
 */
let EditorR = {};
module.exports = EditorR;

// require
const Electron = require('electron');
const Async = require('async');

const Protocol = require('./protocol');

/**
 * Require module through url path
 * @method require
 * @param {string} url
 */
EditorR.require = function ( url ) {
  return require( EditorR.url(url) );
};

// url
EditorR.url = Protocol.url;

// profile
EditorR.loadProfile = function ( name, type, cb ) {
  EditorR.sendRequestToCore( 'editor:load-profile', name, type, profile => {
    profile.save = function () {
      EditorR.sendToCore('editor:save-profile', name, type, profile);
    };

    if ( cb ) {
      cb (profile);
    }
  });
};

// ==========================
// Layout API
// ==========================

EditorR.loadLayout = function ( anchorEL, cb ) {
  EditorR.sendRequestToCore( 'window:query-layout', (layout, needReset) => {
    if ( !layout ) {
      if (cb) cb ( false );
      return;
    }

    // NOTE: needReset implies this is a default layout
    EditorR.resetLayout( anchorEL, layout, () => {
      if (cb) cb ( needReset );
    });
  });
};

let _layouting = false;
EditorR.resetLayout = function ( anchorEL, layoutInfo, cb ) {
  _layouting = true;

  EditorR.Panel.closeAll(() => {
    let importList = EditorR.UI.createLayout( anchorEL, layoutInfo );
    Async.each( importList, ( item, done ) => {
      EditorR.Panel.load (item.panelID, ( err, frameEL ) => {
        if ( err ) {
          done();
          return;
        }

        let dockAt = item.dockEL;
        dockAt.add(frameEL);
        if ( item.active ) {
          dockAt.select(frameEL);
        }
        done();
      });
    }, err => {
      _layouting = false;

      // close error panels
      EditorR.UI.DockUtils.flushWithCollapse();
      EditorR.saveLayout();
      if ( cb ) {
        cb ( err );
      }
    });
  });
};

EditorR.saveLayout = function () {
  // don't save layout when we are layouting
  if ( _layouting ) {
    return;
  }

  window.requestAnimationFrame ( () => {
    EditorR.sendToCore('window:save-layout', EditorR.Panel.dumpLayout());
  });
};

// ==========================
// extends
// ==========================

EditorR.registerElement = function ( obj ) {
  if ( !obj.is ) {
    let script = document.currentScript;
    let parent = script.parentElement;
    if ( parent && parent.tagName === 'DOM-MODULE' ) {
      obj.is = parent.id;
    } else {
      EditorR.error('Failed to register widget %s, the script must inside a <dom-module>.');
      return;
    }
  }

  if ( !EditorR.elements ) {
    EditorR.elements = {};
  }

  if ( EditorR.elements[obj.is] ) {
    EditorR.error('Failed to register widget %s, already exists.', obj.is );
    return;
  }

  obj._T = function ( key, option ) {
    return EditorR.T( key, option );
  };
  EditorR.elements[obj.is] = Polymer(obj);
};

EditorR.registerPanel = function ( panelID, obj ) {
  if ( !obj.is ) {
    let script = document.currentScript;
    let parent = script.parentElement;
    if ( parent && parent.tagName === 'DOM-MODULE' ) {
      obj.is = parent.id;
    } else {
      EditorR.error('Failed to register panel %s, the script must inside a <dom-module>.', panelID);
      return;
    }
  }

  if ( !EditorR.Panel.panels ) {
    EditorR.Panel.panels = {};
  }

  if ( EditorR.Panel.panels[panelID] !== undefined ) {
    EditorR.error('Failed to register panel %s, panelID has been registered.', panelID);
    return;
  }

  obj._T = function ( key, option ) {
    return EditorR.T( key, option );
  };
  EditorR.Panel.panels[panelID] = Polymer(obj);
};

// ==========================
// Ipc Events
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('editor:reset-layout', (event, layoutInfo) => {
  let anchorEL = document.body;
  if ( EditorR.UI.DockUtils.root ) {
    anchorEL = EditorR.UI.DockUtils.root.parentNode;
  }

  EditorR.resetLayout( anchorEL, layoutInfo, () => {
    EditorR.UI.DockUtils.reset();
  });
});

ipcRenderer.on('editor:query-ipc-events', (event, reply) => {
  let ipcInfos = [];
  for ( let p in ipcRenderer._events ) {
    let listeners = ipcRenderer._events[p];
    let count = Array.isArray(listeners) ? listeners.length : 1;

    ipcInfos.push({
      name: p,
      level: 'page',
      count: count,
    });
  }
  reply(ipcInfos);
});
