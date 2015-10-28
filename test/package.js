'use strict';

const Fs = require('fire-fs');
const Path = require('fire-path');
const Async = require('async');
const App = require('app');

// NOTE: we must remove listeners for this to make sure tests can continue
App.removeAllListeners('window-all-closed');

//
describe('Editor.Package', function () {
  describe('fixtures/packages/simple (core-level)', function () {
    const path = Editor.url('editor-framework://test/fixtures/packages/simple');

    afterEach(function (done) {
      Editor.Package.unload(path, done);
    });

    it('should load simple package', function (done) {
      Editor.Package.load(path, done);
    });

    it('should unload simple package', function (done) {
      Async.series([
        next => { Editor.Package.load(path, next); },
        next => { Editor.Package.unload(path, next); },
      ],done);
    });
  });

  describe('fixtures/packages/simple (page-level)', function () {
    const pageUrl = 'editor-framework://test/fixtures/packages/page.html';
    const path = Editor.url('editor-framework://test/fixtures/packages/simple');

    assert.isTrue( Fs.existsSync(Editor.url(pageUrl)) );
    assert.isTrue( Fs.existsSync(path) );

    let win;
    let ipcListener = new Editor.IpcListener();

    beforeEach(function (done) {
      ipcListener.on('page:ready', done);

      // create main window
      win = new Editor.Window('main', {
        'title': 'Package Listener',
        'width': 400,
        'height': 400,
        'min-width': 400,
        'min-height': 400,
        'show': true,
        'resizable': false,
      });
      win.load(pageUrl);
    });

    afterEach(function (done) {
      win.close();
      win.nativeWin.on('closed', () => {
        ipcListener.clear();
        Editor.Package.unload(path, done);
      });
    });

    it('should send loaded ipc message', function (done) {
      ipcListener.on('package:loaded:forward', name => {
        expect(name).to.equal('test-simple');
        done();
      });
      Editor.Package.load(path);
    });

    it('should send unload message', function (done) {
      ipcListener.on('package:unloaded:forward', name => {
        expect(name).to.equal('test-simple');
        done();
      });

      Async.series([
        next => { Editor.Package.load(path, next); },
        next => { Editor.Package.unload(path, next); },
      ]);
    });
  });

  describe('fixtures/packages/load-deps', function () {
    const path = Editor.url('editor-framework://test/fixtures/packages/load-deps');

    afterEach(function (done) {
      Editor.Package.unload(path, done);
    });

    it('should unload load-deps package', function (done) {
      let cache = require.cache;
      let loadCacheList = [];
      Async.series([
        next => { Editor.Package.load(path, next); },
        next => {
          for ( var name in cache ) {
            loadCacheList.push(cache[name].filename);
          }
          next();
        },
        next => { Editor.Package.unload(path, next); },
        next => {
          var index;
          for (var name in cache) {
            index = loadCacheList.indexOf(cache[name].filename);
            loadCacheList.splice(index, 1);
          }

          // main.js | core/test.js
          expect(loadCacheList).to.eql([
            Path.join(path, 'main.js'),
            Path.join(path, 'core/test.js'),
            Path.join(path, 'core/foo/bar.js'),
            Path.join(path, 'test.js'),
          ]);

          next();
        },
      ], done);
    });
  });

  // it.skip('should build fixtures/packages/needs-build', function( done ) {
  // });

  // it.skip('should remove bin/dev when unload fixtures/packages/needs-build', function( done ) {
  // });
});
