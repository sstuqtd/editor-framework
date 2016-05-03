'use strict';

/**
 * @module ResUtils
 */
let ResUtils = {};
module.exports = ResUtils;

// requires
const Console = require('../../console');

let _cachedResources = {};

// ==========================
// exports
// ==========================

// stylesheet

ResUtils.loadStylesheet = function ( url ) {
  return _loadResourcePromise(url).then(
    _cacheStylesheet.bind(this, url),
    _cacheStylesheet.bind(this, url, undefined)
  );
};

ResUtils.loadStylesheets = function ( urls ) {
  if ( !Array.isArray(urls) ) {
    Console.error('The parameter must be array');
    return;
  }

  let promises = [];
  for (let i = 0; i < urls.length; ++i) {
    let url = urls[i];
    promises.push(
      _loadResourcePromise(url).then(
        _cacheStylesheet.bind(this, url),
        _cacheStylesheet.bind(this, url, undefined)
      )
    );
  }
  return Promise.all(promises);
};

ResUtils.createStyleElement = function ( url ) {
  let content = _cachedResources[url] || '';
  if ( !content ) {
    Console.error(`${url} not preloaded`);
  }

  let styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.textContent = content;
  return styleElement;
};

// script

ResUtils.loadScript = function (url) {
  return _loadResourcePromise(url).then(
    _evaluateScript.bind(this, url),
    _evaluateScript.bind(this, url, undefined)
  );
};

ResUtils.loadScripts = function (urls) {
  if ( !Array.isArray(urls) ) {
    Console.error('The parameter must be array');
    return;
  }

  let promises = [];
  for (let i = 0; i < urls.length; ++i) {
    let url = urls[i];
    promises.push(
      _loadResourcePromise(url).then(
        _evaluateScript.bind(this, url),
        _evaluateScript.bind(this, url, undefined)
      )
    );
  }
  return Promise.all(promises);
};

// template
// TODO: load template with data, get cache first

ResUtils.loadTemplate = function (url) {
  return _loadResourcePromise(url).then(
    _cacheResource.bind(this, url),
    _cacheResource.bind(this, url, undefined)
  );
};

// ==========================
// Internal
// ==========================

function _loadResourcePromise (url) {
  return new Promise(load);

  function load (fulfill, reject) {
    let xhr = new window.XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = onreadystatechange;
    xhr.send(null);

    function onreadystatechange(e) {
      if (xhr.readyState !== 4) {
        return;
      }

      // Testing harness file:/// results in 0.
      if ([0, 200, 304].indexOf(xhr.status) === -1) {
        reject(
          new Error(
            `While loading from url ${url} server responded with a status of ${xhr.status}`
          )
        );
      } else {
        fulfill(e.target.response);
      }
    }
  }
}

// DISABLE
// function _importHTMLPromise ( url ) {
//   return new Promise(load);
//   function load (fulfill, reject) {
//     let link = document.createElement('link');
//     link.rel = 'import';
//     link.href = url;
//     link.onload = function () {
//       fulfill(this);
//     };
//     link.onerror = function () {
//       reject(
//         new Error(
//           `Error loading import: ${url}`
//         )
//       );
//     };
//     document.head.appendChild(link);
//   }
// }

function _cacheResource (url, content) {
  if ( content === undefined ) {
    Console.error(`Failed to load stylesheet: ${url}`);
    _cachedResources[url] = undefined;
    return;
  }

  _cachedResources[url] = content;

  return content;
}

function _cacheStylesheet (url, content) {
  if ( content === undefined ) {
    Console.error(`Failed to load stylesheet: ${url}`);
    _cachedResources[url] = undefined;
    return;
  }

  content = content + `\n//# sourceURL=${url}`;
  _cachedResources[url] = content;

  return content;
}

function _evaluateScript (url, content) {
  if ( content === undefined ) {
    Console.error(`Failed to load script: ${url}`);
    return;
  }

  content = content + `\n//# sourceURL=${url}`;
  return window.eval(content);
}
