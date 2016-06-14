'use strict';

// requires
const JS = require('../../../share/js-utils');

// ==========================
// exports
// ==========================

module.exports = function ( name, def ) {
  let template = def.template;
  let style = def.style;
  let listeners = def.listeners;
  let behaviors = def.behaviors;
  let selectors = def.$;
  let created = def.created;

  let proto = Object.create(HTMLElement.prototype);

  // TODO: dependencies

  // NOTE: do not use delete to change def, we need to reuse def since it was cached
  JS.assignExcept(proto, def, [
    'dependencies', 'created',
    'template', 'style', 'listeners', 'behaviors', '$'
  ]);

  // addon behaviors
  if ( behaviors ) {
    behaviors.forEach(be => {
      JS.addon(proto, be);
    });
  }

  // created callback
  proto.createdCallback = function () {
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
      let results = {};
      for ( let name in selectors ) {
        results[name] = root.querySelector(selectors[name]);
      }
      this.$ = results;
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

  // register element
  // NOTE: registerElement will return a constructor
  let ctor = document.registerElement(name, {
    prototype: proto,
  });

  let customCtor = function () {
    let el = new ctor();

    if ( created ) {
      created.apply(el, arguments);
    }

    return el;
  };

  Object.defineProperty( customCtor, 'tagName', {
    get () { return name.toUpperCase(); },
  });

  return customCtor;
};
