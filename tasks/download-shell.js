/**
 * Tasks downloading electron
 * Created by nantas on 15/2/28.
 */

var gulp = require('gulp');
var shell = require('gulp-shell');
var gulpSequence = require('gulp-sequence');

var Path = require('path');
var Fs = require('fs');

var pjson = JSON.parse(Fs.readFileSync('./package.json'));
var electronVer = pjson['electron-version'];
var spawn = require('child_process').spawn;

/////////////////////////////////////////////////////
// inits
/////////////////////////////////////////////////////

if ( electronVer === null || electronVer === undefined ) {
    console.error( 'Can not read electron-version from package.json' );
    return;
}

/////////////////////////////////////////////////////
// downloads
/////////////////////////////////////////////////////

function checkElectronInstalled () {
    var binary = process.platform === 'win32' ? 'electron.exe' : 'Electron.app';
    if (Fs.existsSync(Path.join('bin', 'electron', binary)) &&
        Fs.existsSync(Path.join('bin', 'electron', 'version')) ) {
        var version = Fs.readFileSync(Path.join('bin', 'electron', 'version'), 'utf8');
        if (version === 'v' + electronVer) {
            console.log('Electron version ' + version + ' already installed in bin/electron.');
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

gulp.task('update-electron', function(cb) {
    if ( checkElectronInstalled() ) {
        cb();
    } else {
        gulpSequence('setup-mirror', 'install-electron','electron-to-bin', cb);
    }
});

function installElectron (isChina, cb) {
    var cmdstr = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    var tmpenv = process.env;
    if(isChina) {
        tmpenv.ELECTRON_MIRROR = 'http://npm.taobao.org/mirrors/electron/';
    }
    var child = spawn(cmdstr, ['install', '-g', 'electron-prebuilt'+ '@' + electronVer], {
        stdio: 'inherit',
        env: tmpenv
    });
    child.on('exit', function() {
        cb();
    });
}

gulp.task('install-electron', function(cb) {
    var mirror = JSON.parse(Fs.readFileSync('mirror-setting.json')).mirror;
    var isChina = mirror === 'china' ? true : false;
    installElectron(isChina, cb);
});

function getNpmPrefix (cb) {
    var cmdstr = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    var child = spawn('npm.cmd', ['config', 'get', 'prefix']);
    var output = '';
    child.stdout.on('data', function(data) {
        output += data.toString();
    });
    child.stdout.on('end', function(){
        cb(output.replace('\n', ''));
    });
}

gulp.task('electron-to-bin', function(cb) {
    var ncp = require('ncp');
    getNpmPrefix(function(prefix) {
        var libMod = process.platform === 'win32' ? '' : 'lib';
        var electronPath = Path.join(prefix, libMod, 'node_modules', 'electron-prebuilt', 'dist');
        console.log("copying electron from: " + electronPath);
        var mkdirp = require('mkdirp');
        mkdirp.sync('bin/electron');
        ncp(electronPath, 'bin/electron', {clobber: true}, function(err){
            if (err) return console.log('ncp Error: ' + err);
            else {
                console.log('Electron ' + Fs.readFileSync(Path.join(electronPath, 'version')) + ' has been download to bin/electron folder');
                cb();
            }
        });
    });
});

gulp.task('setup-mirror', function(cb) {
    var needBuildSetting = false;
    if ( Fs.existsSync('mirror-setting.json') ) {
        try {
            var jsonObj = JSON.parse(Fs.readFileSync('mirror-setting.json'));
            if (jsonObj.mirror) {
                return cb();
            }
        }
        catch (err) {
            needBuildSetting = true;
        }
    } else {
        needBuildSetting = true;
    }

    if (needBuildSetting) {
        var readline = require('readline');
        var rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl.question("Do you want to use mirror in China to download Electron and other dependencies? (y/n) : ", function(answer) {
            var obj = {mirror: ''};
          if (answer === 'y') {
              obj.mirror = 'china';
          } else {
              obj.mirror = 'global';
          }
          Fs.writeFileSync('mirror-setting.json', JSON.stringify(obj));
          rl.close();
          return cb();
        });
    } else {
        return cb();
    }
});
