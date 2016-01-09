(() => {
  'use strict';

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
  Editor.sendToCoreSync = function ( channel ) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    let args = [].slice.call(arguments);
    return ipcRenderer.sendSync.apply( ipcRenderer, [channel].concat(args) );
  };

  /**
   * Send channel to editor-core, which is so called as main app, or atom shell's browser side.
   * @method sendToCore
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   */
  Editor.sendToCore = function ( channel ) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    // DELME
    // let args = [].slice.call(arguments);
    // ipcRenderer.send.apply( ipcRenderer, ['editor:send2core'].concat( args ) );

    ipcRenderer.send.apply( ipcRenderer, arguments );
  };

  /**
   * Broadcast channel to all pages.
   * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
   * @method sendToWindows
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   * @param {object} [options] - you can indicate the options such as Editor.selfExcluded
   */
  Editor.sendToWindows = function ( channel ) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    let args = [].slice.call(arguments);
    ipcRenderer.send.apply( ipcRenderer, ['editor:send2wins'].concat( args ) );
  };

  /**
   * Broadcast channel to main page.
   * The page is so called as atom shell's web side. Each application window is an independent page and has its own JavaScript context.
   * @method sendToMainWindow
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   */
  Editor.sendToMainWindow = function ( channel ) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    let args = [].slice.call(arguments);
    ipcRenderer.send.apply( ipcRenderer, ['editor:send2mainwin'].concat( args ) );
  };

  /**
   * Broadcast channel to all pages and editor-core
   * @method sendToAll
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   * @param {object} [options] - you can indicate the options such as Editor.selfExcluded
   */
  Editor.sendToAll = function ( channel ) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    let args = [].slice.call(arguments);
    ipcRenderer.send.apply( ipcRenderer, ['editor:send2all'].concat( args ) );
  };

  /**
   * Send channel to specific panel
   * @method sendToPanel
   * @param {string} panelID - the panel id
   * @param {string} channel - the channel to send
   * @param {...*} [arg] - whatever arguments the channel needs
   */
  Editor.sendToPanel = function ( panelID, channel ) {
    if ( typeof channel !== 'string' ) {
      Editor.error('The channel must be provided');
      return;
    }

    let args = [].slice.call(arguments);
    ipcRenderer.send.apply( ipcRenderer, ['editor:send2panel'].concat( args ) );
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
  Editor.sendRequestToCore = function (request) {
    if (typeof request !== 'string') {
      Editor.error('The request must be of type string');
      return null;
    }

    let args = [].slice.call(arguments,1);
    if ( args.length < 1 ) {
      Editor.error('Invalid arguments, reply function not found!');
      return null;
    }

    let reply = args[args.length - 1];
    if (typeof reply !== 'function') {
      Editor.error('Invalid arguments, reply function not found!');
      return null;
    }

    args.pop();

    let sessionId = _nextSessionId++;
    _replyCallbacks[sessionId] = reply;

    ipcRenderer.send('editor:sendreq2core', request, sessionId, args);
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
  Editor.waitForReply = function (request) {
    if (typeof request !== 'string') {
      Editor.error('The request must be of type string');
      return null;
    }

    // arguments check
    let args = [].slice.call(arguments, 1);
    let reply, timeout;

    if ( args.length < 1 ) {
      Editor.error('Invalid arguments, reply function not found!');
      return null;
    }

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

    var info = _channel2replyInfo[request];
    if ( !info ) {
      info = {
        nextSessionId: 1000,
        callbacks: {},
      };
      _channel2replyInfo[request] = info;
      ipcRenderer.on( request+':reply', function ( event, sessionId ) {
        let cb = info.callbacks[sessionId];
        if (cb) {
          let args = [].slice.call(arguments, 2);
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

    args.unshift(sessionId);
    args.unshift(request);
    ipcRenderer.send.apply( ipcRenderer, ['editor:send2all'].concat( args ) );

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

  ipcRenderer.on('editor:sendreq2core:reply', function (event, sessionId, args) {
    let cb = _replyCallbacks[sessionId];
    if (cb) {
      cb.apply(null, args);
      delete _replyCallbacks[sessionId];
    }
  });

  ipcRenderer.on('editor:send2panel', function () {
    // NOTE: remove event
    let args = [].slice.call( arguments, 1 );
    Editor.Panel.dispatch.apply( Editor.Panel, args );
  });

  ipcRenderer.on('editor:sendreq2page', function (event, request, sessionId, args) {
    let called = false;

    function _replyCallback () {
      if ( called ) {
        Editor.error(`The callback which reply to "${request}" can only be called once!`);
        return;
      }

      called = true;
      ipcRenderer.send( 'editor:sendreq2page:reply', sessionId, [].slice.call(arguments) );
    }

    args.unshift(request, event, _replyCallback);
    if ( !ipcRenderer.emit.apply(ipcRenderer, args) ) {
      Editor.error(`The listener of request "${request}" is not yet registered!`);
    }
  });

})();
