'use strict';

const Sinon = require('sinon');

let TestHelper = {

  // https://github.com/mochajs/mocha/wiki/Detecting-global-leaks
  detectLeak ( name_of_leaking_property ) {
    Object.defineProperty(global, name_of_leaking_property, {
      set : () => {
        let err = new Error('Global leak happends here!!');
        console.log(err.stack);
        throw err;
      }
    });
  },

  run ( opts ) {
    before(function () {
      Editor.init(opts);

      [
        'sendToCore',
        'sendToWindows',
        'sendToPanel',
        'sendToMainWindow',
        'sendToAll',
      ].forEach( name => {
        // cache ipc method, and fake them
        TestHelper[`_${name}`] = Editor[name];
        Editor[name] = function () {};

        // spy ipc method
        TestHelper[name] = Sinon.spy(Editor, name);
      });
    });

    after(function () {
      Editor.reset();

      [
        'sendToCore',
        'sendToWindows',
        'sendToPanel',
        'sendToMainWindow',
        'sendToAll',
      ].forEach( name => {
        // restore spy
        TestHelper[name].restore();

        // restore ipc method
        Editor[name] = TestHelper[`_${name}`];
        TestHelper[`_${name}`] = null;
      });
    });
  },

  reset () {
    [
      'sendToCore',
      'sendToWindows',
      'sendToPanel',
      'sendToMainWindow',
      'sendToAll',
    ].forEach( name => {
      TestHelper[name].reset();
    });
  },
};

// initialize client-side tester
module.exports = TestHelper;
