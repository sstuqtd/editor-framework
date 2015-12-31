'use strict';

const Electron = require('electron');
const ipcMain = Electron.ipcMain;

const _ = require('lodash');

require('../share/ipc-init');

/**
 * @module Editor
 */

function _getOptions (args) {
  let options = args[args.length - 1];
  return (options && typeof options === 'object' && options.__is_ipc_option__) && options;
}

function _sendToCore ( event, channel ) {
  if ( arguments.length <= 2 ) {
    return ipcMain.emit( channel, event );
  }

  let args;
  let options = _getOptions(arguments);

  // check options
  if ( options ) {
    // discard options arg
    args = [].slice.call( arguments, 0, -1 );
  } else {
    args = [].slice.call( arguments, 0 );
  }

  // make channel to become first argument
  args[0] = channel;
  args[1] = event;

  return ipcMain.emit.apply ( ipcMain, args );
}

function _sendToWindows ( event, channel ) {
  // jshint validthis:true
  if (arguments.length <= 2) {
    Editor.sendToWindows( channel );
    return;
  }

  // check options
  let args;
  let options = _getOptions(arguments);

  if (options) {
    // discard event and options arg
    args = [].slice.call( arguments, 1, -1 );
    if (options['self-excluded']) {
      // dont send to sender
      Editor.sendToWindowsExclude( args, event.sender );
      return;
    }
  } else {
    // discard event arg
    args = [].slice.call( arguments, 1 );
  }

  // send
  Editor.sendToWindows.apply( Editor, args );
}

// initialize messages APIs

/**
 * Send `args...` to windows except the excluded
 * @method sendToWindowsExclude
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 * @param {object} excluded - A [WebContents](https://github.com/atom/electron/blob/master/docs/api/browser-window.md#class-webcontents) object.
 */
Editor.sendToWindowsExclude = function (args, excluded) {
  // NOTE: duplicate windows list since window may close during events
  let winlist = Editor.Window.windows.slice();
  for ( let i = 0; i < winlist.length; ++i ) {
    let win = winlist[i];
    if (win.nativeWin.webContents !== excluded) {
      win.sendToPage.apply( win, args );
    }
  }
};

/**
 * Send `args...` to all opened windows via `channel` in asynchronous message. The `page-level`
 * can handle it by listening to the channel event of the ipc module.
 *
 * @method sendToWindows
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 * @example
 * In `core-level`:
 *
 * ```js
 * Editor.sendToWindows('foo:bar', 'Hello World!');
 * ```
 *
 * In `page-level`:
 *
 * ```html
 * // index.html
 * <html>
 * <body>
 *   <script>
 *     require('ipc').on('foo:bar', function(message) {
 *       console.log(message);  // Prints "Hello World!"
 *     });
 *   </script>
 * </body>
 * </html>
 * ```
 */
Editor.sendToWindows = function () {
  // NOTE: duplicate windows list since window may close during events
  let winlist = Editor.Window.windows.slice();
  for ( let i = 0; i < winlist.length; ++i ) {
    let win = winlist[i];
    win.sendToPage.apply( win, arguments );
  }
};

/**
 * Send `args...` to core itself via `channel` in asynchronous message.
 * @method sendToCore
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.sendToCore = function () {
  if ( ipcMain.emit.apply ( ipcMain, arguments ) === false ) {
    Editor.failed( 'sendToCore ' + arguments[0] + ' failed, not responded.' );
  }
};

/**
 * Send `args...` to all opened window and core via `channel` in asynchronous message.
 * @method sendToAll
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.sendToAll = function () {
  if (arguments.length > 1) {
    let toSelf = true;
    let args = arguments;
    let options = _getOptions(arguments);

    // check options
    if (options) {
      // discard options arg
      args = [].slice.call( arguments, 0, -1 );
      if (options['self-excluded']) {
        toSelf = false;
      }
    }

    // send
    if (toSelf) {
      ipcMain.emit.apply(ipcMain, args); // sendToCore (dont require receiver)
    }
    Editor.sendToWindows.apply(Editor, args);

    return;
  }

  ipcMain.emit(arguments[0]); // sendToCore (dont require receiver)
  Editor.sendToWindows(arguments[0]);
};

// DISABLE: not make sense
// Editor.sendToPackage = function ( packageName, message ) {
//     var panels = Editor.Panel.findPanels(packageName);
//     var args = [].slice.call( arguments, 1 );

//     for ( var i = 0; i < panels.length; ++i ) {
//         var panelID = packageName + '.' + panels[i];
//         Editor.sendToPanel.apply( Editor, [panelID].concat(args) );
//     }
// };

/**
 * Send `args...` to specific panel via `channel` in asynchronous message.
 * @method sendToPanel
 * @param {string} panelID
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 * @example
 * ```js
 * Editor.sendToPanel( 'package.panel', 'ipc-foo-bar', 'arg1', 'arg2', ... );
 * ```
 */
Editor.sendToPanel = function ( panelID ) {
  let win = Editor.Panel.findWindow( panelID );
  if ( !win ) {
    // Editor.warn( "Failed to send %s, can not find panel %s.", message, panelID );
    return;
  }

  let panelInfo = Editor.Package.panelInfo(panelID);
  if ( !panelInfo ) {
    return;
  }

  if ( panelInfo.type === 'simple' ) {
    let args = [].slice.call( arguments, 1 );
    win.sendToPage.apply( win, args );
    return;
  }

  let args = [].slice.call( arguments, 0 );
  args.unshift('editor:send2panel');
  win.sendToPage.apply( win, args );
};

/**
 * Send `args...` to main window via `channel` in asynchronous message.
 * @method sendToMainWindow
 * @param {string} channel
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.sendToMainWindow = function () {
  let mainWin = Editor.mainWindow;
  if ( !mainWin ) {
    // NOTE: do not use Editor.error here, since it will lead to ipc loop
    console.error(`Failed to send "${arguments[0]}" because main page not initialized.`);
    return;
  }

  mainWin.sendToPage.apply( mainWin, arguments );
};

// ========================================
// Ipc
// ========================================

ipcMain.on('editor:send2core', function ( event, channel ) {
  if ( !_sendToCore.apply ( ipcMain, arguments ) ) {
    Editor.failed( `send2core "${channel}" failed, listener not found for "${channel}" in core-level` );
  }
});

ipcMain.on('editor:send2wins', _sendToWindows );

ipcMain.on('editor:send2mainwin', function (event, channel) {
  let mainWin = Editor.mainWindow;
  if (!mainWin) {
    // NOTE: do not use Editor.error here, since it will lead to ipc loop
    console.error(`Failed to send "${channel}" because main page not initialized.`);
    return;
  }

  if (arguments.length > 2) {
    // discard event arg
    let args = [].slice.call( arguments, 1 );
    mainWin.sendToPage.apply( mainWin, args );
  } else {
    mainWin.sendToPage( channel );
  }
});

ipcMain.on('editor:send2all', function () {
  _sendToCore.apply(ipcMain, arguments);
  _sendToWindows.apply(ipcMain, arguments);
});

ipcMain.on('editor:send2panel', function () {
  let args = [].slice.call( arguments, 1 );
  Editor.sendToPanel.apply( Editor, args );
});

ipcMain.on('editor:sendreq2core', function (event, request, sessionId, args) {
  let called = false;
  function _replyCallback () {
    if ( called ) {
      Editor.error(`The callback which reply to "${request}" can only be called once!`);
      return;
    }

    called = true;
    event.sender.send('editor:sendreq2core:reply', sessionId, [].slice.call(arguments));
  }

  args.unshift(request, event, _replyCallback);

  if ( !ipcMain.emit.apply(ipcMain, args) ) {
    Editor.error(`The listener of request "${request}" is not yet registered!`);
  }
});

ipcMain.on( 'editor:load-profile', ( event, reply, name, type ) => {
  let profile = Editor.loadProfile( name, type );
  reply(profile);
});

ipcMain.on( 'editor:save-profile', ( event, name, type, value ) => {
  let profile = Editor.loadProfile( name, type );
  if ( profile ) {
    profile.clear();
    _.assign(profile, value);
    profile.save();
  }
});
