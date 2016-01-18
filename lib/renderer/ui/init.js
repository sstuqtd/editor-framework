(() => {
  'use strict';

  let _cachedResources = {};

  /**
   * @param {string} path
   * @param {string=} content
   */
  function _cacheStylesheet (url, content) {
    if (!content) {
      Editor.error(`Failed to load stylesheet: ${url}`);
      return;
    }
    _cachedResources[url] = content + `\n/*# url=${url} */`;
  }

  window.EditorUI = window.EditorUI || {

    loadResourcePromise (url) {
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
    },

    loadStylesheets ( urls ) {
      if ( !Array.isArray(urls) ) {
        Editor.error('The parameter must be array');
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
      return Promise.all(promises).then(undefined);
    },

    createStyleElement ( url ) {
      let content = _cachedResources[url] || '';
      if ( !content ) {
        Editor.error(`${url} not preloaded`);
      }

      let styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.textContent = content;
      return styleElement;
    },
  };

  require('./utils/dom-utils');
  require('./utils/polymer-utils');
  require('./utils/dock-utils');
  require('./utils/drag-drop-utils');

  require('./behaviors/resizable');
  require('./behaviors/focusable');
  require('./behaviors/droppable');
  require('./behaviors/dockable');

  require('./dock/resizer');
  require('./dock/dock');
  require('./dock/main-dock');
  require('./dock/panel/tab');
  require('./dock/panel/tabs');
  require('./dock/panel/panel');

  require('./webview/webview');

  // load and cache css
  EditorUI.loadStylesheets([
    'editor-framework://lib/renderer/ui/css/resizer.css',
    'editor-framework://lib/renderer/ui/css/tab.css',
    'editor-framework://lib/renderer/ui/css/tabs.css',
    'editor-framework://lib/renderer/ui/css/dock.css',
    'editor-framework://lib/renderer/ui/css/panel.css',
  ]);

  // add common css file
  window.onload = function () {
    // let styleEL = EditorUI.createStyleElement('editor-framework://lib/renderer/ui/css/common.css');
    // document.head.insertBefore(styleEL, document.head.firstChild);
  };

})();
