'use strict';

const Electron = require('electron');
const BrowserWindow = Electron.BrowserWindow;

const Async = require('async');

//
suite(tap, 'Editor.IpcListener', t => {
  helper.runEditor(t, {
    enableIpc: true,
  });

  let ipc = new Editor.IpcListener();

  t.afterEach(done => {
    ipc.clear();
    done();
  });

  suite(t, 'Editor.Ipc.sendToMain', t => {
    t.test('it should work in renderer process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2core-simple.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        t.equal(BrowserWindow.fromWebContents(event.sender), win.nativeWin);
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        win.close();
        t.end();
      });
    });

    t.test('it should work in main process', t => {
      ipc.on('foobar:say-hello-no-param', (event) => {
        t.equal(event.senderType, 'main');
      });

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        t.equal(event.senderType, 'main');
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        t.end();
      });

      Editor.Ipc.sendToMain('foobar:say-hello-no-param');
      Editor.Ipc.sendToMain('foobar:say-hello', 'foo', 'bar');
    });

    t.test('it should send ipc in order', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2core-in-order.html');

      let idx = 0;

      ipc.on('foobar:say-hello-01', ( event ) => {
        t.equal(idx, 0);
        idx += 1;

        event.sender.send('foobar:reply-from-core');
      });

      ipc.on('foobar:say-hello-02', () => {
        t.equal(idx, 1);
        idx += 1;
      });

      ipc.on('foobar:say-hello-03', () => {
        t.equal(idx, 2);
        idx += 1;
      });

      ipc.on('foobar:say-hello-04', () => {
        t.equal(idx, 3);
        idx += 1;
      });

      ipc.on('foobar:say-hello-05', () => {
        t.equal(idx, 4);
        idx += 1;

        win.close();
        t.end();
      });

    });
  });

  suite(t, 'Editor.Ipc.sendToWins', t => {
    t.test('it should send message to all windows in main process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2wins-reply.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2wins-reply.html');

      Async.each([win, win2], (w, next) => {
        w.nativeWin.webContents.on('dom-ready', () => {
          next();
        });
      }, () => {
        Editor.Ipc.sendToWins('foobar:say-hello', 'foo', 'bar');
      });

      let cnt = 0;
      ipc.on('foobar:reply', (event, foo, bar) => {
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        cnt += 1;
        if ( cnt === 2 ) {
          win.close();
          win2.close();

          t.end();
        }
      });
    });

    t.test('it should send message to all windows in renderer process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2wins-reply.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2wins-simple.html');

      let cnt = 0;
      ipc.on('foobar:reply', (event, foo, bar) => {
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        cnt += 1;
        if ( cnt === 2 ) {
          win.close();
          win2.close();

          t.end();
        }
      });
    });

    t.test('it should send message to window exclude self', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2wins-exclude-self.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2wins-reply.html');

      ipc.on('foobar:reply', (event, foo, bar) => {
        t.equal(BrowserWindow.fromWebContents(event.sender), win2.nativeWin);
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        win.close();
        win2.close();

        t.end();
      });
    });
  });

  suite(t, 'Editor.Ipc.sendToAll', t => {
    t.test('it should send message to all process in main process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        Editor.Ipc.sendToMain('foobar:reply', foo, bar);
      });

      Async.each([win, win2], (w, next) => {
        w.nativeWin.webContents.on('dom-ready', () => {
          next();
        });
      }, () => {
        Editor.Ipc.sendToAll('foobar:say-hello', 'foo', 'bar');
      });

      let cnt = 0;
      ipc.on('foobar:reply', (event, foo, bar) => {
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        cnt += 1;
        if ( cnt === 3 ) {
          win.close();
          win2.close();

          t.end();
        }
      });
    });

    t.test('it should send message to all process in renderer process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2all-simple.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        Editor.Ipc.sendToMain('foobar:reply', foo, bar);
      });

      let cnt = 0;
      ipc.on('foobar:reply', (event, foo, bar) => {
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        cnt += 1;
        if ( cnt === 3 ) {
          win.close();
          win2.close();

          t.end();
        }
      });
    });

    t.test('it should send message to all process exclude self in main process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        t.error(new Error(), 'Main process should not recieve ipc event');
        Editor.Ipc.sendToMain('foobar:reply', foo, bar);
      });

      Async.each([win, win2], (w, next) => {
        w.nativeWin.webContents.on('dom-ready', () => {
          next();
        });
      }, () => {
        Editor.Ipc.sendToAll('foobar:say-hello', 'foo', 'bar', Editor.Ipc.option({
          excludeSelf: true
        }));
      });

      let cnt = 0;
      ipc.on('foobar:reply', (event, foo, bar) => {
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        cnt += 1;
        if ( cnt === 2 ) {
          win.close();
          win2.close();

          setTimeout(() => {
            t.end();
          }, 500);
        }
      });
    });

    t.test('it should send message to all process exclude self in renderer process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2all-exclude-self.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        Editor.Ipc.sendToMain('foobar:reply', foo, bar);
      });

      let cnt = 0;
      ipc.on('foobar:reply', (event, foo, bar) => {
        if ( event.senderType === 'main' ) {
          cnt += 1;
          return;
        }

        cnt += 1;

        t.equal(BrowserWindow.fromWebContents(event.sender), win2.nativeWin);
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        win.close();
        win2.close();

        if ( cnt === 2 ) {
          t.end();
        }
      });
    });
  });

  suite(t, 'Editor.Ipc.sendToPackage', t => {
    t.test('it should send message to package\'s main process in renderer process', t => {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2pkg-simple.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        t.equal(BrowserWindow.fromWebContents(event.sender), win.nativeWin);
        t.equal(foo, 'foo');
        t.equal(bar, 'bar');

        win.close();
        t.end();
      });
    });
  });
});
