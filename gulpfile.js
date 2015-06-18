var gulp = require('gulp');
var git = require('./utils/git.js');
var Fs = require('fire-fs');
var Path = require('path');

// require tasks
require('./tasks/download-shell');
require('./tasks/build');
require('./tasks/build-min');
require('./tasks/build-api');

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
    var pjson = JSON.parse(Fs.readFileSync('./package.json'));
    var pkgs = pjson['shared-packages'];
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
    var pjson = JSON.parse(Fs.readFileSync('./package.json'));
    var pkgs = pjson['shared-packages'];
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
    var pjson = JSON.parse(Fs.readFileSync('./package.json'));
    var count = pjson.builtins.length;
    if (Fs.isDirSync('builtin')) {
        pjson.builtins.map(function(packageName) {
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
        pjson.builtins.map(function(packageName) {
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
    var pjson = JSON.parse(Fs.readFileSync('./package.json'));
    var count = 0;
    if (Fs.isDirSync('builtin')) {
        pjson.builtins.map(function(packageName) {
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
