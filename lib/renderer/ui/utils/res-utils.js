'use strict';

/**
 * @module ResUtils
 */
let ResUtils = {};
module.exports = ResUtils;

// requires
const Console = require('../../console');

let _cachedResources = {};

/**
 * @param {string} path
 * @param {string=} content
 */
function _cacheStylesheet (url, content) {
  if (!content) {
    Console.error(`Failed to load stylesheet: ${url}`);
    return;
  }
  _cachedResources[url] = content + `\n/*# url=${url} */`;
}

ResUtils.loadResourcePromise = function (url) {
  return new Promise(load);

  /**
   * @param {function(?)} fulfill
   * @param {function(*)} reject
   */
  function load (fulfill, reject) {
    var xhr = new window.XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = onreadystatechange;

    /**
     * @param {Event} e
     */
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
    xhr.send(null);
  }
}

ResUtils.loadStylesheets = function ( urls ) {
  if ( !Array.isArray(urls) ) {
    Console.error('The parameter must be array');
    return;
  }

  let promises = [];
  for (let i = 0; i < urls.length; ++i) {
    let url = urls[i];
    promises.push(
      this.loadResourcePromise(url).then(
        _cacheStylesheet.bind(this, url),
        _cacheStylesheet.bind(this, url, undefined)
      )
    );
  }
  return Promise.all(promises);
}

ResUtils.createStyleElement = function ( url ) {
  let content = _cachedResources[url] || '';
  if ( !content ) {
    Console.error(`${url} not preloaded`);
  }

  let styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.textContent = content;
  return styleElement;
}
