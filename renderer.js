'use strict';

(() => {
  //
  try {
    const Electron = require('electron');

    // init Editor
    window.onerror = function ( message, filename, lineno, colno, err ) {
      if ( Editor && Editor.sendToWindows ) {
        Editor.sendToWindows('console:error', err.stack || err);
      } else {
        console.error(err.stack || err);
      }

      // Just let default handler run.
      return false;
    };

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

    window.addEventListener('copy', event => {
      // the element can handle the copy event
      if ( event.target !== document.body ) {
        return;
      }

      // get current focused panel
      let focusedPanel = Editor.Panel.getFocusedPanel();
      if ( focusedPanel ) {
        event.preventDefault();
        event.stopPropagation();

        EditorUI.fire(focusedPanel, 'panel-copy', {
          bubbles: false,
          detail: {
            clipboardData: event.clipboardData,
          }
        });
      }
    });

    window.addEventListener('cut', event => {
      // the element can handle the copy event
      if ( event.target !== document.body ) {
        return;
      }

      // get current focused panel
      let focusedPanel = Editor.Panel.getFocusedPanel();
      if ( focusedPanel ) {
        event.preventDefault();
        event.stopPropagation();

        EditorUI.fire(focusedPanel, 'panel-cut', {
          bubbles: false,
          detail: {
            clipboardData: event.clipboardData,
          }
        });
      }
    });

    window.addEventListener('paste', event => {
      // the element can handle the copy event
      if ( event.target !== document.body ) {
        return;
      }

      // get current focused panel
      let focusedPanel = Editor.Panel.getFocusedPanel();
      if ( focusedPanel ) {
        event.preventDefault();
        event.stopPropagation();

        EditorUI.fire(focusedPanel, 'panel-paste', {
          bubbles: false,
          detail: {
            clipboardData: event.clipboardData,
          }
        });
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

    // limit zooming
    Electron.webFrame.setZoomLevelLimits(1,1);

    // load editor-init.js
    let frameworkPath = Electron.remote.getGlobal('_Editor').url('editor-framework://');
    const Editor = require(`${frameworkPath}/lib/renderer`);

    // DISABLE: use hash instead
    // // init argument list sending from core by url?queries
    // // format: '?foo=bar&hell=world'
    // // skip '?'
    // let queryString = decodeURIComponent(location.search.substr(1));
    // let queryList = queryString.split('&');
    // let queries = {};
    // for ( let i = 0; i < queryList.length; ++i ) {
    //     let pair = queryList[i].split('=');
    //     if ( pair.length === 2) {
    //         queries[pair[0]] = pair[1];
    //     }
    // }
    // NOTE: hash is better than query from semantic, it means this is client data.
    if ( window.location.hash ) {
      let hash = window.location.hash.slice(1);
      Editor.argv = Object.freeze(JSON.parse(decodeURIComponent(hash)));
    } else {
      Editor.argv = {};
    }

    window.Editor = Editor;
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
