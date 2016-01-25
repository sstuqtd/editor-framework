'use strict';

const Electron = require('electron');
const BrowserWindow = Electron.BrowserWindow;

const Fs = require('fire-fs');
const Url = require('fire-url');
const _ = require('lodash');

// let _workers = [];

/**
 * @module Editor
 */

/**
 * Worker class for operating worker
 * @class Worker
 * @constructor
 * @param {string} name - The worker name
 * @param {object} options
 * @param {string} options.workerType - Can be one of the list:
 *  - `renderer`: Indicate the worker is running in a hidden window
 *  - `main`: Indicate the worker is running is a process
 * @param {string} options.url - The url of renderer worker.
 */

class EditorWorker {
  constructor ( name, options ) {
    this.options = options || {};
    this.ipcListener = new Editor.Ipc();

    _.defaultsDeep(options, {
      workerType: 'renderer',
      url: '',
    });
  }

  start ( argv ) {
    if ( this.options.workerType === 'renderer' ) {
      this.nativeWin = new BrowserWindow({
        width: 0,
        height: 0,
        show: false,
      });
      this._load( this.options.url, argv );

      this.nativeWin.on('closed', () => {
        this.ipcListener.clear();
        this.dispose();
      });
    }
  }

  close () {
    if ( this.options.workerType === 'renderer' ) {
      this.nativeWin.close();
    }
  }

  on (...args) {
    if ( this.options.workerType === 'renderer' ) {
      this.ipcListener.on.apply(this.ipcListener, args);
    }
  }

  /**
   * Dereference the native window.
   */
  dispose () {
    // NOTE: Important to dereference the window object to allow for GC
    this.nativeWin = null;
  }

  _load ( editorUrl, argv ) {
    let resultUrl = Editor.url(editorUrl);
    if ( !resultUrl ) {
      Editor.error( `Failed to load page ${editorUrl} for window "${this.name}"` );
      return;
    }

    this._loaded = false;
    let argvHash = argv ? encodeURIComponent(JSON.stringify(argv)) : undefined;
    let url = resultUrl;

    // if this is an exists local file
    if ( Fs.existsSync(resultUrl) ) {
      url = Url.format({
        protocol: 'file',
        pathname: resultUrl,
        slashes: true,
        hash: argvHash
      });
      this._url = url;
      this.nativeWin.loadURL(url);

      return;
    }

    // otherwise we treat it as a normal url
    if ( argvHash ) {
      url = `${resultUrl}#${argvHash}`;
    }
    this._url = url;
    this.nativeWin.loadURL(url);
  }
}

module.exports = EditorWorker;
