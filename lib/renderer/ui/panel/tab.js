(() => {
  'use strict';

  let _tmpl = `
    <style type="text/css">
      :host {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: stretch;

        box-sizing: border-box;
        font-size: 12px;

        border-top: 1px solid #212121;
        height: 20px;

        color: #aaa;
        color: var(--hello-world);
      }

      :host(.active) {
        border-top: 1px solid #212121;
        height: 22px;
      }

      .border {
        display: inline-block;
        box-sizing: border-box;
        border-left: 1px solid rgba(255, 255, 255, 0.08);
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        height: 19px;

        background-color: #333;
      }

      /* :host(.hover) .border {     */
      /*     background-color: #555; */
      /* }                           */
      /* NOTE: there is a bug on css:hover for tab,                      */
      /* when we drop tab 'foo' on top of tab 'bar' to insert before it, */
      /* the tab 'bar' will keep css:hover state after.                  */
      .border:hover {
        background-color: #555;
      }

      .title {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;

        margin: 3px 8px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      #icon {
        display: inline-block;
        margin-right: 5px;
      }

      #icon img {
        width: 16px;
        height: 16px;
      }

      :host(.active) .border {
        /* border-top: 1px solid rgba(255, 255, 255, 0.2); */
        height: 21px;
        background-color: #474747;
      }

      :host([out-of-date]) .border, :host(.active[out-of-date]) .border {
        background-color: #700;
      }

      span.left-tab-border {
        /* display: inline-block;          */
        /* border-left: 1px solid #212121; */
        /* height: 20px;                   */
        display: none;
      }

      :host(:first-child) span.left-tab-border {
        display: inline-block;
        border-left: 1px solid #212121;
        height: 22px;
      }

      span.right-tab-border {
        display: inline-block;
        border-left: 1px solid #212121;
        height: 20px;
      }

      :host(.active) span.right-tab-border {
        display: none;
      }

      :host(:last-child) span.right-tab-border {
        display: inline-block;
        border-left: 1px solid #212121;
        height: 20px;
      }
    </style>

    <span class="left-tab-border"></span>
    <div class="border">
      <div class="title">
        <div id="icon"></div>
        <span id="name"></span>
      </div>
    </div>
    <span class="right-tab-border"></span>
  `;

  function _isTab (el) {
    return el && el.tagName === 'EDITOR-TAB';
  }

  class Tab extends window.HTMLElement {
    createdCallback () {
      this.createShadowRoot().innerHTML = _tmpl;

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
