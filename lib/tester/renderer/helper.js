'use strict';

const _ = require('lodash');

// const Remote = require('remote');
// let webContents = Remote.getCurrentWebContents();

function _keyboardEventFor ( type, keyCode, modifiers ) {
  let event = new window.CustomEvent(type);

  event.keyCode = keyCode;
  event.code = keyCode;
  event.which = keyCode;

  if ( modifiers ) {
    if ( modifiers.indexOf('shift') !== -1 ) {
      event.shiftKey = true;
    } else if ( modifiers.indexOf('ctrl') !== -1 ) {
      event.ctrlKey = true;
    } else if ( modifiers.indexOf('command') !== -1 ) {
      event.metaKey = true;
    } else if ( modifiers.indexOf('alt') !== -1 ) {
      event.altKey = true;
    }
  }

  return event;
}

function _mouseEventFor ( type, x, y, button ) {
  let which = -1;
  if ( button === 'left' ) {
    which = 0;
  } else if ( button === 'middle' ) {
    which = 1;
  } else if ( button === 'right' ) {
    which = 2;
  }

  let props = {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button: which,
  };

  return new window.MouseEvent(type,props);
}

let TestHelper = {

  // ===================
  // general focus events
  // ===================

  focus ( target ) {
    if ( target.setFocus ) {
      target.setFocus();
      return;
    }
    Polymer.Base.fire.call(target, 'focus');
  },

  blur ( target ) {
    if ( target.setBlur ) {
      target.setBlur();
      return;
    }
    Polymer.Base.fire.call(target, 'blur');
  },

  // ===================
  // general keyboard events
  // ===================

  keydown ( target, keyText, modifiers ) {
    if ( modifiers && !Array.isArray(modifiers) ) {
      throw new Error('modifiers must be an array');
    }

    target.dispatchEvent(_keyboardEventFor('keydown', Editor.KeyCode(keyText), modifiers));
  },

  keyup ( target, keyText, modifiers ) {
    if ( modifiers && !Array.isArray(modifiers) ) {
      throw new Error('modifiers must be an array');
    }

    target.dispatchEvent(_keyboardEventFor('keyup', Editor.KeyCode(keyText), modifiers));
  },

  keypress ( target, keyText ) {
    target.dispatchEvent(_keyboardEventFor('keypress', Editor.KeyCode(keyText)));
  },

  // ===================
  // general mouse events
  // ===================

  /**
   * @param {HTMLElement} target
   * @param {number} x
   * @param {number} y
   * @param {string} button - can be 'left', 'middle' or 'right'
   * @param {array} modifiers - can be 'shift', 'control', 'alt', 'meta', 'isKeypad', 'isAutoRepeat', 'leftButtonDown', 'middleButtonDown', 'rightButtonDown', 'capsLock', 'numLock', 'left', 'right'
   */
  click ( target, x, y, button, modifiers ) {
    let pos = this.offset(target, x, y );
    button = button || 'left';
    modifiers = modifiers || [];

    TestHelper.mousedown(target, pos.x, pos.y);
    TestHelper.mouseup(target, pos.x, pos.y);
    target.dispatchEvent(_mouseEventFor('click', pos.x, pos.y, button ));

    // DISABLE
    // TestHelper.mousedown(target, pos.x, pos.y, button, modifiers);
    // TestHelper.mouseup(target, pos.x, pos.y, button, modifiers);
  },

  /**
   * @param {HTMLElement} target
   * @param {number} x
   * @param {number} y
   * @param {string} button - can be 'left', 'middle' or 'right'
   * @param {array} modifiers - can be 'shift', 'control', 'alt', 'meta', 'isKeypad', 'isAutoRepeat', 'leftButtonDown', 'middleButtonDown', 'rightButtonDown', 'capsLock', 'numLock', 'left', 'right'
   */
  dblclick ( target, x, y, button, modifiers ) {
    let pos = this.offset(target, x, y );
    button = button || 'left';
    modifiers = modifiers || [];

    target.dispatchEvent(_mouseEventFor('dblclick', pos.x, pos.y, button ));

    // DISABLE
    // TestHelper.mousedown(target, pos.x, pos.y, button, modifiers, 2);
    // TestHelper.mouseup(target, pos.x, pos.y, button, modifiers, 2);
  },

  /**
   * @param {HTMLElement} target
   * @param {number} x
   * @param {number} y
   * @param {string} button - can be 'left', 'middle' or 'right'
   * @param {array} modifiers - can be 'shift', 'control', 'alt', 'meta', 'isKeypad', 'isAutoRepeat', 'leftButtonDown', 'middleButtonDown', 'rightButtonDown', 'capsLock', 'numLock', 'left', 'right'
   * @param {number} clickCount
   */
  mousedown ( target, x, y, button, modifiers, clickCount ) {
    let pos = this.offset(target, x, y );
    button = button || 'left';
    modifiers = modifiers || [];
    clickCount = clickCount || 1;

    target.dispatchEvent(_mouseEventFor('mousedown', pos.x, pos.y, button));

    // DISABLE
    // webContents.sendInputEvent({
    //   type: 'mouseDown',
    //   x: parseInt(pos.x),
    //   y: parseInt(pos.y),
    //   button: button,
    //   modifiers: modifiers,
    //   clickCount: clickCount,
    // });
  },

  /**
   * @param {HTMLElement} target
   * @param {number} x
   * @param {number} y
   * @param {string} button - can be 'left', 'middle' or 'right'
   * @param {array} modifiers - can be 'shift', 'control', 'alt', 'meta', 'isKeypad', 'isAutoRepeat', 'leftButtonDown', 'middleButtonDown', 'rightButtonDown', 'capsLock', 'numLock', 'left', 'right'
   * @param {number} clickCount
   */
  mouseup ( target, x, y, button, modifiers, clickCount ) {
    let pos = this.offset(target, x, y );
    button = button || 'left';
    modifiers = modifiers || [];
    clickCount = clickCount || 1;

    target.dispatchEvent(_mouseEventFor('mouseup', pos.x, pos.y, button));

    // DISABLE
    // webContents.sendInputEvent({
    //   type: 'mouseUp',
    //   x: parseInt(pos.x),
    //   y: parseInt(pos.y),
    //   button: button,
    //   modifiers: modifiers,
    //   clickCount: clickCount,
    // });
  },

  /**
   * @param {HTMLElement} target
   * @param {number} x
   * @param {number} y
   * @param {number} dx
   * @param {number} dy
   * @param {array} modifiers - can be 'shift', 'control', 'alt', 'meta', 'isKeypad', 'isAutoRepeat', 'leftButtonDown', 'middleButtonDown', 'rightButtonDown', 'capsLock', 'numLock', 'left', 'right'
   */
  mousewheel ( target, x, y, dx, dy, modifiers ) {
    let pos = this.offset(target, x, y );
    modifiers = modifiers || [];
    if ( dy === undefined || dy === null ) {
      dy = dx;
    }

    target.dispatchEvent(new window.WheelEvent('mousewheel',{
      bubbles: true,
      cancelable: true,
      clientX: pos.x,
      clientY: pos.y,
      deltaX: dx,
      deltaY: dy,
    }));

    // DISABLE: not work :(
    // webContents.sendInputEvent({
    //   type: 'mouseWheel',
    //   x: parseInt(pos.x),
    //   y: parseInt(pos.y),
    //   modifiers: modifiers,
    //   deltaX: parseInt(dx),
    //   deltaY: parseInt(dy),
    //   canScroll: true,
    // });
  },

  mousemove ( target, from, to, steps, button ) {
    steps = steps || 5;
    let dx = Math.round((to.x - from.x) / steps);
    let dy = Math.round((to.y - from.y) / steps);
    let pos = {
      x: from.x,
      y: from.y
    };
    for ( let i = steps; i > 0; i-- ) {
      target.dispatchEvent(_mouseEventFor('mousemove', pos.x, pos.y, button ));
      pos.x += dx;
      pos.y += dy;
    }
    target.dispatchEvent(_mouseEventFor('mousemove', to.x, to.y, button ));
  },

  // ===================
  // special events
  // ===================

  mousetrack ( target, from, to, steps ) {
    TestHelper.mousedown(target, from.x, from.y, 'left');
    TestHelper.mousemove(target, from, to, steps, 'left');
    TestHelper.mouseup(target, to.x, to.y, 'left');
  },

  pressAndReleaseKeyOn ( target, keyText ) {
    TestHelper.keydown(target, keyText);
    setTimeout(() => {
      TestHelper.keyup(target, keyText);
    },1);
  },

  pressEnter (target) {
    TestHelper.pressAndReleaseKeyOn(target, 'enter');
  },

  pressSpace (target) {
    TestHelper.pressAndReleaseKeyOn(target, 'space');
  },

  // ===================
  // helpers
  // ===================

  flushAsyncOperations () {
    // force distribution
    Polymer.dom.flush();

    // force lifecycle callback to fire on polyfill
    if ( window.CustomElements ) {
      window.CustomElements.takeRecords();
    }
  },

  fireEvent (target, type, props) {
    let event = new window.CustomEvent(type, {
      bubbles: true,
      cancelable: true
    });
    for ( let p in props ) {
      event[p] = props[p];
    }
    target.dispatchEvent(event);
  },

  // ====================
  // element
  // ====================

  offset (target, x, y ) {
    let bcr = target.getBoundingClientRect();

    if ( typeof x !== 'number' ) {
      x = bcr.width / 2;
    }
    if ( typeof y !== 'number' ) {
      y = bcr.height / 2;
    }

    return {
      x: bcr.left + x,
      y: bcr.top + y,
    };
  },

  center (target) {
    let bcr = target.getBoundingClientRect();
    return {
      x: bcr.left + (bcr.width / 2),
      y: bcr.top + (bcr.height / 2),
    };
  },

  topleft (target) {
    let bcr = target.getBoundingClientRect();
    return {
      x: bcr.left,
      y: bcr.top,
    };
  },

  // ====================
  // template
  // ====================

  importHTML ( url, cb ) {
    var link = document.createElement('link');
    link.rel = 'import';
    link.href = url;
    link.onload = function () {
      cb (this.import);
    };
    document.head.appendChild(link);
  },

  loadTemplate ( url, id, cb ) {
    TestHelper.importHTML(url, ( el ) => {
      if ( id ) {
        cb ( el.getElementById(id) );
        return;
      }

      cb ( el.querySelector('template') );
    });
  },

  createFrom ( url, id, cb ) {
    if ( typeof id === 'function' ) {
      cb = id;
      id = '';
    }

    TestHelper.loadTemplate( url, id, (tmpl) => {
      if ( !tmpl || tmpl.tagName !== 'TEMPLATE' ) {
        cb ();
        return;
      }

      let fixturedFragment = document.importNode(tmpl.content, true);

      // Immediately upgrade the subtree if we are dealing with async
      // Web Components polyfill.
      // https://github.com/Polymer/polymer/blob/0.8-preview/src/features/mini/template.html#L52
      if (window.CustomElements && window.CustomElements.upgradeSubtree) {
        window.CustomElements.upgradeSubtree(fixturedFragment);
      }

      let el = fixturedFragment.firstElementChild;
      cb(el);
    });
  },

  runElement ( url, id ) {
    TestHelper.targetEL = null;

    beforeEach(function ( done ) {
      TestHelper.createFrom( url, id, el => {
        TestHelper.targetEL = el;

        document.body.appendChild(el);
        done();
      });
    });

    afterEach(function ( done ) {
      TestHelper.targetEL.remove();
      done();
    });
  },

  runPanel ( panelID ) {
    TestHelper.targetEL = null;

    beforeEach(function ( done ) {
      Editor.Panel.load( panelID, (err, el) => {
        if ( err ) {
          throw err;
        }

        TestHelper._spy();
        TestHelper.targetEL = el;

        document.body.appendChild(el);
        done();
      });
    });

    afterEach(function ( done ) {
      TestHelper._unspy();
      TestHelper.targetEL.remove();
      done();
    });
  },
};

TestHelper = _.assign( TestHelper, require('../share/helper') );

// initialize client-side tester
module.exports = TestHelper;
