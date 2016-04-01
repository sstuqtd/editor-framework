'use strict';

describe('ipc', function () {
  this.timeout(0);

  let ipc = new Editor.IpcListener();

  afterEach(function () {
    ipc.clear();
  });

  it('is a demo', function ( done ) {
    let win = new Editor.Window();
    win.load('editor-framework://test/demo/simple/page.html');

    // win.nativeWin.webContents.on('dom-ready', () => {
    //   Editor.Ipc.sendToWins('foobar:say-hello', 'foo', 'bar');
    // });

    // ipc.on('foobar:reply', (event, foo, bar) => {
    //   expect(foo).to.eql('foo');
    //   expect(bar).to.eql('bar');
    //   // win.close();
    // });
  });
});
