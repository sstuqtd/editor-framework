'use strict';

(() => {
  function _isTab (el) {
    return el && el.tagName === 'EDITOR-TAB';
  }

  class Tab extends window.HTMLElement {
    createdCallback () {
      let root = this.createShadowRoot();
      root.innerHTML = `
        <span class="left-tab-border"></span>
        <div class="border">
          <div class="title">
            <div id="icon"></div>
            <span id="name"></span>
          </div>
        </div>
        <span class="right-tab-border"></span>
      `;
      root.insertBefore(
        EditorUI.createStyleElement('editor-framework://lib/renderer/ui/css/tab.css'),
        root.firstChild
      );

      this.addEventListener( 'mousedown', event => { event.stopPropagation(); } );
      this.addEventListener( 'dragstart', this._onDragStart.bind(this) );
      this.addEventListener( 'click', this._onClick.bind(this) );

      this.$ = {
        name: this.shadowRoot.querySelector('#name'),
        icon: this.shadowRoot.querySelector('#icon'),
      };
      this.frameEL = null;

      this.setIcon(null);
    }

    get name () {
      return this.$.name.innerText;
    }
    set name (val) {
      this.$.name.innerText = val;
    }

    get outOfDate () {
      return this.getAttribute('out-of-date') !== null;
    }
    set outOfDate (val) {
      if (val) {
        this.setAttribute('out-of-date', '');
      } else {
        this.removeAttribute('out-of-date');
      }
    }

    get focused () {
      return this.getAttribute('focused') !== null;
    }
    set focused (val) {
      if (val) {
        this.setAttribute('focused', '');
      } else {
        this.removeAttribute('focused');
      }
    }

    _onDragStart ( event ) {
      event.stopPropagation();

      EditorUI.DockUtils.dragstart( event.dataTransfer, this );
    }

    _onClick ( event ) {
      event.stopPropagation();

      EditorUI.fire(this, 'tab-click', {
        bubbles: true
      });
    }

    // NOTE: there is a bug on css:hover for tab,
    // when we drop tab 'foo' on top of tab 'bar' to insert before it,
    // the tab 'bar' will keep css:hover state after.
    // _onMouseEnter: function ( event ) {
    //     this.classList.add('hover');
    // },

    // _onMouseLeave: function ( event ) {
    //     this.classList.remove('hover');
    // },

    setIcon ( img ) {
      let iconEL = this.$.icon;

      if ( img ) {
        iconEL.style.display = 'inline';
        if ( iconEL.children.length ) {
          iconEL.removeChild(iconEL.firstChild);
        }
        iconEL.appendChild(img);
        // NOTE: this will prevent icon been dragged
        img.setAttribute( 'draggable', 'false' );

        return;
      }

      iconEL.style.display = 'none';
      if ( iconEL.children.length ) {
        iconEL.removeChild(iconEL.firstChild);
      }
    }
  }

  EditorUI.isTab = _isTab;
  document.registerElement('editor-tab', Tab);

})();
