'use strict';

Editor.Selection.register('normal');
Editor.Selection.register('special');

const spy = sinon.spy(Editor,'sendToAll');
const ipcSelected = spy.withArgs('selection:selected');
const ipcUnSelected = spy.withArgs('selection:unselected');
const ipcActivated = spy.withArgs('selection:activated');
const ipcDeactivated = spy.withArgs('selection:deactivated');

describe('Editor.Selection.select', function () {
  beforeEach(function () {
    Editor.Selection.clear('normal');
    spy.reset();
  });

  it('should work for simple case', function (done) {
    Editor.Selection.select('normal', 'a' );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('a');

    Editor.Selection.select('normal', 'b' );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['b']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('b');

    done();
  });

  it('should work with array', function (done) {
    Editor.Selection.select('normal', ['a','b'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('b');

    Editor.Selection.select('normal', ['c','d'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['c','d']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('d');

    done();
  });

  it('should work with confirm', function (done) {
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

  it('should work with cancel', function (done) {
    Editor.Selection.select('normal', 'a' );
    Editor.Selection.select('normal', 'b', false, false );
    Editor.Selection.select('normal', 'c', false, false );
    Editor.Selection.select('normal', 'd', false, false );

    Editor.Selection.cancel();
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('a');

    done();
  });

  it('should active none when nothing select', function (done) {
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
  it('should not break the order of the selection when item already selected', function (done) {
    Editor.Selection.select('normal', ['a','b','c','d'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b','c','d']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('d');

    Editor.Selection.select('normal', ['d','e','c','b'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['b','c','d','e']);
    expect(Editor.Selection.curActivate('normal')).to.be.eq('b');

    done();
  });

  it('should not break the order of the selection when selection not confirmed', function (done) {
    Editor.Selection.select('normal', ['a','b','c','d'], false );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b','c','d']);

    Editor.Selection.select('normal', ['d','e','c','b'], false );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a', 'b','c','d','e']);

    Editor.Selection.confirm();
    expect(Editor.Selection.curActivate('normal')).to.be.eq('b');

    done();
  });

  it('should send ipc selection:selected when select item', function (done) {
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

  it('should not send ipc selection:selected when the item already selected', function (done) {
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

  it('should send ipc message in order', function (done) {
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

describe('Editor.Selection.unselect', function () {
  beforeEach(function () {
    Editor.Selection.clear('normal');
    spy.reset();
  });

  it('should work for simple case', function (done) {
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

  it('should not sending non-selected items in the ipc message when unselect', function (done) {
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

describe('Editor.Selection.hover', function () {
  beforeEach(function () {
    Editor.Selection.clear('normal');
    spy.reset();
  });

  it('should store the last hover item', function (done) {

    Editor.Selection.hover('normal','a');
    expect(Editor.Selection.hovering('normal')).to.be.deep.eq('a');

    Editor.Selection.hover('normal','b');
    expect(Editor.Selection.hovering('normal')).to.be.deep.eq('b');

    Editor.Selection.hover('normal','c');
    expect(Editor.Selection.hovering('normal')).to.be.deep.eq('c');

    Editor.Selection.hover('normal',null);
    expect(Editor.Selection.hovering('normal')).to.be.deep.eq(null);

    done();
  });

  it('should send hover and unhover ipc message in order', function (done) {

    Editor.Selection.hover('normal','a');
    Editor.Selection.hover('normal','b');
    Editor.Selection.hover('normal',null);

    expect(spy.args).to.be.deep.eq([
      ['_selection:hoverin', 'normal', 'a', { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:hoverin', 'normal', 'a' ],

      ['_selection:hoverout', 'normal', 'a', { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:hoverout', 'normal', 'a' ],

      ['_selection:hoverin', 'normal', 'b', { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:hoverin', 'normal', 'b' ],

      ['_selection:hoverout', 'normal', 'b', { '__is_ipc_option__': true, 'self-excluded': true } ],
      ['selection:hoverout', 'normal', 'b' ],
    ]);

    done();
  });
});

describe('Editor.Selection.setContext', function () {
  beforeEach(function () {
    Editor.Selection.clear('normal');
    spy.reset();
  });

  it('should store the context', function (done) {
    Editor.Selection.select('normal',['a','b','c','d']);
    Editor.Selection.setContext('normal','e');

    expect(Editor.Selection.contexts('normal')).to.be.deep.eq(['e']);

    Editor.Selection.setContext('normal','c');
    expect(Editor.Selection.contexts('normal')).to.be.deep.eq(['c','a','b','d']);

    done();
  });
});

describe('Global Active', function () {
  beforeEach(function () {
    Editor.Selection.clear('normal');
    Editor.Selection.clear('special');
    spy.reset();
  });

  it('should change global active call selection confirmed in different type', function (done) {
    Editor.Selection.select('normal', ['a','b','c','d']);
    expect(Editor.Selection.curGlobalActivate()).to.be.deep.eq({
      type: 'normal',
      id: 'd',
    });

    Editor.Selection.select('special', ['a1','b1','c1','d1']);
    expect(Editor.Selection.curGlobalActivate()).to.be.deep.eq({
      type: 'special',
      id: 'd1',
    });

    Editor.Selection.select('normal', ['a','b','c','d']);
    expect(Editor.Selection.curGlobalActivate()).to.be.deep.eq({
      type: 'normal',
      id: 'd',
    });

    Editor.Selection.unselect('special', 'd1');
    expect(Editor.Selection.curGlobalActivate()).to.be.deep.eq({
      type: 'special',
      id: 'c1',
    });

    done();
  });

  it('should send activated and deactivated ipc message', function (done) {
    Editor.Selection.select('normal', ['a','b','c','d']);
    assert( ipcActivated.calledWith('selection:activated', 'normal', 'd') );

    Editor.Selection.select('special', ['a1','b1','c1','d1']);
    assert( !ipcDeactivated.called );
    assert( ipcActivated.calledWith('selection:activated', 'special', 'd1') );

    Editor.Selection.select('normal', ['a','b','c','d']);
    assert( !ipcDeactivated.called );
    assert( ipcActivated.calledWith('selection:activated', 'normal', 'd') );

    done();
  });
});
