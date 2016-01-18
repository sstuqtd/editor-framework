'use strict';

const _ = require('lodash');

const Electron = require('electron');
let webContents = Electron.remote.getCurrentWebContents();

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

let _mouseHint = null;
function _showMouseHintAt ( x, y, state ) {
  let size = 10;

  if ( _mouseHint === null ) {
    _mouseHint = document.createElement('div');
    _mouseHint.classList.add('mouse-hint');
    _mouseHint.style.position = 'absolute';
    _mouseHint.style.width = `${size}px`;
    _mouseHint.style.height = `${size}px`;
  }

  _mouseHint.classList.add(state);
  _mouseHint.style.left = `${x-size/2}px`;
  _mouseHint.style.top = `${y-size/2}px`;

  document.body.appendChild(_mouseHint);
}
function _hideMouseHint () {
  if ( _mouseHint !== null ) {
    _mouseHint.className = 'mouse-hint'; // remove all states
    _mouseHint.remove();
  }
}

// DISABLE
// function _mouseEventFor ( type, x, y, button ) {
//   let which = -1;
//   if ( button === 'left' ) {
//     which = 0;
//   } else if ( button === 'middle' ) {
//     which = 1;
//   } else if ( button === 'right' ) {
//     which = 2;
//   }

//   let props = {
//     bubbles: true,
//     cancelable: true,
//     clientX: x,
//     clientY: y,
//     button: which,
//   };

//   return new window.MouseEvent(type,props);
// }

let TestHelper = {
  detail: false, // setted by Editor.argv.detail which come from --detail
  showMouseHint: true,

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
   * @param {string} [button] - can be 'left', 'middle' or 'right'
   * @param {array} [modifiers] - can be 'shift', 'control', 'alt', 'meta', 'isKeypad', 'isAutoRepeat', 'leftButtonDown', 'middleButtonDown', 'rightButtonDown', 'capsLock', 'numLock', 'left', 'right'
   * @param {number} [x]
   * @param {number} [y]
   */
  click ( target, button, modifiers, x, y ) {
    let pos = this.offset(target, x, y );
    button = button || 'left';
    modifiers = modifiers || [];

    // DISABLE
    // this.mousedown(target, 'left', null, pos.x, pos.y);
    // this.mouseup(target, 'left', null, pos.x, pos.y);
    // target.dispatchEvent(_mouseEventFor('click', button, modifiers, pos.x, pos.y ));

    this.mousedown(target, button, modifiers, pos.x, pos.y);
    this.mouseup(target, button, modifiers, pos.x, pos.y);
  },

  /**
   * @param {HTMLElement} target
   * @param {string} [button] - can be 'left', 'middle' or 'right'
   * @param {array} [modifiers] - can be 'shift', 'control', 'alt', 'meta', 'isKeypad', 'isAutoRepeat', 'leftButtonDown', 'middleButtonDown', 'rightButtonDown', 'capsLock', 'numLock', 'left', 'right'
   * @param {number} [x]
   * @param {number} [y]
   */
  dblclick ( target, button, modifiers, x, y ) {
    let pos = this.offset(target, x, y );
    button = button || 'left';
    modifiers = modifiers || [];

    // DISABLE
    // target.dispatchEvent(_mouseEventFor('dblclick', pos.x, pos.y, button ));

    this.mousedown(target, button, modifiers, 2, pos.x, pos.y);
    this.mouseup(target, button, modifiers, 2, pos.x, pos.y);
  },

  /**
   * @param {HTMLElement} target
   * @param {string} [button] - can be 'left', 'middle' or 'right'
   * @param {array} [modifiers] - can be 'shift', 'control', 'alt', 'meta', 'isKeypad', 'isAutoRepeat', 'leftButtonDown', 'middleButtonDown', 'rightButtonDown', 'capsLock', 'numLock', 'left', 'right'
   * @param {number} [clickCount]
   * @param {number} [x]
   * @param {number} [y]
   */
  mousedown ( target, button, modifiers, clickCount, x, y ) {
    let pos = this.offset(target, x, y );
    button = button || 'left';
    modifiers = modifiers || [];
    clickCount = clickCount || 1;

    // DISABLE
    // target.dispatchEvent(_mouseEventFor('mousedown', pos.x, pos.y, button));

    webContents.sendInputEvent({
      type: 'mouseDown',
      x: parseInt(pos.x),
      y: parseInt(pos.y),
      button: button,
      modifiers: modifiers,
      clickCount: clickCount,
    });

    if ( this.showMouseHint ) {
      _showMouseHintAt( pos.x, pos.y, 'down' );
    }
  },

  /**
   * @param {HTMLElement} target
   * @param {string} [button] - can be 'left', 'middle' or 'right'
   * @param {array} [modifiers] - can be 'shift', 'control', 'alt', 'meta', 'isKeypad', 'isAutoRepeat', 'leftButtonDown', 'middleButtonDown', 'rightButtonDown', 'capsLock', 'numLock', 'left', 'right'
   * @param {number} [clickCount]
   * @param {number} [x]
   * @param {number} [y]
   */
  mouseup ( target, button, modifiers, clickCount, x, y ) {
    let pos = this.offset(target, x, y );
    button = button || 'left';
    modifiers = modifiers || [];
    clickCount = clickCount || 1;

    // DISABLE
    // target.dispatchEvent(_mouseEventFor('mouseup', pos.x, pos.y, button));

    webContents.sendInputEvent({
      type: 'mouseUp',
      x: parseInt(pos.x),
      y: parseInt(pos.y),
      button: button,
      modifiers: modifiers,
      clickCount: clickCount,
    });

    if ( this.showMouseHint ) {
      _hideMouseHint();
    }
  },

  /**
   * @param {HTMLElement} target
   * @param {array} [modifiers] - can be 'shift', 'control', 'alt', 'meta', 'isKeypad', 'isAutoRepeat', 'leftButtonDown', 'middleButtonDown', 'rightButtonDown', 'capsLock', 'numLock', 'left', 'right'
   * @param {number} [x]
   * @param {number} [y]
   * @param {number} [dx]
   * @param {number} [dy]
   */
  mousewheel ( target, modifiers, dx, dy, x, y ) {
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
    //   wheelTicksX: parseInt(dx),
    //   wheelTicksY: parseInt(dy),
    //   canScroll: true,
    // });
  },

  /**
   * @param {HTMLElement} target
   * @param {string} [button] - can be 'left', 'middle' or 'right'
   * @param {object} [from] - { x: number, y: number } structure
   * @param {object} [to] - { x: number, y: number } structure
   * @param {number} [duration] - duration(ms) to move
   * @param {function} [cb] - callback function
   */
  mousemove ( target, button, from, to, duration, cb ) {
    button = button || 'left';
    duration = duration || 500;

    let start = null;
    let last = null;

    let lenX = to.x - from.x;
    let lenY = to.y - from.y;

    let step = function (timestamp) {
      if (!start) {
        start = timestamp;
      }

      let dt = 0;
      if ( last ) {
        dt = timestamp - last;
      }
      last = timestamp;
      let progress = timestamp - start;
      let ratio = progress/duration;

      let dx = lenX / duration * dt;
      let dy = lenY / duration * dt;

      if ( ratio >= 1 ) {
        webContents.sendInputEvent({
          type: 'mousemove',
          x: parseInt(to.x),
          y: parseInt(to.y),
          button: button,
          movementX: parseInt(dx),
          movementY: parseInt(dy),
        });

        if ( this.showMouseHint ) {
          _hideMouseHint();
        }

        if ( cb ) {
          cb ();
        }
      } else {
        let pos = {
          x: from.x + lenX * ratio,
          y: from.y + lenY * ratio
        };

        webContents.sendInputEvent({
          type: 'mousemove',
          x: parseInt(pos.x),
          y: parseInt(pos.y),
          button: button,
          movementX: parseInt(dx),
          movementY: parseInt(dy),
        });

        if ( this.showMouseHint ) {
          _showMouseHintAt( pos.x, pos.y, 'moving' );
        }

        window.requestAnimationFrame(step);
      }
    }.bind(this);

    window.requestAnimationFrame(step);
  },


  /**
   * @param {HTMLElement} target
   * @param {string} [button] - can be 'left', 'middle' or 'right'
   * @param {object} [from] - { x: number, y: number } structure
   * @param {object} [to] - { x: number, y: number } structure
   * @param {number} [steps] - number of the steps to move
   * @param {function} [cb] - callback function
   */
  mousemoveStep ( target, button, from, to, steps, cb ) {
    button = button || 'left';
    steps = steps || 5;

    let dx = (to.x - from.x) / steps;
    let dy = (to.y - from.y) / steps;
    let pos = {
      x: from.x,
      y: from.y
    };

    let sendMouseMove = function () {
      webContents.sendInputEvent({
        type: 'mousemove',
        x: parseInt(pos.x),
        y: parseInt(pos.y),
        button: button,
        movementX: parseInt(dx),
        movementY: parseInt(dy),
      });

      if ( this.showMouseHint ) {
        _showMouseHintAt( pos.x, pos.y, 'moving' );
      }

      pos.x += dx;
      pos.y += dy;
    }.bind(this);

    for ( let i = 0; i < steps; ++i ) {
      setTimeout(sendMouseMove, 10 * i);
    }

    // send finish event
    setTimeout(() => {
      webContents.sendInputEvent({
        type: 'mousemove',
        x: parseInt(to.x),
        y: parseInt(to.y),
        button: button,
        movementX: parseInt(dx),
        movementY: parseInt(dy),
      });

      if ( this.showMouseHint ) {
        _hideMouseHint();
      }

      if ( cb ) {
        cb ();
      }
    }, 10 * steps );
  },

  // ===================
  // special events
  // ===================

  mousetrack ( target, button, from, to, duration, cb ) {
    this.mousedown(target, button);
    this.mousemove(target, button, from, to, duration, () => {
      this.mouseup(target, button);
      if ( cb ) {
        cb ();
      }
    });
  },

  mousetrackStep ( target, button, from, to, steps, cb ) {
    this.mousedown(target, button);
    this.mousemoveStep(target, button, from, to, steps, () => {
      this.mouseup(target, button);
      if ( cb ) {
        cb ();
      }
    });
  },

  pressAndReleaseKeyOn ( target, keyText ) {
    this.keydown(target, keyText);
    setTimeout(() => {
      this.keyup(target, keyText);
    },1);
  },

  pressEnter (target) {
    this.pressAndReleaseKeyOn(target, 'enter');
  },

  pressSpace (target) {
    this.pressAndReleaseKeyOn(target, 'space');
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
    if ( !target ) {
      target = document.body;
    }

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
    if ( !target ) {
      target = document.body;
    }

    let bcr = target.getBoundingClientRect();
    return {
      x: bcr.left + (bcr.width / 2),
      y: bcr.top + (bcr.height / 2),
    };
  },

  topleft (target) {
    if ( !target ) {
      target = document.body;
    }

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
    let link = document.createElement('link');
    link.rel = 'import';
    link.href = url;
    link.onload = function () {
      cb (this.import);
    };
    document.head.appendChild(link);
  },

  loadTemplate ( url, id, cb ) {
    this.importHTML(url, ( el ) => {
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

    this.loadTemplate( url, id, (tmpl) => {
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

      cb(fixturedFragment);
    });
  },

  /**
   * @method runElement - load template element and append it to the document body.
   * @param {string} url - The url for a html template.
   * @param {string} [id] - The id for the template, if the id is not provided, the first template element will be used.
   * @param {string} [selector] - The selector to query as the Helper.targetEL in the template, if the selector is not provided, the first element child of the template fragment will be used.
   *
   * @example:
   * foobar.html
   *
   * ```html
   * <template id="foobar">
   *   <div>
   *     <div class="foo">foo</div>
   *     <div class="bar">bar</div>
   *   </div>
   * </template>
   * ```
   *
   * ``` javascript
   * Helper.runElement('foobar.html', foobar, '.foo');
   * ```
   *
   * The above code will load "foobar.html", and choose the "#foobar" template, then append it to the html body.
   * Meanwhile, it will query the selector ".foo" and assign the query result the Helper.targetEL.
   */
  runElement ( url, id, selector ) {
    let helper = this;
    this.targetEL = null;

    beforeEach(function ( done ) {
      helper.createFrom( url, id, el => {
        if ( selector ) {
          helper.targetEL = el.querySelector(selector);
        } else {
          helper.targetEL = el.firstElementChild;
        }

        document.body.appendChild(el);
        done();
      });
    });

    afterEach(function ( done ) {
      helper.targetEL.remove();
      done();
    });
  },

  runPanel ( panelID ) {
    let helper = this;
    this.targetEL = null;

    beforeEach(function ( done ) {
      Editor.Panel.load( panelID, (err, el) => {
        if ( err ) {
          throw err;
        }

        helper._spy();
        helper.targetEL = el;

        document.body.appendChild(el);
        done();
      });
    });

    afterEach(function ( done ) {
      helper._unspy();
      helper.targetEL.remove();
      done();
    });
  },
};

TestHelper = _.assign( TestHelper, require('../share/helper') );

// initialize client-side tester
module.exports = TestHelper;
