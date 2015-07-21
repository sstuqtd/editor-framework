var exec = require('child_process').exec;
var fs = require('fs');
var packagesObj = JSON.parse(fs.readFileSync('package.json', 'utf8')).devDependencies;
var packages = [];

for (var key in packagesObj) {
    packages.push(key+"@"+packagesObj[key]);
}
console.log(packages);

packages = packages.filter(function(pkg) {
   var pkgName = pkg.split('@')[0];
   try {
       require(pkgName);
       return false;
   } catch (err) {
       return true;
   }
});

if (packages.length > 0) {
    var proc = exec('npm install ' + packages.join(' '));
    proc.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    proc.stderr.on('data', function(data) {
        console.log(data.toString());
    });
    proc.on('exit', function() {
        console.log('Gulp task dependency installed successful! \n Please run "gulp bootstrap" to setup development environment.');
    });
} else {
    console.log('Gulp task dependency installed successful! \n Please run "gulp bootstrap" to setup development environment.');
}
