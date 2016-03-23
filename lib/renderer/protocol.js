'use strict';

/**
 * @module Protocol
 */
let Protocol = {};
module.exports = Protocol;

// requires
const Path = require('fire-path');
const Url = require('fire-url');

let _appPath;
let _frameworkPath;
let _remoteEditor;

Protocol.init = function (editorR) {
  _appPath = editorR.appPath;
  _frameworkPath = editorR.frameworkPath;
  _remoteEditor = editorR.remote;
};

function _url2path ( base, urlInfo ) {
  if ( urlInfo.pathname ) {
    return Path.join( base, urlInfo.host, urlInfo.pathname );
  }
  return Path.join( base, urlInfo.host );
}

// url
Protocol.url = function (url) {
  // NOTE: we cache app:// and editor-framework:// protocol to get rid of ipc-sync function calls
  let urlInfo = Url.parse(url);
  if ( urlInfo.protocol === 'app:' ) {
    return _url2path( _appPath, urlInfo );
  } else if ( urlInfo.protocol === 'editor-framework:' ) {
    return _url2path( _frameworkPath, urlInfo );
  }

  // use ipc-sync if we are not in Editor.importing state
  return _remoteEditor.url(url);
};
