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
 * This option is used to indicate that the channel should not send to self.
 * It must be supplied as the last argument of your channel if you want.
 * @property selfExcluded
 * @type {Object}
 */
Editor.selfExcluded = {
  '__is_ipc_option__': true,
  'self-excluded': true,
};

class EditorIpc {
  /**
   * Ipc class for easily manage ipc events
   * @class Editor.Ipc
   * @constructor
   */
  constructor () {
    this.listeningIpcs = [];
  }

  /**
   * Register ipc channel and respond it with the callback function
   * @method on
   * @param {string} ipc channel name
   * @param {function} callback
   */
  on (channel, callback) {
    _ipc.on( channel, callback );
    this.listeningIpcs.push( [channel, callback] );
  }

  /**
   * Register ipc channel and respond it once with the callback function
   * @method once
   * @param {string} ipc channel name
   * @param {function} callback
   */
  once (channel, callback) {
    _ipc.once( channel, callback );
    this.listeningIpcs.push( [channel, callback] );
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

module.exports = EditorIpc;
