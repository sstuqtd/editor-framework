// NOTE: This is test runner for editor-framework, it covers the test cases for developing editor-framework
// It is different than github.com/fireball-packages/tester, which is for package developers to test their pacakges.

var Ipc = require('ipc');
var Globby = require('globby');
var Path = require('fire-path');
var Fs = require('fire-fs');
var Chalk = require('chalk');

var Mocha = require('mocha');
var Chai = require('chai');
var Base = Mocha.reporters.Base;

//
global.assert = Chai.assert;
global.expect = Chai.expect;
global.sinon = require('sinon');

var Test = {};
Test.liveRun = function ( path ) {
    var SpawnSync = require('child_process').spawnSync;
    var App = require('app');
    var exePath = App.getPath('exe');

    if ( Fs.isDirSync(path) ) {
        var indexFile = Path.join(path, 'index.js');
        var files;

        if ( Fs.existsSync(indexFile) ) {
            var cache = require.cache;
            if ( cache[indexFile] ) {
                delete cache[indexFile];
            }

            files = require(indexFile);
            files.forEach(function ( file ) {
                Test.liveRun( file );
            });
        }
        else {
            Globby ( Path.join(path, '**/*.js'), function ( err, files ) {
                files.forEach(function (file) {
                    Test.liveRun( file );
                });
            });
        }
    }
    else {
        console.log( Chalk.magenta( 'Start test (' + path + ')') );
        SpawnSync(exePath, ['./', '--test', path], {stdio: 'inherit'});
    }
};

Test.run = function ( path ) {
  var mocha = new Mocha({
      ui: 'bdd',
      reporter: Spec,
  });

  //check if input is an array
  if (Object.prototype.toString.call( path ) === '[object Array]') {
    path.map(function(file) {
      mocha.addFile(file);
    });
  } else {
    var stats = Fs.statSync(path);
    if ( !stats.isFile() ) {
        console.error('The path %s you provide is not a file', path);
        process.exit(0);
        return;
    }
    mocha.addFile(path);
  }

  mocha.run(function (failures) {
      process.exit(failures);
  });
};

function Spec(runner) {
    Base.call(this, runner);

    var self = this,
        stats = this.stats,
        indents = 0,
        n = 0,
        cursor = Base.cursor,
        color = Base.color;

    function indent() {
        return Array(indents).join('  ');
    }

    function _onStart () {}
    function _onSuite ( suite ) {
        ++indents;
        console.log(color('suite', '%s%s'), indent(), suite.title);
    }
    function _onSuiteEnd ( suite ) {
        --indents;
        if (1 == indents) console.log();
    }
    function _onPending ( test ) {
        var fmt = indent() + color('pending', '  - %s');
        console.log(fmt, test.title);
    }
    function _onPass ( test ) {
        var fmt;
        if ('fast' == test.speed) {
            fmt = indent() +
                color('checkmark', '  ' + Base.symbols.ok) +
                color('pass', ' %s');
            cursor.CR();
            console.log(fmt, test.title);
        } else {
            fmt = indent() +
                color('checkmark', '  ' + Base.symbols.ok) +
                color('pass', ' %s') +
                color(test.speed, ' (%dms)');
            cursor.CR();
            console.log(fmt, test.title, test.duration);
        }
    }
    function _onFail ( test, err ) {
        var fmt = indent() +
            color('fail', '  ' + Base.symbols.err) +
            color('fail', ' %s')
            ;
        cursor.CR();
        console.log(fmt, test.title);
    }

    runner.on('start', _onStart);
    runner.on('suite', _onSuite);
    runner.on('suite end', _onSuiteEnd);
    runner.on('pending', _onPending);
    runner.on('pass', _onPass);
    runner.on('fail', _onFail);
    runner.on('end', self.epilogue.bind(self));

    // IPC
    Ipc.on('runner:start', _onStart);
    Ipc.on('runner:suite', function ( event, suite ) { _onSuite(suite); });
    Ipc.on('runner:suite-end', function ( event, suite ) { _onSuiteEnd(suite); });
    Ipc.on('runner:pending', function ( event, test ) { _onPending(test); });
    Ipc.on('runner:pass', function ( event, test ) { _onPass(test); });
    Ipc.on('runner:fail', function ( event, test, err ) {
        cursor.CR();
        var fmt = indent() +
            color('fail', '  ' + Base.symbols.err) +
            color('error title', ' %s')
            ;
        console.log(fmt, test.title);
        cursor.CR();

        fmt = color('error message', ' %s')
            ;
        console.log(fmt, err.stack);
    });
    Ipc.on('runner:end', function ( event ) {});
}
Spec.prototype = Base.prototype;

module.exports = Test;
