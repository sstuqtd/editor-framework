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
                Test.liveRun( Path.join(path,file) );
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
        SpawnSync(exePath, [Editor.App.path, '--test', path], {stdio: 'inherit'});
    }
};

Test.run = function ( path, opts ) {
    var stats = Fs.statSync(path);
    if ( !stats.isFile() ) {
        console.error('The path %s you provide is not a file', path);
        process.exit(0);
        return;
    }

    var reporter = DefaultReporter;
    if (opts) {
        if ( opts.reportDetails ) {
            reporter = DetailsReporter;
        }
        else if ( opts.reportFailures ) {
            reporter = FailuresReporter;
        }
    }

    var mocha = new Mocha({
        ui: 'bdd',
        reporter: reporter,
    });

    mocha.addFile(path);

    mocha.run(function (failures) {
        if ( process.send ) {
            process.send({
                channel: 'process:end',
                failures: failures,
                path: path,
            });
        }
        process.exit(failures);
    });
};

// FailuresReporter
function FailuresReporter(runner) {
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
        //console.log(color('suite', '%s%s'), indent(), suite.title);
    }
    function _onSuiteEnd ( suite ) {
        --indents;
        if (1 == indents) console.log();
    }
    function _onPending ( test ) {
        var fmt = indent() + color('pending', '  - %s');
        console.log(fmt, test.title);
    }
    runner.on('start', _onStart);
    runner.on('end', self.epilogue.bind(self));
    runner.on('suite', _onSuite);
    runner.on('suite end', _onSuiteEnd);
    runner.on('pending', _onPending);

    // IPC
    Ipc.on('runner:start', _onStart);
    Ipc.on('runner:end', function ( event ) {});
    Ipc.on('runner:suite', function ( event, suite ) { _onSuite(suite); });
    Ipc.on('runner:suite-end', function ( event, suite ) { _onSuiteEnd(suite); });
    Ipc.on('runner:pending', function ( event, test ) { _onPending(test); });
}
FailuresReporter.prototype = Base.prototype;

// DetailsReporter
function DetailsReporter(runner) {
    function _ipcSuite ( suite ) {
        return {
            root: suite.root,
            title: suite.title,
            fullTitle: suite.fullTitle(),
        };
    }

    function _ipcErr ( err ) {
        if ( !err )
            return null;

        return {
            stack: err.stack || err.toString(),
            message: err.message,
            line: err.line,
            sourceURL: err.sourceURL,
        };
    }

    function _ipcTest ( test ) {
        return {
            type: test.type,
            title: test.title,
            fullTitle: test.fullTitle(),
            state: test.state,
            speed: test.speed,
            duration: test.duration,
            pending: test.pending,
            fn: test.fn ? test.fn.toString() : '',
            err: _ipcErr(test.err)
        };
    }

    function _ipcStats ( runner, stats ) {
        return {
            passes: stats.passes,
            failures: stats.failures,
            duration: new Date() - stats.start,
            progress: stats.tests / runner.total * 100 | 0,
        };
    }

    Base.call(this, runner);

    var self = this, stats = this.stats;

    runner.on('start', function () {
        process.send({
            channel: 'runner:start',
        });
    });

    runner.on('end', function () {
        process.send({
            channel: 'runner:end',
        });
    });

    runner.on('suite', function(suite){
        process.send({
            channel: 'runner:suite',
            suite: _ipcSuite(suite)
        });
    });

    runner.on('suite end', function (suite) {
        process.send({
            channel: 'runner:suite-end',
            suite: _ipcSuite(suite)
        });
    });

    runner.on('test', function(test) {
        process.send({
            channel: 'runner:test',
            test: _ipcTest(test)
        });
    });

    runner.on('test end', function(test) {
        process.send({
            channel: 'runner:test-end',
            stats: _ipcStats(runner,stats),
            test: _ipcTest(test),
        });
    });

    runner.on('pending', function (test) {
        process.send({
            channel: 'runner:pending',
            test: _ipcTest(test),
        });
    });

    runner.on('pass', function (test) {
        process.send({
            channel: 'runner:pass',
            test: _ipcTest(test)
        });
    });

    runner.on('fail', function (test, err) {
        process.send({
            channel: 'runner:fail',
            test: _ipcTest(test),
            err: _ipcErr(err)
        });
    });
}
DetailsReporter.prototype = Base.prototype;

// DefaultReporter
function DefaultReporter(runner) {

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

    function _onStart () {
    }
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
    function _onTestEnd (test) {
    }

    runner.on('start', _onStart);
    runner.on('end', self.epilogue.bind(self));
    runner.on('suite', _onSuite);
    runner.on('suite end', _onSuiteEnd);
    runner.on('test end', _onTestEnd);
    runner.on('pending', _onPending);
    runner.on('pass', _onPass);
    runner.on('fail', _onFail);

    // IPC (from page)
    Ipc.on('runner:start', _onStart);
    Ipc.on('runner:end', function ( event ) {});
    Ipc.on('runner:suite', function ( event, suite ) { _onSuite(suite); });
    Ipc.on('runner:suite-end', function ( event, suite ) { _onSuiteEnd(suite); });
    Ipc.on('runner:pending', function ( event, test ) { _onPending(test); });
    Ipc.on('runner:pass', function ( event, test ) {
        stats.passes++;
        _onPass(test);
    });
    Ipc.on('runner:fail', function ( event, test, err ) {
        stats.failures++;
        cursor.CR();
        var fmt = indent() +
            color('fail', '  ' + Base.symbols.err) +
            color('error title', ' %s')
            ;
        console.log(fmt, test.title);
        cursor.CR();

        fmt = color('error message', ' %s');
        console.log(fmt, err.stack);
    });
}
DefaultReporter.prototype = Base.prototype;

module.exports = Test;
