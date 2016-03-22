'use strict';

const Electron = require('electron');
const Path = require('fire-path');
const Url = require('fire-url');
const Async = require('async');

let Editor = {};
module.exports = Editor;

// init & cache remote
Editor.remote = Electron.remote.getGlobal('_Editor');
Editor.dev = Editor.remote.dev;
Editor.lang = Editor.remote.lang;

let _appPath = Editor.remote.url('app://');
let _frameworkPath = Editor.remote.url('editor-framework://');

// add builtin node_modules search path for page-level
require('module').globalPaths.push(Path.join(_appPath,'node_modules'));

/**
 * Require module through url path
 * @method require
 * @param {string} url
 */
Editor.require = function ( url ) {
  return require( Editor.url(url) );
};

function _url2path ( base, urlInfo ) {
  if ( urlInfo.pathname ) {
    return Path.join( base, urlInfo.host, urlInfo.pathname );
  }
  return Path.join( base, urlInfo.host );
}

// url
Editor.url = function (url) {
  // NOTE: we cache app:// and editor-framework:// protocol to get rid of ipc-sync function calls
  let urlInfo = Url.parse(url);
  if ( urlInfo.protocol === 'app:' ) {
    return _url2path( _appPath, urlInfo );
  } else if ( urlInfo.protocol === 'editor-framework:' ) {
    return _url2path( _frameworkPath, urlInfo );
  }

  // use ipc-sync if we are not in Editor.importing state
  return Editor.remote.url(url);
};

// profile
Editor.loadProfile = function ( name, type, cb ) {
  Editor.sendRequestToCore( 'editor:load-profile', name, type, profile => {
    profile.save = function () {
      Editor.sendToCore('editor:save-profile', name, type, profile);
    };

    if ( cb ) {
      cb (profile);
    }
  });
};

// ==========================
// Layout API
// ==========================

Editor.loadLayout = function ( anchorEL, cb ) {
  Editor.sendRequestToCore( 'window:query-layout', (layout, needReset) => {
    if ( !layout ) {
      if (cb) cb ( false );
      return;
    }

    // NOTE: needReset implies this is a default layout
    Editor.resetLayout( anchorEL, layout, () => {
      if (cb) cb ( needReset );
    });
  });
};

let _layouting = false;
Editor.resetLayout = function ( anchorEL, layoutInfo, cb ) {
  _layouting = true;

  Editor.Panel.closeAll(() => {
    let importList = EditorUI.createLayout( anchorEL, layoutInfo );
    Async.each( importList, ( item, done ) => {
      Editor.Panel.load (item.panelID, ( err, frameEL ) => {
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
      EditorUI.DockUtils.flushWithCollapse();
      Editor.saveLayout();
      if ( cb ) {
        cb ( err );
      }
    });
  });
};

Editor.saveLayout = function () {
  // don't save layout when we are layouting
  if ( _layouting ) {
    return;
  }

  window.requestAnimationFrame ( () => {
    Editor.sendToCore('window:save-layout', Editor.Panel.dumpLayout());
  });
};

// ==========================
// extends
// ==========================

Editor.registerElement = function ( obj ) {
  if ( !obj.is ) {
    let script = document.currentScript;
    let parent = script.parentElement;
    if ( parent && parent.tagName === 'DOM-MODULE' ) {
      obj.is = parent.id;
    } else {
      Editor.error('Failed to register widget %s, the script must inside a <dom-module>.');
      return;
    }
  }

  if ( !Editor.elements ) {
    Editor.elements = {};
  }

  if ( Editor.elements[obj.is] ) {
    Editor.error('Failed to register widget %s, already exists.', obj.is );
    return;
  }

  obj._T = function ( key, option ) {
    return Editor.T( key, option );
  };
  Editor.elements[obj.is] = Polymer(obj);
};

Editor.registerPanel = function ( panelID, obj ) {
  if ( !obj.is ) {
    let script = document.currentScript;
    let parent = script.parentElement;
    if ( parent && parent.tagName === 'DOM-MODULE' ) {
      obj.is = parent.id;
    } else {
      Editor.error('Failed to register panel %s, the script must inside a <dom-module>.', panelID);
      return;
    }
  }

  if ( !Editor.panels ) {
    Editor.panels = {};
  }

  if ( Editor.panels[panelID] !== undefined ) {
    Editor.error('Failed to register panel %s, panelID has been registered.', panelID);
    return;
  }

  obj._T = function ( key, option ) {
    return Editor.T( key, option );
  };
  Editor.panels[panelID] = Polymer(obj);
};

// ==========================
// Ipc Events
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('editor:reset-layout', (event, layoutInfo) => {
  let anchorEL = document.body;
  if ( EditorUI.DockUtils.root ) {
    anchorEL = EditorUI.DockUtils.root.parentNode;
  }

  Editor.resetLayout( anchorEL, layoutInfo, () => {
    EditorUI.DockUtils.reset();
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
