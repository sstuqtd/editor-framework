var Fs = require('fire-fs');
var Async = require('async');
var Del = require('del');
var Path = require('path');
var Diff = require('diff');

//
describe('Editor.Package building test', function() {
    describe('test fixtures/packages/needs-build (core-level)', function() {
        var path = Editor.url('editor-framework://test/fixtures/packages/needs-build');

        after(function ( done ) {
            Del( Path.join(path,'bin'), done );
        });
        beforeEach(function ( done ) {
            sinon.spy( Editor.Package, 'build' );
            done();
        });
        afterEach(function ( done ) {
            Editor.Package.unload(path, function () {
                var pkgJsonPath = Path.join( path, 'package.json');
                var pkgJson = JSON.parse(Fs.readFileSync(pkgJsonPath));
                pkgJson.version = '0.0.1';
                Fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

                Editor.Package.build.restore();
                done();
            });
        });

        it('should build package before loading it', function( done ) {
            Editor.Package.load(path, function () {
                expect( Editor.Package.build.calledOnce ).to.be.equal(true);
                expect( Fs.existsSync(Path.join(path,'bin/dev')) ).to.be.equal(true);

                // check package.json
                var srcJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'package.json')));
                var destJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'bin/dev/package.json')));
                var diffs = Diff.diffJson(srcJsonObj, destJsonObj);
                var realDiff = [];
                diffs.forEach(function(part){
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

        it('should not build package if it is exists', function( done ) {
            Editor.Package.load(path, function () {
                assert( Fs.existsSync(Path.join(path,'bin/dev')) );
                expect( Editor.Package.build.callCount ).to.be.equal(0);

                done();
            });
        });

        it('should use the built path for resources loading', function( done ) {
            Editor.Package.load(path, function () {
                assert( Fs.existsSync(Path.join(path,'bin/dev')) );

                var packageInfo = Editor.Package.packageInfo(path);
                // var widgetInfo = Editor.Package.widgetInfo('simple-widget');
                var panelInfo = Editor.Package.panelInfo('needs-build.panel');

                expect( packageInfo._path ).to.be.equal( path );
                expect( packageInfo._destPath ).to.be.equal( Path.join(path,'bin/dev') );
                // expect( widgetInfo.path ).to.be.equal( Path.join(path,'bin/dev/widget') );
                expect( panelInfo.path ).to.be.equal( Path.join(path,'bin/dev') );

                done();
            });
        });

        it('should re-build package if src package.json has a different version', function( done ) {
            var pkgJsonPath = Path.join( path, 'package.json');
            var pkgJson = JSON.parse(Fs.readFileSync(pkgJsonPath));
            pkgJson.version = '0.0.2';
            Fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

            Editor.Package.load(path, function () {
                expect( Editor.Package.build.calledOnce ).to.be.equal(true);
                expect( Fs.existsSync(Path.join(path,'bin/dev')) ).to.be.equal(true);

                var srcJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'package.json')));
                var destJsonObj = JSON.parse(Fs.readFileSync( Path.join( path, 'bin/dev/package.json')));
                expect( srcJsonObj.version ).to.be.equal(destJsonObj.version);

                done();
            });
        });
    });
});
