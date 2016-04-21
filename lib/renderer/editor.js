'use strict';

/**
 * @module EditorR
 */
let EditorR = {};
module.exports = EditorR;

// require
const Electron = require('electron');

const Protocol = require('./protocol');

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
