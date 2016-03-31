'use strict';

/**
 * @module UI
 */
let UI = {};
module.exports = UI;

UI.DomUtils = require('./utils/dom-utils');
UI.PolymerUtils = require('./utils/polymer-utils');
UI.ResUtils = require('./utils/res-utils');
UI.DockUtils = require('./utils/dock-utils');
UI.DragDrop = require('./utils/drag-drop-utils');

UI.Resizable = require('./behaviors/resizable');
UI.focusable = require('./behaviors/focusable'); // TODO: Focusable ??
UI.Droppable = require('./behaviors/droppable');
UI.Dockable = require('./behaviors/dockable');

UI.DockResizer = require('./dock/resizer');
UI.Dock = require('./dock/dock');
UI.MainDock = require('./dock/main-dock');
UI.Tab = require('./panel/tab');
UI.Tabs = require('./panel/tabs');
UI.Panel = require('./panel/panel');

UI.WebView = require('./webview/webview');

// registry
[
  UI.DockResizer,
  UI.Dock,
  UI.MainDock,
  UI.Tab,
  UI.Tabs,
  UI.Panel,
  UI.WebView
].forEach(ctor => {
  document.registerElement(ctor.tagName, ctor);
});

// load and cache css
UI.ResUtils.loadStylesheets([
  // dock ui
  'editor-framework://lib/renderer/ui/css/resizer.css',
  'editor-framework://lib/renderer/ui/css/tab.css',
  'editor-framework://lib/renderer/ui/css/tabs.css',
  'editor-framework://lib/renderer/ui/css/dock.css',
  'editor-framework://lib/renderer/ui/css/panel.css',
]);

// load header css
window.addEventListener('load', () => {
  let cssList = [
    // common header
    'editor-framework://lib/renderer/ui/css/common.css',
    'editor-framework://lib/renderer/ui/css/layout.css',
    'editor-framework://lib/renderer/ui/css/font-face.css',
  ];

  UI.ResUtils.loadStylesheets(cssList).then(() => {
    cssList.forEach(url => {
      let styleEL = UI.ResUtils.createStyleElement(url);
      document.head.insertBefore(styleEL, document.head.firstChild);
    });
  });
});
