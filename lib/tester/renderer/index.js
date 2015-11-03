(() => {
  'use strict';

  //
  const Ipc = require('ipc');
  const Mocha = require('mocha');
  const Chai = require('chai');

  window.sinon = require('sinon');
  Chai.config.includeStack = true; // turn on stack trace
  Chai.config.showDiff = true;
  Chai.config.truncateThreshold = 0; // disable truncating
  window.assert = Chai.assert;
  window.expect = Chai.expect;

  const IpcReporter = require('./ipc-reporter');

  let mocha = new Mocha({
    ui: 'bdd',
  });
  mocha.reporter(IpcReporter);
  mocha.addFile(Editor.argv.test);

  let frameworkReady = false;

  // running the test cases
  function _runMocha () {
    if ( frameworkReady ) {
      // mocha.checkLeaks();
      // mocha.globals(['Editor','Polymer']);
      mocha.run((failures) => {
        Ipc.send('mocha-done', failures);
      });
    }
  }

  function _whenFrameworksReady(callback) {
    // console.log('whenFrameworksReady');
    let done = function () {
      frameworkReady = true;
      // console.log('whenFrameworksReady done');
      callback();
    };

    function importsReady() {
      window.removeEventListener('WebComponentsReady', importsReady);
      // console.log('WebComponentsReady');

      if ( window.Polymer && Polymer.whenReady ) {
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
    } else if (window.HTMLImports.ready) {
      importsReady();
    } else {
      window.addEventListener('WebComponentsReady', importsReady);
    }
  }

  _whenFrameworksReady(_runMocha);
})();
