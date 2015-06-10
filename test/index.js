var Path = require('fire-path');

module.exports = [
    'menu.js',
    'package.js',
    'package-build.js',
    'selection.js',
    'behaviors.js',
].map( function ( file ) {
    return Path.join( __dirname, file );
});
