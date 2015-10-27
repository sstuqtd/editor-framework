'use strict';

const Fs = require('fire-fs');
const App = require('app');

// NOTE: we must remove listeners for this to make sure tests can continue
App.removeAllListeners('window-all-closed');

describe('Editor.Utils.wrapError', () => {
  const pageUrl = 'editor-framework://test/fixtures/utils/page.html';

  assert.isTrue( Fs.existsSync(Editor.url(pageUrl)) );

  let win;
  let ipcListener = new Editor.IpcListener();

  beforeEach(done => {
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

  afterEach(done => {
    win.close();
    win.nativeWin.on('closed', () => {
      ipcListener.clear();
      done();
    });
  });

  it('should send error from core to page', done => {
    ipcListener.on('test:report-error:success', done);
    ipcListener.on('test:report-error:failed', message => {
      throw new Error(message);
    });

    let err = new Error('This is an error from core');
    win.sendToPage( 'test:report-error', Editor.Utils.wrapError(err) );
  });

  it('should send error from page to core', done => {
    ipcListener.on('test:report-error', err => {
      expect( err.message ).to.equal('This is an error from page');
      expect( err.stack ).to.be.a('String');
      done();
    });
    win.sendToPage( 'test:ask-error' );
  });
});
