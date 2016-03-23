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
  EditorR.sendRequestToCore( 'editor:load-profile', name, type, profile => {
    profile.save = function () {
      EditorR.sendToCore('editor:save-profile', name, type, profile);
    };

    if ( cb ) {
      cb (profile);
    }
  });
};

// ==========================
// Layout API
// ==========================

// ==========================
// extends
// ==========================

EditorR.registerElement = function ( obj ) {
  if ( !obj.is ) {
    let script = document.currentScript;
    let parent = script.parentElement;
    if ( parent && parent.tagName === 'DOM-MODULE' ) {
      obj.is = parent.id;
    } else {
      EditorR.error('Failed to register widget %s, the script must inside a <dom-module>.');
      return;
    }
  }

  if ( !EditorR.elements ) {
    EditorR.elements = {};
  }

  if ( EditorR.elements[obj.is] ) {
    EditorR.error('Failed to register widget %s, already exists.', obj.is );
    return;
  }

  obj._T = function ( key, option ) {
    return EditorR.T( key, option );
  };
  EditorR.elements[obj.is] = Polymer(obj);
};

EditorR.registerPanel = function ( panelID, obj ) {
  if ( !obj.is ) {
    let script = document.currentScript;
    let parent = script.parentElement;
    if ( parent && parent.tagName === 'DOM-MODULE' ) {
      obj.is = parent.id;
    } else {
      EditorR.error('Failed to register panel %s, the script must inside a <dom-module>.', panelID);
      return;
    }
  }

  if ( !EditorR.panels ) {
    EditorR.panels = {};
  }

  if ( EditorR.panels[panelID] !== undefined ) {
    EditorR.error('Failed to register panel %s, panelID has been registered.', panelID);
    return;
  }

  obj._T = function ( key, option ) {
    return EditorR.T( key, option );
  };
  EditorR.panels[panelID] = Polymer(obj);
};

// ==========================
// Ipc Events
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('editor:query-ipc-events', (event, reply) => {
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
  reply(ipcInfos);
});
