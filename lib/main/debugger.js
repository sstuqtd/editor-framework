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
  toggle ( menuPath ) {
    if ( _dbgProcess ) {
      Debugger.close(menuPath);
    } else {
      Debugger.open(menuPath);
    }
  },

  /**
   * Turn on the `core-level` debugger
   * @method open
   */
  open (menuPath) {
    try {
      _dbgProcess = Spawn('node-inspector', ['--debug-port=' + Editor.debugPort], {stdio: 'inherit'});
    } catch ( err ) {
      Editor.failed ( 'Failed to start Core Debugger: %s', err.message );
      return;
    }

    if ( menuPath ) {
      Editor.MainMenu.set(menuPath, {
        checked: true
      });
    }

    Editor.info('Visit http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=%s to start debugging', Editor.debugPort);

    // DISABLE FIXME: not work in this way
    // var debuggerWin = new BrowserWindow({
    //     'web-preferences': {
    //         'experimental-features': true,
    //         'experimental-canvas-features': true,
    //     }
    // });
    // var url = 'http://127.0.0.1:8080/debug?ws=127.0.0.1:8080&port=4040';
    // debuggerWin.loadURL(url);
    // debuggerWin.on ( 'closed', function () {
    //     _dbgProcess.kill();
    //     Editor.info('debugger process closed');
    // });
  },

  /**
   * Turn off the `core-level` debugger
   * @method close
   */
  close (menuPath) {
    if ( !_dbgProcess ) {
      return;
    }

    _dbgProcess.kill();
    _dbgProcess = null;

    if ( menuPath ) {
      Editor.MainMenu.set(menuPath, {
        checked: false
      });
    }

    Editor.info('Core Debugger closed');
  },
};

module.exports = Debugger;
