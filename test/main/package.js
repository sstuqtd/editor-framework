'use strict';

const Fs = require('fire-fs');
const Path = require('fire-path');
const Async = require('async');
const App = require('app');

// NOTE: we must remove listeners for this to make sure tests can continue
App.removeAllListeners('window-all-closed');

//
describe('Editor.Package', function () {
  describe('fixtures/packages/simple', function () {
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

  describe('fixtures/packages/simple ipc-message', function () {
    const path = Editor.url('editor-framework://test/fixtures/packages/simple');

    assert.isTrue( Fs.existsSync(path) );

    const spy = sinon.spy(Editor,'sendToWindows');
    const packageLoaded = spy.withArgs('package:loaded');
    const packageUnloaded = spy.withArgs('package:unloaded');

    beforeEach(function () {
      spy.reset();
    });

    it('should send loaded ipc message', function (done) {
      Editor.Package.load(path, function () {
        assert( packageLoaded.calledWith('package:loaded', 'test-simple') );
        done();
      });
    });

    it('should send unload message', function (done) {
      Async.series([
        next => { Editor.Package.load(path, next); },
        next => { Editor.Package.unload(path, next); },
      ], function () {
        assert( packageUnloaded.calledWith('package:unloaded', 'test-simple') );
        done();
      });
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
