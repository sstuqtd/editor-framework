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
global.assert = Chai.assert;
global.expect = Chai.expect;
global.sinon = require('sinon');

// ==============================
// Tester
// ==============================

const Tester = {
  // liveRun
  liveRun ( path ) {
    const SpawnSync = require('child_process').spawnSync;
    const App = require('app');
    const exePath = App.getPath('exe');

    if ( !Fs.isDirSync(path) ) {
      console.log( Chalk.magenta( 'Start test (' + path + ')') );
      SpawnSync(exePath, [Editor.App.path, '--test', path], {stdio: 'inherit'});
      return;
    }

    let indexFile = Path.join(path, 'index.js');
    let files;

    if ( Fs.existsSync(indexFile) ) {
      let cache = require.cache;
      delete cache[indexFile];

      files = require(indexFile);
      files.forEach(function ( file ) {
        Tester.liveRun( Path.join(path,file) );
      });
    } else {
      Globby ( Path.join(path, '**/*.js'), function ( err, files ) {
        files.forEach(function (file) {
          Tester.liveRun( file );
        });
      });
    }
  },

  // runRenderer
  runRenderer ( opts ) {
    //
    let path = opts.args[0];
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
    const EventEmitter = require('events');

    // fake the reporter
    let reporter = opts.reporter || 'spec';
    if ( !Mocha.reporters[reporter] ) {
      console.error(`could not find the reporter: ${reporter}`);
      reporter = 'spec';
    }
    let runner = new EventEmitter();
    new Mocha.reporters[reporter]( runner );

    function _wrapTest ( test ) {
      test.slow = () => { return 75; };
      return test;
    }

    Ipc.on('runner:start', () => { runner.emit('start'); });
    Ipc.on('runner:suite', (event, suite) => { runner.emit('suite',suite); });
    Ipc.on('runner:suite-end', (event, suite) => { runner.emit('suite end',suite); });
    Ipc.on('runner:pending', (event, test) => { runner.emit('pending',_wrapTest(test)); });
    Ipc.on('runner:pass', (event, test) => { runner.emit('pass',_wrapTest(test)); });
    Ipc.on('runner:fail', (event, test) => { runner.emit('fail',_wrapTest(test)); });
    Ipc.on('runner:end', () => { runner.emit('end'); });

    Ipc.on('mocha-done', (event, failures) => {
      if ( opts.debugTest ) {
        if ( failures ) {
          win.openDevTools({
            detach: true
          });
        }
        return;
      }

      if ( process.send ) {
        process.send({
          channel: 'process:end',
          failures: failures,
          path: path,
        });
      }

      process.exit(failures);
    });

    //
    var win = new Editor.Window('main', {
      'title': 'Test Renderer',
      'width': 400,
      'height': 300,
      'show': false,
      'resizable': true,
    });
    Editor.mainWindow = win;

    // load and show main window
    win.show();

    // page-level test case
    win.load('editor-framework://lib/tester/renderer/index.html', {
      files: files,
    });
  },

  // run
  run ( opts ) {
    let path = Path.join( Editor.App.path, 'test' );
    if ( opts.args.length ) {
      path = opts.args[0];
    }

    //
    if ( !Fs.existsSync(path) ) {
      console.error('The path %s you provide is not exists', path);
      process.exit(1);
      return;
    }

    // run test in renderer process
    if ( opts.renderer || path.indexOf('renderer') !== -1 ) {
      Tester.runRenderer(opts);
      return;
    }

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
      console.error(`could not find the reporter: ${reporter}`);
      reporter = 'spec';
    }

    // run test in main-process
    let mocha = new Mocha({
      ui: 'bdd',
    });

    mocha.files = files;
    mocha.reporter(reporter);
    mocha.run(failures => {
      if ( process.send ) {
        process.send({
          channel: 'process:end',
          failures: failures,
          path: path,
        });
      }
      process.exit(failures);
    });
  },
};

module.exports = Tester;
