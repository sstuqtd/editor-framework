'use strict';

(() => {
  class MainDock extends window.HTMLElement {
    createdCallback () {
      this.style.cssText = `
        position: relative;
      `;
      this.innerHTML = `
        <editor-dock id="root" class="fit" no-collapse></editor-dock>
      `;
    }

    attachedCallback () {
      window.requestAnimationFrame(() => {
        EditorUI.DockUtils.root = this.querySelector('#root');

        let rootDOM = Polymer.dom(EditorUI.DockUtils.root);
        Editor.loadLayout(rootDOM.parentNode, needReset => {
          if ( needReset ) {
            EditorUI.DockUtils.reset();
          }
        });
      });
    }
  }

  document.registerElement('main-dock', MainDock);
})();
