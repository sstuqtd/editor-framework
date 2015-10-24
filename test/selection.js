'use strict';

var Sinon = require('sinon');

Editor.Selection.register('normal');
Editor.Selection.register('special');

var spy = Sinon.spy(Editor,'sendToAll');
var ipcSelected = spy.withArgs('selection:selected');
var ipcUnSelected = spy.withArgs('selection:unselected');
var ipcActivated = spy.withArgs('selection:activated');
var ipcDeactivated = spy.withArgs('selection:deactivated');

describe('Editor.Selection.select', () => {
  beforeEach(() => {
    Editor.Selection.clear('normal');
    spy.reset();
  });

  it('should work for simple case', done => {
    Editor.Selection.select('normal', 'a' );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('a');

    Editor.Selection.select('normal', 'b' );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['b']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('b');

    done();
  });

  it('should work with array', done => {
    Editor.Selection.select('normal', ['a','b'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('b');

    Editor.Selection.select('normal', ['c','d'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['c','d']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('d');

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

  it('should active none when nothing select', done => {
    Editor.Selection.select('normal', ['a','b','c','d'] );
    Editor.Selection.select('normal', [] );

    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq([]);
    expect(Editor.Selection.curActivate('normal')).to.be.eq(null);

    Editor.Selection.select('normal', ['a','b','c','d'] );
    Editor.Selection.select('normal', null );

    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq([]);
    expect(Editor.Selection.curActivate('normal')).to.be.eq(null);

    Editor.Selection.select('normal', ['a','b','c','d'] );
    Editor.Selection.select('normal', '' );

    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq([]);
    expect(Editor.Selection.curActivate('normal')).to.be.eq(null);

    done();
  });

  // NOTE: I am argue about this
  it('should not break the order of the selection when item already selected', done => {
    Editor.Selection.select('normal', ['a','b','c','d'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b','c','d']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('d');

    Editor.Selection.select('normal', ['d','e','c','b'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['b','c','d','e']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('b');

    done();
  });

  it('should not break the order of the selection when selection not confirmed', done => {
    Editor.Selection.select('normal', ['a','b','c','d'], false );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b','c','d']);

    Editor.Selection.select('normal', ['d','e','c','b'], false );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a', 'b','c','d','e']);

    Editor.Selection.confirm();
    expect(Editor.Selection.curActivate('normal')).to.be.eq('b');

    done();
  });

  it('should send ipc selection:selected when select item', done => {
    //
    Editor.Selection.select('normal', 'a' );

    assert( ipcSelected.calledWith('selection:selected', 'normal', ['a']) );
    assert( ipcActivated.calledWith('selection:activated', 'normal', 'a') );

    //
    Editor.Selection.select('normal', 'b' );

    assert( ipcUnSelected.calledWith('selection:unselected', 'normal', ['a']) );
    assert( ipcSelected.calledWith('selection:selected', 'normal', ['b']) );
    assert( ipcDeactivated.calledWith('selection:deactivated', 'normal', 'a') );
    assert( ipcActivated.calledWith('selection:activated', 'normal', 'b') );

    //
    Editor.Selection.select('normal', ['c','d'] );

    assert( ipcUnSelected.calledWith('selection:unselected', 'normal', ['b']) );
    assert( ipcSelected.calledWith('selection:selected', 'normal', ['c','d']) );
    assert( ipcDeactivated.calledWith('selection:deactivated', 'normal', 'b') );
    assert( ipcActivated.calledWith('selection:activated', 'normal', 'd') );

    //
    Editor.Selection.select('normal', ['a','b'] );

    assert( ipcUnSelected.calledWith('selection:unselected', 'normal', ['c','d']) );
    assert( ipcSelected.calledWith('selection:selected', 'normal', ['a','b']) );
    assert( ipcDeactivated.calledWith('selection:deactivated', 'normal', 'd') );
    assert( ipcActivated.calledWith('selection:activated', 'normal', 'b') );

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

  it('should not send ipc message in order', done => {
    Editor.Selection.select('normal', 'a' );
    Editor.Selection.select('normal', 'b' );

    expect( spy.args ).to.be.deep.eq([
      ['_selection:selected', 'normal', ['a'], { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:selected', 'normal', ['a'] ],

      ['_selection:activated', 'normal', 'a', { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:activated', 'normal', 'a' ],

      ['_selection:changed', 'normal', { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:changed', 'normal' ],

      ['_selection:unselected', 'normal', ['a'], { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:unselected', 'normal', ['a'] ],

      ['_selection:selected', 'normal', ['b'], { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:selected', 'normal', ['b'] ],

      ['_selection:deactivated', 'normal', 'a', { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:deactivated', 'normal', 'a' ],

      ['_selection:activated', 'normal', 'b', { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:activated', 'normal', 'b' ],

      ['_selection:changed', 'normal', { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:changed', 'normal' ],
    ]);

    done();
  });
});

describe('Editor.Selection.unselect', () => {
  beforeEach(() => {
    Editor.Selection.clear('normal');
    spy.reset();
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

  it('should not sending non-selected items in the ipc message when unselect', done => {
    Editor.Selection.select('normal',['a','b','c','d']);
    Editor.Selection.unselect('normal',['d','e']);

    assert( ipcUnSelected.calledWith('selection:unselected', 'normal', ['d']) );
    assert( ipcDeactivated.calledWith('selection:deactivated', 'normal', 'd') );

    Editor.Selection.unselect('normal',['b','c']);
    assert( ipcUnSelected.calledWith('selection:unselected', 'normal', ['b','c']) );
    assert( ipcDeactivated.calledWith('selection:deactivated', 'normal', 'c') );

    done();
  });
});

// TODO:
describe('Global Active', () => {
});
