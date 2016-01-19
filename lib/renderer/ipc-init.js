'use strict';

(() => {
  const Electron = require('electron');
  const ipcRenderer = Electron.ipcRenderer;

  let _nextSessionId = 1000;
  let _replyCallbacks = {};
  let _channel2replyInfo = {};

  // Communication Patterns

  /**
   * Send channel to core-level synchronized and return a result which is responded from core-level
   * @method sendToCoreSync
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   * @return results
   */
  Editor.sendToCoreSync = function (channel, ...args) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    return ipcRenderer.sendSync.apply( ipcRenderer, [channel, ...args] );
  };

  /**
   * Send channel to editor-core, which is so called as main app, or atom shell's browser side.
   * @method sendToCore
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   */
  Editor.sendToCore = function (channel, ...args) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    ipcRenderer.send.apply( ipcRenderer, [channel, ...args] );
  };

  /**
   * Broadcast channel to all pages.
   * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
   * @method sendToWindows
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   * @param {object} [options] - you can indicate the options such as Editor.selfExcluded
   */
  Editor.sendToWindows = function (channel, ...args) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    ipcRenderer.send.apply( ipcRenderer, ['editor:send2wins', channel, ...args] );
  };

  /**
   * Broadcast channel to main page.
   * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
   * @method sendToMainWindow
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   */
  Editor.sendToMainWindow = function (channel, ...args) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    ipcRenderer.send.apply( ipcRenderer, ['editor:send2mainwin', channel, ...args] );
  };

  /**
   * Broadcast channel to all pages and editor-core
   * @method sendToAll
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   * @param {object} [options] - you can indicate the options such as Editor.selfExcluded
   */
  Editor.sendToAll = function (channel, ...args) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    ipcRenderer.send.apply( ipcRenderer, ['editor:send2all', channel, ...args] );
  };

  /**
   * Send channel to specific panel
   * @method sendToPanel
   * @param {string} panelID - the panel id
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   */
  Editor.sendToPanel = function (panelID, channel, ...args) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    ipcRenderer.send.apply( ipcRenderer, ['editor:send2panel', panelID, channel, ...args] );
  };

  /**
   * Send `args...` to core via `channel` in asynchronous message, and waiting for the `core-level`
   * to reply the message through `callback`.
   * @method sendRequestToCore
   * @param {string} channel - the request channel
   * @param {...*} [arg] - whatever arguments the request needs
   * @param {function} reply - the callback used to handle replied arguments
   * @return {number} - session id, can be used in Editor.cancelRequestToCore
   */
  Editor.sendRequestToCore = function (channel, ...args) {
    if (typeof channel !== 'string') {
      Editor.error('The channel must be string');
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

    ipcRenderer.send('editor:sendreq2core', channel, sessionId, args);
    return sessionId;
  };

  /**
   * Cancel request sent to core by sessionId
   * @method cancelRequestToCore
   */
  Editor.cancelRequestToCore = function (sessionId) {
    delete _replyCallbacks[sessionId];
  };

  /**
   * Send `args...` to core via `channel` in asynchronous message, and waiting for reply
   * to reply the message through `callback`.
   * @method waitForReply
   * @param {string} channel - the request channel
   * @param {...*} [arg] - whatever arguments the request needs
   * @param {function} reply - the callback used to handle replied arguments
   * @param {number} [timeout] - timeout for the reply, if timeout = -1, it will never get expired
   * @return {number} - session id, can be used in Editor.cancelRequestToCore
   */
  Editor.waitForReply = function (channel, ...args) {
    if (typeof channel !== 'string') {
      Editor.error('The channel must be string');
      return null;
    }

    if ( !args.length ) {
      Editor.error('Invalid arguments, reply function not found!');
      return null;
    }

    // arguments check
    let reply, timeout;
    let lastArg = args[args.length - 1];

    if (typeof lastArg === 'number') {
      if ( args.length < 2 ) {
        Editor.error('Invalid arguments, reply function not found!');
        return null;
      }

      timeout = lastArg;
      args.pop();

      lastArg = args[args.length - 1];
      if (typeof lastArg !== 'function') {
        Editor.error('Invalid arguments, reply function not found!');
        return null;
      }

      reply = lastArg;
      args.pop();
    } else {
      if (typeof lastArg !== 'function') {
        Editor.error('Invalid arguments, reply function not found!');
        return null;
      }

      reply = lastArg;
      timeout = 50;
      args.pop();
    }

    var info = _channel2replyInfo[channel];
    if ( !info ) {
      info = {
        nextSessionId: 1000,
        callbacks: {},
      };
      _channel2replyInfo[channel] = info;
      ipcRenderer.on(channel+':reply', (event, sessionId, ...args) => {
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

    ipcRenderer.send.apply(ipcRenderer, ['editor:send2all', channel, sessionId, ...args]);

    return sessionId;
  };

  /**
   * Cancel wait for reply by channel and sessionId
   * @method cancelWaitForReply
   */
  Editor.cancelWaitForReply = function (channel, sessionId) {
    let info = _channel2replyInfo[channel];
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
      cb.apply(null, args);
      delete _replyCallbacks[sessionId];
    }
  });

  ipcRenderer.on('editor:send2panel', (event, panelID, channel, ...args) => {
    Editor.Panel.dispatch.apply( Editor.Panel, [panelID, channel, ...args] );
  });

  ipcRenderer.on('editor:sendreq2page', function (event, channel, sessionId, args) {
    let called = false;

    function _replyCallback (...args) {
      if ( called ) {
        Editor.error(`The callback which reply to "${channel}" can only be called once!`);
        return;
      }

      called = true;
      ipcRenderer.send( 'editor:sendreq2page:reply', sessionId, args );
    }

    args = [channel, event, _replyCallback, ...args];
    if ( !ipcRenderer.emit.apply(ipcRenderer, args) ) {
      Editor.error(`The listener of channel "${channel}" is not yet registered!`);
    }
  });

})();
