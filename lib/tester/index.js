'use strict';

// NOTE: This is test runner for editor-framework, it covers the test cases for developing editor-framework
// It is different than github.com/fireball-packages/tester, which is for package developers to test their pacakges.

const Globby = require('globby');
const Path = require('fire-path');
const Fs = require('fire-fs');
const Chalk = require('chalk');

const Mocha = require('mocha');
const Chai = require('chai');

//
Mocha.reporters['child-process'] = require('./child-process-reporter');

//
global.assert = Chai.assert;
global.expect = Chai.expect;
global.sinon = require('sinon');

global.Helper = require('./share/helper');

function _logError (text) {
  console.log(Chalk.red(text));
}

//
function _initRendererReporter ( reporterType ) {
  const EventEmitter = require('events');

  let ipcListener = new Editor.IpcListener();

  // fake the reporter
  let runner = new EventEmitter();
  let inst = new Mocha.reporters[reporterType]( runner );
  inst._listener = ipcListener;
  inst._reporter = reporterType;

  function _wrapTest ( test ) {
    test.slow = () => { return 75; };
    test.fullTitle = () => { return test._fullTitle; };
    return test;
  }

  ipcListener.on('runner:start', () => { runner.emit('start'); });
  ipcListener.on('runner:suite', (event, suite) => { runner.emit('suite',suite); });
  ipcListener.on('runner:suite-end', (event, suite) => { runner.emit('suite end',suite); });
  ipcListener.on('runner:test', (event, test) => { runner.emit('test',_wrapTest(test)); });
  ipcListener.on('runner:pending', (event, test) => { runner.emit('pending',_wrapTest(test)); });
  ipcListener.on('runner:pass', (event, test) => { runner.emit('pass',_wrapTest(test)); });
  ipcListener.on('runner:fail', (event, test, err) => { runner.emit('fail',_wrapTest(test),err); });
  ipcListener.on('runner:test-end', (event, test, stats) => { runner.emit('test end',_wrapTest(test),stats); });
  ipcListener.on('runner:end', () => { runner.emit('end'); });

  return inst;
}

function _resetRendererReporter ( reporter ) {
  reporter._listener.clear();
  return _initRendererReporter(reporter._reporter);
}

process.on('message', data => {
  switch ( data.channel ) {
  case 'tester:reload':
    if ( !Editor.mainWindow ) {
      return;
    }
    Editor.mainWindow.nativeWin.reload();
    break;

  case 'tester:active-window':
    if ( !Editor.mainWindow ) {
      return;
    }
    Editor.mainWindow.nativeWin.focus();
    break;

  case 'tester:exit':
    process.exit(0);
    break;
  }
});

// ==============================
// Tester
// ==============================

const Tester = {
  // runPackage
  runPackage ( path, opts, cb ) {
    const FindUp = require('find-up');
    FindUp('package.json', {cwd: path}).then(file => {
      if ( !file ) {
        _logError(`Can not find package.json in ${file}`);
        return;
      }

      // load package
      let packagePath = Path.dirname(file);
      if ( !Path.isAbsolute(packagePath) ) {
        packagePath = Path.join(Editor.App.path,packagePath);
      }

      Editor.Package.load(packagePath, {build: true}, () => {
        // if the path is not a specific test, run all tests in the package
        let runAllTest = true;
        if ( path.indexOf('test') !== -1 ) {
          runAllTest = false;
        }

        //
        if ( runAllTest ) {
          const Async = require('async');
          let totalFailures = 0;
          let testPath = Path.join(packagePath,'test');

          Async.series([
            next => {
              Tester.runRenderer(Path.join(testPath,'renderer'), opts, failures => {
                totalFailures += failures;
                next ();
              });
            },

            next => {
              Tester.runMain(Path.join(testPath,'main'), opts, failures => {
                totalFailures += failures;
                next ();
              });
            },
          ], () => {
            if ( cb ) {
              cb (totalFailures);
            }
          });

          return;
        }

        // run test in renderer process
        if ( opts.renderer || path.indexOf('renderer') !== -1 ) {
          Tester.runRenderer(path,opts,cb);
          return;
        }

        // run test in main process
        Tester.runMain(path,opts,cb);
      });
    });

  },

  // runRenderer
  runRenderer ( path, opts, cb ) {
    let files = [];
    if ( Fs.isDirSync(path) ) {
      files = Globby.sync([
        Path.join(path,'**/*.js'),
        '!**/fixtures/**',
      ]);
    } else {
      files = [path];
    }

    // =========================
    // IPC (from page)
    // =========================

    const Ipc = require('ipc');

    // get reporter type
    let reporter = opts.reporter || 'spec';
    if ( !Mocha.reporters[reporter] ) {
      console.log(Chalk.red(`could not find the reporter: ${reporter}`));
      reporter = 'spec';
    }

    let inst = _initRendererReporter(reporter);
    let win = new Editor.Window('__test__', {
      'title': 'Testing Renderer...',
      'width': 400,
      'height': 300,
      'show': false,
      'resizable': true,
    });
    Editor.mainWindow = win;

    //
    Ipc.on('mocha-reload', () => {
      // reset reporter
      inst = _resetRendererReporter(inst);
    });

    //
    Ipc.on('mocha-done', (event, failures) => {
      if ( opts.detail ) {
        // reset reporter
        inst = _resetRendererReporter(inst);

        // open devtools if there has failed tests
        if ( failures ) {
          win.openDevTools({
            detach: true
          });
        }

        return;
      }

      win.close();

      if ( cb ) {
        cb ( failures );
      }
    });

    // load and show main window
    win.show();

    // page-level test case
    win.load('editor-framework://lib/tester/renderer/index.html', {
      files: files,
    });
  },

  // runMain
  runMain ( path, opts, cb ) {
    // glob files
    let files = [];
    if ( Fs.isDirSync(path) ) {
      files = Globby.sync([
        Path.join(path,'**/*.js'),
        '!**/fixtures/**',
      ]);
    } else {
      files = [path];
    }

    // reporter
    let reporter = opts.reporter || 'spec';
    if ( !Mocha.reporters[reporter] ) {
      _logError(`could not find the reporter: ${reporter}`);
      reporter = 'spec';
    }

    // run test in main-process
    let mocha = new Mocha({
      ui: 'bdd',
    });

    mocha.files = files;
    mocha.reporter(reporter);
    mocha.run(cb);
  },

  // run
  run ( path, opts ) {
    path = path || Path.join( Editor.App.path, 'test' );

    //
    if ( !Fs.existsSync(path) ) {
      _logError(`The path ${path} you provide does not exist.`);
      process.exit(1);
      return;
    }

    // reset main menu for test
    Editor.Menu.register('main-menu', require('./main-menu'), true);
    Editor.MainMenu.reset();

    //
    function _done ( failures ) {
      if ( process.send ) {
        process.send({
          channel: 'process:end',
          failures: failures,
          path: path,
        });
      }
      process.exit(failures);
    }

    // run test in specific package
    if ( opts.package ) {
      Tester.runPackage(path,opts,_done);
      return;
    }

    // run test in renderer process
    if ( opts.renderer || path.indexOf('renderer') !== -1 ) {
      Tester.runRenderer(path,opts,_done);
      return;
    }

    // run test in main process
    Tester.runMain(path,opts,_done);
  },
};

module.exports = Tester;
