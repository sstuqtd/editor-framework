'use strict';

const Electron = require('electron');

if ( Editor.isCoreLevel ) {
  let Dialog = require('dialog');

  let EditorDialog = {
    openFile () {
      return Dialog.showOpenDialog.apply( Dialog, arguments );
    },

    saveFile () {
      return Dialog.showSaveDialog.apply( Dialog, arguments );
    },

    messageBox () {
      return Dialog.showMessageBox.apply( Dialog, arguments );
    },
  };

  const ipcMain = Electron.ipcMain;

  ipcMain.on('dialog:open-file', function (event) {
    let args = [].slice.call(arguments,1);

    event.returnValue = EditorDialog.openFile.apply( EditorDialog, args );
  });

  ipcMain.on('dialog:save-file', function (event) {
    let args = [].slice.call(arguments,1);

    event.returnValue = EditorDialog.saveFile.apply( EditorDialog, args );
  });

  ipcMain.on('dialog:message-box', function (event) {
    let args = [].slice.call(arguments,1);

    event.returnValue = EditorDialog.messageBox.apply( EditorDialog, args );
  });

  module.exports = EditorDialog;

} else if ( Editor.isPageLevel ) {
  const ipcRenderer = Electron.ipcRenderer;

  let EditorDialog = {
    openFile () {
      let args = [].slice.call(arguments);
      args.unshift('dialog:open-file');
      return ipcRenderer.sendSync.apply(ipcRenderer, args);
    },

    saveFile () {
      let args = [].slice.call(arguments);
      args.unshift('dialog:save-file');
      return ipcRenderer.sendSync.apply(ipcRenderer, args);
    },

    messageBox () {
      let args = [].slice.call(arguments);
      args.unshift('dialog:message-box');
      return ipcRenderer.sendSync.apply(ipcRenderer, args);
    },
  };

  module.exports = EditorDialog;
}
