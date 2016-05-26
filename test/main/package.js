'use strict';

const Fs = require('fire-fs');
const Path = require('fire-path');
const Async = require('async');

//
describe('Editor.Package', function () {
  const testPackages = Editor.url('editor-framework://test/fixtures/packages/');

  Helper.run({
    'package-search-path': [
      Editor.url('editor-framework://test/fixtures/packages/')
    ],
  });

  describe('fixtures/packages/simple', () => {
    const path = Path.join(testPackages,'simple');

    afterEach(done => {
      Editor.Package.unload(path, done);
    });

    it('should load simple package', done => {
      Editor.Package.load(path, done);
    });

    it('should unload simple package', done => {
      Async.series([
        next => { Editor.Package.load(path, next); },
        next => { Editor.Package.unload(path, next); },
      ],done);
    });
  });

  describe('fixtures/packages/simple ipc-message', () => {
    const path = Path.join(testPackages,'simple');

    assert.isTrue( Fs.existsSync(path) );

    beforeEach(() => {
      Helper.reset();
    });

    it('should send loaded ipc message', done => {
      Editor.Package.load(path, () => {
        assert( Helper.sendToWins.calledWith('editor:package-loaded', 'simple') );
        done();
      });
    });

    it('should send unload message', done => {
      Async.series([
        next => { Editor.Package.load(path, next); },
        next => { Editor.Package.unload(path, next); },
      ], () => {
        assert( Helper.sendToWins.calledWith('editor:package-unloaded', 'simple') );
        done();
      });
    });
  });

  describe('fixtures/packages/main-ipc', () => {
    const path = Path.join(testPackages,'main-ipc');

    assert.isTrue( Fs.existsSync(path) );

    it('should reply ipc messages', done => {
      Editor.Package.load(path, () => {
        Async.series([
          next => {
            Editor.Ipc.sendToMain('main-ipc:say-hello', (err, msg) => {
              expect(msg).to.equal('hello');
              next();
            });
          },
          next => {
            Editor.Ipc.sendToMain('main-ipc:say-hello-02', (err, msg) => {
              expect(msg).to.equal('hello-02');
              next();
            });
          },
          next => {
            Editor.Ipc.sendToMain('another:say-hello-03', (err, msg) => {
              expect(msg).to.equal('hello-03');
              next();
            });
          },
        ], () => {
          done();
        });

      });
    });
  });

  describe('fixtures/packages/main-deps', () => {
    const path = Path.join(testPackages,'main-deps');

    afterEach(done => {
      Editor.Package.unload(path, done);
    });

    it('should unload main-deps package', done => {
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

  describe('fixtures/packages/package-json-broken', () => {
    const path = Path.join(testPackages,'package-json-broken');

    afterEach(done => {
      Editor.Package.unload(path, done);
    });

    it('should report error when package.json broken', done => {
      Editor.Package.load(path, err => {
        assert(err);
        done();
      });
    });
  });

  describe('fixtures/packages/localize', () => {
    const path = Path.join(testPackages,'localize');

    it('should load and unload en i18n file', done => {
      Editor.Package.lang = 'en';
      Editor.Package.load(path, () => {
        expect(Editor.T('localize.search')).to.equal('Search');
        expect(Editor.T('localize.edit')).to.equal('Edit');

        Editor.Package.unload(path, () => {
          expect(Editor.i18n._phrases().localize).to.eql(undefined);
          done();
        });
      });
    });

    it('should load zh i18n file', done => {
      Editor.Package.lang = 'zh';
      Editor.Package.load(path, () => {
        expect(Editor.T('localize.search')).to.equal('搜索');
        expect(Editor.T('localize.edit')).to.equal('编辑');

        Editor.Package.unload(path, done);
      });
    });
  });

  describe('fixtures/packages/host-not-exists', () => {
    const path = Path.join(testPackages,'host-not-exists');

    afterEach(done => {
      Editor.Package.unload(path, done);
    });

    it('should report error when hosts not exists', done => {
      Editor.Package.load(path, err => {
        assert(err);
        done();
      });
    });
  });

  describe('fixtures/packages/main-js-broken', () => {
    const path = Path.join(testPackages,'main-js-broken');

    afterEach(done => {
      Editor.Package.unload(path, done);
    });

    it('should report error when failed to load main.js', done => {
      Editor.Package.load(path, err => {
        assert(err);
        done();
      });
    });
  });

  describe('fixtures/packages/package-deps', () => {
    const path1 = Path.join(testPackages,'package-deps');
    const path2 = Path.join(testPackages,'dep-01');
    const path3 = Path.join(testPackages,'dep-02');

    beforeEach(done => {
      Helper.reset();
      done();
    });

    afterEach(done => {
      Async.series([
        next => {
          Editor.Package.unload(path1, next);
        },
        next => {
          Editor.Package.unload(path2, next);
        },
        next => {
          Editor.Package.unload(path3, next);
        },
        next => {
          Editor.Package.removePath(testPackages);
          next();
        },
      ], done);
    });

    it('should load dependencies first', done => {
      Helper.spyMessages( 'sendToWins', [
        'editor:package-loaded',
      ]);
      let packageLoaded = Helper.message('sendToWins','editor:package-loaded');

      Editor.Package.load(path1, () => {
        // console.log(packageLoaded.args);
        assert( packageLoaded.getCall(0).calledWith('editor:package-loaded', 'dep-02') );
        assert( packageLoaded.getCall(1).calledWith('editor:package-loaded', 'dep-01') );
        assert( packageLoaded.getCall(2).calledWith('editor:package-loaded', 'package-deps') );

        done();
      });
    });
  });

  // it.skip('should build fixtures/packages/needs-build', done => {
  // });

  // it.skip('should remove bin/dev when unload fixtures/packages/needs-build', done => {
  // });
});
