'use strict';

var Sinon = require('sinon');
Editor.Selection.register('normal');

describe('Selection In Core Level', () => {
  beforeEach(() => {
    Editor.Selection.clear('normal');
  });

  it('should store current selection', done => {
    Editor.Selection.select('normal', 'foobar/a' );

    expect(Editor.Selection.curSelection('normal'))
      .to.be.deep.eq(['foobar/a']);

    Editor.Selection.select('normal', 'foobar/b', false );
    expect(Editor.Selection.curSelection('normal'))
      .to.be.deep.eq(['foobar/a', 'foobar/b']);

    // NOTE: this should unselect last selection
    Editor.Selection.select('normal', 'foobar/c' );
    expect(Editor.Selection.curSelection('normal'))
      .to.be.deep.eq(['foobar/c']);

    done();
  });

  it('should store last selection in active until confirm', done => {
    Editor.Selection.select('normal', 'foobar/a', false, false );
    Editor.Selection.select('normal', 'foobar/b', false, false );
    Editor.Selection.select('normal', 'foobar/c', false, false );
    Editor.Selection.select('normal', 'foobar/d', false, false );

    expect(Editor.Selection.curSelection('normal'))
      .to.be.deep.eq([
        'foobar/a',
        'foobar/b',
        'foobar/c',
        'foobar/d',
      ]);
    expect(Editor.Selection.curActivate('normal'))
      .to.be.eq(null);

    Editor.Selection.confirm();
    expect(Editor.Selection.curActivate('normal'))
      .to.be.eq('foobar/d');

    done();
  });
});

describe('Selection Ipc In Core Level', () => {
  var ipcSelected = Sinon.spy(Editor,'sendToAll').withArgs('selection:selected');

  beforeEach(() => {
    Editor.Selection.clear('normal');
    ipcSelected.reset();
  });

  it('should send ipc selection:selected when select item', done => {
    Editor.Selection.select('normal', 'foobar/a' );
    Editor.Selection.select('normal', 'foobar/b' );
    Editor.Selection.select('normal', ['foobar/c','foobar/d'] );
    Editor.Selection.select('normal', ['foobar/a','foobar/b'] );

    assert( ipcSelected.getCall(0).calledWith('selection:selected', 'normal', ['foobar/a']) );
    assert( ipcSelected.getCall(1).calledWith('selection:selected', 'normal', ['foobar/b']) );
    assert( ipcSelected.getCall(2).calledWith('selection:selected', 'normal', ['foobar/c','foobar/d']) );
    assert( ipcSelected.getCall(3).calledWith('selection:selected', 'normal', ['foobar/a','foobar/b']) );
    expect( ipcSelected.callCount ).to.be.equal(4);

    done();
  });

  it('should not send ipc selection:selected when the item already selected', done => {
    Editor.Selection.select('normal', 'foobar/a', false );
    Editor.Selection.select('normal', 'foobar/a', false );
    Editor.Selection.select('normal', 'foobar/b', false );
    Editor.Selection.select('normal', ['foobar/a','foobar/b'], false );

    assert( ipcSelected.getCall(0).calledWith('selection:selected', 'normal', ['foobar/a']) );
    assert( ipcSelected.getCall(1).calledWith('selection:selected', 'normal', ['foobar/b']) );
    expect( ipcSelected.callCount ).to.be.equal(2);

    done();
  });
});
