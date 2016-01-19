'use strict';

(() => {
  //
  try {
    // init document events

    // prevent default drag
    document.addEventListener( 'dragstart', event => {
      event.preventDefault();
      event.stopPropagation();
    });
    document.addEventListener( 'drop', event => {
      event.preventDefault();
      event.stopPropagation();
    });
    document.addEventListener( 'dragover', event => {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'none';
    });

    // prevent contextmenu
    document.addEventListener( 'contextmenu', event => {
      event.preventDefault();
      event.stopPropagation();
    });

    // TODO: should we use webContents.clearHistory() instead?
    // prevent go back
    document.addEventListener( 'keydown', event => {
      if ( event.keyCode === 8 ) {
        if ( event.target === document.body ) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    });

    // DISABLE: looks like setting the `body: { overflow: hidden; }` will solve the problem
    // window.onload = function () {
    //     // NOTE: this will prevent mac touchpad scroll the body
    //     document.body.onscroll = function ( event ) {
    //         document.body.scrollLeft = 0;
    //         document.body.scrollTop = 0;
    //     };
    // };

    // DISABLE: I disable this because developer may debug during initialize,
    //          and when he refresh at that time, the layout will be saved and
    //          reloaded layout will not be the expected one
    // window.onunload = function () {
    //     if ( Editor && Editor.Panel ) {
    //         // NOTE: do not use Editor.saveLayout() which will be invoked in requestAnimationFrame.
    //         // It will not be called in window.onunload
    //         Editor.sendToCore(
    //           'window:save-layout',
    //           Editor.Panel.dumpLayout()
    //         );
    //     }
    //     else {
    //         Editor.sendToCore(
    //           'window:save-layout',
    //           null
    //         );
    //     }
    // };

    window.onerror = function ( message, filename, lineno, colno, err ) {
      if ( Editor && Editor.sendToWindows ) {
        Editor.sendToWindows('console:error', err.stack || err);
      } else {
        console.error(err.stack || err);
      }

      // Just let default handler run.
      return false;
    };

    const Electron = require('electron');

    // limit zooming
    Electron.webFrame.setZoomLevelLimits(1,1);

    // load editor-init.js
    let frameworkPath = Electron.remote.getGlobal('Editor').url('editor-framework://');
    require( `${frameworkPath}/lib/renderer/editor-init` );
  } catch ( err ) {
    window.onload = function () {
      const Electron = require('electron');

      let currentWindow = Electron.remote.getCurrentWindow();
      currentWindow.setSize(800, 600);
      currentWindow.center();
      currentWindow.show();
      currentWindow.openDevTools();

      console.error(err.stack || err);
    };
  }
})();
