var Fs = require('fire-fs');
var Async = require('async');
var App = require('app');

// NOTE: we must remove listeners for this to make sure tests can continue
App.removeAllListeners('window-all-closed');

//
describe('Editor.Package', function() {
    describe('fixtures/packages/simple (core-level)', function() {
        var path = Editor.url('editor-framework://test/fixtures/packages/simple');

        afterEach(function ( done ) {
            Editor.Package.unload(path, done);
        });

        it('should load simple package', function( done ) {
            Editor.Package.load(path, done);
        });

        it('should unload simple package', function( done ) {
            Async.series([
                function (next) { Editor.Package.load(path, next); },
                function (next) { Editor.Package.unload(path, done); },
            ]);
        });
    });

    describe('fixtures/packages/simple (page-level)', function() {
        var pageUrl = 'editor-framework://test/fixtures/packages/page.html';
        var path = Editor.url('editor-framework://test/fixtures/packages/simple');

        assert.isTrue( Fs.existsSync(Editor.url(pageUrl)) );
        assert.isTrue( Fs.existsSync(path) );

        var win;
        var ipcListener = new Editor.IpcListener();

        beforeEach(function ( done ) {
            ipcListener.on('page:ready', done);

            // create main window
            win = new Editor.Window('main', {
                'title': 'Package Listener',
                'width': 400,
                'height': 400,
                'min-width': 400,
                'min-height': 400,
                'show': true,
                'resizable': true,
            });
            win.load(pageUrl);
        });
        afterEach(function ( done ) {
            win.close();
            win.nativeWin.on('closed', function () {
                win.dispose();
                ipcListener.clear();
                Editor.Package.unload(path, done);
            });
        });

        it('should send loaded ipc message', function( done ) {
            ipcListener.on('package:loaded:forward', function ( name ) {
                expect(name).to.equal('test-simple');
                done();
            });
            Editor.Package.load(path);
        });

        it('should send unload message', function( done ) {
            ipcListener.on('package:unloaded:forward', function ( name ) {
                expect(name).to.equal('test-simple');
                done();
            });

            Async.series([
                function (next) { Editor.Package.load(path, next); },
                function (next) { Editor.Package.unload(path, next); },
            ]);
        });
    });

    // it.skip('should build fixtures/packages/needs-build', function( done ) {
    // });

    // it.skip('should remove bin/dev when unload fixtures/packages/needs-build', function( done ) {
    // });
});
