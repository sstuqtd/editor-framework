var gulp = require('gulp');
var git = require('./utils/git.js');

// require tasks
require('./tasks/download-shell');
require('./tasks/build');
require('./tasks/build-min');
require('./tasks/build-api');

gulp.task('update-config', function ( done ) {
    var Fs = require('fs');
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

gulp.task('clean-all', ['clean', 'clean-min']);
