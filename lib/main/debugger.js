'use strict';

const Console = require('./console');
const ChildProcess = require('child_process');

let _dbgProcess;
let _dbgPort = 3030;

/**
 * The `core-level` debugger utils, when you turn on the debugger,
 * it actually run a [node-inspector](https://github.com/node-inspector/node-inspector)
 * process in the low-level, and you can use your chrome browser debug the core module.
 * @module Editor.Debugger
 */
let Debugger = {
  /**
   * Toggle on or off the `core-level` debugger
   * @method toggle
   */
  toggle () {
    if ( _dbgProcess ) {
      Debugger.close();
    } else {
      Debugger.open();
    }

    return _dbgProcess !== null;
  },

  /**
   * Turn on the `core-level` debugger
   * @method open
   */
  open () {
    try {
      _dbgProcess = ChildProcess.spawn('node-inspector', ['--debug-port=' + _dbgPort], {
        stdio: 'inherit',
      });
    } catch ( err ) {
      Console.failed ( `Failed to start Main Process Debugger: ${err.message}` );
      _dbgProcess = null;

      return;
    }

    Console.info(`Visit http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=${_dbgPort} to start debugging`);

    // DISABLE FIXME: not work in this way
    // const Electron = require('electron');
    // let debuggerWin = new Electron.BrowserWindow({
    //   webPreferences: {
    //     nodeIntegration: false,
    //   }
    // });
    // let url = `http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=${_dbgPort}`;
    // debuggerWin.loadURL(url);
    // debuggerWin.on ( 'closed', function () {
    //   _dbgProcess.kill();
    //   Console.info('debugger process closed');
    // });
  },

  /**
   * Turn off the `core-level` debugger
   * @method close
   */
  close () {
    if ( !_dbgProcess ) {
      return;
    }

    _dbgProcess.kill();
    _dbgProcess = null;

    Console.info('Main Process Debugger closed');
  },

  get debugPort () { return _dbgPort; },
  set debugPort ( value ) { _dbgPort = value; },
};

module.exports = Debugger;
