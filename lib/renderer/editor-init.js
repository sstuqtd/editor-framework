(() => {
  'use strict';

  const Electron = require('electron');

  const remote = Electron.remote;
  const ipcRenderer = Electron.ipcRenderer;

  const Util = require('util');
  const Path = require('fire-path');
  const Url = require('fire-url');
  const Async = require('async');

  window.unused = () => {};

  /**
   * Page Level Editor
   * @module Editor
   */
  window.Editor = window.Editor || {};

  /**
   * Require module through url path
   * @method require
   * @param {string} url
   */
  Editor.require = function ( path ) {
    return require( Editor.url(path) );
  };

  // DISABLE: use hash instead
  // // init argument list sending from core by url?queries
  // // format: '?foo=bar&hell=world'
  // // skip '?'
  // let queryString = decodeURIComponent(location.search.substr(1));
  // let queryList = queryString.split('&');
  // let queries = {};
  // for ( let i = 0; i < queryList.length; ++i ) {
  //     let pair = queryList[i].split('=');
  //     if ( pair.length === 2) {
  //         queries[pair[0]] = pair[1];
  //     }
  // }
  // NOTE: hash is better than query from semantic, it means this is client data.
  if ( window.location.hash ) {
    let hash = window.location.hash.slice(1);
    Editor.argv = Object.freeze(JSON.parse(decodeURIComponent(hash)));
  } else {
    Editor.argv = {};
  }

  // init & cache remote
  Editor.remote = remote.getGlobal('Editor');
  Editor.isDev = Editor.remote.isDev;
  Editor.lang = Editor.remote.lang;

  let _appPath = Editor.remote.url('app://');
  let _frameworkPath = Editor.remote.url('editor-framework://');

  // add builtin node_modules search path for page-level
  require('module').globalPaths.push(Path.join(_appPath,'node_modules'));

  function _urlToPath ( base, urlInfo ) {
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
      return _urlToPath( _appPath, urlInfo );
    } else if ( urlInfo.protocol === 'editor-framework:' ) {
      return _urlToPath( _frameworkPath, urlInfo );
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
  // console log API
  // ==========================

  /**
   * Log the normal message and show on the console.
   * The method will send ipc message `console:log` to core.
   * @method log
   * @param {...*} [arg] - whatever arguments the message needs
   */
  Editor.log = function (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.log(text);
    Editor.sendToCore('console:log', text);
  };

  Editor.success = function (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.log('%c' + text, 'color: green');
    Editor.sendToCore('console:success', text);
  };

  Editor.failed = function (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.log('%c' + text, 'color: red');
    Editor.sendToCore('console:failed', text);
  };

  Editor.info = function (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.info(text);
    Editor.sendToCore('console:info', text);
  };

  Editor.warn = function (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.warn(text);
    Editor.sendToCore('console:warn', text);
  };

  Editor.error = function (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.error(text);

    let e = new Error('dummy');
    let lines = e.stack.split('\n');
    text = text + '\n' + lines.splice(2).join('\n');

    Editor.sendToCore('console:error',text);
  };

  // ==========================
  // pre-require modules
  // ==========================

  require('../share/platform');
  Editor.JS = require('../share/js-utils');
  Editor.Utils = require('../share/editor-utils');
  Editor.Math = require('../share/math');
  Editor.Easing = require('../share/easing');
  Editor.Ipc = require('../share/ipc');

  require('./ipc-init');

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
  // load modules
  // ==========================

  Editor.i18n = require('../share/i18n');
  Editor.T = Editor.i18n.t;

  Editor.Selection = require('../share/selection');
  Editor.Undo = require('../share/undo');
  Editor.KeyCode = require('../share/keycode');
  Editor.Dialog = require('../share/dialog');

  Editor.Window = require('./editor-window' );
  Editor.Menu = require('./editor-menu');
  Editor.Panel = require('./editor-panel');
  Editor.Package = require('./editor-package');

  Editor.MainMenu = require('./main-menu');
  Editor.Cmd = require('./editor-cmd');
  Editor.Audio = require('./audio');

  // init EditorUI (promise)
  require('./ui/init.js');

  // ==========================
  // Ipc Events
  // ==========================

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

})();
