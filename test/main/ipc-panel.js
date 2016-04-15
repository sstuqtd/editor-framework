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

  afterEach(function () {
    ipc.clear();
  });

  // TODO: currently, panel is depends on Polymer, fuuuuuuuuck.
  describe('Editor.Ipc.sendToPanel', function () {
    this.timeout(5000);

    it.skip('should send message to panel from main process', function (done) {
      const path = Path.join(testPackages,'panel-ipc');
      assert.isTrue( Fs.existsSync(path) );

      Editor.Package.load(path, function () {
        Editor.Panel.open('panel-ipc.panel');

        // TODO: Panel.open should have callback
        setTimeout(() => {
          Editor.Ipc.sendToPanel('panel-ipc', 'foobar:simple', 'foo', 'bar');
        }, 500);
      });

      ipc.on('foobar:reply', ( event, foo, bar ) => {
        expect(foo).to.be('foo');
        expect(bar).to.be('bar');

        done();
      });
    });
  });
});
