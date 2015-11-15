'use strict';

const Sinon = require('sinon');
const Ipc = require('ipc');

let TestHelper = {
  _reply () {
    let args = [].slice.call( arguments, 0, arguments.length-1 );
    let callback = arguments[arguments.length-1];

    for ( let i = 0; i < TestHelper._spyReplys.length; ++i ) {
      let info = TestHelper._spyReplys[i];
      if ( args.length !== info.args.length ) {
        continue;
      }

      let matched = true;
      for ( let j = 0; j < info.args.length; ++j ) {
        if ( args[j] !== info.args[j] ) {
          matched = false;
          break;
        }
      }

      if ( matched ) {
        callback.apply(null, info.replyArgs);
        return true;
      }
    }

    return false;
  },

  _spy () {
    // init spies
    TestHelper._spyWithArgs = {};
    TestHelper._spyReplys = [];

    // cache special
    if ( Editor.isPageLevel ) {
      TestHelper._sendRequestToCore = Editor.sendRequestToCore;
      Editor.sendRequestToCore = function () {
        if ( TestHelper._reply.apply(Editor, arguments) ) {
          return;
        }

        TestHelper._sendRequestToCore.apply( Editor, arguments );
      };
      TestHelper.sendRequestToCore = Sinon.spy(Editor, 'sendRequestToCore');
    }

    // cache general
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
  },

  _unspy () {
    // reset all spy with args
    TestHelper._spyWithArgs = null;
    TestHelper._spyReplys = null;

    //
    let methods = [
      'sendToCore',
      'sendToWindows',
      'sendToPanel',
      'sendToMainWindow',
      'sendToAll',
    ];
    if ( Editor.isPageLevel ) {
      methods.push('sendRequestToCore');
    }

    methods.forEach(name => {
      // restore spy
      TestHelper[name].restore();

      // restore ipc method
      Editor[name] = TestHelper[`_${name}`];
      TestHelper[`_${name}`] = null;
    });
  },

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
      TestHelper._spy();
    });

    after(function () {
      TestHelper._unspy();
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

    // reset all spy with args
    TestHelper._spyWithArgs = {};
    TestHelper._spyReplys = [];
  },

  /**
   * get spy channel
   * @param {string} method - method name: e.g. 'sendToCore', 'sendToWindows', ...
   * @param {string} channel
   */
  channel ( method, channel ) {
    let spy = TestHelper._spyWithArgs[method];
    if ( spy ) {
      return spy[channel];
    }

    return null;
  },

  /**
   * spy channels
   * @param {string} method - method name: e.g. 'sendToCore', 'sendToWindows', ...
   * @param {array} channels
   */
  spyChannels ( method, channels ) {
    if ( !TestHelper._spyWithArgs ) {
      throw new Error('Do not spy channel before Helper.spy invoked');
    }

    let spyMethod = TestHelper[method];
    if ( !spyMethod ) {
      return;
    }

    let results = [];
    let spy = TestHelper._spyWithArgs[method] || {};
    channels.forEach(name => {
      let spyCall = spyMethod.withArgs(name);
      spy[name] = spyCall;
      results.push(spyCall);
    });
    TestHelper._spyWithArgs[method] = spy;

    return results;
  },

  reply () {
    if ( !TestHelper._spyReplys ) {
      throw new Error('Do not register your reply before Helper.spy invoked');
    }

    if ( !arguments.length ) {
      Editor.error( 'You must specific your spy arguments' );
      return;
    }

    if ( !Array.isArray(arguments[arguments.length-1]) ) {
      Editor.error( 'The last argument must be an array' );
      return;
    }

    let args = [].slice.call( arguments, 0, arguments.length-1 );
    TestHelper._spyReplys.push({
      args: args,
      replyArgs: arguments[arguments.length-1],
    });
  },

  recv () {
    Ipc.emit.apply( Ipc, arguments );
  },
};

// initialize client-side tester
module.exports = TestHelper;
