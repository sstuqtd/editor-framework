'use strict';

const Editor = require('./lib/main/');

const Electron = require('electron');
const Chalk = require('chalk');
const Path = require('fire-path');
const Fs = require('fire-fs');
const Winston = require('winston');
const Async = require('async');

const app = Electron.app;

// ---------------------------
// node setup
// ---------------------------

// this will prevent default atom-shell uncaughtException
process.removeAllListeners('uncaughtException');
process.on('uncaughtException', err => {
  // if ( Editor && Editor.error ) {
  //   Editor.error(err.stack || err);
  //   return;
  // }
  console.log( Chalk.red.inverse.bold('Uncaught Exception: ') + Chalk.red( err.stack || err ) );
});

// add builtin node_modules search path for core-level
require('module').globalPaths.push(Path.join(app.getAppPath(),'node_modules'));

// ---------------------------
// setup default arguments
// ---------------------------

const Yargs = require('yargs');
const OsLocale = require('os-locale');

let osLang = OsLocale.sync().indexOf('zh') !== -1 ? 'zh' : 'en';

Yargs.strict()
.help('help')
.version(app.getVersion())
// for debug
.options({
  'dev': {
    type: 'boolean',
    global: true,
    desc: 'Run in development environment.'
  },
  'show-devtools': {
    type: 'boolean',
    global: true,
    desc: 'Open devtools automatically when main window loaded.'
  },
  'debug': {
    type: 'number',
    default: 3030,
    global: true,
    desc: 'Open in browser context debug mode.'
  },
  'debug-brk': {
    type: 'number',
    default: 3030,
    global: true,
    desc: 'Open in browser context debug mode, and break at first.'
  },
  'lang': {
    type: 'string',
    default: osLang,
    global: true,
    desc: 'Choose a language'
  },
})
// command: test
.command(
  'test [path]', 'Run tests',
  yargs => {
    return yargs.usage('Command: test [path]')
    .options({
      'renderer': { type: 'boolean', desc: 'Run tests in renderer.' },
      'package': { type: 'boolean', desc: 'Run specific package tests.' },
      'detail': { type: 'boolean', desc: 'Run test in debug mode (It will not quit the test, and open the devtools to help you debug it).' },
      'reporter': { type: 'string', desc: 'Mocha reporter, default is \'spec\'' },
    });
  },
  argv => {
    argv._command = 'test';
  }
)
// command: build
.command(
  'build [path]', 'Build specific pacakge',
  yargs => {
    return yargs.usage('Command: build [path]');
  },
  argv => {
    argv._command = 'build';
  }
);

// ---------------------------
// initialize paths
// ---------------------------

// load your-app-path/editor-framework/package.json
const _frameworkPath = __dirname;
const _frameworkPackageJson = JSON.parse(Fs.readFileSync(Path.join(_frameworkPath,'package.json')));

// MacOSX: ~/Library/Logs/{app-name}
// Windows: %APPDATA%, some where like 'C:\Users\{your user name}\AppData\Local\...'

// get log path
let _logpath = '';
if ( process.platform === 'darwin' ) {
  _logpath = Path.join(app.getPath('home'), `Library/Logs/${Editor.App.name}`);
} else {
  _logpath = Path.join(app.getPath('appData'), Editor.App.name);
}
const _logfile = Path.join(_logpath, `${Editor.App.name}.log`);

// make sure ~/.{app-name} exists
Fs.ensureDirSync(Editor.App.home);

// make sure ~/.{app-name}/local/ exists
Fs.ensureDirSync(Path.join(Editor.App.home, 'local'));

// make sure log path exists
Fs.ensureDirSync(_logpath);

// ---------------------------
// initialize logs/
// ---------------------------

Winston.setLevels({
  normal   : 0,
  success  : 1,
  failed   : 2,
  info     : 3,
  warn     : 4,
  error    : 5,
  fatal    : 6,
  uncaught : 7,
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

// ---------------------------
// init app
// ---------------------------

// DISABLE: http cache only happends afterwhile, not satisefy our demand (which need to happend immediately).
// app.commandLine.appendSwitch('disable-http-cache');
// app.commandLine.appendSwitch('disable-direct-write');

// DISABLE: we have main-window
// // quit when all windows are closed.
// app.on('window-all-closed', (event) => {
//     app.quit();
// });

// NOTE: put a default function and don't do anything in it.
// this will make sure even all window closed, the app still not quit.
// this is very useful when we start a unit-test with a window,
// or we start some function that needs to run in a hidden window before main-window opened.
app.on('window-all-closed', () => {});

//
app.on('gpu-process-crashed', () => {
  console.log( Chalk.red.inverse.bold('GPU Process Crashed!') );
});

app.on('ready', () => {
  // init app's command
  if ( Editor.App.beforeInit ) {
    Editor.App.beforeInit(Yargs);
  }

  // get options from yargs
  let yargv = Yargs.argv;

  // ---------------------------
  // initialize Editor
  // ---------------------------

  Winston.remove(Winston.transports.Console);

  if ( yargv._command !== 'test' ) {
    if ( Fs.existsSync(_logfile) ) {
      try {
        Fs.unlinkSync(_logfile);
      } catch (e) {
        console.log(e);
      }
    }

    Winston.add(Winston.transports.File, {
      level: 'uncaught',
      filename: _logfile,
      json: false,
    });

    console.log( Chalk.magenta('===== Initializing Editor =====') );

    let args = process.argv.slice(2);
    args = args.map(a => { return `  ${a}`; });
    console.log( Chalk.magenta(`arguments: \n${args.join('\n')}\n`) );
  }

  if ( yargv._command !== 'test' || yargv.detail ) {
    Winston.add(Winston.transports.Console, {
      level: 'uncaught',
      formatter (options) {
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
  }

  // apply arguments to Editor
  Editor.argv = yargv;
  Editor.dev = yargv.dev;
  Editor.lang = yargv.lang;

  // register protocol
  Editor.Protocol.init(Editor);

  // reset submodules
  Editor.Package.lang = yargv.lang;
  Editor.Package.versions = Editor.versions;
  Editor.Menu.showDev = yargv.dev;
  Editor.Debugger.debugPort = yargv.debug;

  // ---------------------------
  // run editor
  // ---------------------------

  Editor.reset();

  // before run the app, we start load and watch all packages
  Async.series([
    // init app
    next => {
      // init user App
      if ( !Editor.App.init ) {
        Editor.error('Can not find function "init" in your app');
        app.terminate();
        return;
      }

      try {
        Editor.App.init(yargv, next);
      } catch ( err ) {
        Editor.error(err.stack || err);
        app.terminate();
        return;
      }
    },

    // run test ( and quit if that happen )
    next => {
      if ( !yargv._command ) {
        next ();
        return;
      }

      if ( yargv._command === 'test' ) {
        // NOTE: DO NOT call next() when we decided to run test
        const Tester = require('./lib/tester');
        Tester.run( yargv.path, yargv );
      } else if ( yargv._command === 'build' ) {
        const Builder = require('./lib/builder');
        Builder.run( yargv.path, yargv );
      }
    },

    // load packages
    next => {
      Editor.log('Loading packages');
      Editor.loadAllPackages( next );
    },

    // watch packages
    next => {
      if ( yargv.dev ) {
        Editor.log('Watching packages');
        Editor.watchPackages(next);
        return;
      }

      next();
    },

    // run app
    next => {
      Editor.log('Run Application');

      // load windows layout after local profile registered
      Editor.Window.loadLayouts();

      // connect to console to sending ipc to it
      Editor.connectToConsole();

      // run user App
      if ( !Editor.App.run ) {
        Editor.error('Can not find function "run" in your app');
        app.terminate();
        return;
      }

      try {
        Editor.App.run();
        next();
      } catch ( err ) {
        Editor.error(err.stack || err);
        app.terminate();
        return;
      }
    },
  ], err => {
    if ( err ) {
      Editor.error(err.stack || err);
      app.terminate();
    }
  });
});

// ---------------------------
// extends Editor module
// ---------------------------

/**
 * versions of your app and submodules
 * @property versions
 * @type Object
 */
Editor.versions = {
  [app.getName()]: app.getVersion(),
  'editor-framework': _frameworkPackageJson.version,
};

/**
 * The editor framework module path. Usually it is `{your-app}/editor-framework/`
 * @property frameworkPath
 * @type string
 */
Editor.frameworkPath = _frameworkPath;
Editor.logfile = _logfile;

//
module.exports = Editor;
