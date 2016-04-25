'use strict';

const ResUtils = require('../utils/res-utils');

// ==========================
// exports
// ==========================

class Button extends window.HTMLElement {
  static get tagName () { return 'UI-BUTTON'; }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="btn">
        <content select="*"></content>
      </div>
    `;
    root.insertBefore(
      ResUtils.createStyleElement('editor-framework://lib/renderer/ui/widgets/button.css'),
      root.firstChild
    );
  }
}

module.exports = Button;
