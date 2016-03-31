'use strict';

const Electron = require('electron');
const BrowserWindow = Electron.BrowserWindow;

// const Async = require('async');

//
describe('Editor.IpcListener Reply', function () {
  Helper.run({
    enableIpc: true,
  });

  let ipc = new Editor.IpcListener();

  afterEach(function () {
    ipc.clear();
  });

  describe('Editor.Ipc.sendToMain', function () {
    it('should send message to main process and recieve a reply when starting a request in renderer process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2main-reply-simple.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        event.reply(foo,bar);
      });

      ipc.on('foobar:reply', (event, foo, bar) => {
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        win.close();

        done();
      });
    });

    it('should send message to main process and recieve a reply when starting a request in main process', function (done) {
      ipc.on('foobar:say-hello', (event, foo, bar) => {
        expect(event.senderType).to.eql('main');
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');
        expect(event.reply).is.a('function');

        event.reply( foo, bar );
      });

      Editor.Ipc.sendToMain('foobar:say-hello', 'foo', 'bar', ( foo, bar ) => {
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        done();
      });
    });

    it('should work for nested case', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/send2main-reply-nested.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        event.reply(foo,bar);
      });

      ipc.on('foobar:say-hello-nested', (event, foo, bar) => {
        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        event.reply(foo,bar);
      });

      ipc.on('foobar:reply', (event, foo, bar) => {
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        win.close();

        done();
      });
    });

    it.skip('should close the function when timeout', function (done) {
      done();
    });
  });

  describe('Editor.Window.send', function () {
    this.timeout(0);

    it('should send message to renderer process and recieve a reply when starting a request in main process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/sendreq2win-simple.html');

      win.nativeWin.webContents.on('dom-ready', () => {
        win.send('foobar:say-hello', 'foo', 'bar', (foo,bar) => {
          expect(foo).to.eql('foo');
          expect(bar).to.eql('bar');

          win.close();
          done();
        });
      });
    });

    it('should work for nested case', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/sendreq2win-nested.html');

      win.nativeWin.webContents.on('dom-ready', () => {
        win.send('foobar:say-hello', 'foo', 'bar', (foo,bar) => {
          win.send('foobar:say-hello-nested', foo, bar, (foo,bar) => {
            expect(foo).to.eql('foo');
            expect(bar).to.eql('bar');

            win.close();
            done();
          });
        });
      });
    });

    it.skip('should close the function when timeout', function (done) {
      done();
    });
  });

});
