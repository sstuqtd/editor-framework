'use strict';

const Fs = require('fire-fs');
const Del = require('del');
const Path = require('path');
const Diff = require('diff');

//
describe('Editor.Package building test', function () {
  describe('test fixtures/packages/needs-build (core-level)', function () {
    const path = Editor.url('editor-framework://test/fixtures/packages/needs-build');

    after(function (done) {
      Del( Path.join(path,'bin'), done );
    });

    beforeEach(function (done) {
      sinon.spy( Editor.Package, 'build' );
      done();
    });

    afterEach(function (done) {
      Editor.Package.unload(path, () => {
        let pkgJsonPath = Path.join( path, 'package.json');
        let pkgJson = JSON.parse(Fs.readFileSync(pkgJsonPath));
        pkgJson.version = '0.0.1';
        Fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

        Editor.Package.build.restore();
        done();
      });
    });

    it('should build package before loading it', function (done) {
      Editor.Package.load(path, () => {
        expect( Editor.Package.build.calledOnce ).to.be.equal(true);
        expect( Fs.existsSync(Path.join(path,'bin/dev')) ).to.be.equal(true);

        // check package.json
        let srcJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'package.json')));
        let destJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'bin/dev/package.json')));
        let diffs = Diff.diffJson(srcJsonObj, destJsonObj);
        let realDiff = [];
        diffs.forEach(part => {
          if ( part.added || part.removed ) {
            realDiff.push(part);
          }
        });
        expect( realDiff.length ).to.be.equal(1);
        expect( realDiff[0].value ).to.be.equal('  "build": "true",\n');
        expect( realDiff[0].removed ).to.be.equal(true);

        done();
      });
    });

    it('should not build package if it is exists', function (done) {
      Editor.Package.load(path, () => {
        assert( Fs.existsSync(Path.join(path,'bin/dev')) );
        expect( Editor.Package.build.callCount ).to.be.equal(0);

        done();
      });
    });

    it('should use the built path for resources loading', function (done) {
      Editor.Package.load(path, () => {
        assert( Fs.existsSync(Path.join(path,'bin/dev')) );

        let packageInfo = Editor.Package.packageInfo(path);
        // let widgetInfo = Editor.Package.widgetInfo('simple-widget');
        let panelInfo = Editor.Package.panelInfo('needs-build.panel');

        expect( packageInfo._path ).to.be.equal( path );
        expect( packageInfo._destPath ).to.be.equal( Path.join(path,'bin/dev') );
        // expect( widgetInfo.path ).to.be.equal( Path.join(path,'bin/dev/widget') );
        expect( panelInfo.path ).to.be.equal( Path.join(path,'bin/dev') );

        done();
      });
    });

    it('should re-build package if src package.json has a different version', function (done) {
      let pkgJsonPath = Path.join( path, 'package.json');
      let pkgJson = JSON.parse(Fs.readFileSync(pkgJsonPath));
      pkgJson.version = '0.0.2';
      Fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

      Editor.Package.load(path, () => {
        expect( Editor.Package.build.calledOnce ).to.be.equal(true);
        expect( Fs.existsSync(Path.join(path,'bin/dev')) ).to.be.equal(true);

        let srcJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'package.json')));
        let destJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'bin/dev/package.json')));
        expect( srcJsonObj.version ).to.be.equal(destJsonObj.version);

        done();
      });
    });
  });
});
