'use strict';

const Electron = require('electron');
const ipcRenderer = Electron.ipcRenderer;

const Mocha = require('mocha');
const MochaIpcData = require('../share/mocha-ipc-data');

let Base = Mocha.reporters.Base;

// Initialize a new `IpcReporter` matrix test reporter.
// @param {Runner} runner

function IpcReporter (runner) {
  Base.call(this, runner);

  let stats = this.stats;

  runner.on('start', () => {
    ipcRenderer.send('runner:start');
  });

  runner.on('suite', suite => {
    ipcRenderer.send('runner:suite', MochaIpcData.suite(suite));
  });

  runner.on('suite end', suite => {
    ipcRenderer.send('runner:suite-end', MochaIpcData.suite(suite));
  });

  runner.on('test', test => {
    ipcRenderer.send('runner:test', MochaIpcData.test(test));
  });

  runner.on('pending', test => {
    ipcRenderer.send('runner:pending', MochaIpcData.test(test));
  });

  runner.on('pass', test => {
    ipcRenderer.send('runner:pass', MochaIpcData.test(test));
  });

  runner.on('fail', (test, err) => {
    ipcRenderer.send('runner:fail', MochaIpcData.test(test), MochaIpcData.err(err));
  });

  runner.on('test end', test => {
    ipcRenderer.send('runner:test-end', MochaIpcData.test(test), MochaIpcData.stats(stats,runner));
  });

  runner.on('end', () => {
    ipcRenderer.send('runner:end');
  });
}

IpcReporter.prototype = Base.prototype;

module.exports = IpcReporter;
