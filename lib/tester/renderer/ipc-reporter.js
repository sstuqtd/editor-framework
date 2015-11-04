'use strict';

const Ipc = require('ipc');
const Mocha = require('mocha');

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
    uncaught: err.uncaught,
    showDiff: err.showDiff,
    actual: err.actual,
    expected: err.expected,
  };
}

function _ipcTest ( test ) {
  return {
    type: test.type,
    title: test.title,
    state: test.state,
    speed: test.speed,
    duration: test.duration,
    pending: test.pending,
    fn: test.fn ? test.fn.toString() : '',
    err: _ipcErr(test.err),
    _fullTitle: test.fullTitle(),
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

function IpcReporter (runner) {
  Base.call(this, runner);

  let stats = this.stats;

  runner.on('start', () => {
    Ipc.send('runner:start');
  });

  runner.on('suite', suite => {
    Ipc.send('runner:suite', _ipcSuite(suite));
  });

  runner.on('suite end', suite => {
    Ipc.send('runner:suite-end', _ipcSuite(suite));
  });

  runner.on('test', test => {
    Ipc.send('runner:test', _ipcTest(test));
  });

  runner.on('pending', test => {
    Ipc.send('runner:pending', _ipcTest(test));
  });

  runner.on('pass', test => {
    Ipc.send('runner:pass', _ipcTest(test));
  });

  runner.on('fail', (test, err) => {
    Ipc.send('runner:fail', _ipcTest(test), _ipcErr(err));
  });

  runner.on('test end', test => {
    Ipc.send('runner:test-end', _ipcStats(this,stats), _ipcTest(test));
  });

  runner.on('end', () => {
    Ipc.send('runner:end');
  });
}

IpcReporter.prototype = Base.prototype;

module.exports = IpcReporter;
