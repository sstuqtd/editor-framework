'use strict';

let _foo = {};
class FooCmd extends Editor.Undo.Command {
  undo () {
    _foo = JSON.parse(this.info.before);
  }
  redo () {
    _foo = JSON.parse(this.info.after);
  }
}

let _bar = {};
class BarCmd extends Editor.Undo.Command {
  undo () {
    _bar = JSON.parse(this.info.before);
  }
  redo () {
    _bar = JSON.parse(this.info.after);
  }
}

class DummyCmd extends Editor.Undo.Command {
  undo () {}
  redo () {}
  dirty () { return false; }
}

describe('Editor.Undo', function () {
  Helper.run({
    'undo': {
      // 'foo': FooCmd,
      'bar': BarCmd,
      'dummy': DummyCmd,
    }
  });

  beforeEach(function () {
    _foo = {};
    _bar = {};

    Editor.Undo.clear();
    Helper.reset();
  });

  it('should add the foo commands', function (done) {
    let before = JSON.stringify(_foo);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.b = 'b';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.c = 'c';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    // ----------

    expect( Editor.Undo._global._groups.length ).to.be.eql(3);
    expect( Editor.Undo._global._groups[2]._commands[0].info.after ).to.be.eql(JSON.stringify({
      a: 'a', b: 'b', c: 'c'
    }));

    done();
  });

  it('should undo the foo object correctly', function (done) {
    let before = JSON.stringify(_foo);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.b = 'b';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.c = 'c';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    // ----------

    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
      c: 'c',
    });

    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
    });

    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
    });

    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({});

    done();
  });


  it('should redo the foo object correctly', function (done) {
    let before = JSON.stringify(_foo);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.b = 'b';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.c = 'c';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    // ----------

    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
      c: 'c',
    });

    Editor.Undo.undo();
    Editor.Undo.undo();
    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({});

    // again, will not over it
    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({});

    Editor.Undo.redo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
    });

    Editor.Undo.redo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
    });

    Editor.Undo.redo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
      c: 'c',
    });

    // again, will not over it
    Editor.Undo.redo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
      c: 'c',
    });

    done();
  });

  it('should undo or redo different command in order', function (done) {
    let before = JSON.stringify(_foo);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    // undo 4
    before = JSON.stringify(_foo);
    _foo.b = 'b';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    // undo 3
    before = JSON.stringify(_bar);
    _bar.a = 'a';
    Editor.Undo.add('bar', { before: before, after: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    // undo 2
    before = JSON.stringify(_foo);
    _foo.c = 'c';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    // undo 1
    before = JSON.stringify(_foo);
    _foo.d = 'd';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    // ----------

    // current snap-shot
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
      c: 'c',
      d: 'd',
    });
    expect(_bar).to.be.deep.eql({
      a: 'a',
    });

    // undo 1
    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
      c: 'c',
    });
    expect(_bar).to.be.deep.eql({
      a: 'a',
    });

    // undo 2
    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
    });
    expect(_bar).to.be.deep.eql({
      a: 'a',
    });

    // undo 3
    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
    });
    expect(_bar).to.be.deep.eql({
    });

    // undo 4
    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
    });
    expect(_bar).to.be.deep.eql({
    });

    // redo 1
    Editor.Undo.redo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
    });
    expect(_bar).to.be.deep.eql({
    });

    // redo 2
    Editor.Undo.redo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
    });
    expect(_bar).to.be.deep.eql({
      a: 'a',
    });

    done();
  });

  it('should undo or redo batched command in correctly', function (done) {
    // undo 3
    let beforeF = JSON.stringify(_foo);
    let beforeB = JSON.stringify(_bar);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: beforeF, after: JSON.stringify(_foo) } );
    Editor.Undo.add('bar', { before: beforeB, after: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    // undo 2
    beforeF = JSON.stringify(_foo);
    beforeB = JSON.stringify(_bar);
    _foo.b = 'b';
    _bar.a = 'a';
    Editor.Undo.add('foo', { before: beforeF, after: JSON.stringify(_foo) } );
    Editor.Undo.add('bar', { before: beforeB, after: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    // undo 1
    beforeF = JSON.stringify(_foo);
    beforeB = JSON.stringify(_bar);
    _foo.c = 'c';
    _bar.b = 'b';
    Editor.Undo.add('foo', { before: beforeF, after: JSON.stringify(_foo) } );
    Editor.Undo.add('bar', { before: beforeB, after: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    // ----------

    // current snap-shot
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
      c: 'c',
    });
    expect(_bar).to.be.deep.eql({
      a: 'a',
      b: 'b',
    });

    // undo 1
    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
    });
    expect(_bar).to.be.deep.eql({
      a: 'a',
    });

    // undo 2
    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
    });
    expect(_bar).to.be.deep.eql({});

    // undo 3
    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({});
    expect(_bar).to.be.deep.eql({});

    // redo 1
    Editor.Undo.redo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
    });
    expect(_bar).to.be.deep.eql({});

    // redo 2
    Editor.Undo.redo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
    });
    expect(_bar).to.be.deep.eql({
      a: 'a',
    });

    // redo 3
    Editor.Undo.redo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
      c: 'c',
    });
    expect(_bar).to.be.deep.eql({
      a: 'a',
      b: 'b',
    });

    done();
  });

  it('should work with dirty', function (done) {
    // initial
    expect(Editor.Undo.dirty()).to.be.deep.eql(false);

    // 1
    Editor.Undo.add('dummy');
    Editor.Undo.commit();

    expect(Editor.Undo.dirty()).to.be.deep.eql(false);

    // 2
    Editor.Undo.add('dummy');
    Editor.Undo.commit();

    expect(Editor.Undo.dirty()).to.be.deep.eql(false);

    // 3
    Editor.Undo.add('foo', { before: {}, after: {} } );
    Editor.Undo.commit();

    expect(Editor.Undo.dirty()).to.be.deep.eql(true);

    // 4
    Editor.Undo.save();
    expect(Editor.Undo.dirty()).to.be.deep.eql(false);

    // 5
    Editor.Undo.add('foo', { before: {}, after: {} } );
    Editor.Undo.add('dummy');
    Editor.Undo.commit();

    expect(Editor.Undo.dirty()).to.be.deep.eql(true);

    done();
  });

  it('should work with collapse', function (done) {
    let before = JSON.stringify(_foo);
    _foo.a = 'a';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.b = 'b';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    before = JSON.stringify(_foo);
    _foo.c = 'c';
    Editor.Undo.add('foo', { before: before, after: JSON.stringify(_foo) });
    Editor.Undo.commit();

    //
    Editor.Undo.collapseTo(0);
    expect(Editor.Undo._global._groups.length).to.be.eql(1);
    expect(Editor.Undo.dirty()).to.be.eql(true);

    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({});
    Editor.Undo.redo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
      c: 'c',
    });

    done();
  });

});
