(function () {
    var Util = require('util');

    var $super = Editor.IpcListener;

    function IpcForward () {
        $super.call(this);
    }
    Util.inherits(IpcForward,$super);

    IpcForward.prototype.on = function (message) {
        $super.prototype.on.call( this, message, function () {
            var args = [].slice.call( arguments, 0 );
            args.unshift( message + ':forward' );
            Editor.sendToCore.apply(Editor, args);
        });
    };

    IpcForward.prototype.once = function (message) {
        $super.prototype.once.call( this, message, function () {
            var args = [].slice.call( arguments, 0 );
            args.unshift( message + ':forward' );
            Editor.sendToCore.apply(Editor, args);
        });
    };

    window.IpcForward = IpcForward;
})();
