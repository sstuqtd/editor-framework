'use strict';

const DomUtils = require('./dom-utils');

let _importCount = 0;

let PolymerUtils = {
  templatize ( parentEL, innerHTML, props ) {
    let tmpl = document.createElement('template');
    tmpl.innerHTML = innerHTML;

    // Prepare the template
    parentEL.templatize(tmpl);
    let instance = parentEL.stamp(props);

    return instance;
  },

  // binding helpers
  bind ( el1, value1, el2, value2 ) {
    let camelValue2 = DomUtils.camelCase(value2);
    el1.addEventListener( value1+'-changed', function ( event ) {
      if ( event.detail.path ) {
        el2.set( event.detail.path, event.detail.value );
      } else {
        el2.set( camelValue2, event.detail.value );
      }
    });
    el2.addEventListener( value2+'-changed', function ( event ) {
      if ( event.detail.path ) {
        el1.set( event.detail.path, event.detail.value );
      } else {
        el1.set( value1, event.detail.value );
      }
    });
  },

  bindUUID ( el1, value1, el2, value2 ) {
    let camelValue2 = DomUtils.camelCase(value2);
    el1.addEventListener( value1+'-changed', function ( event ) {
      if ( event.detail.path === value1+'.uuid' ) {
        el2.set( camelValue2, event.detail.value );
      } else {
        if ( event.detail.value ) {
          el2.set( camelValue2, event.detail.value.uuid );
        } else {
          el2.set( camelValue2, null );
        }
      }
    });
    el2.addEventListener(value2+'-changed', function ( event ) {
      el1.set(value1, {
        uuid: event.detail.value
      });
    });
  },

  // parent operation
  getSelfOrAncient ( element, parentType ) {
    let parent = element;
    while ( parent ) {
      if ( parent instanceof parentType ) {
        return parent;
      }

      parent = Polymer.dom(parent).parentNode;
    }

    return 0;
  },

  isSelfOrAncient ( element, ancientEL ) {
    let parent = element;
    while ( parent ) {
      if ( parent === ancientEL ) {
        return true;
      }

      parent = Polymer.dom(parent).parentNode;
    }

    return false;
  },

  //
  importing: false,
  import ( url, cb ) {
    ++_importCount;
    PolymerUtils.importing = true;

    Polymer.Base.importHref( url, function () {
      --_importCount;
      if ( _importCount === 0 ) {
        PolymerUtils.importing = false;
      }

      if ( cb ) cb ();
    }, function () {
      --_importCount;
      if ( _importCount === 0 ) {
        PolymerUtils.importing = false;
      }

      if ( cb ) {
        cb ( new Error(`${url} not found.`) );
      }
    });
  },
};

module.exports = PolymerUtils;
