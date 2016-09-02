'use strict';

/**
 * @module Panel
 */
let Panel = {};
module.exports = Panel;

// requires
const Electron = require('electron');
const Path = require('fire-path');

const UI = require('./ui');
const Console = require('./console');
const Ipc = require('./ipc');
const IpcBase = require('../share/ipc');

let _id2panelFrame = {};
// let _url2link = {};
let _outOfDatePanels = [];

let ErrorNoPanel = IpcBase.ErrorNoPanel;
let ErrorNoMsg = IpcBase.ErrorNoMsg;

// ==========================
// exports
// ==========================

/**
 * @method open
 * @param {string} panelID - The panelID
 * @param {object} argv
 *
 * Open a panel via `panelID`
 */
Panel.open = function ( panelID, argv ) {
  Ipc.sendToMain('editor:panel-open', panelID, argv);
};

/**
 * @method popup
 * @param {string} panelID - The panelID
 *
 * Popup an exists panel via `panelID`
 */
Panel.popup = function ( panelID ) {
  Ipc.sendToMain('editor:panel-popup', panelID);
};

/**
 * @method close
 * @param {string} panelID - The panelID
 *
 * Close a panel via `panelID`
 */
Panel.close = function ( panelID, cb ) {
  if ( cb ) {
    Ipc.sendToMain('editor:panel-close', panelID, cb, -1);
  } else {
    Ipc.sendToMain('editor:panel-close', panelID);
  }
};

/**
 * @method dock
 * @param {string} panelID
 *
 * Remove a panel element from document but do not close it.
 */
Panel.dock = function (panelID, frameEL) {
  Ipc.sendToMain('editor:panel-dock', panelID);
  _id2panelFrame[panelID] = frameEL;
};

/**
 * @method newFrame
 * @param {string} panelID - The panelID
 * @param {function} cb
 *
 * Create a simple panel frame via `panelID`
 */
Panel.newFrame = function ( panelID, cb ) {
  Ipc.sendToMain('editor:panel-query-info', panelID, ( err, info ) => {
    if ( err ) {
      cb (err);
      return;
    }

    // DELME: this is for the polymer fallback
    if ( info.ui === 'polymer' ) {
      UI.PolymerUtils.newFrame(panelID, info, cb);
      return;
    }

    // create a simple panel frame
    let frameEL = document.createElement('ui-panel-frame');
    frameEL._info = info;

    // set panel ID
    frameEL.setAttribute('id', panelID);

    // set icon for tab title
    if ( info.icon ) {
      frameEL.icon = new Image();
      frameEL.icon.src = Path.join( info.path, info.icon );
    }

    cb (null, frameEL);
  });
};

/**
 * @method find
 * @param {string} panelID - The panelID
 *
 * Find panel frame via `panelID`.
 */
Panel.find = function ( panelID ) {
  let frameEL = _id2panelFrame[panelID];
  if ( !frameEL ) {
    return null;
  }
  return frameEL;
};

/**
 * @method focus
 * @param {string} panelID - The panelID
 *
 * Focus panel via `panelID`.
 */
Panel.focus = function ( panelID ) {
  let frameEL = Panel.find(panelID);
  if ( frameEL ) {
    let panelEL = frameEL.parentNode;
    if ( UI.DockUtils.isPanel(panelEL) ) {
      panelEL.select(frameEL);
    }
  }
};

/**
 * @method getFocusedPanel
 *
 * Get current focused panel
 */
Panel.getFocusedPanel = function () {
  for ( let id in _id2panelFrame ) {
    let frameEL = _id2panelFrame[id];
    let panelEL = frameEL.parentNode;

    if ( panelEL.focused ) {
      return panelEL.activeTab.frameEL;
    }
  }

  return null;
};

/**
 * @method isDirty
 * @param {string} panelID - The panelID
 *
 * Check if the specific panel is dirty
 */
Panel.isDirty = function ( panelID ) {
  return _outOfDatePanels.indexOf(panelID) !== -1;
};

/**
 * @method extend
 * @param {object} prototype
 *
 * Extends a panel
 */
Panel.extend = function (proto) {
  return proto;
};

// TODO
// // position: top, bottom, left, right, top-left, top-right, bottom-left, bottom-right
// Panel.dockAt = function ( position, panelEL ) {
//   let root = UI.DockUtils.root;
//   if ( !root ) {
//     return null;
//   }
//   if ( !root._dockable ) {
//     return null;
//   }
// };

/**
 * @property panels
 *
 * Get panels docked in current window
 */
Object.defineProperty(Panel, 'panels', {
  enumerable: true,
  get () {
    let results = [];

    for ( let id in _id2panelFrame ) {
      let frameEL = _id2panelFrame[id];
      results.push(frameEL);
    }

    return results;
  },
});

// Panel._dispatch
Panel._dispatch = function (panelID, message, event, ...args) {
  let frameEL = _id2panelFrame[panelID];
  if ( !frameEL ) {
    Console.warn(`Failed to send ipc message ${message} to panel ${panelID}, panel not found`);

    if ( event.reply ) {
      event.reply( new ErrorNoPanel(panelID, message) );
    }

    return;
  }

  let fn = frameEL.messages[message];
  if ( !fn || typeof fn !== 'function' ) {
    Console.warn(`Failed to send ipc message ${message} to panel ${panelID}, message not found`);

    if ( event.reply ) {
      event.reply( new ErrorNoMsg(panelID, message) );
    }

    return;
  }

  fn.apply( frameEL, [event, ...args] );
};

// Panel._unloadAll
Panel._unloadAll = function ( cb ) {
  // check if we can close all panel frame, if one of the panel frame refuse close, stop the callback
  for ( let id in _id2panelFrame ) {
    let frameEL = _id2panelFrame[id];
    if ( frameEL && frameEL.close && frameEL.close() === false ) {
      if ( cb ) {
        cb ( new Error(`Failed to close panel ${id}`) );
      }
      return;
    }
  }

  // if we have root, clear all children in it
  UI.clear(UI.DockUtils.root);

  // unload panel frames
  for ( let id in _id2panelFrame ) {
    _unloadPanelFrame(id);
  }

  // remove all panels in main-process
  Ipc.sendToMain('editor:window-remove-all-panels', () => {
    if ( cb ) {
      cb ();
    }
  }, -1);
};

// ==========================
// Internal
// ==========================

// _unloadPanelFrame
function _unloadPanelFrame ( panelID ) {
  // remove panelFrame
  let frameEL = _id2panelFrame[panelID];
  if ( !frameEL) {
    return;
  }

  if ( frameEL._ipcListener ) {
    frameEL._ipcListener.clear();
  }

  if ( frameEL._mousetrapList ) {
    frameEL._mousetrapList.forEach(mousetrap => {
      mousetrap.reset();
    });
  }

  delete _id2panelFrame[panelID];
}

// ==========================
// Ipc events
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('editor:panel-run', (event, panelID, argv) => {
  Panel.focus(panelID);

  let frameEL = Panel.find(panelID);
  if ( frameEL && frameEL.run ) {
    frameEL.run(argv);
  }
});

ipcRenderer.on('editor:panel-unload', (event, panelID) => {
  // remove panel element from tab
  let frameEL = Panel.find(panelID);
  if ( !frameEL ) {
    // unload panelInfo
    _unloadPanelFrame(panelID);

    event.reply(new Error(`Can not find panel ${panelID} in renderer process.`));
    return;
  }

  // user prevent close it
  if ( frameEL.close && frameEL.close() === false ) {
    event.reply(null, false);
    return;
  }

  //
  let panelEL = frameEL.parentNode;
  if ( UI.DockUtils.isPanel(panelEL) ) {
    let currentTabEL = panelEL.$.tabs.findTab(frameEL);
    panelEL.close(currentTabEL);
  } else {
    panelEL.removeChild(frameEL);
  }

  //
  UI.DockUtils.flush();
  UI.DockUtils.saveLayout();

  // unload panelFrame
  _unloadPanelFrame(panelID);

  event.reply(null, true);
});

ipcRenderer.on('editor:panel-out-of-date', (event, panelID) => {
  let frameEL = Panel.find(panelID);
  if ( frameEL ) {
    let panelEL = frameEL.parentNode;
    if ( UI.DockUtils.isPanel(panelEL) ) {
      panelEL.outOfDate(frameEL);
    }
  }

  if ( _outOfDatePanels.indexOf(panelID) === -1 ) {
    _outOfDatePanels.push(panelID);
  }
});
