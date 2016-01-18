'use strict';

let EditorDevTools = {
  focus ( editorWin ) {
    let nativeWin = editorWin.nativeWin;
    nativeWin.webContents.openDevTools();
    nativeWin.devToolsWebContents.focus();
  },

  executeJavaScript ( editorWin, script ) {
    let nativeWin = editorWin.nativeWin;
    nativeWin.webContents.openDevTools();
    nativeWin.devToolsWebContents.executeJavaScript(script);
  },

  enterInspectElementMode ( editorWin ) {
    EditorDevTools.executeJavaScript(
      editorWin,
      'DevToolsAPI.enterInspectElementMode()'
    );
  },
};

module.exports = EditorDevTools;
