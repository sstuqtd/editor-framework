'use strict';

let Menu = {
  checkTemplate ( template ) {
    // ensure no click
    for ( var i = 0; i < template.length; ++i ) {
      var item = template[i];

      if ( item.click ) {
        Editor.error('Not support to use click in page-level menu declaration, it may caused dead lock due to ipc problem in Electron');
        return false;
      }

      if ( item.submenu && !Menu.checkTemplate(item.submenu) ) {
        return false;
      }
    }
    return true;
  },

  /**
   * @param {object} template - menu template
   * @param {number} [x] - position x
   * @param {number} [y] - position y
   */
  popup (template, x, y) {
    if ( Menu.checkTemplate(template) ) {
      Editor.sendToCore('menu:popup', template, x, y);
    }
  },

  /**
   * @param {string} name - name of the register menu
   * @param {object} tmpl - menu template
   * @param {boolean} [force] - force to register a menu even it was registered before.
   */
  register ( name, tmpl, force ) {
    if ( Menu.checkTemplate(tmpl) ) {
      Editor.sendToCore('menu:register', name, tmpl, force);
    }
  },

  /**
   * @param {object[]|object} template
   * @param {function} fn
   */
  walk ( template, fn ) {
    if ( !Array.isArray(template) ) {
      template = [template];
    }

    template.forEach(item => {
      fn(item);
      if ( item.submenu ) {
        Menu.walk( item.submenu, fn );
      }
    });
  },
};


module.exports = Menu;
