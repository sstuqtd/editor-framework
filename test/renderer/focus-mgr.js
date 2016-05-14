'use strict';

describe('Editor.UI.FocusMgr', function () {
  describe('simple', function () {
    Helper.runElement('editor-framework://test/fixtures/focus-mgr.html', 'nested-shadow-dom', '#wrapper');
    let childEL = null;

    beforeEach(function ( done ) {
      Editor.Window.center();

      let div = document.createElement('div');
      div.id = 'parent';
      div.focusable = true;
      let shadow = div.createShadowRoot();

      let child = document.createElement('div');
      child.id = 'child';
      child.focusable = true;
      shadow.appendChild(child);

      Helper.targetEL.appendChild(div);
      childEL = child;

      done();
    });

    it('should get parent element', function ( done ) {
      let parent = Editor.UI.FocusMgr._getFocusableParent(childEL);

      assert(parent, 'parent must exists');
      expect(parent.id).to.eql('parent');

      done ();
    });

  });
});
