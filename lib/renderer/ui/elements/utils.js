'use strict';

let Utils = {};
module.exports = Utils;

let _type2proto = {};

// requires
const Console = require('../../console');
const JS = require('../../../share/js-utils');
const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');

// ==========================
// exports
// ==========================

Utils.registerElement = function ( name, def ) {
  let template = def.template;
  let style = def.style;
  let listeners = def.listeners;
  let behaviors = def.behaviors;
  let selectors = def.$;
  let created = def.created;

  let module = function () {
    let el = document.createElement(name);

    if ( created ) {
      created.apply(el, arguments);
    }

    return el;
  };

  module.prototype = Object.create(HTMLElement.prototype);

  // TODO: dependencies

  // NOTE: do not use delete to change def, we need to reuse def since it was cached
  JS.assignExcept(module.prototype, def, [
    'dependencies', 'created',
    'template', 'style', 'listeners', 'behaviors', '$'
  ]);

  // addon behaviors
  if ( behaviors ) {
    behaviors.forEach(be => {
      JS.addon(module.prototype, be);
    });
  }

  // constructor
  module.prototype.constructor = module;

  // created callback
  module.prototype.createdCallback = function () {
    let root = this.createShadowRoot();

    // instantiate template
    if ( template ) {
      root.innerHTML = template;
    }

    // insert style
    if ( style ) {
      let styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.textContent = style;

      root.insertBefore( styleElement, root.firstChild );
    }

    // update selector
    if ( selectors ) {
      for ( let name in selectors ) {
        if ( this[`$${name}`] ) {
          Console.warn(`failed to assign selector $${name}, already used`);
          continue;
        }

        this[`$${name}`] = root.querySelector(selectors[name]);
      }
    }

    // add event listeners
    if ( listeners ) {
      for ( let name in listeners ) {
        this.addEventListener(name, listeners[name].bind(this));
      }
    }

    // ready
    if ( this.ready ) {
      this.ready();
    }
  };

  Object.defineProperty(module, 'tagName', {
    get () { return name.toUpperCase(); },
  });

  // register element
  // NOTE: registerElement will return a constructor
  document.registerElement(name, module);

  return module;
};

Utils.registerProperty = function ( type, protoOrUrl ) {
  _type2proto[type] = protoOrUrl;
};

Utils.unregisterProperty = function ( type ) {
  delete _type2proto[type];
};

Utils.regenProperty = function ( propEL, cb ) {
  let proto = _type2proto[propEL._type];
  if ( !proto ) {
    return;
  }

  // if file
  if ( typeof proto === 'string' ) {
    ResMgr.importScript(proto)
      .then(proto => {
        try {
          _doRegen(propEL, proto, cb);
        } catch (err) {
          // TODO: create error element
          Console.error(err);

          if ( cb ) {
            cb (err);
          }
        }
      })
      .catch(err => {
        // TODO: create error element
        Console.error(err);

        if ( cb ) {
          cb (err);
        }
      })
      ;

    return;
  }

  // else expand proto
  try {
    _doRegen(propEL, proto, cb);
  } catch (err) {
    // TODO: create error element
    Console.error(err);

    if ( cb ) {
      cb (err);
    }
  }
};

function _doRegen ( propEL, proto, cb ) {
  DomUtils.clear(propEL);
  let customStyle = propEL.shadowRoot.getElementById('custom-style');
  if ( customStyle ) {
    customStyle.remove();
  }

  // assign
  JS.assignExcept(propEL, proto, [
    'template', 'style', 'attrs', 'value'
  ]);

  // parse attrs
  if ( propEL._attrs === undefined ) {
    if ( proto.attrs ) {
      let attrs = {};
      for ( let name in proto.attrs ) {
        let attr = propEL.getAttribute(name);
        if ( attr !== null ) {
          let fn = proto.attrs[name];
          attrs[name] = fn(attr);
        }
      }

      propEL._attrs = attrs;
    }
  }

  // parse value
  if ( propEL._value === undefined ) {
    let valueAttr = propEL.getAttribute('value');
    if ( valueAttr !== null ) {
      propEL._value = proto.value(valueAttr);
    }
  }

  // expand template
  if ( proto.template ) {
    let type = typeof proto.template;
    if ( type === 'string' ) {
      propEL.innerHTML = proto.template;
    } else if ( type === 'function' ) {
      propEL.innerHTML = proto.template(propEL._attrs);
    }
  }

  // expand style
  if ( proto.style ) {
    let styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.textContent = proto.style;
    styleElement.id = 'custom-style';

    propEL.shadowRoot.insertBefore(styleElement, propEL.shadowRoot.firstChild);
  }

  //
  propEL._propgateReadonly();

  // ready
  if ( propEL.ready ) {
    propEL.ready();
  }

  // callback
  if (cb) {
    cb();
  }
}

// DISABLE
// function ui_prop ( name, value, type, attrs, indent ) {
//   let el = document.createElement('ui-prop');
//   el.name = name || '';
//   el.indent = indent || 0;
//   el._value = value;
//   el._attrs = attrs || {};
//   el._type = type || typeof value;

//   el.regen();

//   return el;
// }
