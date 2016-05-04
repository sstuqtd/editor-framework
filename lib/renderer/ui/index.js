'use strict';

/**
 * @module UI
 */
let UI = {};
module.exports = UI;

UI.DomUtils = require('./utils/dom-utils');
UI.DockUtils = require('./utils/dock-utils');
UI.DragDrop = require('./utils/drag-drop');
UI.FocusMgr = require('./utils/focus-mgr');
UI.ResMgr = require('./utils/resource-mgr');

UI.PolymerUtils = require('./utils/polymer-utils');
UI.PolymerFocusable = require('./behaviors/polymer-focusable');

UI.Resizable = require('./behaviors/resizable');
UI.Droppable = require('./behaviors/droppable');
UI.Dockable = require('./behaviors/dockable');
UI.Focusable = require('./behaviors/focusable');

// docks
UI.DockResizer = require('./dock/resizer');
UI.Dock = require('./dock/dock');
UI.MainDock = require('./dock/main-dock');
UI.Tab = require('./panel/tab');
UI.Tabs = require('./panel/tabs');
UI.Panel = require('./panel/panel');
UI.PanelFrame = require('./panel/frame');

// widgets
UI.Button = require('./widgets/button');

UI.WebView = require('./webview/webview');

// load and cache css
UI.ResMgr.importStylesheets([
  // docks
  'editor-framework://lib/renderer/ui/css/resizer.css',
  'editor-framework://lib/renderer/ui/css/tab.css',
  'editor-framework://lib/renderer/ui/css/tabs.css',
  'editor-framework://lib/renderer/ui/css/dock.css',
  'editor-framework://lib/renderer/ui/css/panel.css',

  // widgets
  'editor-framework://lib/renderer/ui/widgets/button.css',
]).then(() => {
  // registry custom elements
  [
    UI.DockResizer,
    UI.Dock,
    UI.MainDock,
    UI.Tab,
    UI.Tabs,
    UI.Panel,
    UI.PanelFrame,
    UI.WebView,
  ].forEach(cls => {
    document.registerElement(cls.tagName, cls);
  });

  // register widgets
  document.registerElement('ui-button', UI.Button.element);
});

document.onreadystatechange = () => {
  if ( document.readyState === 'interactive' ) {
    const Path = require('fire-path');

    // NOTE: we don't use url such as editor-framework://lib/renderer/ui/css/common.css
    // that will cause a crash if we frequently open and close window
    const dir = Editor.url('editor-framework://lib/renderer/ui/css/');
    const cssList = [
      // common header
      Path.join(dir,'common.css'),
      Path.join(dir,'layout.css'),
      Path.join(dir,'font-face.css'),
    ];
    cssList.forEach(url => {
      let link = document.createElement('link');
      link.setAttribute( 'type', 'text/css' );
      link.setAttribute( 'rel', 'stylesheet' );
      link.setAttribute( 'href', url );

      document.head.insertBefore(link, document.head.firstChild);
    });
  }
};
