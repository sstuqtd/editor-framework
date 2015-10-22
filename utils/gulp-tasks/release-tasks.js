'use strict';

var Path = require('path');
var Fs = require('fire-fs');

var gulp = require('gulp');

var spawn = require('child_process').spawn;
var pjson = require('../../package.json');

var cachePath = Path.join(require('os').tmpDir(), 'editor-framework-cache');
var appLoc = process.platform === 'win32' ? 'dist/resources/app' : 'dist/editor-framework.app/Contents/Resources/app';

var cachePattern = [
  '*.js',
  '*.html',
  'builtin/**/*',
  'editor/**/*',
  'share/**/*',
  'dashboard/**/*',
];
pjson.hosts.forEach(function ( path ) {
  var name = Path.basename(path);
  cachePattern.push(name + '/**/*');
});
cachePattern = cachePattern.concat([
  '!**/test',
  '!**/tests',
  '!**/test/**/*',
  '!**/tests/**/*',
  '!utils/**/*',
  '!editor-framework/utils/**/*',
]);

// ==============================
// tasks
// ==============================

gulp.task('clean-dist', function(cb) {
  var Del = require('del');
  Del('dist', {force: true}, cb);
});

gulp.task('clean-cache', function(cb) {
  var Del = require('del');
  Del(cachePath, {force: true}, cb);
});

gulp.task('copy-to-cache', ['clean-cache'], function() {
  return gulp.src(cachePattern, {base: './'})
    .pipe(gulp.dest(cachePath))
    ;
});

gulp.task('copy-cache-to-dist', function() {
	return gulp.src('**/*', {cwd: cachePath})
    .pipe(gulp.dest(appLoc))
    ;
});

gulp.task('copy-electron-mac', function(cb) {
  Fs.ensureDirSync('dist');
  Fs.copy('bin/electron/Electron.app', 'dist/editor-framework.app', function(err) {
    if (err) {
      return cb(err);
    }

    Fs.copy(
      'utils/res/atom.icns',
      'dist/editor-framework.app/Contents/Resources/atom.icns',
      {clobber: true},
      cb
    );
  });
});

gulp.task('copy-electron-win', function(cb) {
  Fs.ensureDirSync('dist');
  Fs.copy('bin/electron', 'dist', function (err) {
    if (err) {
      return cb(err);
    }

    Fs.move('dist/electron.exe', 'dist/editor-framework.exe', cb);
  });
});

gulp.task('rename-electron-win', ['copy-electron-win'], function(cb) {
  var rcedit = require('rcedit');
  rcedit('dist/editor-framework.exe', {
    'product-version': pjson.version,
    'icon': 'utils/res/atom.ico'
  }, cb);
});

gulp.task('rename-electron-mac', ['copy-electron-mac'], function (cb) {
  // process plist
  var Plist = require('plist');
  var plistSrc = [
    'dist/editor-framework.app/Contents/Info.plist',
    'dist/editor-framework.app/Contents/Frameworks/Electron Helper.app/Contents/Info.plist'
  ];
  plistSrc.forEach(function(file) {
    var obj = Plist.parse(Fs.readFileSync(file, 'utf8'));
    obj.CFBundleDisplayName = 'editor-framework';
    obj.CFBundleIdentifier = 'com.editor-framework.www';
    obj.CFBundleName = 'editor-framework';
    obj.CFBundleExecutable = 'editor-framework';
    Fs.writeFileSync(file, Plist.build(obj), 'utf8');
  });

  // rename helper
  var srcList = [
    'dist/editor-framework.app/Contents/MacOS/Electron',
    'dist/editor-framework.app/Contents/Frameworks/Electron Helper EH.app',
    'dist/editor-framework.app/Contents/Frameworks/Electron Helper NP.app',
    'dist/editor-framework.app/Contents/Frameworks/Electron Helper.app',
    'dist/editor-framework.app/Contents/Frameworks/editor-framework Helper EH.app/Contents/MacOS/Electron Helper EH',
    'dist/editor-framework.app/Contents/Frameworks/editor-framework Helper NP.app/Contents/MacOS/Electron Helper NP',
    'dist/editor-framework.app/Contents/Frameworks/editor-framework Helper.app/Contents/MacOS/Electron Helper',
  ];

  // DISABLE
  // var spawnSync = require('child_process').spawnSync;
  // srcList.forEach(function(file) {
  //   spawnSync('mv', [file, file.replace(/Electron/, 'cocos-runtime-tool')]);
  // });
  // cb ();

  var Async = require('async');
  Async.eachSeries( srcList, function ( file, done ) {
    Fs.move(file, file.replace(/Electron/, 'editor-framework'), done);
  }, cb);
});

gulp.task('copy-app-to-dist', function() {
  var pattern = [
    'License.md',
    'apidocs/**/*',
    'bower.json',
    'docs/**/*',
    'package.json',
  ];

  return gulp.src(pattern, {base: './'})
    .pipe(gulp.dest(appLoc))
    ;
});

gulp.task('npm-install-in-dist', function(cb) {
  var Async = require('async');

  Async.series([
    // pre-install-npm
    function ( next ) {
      var child = spawn('node', ['./utils/pre-install-npm.js'], {
        stdio: 'inherit'
      });
      child.on('exit', next);
    },

    // npm install
    function ( next ) {
      var cmdStr = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      var child = spawn(cmdStr, ['install', '--production', '--ignore-scripts'], {
        cwd: appLoc,
        stdio: 'inherit'
      });
      console.log(appLoc);
      child.on('exit', next);
    },

  ], function (err) {
    cb(err);
  });
});

gulp.task('npm-rm-tests-in-dist', function(cb) {
  var Del = require('del');
  Del([
    appLoc + '/node_modules/**/test',
    appLoc + '/node_modules/**/tests',
  ], cb);
});

gulp.task('bower-install-in-dist', function(cb) {
  var cmdStr = process.platform === 'win32' ? 'bower.cmd' : 'bower';
  var child = spawn(cmdStr, ['install'], {
    cwd: appLoc,
    stdio: 'inherit'
  });

  child.on('exit', cb);
});
