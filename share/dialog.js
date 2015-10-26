'use strict';

const Ipc = require('ipc');

if ( Editor.isCoreLevel ) {
  let Dialog = require('dialog');

  let EditorDialog = {
    openFile () {
      return Dialog.showOpenDialog.apply( Dialog, arguments );
    },

    saveFile () {
      return Dialog.showSaveDialog.apply( Dialog, arguments );
    },

    messageBox () {
      return Dialog.showMessageBox.apply( Dialog, arguments );
    },
  };

  Ipc.on( 'dialog:open-file', function () {
    let event = arguments[0];
    let args = [].slice.call(arguments,1);
    event.returnValue = EditorDialog.openFile.apply( EditorDialog, args );
  });

  Ipc.on( 'dialog:save-file', function () {
    let event = arguments[0];
    let args = [].slice.call(arguments,1);
    event.returnValue = EditorDialog.saveFile.apply( EditorDialog, args );
  });

  Ipc.on( 'dialog:message-box', function () {
    let event = arguments[0];
    let args = [].slice.call(arguments,1);
    event.returnValue = EditorDialog.messageBox.apply( EditorDialog, args );
  });

  module.exports = EditorDialog;

} else if ( Editor.isPageLevel ) {
  let EditorDialog = {
    openFile () {
      let args = [].slice.call(arguments);
      args.unshift('dialog:open-file');
      return Ipc.sendSync.apply(Ipc, args);
    },

    saveFile () {
      let args = [].slice.call(arguments);
      args.unshift('dialog:save-file');
      return Ipc.sendSync.apply(Ipc, args);
    },

    messageBox () {
      let args = [].slice.call(arguments);
      args.unshift('dialog:message-box');
      return Ipc.sendSync.apply(Ipc, args);
    },
  };

  module.exports = EditorDialog;
}
