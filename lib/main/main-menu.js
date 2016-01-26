'use strict';

const Electron = require('electron');
const BrowserWindow = Electron.BrowserWindow;
const Menu = Electron.Menu;

const Fs = require('fire-fs');

function _defaultMainMenu () {
  return [
    // Help
    {
      label: Editor.T('MAIN_MENU.help.title'),
      role: 'help',
      id: 'help',
      submenu: [
        {
          label: Editor.T('MAIN_MENU.help.docs'),
          click () {
            // TODO
            // let helpWin = require('../../share/manual');
            // helpWin.openManual();
          }
        },
        {
          label: Editor.T('MAIN_MENU.help.api'),
          click () {
            // TODO
            // let helpWin = require('../../share/manual');
            // helpWin.openAPI();
          }
        },
        {
          label: Editor.T('MAIN_MENU.help.forum'),
          click () {
            // TODO
            // Shell.openExternal('http://cocos-creator.com/chat');
            // Shell.beep();
          }
        },
        { type: 'separator' },
        {
          label: Editor.T('MAIN_MENU.help.subscribe'),
          click () {
            // TODO
            // Shell.openExternal('http://eepurl.com/bh5w3z');
            // Shell.beep();
          }
        },
        { type: 'separator' },
      ]
    },

    // Fireball
    {
      label: Editor.T('SHARED.product_name'),
      position: 'before=help',
      submenu: [
        {
          label: Editor.T('MAIN_MENU.about', {
            product: Editor.T('SHARED.product_name')
          }),
          role: 'about',
        },
        {
          label: Editor.T('MAIN_MENU.window.hide', {
            product: Editor.T('SHARED.product_name')
          }),
          accelerator: 'CmdOrCtrl+H',
          role: 'hide'
        },
        {
          label: Editor.T('MAIN_MENU.window.hide_others'),
          accelerator: 'CmdOrCtrl+Shift+H',
          role: 'hideothers'
        },
        {
          label: Editor.T('MAIN_MENU.window.show_all'),
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click () {
            Editor.mainWindow.close();
          }
        },
      ]
    },

    // Edit
    {
      label: Editor.T('MAIN_MENU.edit.title'),
      submenu: [
        {
          label: Editor.T('MAIN_MENU.edit.undo'),
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: Editor.T('MAIN_MENU.edit.redo'),
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: Editor.T('MAIN_MENU.edit.cut'),
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: Editor.T('MAIN_MENU.edit.copy'),
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: Editor.T('MAIN_MENU.edit.paste'),
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: Editor.T('MAIN_MENU.edit.selectall'),
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        },
      ]
    },

    // Window
    {
      label: 'Window',
      id: 'window',
      role: 'window',
      submenu: [
        {
          label: Editor.T('MAIN_MENU.window.hide', {product: Editor.T('SHARED.product_name')}),
          accelerator: 'CmdOrCtrl+H',
          visible: Editor.isDarwin,
          role: 'hide'
        },
        {
          label: Editor.T('MAIN_MENU.window.hide_others'),
          accelerator: 'CmdOrCtrl+Shift+H',
          visible: Editor.isDarwin,
          role: 'hideothers'
        },
        {
          label: Editor.T('MAIN_MENU.window.show_all'),
          role: 'unhide',
          visible: Editor.isDarwin
        },
        {
          label: Editor.T('MAIN_MENU.window.minimize'),
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize',
        },
        {
          label: Editor.T('MAIN_MENU.window.bring_all_front'),
          visible: Editor.isDarwin,
          role: 'front',
        },
        { type: 'separator' },
        {
          label: Editor.T('MAIN_MENU.window.close'),
          accelerator: 'CmdOrCtrl+W',
          role: 'close',
        },
      ]
    },

    // Panel
    {
      label: 'Panel',
      id: 'panel',
      submenu: [
      ]
    },

    // Layout
    {
      label: Editor.T('MAIN_MENU.layout.title'),
      id: 'layout',
      submenu: [
        {
          label: Editor.T('MAIN_MENU.layout.default'),
          click () {
            let layoutInfo = JSON.parse(Fs.readFileSync(Editor.url('editor-framework://static/layout.json') ));
            Editor.sendToMainWindow( 'editor:reset-layout', layoutInfo);
          }
        },
        {
          label: Editor.T('MAIN_MENU.layout.empty'),
          visible: Editor.isDev,
          click () {
            Editor.sendToMainWindow( 'editor:reset-layout', null);
          }
        },
      ]
    },

    // Developer
    {
      label: Editor.T('MAIN_MENU.developer.title'),
      id: 'developer',
      submenu: [
        {
          label: 'Command Palette',
          accelerator: 'CmdOrCtrl+:',
          click () {
            Editor.mainWindow.focus();
            Editor.sendToMainWindow('editor:show-commands');
          }
        },
        { type: 'separator' },
        {
          label: Editor.T('MAIN_MENU.developer.reload'),
          accelerator: 'CmdOrCtrl+R',
          click () {
            // DISABLE: Editor.clearLog();
            let focusedWin = BrowserWindow.getFocusedWindow();
            if ( focusedWin ) {
              focusedWin.webContents.reload();
            }
          }
        },
        {
          label: Editor.T('MAIN_MENU.developer.reload_no_cache'),
          accelerator: 'CmdOrCtrl+Shift+R',
          click () {
            // DISABLE: Editor.clearLog();
            let focusedWin = BrowserWindow.getFocusedWindow();
            if ( focusedWin ) {
              focusedWin.webContents.reloadIgnoringCache();
            }
          }
        },
        { type: 'separator' },
        {
          label: Editor.T('MAIN_MENU.developer.inspect'),
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
          label: Editor.T('MAIN_MENU.developer.devtools'),
          accelerator: 'CmdOrCtrl+Alt+I',
          click () {
            let focusedWindow = BrowserWindow.getFocusedWindow();
            if ( focusedWindow ) {
              focusedWindow.openDevTools();
              if ( focusedWindow.devToolsWebContents ) {
                focusedWindow.devToolsWebContents.focus();
              }
            }
          }
        },
        {
          label: Editor.T('MAIN_MENU.developer.debug_core'),
          type: 'checkbox',
          checked: false,
          click () {
            let menuPath = `${Editor.T('MAIN_MENU.developer.title')}/${Editor.T('MAIN_MENU.developer.debug_core')}`;
            Editor.Debugger.toggle(menuPath);
          }
        },
        { type: 'separator' },
        {
          label: 'Human Tests',
          visible: Editor.isDev,
          submenu: [
            { type: 'separator' },
            {
              label: 'Throw an Uncaught Exception',
              click () {
                throw new Error('editor-framework Unknown Error');
              }
            },
            {
              label: 'send2panel \'foo:bar\' foobar.panel',
              click () {
                Editor.sendToPanel( 'foobar.panel', 'foo:bar' );
              }
            },
          ],
        },
        { type: 'separator' },
      ]
    },
  ];
}

Editor.Menu.register('main-menu', _defaultMainMenu);
let _mainMenu = new Editor.Menu(_defaultMainMenu());

/**
 * The main menu module for manipulating main menu items
 * @module Editor.MainMenu
 */
let MainMenu = {
  /**
   * Revert to default setup
   * @method _revert
   */
  _revert () {
    Editor.Menu.register('main-menu', _defaultMainMenu, true);
    MainMenu.reset();
  },

  /**
   * Apply main menu changes
   * @method apply
   */
  apply () {
    Menu.setApplicationMenu(_mainMenu.nativeMenu);
  },

  /**
   * Reset main menu to its default template
   * @method reset
   */
  reset () {
    _mainMenu.reset(Editor.Menu.getMenu('main-menu'));
    MainMenu.apply();
  },

  /**
   * Build a template into menu item and add it to path
   * @method add
   * @param {string} path - A menu path
   * @param {object[]|object} template
   */
  add ( path, template ) {
    if ( _mainMenu.add( path, template ) ) {
      MainMenu.apply();
    }
  },

  /**
   * Build a template into menu item and add it to path
   * @method add
   * @param {string} path - A menu path
   * @param {object[]|object} template
   */
  update ( path, template ) {
    if ( _mainMenu.update( path, template ) ) {
      MainMenu.apply();
    }
  },

  /**
   * Remove menu item at path.
   * @method remove
   * @param {string} path - A menu path
   */
  remove ( path ) {
    if ( _mainMenu.remove( path ) ) {
      MainMenu.apply();
    }
  },

  /**
   * Set menu options at path.
   * @method set
   * @param {string} path - A menu path
   * @param {object} [options]
   * @param {NativeImage} [options.icon] - A [NativeImage](https://github.com/atom/electron/blob/master/docs/api/native-image.md)
   * @param {Boolean} [options.enabled]
   * @param {Boolean} [options.visible]
   * @param {Boolean} [options.checked] - NOTE: You must set your menu-item type to 'checkbox' to make it work
   */
  set ( path, options ) {
    if ( _mainMenu.set( path, options ) ) {
      MainMenu.apply();
    }
  },
};

// ========================================
// Ipc
// ========================================

const ipcMain = Electron.ipcMain;

// ipc
ipcMain.on('main-menu:reset', () => {
  MainMenu.reset();
});

ipcMain.on('main-menu:add', ( event, path, template ) => {
  MainMenu.add( path, template );
});

ipcMain.on('main-menu:remove', ( event, path ) => {
  MainMenu.remove( path );
});

ipcMain.on('main-menu:set', ( event, path, options ) => {
  MainMenu.set( path, options );
});

ipcMain.on('main-menu:update', ( event, path, template ) => {
  MainMenu.update( path, template );
});

module.exports = MainMenu;
