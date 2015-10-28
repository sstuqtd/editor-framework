(() => {
  'use strict';

  class IpcForward extends Editor.IpcListener {
    constructor () {
      super();
    }

    on (message) {
      super.on( message, function () {
        var args = [].slice.call( arguments, 0 );
        args.unshift( message + ':forward' );
        Editor.sendToCore.apply(Editor, args);
      });
    }

    once (message) {
      super.once( message, function () {
        var args = [].slice.call( arguments, 0 );
        args.unshift( message + ':forward' );
        Editor.sendToCore.apply(Editor, args);
      });
    }
  }

  window.IpcForward = IpcForward;
})();
