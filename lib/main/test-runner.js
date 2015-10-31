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
// Test
// ==============================

const Test = {
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
        Test.liveRun( Path.join(path,file) );
      });
    } else {
      Globby ( Path.join(path, '**/*.js'), function ( err, files ) {
        files.forEach(function (file) {
          Test.liveRun( file );
        });
      });
    }
  },

  // run
  run ( opts ) {
    let path = opts.test;

    //
    let stats = Fs.statSync(path);
    if ( !stats.isFile() ) {
      console.error('The path %s you provide is not a file', path);
      process.exit(0);
      return;
    }

    // run test in renderer process
    if ( opts.testRenderer ) {
      // TODO
      // var win = window.createWindow({
      //   height: 700,
      //   width: 1200,
      //   'web-preferences': {
      //     'web-security': false
      //   }
      // });
      // var indexPath = path.resolve(path.join(__dirname, './renderer/index.html'))
      // win._loadUrlWithArgs(indexPath, opts, Function())
      // ipc.on('mocha-done', function (event, code) {
      //   exit(code)
      // })

      return;
    }

    // run test in main-process
    let mocha = new Mocha({
      ui: 'bdd',
    });
    mocha.addFile(path);
    mocha.run((failures) => {
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

module.exports = Test;
