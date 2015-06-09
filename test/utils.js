var Fs = require('fire-fs');
var App = require('app');

// NOTE: we must remove listeners for this to make sure tests can continue
App.removeAllListeners('window-all-closed');

describe('Editor.Utils.wrapError', function() {
    var pageUrl = 'editor-framework://test/fixtures/utils/page.html';

    assert.isTrue( Fs.existsSync(Editor.url(pageUrl)) );

    var win;
    var ipcListener = new Editor.IpcListener();

    beforeEach(function ( done ) {
        ipcListener.on('page:ready', done);

        // create main window
        win = new Editor.Window('main', {
            'title': 'Utils Listener',
            'width': 400,
            'height': 400,
            'min-width': 400,
            'min-height': 400,
            'show': true,
            'resizable': false,
        });
        win.load(pageUrl);
    });
    afterEach(function ( done ) {
        win.close();
        win.nativeWin.on('closed', function () {
            win.dispose();
            ipcListener.clear();
            done();
        });
    });

    it('should send error from core to page', function( done ) {
        ipcListener.on('test:report-error:success', done);
        ipcListener.on('test:report-error:failed', function ( message ) {
            throw new Error(message);
        });

        var err = new Error('This is an error from core');
        win.sendToPage( 'test:report-error', Editor.Utils.wrapError(err) );
    });

    it('should send error from page to core', function( done ) {
        ipcListener.on('test:report-error', function ( err ) {
            expect( err.message ).to.equal('This is an error from page');
            expect( err.stack ).to.be.a('String');
            done();
        });
        win.sendToPage( 'test:ask-error' );
    });
});
