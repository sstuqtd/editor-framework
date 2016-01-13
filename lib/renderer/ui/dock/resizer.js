(() => {
  'use strict';

  function _resize (
    elementList, vertical, offset,
    sizeList, resizerIndex,
    prevTotalSize, prevMinSize, prevMaxSize,
    nextTotalSize, nextMinSize, nextMaxSize
  ) {
    unused(prevMaxSize);
    unused(nextMaxSize);

    let expectSize, newPrevSize, newNextSize;
    let prevOffset, nextOffset;
    let prevIndex, nextIndex;
    let dir = Math.sign(offset);

    if ( dir > 0 ) {
      prevIndex = resizerIndex - 1;
      nextIndex = resizerIndex + 1;
    } else {
      prevIndex = resizerIndex + 1;
      nextIndex = resizerIndex - 1;
    }

    prevOffset = offset;

    // prev
    let prevEL = elementList[prevIndex];
    let prevSize = sizeList[prevIndex];

    expectSize = prevSize + prevOffset * dir;
    if ( vertical ) {
      newPrevSize = prevEL.calcWidth(expectSize);
    } else {
      newPrevSize = prevEL.calcHeight(expectSize);
    }

    prevOffset = (newPrevSize - prevSize) * dir;

    // next
    let nextEL = elementList[nextIndex];
    let nextSize = sizeList[nextIndex];

    while (1) {
      expectSize = nextSize - prevOffset * dir;
      if ( vertical ) {
        newNextSize = nextEL.calcWidth(expectSize);
      } else {
        newNextSize = nextEL.calcHeight(expectSize);
      }

      nextOffset = (newNextSize - nextSize) * dir;

      nextEL.style.flex = `0 0 ${newNextSize}px`;

      if ( newNextSize - expectSize === 0 ) {
        break;
      }

      //
      prevOffset += nextOffset;

      //
      if ( dir > 0 ) {
        nextIndex += 2;

        if ( nextIndex >= elementList.length ) {
          break;
        }
      } else {
        nextIndex -= 2;

        if ( nextIndex < 0 ) {
          break;
        }
      }

      nextEL = elementList[nextIndex];
      nextSize = sizeList[nextIndex];
    }

    // re-calculate newPrevSize
    if ( dir > 0 ) {
      if ( nextTotalSize - offset * dir <= nextMinSize ) {
        prevOffset = (nextTotalSize - nextMinSize) * dir;
        newPrevSize = prevSize + prevOffset * dir;
      }
    } else {
      if ( prevTotalSize - offset * dir <= prevMinSize ) {
        prevOffset = (prevTotalSize - prevMinSize) * dir;
        newPrevSize = prevSize + prevOffset * dir;
      }
    }

    //
    prevEL.style.flex = `0 0 ${newPrevSize}px`;

    for ( let i = 0; i < elementList.length; ++i ) {
      let el = elementList[i];
      if ( el instanceof EditorUI.DockResizer ) {
        continue;
      }

      el._notifyResize();
    }
  }

  EditorUI.DockResizer = Polymer({
    is: 'editor-dock-resizer',

    listeners: {
      'mousedown': '_onMouseDown'
    },

    properties: {
      vertical: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      active: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },
    },

    ready () {
      if ( Editor.isWin32 ) {
        this.classList.add('platform-win');
      }
    },

    _snapshot () {
      let thisDOM = Polymer.dom(this);
      let parentEL = thisDOM.parentNode;
      let parentDOM = Polymer.dom(parentEL);

      let rect;
      let sizeList = [];
      let resizerIndex = -1;
      // var totalSize = -1;

      // get parent size
      let frameWrapper = parentEL.$['frame-wrapper'];
      if ( frameWrapper ) {
        rect = frameWrapper.getBoundingClientRect();
      } else {
        rect = parentEL.getBoundingClientRect();
      }
      // totalSize = this.vertical ? rect.width : rect.height;

      // get element size
      for ( let i = 0; i < parentDOM.children.length; ++i ) {
        let el = parentDOM.children[i];
        if ( el === this ) {
          resizerIndex = i;
        }

        rect = el.getBoundingClientRect();
        sizeList.push( Math.round(this.vertical ? rect.width : rect.height) );
      }

      //
      let prevTotalSize = 0;
      let prevMinSize = 0;
      let prevMaxSize = 0;
      let nextTotalSize = 0;
      let nextMinSize = 0;
      let nextMaxSize = 0;

      for ( let i = 0; i < resizerIndex; i += 2 ) {
        prevTotalSize += sizeList[i];
        prevMinSize += this.vertical ?
          parentDOM.children[i].computedMinWidth :
          parentDOM.children[i].computedMinHeight
          ;

        prevMaxSize += this.vertical ?
          parentDOM.children[i].computedMaxWidth :
          parentDOM.children[i].computedMaxHeight
          ;
      }

      for ( let i = resizerIndex+1; i < parentDOM.children.length; i += 2 ) {
        nextTotalSize += sizeList[i];
        nextMinSize += this.vertical ?
          parentDOM.children[i].computedMinWidth :
          parentDOM.children[i].computedMinHeight
          ;

        nextMaxSize += this.vertical ?
          parentDOM.children[i].computedMaxWidth :
          parentDOM.children[i].computedMaxHeight
          ;
      }

      return {
        sizeList: sizeList,
        resizerIndex: resizerIndex,
        prevTotalSize: prevTotalSize,
        prevMinSize: prevMinSize,
        prevMaxSize: prevMaxSize,
        nextTotalSize: nextTotalSize,
        nextMinSize: nextMinSize,
        nextMaxSize: nextMaxSize,
      };
    },

    _onMouseDown ( event ) {
      event.stopPropagation();

      //
      let thisDOM = Polymer.dom(this);
      let parentEL = thisDOM.parentNode;
      let parentDOM = Polymer.dom(parentEL);

      //
      this.active = true;
      let snapshot = this._snapshot();
      let lastDir = 0;
      let rect = this.getBoundingClientRect();
      let centerx = Math.round(rect.left + rect.width/2);
      let centery = Math.round(rect.top + rect.height/2);

      for ( let i = 0; i < parentDOM.children.length; ++i ) {
        let el = parentDOM.children[i];
        if ( el instanceof EditorUI.DockResizer ) {
          continue;
        }

        el.style.flex = `0 0 ${snapshot.sizeList[i]}px`;
      }

      // mousemove
      let mousemoveHandle = (event) => {
        event.stopPropagation();

        // get offset
        let offset;
        if ( this.vertical ) {
          offset = event.clientX - centerx;
        } else {
          offset = event.clientY - centery;
        }

        //
        if ( offset !== 0 ) {
          let rect = this.getBoundingClientRect();
          let curx = Math.round(rect.left + rect.width/2);
          let cury = Math.round(rect.top + rect.height/2);
          let delta;

          if ( this.vertical ) {
            delta = event.clientX - curx;
          } else {
            delta = event.clientY - cury;
          }

          let curDir = Math.sign(delta);

          if ( lastDir !== 0 && lastDir !== curDir ) {
            snapshot = this._snapshot();
            centerx = curx;
            centery = cury;
            offset = delta;
          }

          lastDir = curDir;

          _resize(
            parentDOM.children,
            this.vertical,
            offset,
            snapshot.sizeList,
            snapshot.resizerIndex,
            snapshot.prevTotalSize,
            snapshot.prevMinSize,
            snapshot.prevMaxSize,
            snapshot.nextTotalSize,
            snapshot.nextMinSize,
            snapshot.nextMaxSize
          );
        }
      };

      // mouseup
      let mouseupHandle = (event) => {
        event.stopPropagation();

        document.removeEventListener('mousemove', mousemoveHandle);
        document.removeEventListener('mouseup', mouseupHandle);
        EditorUI.removeDragGhost();

        this.active = false;

        let thisDOM = Polymer.dom(this);
        let parentEL = thisDOM.parentNode;
        let parentDOM = Polymer.dom(parentEL);

        // get elements' size
        parentEL._reflowRecursively();

        // notify resize
        for ( let i = 0; i < parentDOM.children.length; ++i ) {
          let el = parentDOM.children[i];

          if ( el instanceof EditorUI.DockResizer ) {
            continue;
          }

          el._notifyResize();
        }

        //
        Editor.saveLayout();
      };

      // add drag-ghost
      if ( Editor.isWin32 ) {
        EditorUI.addDragGhost( this.vertical ? 'ew-resize' : 'ns-resize' );
      } else {
        EditorUI.addDragGhost( this.vertical ? 'col-resize' : 'row-resize' );
      }

      document.addEventListener ( 'mousemove', mousemoveHandle );
      document.addEventListener ( 'mouseup', mouseupHandle );
    },
  });

})();
