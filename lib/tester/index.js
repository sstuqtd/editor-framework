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

    let Base = Mocha.reporters.Base;

    let stats = { suites: 0, tests: 0, passes: 0, pending: 0, failures: 0 };
    let indents = 0;
    let cursor = Base.cursor;
    let color = Base.color;

    let s = 1000;
    let m = s * 60;
    let h = m * 60;
    let d = h * 24;

    function indent() {
      return Array(indents).join('  ');
    }

    function fmtTime(ms) {
      if (ms >= d) {
        return Math.round(ms / d) + 'd';
      }
      if (ms >= h) {
        return Math.round(ms / h) + 'h';
      }
      if (ms >= m) {
        return Math.round(ms / m) + 'm';
      }
      if (ms >= s) {
        return Math.round(ms / s) + 's';
      }
      return ms + 'ms';
    }

    // =========================
    // IPC (from page)
    // =========================

    const Ipc = require('ipc');

    Ipc.on('runner:start', () => {
      stats.start = new Date();
    });

    Ipc.on('runner:suite', (event, suite) => {
      ++indents;
      console.log(color('suite', '%s%s'), indent(), suite.title);
      stats.suites++;
    });

    Ipc.on('runner:pass', (event, test) => {
      let fmt;
      if (test.speed === 'fast') {
        fmt = indent() +
              color('checkmark', '  ' + Base.symbols.ok) +
              color('pass', ' %s')
              ;
        cursor.CR();
        console.log(fmt, test.title);
      } else {
        fmt = indent() +
              color('checkmark', '  ' + Base.symbols.ok) +
              color('pass', ' %s') +
              color(test.speed, ' (%dms)')
              ;
        cursor.CR();
        console.log(fmt, test.title, test.duration);
      }

      stats.passes++;
    });

    Ipc.on('runner:fail', function ( event, test, err ) {
      cursor.CR();
      var fmt = indent() +
          color('fail', '  ' + Base.symbols.err) +
          color('error title', ' %s')
          ;
      console.log(fmt, test.title);
      cursor.CR();

      fmt = color('error message', ' %s');
      console.log(fmt, err.stack);

      stats.failures++;
    });

    Ipc.on('runner:pending', (event, test) => {
      let fmt = indent() + color('pending', '  - %s');
      console.log(fmt, test.title);

      stats.pending++;
    });

    Ipc.on('runner:suite-end', () => {
      --indents;
      if (indents === 1) {
        console.log();
      }
    });

    Ipc.on('runner:end', () => {
      stats.end = new Date();
      stats.duration = new Date() - stats.start;

      let fmt;

      console.log();

      // passes
      fmt = color('bright pass', ' ') +
        color('green', ' %d passing') +
        color('light', ' (%s)');

      console.log(
        fmt,
        stats.passes || 0,
        fmtTime(stats.duration)
      );

      // pending
      if (stats.pending) {
        fmt = color('pending', ' ') + color('pending', ' %d pending');

        console.log(fmt, stats.pending);
      }

      // failures
      if (stats.failures) {
        fmt = color('fail', '  %d failing');

        console.log(fmt, stats.failures);

        Base.list(this.failures);
        console.log();
      }

      console.log();
    });

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

    // run test in main-process
    let mocha = new Mocha({
      ui: 'bdd',
    });

    mocha.files = files;
    // mocha.reporter('dot');
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
