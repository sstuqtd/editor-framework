'use strict';

const Electron = require('electron');
const BrowserWindow = Electron.BrowserWindow;

const Async = require('async');

//
describe('Editor.IpcListener', function () {
  Helper.run({
    enableIpc: true,
  });

  let ipc = new Editor.IpcListener();

  afterEach(function () {
    ipc.clear();
  });

  describe('Editor.Ipc.sendToMain', function () {
    it('should work in renderer process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2core-simple.html');
      this.timeout(0);

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        win.close();
        done();
      });
    });

    it('should work in main process', function (done) {
      ipc.on('foobar:say-hello-no-param', (event) => {
        expect(event.senderType).to.eql('main');
      });

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        expect(event.senderType).to.eql('main');
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        done();
      });

      Editor.Ipc.sendToMain('foobar:say-hello-no-param');
      Editor.Ipc.sendToMain('foobar:say-hello', 'foo', 'bar');
    });

    it('should send ipc in order', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2core-in-order.html');

      let idx = 0;

      ipc.on('foobar:say-hello-01', ( event ) => {
        expect(idx).to.eql(0);
        idx += 1;

        event.sender.send('foobar:reply-from-core');
      });

      ipc.on('foobar:say-hello-02', () => {
        expect(idx).to.eql(1);
        idx += 1;
      });

      ipc.on('foobar:say-hello-03', () => {
        expect(idx).to.eql(2);
        idx += 1;
      });

      ipc.on('foobar:say-hello-04', () => {
        expect(idx).to.eql(3);
        idx += 1;
      });

      ipc.on('foobar:say-hello-05', () => {
        expect(idx).to.eql(4);
        idx += 1;

        win.close();
        done();
      });

    });
  });

  describe('Editor.Ipc.sendToWins', function () {
    it('should send message to all windows in main process', function (done) {
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
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        cnt += 1;
        if ( cnt === 2 ) {
          win.close();
          win2.close();

          done();
        }
      });
    });

    it('should send message to all windows in renderer process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2wins-reply.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2wins-simple.html');

      let cnt = 0;
      ipc.on('foobar:reply', (event, foo, bar) => {
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        cnt += 1;
        if ( cnt === 2 ) {
          win.close();
          win2.close();

          done();
        }
      });
    });

    it('should send message to window exclude self', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2wins-exclude-self.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2wins-reply.html');

      ipc.on('foobar:reply', (event, foo, bar) => {
        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win2.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        win.close();
        win2.close();

        done();
      });
    });

  });

  describe('Editor.Ipc.sendToAll', function () {
    it('should send message to all process in main process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      ipc.on('foobar:say-hello', function ( event, foo, bar ) {
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
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        cnt += 1;
        if ( cnt === 3 ) {
          win.close();
          win2.close();

          done();
        }
      });
    });

    it('should send message to all process in renderer process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2all-simple.html');

      ipc.on('foobar:say-hello', function ( event, foo, bar ) {
        Editor.Ipc.sendToMain('foobar:reply', foo, bar);
      });

      let cnt = 0;
      ipc.on('foobar:reply', (event, foo, bar) => {
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        cnt += 1;
        if ( cnt === 3 ) {
          win.close();
          win2.close();

          done();
        }
      });
    });

    it('should send message to all process exclude self in main process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      ipc.on('foobar:say-hello', function ( event, foo, bar ) {
        assert(false, 'Main process should not recieve ipc event');
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
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        cnt += 1;
        if ( cnt === 2 ) {
          win.close();
          win2.close();

          setTimeout(() => {
            done();
          }, 500);
        }
      });
    });

    it('should send message to all process exclude self in renderer process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2all-exclude-self.html');

      let win2 = new Editor.Window();
      win2.load('editor-framework://test/fixtures/ipc/send2all-reply.html');

      ipc.on('foobar:say-hello', function ( event, foo, bar ) {
        Editor.Ipc.sendToMain('foobar:reply', foo, bar);
      });

      let cnt = 0;
      ipc.on('foobar:reply', (event, foo, bar) => {
        if ( event.senderType === 'main' ) {
          cnt += 1;
          return;
        }

        cnt += 1;

        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win2.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        win.close();
        win2.close();

        if ( cnt === 2 ) {
          done();
        }
      });
    });
  });

  describe('Editor.Ipc.sendToPackage', function () {
    it('should send message to package\'s main process in renderer process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2pkg-simple.html');

      ipc.on('foobar:say-hello', function ( event, foo, bar ) {
        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        done();
      });
    });
  });

});
