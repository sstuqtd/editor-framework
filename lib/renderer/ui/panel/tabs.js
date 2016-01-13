(() => {
  'use strict';

  function _isTabs (el) {
    return el && el.tagName === 'EDITOR-TABS';
  }

  class Tabs extends window.HTMLElement {
    createdCallback () {
      let root = this.createShadowRoot();
      root.innerHTML = `
        <div class="border">
          <div class="tabs">
            <content select="editor-tab"></content>
          </div>

          <div id="popup" class="icon" on-click="_onPopup">
            <i class="icon-popup"></i>
          </div>
          <div id="menu" class="icon" on-click="_onMenuPopup">
            <i class="icon-menu"></i>
          </div>
          <div id="insertLine" class="insert"></div>
        </div>
      `;
      root.insertBefore(
        EditorUI.createStyleElement('editor-framework://lib/renderer/ui/css/tabs.css'),
        root.firstChild
      );
      root.insertBefore(
        EditorUI.createStyleElement('editor-framework://lib/renderer/ui/css/fontello.css'),
        root.firstChild
      );

      // init
      this.activeTab = null;

      // query element
      this.$ = {
        popup: this.shadowRoot.querySelector('#popup'),
        menu: this.shadowRoot.querySelector('#menu'),
        insertLine: this.shadowRoot.querySelector('#insertLine'),
      };

      // init events
      this.addEventListener('click', this._onClick.bind(this));
      this.addEventListener('tab-click', this._onTabClick.bind(this));
      this.addEventListener('drop-area-enter', this._onDropAreaEnter.bind(this));
      this.addEventListener('drop-area-leave', this._onDropAreaLeave.bind(this));
      this.addEventListener('drop-area-accept', this._onDropAreaAccept.bind(this));
      this.addEventListener('dragover', this._onDragOver.bind(this));
      this.$.popup.addEventListener('click', this._onPopup.bind(this));
      this.$.menu.addEventListener('click', this._onMenuPopup.bind(this));

      // init droppable
      this.droppable = 'tab';
      this.singleDrop = true;
      this._initDroppable(this);

      if ( this.children.length > 0 ) {
        this.select(this.children[0]);
      }
    }

    findTab ( frameEL ) {
      for ( let i = 0; i < this.children.length; ++i ) {
        let tabEL = this.children[i];
        if ( tabEL.frameEL === frameEL ) {
          return tabEL;
        }
      }

      return null;
    }

    insertTab ( tabEL, insertBeforeTabEL ) {
      // do nothing if we insert to ourself
      if ( tabEL === insertBeforeTabEL ) {
        return tabEL;
      }

      if ( insertBeforeTabEL ) {
        this.insertBefore(tabEL, insertBeforeTabEL);
      } else {
        this.appendChild(tabEL);
      }

      return tabEL;
    }

    addTab ( name ) {
      let tabEL = document.createElement('editor-tab');
      tabEL.name = name;

      this.appendChild(tabEL);

      return tabEL;
    }

    removeTab ( tab ) {
      let tabEL = null;
      if ( typeof tab === 'number' ) {
        if ( tab < this.children.length ) {
          tabEL = this.children[tab];
        }
      } else if ( EditorUI.isTab(tab) ) {
        tabEL = tab;
      }

      //
      if ( tabEL !== null ) {
        if ( this.activeTab === tabEL ) {
          this.activeTab = null;

          let nextTab = tabEL.nextElementSibling;
          if ( !nextTab ) {
            nextTab = tabEL.previousElementSibling;
          }

          this.select(nextTab);
        }

        this.removeChild(tabEL);
      }
    }

    select ( tab ) {
      let tabEL = null;

      if ( typeof tab === 'number' ) {
        if ( tab < this.children.length ) {
          tabEL = this.children[tab];
        }
      } else if ( EditorUI.isTab(tab) ) {
        tabEL = tab;
      }

      //
      if ( tabEL !== null ) {
        if ( tabEL !== this.activeTab ) {
          let oldTabEL = this.activeTab;

          if ( this.activeTab !== null ) {
            this.activeTab.classList.remove('active');
          }
          this.activeTab = tabEL;
          this.activeTab.classList.add('active');

          let panelID = tabEL.frameEL.getAttribute('id');
          let pagePanelInfo = Editor.Panel.getPanelInfo(panelID);
          if ( pagePanelInfo ) {
            this.$.popup.classList.toggle('hide', !pagePanelInfo.popable);
          }

          EditorUI.fire( this, 'tab-changed', {
            bubbles: true,
            detail: {
              old: oldTabEL,
              new: tabEL
            }
          });
        }
      }
    }

    outOfDate ( tab ) {
      let tabEL = null;

      if ( typeof tab === 'number' ) {
        if ( tab < this.children.length ) {
          tabEL = this.children[tab];
        }
      } else if ( EditorUI.isTab(tab) ) {
        tabEL = tab;
      }

      //
      if ( tabEL !== null ) {
        tabEL.outOfDate = true;
      }
    }

    _onClick ( event ) {
      event.stopPropagation();
      this.panelEL.setFocus();
    }

    _onTabClick ( event ) {
      event.stopPropagation();
      this.select(event.target);
      this.panelEL.setFocus();
    }

    _onDropAreaEnter ( event ) {
      event.stopPropagation();
    }

    _onDropAreaLeave ( event ) {
      event.stopPropagation();

      this.$.insertLine.style.display = '';
    }

    _onDropAreaAccept ( event ) {
      event.stopPropagation();

      EditorUI.DockUtils.dropTab(this, this._curInsertTab);
      this.$.insertLine.style.display = '';
    }

    _onDragOver ( event ) {
      // NOTE: in web, there is a problem:
      // http://stackoverflow.com/questions/11974077/datatransfer-setdata-of-dragdrop-doesnt-work-in-chrome
      let type = event.dataTransfer.getData('editor/type');
      if ( type !== 'tab' ) {
        return;
      }

      EditorUI.DockUtils.dragoverTab( this );

      //
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'move';

      let eventTarget = event.target;

      //
      this._curInsertTab = null;
      let style = this.$.insertLine.style;
      style.display = 'block';
      if ( EditorUI.isTab(eventTarget) ) {
        style.left = eventTarget.offsetLeft + 'px';
        this._curInsertTab = eventTarget;
      } else {
        let el = this.lastElementChild;
        style.left = (el.offsetLeft + el.offsetWidth) + 'px';
      }
    }

    _onPopup ( event ) {
      event.stopPropagation();

      if ( this.activeTab ) {
        let panelID = this.activeTab.frameEL.getAttribute('id','');
        Editor.Panel.popup(panelID);
      }
    }

    _onMenuPopup ( event ) {
      event.stopPropagation();

      let rect = this.$.menu.getBoundingClientRect();
      let panelID = '';
      if ( this.activeTab ) {
        panelID = this.activeTab.frameEL.getAttribute('id','');
      }

      let panelInfo = Editor.Panel.getPanelInfo(panelID);
      let popable = true;
      if ( panelInfo ) {
        popable = panelInfo.popable;
      }

      Editor.Menu.popup([
        { label: 'Maximize', message: 'panel:maximize', params: [panelID] },
        { label: 'Pop Out', message: 'panel:popup', enabled: popable, params: [panelID] },
        { label: 'Close', command: 'Editor.Panel.close', params: [panelID] },
        { label: 'Add Tab', submenu: [
          { label: 'TODO' },
        ] },
      ], rect.left + 5, rect.bottom + 5);
    }
  }
  Editor.JS.mixin(Tabs.prototype, EditorUI.Droppable);

  EditorUI.isTabs = _isTabs;
  document.registerElement('editor-tabs', Tabs);

})();
