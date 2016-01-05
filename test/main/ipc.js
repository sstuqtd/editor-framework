'use strict';

const Electron = require('electron');
const BrowserWindow = Electron.BrowserWindow;

//
describe('Editor.Ipc', function () {
  Helper.run({
    'enable-ipc': true,
  });

  let ipc = new Editor.Ipc();
  let win = new Editor.Window();

  afterEach(function () {
    ipc.clear();
  });

  describe('Editor.sendToCore', function () {
    it('should work for simple case', function (done) {
      win.load('editor-framework://test/fixtures/ipc-main/send2core-simple.html');

      ipc.on('foobar:say-hello', (event, foo, bar) => {
        expect(BrowserWindow.fromWebContents(event.sender)).to.eql(win.nativeWin);
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        done();
      });
    });

    it('should send ipc in order', function (done) {
      win.load('editor-framework://test/fixtures/ipc-main/send2core-in-order.html');

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

        done();
      });

    });

    it('should work in main process', function (done) {
      ipc.on('foobar:say-hello', (event) => {
        console.log(event);

        done();
      });

      Editor.sendToCore('foobar:say-hello');
    });
  });

});
