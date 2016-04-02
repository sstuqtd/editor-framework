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

// get window id
const winID = Electron.remote.getCurrentWindow().id;

let _nextSessionId = 1000;
let _id2callback = {};

// ==========================
// exports
// ==========================

// Communication Patterns

/**
 * Ipc option used as last arguments in message.
 * @method option
 * @param {object} - opts
 * @param {boolean} - opts.excludeSelf
 * @param {boolean} - opts.waitForReply
 * @param {number} - opts.timeout
 */
Ipc.option = function (opts) {
  opts.__ipc__ = true;
  return opts;
};

/**
 * Broadcast message with `...args` to all opened windows and main process
 * @method sendToAll
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @param {object} [options] - you can indicate the options by Editor.Ipc.option({ excludeSelf: true })
 */
Ipc.sendToAll = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  ipcRenderer.send.apply( ipcRenderer, ['editor:ipc-renderer2all', message, ...args] );
};

/**
 * Broadcast message with `...args` to all opened window.
 * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
 * @method sendToWins
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @param {object} [options] - you can indicate the options by Editor.Ipc.option({ excludeSelf: true })
 */
Ipc.sendToWins = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  ipcRenderer.send.apply( ipcRenderer, ['editor:ipc-renderer2wins', message, ...args] );
};

/**
 * Send message with `...args` to main process synchronized and return a result which is responded from main process
 * @method sendToMainSync
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 * @return {Object} results
 */
Ipc.sendToMainSync = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  return ipcRenderer.sendSync.apply( ipcRenderer, [message, ...args] );
};

/**
 * Send message with `...args` to main process asynchronously.
 * @method sendToMain
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 */
Ipc.sendToMain = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  let opts = _popReplyAndTimeout(args);
  let sessionId;

  if ( opts ) {
    sessionId = _newSession(`${winID}@renderer`, opts.reply, opts.timeout);

    args = ['editor:ipc-renderer2main', message, ...args, Ipc.option({
      sessionId: sessionId,
      waitForReply: true,
      timeout: opts.timeout, // this is only used as debug info
    })];
  } else {
    args = [message, ...args];
  }

  ipcRenderer.send.apply( ipcRenderer, args );

  return sessionId;
};

/**
 * Send message with `...args` to main process by package name and the short name of the message
 * @method sendToPackage
 * @param {string} pkgName - the package name
 * @param {string} message - the short name of the message
 * @param {...*} [args] - whatever arguments the message needs
 */
Ipc.sendToPackage = function (pkgName, message, ...args) {
  return Ipc.sendToMain.apply(null, [`${pkgName}:${message}`, ...args]);
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

  let opts = _popReplyAndTimeout(args);
  let sessionId;

  if ( opts ) {
    sessionId = _newSession(`${panelID}@renderer`, opts.reply, opts.timeout);

    args = ['editor:ipc-renderer2panel', panelID, message, ...args, Ipc.option({
      sessionId: sessionId,
      waitForReply: true,
      timeout: opts.timeout, // this is used in main to start a transfer-session timeout
    })];
  } else {
    args = ['editor:ipc-renderer2panel', panelID, message, ...args];
  }

  ipcRenderer.send.apply( ipcRenderer, args );

  return sessionId;
};

/**
 * Broadcast message with `...args` to main window.
 * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
 * @method sendToMainWin
 * @param {string} message
 * @param {...*} [args] - whatever arguments the message needs
 */
Ipc.sendToMainWin = function (message, ...args) {
  if ( typeof message !== 'string' ) {
    Console.error('The message must be string');
    return;
  }

  ipcRenderer.send.apply( ipcRenderer, ['editor:ipc-renderer2mainwin', message, ...args] );
};

/**
 * Cancel request sent to core by sessionId
 * @method cancel
 * @param {number} sessionId
 */
// TODO: callback ??
Ipc.cancelRequest = function (sessionId) {
  delete _id2callback[sessionId];
};

// ========================================
// Internal
// ========================================

function _popOptions (args) {
  let opts = args[args.length - 1];

  if ( opts && typeof opts === 'object' && opts.__ipc__ ) {
    // args.splice(-1,1);
    args.pop();
    return opts;
  }

  return null;
}

function _popReplyAndTimeout (args) {
  // arguments check
  let reply, timeout;
  let lastArg = args[args.length - 1];

  if (typeof lastArg === 'number') {
    if ( args.length < 2 ) {
      return null;
    }

    timeout = lastArg;
    args.pop();

    lastArg = args[args.length - 1];
    if (typeof lastArg !== 'function') {
      return null;
    }

    reply = lastArg;
    args.pop();
  } else {
    if (typeof lastArg !== 'function') {
      return null;
    }

    reply = lastArg;
    timeout = 5000;
    args.pop();
  }

  return {
    reply: reply,
    timeout: timeout,
  };
}

function _newSession ( prefix, fn, timeout ) {
  let sessionId = `prefix:${_nextSessionId++}`;
  _id2callback[sessionId] = fn;

  if ( timeout !== -1 ) {
    setTimeout(() => {
      delete _id2callback[sessionId];
    }, timeout);
  }

  return sessionId;
}

function _main2rendererOpts (event, message, ...args) {
  if ( args.length === 0 ) {
    return ipcRenderer.emit( message, event );
  }

  // process waitForReply option
  let opts = _popOptions(args);
  if ( opts && opts.waitForReply ) {
    event.reply = function (...replyArgs) {
      let replyOpts = Ipc.option({
        sessionId: opts.sessionId
      });
      replyArgs = [`editor:ipc-reply`, ...replyArgs, replyOpts];
      return event.sender.send.apply( event.sender, replyArgs );
    };
  }

  // refine the args
  args = [message, event, ...args];
  return ipcRenderer.emit.apply( ipcRenderer, args );
}

// ========================================
// Ipc
// ========================================

ipcRenderer.on('editor:ipc-main2panel', (event, panelID, message, ...args) => {
  // process waitForReply option
  let opts = _popOptions(args);
  if ( opts && opts.waitForReply ) {
    event.reply = function (...replyArgs) {
      let replyOpts = Ipc.option({
        sessionId: opts.sessionId
      });
      replyArgs = [`editor:ipc-reply`, ...replyArgs, replyOpts];
      return event.sender.send.apply( event.sender, replyArgs );
    };
  }

  // refine the args
  args = [panelID, message, event, ...args];
  Panel._dispatch.apply( Panel, args );
});

ipcRenderer.on('editor:ipc-main2renderer', (event, message, ...args) => {
  if ( _main2rendererOpts.apply ( null, [event, message, ...args] ) === false ) {
    Console.failed( `Message "${message}" from main to renderer failed, not responded.` );
  }
});

ipcRenderer.on('editor:ipc-reply', (event, ...args) => {
  let opts = _popOptions(args);
  let cb = _id2callback[opts.sessionId];
  if (cb) {
    delete _id2callback[opts.sessionId];
    cb.apply(null, args);
  }
});
