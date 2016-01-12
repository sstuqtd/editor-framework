(() => {
  'use strict';

  EditorUI.Dock = Polymer({
    is: 'editor-dock',

    behaviors: [EditorUI.resizable, EditorUI.dockable],

    properties: {
      row: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      noCollapse: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },
    },

    ready () {
      this._initResizable();
      this._initResizers();
    },

    factoryImpl ( row, noCollapse ) {
      this.row = row || false;
      this.noCollapse = noCollapse || false;
    },

    _initResizers () {
      let thisDOM = Polymer.dom(this);
      if ( thisDOM.children.length > 1 ) {
        for ( let i = 0; i < thisDOM.children.length; ++i ) {
          if ( i !== thisDOM.children.length-1 ) {
            // var el = thisDOM.children[i];
            let nextEL = thisDOM.children[i+1];

            let resizer = document.createElement('editor-dock-resizer');
            resizer.vertical = this.row;

            thisDOM.insertBefore( resizer, nextEL );
            i += 1;
          }
        }
      }
    },

    _collapseRecursively () {
      // let elements = [];
      let thisDOM = Polymer.dom(this);

      //
      for ( let i = 0; i < thisDOM.children.length; i += 2 ) {
        let el = thisDOM.children[i];

        if ( el['ui-dockable'] ) {
          el._collapseRecursively();
        }
      }

      this.collapse();
    },

    // depth first calculate the width and height
    _finalizeSizeRecursively ( reset ) {
      let elements = [];
      let thisDOM = Polymer.dom(this);

      //
      for ( let i = 0; i < thisDOM.children.length; i += 2 ) {
        let el = thisDOM.children[i];

        if ( el['ui-dockable'] ) {
          el._finalizeSizeRecursively(reset);
          elements.push(el);
        }
      }

      //
      this.finalizeSize(elements,reset);
    },

    // depth first calculate the min max width and height
    _finalizeMinMaxRecursively () {
      let elements = [];
      let thisDOM = Polymer.dom(this);

      //
      for ( let i = 0; i < thisDOM.children.length; i += 2 ) {
        let el = thisDOM.children[i];

        if ( el['ui-dockable'] ) {
          el._finalizeMinMaxRecursively();
          elements.push(el);
        }
      }

      //
      this.finalizeMinMax(elements, this.row);
    },

    _finalizeStyleRecursively () {
      // let elements = [];
      let thisDOM = Polymer.dom(this);

      // NOTE: finalizeStyle is breadth first calculation, because we need to make sure
      //       parent style applied so that the children would not calculate wrong.
      this.finalizeStyle();

      //
      for ( let i = 0; i < thisDOM.children.length; i += 2 ) {
        let el = thisDOM.children[i];

        if ( el['ui-dockable'] ) {
          el._finalizeStyleRecursively();
        }
      }

      //
      this.reflow();
    },

    _reflowRecursively () {
      let thisDOM = Polymer.dom(this);

      for ( let i = 0; i < thisDOM.children.length; i += 2 ) {
        let el = thisDOM.children[i];

        if ( el['ui-dockable'] ) {
          el._reflowRecursively();
        }
      }

      this.reflow();
    },

    finalizeStyle () {
      // var resizerCnt = (thisDOM.children.length - 1)/2;
      // var resizerSize = resizerCnt * resizerSpace;

      let thisDOM = Polymer.dom(this);
      let hasAutoLayout = false;

      if ( thisDOM.children.length === 1 ) {
        let el = thisDOM.children[0];

        el.style.flex = '1 1 auto';
        hasAutoLayout = true;
      } else {
        for ( let i = 0; i < thisDOM.children.length; i += 2 ) {
          let el = thisDOM.children[i];
          let size;

          if ( this.row ) {
            size = el.curWidth;
          } else {
            size = el.curHeight;
          }

          if ( size === 'auto' ) {
            hasAutoLayout = true;
            el.style.flex = '1 1 auto';
          } else {
            // // if this is last el and we don't have auto-layout elements, give rest size to last el
            // if ( i === (thisDOM.children.length-1) && !hasAutoLayout ) {
            //     el.style.flex = "1 1 auto";
            // }
            // else {
            //     el.style.flex = "0 0 " + size + "px";
            // }
            el.style.flex = `0 0 ${size}px`;
          }
        }
      }
    },

    reflow () {
      let sizeList = [];
      let totalSize = 0;
      let thisDOM = Polymer.dom(this);

      // let parentRect = this.getBoundingClientRect();

      for ( let i = 0; i < thisDOM.children.length; ++i ) {
        let el = thisDOM.children[i];
        let rect = el.getBoundingClientRect();

        var size = Math.round(this.row ? rect.width : rect.height);
        sizeList.push(size);
        totalSize += size;
      }

      for ( let i = 0; i < thisDOM.children.length; ++i ) {
        let el = thisDOM.children[i];
        if ( EditorUI.isDockResizer(el) ) {
          continue;
        }

        let ratio = sizeList[i]/totalSize;
        el.style.flex = `${ratio} ${ratio} ${sizeList[i]}px`;

        if ( this.row ) {
          el.curWidth = sizeList[i];
          // el.curHeight = parentRect.height; // DISABLE, disable this can store the last used height
        } else {
          // el.curWidth = parentRect.width; // DISABLE, disable this can store the last used height
          el.curHeight = sizeList[i];
        }
      }
    },
  });

})();
