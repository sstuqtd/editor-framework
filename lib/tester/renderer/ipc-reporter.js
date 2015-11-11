'use strict';

const Ipc = require('ipc');
const Mocha = require('mocha');
const MochaIpcData = require('../share/mocha-ipc-data');

let Base = Mocha.reporters.Base;

// Initialize a new `IpcReporter` matrix test reporter.
// @param {Runner} runner

function IpcReporter (runner) {
  Base.call(this, runner);

  let stats = this.stats;

  runner.on('start', () => {
    Ipc.send('runner:start');
  });

  runner.on('suite', suite => {
    Ipc.send('runner:suite', MochaIpcData.suite(suite));
  });

  runner.on('suite end', suite => {
    Ipc.send('runner:suite-end', MochaIpcData.suite(suite));
  });

  runner.on('test', test => {
    Ipc.send('runner:test', MochaIpcData.test(test));
  });

  runner.on('pending', test => {
    Ipc.send('runner:pending', MochaIpcData.test(test));
  });

  runner.on('pass', test => {
    Ipc.send('runner:pass', MochaIpcData.test(test));
  });

  runner.on('fail', (test, err) => {
    Ipc.send('runner:fail', MochaIpcData.test(test), MochaIpcData.err(err));
  });

  runner.on('test end', test => {
    Ipc.send('runner:test-end', MochaIpcData.test(test), MochaIpcData.stats(stats,runner));
  });

  runner.on('end', () => {
    Ipc.send('runner:end');
  });
}

IpcReporter.prototype = Base.prototype;

module.exports = IpcReporter;
