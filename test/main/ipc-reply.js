'use strict';

const Electron = require('electron');
const BrowserWindow = Electron.BrowserWindow;

// const Async = require('async');

//
describe('Editor.Ipc Reply', function () {
  Helper.run({
    'enable-ipc': true,
  });

  let ipc = new Editor.Ipc();

  afterEach(function () {
    ipc.clear();
  });

  describe('Editor.sendRequestToCore', function () {
    it('should send message to main process and recieve a reply when starting a request in renderer process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/sendreq2core-simple.html');

      ipc.on('foobar:say-hello', (event, reply, foo, bar) => {
        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        reply(foo,bar);
      });

      ipc.on('foobar:reply', (event, foo, bar) => {
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        win.close();

        done();
      });
    });

    it.skip('should send message to main process and recieve a reply when starting a request in main process', function (done) {
      done();
    });

    it('should work for nested case', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/sendreq2core-nested.html');

      ipc.on('foobar:say-hello', (event, reply, foo, bar) => {
        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        reply(foo,bar);
      });

      ipc.on('foobar:say-hello-nested', (event, reply, foo, bar) => {
        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        reply(foo,bar);
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

  describe('Editor.Window.sendRequestToPage', function () {
    this.timeout(0);

    it('should send message to renderer process and recieve a reply when starting a request in main process', function (done) {
      let win = new Editor.Window();
      win.load('editor-framework://test/fixtures/ipc/sendreq2win-simple.html');

      win.nativeWin.webContents.on('dom-ready', () => {
        win.sendRequestToPage('foobar:say-hello', 'foo', 'bar', (foo,bar) => {
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
        win.sendRequestToPage('foobar:say-hello', 'foo', 'bar', (foo,bar) => {
          win.sendRequestToPage('foobar:say-hello-nested', foo, bar, (foo,bar) => {
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
