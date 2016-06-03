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
UI.Color = require('./elements/color');
UI.ColorPicker = require('./elements/color-picker');
UI.Input = require('./elements/input');
UI.NumInput = require('./elements/num-input');
UI.Prop = require('./elements/prop');
UI.Select = require('./elements/select');
UI.Slider = require('./elements/slider');
UI.TextArea = require('./elements/text-area');

// misc elements
UI.WebView = require('./webview/webview');

// focus functions

UI.focus = UI.FocusMgr._setFocusElement;
UI.focusParent = UI.FocusMgr._focusParent;
UI.focusNext = UI.FocusMgr._focusNext;
UI.focusPrev = UI.FocusMgr._focusPrev;

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
  'editor-framework://dist/css/elements/color-picker.css',
  'editor-framework://dist/css/elements/color.css',
  'editor-framework://dist/css/elements/input.css',
  'editor-framework://dist/css/elements/num-input.css',
  'editor-framework://dist/css/elements/prop.css',
  'editor-framework://dist/css/elements/select.css',
  'editor-framework://dist/css/elements/slider.css',
  'editor-framework://dist/css/elements/text-area.css',
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
  [
    UI.Button,
    UI.Checkbox,
    UI.Color,
    UI.ColorPicker,
    UI.Input,
    UI.NumInput,
    UI.Prop,
    UI.Select,
    UI.Slider,
    UI.TextArea,
  ].forEach(cls => {
    document.registerElement(cls.tagName, cls.element);
  });
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
