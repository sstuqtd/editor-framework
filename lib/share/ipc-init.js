'use strict';

const Electron = require('electron');

let _ipc = null;
if ( Editor.isCoreLevel ) {
  _ipc = Electron.ipcMain;
} else {
  _ipc = Electron.ipcRenderer;
}

/**
 * @module Editor
 */

/**
 * This option is used to indicate that the message should not send to self.
 * It must be supplied as the last argument of your message if you want.
 * @property selfExcluded
 * @type {Object}
 */
Editor.selfExcluded = {
  '__is_ipc_option__': true,
  'self-excluded': true,
};

class IpcListener {
  /**
   * IpcListener for easily manage ipc events
   * @class IpcListener
   * @constructor
   */
  constructor () {
    this.listeningIpcs = [];
  }

  /**
   * Register ipc message and respond it with the callback function
   * @method on
   * @param {string} ipc message name
   * @param {function} callback
   */
  on (message, callback) {
    _ipc.on( message, callback );
    this.listeningIpcs.push( [message, callback] );
  }

  /**
   * Register ipc message and respond it once with the callback function
   * @method once
   * @param {string} ipc message name
   * @param {function} callback
   */
  once (message, callback) {
    _ipc.once( message, callback );
    this.listeningIpcs.push( [message, callback] );
  }

  /**
   * Clear all registered ipc messages in this ipc listener
   * @method clear
   */
  clear () {
    for (let i = 0; i < this.listeningIpcs.length; i++) {
      let pair = this.listeningIpcs[i];
      _ipc.removeListener( pair[0], pair[1] );
    }
    this.listeningIpcs.length = 0;
  }
}

Editor.IpcListener = IpcListener;
