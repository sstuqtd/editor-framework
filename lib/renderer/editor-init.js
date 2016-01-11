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
  // var queryString = decodeURIComponent(location.search.substr(1));
  // var queryList = queryString.split('&');
  // var queries = {};
  // for ( var i = 0; i < queryList.length; ++i ) {
  //     var pair = queryList[i].split('=');
  //     if ( pair.length === 2) {
  //         queries[pair[0]] = pair[1];
  //     }
  // }
  // NOTE: hash is better than query from semantic, it means this is client data.
  if ( window.location.hash ) {
    var hash = window.location.hash.slice(1);
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

  let _urlToPath = function ( base, urlInfo ) {
    if ( urlInfo.pathname ) {
      return Path.join( base, urlInfo.host, urlInfo.pathname );
    }
    return Path.join( base, urlInfo.host );
  };

  // url
  Editor.url = function (url) {
    // NOTE: we cache app:// and editor-framework:// protocol to get rid of ipc-sync function calls
    var urlInfo = Url.parse(url);
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

    var e = new Error('dummy');
    var lines = e.stack.split('\n');
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
    Editor.sendRequestToCore( 'window:query-layout', function (layout, needReset) {
      if ( !layout ) {
        if (cb) cb ( false );
        return;
      }

      // NOTE: needReset implies this is a default layout
      Editor.resetLayout( anchorEL, layout, function () {
        if (cb) cb ( needReset );
      });
    });
  };

  var _layouting = false;
  Editor.resetLayout = function ( anchorEL, layoutInfo, cb ) {
    _layouting = true;

    Editor.Panel.closeAll(function () {
      var importList = EditorUI.createLayout( anchorEL, layoutInfo );
      Async.each( importList, function ( item, done ) {
        Editor.Panel.load (item.panelID, function ( err, frameEL ) {
          if ( err ) {
            done();
            return;
          }

          var dockAt = item.dockEL;
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
    if ( _layouting )
      return;

    window.requestAnimationFrame ( function () {
      Editor.sendToCore('window:save-layout', Editor.Panel.dumpLayout());
    });
  };

  // ==========================
  // extends
  // ==========================

  Editor.registerElement = function ( obj ) {
    if ( !obj.is ) {
      var script = document.currentScript;
      var parent = script.parentElement;
      if ( parent && parent.tagName === 'DOM-MODULE' ) {
        obj.is = parent.id;
      }
      else {
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
      var script = document.currentScript;
      var parent = script.parentElement;
      if ( parent && parent.tagName === 'DOM-MODULE' ) {
        obj.is = parent.id;
      }
      else {
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

  // ==========================
  // Ipc Events
  // ==========================

  ipcRenderer.on('editor:reset-layout', (event, layoutInfo) => {
    let anchorEL = document.body;
    if ( EditorUI.DockUtils.root ) {
      anchorEL = Polymer.dom(EditorUI.DockUtils.root).parentNode;
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
