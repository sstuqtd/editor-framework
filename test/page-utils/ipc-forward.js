(function () {
    var $super = Editor.IpcListener;

    function IpcForward () {
        $super.call(this);
    }
    Editor.JS.extend(IpcForward,$super);

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
