(function () {

     // Module dependencies.

    var Ipc = require('ipc');
    var Base = Mocha.reporters.Base;

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


     // Initialize a new `IpcReporter` matrix test reporter.
     // @param {Runner} runner

    function IpcReporter(runner) {
        Base.call(this, runner);

        var self = this, stats = this.stats;

        runner.on('start', function () {
            Ipc.send('runner:start');
        });

        runner.on('suite', function(suite){
            Ipc.send('runner:suite', _ipcSuite(suite));
        });

        runner.on('suite end', function (suite) {
            Ipc.send('runner:suite-end', _ipcSuite(suite));
        });

        runner.on('test', function(test) {
            Ipc.send('runner:test', _ipcTest(test));
        });

        runner.on('pending', function (test) {
            Ipc.send('runner:pending', _ipcTest(test));
        });

        runner.on('pass', function (test) {
            Ipc.send('runner:pass', _ipcTest(test));
        });

        runner.on('fail', function (test, err) {
            Ipc.send('runner:fail', _ipcTest(test), _ipcErr(err));
        });

        runner.on('test end', function(test) {
            Ipc.send('runner:test-end', _ipcStats(this,stats), _ipcTest(test));
        });

        runner.on('end', function () {
            Ipc.send('runner:end');
        });
    }

    IpcReporter.prototype = Base.prototype;

    // setup mocha
    mocha.setup({
        ui: 'bdd',
    });

    mocha.reporter(IpcReporter);

    // setup chai
    chai.config.includeStack = true; // turn on stack trace
    chai.config.showDiff = true;
    chai.config.truncateThreshold = 0; // disable truncating
    window.assert = chai.assert;
    window.expect = chai.expect;
    window.sinon = require('sinon');

    var frameworkReady = false;

    // running the test cases
    function _runMocha () {
        if ( frameworkReady ) {
            // mocha.checkLeaks();
            // mocha.globals(['Editor','Polymer']);
            mocha.run();
        }
    }

    function _whenFrameworksReady(callback) {
        // console.log('whenFrameworksReady');
        var done = function() {
            frameworkReady = true;

            // console.log('whenFrameworksReady done');
            callback();
        };

        function importsReady() {
            window.removeEventListener('WebComponentsReady', importsReady);
            // console.log('WebComponentsReady');

            if (window.Polymer && Polymer.whenReady) {
                Polymer.whenReady(function() {
                    // console.log('polymer-ready');
                    done();
                });
            } else {
                done();
            }
        }

        // All our supported framework configurations depend on imports.
        if (!window.HTMLImports) {
            done();
        } else if (HTMLImports.ready) {
            importsReady();
        } else {
            window.addEventListener('WebComponentsReady', importsReady);
        }
    }

    _whenFrameworksReady(_runMocha);
})();
