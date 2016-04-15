'use strict';

/**
 * @module Panel
 */
let Panel = {};
module.exports = Panel;

// requires
const Electron = require('electron');
const Mousetrap = require('mousetrap');

const UI = require('./ui');
const Console = require('./console');
const Ipc = require('./ipc');
const i18n = require('./i18n');
const IpcListener = require('../share/ipc-listener');
const IpcBase = require('../share/ipc');

let _id2panelInfo = {};
// let _url2link = {};
let _outOfDatePanels = [];

let ErrorNoPanel = IpcBase.ErrorNoPanel;
let ErrorNoMsg = IpcBase.ErrorNoMsg;

// ==========================
// exports
// ==========================

Panel.load = function ( panelID, cb ) {
  Ipc.sendToMain('editor:panel-query-info', panelID, ( err, info ) => {
    if ( !info ) {
      Console.error(`Panel ${panelID} import faield. info not found`);
      if ( cb ) {
        cb ( new Error('Panel info not found') );
      }

      return;
    }

    const Path = require('fire-path');
    let framePath = Path.join( info.path, info.frame );

    UI.PolymerUtils.import( framePath, ( err ) => {
      if ( err ) {
        Console.error(`Failed to import ${framePath}. message: ${err.message}`);
        if ( cb ) {
          cb ( new Error('Panel import failed.') );
        }

        return;
      }

      let frameCtor = UI.PolymerUtils.panels[panelID];
      if ( !frameCtor ) {
        Console.error(`Can not find constructor for panelID ${panelID}`);
        if ( cb ) {
          cb ( new Error( panelID + '\'s constructor not found' ) );
        }

        return;
      }

      Ipc.sendToMain('editor:panel-dock', panelID);

      let frameEL = new frameCtor();
      if ( info.icon ) {
        frameEL.icon = new Image();
        frameEL.icon.src = Path.join( info.path, info.icon );
      }
      frameEL.setAttribute('id', panelID);
      frameEL.setAttribute('name', i18n.format(info.title));
      frameEL.classList.add('fit');
      frameEL.tabIndex = 1;

      // set size attribute
      if ( info.width ) {
        frameEL.setAttribute( 'width', info.width );
      }

      if ( info.height ) {
        frameEL.setAttribute( 'height', info.height );
      }

      if ( info['min-width'] ) {
        frameEL.setAttribute( 'min-width', info['min-width'] );
      }

      if ( info['min-height'] ) {
        frameEL.setAttribute( 'min-height', info['min-height'] );
      }

      if ( info['max-width'] ) {
        frameEL.setAttribute( 'max-width', info['max-width'] );
      }

      if ( info['max-height'] ) {
        frameEL.setAttribute( 'max-height', info['max-height'] );
      }

      // register ipc events
      let ipcListener = new IpcListener();

      // always have editor:panel-run message
      if ( info.messages.indexOf('editor:panel-run') === -1 ) {
        info.messages.push('editor:panel-run');
      }

      for ( let i = 0; i < info.messages.length; ++i ) {
        _registerIpc( panelID, frameEL, ipcListener, info.messages[i] );
      }

      // register profiles
      frameEL.profiles = info.profiles;
      for ( let type in info.profiles ) {
        _registerProfile ( panelID, type, info.profiles[type] );
      }

      // register shortcuts
      // TODO: load overwrited shortcuts from profile?
      let mousetrapList = [];
      if ( info.shortcuts ) {
        let mousetrap = new Mousetrap(frameEL);
        mousetrapList.push(mousetrap);

        for ( let name in info.shortcuts ) {
          if ( name.length > 1 && name[0] === '#' ) {
            let subElement = frameEL.querySelector(name);

            if ( !subElement ) {
              Console.warn(`Failed to register shortcut for element ${name}, can not find it.`);
              continue;
            }

            let subShortcuts = info.shortcuts[name];
            let subMousetrap = new Mousetrap(subElement);
            mousetrapList.push(subMousetrap);

            for ( let subShortcut in subShortcuts ) {
              _registerShortcut(
                panelID,
                subMousetrap,
                frameEL, // NOTE: here must be frameEL
                subShortcut,
                subShortcuts[subShortcut]
              );
            }
          } else {
            _registerShortcut(
              panelID,
              mousetrap,
              frameEL,
              name,
              info.shortcuts[name]
            );
          }
        }
      }

      //
      _id2panelInfo[panelID] = {
        frameEL: frameEL,
        messages: info.messages,
        popable: info.popable,
        ipcListener: ipcListener,
        mousetrapList: mousetrapList,
      };

      // run panel-ready if exists
      let panelReady = frameEL['panel-ready'];
      if ( panelReady && typeof panelReady === 'function' ) {
        panelReady.apply(frameEL);
      }

      // done
      if ( cb ) {
        cb ( null, frameEL, info );
      }
    });
  });
};

Panel.unload = function ( panelID ) {
  // remove panelInfo
  let panelInfo = _id2panelInfo[panelID];
  if ( !panelInfo) {
    return;
  }

  panelInfo.ipcListener.clear();
  for ( let i = 0; i < panelInfo.mousetrapList.length; ++i ) {
    panelInfo.mousetrapList[i].reset();
  }
  delete _id2panelInfo[panelID];
};

Panel.open = function ( panelID, argv ) {
  Ipc.sendToMain('editor:panel-open', panelID, argv);
};

Panel.popup = function ( panelID ) {
  let panelCounts = Object.keys(_id2panelInfo).length;

  if ( panelCounts > 1 ) {
    Panel.close(panelID);
    Ipc.sendToMain('editor:panel-open', panelID);
  }
};

Panel.close = function ( panelID ) {
  Panel.undock(panelID);
  Ipc.sendToMain('editor:panel-close', panelID);
};

Panel.closeAll = function ( cb ) {
  // if we have root, clear all children in it
  let rootEL = UI.DockUtils.root;
  if ( rootEL ) {
    rootEL.remove();
    UI.DockUtils.root = null;
  }

  let panelIDs = [];
  for ( let id in _id2panelInfo ) {
    // unload panelInfo
    Panel.unload(id);
    panelIDs.push(id);
  }

  if ( panelIDs.length === 0 ) {
    if ( cb ) {
      cb();
    }
    return;
  }

  let finishCount = panelIDs.length;
  for ( let i = 0; i < panelIDs.length; ++i ) {
    Ipc.sendToMain('editor:panel-wait-for-close', panelIDs[i], () => {
      --finishCount;
      if ( finishCount === 0 && cb ) {
        cb();
      }
    });
  }
};

Panel.undock = function ( panelID ) {
  // remove panel element from tab
  let frameEL = Panel.find(panelID);
  if ( frameEL ) {
    let panelEL = frameEL.parentNode;
    if ( panelEL.tagName === UI.Panel.tagName ) {
      let currentTabEL = panelEL.$.tabs.findTab(frameEL);
      panelEL.close(currentTabEL);
    } else {
      panelEL.removeChild(frameEL);
    }

    UI.DockUtils.flush();
    UI.DockUtils.saveLayout();
  }

  // unload panelInfo
  Panel.unload(panelID);
};

Panel._dispatch = function (panelID, message, event, ...args) {
  let panelInfo = _id2panelInfo[panelID];
  if ( !panelInfo ) {
    if ( event.reply ) {
      event.reply( new ErrorNoPanel(panelID, message) );
    } else {
      Console.warn(`Failed to receive ipc ${message}, can not find panel ${panelID}`);
    }

    return;
  }

  // messages
  let idx = panelInfo.messages.indexOf(message);
  if ( idx === -1 ) {
    if ( event.reply ) {
      event.reply( new ErrorNoMsg(panelID, message) );
    } else {
      Console.warn(`Can not find ipc message ${message} register in panel ${panelID}`);
    }

    return;
  }

  if ( message === 'editor:panel-run' ) {
    Panel.focus(panelID);
  }

  let fn = panelInfo.frameEL[message];
  if ( !fn || typeof fn !== 'function' ) {
    if ( message !== 'editor:panel-run') {
      Console.warn(
        `Failed to respond ipc message ${message} in panel ${panelID}, Can not find implementation`
      );
    }
    return;
  }
  fn.apply( panelInfo.frameEL, [event, ...args] );
};

Panel.dumpLayout = function () {
  let root = UI.DockUtils.root;
  if ( !root ) {
    return null;
  }

  if ( root._dockable ) {
    return {
      'type': 'dock',
      'row': root.row,
      'no-collapse': true,
      'docks': _getDocks(root),
    };
  } else {
    let id = root.getAttribute('id');
    let rect = root.getBoundingClientRect();

    return {
      'type': 'standalone',
      'panel': id,
      'width': rect.width,
      'height': rect.height,
    };
  }
};

Panel.find = function ( panelID ) {
  let panelInfo = _id2panelInfo[panelID];
  if ( !panelInfo ) {
    return null;
  }
  return panelInfo.frameEL;
};

Panel.focus = function ( panelID ) {
  let frameEL = Panel.find(panelID);
  let panelEL = frameEL.parentNode;
  if ( panelEL.tagName === UI.Panel.tagName ) {
    panelEL.select(frameEL);
    panelEL.setFocus();
  }
};

Panel.getFocusedPanel = function () {
  for ( let id in _id2panelInfo ) {
    let panelInfo = _id2panelInfo[id];

    let frameEL = panelInfo.frameEL;
    let panelEL = frameEL.parentNode;

    if ( panelEL.focused ) {
      return panelEL.activeTab.frameEL;
    }
  }

  return null;
};

Panel.getPanelInfo = function ( panelID ) {
  return _id2panelInfo[panelID];
};

// TODO
// position: top, bottom, left, right, top-left, top-right, bottom-left, bottom-right
// Panel.dockAt = function ( position, panelEL ) {
//     var root = UI.DockUtils.root;
//     if ( !root ) {
//         return null;
//     }
//     if ( !root._dockable ) {
//         return null;
//     }
// }

Panel.isDirty = function ( panelID ) {
  return _outOfDatePanels.indexOf(panelID) !== -1;
};

Object.defineProperty(Panel, 'panels', {
  enumerable: true,
  get () {
    let results = [];

    for ( let id in _id2panelInfo ) {
      let panelInfo = _id2panelInfo[id];
      results.push(panelInfo.frameEL);
    }

    return results;
  },
});

// ==========================
// Internal
// ==========================

function _getPanels ( panelEL ) {
  let panels = [];

  for ( let i = 0; i < panelEL.children.length; ++i ) {
    let childEL = panelEL.children[i];
    let id = childEL.getAttribute('id');
    panels.push(id);
  }

  return panels;
}

function _getDocks ( dockEL ) {
  let docks = [];

  for ( let i = 0; i < dockEL.children.length; ++i ) {
    let childEL = dockEL.children[i];

    if ( !childEL._dockable ) {
      continue;
    }

    let rect = childEL.getBoundingClientRect();
    let info = {
      'row': childEL.row,
      'width': rect.width,
      'height': rect.height,
    };

    if ( childEL.tagName === UI.Panel.tagName ) {
      info.type = 'panel';
      info.active = childEL.activeIndex;
      info.panels = _getPanels(childEL);
    } else {
      info.type = 'dock';
      info.docks = _getDocks(childEL);
    }

    docks.push(info);
  }

  return docks;
}

function _registerIpc ( panelID, frameEL, ipcListener, ipcName ) {
  let fn = frameEL[ipcName];
  if ( !fn || typeof fn !== 'function' ) {
    if ( ipcName !== 'editor:panel-run') {
      Console.warn(
        `Failed to register ipc message ${ipcName} in panel ${panelID}, Can not find implementation`
      );
    }
    return;
  }

  ipcListener.on(ipcName, (event, ...args) => {
    let fn = frameEL[ipcName];
    if ( !fn || typeof fn !== 'function' ) {
      Console.warn(
        `Failed to respond ipc message ${ipcName} in panel ${panelID}, Can not find implementation`
      );
      return;
    }

    fn.apply( frameEL, [event, ...args] );
  });
}

function _registerProfile ( panelID, type, profile ) {
  profile.save = function () {
    Ipc.sendToMain('editor:save-profile', panelID, type, profile);
  };
}

function _registerShortcut ( panelID, mousetrap, frameEL, shortcut, methodName ) {
  var fn = frameEL[methodName];
  if ( typeof fn === 'function' ) {
    mousetrap.bind(shortcut, fn.bind(frameEL) );
  } else {
    Console.warn(
      `Failed to register shortcut, can not find method ${methodName} in panel ${panelID}.`
    );
  }
}

// ==========================
// Ipc events
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('editor:panel-close', ( event, panelID ) => {
  // NOTE: if we don't do this in requestAnimationFrame,
  // the tab will remain, something wrong for Polymer.dom
  // operation when they are in ipc callback.
  window.requestAnimationFrame(() => {
    Panel.close(panelID);
  });
});

ipcRenderer.on('editor:panel-popup', ( event, panelID ) => {
  window.requestAnimationFrame(() => {
    Panel.close(panelID);
    Ipc.sendToMain('editor:panel-open', panelID);
  });
});

ipcRenderer.on('editor:panel-undock', ( event, panelID ) => {
  window.requestAnimationFrame(() => {
    Panel.undock(panelID);
  });
});

ipcRenderer.on('editor:panel-out-of-date', ( event, panelID ) => {
  let frameEL = Panel.find(panelID);
  if ( frameEL ) {
    let panelEL = frameEL.parentNode;
    if ( panelEL.tagName === UI.Panel.tagName ) {
      panelEL.outOfDate(frameEL);
    }
  }

  if ( _outOfDatePanels.indexOf(panelID) === -1 ) {
    _outOfDatePanels.push(panelID);
  }
});
