'use strict';

let EditorMenu = {
  checkTemplate ( template ) {
    // ensure no click
    for ( var i = 0; i < template.length; ++i ) {
      var item = template[i];

      if ( item.click ) {
        Editor.error('Not support to use click in page-level menu declaration, it may caused dead lock due to ipc problem in Electron');
        return false;
      }

      if ( item.submenu && !EditorMenu.checkTemplate(item.submenu) ) {
        return false;
      }
    }
    return true;
  },

  /**
   * @param {number} [x] - position x
   * @param {number} [y] - position y
   * @param {object} template - menu template
   */
  popup () {
    var x, y, template;
    if ( arguments.length === 1 ) {
      template = arguments[0];
    }
    else if ( arguments.length === 3 ) {
      x = arguments[0];
      y = arguments[1];
      template = arguments[2];
    }
    else {
      Editor.error( 'Invalid arguments, please try Editor.Menu.popup( x (optional), y (optional), template )' );
      return;
    }

    if ( EditorMenu.checkTemplate(template) ) {
      Editor.sendToCore('menu:popup', x, y, template, Editor.requireIpcEvent);
    }
  },

  /**
   * @param {string} name - name of the register menu
   * @param {object} tmpl - menu template
   * @param {boolean} [force] - force to register a menu even it was registered before.
   */
  register ( name, tmpl, force ) {
    if ( EditorMenu.checkTemplate(tmpl) ) {
      Editor.sendToCore('menu:register', name, tmpl, force);
    }
  },

  /**
   * @param {object[]|object} template
   * @param {function} fn
   */
  forEach ( template, fn ) {
    if ( !Array.isArray(template) ) {
      template = [template];
    }

    template.forEach(item => {
      fn(item);
      if ( item.submenu ) {
        EditorMenu.forEach( item.submenu, fn );
      }
    });
  },
};


module.exports = EditorMenu;
