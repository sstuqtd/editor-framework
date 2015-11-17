'use strict';

// NOTE: This is test runner for editor-framework, it covers the test cases for developing editor-framework
// It is different than github.com/fireball-packages/tester, which is for package developers to test their pacakges.

const Path = require('fire-path');
const Fs = require('fire-fs');
const Async = require('async');

// ==============================
// Builder
// ==============================

const Builder = {
  //
  buildPackage ( path, cb ) {
    let packageJsonPath = Path.join( path, 'package.json' );
    let packageObj;

    try {
      packageObj = JSON.parse(Fs.readFileSync(packageJsonPath));
    } catch (err) {
      if ( cb ) {
        cb ( new Error( `Failed to load 'package.json': ${err.message}` ) );
      }
      return;
    }

    if ( !packageObj.build ) {
      if ( cb ) {
        cb ();
      }
      return;
    }

    Editor.info(`=== Build ${path} ===`);
    Editor.Package.build(path, cb);
  },

  // run
  run ( path ) {
    // build all-packages
    if ( !path ) {
      path = Path.join( Editor.App.path, 'builtin' );
      let files = Fs.readdirSync(path);

      Async.eachSeries( files, (name, done) => {
        let packagePath = Path.join(path,name);
        if ( !Fs.isDirSync(packagePath) ) {
          done();
          return;
        }
        Builder.buildPackage(packagePath, done);
      }, err => {
        if ( err ) {
          Editor.error(`Building failed: ${err.message}`);
          process.exit(1);
        }
        process.exit(0);
      });

      return;
    }

    //
    if ( !Fs.existsSync(path) ) {
      Editor.error(`The path ${path} you provide does not exist.`);
      process.exit(1);
      return;
    }

    //
    Builder.buildPackage( path, err => {
      if ( err ) {
        Editor.error(`Failed to build ${path}: ${err.message}`);
        process.exit(1);
      }
      process.exit(0);
    });

  },
};

module.exports = Builder;
