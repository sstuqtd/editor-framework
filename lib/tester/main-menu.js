'use strict';

const BrowserWindow = require('browser-window');
const Ipc = require('ipc');

module.exports = function () {
  return [
    // Test Runner
    {
      label: 'Test Runner',
      submenu: [
        {
          label: 'Hide',
          accelerator: 'CmdOrCtrl+H',
          selector: 'hide:'
        },
        {
          label: 'Hide Others',
          accelerator: 'CmdOrCtrl+Shift+H',
          selector: 'hideOtherApplications:'
        },
        {
          label: 'Show All',
          selector: 'unhideAllApplications:'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: function () {
            Editor.quit();
          }
        },
      ]
    },

    // Edit
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          selector: 'undo:'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          selector: 'redo:'
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          selector: 'cut:'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          selector: 'copy:'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          selector: 'paste:'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:'
        },
      ]
    },

    // Window
    {
      label: 'Window',
      id: 'window',
      submenu: Editor.isDarwin ?  [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          selector: 'performMiniaturize:',
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          selector: 'performClose:',
        },
        { type: 'separator' },
        {
          label: 'Bring All to Front',
          selector: 'arrangeInFront:'
        },
      ] : [
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close',
        }
      ]
    },

    // Developer
    {
      label: 'Developer',
      id: 'developer',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click () {
            Ipc.emit('mocha-reload');
            BrowserWindow.getFocusedWindow().reload();
          }
        },
        { type: 'separator' },
        {
          label: 'Inspect Element',
          accelerator: 'CmdOrCtrl+Shift+C',
          click () {
            let nativeWin = BrowserWindow.getFocusedWindow();
            let editorWin = Editor.Window.find(nativeWin);
            if ( editorWin ) {
              editorWin.sendToPage( 'window:inspect' );
            }
          }
        },
        {
          label: 'Developer Tools',
          accelerator: 'CmdOrCtrl+Alt+I',
          click () {
            let focusedWindow = BrowserWindow.getFocusedWindow();
            if ( focusedWindow ) {
              focusedWindow.openDevTools();
            }
          }
        },
      ]
    },
  ];
};
