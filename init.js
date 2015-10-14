'use strict';

/**
 * Editor is a module contains app-wide core editor functionality. You can access properties or methods of Editor module anytime, anywhere in Fireball
 * @module Editor
 * @main
 */
global.Editor = {};

// ---------------------------
// precheck
// ---------------------------

if ( !__app ) {
  console.error( '\'global.__app\' is undefined.');
  process.exit(1);
  return;
}
/**
 * The Editor.App is your app.js module. Read more details in
 * [Define your application](https://github.com/fireball-x/editor-framework/blob/master/docs/manual/define-your-app.md).
 * @property App
 * @type object
 */
Editor.App = __app;


const App = require('app');
/**
 * The current app.js running directory.
 * @property appPath
 * @type string
 */
Editor.appPath = App.getAppPath();

// ---------------------------
// load modules
// ---------------------------

const Path = require('fire-path');
const Fs = require('fire-fs');
const Commander = require('commander');
const Chalk = require('chalk');
const Winston = require('winston');
const Async = require('async');

// this will prevent default atom-shell uncaughtException
process.removeAllListeners('uncaughtException');
process.on('uncaughtException', err => {
  // if ( Editor && Editor.sendToWindows ) {
  //     Editor.sendToWindows('console:error', err.stack || err);
  // }
  Winston.uncaught( err.stack || err );
});

const _appPackageJson = JSON.parse(Fs.readFileSync(Path.join(Editor.appPath,'package.json')));
const _frameworkPackageJson = JSON.parse(Fs.readFileSync(Path.join(__dirname,'package.json')));

// add builtin node_modules search path for core-level
require('module').globalPaths.push(Path.join(Editor.appPath,'node_modules'));

// ---------------------------
// initialize minimal Editor
// ---------------------------

/**
 * The name of your app. It is defined in the `name` field in package.json
 * @property name
 * @type string
 */
Editor.name = App.getName();

/**
 * versions of your app and submodules
 * @property versions
 * @type Object
 */
Editor.versions = {
  'editor-framework': _frameworkPackageJson.version,
};
Editor.versions[Editor.name] = App.getVersion();

/**
 * The absolute path of your main entry file. Usually it is `{your-app}/app.js`.
 * @property mainEntry
 * @type string
 */
Editor.mainEntry = Path.join( Editor.appPath, _appPackageJson.main );

/**
 * The editor framework module path. Usually it is `{your-app}/editor-framework/`
 * @property frameworkPath
 * @type string
 */
Editor.frameworkPath = __dirname;

/**
 * Your application's data path. Usually it is `~/.{your-app-name}`
 * @property appHome
 * @type string
 */
Editor.appHome = Path.join( App.getPath('home'), '.' + Editor.name );

// initialize ~/.{app-name}
Fs.ensureDirSync(Editor.appHome);

// initialize ~/.{app-name}/local/
const settingsPath = Path.join(Editor.appHome, 'local');
if ( !Fs.existsSync(settingsPath) ) {
  Fs.mkdirSync(settingsPath);
}

const EventEmitter = require('events');
Editor.events = new EventEmitter();

// ---------------------------
// initialize logs/
// ---------------------------

// MacOSX: ~/Library/Logs/{app-name}
// Windows: %APPDATA%, some where like 'C:\Users\{your user name}\AppData\Local\...'

// get log path
let _logpath = '';
if ( process.platform === 'darwin' ) {
  _logpath = Path.join(App.getPath('home'), 'Library/Logs/' + Editor.name );
} else {
  _logpath = Path.join(App.getPath('appData'), Editor.name);
}

Fs.ensureDirSync(_logpath);

const _logfile = Path.join(_logpath, Editor.name + '.log');
if ( Fs.existsSync(_logfile) ) {
  Fs.unlinkSync(_logfile);
}

const winstonLevels = {
  normal   : 0,
  success  : 1,
  failed   : 2,
  info     : 3,
  warn     : 4,
  error    : 5,
  fatal    : 6,
  uncaught : 7,
};
Winston.setLevels(winstonLevels);

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.File, {
    level: 'normal',
    filename: _logfile,
    json: false,
});

const chalkPID = Chalk.bgBlue;
const chalkSuccess = Chalk.green;
const chalkWarn = Chalk.yellow;
const chalkError = Chalk.red;
const chalkInfo = Chalk.cyan;

const levelToFormat = {
  normal ( text ) {
    let pid = chalkPID(`[${process.pid}]`) + ' ';
    return pid + text;
  },

  success ( text ) {
    let pid = chalkPID(`[${process.pid}]`) + ' ';
    return pid + chalkSuccess(text);
  },

  failed ( text ) {
    let pid = chalkPID(`[${process.pid}]`) + ' ';
    return pid + chalkError(text);
  },

  info ( text ) {
    let pid = chalkPID(`[${process.pid}]`) + ' ';
    return pid + chalkInfo(text);
  },

  warn ( text ) {
    let pid = chalkPID(`[${process.pid}]`) + ' ';
    return pid + chalkWarn.inverse.bold('Warning:') + ' ' + chalkWarn(text);
  },

  error ( text ) {
    let pid = chalkPID(`[${process.pid}]`) + ' ';
    return pid + chalkError.inverse.bold('Error:') + ' ' + chalkError(text);
  },

  fatal ( text ) {
    let pid = chalkPID(`[${process.pid}]`) + ' ';
    return pid + chalkError.inverse.bold('Fatal Error:') + ' ' + chalkError(text);
  },

  uncaught ( text ) {
    let pid = chalkPID(`[${process.id}]`) + ' ';
    return pid + chalkError.inverse.bold('Uncaught Exception:') + ' ' + chalkError(text);
  },
};

Winston.add( Winston.transports.Console, {
  level: 'normal',
  formatter: function (options) {
    let text = '';
    if ( options.message !== undefined ) {
      text += options.message;
    }
    if ( options.meta && Object.keys(options.meta).length ) {
      text += ' ' + JSON.stringify(options.meta);
    }

    // output log by different level
    let formatter = levelToFormat[options.level];
    if ( formatter ) {
      return formatter(text);
    }

    return text;
  }
});

// ---------------------------
// Define Editor.App APIs
// ---------------------------

let _editorAppIpc;
function _loadEditorApp () {
  let editorApp = Editor.App;

  if ( editorApp.load ) {
    try {
      Editor.App.load();
    }
    catch (err) {
      Editor.failed( 'Failed to load Editor.App, %s.', err.stack );
      return;
    }
  }

  // register ipcs
  let ipcListener = new Editor.IpcListener();
  for ( let prop in editorApp ) {
    if ( prop.indexOf('app:') !== 0 )
      continue;

    if ( typeof editorApp[prop] === 'function' ) {
      ipcListener.on( prop, editorApp[prop].bind(editorApp) );
    }
  }
  _editorAppIpc = ipcListener;
}

function _unloadEditorApp () {
  let editorApp = Editor.App;

  // unregister main ipcs
  _editorAppIpc.clear();
  _editorAppIpc = null;

  // unload main
  let cache = require.cache;
  if ( editorApp.unload ) {
    try {
      editorApp.unload();
    }
    catch (err) {
      Editor.failed( 'Failed to unload Editor.App, %s.', err.stack );
    }
  }

  delete cache[Editor.mainEntry];
  delete global.__app;
}

function _reloadEditorApp () {
  _unloadEditorApp();
  require(Editor.mainEntry);
  Editor.App = __app;
  Editor.App.reload = _reloadEditorApp;
  _loadEditorApp();

  Editor.success('Editor.App reloaded');
}

// ---------------------------
// register App events
// ---------------------------

// DISABLE: http cache only happends afterwhile, not satisefy our demand (which need to happend immediately).
// App.commandLine.appendSwitch('disable-http-cache');
// App.commandLine.appendSwitch('disable-direct-write');

// DISABLE: we have main-window
// // quit when all windows are closed.
// App.on('window-all-closed', function( event ) {
//     App.quit();
// });

//
App.on('will-finish-launching', () => {
  if ( !Editor.isDev ) {
    let crashReporter = require('crash-reporter');
    crashReporter.start({
      productName: Editor.name,
      companyName: 'Firebox Technology',
      submitUrl: 'https://fireball-x.com/crash-report',
      autoSubmit: false,
    });
  }
});

//
App.on('gpu-process-crashed', () => {
  if ( Editor && Editor.sendToWindows ) {
    Editor.sendToWindows('console:error', 'GPU Process Crashed!');
  }
  Winston.uncaught('GPU Process Crashed!');
});

//
App.on('ready', () => {

  // ---------------------------
  // initialize Commander
  // ---------------------------

  // NOTE: commander only get things done barely in core level,
  //       it doesn't touch the page level, so it should not put into App.on('ready')
  Commander
    .version(App.getVersion())
    .option('--dev', 'Run in development environment')
    .option('--dev-mode <mode>', 'Run in specific dev-mode')
    .option('--show-devtools', 'Open devtools automatically when main window loaded')
    .option('--debug <port>', 'Open in browser context debug mode', parseInt )
    .option('--debug-brk <port>', 'Open in browser context debug mode, and break at first.', parseInt)
    .option('--test <path>', 'Run tests in path' )
    .option('--report-failures', 'Send test failures to the main process')
    .option('--report-details', 'Send test details to the main process' )
    ;

  // init app's command
  if ( Editor.App.initCommander ) {
    Editor.App.initCommander(Commander);
  }

  // run commander
  Commander.parse(process.argv);

  // apply arguments to Editor
  Editor.isDev = Commander.dev;
  Editor.devMode = Commander.devMode;
  Editor.showDevtools = Commander.showDevtools;
  Editor.debugPort = Commander.debug;

  // ---------------------------
  // initialize protocol
  // ---------------------------

  Winston.normal( 'Initializing Protocol' );
  require('./core/protocol-init');

  // ---------------------------
  // initialize Editor
  // ---------------------------

  Winston.normal( 'Initializing Editor' );
  require('./core/editor-init');

  // ---------------------------
  // run test
  // ---------------------------

  if ( Commander.test ) {
    let Test = require('./core/test-runner');
    Test.run(Commander.test, {
      reportFailures: Commander.reportFailures,
      reportDetails: Commander.reportDetails,
    });

    return;
  }

  // apply default main menu
  Editor.MainMenu.apply();

  // register profile path
  Editor.registerProfilePath( 'app', Editor.appHome );
  Editor.registerProfilePath( 'local', Path.join( Editor.appHome, 'local' ) );

  // register package path
  Editor.registerPackagePath( Path.join( Editor.appPath, 'builtin' ) );

  // register default layout
  Editor.registerDefaultLayout( Editor.url('editor-framework://static/layout.json') );

  // before run the app, we start load and watch all packages
  Async.series([
    // init app
    next => {
      // init user App
      if ( !Editor.App.init ) {
        Winston.error('Can not find function "init" in your App');
        App.terminate();
        return;
      }

      try {
        Editor.App.init(Commander, next);
      } catch ( err ) {
        Winston.error(err.stack || err);
        App.terminate();
        return;
      }
    },

    next => {
      Winston.normal('Loading packages');
      Editor.loadAllPackages( next );
    },

    next => {
      Winston.normal('Prepare for watching packages');
      Editor.watchPackages( next );
    },

    next => {
      Editor.success('Watch ready');

      Winston.success('Initial success!');

      // register user App Ipcs after App.init
      _loadEditorApp();
      Editor.App.reload = _reloadEditorApp;

      // load windows layout after local profile registered
      Editor.Window.loadLayouts();

      // connect to console to sending ipc to it
      Editor.connectToConsole();

      // run user App
      if ( !Editor.App.run ) {
        Winston.error('Can not find function "run" in your App');
        App.terminate();
        return;
      }

      try {
        Editor.App.run();
        next();
      } catch ( err ) {
        Winston.error(err.stack || err);
        App.terminate();
        return;
      }
    },
  ], err => {
    if ( err ) {
      Winston.error(err.stack || err);
      App.terminate();
    }
  });
});
