'use strict';

let MainMenu = {
  reset () {
    Editor.sendToCore('main-menu:reset');
  },

  apply () {
    Editor.sendToCore('main-menu:apply');
  },

  update ( path, template ) {
    if ( Editor.Menu.checkTemplate(template) ) {
      Editor.sendToCore('main-menu:update', path, template);
    }
  },

  add ( path, template ) {
    if ( Editor.Menu.checkTemplate(template) ) {
      Editor.sendToCore('main-menu:add', path, template);
    }
  },

  remove ( path ) {
    Editor.sendToCore('main-menu:remove', path);
  },

  set ( path, options ) {
    Editor.sendToCore('main-menu:set', path, options);
  },
};


module.exports = MainMenu;
