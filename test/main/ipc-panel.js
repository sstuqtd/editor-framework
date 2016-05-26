'use strict';

const Fs = require('fire-fs');
const Path = require('fire-path');

// const Async = require('async');

//
describe('Editor.IpcListener Panel', function () {
  const testPackages = Editor.url('editor-framework://test/fixtures/packages/');

  Helper.run({
    enableIpc: true,
  });

  let ipc = new Editor.IpcListener();

  afterEach(() => {
    ipc.clear();
  });

  describe('Editor.Ipc.sendToPanel', () => {
    this.timeout(5000);

    it('should send message to panel from main process', done => {
      const path = Path.join(testPackages,'panel-ipc');
      assert.isTrue( Fs.existsSync(path) );

      Editor.Package.load(path, () => {
        Editor.Panel.open('panel-ipc');

        // TODO: Panel.open should have callback
        setTimeout(() => {
          Editor.Ipc.sendToPanel('panel-ipc', 'panel-01:simple', 'foo', 'bar');
        }, 500);
      });

      ipc.on('panel-01:reply', ( event, foo, bar ) => {
        expect(foo).to.eql('foo');
        expect(bar).to.eql('bar');

        done();
      });
    });

    it('should send message to panel and recieve reply from main process', done => {
      const path = Path.join(testPackages,'panel-ipc');
      assert.isTrue( Fs.existsSync(path) );

      Editor.Package.load(path, () => {
        Editor.Panel.open('panel-ipc-02');

        // TODO: Panel.open should have callback
        setTimeout(() => {
          Editor.Ipc.sendToPanel('panel-ipc-02', 'panel-02:simple-reply', 'foo', 'bar', (err, foo, bar) => {
            expect(foo).to.eql('foo');
            expect(bar).to.eql('bar');

            done();
          });
        }, 500);
      });
    });

    // it('should send message to panel and recieve reply from renderer process', done => {
    //   const path = Path.join(testPackages,'panel-ipc');
    //   assert.isTrue( Fs.existsSync(path) );

    //   Editor.Package.load(path, () => {
    //     Editor.Panel.open('panel-ipc-02');
    //     Editor.Panel.open('panel-ipc-03');

    //     // TODO: Panel.open should have callback
    //     setTimeout(() => {
    //       ipc.on('panel-03:reply', ( event, foo, bar ) => {
    //         expect(foo).to.eql('foo');
    //         expect(bar).to.eql('bar');

    //         done();
    //       });
    //     }, 500);
    //   });
    // });
  });
});
