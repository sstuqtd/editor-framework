var gulp = require('gulp');
var git = require('./utils/git.js');
var Fs = require('fire-fs');
var Path = require('path');
var gulpSequence = require('gulp-sequence');
var spawn = require('child_process').spawn;

// require tasks
require('./tasks/download-shell');
// require('./tasks/build');
// require('./tasks/build-min');
// require('./tasks/build-api');

gulp.task('bootstrap', gulpSequence('npm-rebuild', ['update-electron','install-builtin', 'install-shared-packages']));

gulp.task('update-config', function ( done ) {
    var utils = require('./tasks/utils');

    var appJson = JSON.parse(Fs.readFileSync('./package.json'));
    var frameworkJson = JSON.parse(Fs.readFileSync('./editor-framework/package.json'));

    utils.mixin( frameworkJson.dependencies, appJson.dependencies );
    utils.mixin( frameworkJson.devDependencies, appJson.devDependencies );

    Fs.writeFileSync('./package.json', JSON.stringify(frameworkJson, null, 2));

    done();
});

gulp.task('install-shared-packages', function(cb) {
    var appJson = JSON.parse(Fs.readFileSync('./package.json'));
    var pkgs = appJson['shared-packages'];
    var count = pkgs.length;
    pkgs.forEach(function(pkg) {
        if (!Fs.existsSync(Path.join(pkg, '.git'))) {
            git.runGitCmdInPath(['clone', 'https://github.com/fireball-packages/' + pkg], './', function() {
                git.runGitCmdInPath(['fetch', '--all'], pkg, function() {
                    console.log('Remote head updated!');
                    if (--count <= 0) {
                        console.log('Shared packages installation complete!');
                        cb();
                    }
                });
            });
        } else {
            console.log(pkg + ' has already installed in ./' + pkg + ' folder!');
            if (--count <= 0) {
                console.log('Shared packages installation complete!');
                cb();
            }
        }
    });
});

gulp.task('update-shared-packages', function(cb) {
    var appJson = JSON.parse(Fs.readFileSync('./package.json'));
    var pkgs = appJson['shared-packages'];
    var count = pkgs.length;
    pkgs.forEach(function(pkg) {
        if (Fs.existsSync(Path.join(pkg, '.git'))) {
            git.runGitCmdInPath(['pull', 'https://github.com/fireball-packages/' + pkg, 'master'], pkg, function() {
                git.runGitCmdInPath(['fetch', '--all'], pkg, function() {
                    console.log('Remote head updated!');
                    if (--count <= 0) {
                        console.log('Sahred packages update complete!');
                        cb();
                    }
                });
            });
        } else {
            console.warn('Shared package ' + pkg + ' not initialized, please run "gulp install-shared-packages" first!');
            cb();
            process.exit();
        }
    });
});

gulp.task('install-builtin', function(cb) {
    var appJson = JSON.parse(Fs.readFileSync('./package.json'));
    var count = appJson.builtins.length;
    if (Fs.isDirSync('builtin')) {
        appJson.builtins.map(function(packageName) {
            if (!Fs.existsSync(Path.join('builtin', packageName, '.git'))) {
                git.runGitCmdInPath(['clone', 'https://github.com/fireball-packages/' + packageName], 'builtin', function() {
                    if (--count <= 0) {
                        console.log('Builtin packages installation complete!');
                        cb();
                    }
                });
            } else {
                console.log(packageName + ' has already installed in builtin/' + packageName + ' folder!');
                console.log(count);
                if (--count <= 0) {
                    cb();
                }
            }
        });
    } else {
        Fs.mkdirSync('builtin');
        appJson.builtins.map(function(packageName) {
            count++;
            git.runGitCmdInPath(['clone', 'https://github.com/fireball-packages/' + packageName], 'builtin', function() {
                if (--count <= 0) {
                    console.log('Builtin packages installation complete!');
                    cb();
                }
            });
        });
    }
});

gulp.task('update-builtin', function(cb) {
    var appJson = JSON.parse(Fs.readFileSync('./package.json'));
    var count = 0;
    if (Fs.isDirSync('builtin')) {
        appJson.builtins.map(function(packageName) {
            if (Fs.existsSync(Path.join('builtin', packageName, '.git'))) {
                count++;
                git.runGitCmdInPath(['pull', 'https://github.com/fireball-packages/' + packageName, 'master'], Path.join('builtin', packageName), function() {
                    git.runGitCmdInPath(['fetch', '--all'], Path.join('builtin', packageName), function() {
                        console.log('Remote head updated!');
                        if (--count <= 0) {
                            console.log('Builtin packages update complete!');
                            cb();
                        }
                    });
                });
            } else {
                console.warn('Builtin package ' + packageName + ' not initialized, please run "gulp install-builtin" first!');
                cb();
                process.exit();
            }
        });
    } else {
        console.warn('Builtin folder not initialized, please run "gulp install-builtin" first!');
        return cb();
    }
});

gulp.task('clean-all', ['clean', 'clean-min']);

// gulp.task('rm-native-modules', function(cb) {
//     var del = require('del');
//     var appJson = JSON.parse(Fs.readFileSync('./package.json'));
//     var nativeModules = appJson['native-modules'];
//     var nativePaths = nativeModules.map(function(filepath) {
//         return 'node_modules/' + filepath;
//     });
//     console.log("Deleting existing native modules to make sure rebuild triggers.");
//     del(nativePaths, function(err) {
//         if (err) throw err;
//         else cb();
//     });
// });

function findNativeModulePathRecursive(path) {
    var nativePaths = [];
    if (Fs.existsSync(Path.join(path, 'binding.gyp'))) {
        nativePaths.push(path);
    } else {
        if (Fs.isDirSync(Path.join(path, 'node_modules'))) {
            var subPaths = Fs.readdirSync(Path.join(path, 'node_modules'));
            subPaths.forEach(function(subpath) {
                var subCollect = findNativeModulePathRecursive(Path.join(path, 'node_modules', subpath));
                if (subCollect.length > 0) {
                    nativePaths = nativePaths.concat(subCollect);
                }
            });
        }
    }
    return nativePaths;
}

gulp.task('npm-rebuild', function(cb) {
    var cmdstr = process.platform === 'win32' ? 'node-gyp.cmd' : 'node-gyp';
    var appJson = JSON.parse(Fs.readFileSync('./package.json'));
    var tmpenv = process.env;
    tmpenv.HOME = process.platform === 'win32' ? Path.join(tmpenv.HOMEPATH, '.node-gyp') : Path.join(tmpenv.HOME, '.electron-gyp');
    var disturl = 'https://atom.io/download/atom-shell';
    var target = appJson['electron-version'];
    var arch = process.platform === 'win32' ? 'ia32' : 'x64';
    var nativePaths = findNativeModulePathRecursive('.');
    console.log('rebuilding native modules: \n' + nativePaths);
    var count = nativePaths.length;
    nativePaths.forEach(function(path) {
        var child = spawn(cmdstr, [
            'rebuild', '--target='+target,
            '--arch='+arch, '--dist-url='+disturl
            ], {
            stdio: 'inherit',
            env: tmpenv,
            cwd: path
        });
        child.on('exit', function() {
            if (--count <= 0) {
                cb();
            }
        });
    });
});

gulp.task('run', function(cb) {
    var cmdStr = '';
    var optArr = [];
    if (process.platform === "win32") {
        cmdStr = 'bin\\electron\\electron.exe';
        optArr = ['.\\', '--debug=3030', '--dev', '--show-devtools'];
    } else {
        cmdStr = 'bin/electron/Electron.app/Contents/MacOS/Electron';
        optArr = ['./', '--debug=3030', '--dev', '--show-devtools'];
    }
    var child = spawn(cmdStr, optArr, {
        stdio: 'inherit'
    });
    child.on('exit', function() {
        cb();
    });
});
