'use strict';

const Electron = require('electron');
const Util = require('util');
const Fs = require('fire-fs');
const Path = require('fire-path');
const Winston = require('winston');
const Globby = require('globby');
const Chokidar = require('chokidar');
const Async = require('async');
const App = require('app');
const _ = require('lodash');

// ==========================
// console log API
// ==========================

let _consoleConnected = false;
let _logs = [];

/**
 * @module Editor
 */

/**
 * Log the normal message and show on the console.
 * The method will send ipc message `console:log` to all windows.
 * @method log
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.log = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected )
    _logs.push({ type: 'log', message: text });

  Winston.normal(text);
  Editor.sendToWindows('console:log',text);
};

/**
 * Log the success message and show on the console
 * The method will send ipc message `console:success` to all windows.
 * @method success
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.success = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected )
    _logs.push({ type: 'success', message: text });

  Winston.success(text);
  Editor.sendToWindows('console:success',text);
};

/**
 * Log the failed message and show on the console
 * The method will send ipc message `console:failed` to all windows.
 * @method failed
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.failed = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected )
    _logs.push({ type: 'failed', message: text });

  Winston.failed(text);
  Editor.sendToWindows('console:failed',text);
};

/**
 * Log the info message and show on the console
 * The method will send ipc message `console:info` to all windows.
 * @method info
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.info = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected )
    _logs.push({ type: 'info', message: text });

  Winston.info(text);
  Editor.sendToWindows('console:info',text);
};

/**
 * Log the warnning message and show on the console,
 * it also shows the call stack start from the function call it.
 * The method will send ipc message `console:warn` to all windows.
 * @method warn
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.warn = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected )
    _logs.push({ type: 'warn', message: text });

  Winston.warn(text);
  Editor.sendToWindows('console:warn',text);
};

/**
 * Log the error message and show on the console,
 * it also shows the call stack start from the function call it.
 * The method will sends ipc message `console:error` to all windows.
 * @method error
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.error = function (...args) {
  let text = Util.format.apply(Util, args);

  let err = new Error('dummy');
  let lines = err.stack.split('\n');
  text = text + '\n' + lines.splice(2).join('\n');

  if ( _consoleConnected )
    _logs.push({ type: 'error', message: text });

  Winston.error(text);
  Editor.sendToWindows('console:error',text);
};

/**
 * Log the fatal message and show on the console,
 * the app will quit immediately after that.
 * @method fatal
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.fatal = function (...args) {
  let text = Util.format.apply(Util, args);

  let e = new Error('dummy');
  let lines = e.stack.split('\n');
  text = text + '\n' + lines.splice(2).join('\n');

  if ( _consoleConnected )
    _logs.push({ type: 'fatal', message: text });

  Winston.fatal(text);
  // NOTE: fatal error will close app immediately, no need for ipc.
};

/**
 * Connect to console panel. Once the console connected, all logs will kept in `core-level` and display
 * on the console panel in `page-level`.
 * @method connectToConsole
 */
Editor.connectToConsole = function () {
  _consoleConnected = true;
};

/**
 * Clear the logs
 * @method clearLog
 */
Editor.clearLog = function () {
  _logs = [];
  Editor.sendToAll('console:clear');
};

// ==========================
// pre-require modules
// ==========================

require('../share/platform') ;
Editor.JS = require('../share/js-utils') ;
Editor.Utils = require('../share/editor-utils');
Editor.Math = require('../share/math');
Editor.Ipc = require('../share/ipc');

require('./protocol-init');
require('./ipc-init');

// ==========================
// profiles API
// ==========================

let _path2profiles = {};
function _saveProfile ( path, profile ) {
  let json = JSON.stringify(profile, null, 2);
  Fs.writeFileSync(path, json, 'utf8');
}

/**
 * Load profile via `name` and `type`, if no profile found, it will use the `defaultProfile` and save it to the disk.
 * You must register your profile path with `type` via {@link Editor.registerProfilePath} before you
 * can use it. The Editor Framework will search a profile under your register path with the `name`.
 * @method loadProfile
 * @param {string} name - The name of the profile.
 * @param {string} type - The type of the profile, make sure you register the type via {@link Editor.registerProfilePath}.
 * @param {object} defaultProfile - The default profile to use if the profile is not found.
 * @return {object} A profile object with two additional function:
 *  - save: save the profile.
 *  - clear: clear all properties in the profile.
 * @see Editor.registerProfilePath
 * @example
 * ```js
 * // register a project profile
 * Editor.registerProfilePath( 'project', '~/foo/bar');
 *
 * // load the profile at ~/foo/bar/foobar.json
 * let foobarProfile = Editor.loadProfile( 'foobar', 'project', {
 *   foo: 'foo',
 *   bar: 'bar',
 * });
 *
 * // change and save your profile
 * foobarProfile.foo = 'hello foo';
 * foobarProfile.save();
 * ```
 */
Editor.loadProfile = function ( name, type, defaultProfile ) {
  let path = Editor._type2profilepath[type];
  if ( !path ) {
    Editor.error( 'Failed to load profile by type %s, please register it first.', type );
    return null;
  }
  path = Path.join(path, name+'.json');

  let profile = _path2profiles[path];
  if ( profile ) {
    return profile;
  }

  let profileProto = {
    save () {
      _saveProfile( path, this );
    },

    clear () {
      for ( let p in this ) {
        if ( p !== 'save' && p !== 'clear' ) {
          delete this[p];
        }
      }
    },
  };

  profile = defaultProfile || {};

  if ( !Fs.existsSync(path) ) {
    Fs.writeFileSync(path, JSON.stringify(profile, null, 2));
  } else {
    try {
      profile = JSON.parse(Fs.readFileSync(path));

      if ( defaultProfile ) {
        for ( let p in profile ) {
          if ( defaultProfile[p] === undefined ) {
            delete profile[p];
          }
        }

        for ( let p in defaultProfile ) {
          if (profile[p] === undefined ||
              typeof(profile[p]) !== typeof(defaultProfile[p]))
            {
              profile[p] = defaultProfile[p];
            }
        }

        // save again
        Fs.writeFileSync(path, JSON.stringify(profile, null, 2));
      }
    } catch ( err ) {
      if ( err ) {
        Editor.warn( 'Failed to load profile %s, error message: %s', name, err.message );
        profile = {};
      }
    }
  }

  profile = _.assign(profile, profileProto);
  _path2profiles[path] = profile;

  return profile;
};

// ==========================
// misc API
// ==========================

let _isClosing = false;
let _packageWatcher;

Object.defineProperty(Editor, 'isClosing', {
  enumerable: true,
  get() {
    return _isClosing;
  }
});

// NOTE: this can only be invoked in Editor.mainWindow.on('closed') event
Editor._quit = function () {
  _isClosing = true;

  if ( _packageWatcher ) {
    _packageWatcher.close();
  }

  let winlist = Editor.Window.windows;
  winlist.forEach(win => {
    win.close();
  });

  // TODO: make sure all win's closed event been called.

  // close debugger
  Editor.Debugger.close();

  // emit quit event
  Editor.events.emit('quit');

  // close app after all
  App.quit();
};

Editor.loadPackagesAt = function ( path, cb ) {
  let idx = Editor.Package.paths.indexOf(path);
  if ( idx === -1 ) {
    Editor.warn( 'The package path %s is not registerred', path );
    return;
  }

  let paths = Globby.sync(`${path}/*/package.json`);

  Async.eachSeries( paths, ( path, done ) => {
    path = Path.normalize(path);
    let packagePath = Path.dirname(path);
    Editor.Package.load( packagePath, err => {
      if ( err ) {
        Editor.failed( `Failed to load package at ${packagePath}: ${err.message}` );
      }
      done();
    });
  }, () => {
    if ( cb ) cb ();
  });
};

/**
 * Search and load all packages from the path you registerred
 * {{#crossLink "Editor.registerPackagePath"}}{{/crossLink}}
 * @method loadAllPackages
 */
Editor.loadAllPackages = function ( cb ) {
  let i, src = [];
  for ( i = 0; i < Editor.Package.paths.length; ++i ) {
    src.push( `${Editor.Package.paths[i]}/*/package.json` );
  }

  let paths = Globby.sync(src);

  Async.eachSeries( paths, ( path, done ) => {
    path = Path.normalize(path);
    let packagePath = Path.dirname(path);
    Editor.Package.load( packagePath, err => {
      if ( err ) {
        Editor.failed( `Failed to load package at ${packagePath}: ${err.message}` );
      }
      done();
    });
  }, () => {
    if ( cb ) cb ();
  });
};

/**
 * Require module through url path
 * @method require
 * @param {string} url
 */
Editor.require = function ( url ) {
  return require( Editor.url(url) );
};

/**
 * Spawn child process that start from console
 * @method execSpawn
 * @param {string} command
 * @param {object} options
 */
Editor.execSpawn = function ( command, options ) {
  let file, args;
  options = options || {};

  if (process.platform === 'win32') {
    file = 'cmd.exe';
    args = ['/s', '/c', '"' + command + '"'];
    options.windowsVerbatimArguments = true;
  } else {
    file = '/bin/sh';
    args = ['-c', command];
    options.windowsVerbatimArguments = false;
  }

  let spawn = require('child_process').spawn;
  return spawn(file, args, options);
};

function _reloadPackages ( reloadInfos, cb ) {
  Async.each( reloadInfos, ( info, done ) => {
    let packageInfo = Editor.Package.packageInfo(info.path);
    if ( !packageInfo ) {
      done();
      return;
    }

    Async.series([
      next => {
        if ( !packageInfo.build ) {
          next();
          return;
        }

        Editor.log( 'Rebuilding ' + packageInfo.name );
        Editor.Package.build( packageInfo._path, next );
      },

      next => {
        let testerWin = Editor.Panel.findWindow('tester.panel');

        // reload test
        if ( info.reloadTest ) {
          if ( testerWin ) {
            testerWin.sendToPage('tester:run-tests', packageInfo.name);
          }
          next();
          return;
        }

        // reload page
        if ( info.reloadPage ) {
          for ( let panelName in packageInfo.panels ) {
            let panelID = packageInfo.name + '.' + panelName;
            Editor.sendToWindows( 'panel:out-of-date', panelID );
          }

          if ( testerWin ) {
            testerWin.sendToPage('tester:run-tests', packageInfo.name);
          }
          next();
          return;
        }

        // reload core
        if ( info.reloadCore ) {
          Editor.Package.reload(packageInfo._path, {
            rebuild: false
          });
          next();
          return;
        }

        next();
      },
    ], err => {
      if ( err ) {
        Editor.error( 'Failed to reload package %s: %s', packageInfo.name, err.message );
      }

      done();
    });
  }, err => {
    if ( cb ) {
      cb (err);
    }
  });
}

/**
 * Watch packages
 * @method watchPackages
 */
let _watchDebounceID = null;
let _packageReloadInfo = [];
Editor.watchPackages = function ( cb ) {
  //
  if ( Editor.Package.paths.length === 0 ) {
    if ( cb ) cb ();
    return;
  }

  let src = Editor.Package.paths.filter( path => {
    return Fs.existsSync(path);
  });

  _packageWatcher = Chokidar.watch(src, {
    ignored: [
      // /[\/\\]\.(?!app-name)/: ignore /.hidden-files but skip ~/.app-name
      new RegExp('[\\/\\\\]\\.(?!' + Editor.App.name + ')'),
      /[\/\\]bin/,
      /[\/\\]test[\/\\](fixtures|playground)/,
    ],
    ignoreInitial: true,
    persistent: true,
  });

  _packageWatcher
    .on('add', path => {
      _packageWatcher.add(path);
    })
    .on('addDir', path => {
      _packageWatcher.add(path);
    })
    .on('unlink', path => {
      _packageWatcher.unwatch(path);
    })
    .on('unlinkDir', path => {
      _packageWatcher.unwatch(path);
    })
    .on('change', path => {
      // NOTE: this is not 100% safe, because 50ms debounce still can have multiple
      //       same packages building together, to avoid this, try to use Async.queue

      let packageInfo = Editor.Package.packageInfo(path);
      if ( !packageInfo ) {
        return;
      }

      //
      let reloadInfo;
      _packageReloadInfo.some(info => {
        if ( info.path === packageInfo._path ) {
          reloadInfo = info;
          return true;
        }
        return false;
      });

      if ( !reloadInfo ) {
        reloadInfo = {
          path: packageInfo._path,
          reloadTest: false,
          reloadPage: false,
          reloadCore: false,
        };
        _packageReloadInfo.push(reloadInfo);
      }

      // reload test
      if ( Path.contains(Path.join(packageInfo._path, 'test') , path) ) {
        reloadInfo.reloadTest = true;
      }
      // reload page
      else if (
        Path.contains(Path.join(packageInfo._path, 'page') , path) ||
        Path.contains(Path.join(packageInfo._path, 'panel') , path) ||
        Path.contains(Path.join(packageInfo._path, 'widget') , path) ||
        Path.contains(Path.join(packageInfo._path, 'element') , path)
      ) {
        reloadInfo.reloadPage = true;
      }
      // reload core
      else {
        reloadInfo.reloadCore = true;
      }

      // debounce write for 50ms
      if ( _watchDebounceID ) {
        clearTimeout(_watchDebounceID);
        _watchDebounceID = null;
      }

      _watchDebounceID = setTimeout(() => {
        _reloadPackages(_packageReloadInfo);
        _packageReloadInfo = [];
        _watchDebounceID = null;
      }, 50);
    })
    .on('error', err => {
      Editor.error('Package Watcher Error: %s', err.message);
    })
    .on('ready', () => {
      if ( cb ) cb ();
    })
    // .on('raw', function(event, path, details) { Editor.log('Raw event info:', event, path, details); })
    ;
};

// ==========================
// extends
// ==========================

Editor._type2profilepath = {};
Editor._defaultLayout = '';

/**
 * Register profile type with the path you provide.
 * {{#crossLink "Editor.loadProfile"}}{{/crossLink}}
 * @method registerProfilePath
 * @param {string} type - The type of the profile you want to register.
 * @param {string} path - The path for the register type.
 */
Editor.registerProfilePath = function ( type, path ) {
  Editor._type2profilepath[type] = path;
};

/**
 * Register a path, when loading packages, it will search the path you registerred.
 * {{#crossLink "Editor.loadPackages"}}{{/crossLink}}
 * @method registerDefaultLayout
 * @param {string} path - A absolute path for searching your packages.
 */
Editor.registerDefaultLayout = function ( path ) {
  Editor._defaultLayout = path;
};

/**
 * init editor during App.init
 * @method init
 * @param {object} opts - options
 * @param {object} profile - profile type to path
 * @param {array} package-search-path - package search path
 * @param {function} main-menu - a function return the new main-menu template
 * @param {string} panel-window - panel window url
 * @param {string} layout - default layout file
 * @param {array} selection - selection type
 * @param {array} i18n - i18n phrases
 */
Editor.init = function ( opts ) {
  opts = opts || {};
  Editor.reset();

  // register i18n phrases
  // NOTE: i18n must before other registers, so that other modules can translate by i18n module
  let i18nPhrases = opts.i18n;
  if ( i18nPhrases ) {
    Editor.i18n.clear();
    Editor.i18n.extend(i18nPhrases);
  }

  // register profile path
  let profileInfo = opts.profile;
  if ( profileInfo ) {
    for ( let name in profileInfo ) {
      Fs.ensureDirSync(Path.join(profileInfo[name]));
      Editor.registerProfilePath( name, profileInfo[name] );
    }
  }

  // register package search path
  let searchPaths = opts['package-search-path'];
  if ( searchPaths && searchPaths.length ) {
    Editor.Package.addPath(searchPaths);
  }

  // register main menu
  let mainMenuTmpl = opts['main-menu'];
  if ( mainMenuTmpl ) {
    Editor.Menu.register('main-menu', mainMenuTmpl, true);
    Editor.MainMenu.reset();
  }

  // register panel window
  let panelWindow = opts['panel-window'];
  if ( panelWindow ) {
    Editor.Panel.templateUrl = panelWindow;
  }

  // register layout
  let defaultLayout = opts.layout;
  if ( defaultLayout ) {
    Editor.registerDefaultLayout(defaultLayout);
  }

  // register selection
  let selectionTypes = opts.selection;
  if ( selectionTypes && selectionTypes.length ) {
    selectionTypes.forEach( type => {
      Editor.Selection.register(type);
    });
  }

  // register undo commands
  let undoCommands = opts.undo;
  if ( undoCommands ) {
    for ( let id in undoCommands ) {
      Editor.Undo.register( id, undoCommands[id] );
    }
  }

  // TODO: Editor.init
  // app.on('will-finish-launching', () => {
  //   if ( !Editor.isDev ) {
  //     let crashReporter = require('crash-reporter');
  //     crashReporter.start({
  //       productName: Editor.App.name,
  //       companyName: 'Cocos Creator',
  //       submitURL: 'https://cocos-creator.com/crash-report',
  //       autoSubmit: false,
  //     });
  //   }
  // });

  // TODO:
  // let worker = new Editor.Worker('online', {
  //   workerType: 'renderer',
  //   url: 'editor-framework://static/online-worker.html',
  // });
  // worker.on('editor:online-status-changed', ( event, status ) => {
  //   console.log(status);
  // });
  // worker.start();
};

/**
 * reset editor
 * @method reset
 */
Editor.reset = function () {
  // reset i18n method
  Editor.i18n.clear();
  Editor.i18n.extend(require(`../../static/i18n/${Editor.lang}.js`));

  // reset profile path
  Editor._type2profilepath = {};
  Editor.registerProfilePath( 'global', Editor.App.home );
  Editor.registerProfilePath( 'local', Path.join( Editor.App.home, 'local' ) );

  // reset package search path
  Editor.Package.resetPath();

  // reset main menu
  Editor.MainMenu._revert();

  // reset panel window
  Editor.Panel.templateUrl = 'editor-framework://static/window.html';

  // reset layout
  Editor.registerDefaultLayout( Editor.url('app://static/layout.json') );

  // reset selection
  Editor.Selection.reset();

  // reset undo
  Editor.Undo.reset();
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

Editor.Menu = require('./editor-menu');
Editor.Window = require('./editor-window');
Editor.Worker = require('./editor-worker');
Editor.Panel = require('./editor-panel');
Editor.Package = require('./editor-package');
Editor.DevTools = require('./editor-devtools');
Editor.Debugger = require('./debugger');

Editor.MainMenu = require('./main-menu');

// ==========================
// Ipc Events
// ==========================

const ipcMain = Electron.ipcMain;

ipcMain.on('console:log', (event, ...args) => {
  Editor.log.apply(Editor,args);
});

ipcMain.on('console:success', (event, ...args) => {
  Editor.success.apply(Editor,args);
});

ipcMain.on('console:failed', (event, ...args) => {
  Editor.failed.apply(Editor,args);
});

ipcMain.on('console:info', (event, ...args) => {
  Editor.info.apply(Editor,args);
});

ipcMain.on('console:warn', (event, ...args) => {
  Editor.warn.apply(Editor,args);
});

ipcMain.on('console:error', (event, ...args) => {
  Editor.error.apply(Editor,args);
});

ipcMain.on('console:query', ( event, reply ) => {
  reply(_logs);
});

ipcMain.on('_console:clear', () => {
  Editor.clearLog();
});
