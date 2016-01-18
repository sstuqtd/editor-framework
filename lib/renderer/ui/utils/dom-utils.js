(() => {
  'use strict';

  const _ = require('lodash');

  let _cancelDrag = null;
  let _dragGhost = null;
  let _hitGhost = null;
  let _loadingMask = null;

  Editor.JS.mixin(EditorUI, {
    // NOTE: fire means it can be propagate, emit don't have that meaning
    // NOTE: CustomEvent.bubbles default is false
    fire ( element, eventName, opts ) {
      opts = opts || {};
      element.dispatchEvent(new window.CustomEvent(eventName,opts));
    },

    //
    index ( element ) {
      let parentEL = element.parentNode;

      for ( let i = 0, len = parentEL.children.length; i < len; ++i ) {
        if ( parentEL.children[i] === element ) {
          return i;
        }
      }

      return -1;
    },

    //
    offsetTo ( el, parentEL ) {
      let xPosition = 0;
      let yPosition = 0;

      while ( el && el !== parentEL ) {
        xPosition += (el.offsetLeft - el.scrollLeft);
        yPosition += (el.offsetTop - el.scrollTop);
        el = el.offsetParent;
      }

      if ( parentEL && el !== parentEL ) {
        Editor.warn('The parentEL is not the element\'s offsetParent');
        return { x: 0, y: 0 };
      }

      return { x: xPosition, y: yPosition };
    },

    //
    toHumanText ( text ) {
      let result = text.replace(/[-_]([a-z])/g, function(m) {
        return m[1].toUpperCase();
      });

      result = result.replace(/([a-z][A-Z])/g, function (g) {
        return g[0] + ' ' + g[1];
      });

      // remove first white-space
      if ( result.charAt(0) === ' ' ) {
        result.slice(1);
      }

      // capitalize the first letter
      return result.charAt(0).toUpperCase() + result.slice(1);
    },

    //
    camelCase (text) {
      return _.camelCase(text);
    },

    //
    kebabCase (text) {
      return _.kebabCase(text);
    },

    //
    getParentTabIndex ( element ) {
      let parent = element.parentElement;
      while ( parent ) {
        if (
          parent.tabIndex !== null &&
          parent.tabIndex !== undefined &&
          parent.tabIndex !== -1
        ) {
          return parent.tabIndex;
        }

        parent = parent.parentElement;
      }

      return 0;
    },

    //
    focusParent ( element ) {
      // NOTE: DO NOT use Polymer.dom(element).parentNode
      let parent = element.parentElement;
      while ( parent ) {
        if (
          parent.tabIndex !== null &&
          parent.tabIndex !== undefined &&
          parent.tabIndex !== -1
        ) {
          parent.focus();
          return;
        }

        parent = parent.parentElement;
      }
    },

    //
    getFirstFocusableChild ( element ) {
      if (
        element.tabIndex !== null &&
        element.tabIndex !== undefined &&
        element.tabIndex !== -1
      ) {
        return element;
      }

      for ( let i = 0; i < element.children.length; ++i ) {
        let childEL = EditorUI.getFirstFocusableChild(element.children[i]);

        if ( childEL !== null ) {
          return childEL;
        }
      }

      return null;
    },

    //
    startDrag ( cursor, event, onMove, onEnd ) {
      EditorUI.addDragGhost(cursor);

      event.stopPropagation();

      let pressx = event.clientX, lastx = event.clientX;
      let pressy = event.clientY, lasty = event.clientY;
      let dx = 0, offsetx = 0;
      let dy = 0, offsety = 0;

      let mousemoveHandle = function (event) {
        event.stopPropagation();

        dx = event.clientX - lastx;
        dy = event.clientY - lasty;
        offsetx = event.clientX - pressx;
        offsety = event.clientY - pressy;

        lastx = event.clientX;
        lasty = event.clientY;

        if ( onMove ) {
          onMove( event, dx, dy, offsetx, offsety );
        }
      };

      let mouseupHandle = function (event) {
        event.stopPropagation();

        document.removeEventListener('mousemove', mousemoveHandle);
        document.removeEventListener('mouseup', mouseupHandle);

        EditorUI.removeDragGhost();

        dx = event.clientX - lastx;
        dy = event.clientY - lasty;
        offsetx = event.clientX - pressx;
        offsety = event.clientY - pressy;

        _cancelDrag = null;
        if ( onEnd ) {
          onEnd( event, dx, dy, offsetx, offsety);
        }
      };

      _cancelDrag = function () {
        document.removeEventListener('mousemove', mousemoveHandle);
        document.removeEventListener('mouseup', mouseupHandle);

        EditorUI.removeDragGhost();
      };

      document.addEventListener ( 'mousemove', mousemoveHandle );
      document.addEventListener ( 'mouseup', mouseupHandle );
    },

    //
    cancelDrag () {
      if ( _cancelDrag ) {
        _cancelDrag();
      }
    },

    //
    addDragGhost ( cursor ) {
      // add drag-ghost
      if ( _dragGhost === null ) {
        _dragGhost = document.createElement('div');
        _dragGhost.classList.add('drag-ghost');
        _dragGhost.style.position = 'absolute';
        _dragGhost.style.zIndex = '999';
        _dragGhost.style.top = '0';
        _dragGhost.style.right = '0';
        _dragGhost.style.bottom = '0';
        _dragGhost.style.left = '0';
        _dragGhost.oncontextmenu = function () { return false; };
      }
      _dragGhost.style.cursor = cursor;
      document.body.appendChild(_dragGhost);

      return _dragGhost;
    },

    //
    removeDragGhost () {
      if ( _dragGhost !== null ) {
        _dragGhost.style.cursor = 'auto';

        if ( _dragGhost.parentElement !== null ) {
          _dragGhost.parentElement.removeChild(_dragGhost);
        }
      }
    },

    //
    addHitGhost ( cursor, zindex, onhit ) {
      // add drag-ghost
      if ( _hitGhost === null ) {
        _hitGhost = document.createElement('div');
        _hitGhost.classList.add('hit-ghost');
        _hitGhost.style.position = 'absolute';
        _hitGhost.style.zIndex = zindex;
        _hitGhost.style.top = '0';
        _hitGhost.style.right = '0';
        _hitGhost.style.bottom = '0';
        _hitGhost.style.left = '0';
        // _hitGhost.style.background = 'rgba(0,0,0,0.2)';
        _hitGhost.oncontextmenu = function() { return false; };
      }

      _hitGhost.style.cursor = cursor;
      _hitGhost.addEventListener('mousedown', function (event) {
        event.preventDefault();
        event.stopPropagation();

        if ( onhit ) {
          onhit();
        }
      });
      document.body.appendChild(_hitGhost);

      return _hitGhost;
    },

    //
    removeHitGhost () {
      if ( _hitGhost !== null ) {
        _hitGhost.style.cursor = 'auto';

        if ( _hitGhost.parentElement !== null ) {
          _hitGhost.parentElement.removeChild(_hitGhost);
          _hitGhost.removeEventListener('mousedown');
        }
      }
    },

    //
    addLoadingMask ( options, onclick ) {
      // add drag-ghost
      if ( _loadingMask === null ) {
        _loadingMask = document.createElement('div');
        _loadingMask.classList.add('loading-mask');
        _loadingMask.style.position = 'absolute';
        _loadingMask.style.top = '0';
        _loadingMask.style.right = '0';
        _loadingMask.style.bottom = '0';
        _loadingMask.style.left = '0';
        _loadingMask.oncontextmenu = function() { return false; };
      }

      if ( options && typeof options.zindex === 'string' ) {
        _loadingMask.style.zIndex = options.zindex;
      } else {
        _loadingMask.style.zIndex = '1999';
      }

      if ( options && typeof options.background === 'string' ) {
        _loadingMask.style.backgroundColor = options.background;
      } else {
        _loadingMask.style.backgroundColor = 'rgba(0,0,0,0.2)';
      }

      if ( options && typeof options.cursor === 'string' ) {
        _loadingMask.style.cursor = options.cursor;
      } else {
        _loadingMask.style.cursor = 'default';
      }

      _loadingMask.addEventListener('mousedown', function (event) {
        event.preventDefault();
        event.stopPropagation();

        if ( onclick ) {
          onclick();
        }
      });

      document.body.appendChild(_loadingMask);

      return _loadingMask;
    },

    //
    removeLoadingMask () {
      if ( _loadingMask !== null ) {
        _loadingMask.style.cursor = 'auto';

        if ( _loadingMask.parentElement !== null ) {
          _loadingMask.parentElement.removeChild(_loadingMask);
          _loadingMask.removeEventListener('mousedown');
        }
      }
    },

  });
})();
