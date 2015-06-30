/**
 * Tasks downloading fire-shell and native modules
 * Created by nantas on 15/2/28.
 */

var gulp = require('gulp');
var updateFireShell = require('gulp-download-fire-shell');
var shell = require('gulp-shell');

var Path = require('path');
var Fs = require('fs');

var pjson = JSON.parse(Fs.readFileSync('./package.json'));
var fireshellVer = pjson['fire-shell-version'];
var electronVer = pjson['electron-version'];

/////////////////////////////////////////////////////
// inits
/////////////////////////////////////////////////////

if ( fireshellVer === null || fireshellVer === undefined ) {
    console.error( 'Can not read fire-shell-version from package.json' );
    return;
}

if ( electronVer === null || electronVer === undefined ) {
    console.error( 'Can not read electron-version from package.json' );
    return;
}

/////////////////////////////////////////////////////
// downloads
/////////////////////////////////////////////////////

gulp.task('update-electron', function(cb) {
    updateFireShell.downloadAtomShell({
        version: electronVer,
        outputDir: 'bin/electron'
    }, cb);
});

// gulp.task('update-fire-shell', function(cb) {
//     updateFireShell.downloadFireShell({
//         version: fireshellVer,
//         outputDir: 'bin/fire-shell'
//     }, cb);
// });
//
// gulp.task('update-fire-shell-china', function(cb) {
//     updateFireShell.downloadFireShell({
//         version: fireshellVer,
//         outputDir: 'bin/fire-shell',
//         chinaMirror: true
//     }, cb);
// });

gulp.task('clear-cached-downloads', function(cb) {
    updateFireShell.clearCachedDownloads({
        versionAtom: electronVer,
        versionFire: fireshellVer
    }, cb);
});
