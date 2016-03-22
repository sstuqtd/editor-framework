'use strict';

const Electron = require('electron');
const Ipc = require('./ipc');
const Menu = require('./menu');
const Debugger = require('./debugger');
const i18n = require('./i18n');
const Platform = require('../share/platform');

const _T = i18n.t;

function _defaultMainMenu () {
  return [
    // Help
    {
      label: _T('MAIN_MENU.help.title'),
      role: 'help',
      id: 'help',
      submenu: [
        {
          label: _T('MAIN_MENU.help.docs'),
          click () {
            // TODO
            // let helpWin = require('../../share/manual');
            // helpWin.openManual();
          }
        },
        {
          label: _T('MAIN_MENU.help.api'),
          click () {
            // TODO
            // let helpWin = require('../../share/manual');
            // helpWin.openAPI();
          }
        },
        {
          label: _T('MAIN_MENU.help.forum'),
          click () {
            // TODO
            // Shell.openExternal('http://cocos-creator.com/chat');
            // Shell.beep();
          }
        },
        { type: 'separator' },
        {
          label: _T('MAIN_MENU.help.subscribe'),
          click () {
            // TODO
            // Shell.openExternal('http://eepurl.com/bh5w3z');
            // Shell.beep();
          }
        },
        { type: 'separator' },
      ]
    },

    // editor-framework
    {
      label: _T('SHARED.product_name'),
      position: 'before=help',
      submenu: [
        {
          label: _T('MAIN_MENU.about', {
            product: _T('SHARED.product_name')
          }),
          role: 'about',
        },
        {
          label: _T('MAIN_MENU.window.hide', {
            product: _T('SHARED.product_name')
          }),
          accelerator: 'CmdOrCtrl+H',
          role: 'hide'
        },
        {
          label: _T('MAIN_MENU.window.hide_others'),
          accelerator: 'CmdOrCtrl+Shift+H',
          role: 'hideothers'
        },
        {
          label: _T('MAIN_MENU.window.show_all'),
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click () {
            Window.main.close();
          }
        },
      ]
    },

    // Edit
    {
      label: _T('MAIN_MENU.edit.title'),
      submenu: [
        {
          label: _T('MAIN_MENU.edit.undo'),
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: _T('MAIN_MENU.edit.redo'),
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: _T('MAIN_MENU.edit.cut'),
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: _T('MAIN_MENU.edit.copy'),
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: _T('MAIN_MENU.edit.paste'),
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: _T('MAIN_MENU.edit.selectall'),
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
          label: _T('MAIN_MENU.window.hide', {product: _T('SHARED.product_name')}),
          accelerator: 'CmdOrCtrl+H',
          visible: Platform.isDarwin,
          role: 'hide'
        },
        {
          label: _T('MAIN_MENU.window.hide_others'),
          accelerator: 'CmdOrCtrl+Shift+H',
          visible: Platform.isDarwin,
          role: 'hideothers'
        },
        {
          label: _T('MAIN_MENU.window.show_all'),
          role: 'unhide',
          visible: Platform.isDarwin
        },
        {
          label: _T('MAIN_MENU.window.minimize'),
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize',
        },
        {
          label: _T('MAIN_MENU.window.bring_all_front'),
          visible: Platform.isDarwin,
          role: 'front',
        },
        { type: 'separator' },
        {
          label: _T('MAIN_MENU.window.close'),
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
      label: _T('MAIN_MENU.layout.title'),
      id: 'layout',
      submenu: [
        {
          label: _T('MAIN_MENU.layout.default'),
          click () {
            let layoutInfo = require('../../static/layout.json');
            Ipc.sendToMainWindow( 'editor:reset-layout', layoutInfo);
          }
        },
        {
          label: _T('MAIN_MENU.layout.empty'),
          dev: true,
          click () {
            Ipc.sendToMainWindow( 'editor:reset-layout', null);
          }
        },
      ]
    },

    // Developer
    {
      label: _T('MAIN_MENU.developer.title'),
      id: 'developer',
      submenu: [
        {
          label: _T('MAIN_MENU.developer.reload'),
          accelerator: 'CmdOrCtrl+R',
          click ( item, focusedWindow ) {
            // DISABLE: Console.clearLog();
            focusedWindow.reload();
          }
        },
        {
          label: _T('MAIN_MENU.developer.reload_no_cache'),
          accelerator: 'CmdOrCtrl+Shift+R',
          click ( item, focusedWindow ) {
            // DISABLE: Console.clearLog();
            focusedWindow.reloadIgnoringCache();
          }
        },
        { type: 'separator' },
        {
          label: _T('MAIN_MENU.developer.inspect'),
          accelerator: 'CmdOrCtrl+Shift+C',
          click () {
            let nativeWin = Electron.BrowserWindow.getFocusedWindow();
            let editorWin = Window.find(nativeWin);
            if ( editorWin ) {
              editorWin.sendToPage( 'window:inspect' );
            }
          }
        },
        {
          label: _T('MAIN_MENU.developer.devtools'),
          accelerator: (() => {
            if (process.platform === 'darwin') {
              return 'Alt+Command+I';
            } else {
              return 'Ctrl+Shift+I';
            }
          })(),
          click ( item, focusedWindow ) {
            if ( focusedWindow ) {
              focusedWindow.openDevTools();
              if ( focusedWindow.devToolsWebContents ) {
                focusedWindow.devToolsWebContents.focus();
              }
            }
          }
        },
        {
          label: _T('MAIN_MENU.developer.debug_main_process'),
          type: 'checkbox',
          dev: true,
          checked: false,
          click ( item ) {
            item.checked = Debugger.toggle();
          }
        },
        { type: 'separator' },
        {
          label: 'Human Tests',
          dev: true,
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
                Ipc.sendToPanel( 'foobar.panel', 'foo:bar' );
              }
            },
          ],
        },
        { type: 'separator' },
      ]
    },
  ];
}

Menu.register('main-menu', _defaultMainMenu);
let _mainMenu = new Menu(_defaultMainMenu());

/**
 * The main menu module for manipulating main menu items
 * @module MainMenu
 */
let MainMenu = {
  /**
   * Revert to default setup
   * @method _revert
   */
  _revert () {
    Menu.register('main-menu', _defaultMainMenu, true);
    MainMenu.reset();
  },

  /**
   * Apply main menu changes
   * @method apply
   */
  apply () {
    Electron.Menu.setApplicationMenu(_mainMenu.nativeMenu);
  },

  /**
   * Reset main menu to its default template
   * @method reset
   */
  reset () {
    _mainMenu.reset(Menu.getMenu('main-menu'));
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

  /**
   * Get main menu instance for debug purpose
   * @property menu
   */
  get menu () { return _mainMenu; },
};

module.exports = MainMenu;

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
