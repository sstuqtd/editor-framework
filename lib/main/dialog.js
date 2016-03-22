'use strict';

const Electron = require('electron');
const Console = require('console');

const dialog = Electron.dialog;

let Dialog = {
  openFile (...args) {
    try {
      return dialog.showOpenDialog.apply( dialog, args );
    } catch (err) {
      Console.error(err);
    }
    return null;
  },

  saveFile (...args) {
    try {
      return dialog.showSaveDialog.apply( dialog, args );
    } catch (err) {
      Console.error(err);
    }
    return null;
  },

  messageBox (...args) {
    try {
      return dialog.showMessageBox.apply( dialog, args );
    } catch (err) {
      Console.error(err);
    }
    return null;
  },
};

const ipcMain = Electron.ipcMain;

ipcMain.on('dialog:open-file', function (event, ...args) {
  let result = Dialog.openFile.apply( Dialog, args );
  if ( result === undefined ) {
    result = -1;
  }
  event.returnValue = result;
});

ipcMain.on('dialog:save-file', function (event, ...args) {
  let result = Dialog.saveFile.apply( Dialog, args );
  if ( result === undefined ) {
    result = -1;
  }
  event.returnValue = result;
});

ipcMain.on('dialog:message-box', function (event, ...args) {
  let result = Dialog.messageBox.apply( Dialog, args );
  if ( result === undefined ) {
    result = -1;
  }
  event.returnValue = result;
});

module.exports = Dialog;
