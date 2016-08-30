'use strict';

/**
 * @module Editor.Panel
 *
 * Panel module for operating specific panel
 */
let Panel = {};
module.exports = Panel;

const Electron = require('electron');
const Profile = require('./profile');
const Window = require('./window');
const Console = require('./console');
const Package = require('./package');

// ========================================
// exports
// ========================================

/**
 * @property templateUrl
 *
 * The html entry file used for standalone panel window. Default is 'editor-framework://static/window.html'.
 */
Panel.templateUrl = 'editor-framework://static/window.html';

/**
 * @method open
 * @param {string} panelID - The panelID.
 * @param {object} argv - Argument store as key-value table, which will be used in panel's `run` function in renderer process.
 *
 * Open a panel via `panelID` and pass `argv` to it. The `argv` will be execute in panel's run function in renderer process.
 */
Panel.open = function ( panelID, argv ) {
  let panelInfo = Package.panelInfo(panelID);
  if ( !panelInfo ) {
    Console.error(`Failed to open panel ${panelID}, panel info not found.`);
    return;
  }

  // if we found the window, send editor:panel-run to trigger the panel.run in renderer
  // otherwise we will wait until editor:panel-ready message back from renderer
  let editorWin = Panel.findWindow(panelID);
  if ( editorWin ) {
    editorWin.show();
    editorWin.focus();
    editorWin.send( 'editor:panel-run', panelID, argv );
    return;
  }

  //
  let windowName = `window-${new Date().getTime()}`;
  let winopts = {
    useContentSize: true,
    width: parseInt(panelInfo.width),
    height: parseInt(panelInfo.height),
    minWidth: parseInt(panelInfo['min-width']),
    minHeight: parseInt(panelInfo['min-height']),
    maxWidth: parseInt(panelInfo['max-width']),
    maxHeight: parseInt(panelInfo['max-height']),
    frame: panelInfo.frame,
    resizable: panelInfo.resizable,
  };

  // NOTE: only simple window can disable devtools
  if ( panelInfo.disableDevTools && panelInfo.type === 'simple' ) {
    winopts.disableDevTools = true;
  }

  // load layout-settings, and find windows by name
  let layoutProfile = Profile.load(`layout.${panelID}`, 'local' );
  if ( layoutProfile ) {
    if ( layoutProfile.x ) {
      winopts.x = parseInt(layoutProfile.x);
    }

    if ( layoutProfile.y ) {
      winopts.y = parseInt(layoutProfile.y);
    }

    if ( layoutProfile.width ) {
      winopts.width = parseInt(layoutProfile.width);
    }

    if ( layoutProfile.height ) {
      winopts.height = parseInt(layoutProfile.height);
    }
  }

  winopts.windowType = panelInfo.type || 'dockable';

  // NOTE: non-resizable window always use package.json settings
  if ( !winopts.resizable ) {
    winopts.width = parseInt(panelInfo.width);
    winopts.height = parseInt(panelInfo.height);
  }

  if ( isNaN(winopts.width) ) {
    winopts.width = 400;
  }

  if ( isNaN(winopts.height) ) {
    winopts.height = 400;
  }

  if ( isNaN(winopts.minWidth) ) {
    winopts.minWidth = 200;
  }

  if ( isNaN(winopts.minHeight) ) {
    winopts.minHeight = 200;
  }

  //
  editorWin = new Window(windowName, winopts);

  // NOTE: In Windows platform, hide the menu bar will make the content size increased to fill the menu bar space.
  // re-calling setContentSize will solve the problem
  editorWin.nativeWin.setMenuBarVisibility(false);
  editorWin.nativeWin.setContentSize( winopts.width, winopts.height );

  if ( panelInfo.type === 'simple' ) {
    let names = panelID.split('.');
    editorWin.load(`packages://${names[0]}/${panelInfo.main}`, argv);
  } else {
    editorWin.load(Panel.templateUrl);
    editorWin.nativeWin.webContents.once('did-finish-load', () => {
      editorWin.send( 'editor:panel-load', panelID, argv );
    });

    // editorWin.load(Panel.templateUrl, {
    //   panelID: panelID,
    //   panelArgv: argv
    // });
  }
  editorWin.focus();
};

/**
 * @method close
 * @param {string} panelID - The panelID
 *
 * Close a panel via `panelID`
 */
Panel.close = function ( panelID ) {
  let editorWin = _undock(panelID);
  if ( !editorWin ) {
    return;
  }

  // check if we have other panels in the same window
  // if no panels left, we close the window and it is not the main window, close it.
  if ( editorWin.panels.length === 0 && !editorWin.isMainWindow ) {
    editorWin.close();
  }
};

/**
 * @method popup
 * @param {string} panelID - The panelID
 *
 * Popup an exists panel via `panelID`
 */
Panel.popup = function ( panelID ) {
  Panel.close(panelID);
  // TODO: should wait for close, then open.
  Panel.open(panelID);
};

/**
 * @method findWindow
 * @param {string} panelID - The panelID
 * @return {Editor.Window}
 *
 * Find and return an editor window that contains the panelID
 */
Panel.findWindow = function ( panelID ) {
  for ( let i = 0; i < Window.windows.length; ++i ) {
    let editorWin = Window.windows[i];
    let idx = editorWin.panels.indexOf(panelID);
    if ( idx !== -1 ) {
      return editorWin;
    }
  }

  return null;
};

// DISABLE
// TODO: use Package.packageInfo(pkg).panels
// /**
//  * @method findWindows
//  * @param {string} packageName
//  * @return {Editor.Window[]}
//  *
//  * Find and return editor window list that contains panel defined in package via packageName
//  */
// Panel.findWindows = function (packageName) {
//   let wins = [];
//
//   for ( let i = 0; i < Window.windows.length; ++i ) {
//     let editorWin = Window.windows[i];
//
//     for ( let j = 0; j < editorWin.panels; ++j ) {
//       let panelID = editorWin.panels[j];
//
//       // FIXME: we can not use this way to test if a panelID belongs to a package
//       if ( panelID.indexOf(packageName) === 0 ) {
//         wins.push(editorWin);
//         break;
//       }
//     }
//   }
//
//   return wins;
// };

// DISABLE
// TODO: use Package.packageInfo(pkg).panels
// /**
//  * @method findPanels
//  * @param {string} packageName
//  * @return {string[]}
//  *
//  * Find and return panel ID list that contains panel defined in package via packageName
//  */
// Panel.findPanels = function ( packageName ) {
//   let panelIDs = [];
//
//   for ( let i = 0; i < Window.windows.length; ++i ) {
//     let editorWin = Window.windows[i];
//
//     for ( let j = 0; j < editorWin.panels; ++j ) {
//       let panelID = editorWin.panels[j];
//
//       // FIXME: we can not use this way to test if a panelID belongs to a package
//       if ( panelID.indexOf(packageName) === 0 ) {
//         panelIDs.push(panelID);
//         break;
//       }
//     }
//   }
//
//   return panelIDs;
// };

// DISABLE
// TODO: use Package.packageInfo(pkg).panels to close all panels
// /**
//  * @method closeAll
//  * @param {string} packageName
//  *
//  * Close all panels defined in package via packageName
//  */
// Panel.closeAll = function (packageName) {
//   let panelIDs = Panel.findPanels(packageName);
//   for (let i = 0; i < panelIDs.length; ++i) {
//     Panel.close( panelIDs[i] );
//   }
// };

// NOTE: this only invoked in window on-close event
// NOTE: please go to read main/window.js 'on-close' event comment for more detail about why we do _saveLayout here
// NOTE: only when panel is the only one in the window and the window is not the main window
Panel._onWindowClose = function ( editorWin ) {
  // save standalone panel's layout
  if ( !editorWin.isMainWindow && editorWin.panels.length === 1 ) {
    _saveLayout( editorWin, editorWin.panels[0] );
  }
};

// ========================================
// Internal
// ========================================

function _dock ( panelID, win ) {
  // Console.info('%s dock to %s', panelID, win.name ); // DEBUG
  win._addPanel(panelID);
}

function _undock ( panelID ) {
  // Console.info('%s undock from %s', panelID, editorWin.name ); // DEBUG
  let editorWin = Panel.findWindow(panelID);

  if ( editorWin ) {
    editorWin.send( 'editor:panel-undock', panelID );
    editorWin._removePanel(panelID);
    return editorWin;
  }

  return null;
}

function _saveLayout ( editorWin, panelID ) {
  let panelProfile = Profile.load( `layout.${panelID}`, 'local' );
  let winSize = editorWin.nativeWin.getContentSize();
  let winPos = editorWin.nativeWin.getPosition();

  panelProfile.x = winPos[0];
  panelProfile.y = winPos[1];
  panelProfile.width = winSize[0];
  panelProfile.height = winSize[1];
  panelProfile.save();
}

// ========================================
// Ipc
// ========================================

const ipcMain = Electron.ipcMain;

ipcMain.on('editor:panel-query-info', ( event, panelID ) => {
  if ( !panelID ) {
    Console.error( 'A `editor:panel-query-info` message failed because the panelID was empty.' );
    event.reply();
    return;
  }

  // get panelInfo
  let panelInfo = Package.panelInfo(panelID);
  if ( panelInfo ) {
    // load profiles
    for ( let type in panelInfo.profiles ) {
      let profile = panelInfo.profiles[type];
      profile = Profile.load( panelID, type, profile );
      panelInfo.profiles[type] = profile;
    }
  }

  //
  event.reply( null, panelInfo );
});

ipcMain.on('editor:panel-open', ( event, panelID, argv ) => {
  Panel.open( panelID, argv );
});

ipcMain.on('editor:panel-dock', ( event, panelID ) => {
  let browserWin = Electron.BrowserWindow.fromWebContents( event.sender );
  let editorWin = Window.find(browserWin);
  _dock( panelID, editorWin );
});

ipcMain.on('editor:panel-close', ( event, panelID ) => {
  Panel.close( panelID );
});

ipcMain.on('editor:panel-wait-for-close', ( event, panelID ) => {
  Panel.close( panelID );
  event.reply();
});

ipcMain.on('editor:panel-popup', ( event, panelID ) => {
  Panel.popup(panelID);
});
