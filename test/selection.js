'use strict';

var Sinon = require('sinon');

Editor.Selection.register('normal');

var spy = Sinon.spy(Editor,'sendToAll');
var ipcSelected = spy.withArgs('selection:selected');
var ipcUnSelected = spy.withArgs('selection:unselected');

describe('Editor.Selection.select', () => {
  beforeEach(() => {
    Editor.Selection.clear('normal');
    ipcSelected.reset();
    ipcUnSelected.reset();
  });

  it('should work for simple case', done => {
    Editor.Selection.select('normal', 'a' );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a']);

    Editor.Selection.select('normal', 'b' );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['b']);

    done();
  });

  it('should work with array', done => {
    Editor.Selection.select('normal', ['a','b'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b']);

    Editor.Selection.select('normal', ['c','d'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['c','d']);

    done();
  });

  it('should work with confirm', done => {
    Editor.Selection.select('normal', 'a', false, false );
    Editor.Selection.select('normal', 'b', false, false );
    Editor.Selection.select('normal', 'c', false, false );
    Editor.Selection.select('normal', 'd', false, false );

    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b','c','d']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq(null);

    Editor.Selection.confirm();
    expect(Editor.Selection.curActivate('normal')).to.be.eq('d');

    done();
  });

  // NOTE: I am argue about this
  it('should not break the order of the selection when item already selected', done => {
    Editor.Selection.select('normal', ['a','b','c','d'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b','c','d']);

    Editor.Selection.select('normal', ['d','e','c','b'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['b','c','d','e']);

    done();
  });

  it('should not break the order of the selection when selection not confirmed', done => {
    Editor.Selection.select('normal', ['a','b','c','d'], false );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b','c','d']);

    Editor.Selection.select('normal', ['d','e','c','b'], false );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a', 'b','c','d','e']);

    done();
  });

  it('should send ipc selection:selected when select item', done => {
    //
    Editor.Selection.select('normal', 'a' );

    assert( ipcSelected.calledWith('selection:selected', 'normal', ['a']) );

    //
    Editor.Selection.select('normal', 'b' );

    assert( ipcUnSelected.calledWith('selection:unselected', 'normal', ['a']) );
    assert( ipcSelected.calledWith('selection:selected', 'normal', ['b']) );

    //
    Editor.Selection.select('normal', ['c','d'] );

    assert( ipcUnSelected.calledWith('selection:unselected', 'normal', ['b']) );
    assert( ipcSelected.calledWith('selection:selected', 'normal', ['c','d']) );

    //
    Editor.Selection.select('normal', ['a','b'] );

    assert( ipcUnSelected.calledWith('selection:unselected', 'normal', ['c','d']) );
    assert( ipcSelected.calledWith('selection:selected', 'normal', ['a','b']) );

    //
    expect( ipcSelected.callCount ).to.be.equal(4);
    expect( ipcUnSelected.callCount ).to.be.equal(3);

    done();
  });

  it('should not send ipc selection:selected when the item already selected', done => {
    Editor.Selection.select('normal', 'a', false );
    Editor.Selection.select('normal', 'a', false );
    Editor.Selection.select('normal', 'b', false );
    Editor.Selection.select('normal', ['a','b'], false );
    Editor.Selection.select('normal', ['a','b','c','d'], false );

    assert( ipcSelected.getCall(0).calledWith('selection:selected', 'normal', ['a']) );
    assert( ipcSelected.getCall(1).calledWith('selection:selected', 'normal', ['b']) );
    assert( ipcSelected.getCall(2).calledWith('selection:selected', 'normal', ['c','d']) );
    expect( ipcSelected.callCount ).to.be.equal(3);

    done();
  });
});

describe('Editor.Selection.unselect', () => {
  beforeEach(() => {
    Editor.Selection.clear('normal');
    ipcSelected.reset();
    ipcUnSelected.reset();
  });

  it('should work for simple case', done => {
    Editor.Selection.select('normal',['a','b','c','d']);
    Editor.Selection.unselect('normal','c');

    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b','d']);

    Editor.Selection.unselect('normal',['d','a']);
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['b']);

    Editor.Selection.unselect('normal','d');
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['b']);

    Editor.Selection.unselect('normal',['a','b','c','d']);
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq([]);

    done();
  });
});
