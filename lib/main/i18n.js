'use strict';

const Electron = require('electron');
const i18n = require('../share/i18n');

Electron.ipcMain.on('editor:get-i18n-phrases', event => {
  event.returnValue = i18n.polyglot.phrases;
});

module.exports = i18n;
