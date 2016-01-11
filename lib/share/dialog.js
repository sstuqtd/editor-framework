'use strict';

const Electron = require('electron');

if ( Editor.isCoreLevel ) {
  const dialog = Electron.dialog;

  let EditorDialog = {
    openFile (...args) {
      try {
        return dialog.showOpenDialog.apply( dialog, args );
      } catch (err) {
        Editor.error(err);
      }
      return null;
    },

    saveFile (...args) {
      try {
        return dialog.showSaveDialog.apply( dialog, args );
      } catch (err) {
        Editor.error(err);
      }
      return null;
    },

    messageBox (...args) {
      try {
        return dialog.showMessageBox.apply( dialog, args );
      } catch (err) {
        Editor.error(err);
      }
      return null;
    },
  };

  const ipcMain = Electron.ipcMain;

  ipcMain.on('dialog:open-file', function (event, ...args) {
    event.returnValue = EditorDialog.openFile.apply( EditorDialog, args );
  });

  ipcMain.on('dialog:save-file', function (event, ...args) {
    event.returnValue = EditorDialog.saveFile.apply( EditorDialog, args );
  });

  ipcMain.on('dialog:message-box', function (event, ...args) {
    event.returnValue = EditorDialog.messageBox.apply( EditorDialog, args );
  });

  module.exports = EditorDialog;

} else if ( Editor.isPageLevel ) {
  const ipcRenderer = Electron.ipcRenderer;

  let EditorDialog = {
    openFile (...args) {
      return ipcRenderer.sendSync.apply(ipcRenderer, [
        'dialog:open-file', ...args
      ]);
    },

    saveFile (...args) {
      return ipcRenderer.sendSync.apply(ipcRenderer, [
        'dialog:save-file', ...args
      ]);
    },

    messageBox (...args) {
      return ipcRenderer.sendSync.apply(ipcRenderer, [
        'dialog:message-box', ...args
      ]);
    },
  };

  module.exports = EditorDialog;
}
