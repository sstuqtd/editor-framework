(() => {
  'use strict';

  window.EditorUI = window.EditorUI || {};

  require('./utils/dom-utils');
  require('./utils/polymer-utils');
  require('./utils/dock-utils');
  require('./utils/drag-drop-utils');

  require('./behaviors/resizable');
  require('./behaviors/focusable');
  require('./behaviors/droppable');
  require('./behaviors/dockable');

  require('./dock/resizer');
  require('./dock/main-dock');

  require('./panel/tab');
  require('./panel/tabs');

})();
