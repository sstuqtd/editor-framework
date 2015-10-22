'use strict';

var Sinon = require('sinon');
Editor.Selection.register('normal');

describe('Editor.Selection.select', () => {
  var spy = Sinon.spy(Editor,'sendToAll');
  var ipcSelected = spy.withArgs('selection:selected');
  var ipcUnSelected = spy.withArgs('selection:unselected');

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

  it('should work for with array', done => {
    Editor.Selection.select('normal', ['a','b'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b']);

    Editor.Selection.select('normal', ['c','d'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['c','d']);

    done();
  });

  it('should not break the order of the selection when item already selected', done => {
    Editor.Selection.select('normal', ['a','b','c','d'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['a','b','c','d']);

    Editor.Selection.select('normal', ['d','e','c','b'] );
    expect(Editor.Selection.curSelection('normal')).to.be.deep.eq(['b','c','d','e']);

    done();
  });

  it('should send ipc selection:selected when select item', done => {
    Editor.Selection.select('normal', 'a' );
    Editor.Selection.select('normal', 'b' );
    Editor.Selection.select('normal', ['c','d'] );
    Editor.Selection.select('normal', ['a','b'] );

    assert( ipcSelected.getCall(0).calledWith('selection:selected', 'normal', ['a']) );
    assert( ipcSelected.getCall(1).calledWith('selection:selected', 'normal', ['b']) );
    assert( ipcSelected.getCall(2).calledWith('selection:selected', 'normal', ['c','d']) );
    assert( ipcSelected.getCall(3).calledWith('selection:selected', 'normal', ['a','b']) );
    expect( ipcSelected.callCount ).to.be.equal(4);

    assert( ipcUnSelected.getCall(0).calledWith('selection:unselected', 'normal', ['a']) );
    assert( ipcUnSelected.getCall(1).calledWith('selection:unselected', 'normal', ['b']) );
    assert( ipcUnSelected.getCall(2).calledWith('selection:unselected', 'normal', ['c','d']) );
    expect( ipcUnSelected.callCount ).to.be.equal(3);

    done();
  });
});


  // it('should not send ipc selection:selected when the item already selected', done => {
  //   Editor.Selection.select('normal', 'foobar/a', false );
  //   Editor.Selection.select('normal', 'foobar/a', false );
  //   Editor.Selection.select('normal', 'foobar/b', false );
  //   Editor.Selection.select('normal', ['foobar/a','foobar/b'], false );

  //   assert( ipcSelected.getCall(0).calledWith('selection:selected', 'normal', ['foobar/a']) );
  //   assert( ipcSelected.getCall(1).calledWith('selection:selected', 'normal', ['foobar/b']) );
  //   expect( ipcSelected.callCount ).to.be.equal(2);

  //   done();
  // });

  // it('should store last selection in active until confirm', done => {
  //   Editor.Selection.select('normal', 'foobar/a', false, false );
  //   Editor.Selection.select('normal', 'foobar/b', false, false );
  //   Editor.Selection.select('normal', 'foobar/c', false, false );
  //   Editor.Selection.select('normal', 'foobar/d', false, false );

  //   expect(Editor.Selection.curSelection('normal'))
  //     .to.be.deep.eq([
  //       'foobar/a',
  //       'foobar/b',
  //       'foobar/c',
  //       'foobar/d',
  //     ]);
  //   expect(Editor.Selection.curActivate('normal'))
  //     .to.be.eq(null);

  //   Editor.Selection.confirm();
  //   expect(Editor.Selection.curActivate('normal'))
  //     .to.be.eq('foobar/d');

  //   done();
  // });
