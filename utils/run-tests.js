var Path = require('path');
var Fs = require('fs');
var Chalk = require('chalk');
var SpawnSync = require('child_process').spawnSync;

var exePath = '';
var cwd = process.cwd();

if ( process.platform === 'darwin' ) {
    exePath = Path.join(cwd, 'bin/electron/Electron.app/Contents/MacOS/Electron');
}
else {
    exePath = Path.join(cwd, 'bin/electron/Electron.exe');
}

var files;
var singleTestFile = process.argv[2];

// accept
if (singleTestFile) {
  singleTestFile = ('./test/' + process.argv[2] + '.js').replace('.js.js', '.js');
  SpawnSync(exePath, [cwd, '--test', singleTestFile], {stdio: 'inherit'});
}
else {
    var indexFile = Path.join( cwd, 'test/index.js' );
    if ( Fs.existsSync(indexFile) ) {
        files = require(indexFile);
        files.forEach(function ( file ) {
            var testfile = Path.join( Path.dirname(indexFile), file );
            console.log( Chalk.magenta( 'Start test (' + testfile + ')') );
            SpawnSync(exePath, [cwd, '--test', testfile], {stdio: 'inherit'});
        });
    }
    else {
        console.error('Can not find index.js in %s', path);
    }
}
