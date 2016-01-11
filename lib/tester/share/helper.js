'use strict';

const Electron = require('electron');
const Sinon = require('sinon');

let _ipc = null;
if ( Editor.isCoreLevel ) {
  _ipc = Electron.ipcMain;
} else {
  _ipc = Electron.ipcRenderer;
}

let TestHelper = {
  _reply (...args) {
    args = [].slice.call( args, 0, args.length-1 );
    let callback = args[args.length-1];

    for ( let i = 0; i < this._spyReplys.length; ++i ) {
      let info = this._spyReplys[i];
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
    this._spyWithArgs = {};
    this._spyReplys = [];

    // cache special
    if ( Editor.isPageLevel ) {
      this._sendRequestToCore = Editor.sendRequestToCore;
      Editor.sendRequestToCore = (...args) => {
        if ( this._reply.apply(this, args) ) {
          return;
        }

        this._sendRequestToCore.apply( Editor, args );
      };
      this.sendRequestToCore = Sinon.spy(Editor, 'sendRequestToCore');
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
      this[`_${name}`] = Editor[name];
      Editor[name] = function () {};

      // spy ipc method
      this[name] = Sinon.spy(Editor, name);
    });
  },

  _unspy () {
    // reset all spy with args
    this._spyWithArgs = null;
    this._spyReplys = null;

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
      this[name].restore();

      // restore ipc method
      Editor[name] = this[`_${name}`];
      this[`_${name}`] = null;
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

  /**
   * run helper in the before phase
   * @param {opts} Object - options for Editor.init
   * @param {opts.enableIpc} Boolean - enable ipc or spy it
   */
  run ( opts ) {
    let helper = this;

    before(function () {
      Editor.init(opts);
      if ( !opts.enableIpc ) {
        helper._spy();
      }
    });

    after(function () {
      if ( !opts.enableIpc ) {
        helper._unspy();
      }
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
      if ( this[name].reset ) {
        this[name].reset();
      }
    });

    // reset all spy with args
    this._spyWithArgs = {};
    this._spyReplys = [];
  },

  /**
   * get spy channel
   * @param {string} method - method name: e.g. 'sendToCore', 'sendToWindows', ...
   * @param {string} channel
   */
  channel ( method, channel ) {
    let spy = this._spyWithArgs[method];
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
    if ( !this._spyWithArgs ) {
      throw new Error('Do not spy channel before Helper.spy invoked');
    }

    let spyMethod = this[method];
    if ( !spyMethod ) {
      return;
    }

    let results = [];
    let spy = this._spyWithArgs[method] || {};
    channels.forEach(name => {
      let spyCall = spyMethod.withArgs(name);
      spy[name] = spyCall;
      results.push(spyCall);
    });
    this._spyWithArgs[method] = spy;

    return results;
  },

  reply (...args) {
    if ( !this._spyReplys ) {
      throw new Error('Do not register your reply before Helper.spy invoked');
    }

    if ( !args.length ) {
      Editor.error( 'You must specific your spy arguments' );
      return;
    }

    if ( !Array.isArray(args[args.length-1]) ) {
      Editor.error( 'The last argument must be an array' );
      return;
    }

    args = [].slice.call( args, 0, args.length-1 );
    this._spyReplys.push({
      args: args,
      replyArgs: args[args.length-1],
    });
  },

  send (channel, ...args) {
    // insert a dummy event in it.
    args = [channel, {}, ...args];

    _ipc.emit.apply( _ipc, args );
  },
};

// initialize client-side tester
module.exports = TestHelper;
