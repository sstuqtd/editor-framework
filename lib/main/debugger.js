'use strict';

const Spawn = require('child_process').spawn;

let _dbgProcess;

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
      _dbgProcess = Spawn('node-inspector', ['--debug-port=' + Editor.debugPort], {
        stdio: 'inherit',
      });
    } catch ( err ) {
      Editor.failed ( 'Failed to start Core Debugger: %s', err.message );
      _dbgProcess = null;

      return;
    }

    Editor.info(`Visit http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=${Editor.debugPort} to start debugging`);

    // DISABLE FIXME: not work in this way
    // const Electron = require('electron');
    // let debuggerWin = new Electron.BrowserWindow({
    //   webPreferences: {
    //     nodeIntegration: false,
    //   }
    // });
    // let url = `http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=${Editor.debugPort}`;
    // debuggerWin.loadURL(url);
    // debuggerWin.on ( 'closed', function () {
    //   _dbgProcess.kill();
    //   Editor.info('debugger process closed');
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

    Editor.info('Core Debugger closed');
  },
};

module.exports = Debugger;
