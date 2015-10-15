var Protocol = require('protocol');
var Url = require('fire-url');
var Path = require('fire-path');
var Fs = require('fire-fs');

/**
 * @module Editor
 */

// native protocol register

// register protocol editor-framework://
Protocol.registerFileProtocol('editor-framework', function(request, callback) {
    var url = decodeURIComponent(request.url);
    var uri = Url.parse(url);
    var relativePath = uri.hostname;
    if ( uri.pathname ) {
        relativePath = Path.join( relativePath, uri.pathname );
    }
    var file = Path.join( Editor.frameworkPath, relativePath );
    callback ( { path: file } );
}, function ( err ) {
    if ( err ) {
        Editor.failed( 'Failed to register protocol editor-Framework, %s', err.message );
        return;
    }
    Editor.success( 'protocol editor-framework registerred' );
} );

// register protocol app://
Protocol.registerFileProtocol('app', function(request, callback) {
    var url = decodeURIComponent(request.url);
    var uri = Url.parse(url);
    var relativePath = uri.hostname;
    if ( uri.pathname ) {
        relativePath = Path.join( relativePath, uri.pathname );
    }
    var file = Path.join( Editor.App.path, relativePath );
    callback ( { path: file } );
}, function ( err ) {
    if ( err ) {
        Editor.failed( 'Failed to register protocol app, %s', err.message );
        return;
    }
    Editor.success( 'protocol app registerred' );
} );

// register protocol packages://

Protocol.registerFileProtocol('packages', function(request, callback) {
    var url = decodeURIComponent(request.url);
    var uri = Url.parse(url);

    var packagePath = Editor.Package.packagePath(uri.hostname);
    if ( packagePath ) {
        var packageInfo = Editor.Package.packageInfo(packagePath);
        if ( packageInfo ) {
            var file = Path.join( packageInfo._destPath, uri.pathname );
            callback ( { path: file } );
            return;
        }
    }

    // net::ERR_FILE_NOT_FOUND
    callback (-6);
}, function ( err ) {
    if ( err ) {
        Editor.failed( 'Failed to register protocol packages, %s', err.message );
        return;
    }
    Editor.success( 'protocol packages registerred' );
} );

// DISABLE: this make protocol can not use relative path
// // register protocol bower://
// Protocol.registerFileProtocol('bower', function(request, callback) {
//     var url = decodeURIComponent(request.url);
//     var uri = Url.parse(url);
//     var relativePath = uri.hostname;
//     if ( uri.pathname ) {
//         relativePath = Path.join( relativePath, uri.pathname );
//     }
//     var file = Path.join( Editor.App.path, 'bower_components', relativePath );
//     callback ( { path: file } );
// }, function ( err ) {
//     if ( err ) {
//         Editor.failed( 'Failed to register protocol bower, %s', err.message );
//         return;
//     }
//     Editor.success( 'protocol bower registerred' );
// } );

// DISABLE: same reason as bower
// // register protocol widgets://
// Protocol.registerFileProtocol('widgets', function(request, callback) {
//     var url = decodeURIComponent(request.url);
//     var uri = Url.parse(url);

//     var info = Editor.Package.widgetInfo(uri.hostname);
//     if ( info ) {
//         var file = Path.join( info.path, uri.pathname );
//         callback ( { path: file } );
//         return;
//     }
//     // net::ERR_FILE_NOT_FOUND
//     callback (-6);
// }, function ( err ) {
//     if ( err ) {
//         Editor.failed( 'Failed to register protocol widgets, %s', err.message );
//         return;
//     }
//     Editor.success( 'protocol widgets registerred' );
// } );

// Editor.url protocol register

Editor._protocol2fn = {};

function _url2path ( base ) {
    return function ( urlInfo ) {
        if ( urlInfo.pathname ) {
            return Path.join( base, urlInfo.host, urlInfo.pathname );
        }
        return Path.join( base, urlInfo.host );
    };
}

function _packages2path ( urlInfo ) {
    var packagePath = Editor.Package.packagePath(urlInfo.hostname);
    if ( packagePath ) {
        return Path.join( packagePath, urlInfo.pathname );
    }
    return '';
}

/**
 * Convert a url by its protocol to a filesystem path. This function is useful when you try to
 * get some internal file. You can use {@link Editor.registerProtocol} to register and map your filesystem
 * path to url. By default, Editor Framework register `editor-framework://` and `app://` protocol.
 * @method url
 * @param {string} url
 * @example
 * ```js
 * // it will return "{your-app-path}/foobar/foobar.js"
 * Editor.url('app://foobar/foobar.js');
 * ```
 */
Editor.url = function ( url ) {
    var urlInfo = Url.parse(url);

    if ( !urlInfo.protocol ) {
        return url;
    }

    var fn = Editor._protocol2fn[urlInfo.protocol];
    if ( !fn ) {
        Editor.error( 'Failed to load url %s, please register the protocol for it.', url );
        return null;
    }

    return fn(urlInfo);
};

/**
 * Register a protocol so that {@link Editor.url} can use it to convert an url to the filesystem path.
 * The `fn` accept an url Object via [url.parse](https://iojs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost)
 * @method registerProtocol
 * @param {string} protocol
 * @param {function} fn
 * @example
 * ```js
 * var Path = require('path');
 *
 * var _url2path = function ( base ) {
 *     return function ( urlInfo ) {
 *         if ( urlInfo.pathname ) {
 *             return Path.join( base, urlInfo.host, urlInfo.pathname );
 *         }
 *         return Path.join( base, urlInfo.host );
 *     };
 * };
 *
 * Editor.registerProtocol('editor-framework', _url2path(Editor.frameworkPath));
 * ```
 */
Editor.registerProtocol = function ( protocol, fn ) {
    Editor._protocol2fn[protocol+':'] = fn;
};

Editor.registerProtocol('editor-framework', _url2path(Editor.frameworkPath));
Editor.registerProtocol('app', _url2path(Editor.App.path));
Editor.registerProtocol('packages', _packages2path);
