var Path = require('fire-path');

module.exports = [
    'menu.js',
    'package.js',
    'selection.js',
].map( function ( file ) {
    return Path.join( __dirname, file );
});
