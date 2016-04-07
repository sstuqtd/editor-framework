'use strict';

(() => {
  //
  const Electron = require('electron');
  const Mocha = require('mocha');
  const Chai = require('chai');
  const Sinon = require('sinon');

  const Helper = require('./helper');
  const IpcReporter = require('./ipc-reporter');

  Chai.config.includeStack = true; // turn on stack trace
  Chai.config.showDiff = true;
  Chai.config.truncateThreshold = 0; // disable truncating

  Helper.detail = Editor.argv.detail;

  window.sinon = Sinon;
  window.assert = Chai.assert;
  window.expect = Chai.expect;
  window.Helper = Helper;

  window.addEventListener('resize', () => {
    if ( window.Helper.targetEL ) {
      window.Helper.targetEL.dispatchEvent( new window.CustomEvent('resize') );
    }
  });

  let mocha = new Mocha({
    ui: 'bdd',
  });
  mocha.reporter(IpcReporter);
  mocha.files = Editor.argv.files;

  // running the test cases
  _whenFrameworksReady(_runMocha);

  function _runMocha () {
    // mocha.checkLeaks();
    // mocha.globals(['Editor','Polymer']);
    mocha.run((failures) => {
      Electron.ipcRenderer.send('mocha-done', failures);
    });
  }

  function _whenFrameworksReady(cb) {
    function importsReady() {
      window.removeEventListener('WebComponentsReady', importsReady);
      if ( window.Polymer && Polymer.whenReady ) {
        Polymer.whenReady(cb);
        return;
      }

      cb();
    }

    // All our supported framework configurations depend on imports.
    if ( !window.HTMLImports ) {
      cb();
    } else if ( window.HTMLImports.ready ) {
      importsReady();
    } else {
      window.addEventListener('WebComponentsReady', importsReady);
    }
  }
})();
