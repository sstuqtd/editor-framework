'use strict';

const Electron = require('electron');
const Url = require('fire-url');
const Path = require('fire-path');
const Console = require('./console');

let _defaultProtocols = [
  'http:',
  'https:',
  'ftp:',
  'ssh:',
  'file:',
];
let _protocol2fn = {};

let Protocol = {};
module.exports = Protocol;

Protocol.init = function (Editor) {
  const protocol = Electron.protocol;

  // native protocol register

  // register protocol editor-framework://
  protocol.registerFileProtocol('editor-framework', (request, cb) => {
    let url = decodeURIComponent(request.url);
    let uri = Url.parse(url);

    let relativePath = uri.hostname;
    if ( uri.pathname ) {
      relativePath = Path.join( relativePath, uri.pathname );
    }

    let file = Path.join( Editor.frameworkPath, relativePath );
    cb ( { path: file } );
  }, err => {
    if ( err ) {
      Editor.failed( 'Failed to register protocol editor-Framework, %s', err.message );
      return;
    }
    Editor.success( 'protocol editor-framework registerred' );
  });

  // register protocol app://
  protocol.registerFileProtocol('app', (request, cb) => {
    let url = decodeURIComponent(request.url);
    let uri = Url.parse(url);

    let relativePath = uri.hostname;
    if ( uri.pathname ) {
      relativePath = Path.join( relativePath, uri.pathname );
    }

    let file = Path.join( Editor.App.path, relativePath );
    cb ( { path: file } );
  }, err => {
    if ( err ) {
      Editor.failed( 'Failed to register protocol app, %s', err.message );
      return;
    }
    Editor.success( 'protocol app registerred' );
  });

  // register protocol packages://
  protocol.registerFileProtocol('packages', (request, cb) => {
    let url = decodeURIComponent(request.url);
    let uri = Url.parse(url);

    let packagePath = Editor.Package.packagePath(uri.hostname);
    if ( !packagePath ) {
      return cb (-6); // net::ERR_FILE_NOT_FOUND
    }

    let packageInfo = Editor.Package.packageInfo(packagePath);
    if ( !packageInfo ) {
      return cb (-6); // net::ERR_FILE_NOT_FOUND
    }

    if ( uri.pathname.indexOf('/test') === 0 ) {
      return cb ({
        path: Path.join( packagePath, uri.pathname )
      });
    }

    return cb ({
      path: Path.join( packageInfo._destPath, uri.pathname )
    });
  }, err => {
    if ( err ) {
      Editor.failed( 'Failed to register protocol packages, %s', err.message );
      return;
    }
    Editor.success( 'protocol packages registerred' );
  });

  function _url2path ( base ) {
    return urlInfo => {
      if ( urlInfo.pathname ) {
        return Path.join( base, urlInfo.host, urlInfo.pathname );
      }
      return Path.join( base, urlInfo.host );
    };
  }

  function _packages2path ( urlInfo ) {
    let packagePath = Editor.Package.packagePath(urlInfo.hostname);
    if ( !packagePath ) {
      return '';
    }

    if ( urlInfo.pathname ) {
      return Path.join( packagePath, urlInfo.pathname );
    }
    return packagePath;
  }

  //

  Editor.Protocol.register('editor-framework', _url2path(Editor.frameworkPath));
  Editor.Protocol.register('app', _url2path(Editor.App.path));
  Editor.Protocol.register('packages', _packages2path);
}

/**
 * Convert a url by its protocol to a filesystem path. This function is useful when you try to
 * get some internal file. You can use {@link Editor.Protocol.register} to register and map your filesystem
 * path to url. By default, Editor Framework register `editor-framework://` and `app://` protocol.
 * @method url
 * @param {string} url
 * @example
 * ```js
 * // it will return "{your-app-path}/foobar/foobar.js"
 * Editor.url('app://foobar/foobar.js');
 * ```
 */
Protocol.url = function ( url ) {
  let urlInfo = Url.parse(url);

  if ( !urlInfo.protocol ) {
    return url;
  }

  if ( _defaultProtocols.indexOf(urlInfo.protocol) !== -1 ) {
    return url;
  }

  let fn = _protocol2fn[urlInfo.protocol];
  if ( !fn ) {
    Console.error( `Failed to load url ${url}, please register the protocol for it.` );
    return null;
  }

  return fn(urlInfo);
}

Protocol.reset = function () {
  _protocol2fn = {};
}

/**
 * Register a protocol so that {@link Editor.url} can use it to convert an url to the filesystem path.
 * The `fn` accept an url Object via [url.parse](https://iojs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost)
 * @method register
 * @param {string} protocol
 * @param {function} fn
 * @example
 * ```js
 * const Path = require('path');
 *
 * let _url2path = base => {
 *   return urlInfo => {
 *     if ( urlInfo.pathname ) {
 *       return Path.join( base, urlInfo.host, urlInfo.pathname );
 *     }
 *     return Path.join( base, urlInfo.host );
 *   };
 * };
 *
 * Editor.Protocol.register('editor-framework', _url2path(Editor.frameworkPath));
 * ```
 */
Protocol.register = function ( protocol, fn ) {
  _protocol2fn[protocol+':'] = fn;
};
