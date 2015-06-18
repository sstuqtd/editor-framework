var spawn = require('child_process').spawn;

function runGitCmdInPath(cmdArgs, path, callback) {
    console.log("git " + cmdArgs.join(' ') + ' in ' + path);
    var child = spawn('git', cmdArgs, {
        cwd: path
    });
    child.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    child.stderr.on('data', function(data) {
        if (data.toString().indexOf('error') !== -1) {
            console.log('=========error stderr===========');
        }
        if (data.toString().indexOf('Aborting') !== -1 ) {
            console.log(data.toString());
            process.kill();
        }
        console.log(data.toString());
    });
    child.on('exit', function () {
        return callback();
    });
}

module.exports = {
  runGitCmdInPath: runGitCmdInPath
};
