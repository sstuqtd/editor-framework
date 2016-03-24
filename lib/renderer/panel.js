'use strict';

/**
 * @module Panel
 */
let Panel = {};
module.exports = Panel;

// requires
const Electron = require('electron');
const Mousetrap = require('mousetrap');

const EditorR = require('./editor');
const UI = require('./ui');
const Console = require('./console');
const Ipc = require('./ipc');
const i18n = require('./i18n');
const IpcListener = require('../share/ipc-listener');

let _idToPagePanelInfo = {};
// let _url2link = {};
let _outOfDatePanels = [];

// ==========================
// exports
// ==========================

Panel.load = function ( panelID, cb ) {
  Ipc.sendRequestToCore('panel:query-info', panelID, ( panelInfo ) => {
    if ( !panelInfo ) {
      Console.error(`Panel ${panelID} import faield. panelInfo not found`);
      if ( cb ) {
        cb ( new Error('Panel info not found') );
      }

      return;
    }

    const Path = require('fire-path');
    let framePath = Path.join( panelInfo.path, panelInfo.frame );

    UI.PolymerUtils.import( framePath, ( err ) => {
      if ( err ) {
        Console.error(`Failed to import ${framePath}. message: ${err.message}`);
        if ( cb ) {
          cb ( new Error('Panel import failed.') );
        }

        return;
      }

      let frameCtor = EditorR.panels[panelID];
      if ( !frameCtor ) {
        Console.error(`Can not find constructor for panelID ${panelID}`);
        if ( cb ) {
          cb ( new Error( panelID + '\'s constructor not found' ) );
        }

        return;
      }

      Ipc.sendToCore('panel:dock', panelID);

      let frameEL = new frameCtor();
      if ( panelInfo.icon ) {
        frameEL.icon = new Image();
        frameEL.icon.src = Path.join( panelInfo.path, panelInfo.icon );
      }
      frameEL.setAttribute('id', panelID);
      frameEL.setAttribute('name', i18n.format(panelInfo.title));
      frameEL.classList.add('fit');
      frameEL.tabIndex = 1;

      // set size attribute
      if ( panelInfo.width ) {
        frameEL.setAttribute( 'width', panelInfo.width );
      }

      if ( panelInfo.height ) {
        frameEL.setAttribute( 'height', panelInfo.height );
      }

      if ( panelInfo['min-width'] ) {
        frameEL.setAttribute( 'min-width', panelInfo['min-width'] );
      }

      if ( panelInfo['min-height'] ) {
        frameEL.setAttribute( 'min-height', panelInfo['min-height'] );
      }

      if ( panelInfo['max-width'] ) {
        frameEL.setAttribute( 'max-width', panelInfo['max-width'] );
      }

      if ( panelInfo['max-height'] ) {
        frameEL.setAttribute( 'max-height', panelInfo['max-height'] );
      }

      // register ipc events
      let ipcListener = new IpcListener();

      // always have panel:run message
      if ( panelInfo.messages.indexOf('panel:run') === -1 ) {
        panelInfo.messages.push('panel:run');
      }

      for ( let i = 0; i < panelInfo.messages.length; ++i ) {
        _registerIpc( panelID, frameEL, ipcListener, panelInfo.messages[i] );
      }

      // register profiles
      frameEL.profiles = panelInfo.profiles;
      for ( let type in panelInfo.profiles ) {
        _registerProfile ( panelID, type, panelInfo.profiles[type] );
      }

      // register shortcuts
      // TODO: load overwrited shortcuts from profile?
      let mousetrapList = [];
      if ( panelInfo.shortcuts ) {
        let mousetrap = new Mousetrap(frameEL);
        mousetrapList.push(mousetrap);

        for ( let name in panelInfo.shortcuts ) {
          if ( name.length > 1 && name[0] === '#' ) {
            let subElement = frameEL.querySelector(name);

            if ( !subElement ) {
              Console.warn(`Failed to register shortcut for element ${name}, can not find it.`);
              continue;
            }

            let subShortcuts = panelInfo.shortcuts[name];
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
              panelInfo.shortcuts[name]
            );
          }
        }
      }

      //
      _idToPagePanelInfo[panelID] = {
        frameEL: frameEL,
        messages: panelInfo.messages,
        popable: panelInfo.popable,
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
        cb ( null, frameEL, panelInfo );
      }
    });
  });
};

Panel.unload = function ( panelID ) {
  // remove pagePanelInfo
  let pagePanelInfo = _idToPagePanelInfo[panelID];
  if ( !pagePanelInfo) {
    return;
  }

  pagePanelInfo.ipcListener.clear();
  for ( let i = 0; i < pagePanelInfo.mousetrapList.length; ++i ) {
    pagePanelInfo.mousetrapList[i].reset();
  }
  delete _idToPagePanelInfo[panelID];
};

Panel.open = function ( panelID, argv ) {
  Ipc.sendToCore('panel:open', panelID, argv);
};

Panel.popup = function ( panelID ) {
  let panelCounts = Object.keys(_idToPagePanelInfo).length;

  if ( panelCounts > 1 ) {
    Panel.close(panelID);
    Ipc.sendToCore('panel:open', panelID);
  }
};

Panel.close = function ( panelID ) {
  Panel.undock(panelID);
  Ipc.sendToCore('panel:close', panelID);
};

Panel.closeAll = function ( cb ) {
  // if we have root, clear all children in it
  let rootEL = UI.DockUtils.root;
  if ( rootEL ) {
    rootEL.remove();
    UI.DockUtils.root = null;
  }

  let panelIDs = [];
  for ( let id in _idToPagePanelInfo ) {
    // unload pagePanelInfo
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
    Ipc.sendRequestToCore('panel:wait-for-close', panelIDs[i], () => {
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

  // unload pagePanelInfo
  Panel.unload(panelID);
};

Panel.dispatch = function (panelID, ipcName, ...args) {
  let pagePanelInfo = _idToPagePanelInfo[panelID];
  if ( !pagePanelInfo ) {
    Console.warn(`Failed to receive ipc ${ipcName}, can not find panel ${panelID}`);
    return;
  }

  // messages
  let idx = pagePanelInfo.messages.indexOf(ipcName);
  if ( idx === -1 ) {
    Console.warn(`Can not find ipc message ${ipcName} register in panel ${panelID}`);
    return;
  }

  if ( ipcName === 'panel:run' ) {
    Panel.focus(panelID);
  }

  let fn = pagePanelInfo.frameEL[ipcName];
  if ( !fn || typeof fn !== 'function' ) {
    if ( ipcName !== 'panel:run') {
      Console.warn(
        `Failed to respond ipc message ${ipcName} in panel ${panelID}, Can not find implementation`
      );
    }
    return;
  }
  fn.apply( pagePanelInfo.frameEL, args );
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
  let pagePanelInfo = _idToPagePanelInfo[panelID];
  if ( !pagePanelInfo ) {
    return null;
  }
  return pagePanelInfo.frameEL;
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
  for ( let id in _idToPagePanelInfo ) {
    let pagePanelInfo = _idToPagePanelInfo[id];

    let frameEL = pagePanelInfo.frameEL;
    let panelEL = frameEL.parentNode;

    if ( panelEL.focused ) {
      return panelEL.activeTab.frameEL;
    }
  }

  return null;
};

Panel.getPanelInfo = function ( panelID ) {
  return _idToPagePanelInfo[panelID];
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

    for ( let id in _idToPagePanelInfo ) {
      let pagePanelInfo = _idToPagePanelInfo[id];
      results.push(pagePanelInfo.frameEL);
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
    if ( ipcName !== 'panel:run') {
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

    fn.apply( frameEL, args );
  });
}

function _registerProfile ( panelID, type, profile ) {
  profile.save = function () {
    Console.sendToCore('editor:save-profile', panelID, type, profile);
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

ipcRenderer.on('panel:close', ( event, panelID ) => {
  // NOTE: if we don't do this in requestAnimationFrame,
  // the tab will remain, something wrong for Polymer.dom
  // operation when they are in ipc callback.
  window.requestAnimationFrame(() => {
    Panel.close(panelID);
  });
});

ipcRenderer.on('panel:popup', ( event, panelID ) => {
  window.requestAnimationFrame(() => {
    Panel.close(panelID);
    Console.sendToCore('panel:open', panelID);
  });
});

ipcRenderer.on('panel:undock', ( event, panelID ) => {
  window.requestAnimationFrame(() => {
    Panel.undock(panelID);
  });
});

ipcRenderer.on('panel:out-of-date', ( event, panelID ) => {
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
