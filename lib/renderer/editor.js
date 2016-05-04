'use strict';

/**
 * @module EditorR
 */
let EditorR = {};
module.exports = EditorR;

// require
const Electron = require('electron');
const Path = require('fire-path');

const Protocol = require('./protocol');
const UI = require('./ui');
const Console = require('./console');

/**
 * Require module through url path
 * @method require
 * @param {string} url
 */
EditorR.require = function ( url ) {
  return require( EditorR.url(url) );
};

// url
EditorR.url = Protocol.url;

// profile
EditorR.loadProfile = function ( name, type, cb ) {
  EditorR.Ipc.sendToMain( 'editor:load-profile', name, type, (err, profile) => {
    profile.save = function () {
      EditorR.Ipc.sendToMain('editor:save-profile', name, type, profile);
    };

    if ( cb ) {
      cb (profile);
    }
  });
};

EditorR.import = function ( url ) {
  let extname = Path.extname(url);
  if ( extname === '.js' ) {
    return UI.ResMgr.importScript(url);
  } else if ( extname === '.css' ) {
    return UI.ResMgr.importStylesheet(url);
  } else if ( extname === '.tmpl' ) {
    return UI.ResMgr.importTemplate(url);
  }

  Console.error(`Unknown resource ${url}`);
};

// ==========================
// Ipc Events
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('editor:query-ipc-events', (event) => {
  let ipcInfos = [];
  for ( let p in ipcRenderer._events ) {
    let listeners = ipcRenderer._events[p];
    let count = Array.isArray(listeners) ? listeners.length : 1;

    ipcInfos.push({
      name: p,
      level: 'page',
      count: count,
    });
  }
  event.reply(null, ipcInfos);
});
