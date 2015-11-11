'use strict';

let MochaIpcData = {
  suite ( suite ) {
    if ( suite.__ipc__ ) {
      return suite;
    }

    return {
      __ipc__: true,
      root: suite.root,
      title: suite.title,
      fullTitle: suite.fullTitle(),
    };
  },

  err ( err ) {
    if ( !err ) {
      return null;
    }

    if ( err.__ipc__ ) {
      return err;
    }

    return {
      __ipc__: true,
      stack: err.stack || err.toString(),
      message: err.message,
      line: err.line,
      sourceURL: err.sourceURL,
      uncaught: err.uncaught,
      showDiff: err.showDiff,
      actual: err.actual,
      expected: err.expected,
    };
  },

  test ( test ) {
    if ( test.__ipc__ ) {
      return test;
    }

    return {
      __ipc__: true,
      type: test.type,
      title: test.title,
      fullTitle: test.fullTitle(),
      state: test.state,
      speed: test.speed,
      duration: test.duration,
      pending: test.pending,
      fn: test.fn ? test.fn.toString() : '',
      err: MochaIpcData.err(test.err),
      _fullTitle: test.fullTitle(),
    };
  },

  stats ( stats, runner ) {
    if ( stats.__ipc__ ) {
      return stats;
    }

    return {
      __ipc__: true,
      passes: stats.passes,
      failures: stats.failures,
      duration: new Date() - stats.start,
      progress: stats.tests / runner.total * 100 | 0,
    };
  },
};

module.exports = MochaIpcData;
