'use strict';

describe('Editor.UI.FocusMgr', function () {
  describe('_getFocusableParent', function () {
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

  describe('_getFocusableFrom', function () {
    describe('get-focusable-from-01', function () {
      Helper.runElement('editor-framework://test/fixtures/focus-mgr.html', 'get-focusable-from-01', '#g-0');

      beforeEach(function ( done ) {
        Editor.Window.center();

        let el = Helper.targetEL.querySelector('[focusable]');
        if ( el ) {
          el.focusable = true;
        }

        done();
      });

      it('should get g-00100', function ( done ) {
        let resultEL = Editor.UI.FocusMgr._getFocusableFrom(Helper.targetEL);
        expect(resultEL.id).to.eql('g-00100');

        done ();
      });
    });

    describe('get-focusable-from-02', function () {
      Helper.runElement('editor-framework://test/fixtures/focus-mgr.html', 'get-focusable-from-02', '#g-0');

      beforeEach(function ( done ) {
        Editor.Window.center();

        let el = Helper.targetEL.querySelector('[focusable]');
        if ( el ) {
          el.focusable = true;
        }

        done();
      });

      it('should get g-002', function ( done ) {
        let resultEL = Editor.UI.FocusMgr._getFocusableFrom(Helper.targetEL);
        expect(resultEL.id).to.eql('g-002');

        done ();
      });
    });

    describe('get-focusable-from-03', function () {
      Helper.runElement('editor-framework://test/fixtures/focus-mgr.html', 'get-focusable-from-03', '#g-0');

      beforeEach(function ( done ) {
        Editor.Window.center();

        let el = Helper.targetEL.querySelector('[focusable]');
        if ( el ) {
          el.focusable = true;
        }

        done();
      });

      it('should get null', function ( done ) {
        let resultEL = Editor.UI.FocusMgr._getFocusableFrom(Helper.targetEL);
        expect(resultEL).to.eql(null);

        done ();
      });
    });
  });
});
