'use strict';

const Electron = require('electron');
const ipcMain = Electron.ipcMain;

const _ = require('lodash');

let _nextSessionId = 1000;
let _replyCallbacks = {};

/**
 * @module Editor
 */

function _getOptions (args) {
  let options = args[args.length - 1];
  return (options && typeof options === 'object' && options.__is_ipc_option__) && options;
}

/**
 * Send `args...` to windows except the excluded
 * @method _main2renderersExclude
 * @param {object} excluded - A [WebContents](https://github.com/atom/electron/blob/master/docs/api/browser-window.md#class-webcontents) object.
 * @param {...*} [args] - whatever arguments the message needs
 */
function _main2renderersExclude (excluded, ...args) {
  // NOTE: duplicate windows list since window may close during events
  let winlist = Editor.Window.windows.slice();
  for ( let i = 0; i < winlist.length; ++i ) {
    let win = winlist[i];
    if (win.nativeWin.webContents !== excluded) {
      win.sendToPage.apply( win, args );
    }
  }
}

function _main2main (message, ...args) {
  let event = {
    senderType: 'main',
    sender: {
      send (...args) {
        _main2main.apply ( null, args );
      }
    }
  };

  if ( args.length === 0 ) {
    return ipcMain.emit( message, event );
  }

  let options = _getOptions(args);

  // check options
  if ( options ) {
    // discard options arg
    args = [].slice.call( args, 0, -1 );
  }

  // insert event as 2nd parameter in args
  args = [message, event, ...args];
  return ipcMain.emit.apply ( ipcMain, args );

}

function _renderer2main (event, message, ...args) {
  if ( args.length === 0 ) {
    return ipcMain.emit( message, event );
  }

  let options = _getOptions(args);

  // check options
  if ( options ) {
    // discard options arg
    args = [].slice.call(args, 0, -1);
  }

  // refine the args
  args = [message, event, ...args];
  return ipcMain.emit.apply ( ipcMain, args );
}

function _renderer2renderers (event, message, ...args) {
  if ( args.length === 0 ) {
    Editor.sendToWindows( message );
    return;
  }

  // check options
  let options = _getOptions(args);

  if (options) {
    // discard options arg
    args = [].slice.call( args, 0, -1 );
    if (options['self-excluded']) {
      // dont send to sender
      _main2renderersExclude.apply( null, [event.sender, message, ...args] );
      return;
    }
  }

  // send
  Editor.sendToWindows.apply( Editor, [message, ...args] );
}

// initialize messages APIs

/**
 * Send `message` with `...args` to all opened windows asynchronously. The renderer process
 * can handle it by listening to the message through the `Electron.ipcRenderer` module.
 *
 * @method sendToWindows
 * @param {string} message
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
 *     require('ipc').on('foo:bar', function(text) {
 *       console.log(text);  // Prints "Hello World!"
 *     });
 *   </script>
 * </body>
 * </html>
 * ```
 */
Editor.sendToWindows = function (message, ...args) {
  args = [message, ...args];

  // NOTE: duplicate windows list since window may close during events
  let winlist = Editor.Window.windows.slice();
  for ( let i = 0; i < winlist.length; ++i ) {
    let win = winlist[i];
    win.sendToPage.apply( win, args );
  }
};

/**
 * Send `message` with `...args` to main process asynchronously.
 * @method sendToCore
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.sendToCore = function (message, ...args) {
  args = [message, ...args];

  if ( _main2main.apply ( null, args ) === false ) {
    Editor.failed( `sendToCore "${message}" failed, not responded.` );
  }
};

/**
 * Send `message` with `...args` to all opened window and to main process asynchronously.
 * @method sendToAll
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.sendToAll = function (message, ...args) {
  if (args.length) {
    let toSelf = true;
    let options = _getOptions(args);

    // check options
    if (options) {
      // discard options arg
      args = [].slice.call( args, 0, -1 );
      if (options['self-excluded']) {
        toSelf = false;
      }
    }

    args = [message, ...args];

    // send
    if (toSelf) {
      _main2main.apply(null, args);
    }
    Editor.sendToWindows.apply(Editor, args);

    return;
  }

  _main2main(message);
  Editor.sendToWindows(message);
};

// DISABLE: not make sense
// Editor.sendToPackage = function ( packageName, message ) {
//     var panels = Editor.Panel.findPanels(packageName);
//     var args = [].slice.call( arguments, 1 );
//
//     for ( var i = 0; i < panels.length; ++i ) {
//         var panelID = packageName + '.' + panels[i];
//         Editor.sendToPanel.apply( Editor, [panelID].concat(args) );
//     }
// };

/**
 * Send `message` with `...args` to specific panel asynchronously.
 * @method sendToPanel
 * @param {string} panelID
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @example
 * ```js
 * Editor.sendToPanel( 'package.panel', 'foo-bar', 'foo', 'bar' );
 * ```
 */
Editor.sendToPanel = function (panelID, message, ...args) {
  let win = Editor.Panel.findWindow( panelID );
  if ( !win ) {
    // Editor.warn( "Failed to send %s, can not find panel %s.", message, panelID );
    return;
  }

  let panelInfo = Editor.Package.panelInfo(panelID);
  if ( !panelInfo ) {
    return;
  }

  // ignore the panelID
  if ( panelInfo.type === 'simple' ) {
    win.sendToPage.apply( win, [message, ...args] );
    return;
  }

  //
  win.sendToPage.apply( win, ['editor:send2panel', panelID, message, ...args] );
};

/**
 * Send `message` with `...args` to main window asynchronously.
 * @method sendToMainWindow
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 */
Editor.sendToMainWindow = function (message, ...args) {
  let mainWin = Editor.mainWindow;
  if ( !mainWin ) {
    // NOTE: do not use Editor.error here, since it will lead to ipc loop
    console.error(`Failed to send "${message}" to main window, the main window is not found.`);
    return;
  }

  mainWin.sendToPage.apply( mainWin, [message, ...args] );
};

/**
 * Send `message` with `...args` to main process asynchronously and wait for the reply.
 * @method sendRequestToCore
 * @param {string} message
 * @param {...*} [args] - whatever arguments the request needs
 * @param {function} callback - the callback used to handle replied arguments
 * @return {number} - The session id, it can be used in Editor.cancelRequestToCore
 */
Editor.sendRequestToCore = function (message, ...args) {
  if (typeof message !== 'string') {
    Editor.error('The message must be string');
    return null;
  }

  if ( !args.length ) {
    Editor.error('Invalid arguments, reply function not found!');
    return null;
  }

  let reply = args[args.length - 1];
  if (typeof reply !== 'function') {
    Editor.error('The last argument must be function');
    return null;
  }

  // pop reply function
  args.pop();

  let sessionId = _nextSessionId++;
  _replyCallbacks[sessionId] = reply;

  _main2main('editor:sendreq2core', message, sessionId, args);
  return sessionId;
};

/**
 * Cancel request sent to core by sessionId
 * @method cancelRequestToCore
 * @param {number} sessionId
 */
Editor.cancelRequestToCore = function (sessionId) {
  delete _replyCallbacks[sessionId];
};

// ========================================
// Ipc
// ========================================

// DELME
// ipcMain.on('editor:send2core', function ( event, message ) {
//   if ( !_renderer2main.apply ( null, arguments ) ) {
//     Editor.failed( `send2core "${message}" failed, listener not found for "${message}" in core-level` );
//   }
// });

ipcMain.on('editor:send2wins', _renderer2renderers );

ipcMain.on('editor:send2mainwin', (event, message, ...args) => {
  let mainWin = Editor.mainWindow;
  if (!mainWin) {
    // NOTE: do not use Editor.error here, since it will lead to ipc loop
    console.error(`Failed to send "${message}" because main page not initialized.`);
    return;
  }

  if (args.length) {
    // discard event arg
    mainWin.sendToPage.apply( mainWin, [event, message, ...args] );
  } else {
    mainWin.sendToPage( message );
  }
});

ipcMain.on('editor:send2all', (event, message, ...args) => {
  args = [event, message, ...args];
  _renderer2main.apply(null, args);
  _renderer2renderers.apply(ipcMain, args);
});

ipcMain.on('editor:send2panel', (event, panelID, message, ...args) => {
  Editor.sendToPanel.apply( Editor, [panelID, message, ...args] );
});

ipcMain.on('editor:sendreq2core', (event, message, sessionId, args) => {
  let called = false;
  function _replyCallback (...args) {
    if ( called ) {
      Editor.error(`The callback which reply to "${message}" can only be called once!`);
      return;
    }

    called = true;
    event.sender.send('editor:sendreq2core:reply', sessionId, args);
  }

  args = [event, message, _replyCallback, ...args];
  if ( !_renderer2main.apply(null, args) ) {
    Editor.error(`The listener of message "${message}" is not yet registered!`);
  }
});

ipcMain.on('editor:sendreq2core:reply', (event, sessionId, args) => {
  let cb = _replyCallbacks[sessionId];
  if (cb) {
    cb.apply(null, args);
    delete _replyCallbacks[sessionId];
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
