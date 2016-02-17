'use strict';

const Electron = require('electron');
const Mousetrap = require('mousetrap');

let _idToPagePanelInfo = {};
// let _url2link = {};
let _outOfDatePanels = [];

function _getPanels ( panelEL ) {
  let panels = [];

  let panelDOM = Polymer.dom(panelEL);
  for ( let i = 0; i < panelDOM.children.length; ++i ) {
    let childEL = panelDOM.children[i];
    let id = childEL.getAttribute('id');
    panels.push(id);
  }

  return panels;
}

function _getDocks ( dockEL ) {
  let docks = [];

  let dockDOM = Polymer.dom(dockEL);
  for ( let i = 0; i < dockDOM.children.length; ++i ) {
    let childEL = dockDOM.children[i];

    if ( !childEL._dockable ) {
      continue;
    }

    let rect = childEL.getBoundingClientRect();
    let info = {
      'row': childEL.row,
      'width': rect.width,
      'height': rect.height,
    };

    if ( EditorUI.isDockPanel(childEL) ) {
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
      Editor.warn(
        `Failed to register ipc message ${ipcName} in panel ${panelID}, Can not find implementation`
      );
    }
    return;
  }

  ipcListener.on(ipcName, (event, ...args) => {
    let fn = frameEL[ipcName];
    if ( !fn || typeof fn !== 'function' ) {
      Editor.warn(
        `Failed to respond ipc message ${ipcName} in panel ${panelID}, Can not find implementation`
      );
      return;
    }

    fn.apply( frameEL, args );
  });
}

function _registerProfile ( panelID, type, profile ) {
  profile.save = function () {
    Editor.sendToCore('editor:save-profile', panelID, type, profile);
  };
}

function _registerShortcut ( panelID, mousetrap, frameEL, shortcut, methodName ) {
  var fn = frameEL[methodName];
  if ( typeof fn === 'function' ) {
    mousetrap.bind(shortcut, fn.bind(frameEL) );
  } else {
    Editor.warn(
      `Failed to register shortcut, can not find method ${methodName} in panel ${panelID}.`
    );
  }
}

let EditorPanel = {
  load ( panelID, cb ) {
    Editor.sendRequestToCore('panel:query-info', panelID, ( panelInfo ) => {
      if ( !panelInfo ) {
        Editor.error(`Panel ${panelID} import faield. panelInfo not found`);
        if ( cb ) {
          cb ( new Error('Panel info not found') );
        }

        return;
      }

      const Path = require('fire-path');
      let framePath = Path.join( panelInfo.path, panelInfo.frame );

      EditorUI.import( framePath, ( err ) => {
        if ( err ) {
          Editor.error(`Failed to import ${framePath}. message: ${err.message}`);
          if ( cb ) {
            cb ( new Error('Panel import failed.') );
          }

          return;
        }

        let frameCtor = Editor.panels[panelID];
        if ( !frameCtor ) {
          Editor.error(`Can not find constructor for panelID ${panelID}`);
          if ( cb ) {
            cb ( new Error( panelID + '\'s constructor not found' ) );
          }

          return;
        }

        Editor.sendToCore('panel:dock', panelID);

        let frameEL = new frameCtor();
        if ( panelInfo.icon ) {
          frameEL.icon = new Image();
          frameEL.icon.src = Path.join( panelInfo.path, panelInfo.icon );
        }
        frameEL.setAttribute('id', panelID);
        frameEL.setAttribute('name', Editor.i18n.format(panelInfo.title));
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
        let ipcListener = new Editor.Ipc();

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
                Editor.warn(`Failed to register shortcut for element ${name}, can not find it.`);
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
  },

  unload ( panelID ) {
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
  },

  open ( panelID, argv ) {
    Editor.sendToCore('panel:open', panelID, argv);
  },

  popup ( panelID ) {
    let panelCounts = Object.keys(_idToPagePanelInfo).length;

    if ( panelCounts > 1 ) {
      EditorPanel.close(panelID);
      Editor.sendToCore('panel:open', panelID);
    }
  },

  close ( panelID ) {
    EditorPanel.undock(panelID);
    Editor.sendToCore('panel:close', panelID);
  },

  closeAll ( cb ) {
    // if we have root, clear all children in it
    let rootEL = EditorUI.DockUtils.root;
    if ( rootEL ) {
      rootEL.remove();
      EditorUI.DockUtils.root = null;
    }

    let panelIDs = [];
    for ( let id in _idToPagePanelInfo ) {
      // unload pagePanelInfo
      EditorPanel.unload(id);
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
      Editor.sendRequestToCore('panel:wait-for-close', panelIDs[i], () => {
        --finishCount;
        if ( finishCount === 0 && cb ) {
          cb();
        }
      });
    }
  },

  undock ( panelID ) {
    // remove panel element from tab
    let frameEL = EditorPanel.find(panelID);
    if ( frameEL ) {
      let parentEL = Polymer.dom(frameEL).parentNode;
      if ( EditorUI.isDockPanel(parentEL) ) {
        let currentTabEL = parentEL.$.tabs.findTab(frameEL);
        parentEL.close(currentTabEL);
      } else {
        Polymer.dom(parentEL).removeChild(frameEL);
      }

      EditorUI.DockUtils.flush();
      Editor.saveLayout();
    }

    // unload pagePanelInfo
    EditorPanel.unload(panelID);
  },

  dispatch (panelID, ipcName, ...args) {
    let pagePanelInfo = _idToPagePanelInfo[panelID];
    if ( !pagePanelInfo ) {
      Editor.warn(`Failed to receive ipc ${ipcName}, can not find panel ${panelID}`);
      return;
    }

    // messages
    let idx = pagePanelInfo.messages.indexOf(ipcName);
    if ( idx === -1 ) {
      Editor.warn(`Can not find ipc message ${ipcName} register in panel ${panelID}`);
      return;
    }

    if ( ipcName === 'panel:run' ) {
      EditorPanel.focus(panelID);
    }

    let fn = pagePanelInfo.frameEL[ipcName];
    if ( !fn || typeof fn !== 'function' ) {
      if ( ipcName !== 'panel:run') {
        Editor.warn(
          `Failed to respond ipc message ${ipcName} in panel ${panelID}, Can not find implementation`
        );
      }
      return;
    }
    fn.apply( pagePanelInfo.frameEL, args );
  },

  dumpLayout () {
    let root = EditorUI.DockUtils.root;
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
  },

  find ( panelID ) {
    let pagePanelInfo = _idToPagePanelInfo[panelID];
    if ( !pagePanelInfo ) {
      return null;
    }
    return pagePanelInfo.frameEL;
  },

  focus ( panelID ) {
    let frameEL = EditorPanel.find(panelID);
    let parentEL = Polymer.dom(frameEL).parentNode;
    if ( EditorUI.isDockPanel(parentEL) ) {
      parentEL.select(frameEL);
      parentEL.setFocus();
    }
  },

  getFocusedPanel () {
    for ( let id in _idToPagePanelInfo ) {
      let pagePanelInfo = _idToPagePanelInfo[id];

      if ( pagePanelInfo.frameEL.focused ) {
        return pagePanelInfo.frameEL;
      }
    }

    return null;
  },

  getPanelInfo ( panelID ) {
    return _idToPagePanelInfo[panelID];
  },

  // TODO
  // position: top, bottom, left, right, top-left, top-right, bottom-left, bottom-right
  // dockAt ( position, panelEL ) {
  //     var root = EditorUI.DockUtils.root;
  //     if ( !root ) {
  //         return null;
  //     }
  //     if ( !root._dockable ) {
  //         return null;
  //     }
  // },

  isDirty ( panelID ) {
    return _outOfDatePanels.indexOf(panelID) !== -1;
  },

  get panels () {
    let results = [];

    for ( let id in _idToPagePanelInfo ) {
      let pagePanelInfo = _idToPagePanelInfo[id];
      results.push(pagePanelInfo.frameEL);
    }

    return results;
  },
};

module.exports = EditorPanel;

// ==========================
// Ipc events
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('panel:close', ( event, panelID ) => {
  // NOTE: if we don't do this in requestAnimationFrame,
  // the tab will remain, something wrong for Polymer.dom
  // operation when they are in ipc callback.
  window.requestAnimationFrame(() => {
    EditorPanel.close(panelID);
  });
});

ipcRenderer.on('panel:popup', ( event, panelID ) => {
  window.requestAnimationFrame(() => {
    EditorPanel.close(panelID);
    Editor.sendToCore('panel:open', panelID);
  });
});

ipcRenderer.on('panel:undock', ( event, panelID ) => {
  window.requestAnimationFrame(() => {
    EditorPanel.undock(panelID);
  });
});

ipcRenderer.on('panel:out-of-date', ( event, panelID ) => {
  let frameEL = EditorPanel.find(panelID);
  if ( frameEL ) {
    let parentEL = Polymer.dom(frameEL).parentNode;
    if ( EditorUI.isDockPanel(parentEL) ) {
      parentEL.outOfDate(frameEL);
    }
  }

  if ( _outOfDatePanels.indexOf(panelID) === -1 ) {
    _outOfDatePanels.push(panelID);
  }
});
