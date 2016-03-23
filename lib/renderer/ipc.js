'use strict';

/**
 * @module Ipc
 */
let Ipc = {};
module.exports = Ipc;

// requires
const Electron = require('electron');
const Console = require('./console');
const Panel = require('./panel');

const ipcRenderer = Electron.ipcRenderer;

let _nextSessionId = 1000;
let _replyCallbacks = {};
let _msg2replyInfo = {};

// Communication Patterns

/**
 * This option is used to indicate that the message should not send to self.
 * It must be supplied as the last argument of your message if you want.
 * @property selfExcluded
 * @type {Object}
 */
Ipc.selfExcluded = {
  '__is_ipc_option__': true,
  'self-excluded': true,
};

/**
 * Send message with `...args` to main process synchronized and return a result which is responded from main process
 * @method sendToCoreSync
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @return {Object} results
 */
Ipc.sendToCoreSync = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  return ipcRenderer.sendSync.apply( ipcRenderer, [message, ...args] );
};

/**
 * Send message with `...args` to main process asynchronously.
 * @method sendToCore
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 */
Ipc.sendToCore = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  ipcRenderer.send.apply( ipcRenderer, [message, ...args] );
};

/**
 * Send message with `...args` to main process by package name and the short name of the message
 * @method sendToPackage
 * @param {string} pkgName - the package name
 * @param {string} message - the short name of the message
 * @param {...*} [args] - whatever arguments the message needs
 */
Ipc.sendToPackage = function (pkgName, message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  ipcRenderer.send.apply( ipcRenderer, [`${pkgName}:${message}`, ...args] );
};

/**
 * Broadcast message with `...args` to all opened window.
 * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
 * @method sendToWindows
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @param {object} [options] - you can indicate the options such as Editor.selfExcluded
 */
Ipc.sendToWindows = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  ipcRenderer.send.apply( ipcRenderer, ['editor:send2wins', message, ...args] );
};

/**
 * Broadcast message with `...args` to main window.
 * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
 * @method sendToMainWindow
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 */
Ipc.sendToMainWindow = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  ipcRenderer.send.apply( ipcRenderer, ['editor:send2mainwin', message, ...args] );
};

/**
 * Broadcast message with `...args` to all opened windows and main process
 * @method sendToAll
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @param {object} [options] - you can indicate the options such as Editor.selfExcluded
 */
Ipc.sendToAll = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  ipcRenderer.send.apply( ipcRenderer, ['editor:send2all', message, ...args] );
};

/**
 * Send message with `...args` to specific panel
 * @method sendToPanel
 * @param {string} panelID - the panel id
 * @param {string} message
 * @param {...*} [arg] - whatever arguments the message needs
 */
Ipc.sendToPanel = function (panelID, message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must string');
    return;
  }

  ipcRenderer.send.apply( ipcRenderer, ['editor:send2panel', panelID, message, ...args] );
};

/**
 * Send message with `...args` to main process, and wait for the reply
 * @method sendRequestToCore
 * @param {string} message
 * @param {...*} [args] - whatever arguments the request needs
 * @param {function} callback - the callback used to handle replied arguments
 * @return {number} - session id, it can be used in Editor.cancelRequestToCore
 */
Ipc.sendRequestToCore = function (message, ...args) {
  if (typeof message !== 'string') {
    Console.error('The message must be string');
    return null;
  }

  if ( !args.length ) {
    Console.error('Invalid arguments, reply function not found!');
    return null;
  }

  let reply = args[args.length - 1];
  if (typeof reply !== 'function') {
    Console.error('The last argument must be function');
    return null;
  }

  // pop reply function
  args.pop();

  let sessionId = _nextSessionId++;
  _replyCallbacks[sessionId] = reply;

  ipcRenderer.send('editor:sendreq2core', message, sessionId, args);
  return sessionId;
};

/**
 * Cancel request sent to core by sessionId
 * @method cancelRequestToCore
 */
Ipc.cancelRequestToCore = function (sessionId) {
  delete _replyCallbacks[sessionId];
};

/**
 * Send message with `...args` to main process, and waiting for reply
 * @method waitForReply
 * @param {string} message
 * @param {...*} [arg] - whatever arguments the request needs
 * @param {function} reply - the callback used to handle replied arguments
 * @param {number} [timeout] - timeout for the reply, if timeout = -1, it will never get expired
 * @return {number} - session id, can be used in Editor.cancelWaitForReply
 */
Ipc.waitForReply = function (message, ...args) {
  if (typeof message !== 'string') {
    Console.error('The message must be string');
    return null;
  }

  if ( !args.length ) {
    Console.error('Invalid arguments, reply function not found!');
    return null;
  }

  // arguments check
  let reply, timeout;
  let lastArg = args[args.length - 1];

  if (typeof lastArg === 'number') {
    if ( args.length < 2 ) {
      Console.error('Invalid arguments, reply function not found!');
      return null;
    }

    timeout = lastArg;
    args.pop();

    lastArg = args[args.length - 1];
    if (typeof lastArg !== 'function') {
      Console.error('Invalid arguments, reply function not found!');
      return null;
    }

    reply = lastArg;
    args.pop();
  } else {
    if (typeof lastArg !== 'function') {
      Console.error('Invalid arguments, reply function not found!');
      return null;
    }

    reply = lastArg;
    timeout = 5000;
    args.pop();
  }

  var info = _msg2replyInfo[message];
  if ( !info ) {
    info = {
      nextSessionId: 1000,
      callbacks: {},
    };
    _msg2replyInfo[message] = info;
    ipcRenderer.on(message+':reply', (event, sessionId, ...args) => {
      let cb = info.callbacks[sessionId];
      if (cb) {
        cb.apply(null, args);
        delete info.callbacks[sessionId];
      }
    });
  }

  //
  let sessionId = info.nextSessionId++;
  info.callbacks[sessionId] = reply;

  if ( timeout !== -1 ) {
    setTimeout(function () {
      delete info.callbacks[sessionId];
    },timeout);
  }

  ipcRenderer.send.apply(ipcRenderer, ['editor:send2all', message, sessionId, ...args]);

  return sessionId;
};

/**
 * Cancel wait for reply by message and sessionId
 * @method cancelWaitForReply
 * @param {string} message
 * @param {number} sessionId
 */
Ipc.cancelWaitForReply = function (message, sessionId) {
  let info = _msg2replyInfo[message];
  if ( !info ) {
    return;
  }

  delete info.callbacks[sessionId];
};

// ==========================
// Ipc events
// ==========================

ipcRenderer.on('editor:sendreq2core:reply', (event, sessionId, args) => {
  let cb = _replyCallbacks[sessionId];
  if (cb) {
    // NOTE: we must delete callback before it apply, this will prevent window close in
    // reply-callback will still keep reference in GC
    delete _replyCallbacks[sessionId];
    cb.apply(null, args);
  }
});

ipcRenderer.on('editor:send2panel', (event, panelID, message, ...args) => {
  Panel.dispatch.apply( Panel, [panelID, message, ...args] );
});

ipcRenderer.on('editor:sendreq2page', (event, message, sessionId, args) => {
  let called = false;

  function _replyCallback (...args) {
    if ( called ) {
      Console.error(`The callback which reply to "${message}" can only be called once!`);
      return;
    }

    called = true;
    ipcRenderer.send( 'editor:sendreq2page:reply', sessionId, args );
  }

  args = [message, event, _replyCallback, ...args];
  if ( !ipcRenderer.emit.apply(ipcRenderer, args) ) {
    Console.error(`The listener of message "${message}" is not yet registered!`);
  }
});

