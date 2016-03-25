'use strict';

describe('Editor.Selection', function () {
  Helper.run({
    'selection': ['normal', 'special'],
  });

  beforeEach(function () {
    Editor.Selection.clear('normal');
    Editor.Selection.clear('special');
    Helper.reset();
  });

  describe('Editor.Selection.select', function () {

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
      Helper.spyMessages( 'sendToAll', [
        'selection:selected',
        'selection:unselected',
      ]);

      //
      Editor.Selection.select('normal', 'a' );

      assert( Helper.sendToAll.calledWith('selection:selected', 'normal', ['a']) );
      assert( Helper.sendToAll.calledWith('selection:activated', 'normal', 'a') );

      //
      Editor.Selection.select('normal', 'b' );

      assert( Helper.sendToAll.calledWith('selection:unselected', 'normal', ['a']) );
      assert( Helper.sendToAll.calledWith('selection:selected', 'normal', ['b']) );
      assert( Helper.sendToAll.calledWith('selection:deactivated', 'normal', 'a') );
      assert( Helper.sendToAll.calledWith('selection:activated', 'normal', 'b') );

      //
      Editor.Selection.select('normal', ['c','d'] );

      assert( Helper.sendToAll.calledWith('selection:unselected', 'normal', ['b']) );
      assert( Helper.sendToAll.calledWith('selection:selected', 'normal', ['c','d']) );
      assert( Helper.sendToAll.calledWith('selection:deactivated', 'normal', 'b') );
      assert( Helper.sendToAll.calledWith('selection:activated', 'normal', 'd') );

      //
      Editor.Selection.select('normal', ['a','b'] );

      assert( Helper.sendToAll.calledWith('selection:unselected', 'normal', ['c','d']) );
      assert( Helper.sendToAll.calledWith('selection:selected', 'normal', ['a','b']) );
      assert( Helper.sendToAll.calledWith('selection:deactivated', 'normal', 'd') );
      assert( Helper.sendToAll.calledWith('selection:activated', 'normal', 'b') );

      //
      expect( Helper.message('sendToAll','selection:selected').callCount ).to.be.equal(4);
      expect( Helper.message('sendToAll','selection:unselected').callCount ).to.be.equal(3);

      done();
    });

    it('should not send ipc selection:selected when the item already selected', function (done) {
      Helper.spyMessages( 'sendToAll', [
        'selection:selected',
      ]);
      let ipcSelected = Helper.message('sendToAll','selection:selected');

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

      expect( Helper.sendToAll.args ).to.be.deep.eq([
        ['_selection:selected', 'normal', ['a'], { __ipc__: true, exclude: 'self' } ],
        ['selection:selected', 'normal', ['a'] ],

        ['_selection:activated', 'normal', 'a', { __ipc__: true, exclude: 'self' } ],
        ['selection:activated', 'normal', 'a' ],

        ['_selection:changed', 'normal', { __ipc__: true, exclude: 'self' } ],
        ['selection:changed', 'normal' ],

        ['_selection:unselected', 'normal', ['a'], { __ipc__: true, exclude: 'self' } ],
        ['selection:unselected', 'normal', ['a'] ],

        ['_selection:selected', 'normal', ['b'], { __ipc__: true, exclude: 'self' } ],
        ['selection:selected', 'normal', ['b'] ],

        ['_selection:deactivated', 'normal', 'a', { __ipc__: true, exclude: 'self' } ],
        ['selection:deactivated', 'normal', 'a' ],

        ['_selection:activated', 'normal', 'b', { __ipc__: true, exclude: 'self' } ],
        ['selection:activated', 'normal', 'b' ],

        ['_selection:changed', 'normal', { __ipc__: true, exclude: 'self' } ],
        ['selection:changed', 'normal' ],
      ]);

      done();
    });
  });

  describe('Editor.Selection.unselect', function () {
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

      assert( Helper.sendToAll.calledWith('selection:unselected', 'normal', ['d']) );
      assert( Helper.sendToAll.calledWith('selection:deactivated', 'normal', 'd') );

      Editor.Selection.unselect('normal',['b','c']);
      assert( Helper.sendToAll.calledWith('selection:unselected', 'normal', ['b','c']) );
      assert( Helper.sendToAll.calledWith('selection:deactivated', 'normal', 'c') );

      done();
    });
  });

  describe('Editor.Selection.hover', function () {
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

      expect(Helper.sendToAll.args).to.be.deep.eq([
        ['_selection:hoverin', 'normal', 'a', { __ipc__: true, exclude: 'self' } ],
        ['selection:hoverin', 'normal', 'a' ],

        ['_selection:hoverout', 'normal', 'a', { __ipc__: true, exclude: 'self' } ],
        ['selection:hoverout', 'normal', 'a' ],

        ['_selection:hoverin', 'normal', 'b', { __ipc__: true, exclude: 'self' } ],
        ['selection:hoverin', 'normal', 'b' ],

        ['_selection:hoverout', 'normal', 'b', { __ipc__: true, exclude: 'self' } ],
        ['selection:hoverout', 'normal', 'b' ],
      ]);

      done();
    });
  });

  describe('Editor.Selection.setContext', function () {
    it('should store the context', function (done) {
      Editor.Selection.select('normal',['a','b','c','d']);
      Editor.Selection.setContext('normal','e');

      expect(Editor.Selection.contexts('normal')).to.be.deep.eq(['e']);

      Editor.Selection.setContext('normal','c');
      expect(Editor.Selection.contexts('normal')).to.be.deep.eq(['c','a','b','d']);

      done();
    });
  });

  describe('Editor.Selection.clear', function () {
    it('should not send changed ipc message when clear multiple times', function (done) {
      let ipcChanged = Helper.sendToAll.withArgs('selection:changed');

      Editor.Selection.clear('normal');
      Editor.Selection.clear('normal');
      Editor.Selection.clear('normal');
      Editor.Selection.clear('normal');
      expect( ipcChanged.callCount ).to.eql(0);

      Editor.Selection.select('normal',['a','b','c','d']);
      expect( ipcChanged.callCount ).to.eql(1);

      Editor.Selection.clear('normal');
      expect( ipcChanged.callCount ).to.eql(2);

      Editor.Selection.clear('normal');
      expect( ipcChanged.callCount ).to.eql(2);

      done();
    });
  });

  describe('Global Active', function () {
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
      Helper.spyMessages('sendToAll', ['selection:deactivated']);
      let ipcDeactivated = Helper.message('sendToAll', 'selection:deactivated');

      Editor.Selection.select('normal', ['a','b','c','d']);
      assert( Helper.sendToAll.calledWith('selection:activated', 'normal', 'd') );

      Editor.Selection.select('special', ['a1','b1','c1','d1']);
      assert( !ipcDeactivated.called );
      assert( Helper.sendToAll.calledWith('selection:activated', 'special', 'd1') );

      Editor.Selection.select('normal', ['a','b','c','d']);
      assert( !ipcDeactivated.called );
      assert( Helper.sendToAll.calledWith('selection:activated', 'normal', 'd') );

      done();
    });
  });

  describe('Local Selection', function () {
    let local = Editor.Selection.local();

    beforeEach(function () {
      local.clear();
    });

    it('should not send ipc message', function (done) {
      Helper.spyMessages( 'sendToAll', [
        'selection:selected',
        'selection:unselected',
      ]);

      //
      local.select('a');
      expect(local.selection).to.be.deep.eq(['a']);
      expect(local.lastActive).to.be.eq('a');

      local.select('b');
      expect(local.selection).to.be.deep.eq(['b']);
      expect(local.lastActive).to.be.eq('b');

      assert( Helper.sendToAll.neverCalledWith('selection:selected') );
      assert( Helper.sendToAll.neverCalledWith('selection:unselected') );

      done();
    });
  });

});
