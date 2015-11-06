'use strict';

describe('focusable', function () {
  var targetEL = null;

  beforeEach(function ( done ) {
    Polymer.Base.importHref('editor-framework://test/renderer/behaviors.html', function () {
      targetEL = document.createElement('test-focusable');
      document.body.appendChild(targetEL);
      done();
    });
  });

  afterEach(function ( done ) {
    document.body.removeChild(targetEL);
    targetEL = null;
    done();
  });

  it('should focus target when focus event invoked', function ( done ) {
    sinon.spy(targetEL, '_onFocus');
    targetEL.setFocus();

    setTimeout( function () {
      assert( targetEL._onFocus.calledOnce );
      expect( targetEL.focused ).to.be.equal(true);

      done();
    }, 10);
  });

  it('should blur target when blur event invoked', function ( done ) {
    sinon.spy(targetEL, '_onBlur');
    targetEL.setFocus();
    targetEL.setBlur();

    setTimeout( function () {
      assert( targetEL._onBlur.calledOnce );
      expect( targetEL.focused ).to.be.equal(false);

      done();
    }, 10);
  });

  it('should focus target when $.focus.focus() called', function ( done ) {
    sinon.spy(targetEL, '_onFocus');
    targetEL.$.focus.focus();

    setTimeout( function () {
      assert( targetEL._onFocus.calledOnce );
      expect( targetEL.focused ).to.be.equal(true);

      done();
    }, 10);
  });

  it('should focus target when $.focus.blur() called', function ( done ) {
    sinon.spy(targetEL, '_onBlur');
    targetEL.$.focus.focus();
    targetEL.$.focus.blur();

    setTimeout( function () {
      assert( targetEL._onBlur.calledOnce );
      expect( targetEL.focused ).to.be.equal(false);

      done();
    }, 10);
  });

  it('should not invoke _onBlur when target already focused', function ( done ) {
    sinon.spy(targetEL, '_onBlur');
    targetEL.$.focus.focus();
    targetEL.$.focus.focus();

    setTimeout( function () {
      expect( targetEL._onBlur.callCount ).to.be.equal(0);
      done();
    }, 10);
  });
});
