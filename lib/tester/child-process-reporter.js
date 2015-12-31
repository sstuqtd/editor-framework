'use strict';

const Mocha = require('mocha');
const MochaIpcData = require('./share/mocha-ipc-data');

let Base = Mocha.reporters.Dot; // TODO: may be we can let user choose reporter

function ChildProcessReporter(runner) {
  Base.call(this, runner);

  let mainStats = this.stats;

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

  runner.on('suite', function (suite) {
    process.send({
      channel: 'runner:suite',
      suite: MochaIpcData.suite(suite)
    });
  });

  runner.on('suite end', function (suite) {
    process.send({
      channel: 'runner:suite-end',
      suite: MochaIpcData.suite(suite)
    });
  });

  runner.on('test', function (test) {
    process.send({
      channel: 'runner:test',
      test: MochaIpcData.test(test)
    });
  });

  runner.on('test end', function ( test, stats ) {
    stats = stats || mainStats;

    process.send({
      channel: 'runner:test-end',
      test: MochaIpcData.test(test),
      stats: MochaIpcData.stats(stats,runner),
    });
  });

  runner.on('pending', function (test) {
    process.send({
      channel: 'runner:pending',
      test: MochaIpcData.test(test),
    });
  });

  runner.on('pass', function (test) {
    process.send({
      channel: 'runner:pass',
      test: MochaIpcData.test(test)
    });
  });

  runner.on('fail', function (test, err) {
    process.send({
      channel: 'runner:fail',
      test: MochaIpcData.test(test),
      err: MochaIpcData.err(err)
    });
  });
}
ChildProcessReporter.prototype = Base.prototype;

module.exports = ChildProcessReporter;
