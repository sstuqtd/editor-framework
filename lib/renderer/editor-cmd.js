// TODO

'use strict';

const Electron = require('electron');
const ipcRenderer = Electron.ipcRenderer;

let EditorCmd = {
};

module.exports = EditorCmd;

// ========================================
// Ipc
// ========================================

ipcRenderer.on( 'editor:show-commands', () => {
  Editor.log('hello');
});
