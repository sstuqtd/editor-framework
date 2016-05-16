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

// dock elements
UI.DockResizer = require('./dock/resizer');
UI.Dock = require('./dock/dock');
UI.MainDock = require('./dock/main-dock');
UI.Tab = require('./panel/tab');
UI.Tabs = require('./panel/tabs');
UI.Panel = require('./panel/panel');
UI.PanelFrame = require('./panel/frame');

// ui elements
UI.Button = require('./elements/button');
UI.Checkbox = require('./elements/checkbox');
UI.Input = require('./elements/input');
UI.Select = require('./elements/select');
UI.Slider = require('./elements/slider');

// misc elements
UI.WebView = require('./webview/webview');

//
UI.focus = function ( element ) {
  UI.FocusMgr._setFocusElement(element);
};

// load and cache css
UI.ResMgr.importStylesheets([
  // dock elements
  'editor-framework://dist/css/elements/resizer.css',
  'editor-framework://dist/css/elements/tab.css',
  'editor-framework://dist/css/elements/tabs.css',
  'editor-framework://dist/css/elements/dock.css',
  'editor-framework://dist/css/elements/panel.css',
  'editor-framework://dist/css/elements/panel-frame.css',

  // ui elements
  'editor-framework://dist/css/elements/button.css',
  'editor-framework://dist/css/elements/checkbox.css',
  'editor-framework://dist/css/elements/input.css',
  'editor-framework://dist/css/elements/select.css',
  'editor-framework://dist/css/elements/slider.css',
]).then(() => {
  // registry dock elements
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

  // register ui elements
  document.registerElement('ui-button', UI.Button.element);
  document.registerElement('ui-checkbox', UI.Checkbox.element);
  document.registerElement('ui-input', UI.Input.element);
  document.registerElement('ui-select', UI.Select.element);
  document.registerElement('ui-slider', UI.Slider.element);
});

document.onreadystatechange = () => {
  if ( document.readyState === 'interactive' ) {
    const Path = require('fire-path');

    // NOTE: we don't use url such as editor-framework://dist/css/globals/common.css
    // that will cause a crash if we frequently open and close window
    const dir = Editor.url('editor-framework://dist/css/globals');
    const cssList = [
      // common header
      Path.join(dir,'common.css'),
      Path.join(dir,'layout.css'),
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
