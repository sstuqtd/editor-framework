'use strict';

let _foo = {};
class FooCmd extends Editor.Undo.Command {
  undo () {
    _foo = JSON.parse(this.info.json);
  }
  redo () {
    _foo = JSON.parse(this.info.json);
  }
}

let _bar = {};
class BarCmd extends Editor.Undo.Command {
  undo () {
    _bar = JSON.parse(this.info.json);
  }
  redo () {
    _bar = JSON.parse(this.info.json);
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
      'foo': FooCmd,
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
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.a = 'a';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.b = 'b';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.c = 'c';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    // ----------

    expect( Editor.Undo._global._groups.length ).to.be.eql(4);
    expect( Editor.Undo._global._groups[2]._commands[0].info.json ).to.be.eql(JSON.stringify({
      a: 'a', b: 'b'
    }));

    done();
  });

  it('should undo the foo object correctly', function (done) {
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.a = 'a';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.b = 'b';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.c = 'c';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
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
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.a = 'a';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.b = 'b';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.c = 'c';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
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
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.a = 'a';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.b = 'b';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();
    // undo 4
    Editor.Undo.add('bar', { json: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    _bar.a = 'a';

    // undo 3
    Editor.Undo.add('bar', { json: JSON.stringify(_bar) } );
    Editor.Undo.commit();
    // undo 2
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.c = 'c';

    // undo 1
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.d = 'd';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
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
      a: 'a',
    });

    // undo 4
    Editor.Undo.undo();
    expect(_foo).to.be.deep.eql({
      a: 'a',
      b: 'b',
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
      a: 'a',
    });

    done();
  });

  it('should undo or redo batched command in correctly', function (done) {
    // undo 3
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.add('bar', { json: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    _foo.a = 'a';

    // undo 2
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.add('bar', { json: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    _foo.b = 'b';
    _bar.a = 'a';

    // undo 1
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.add('bar', { json: JSON.stringify(_bar) } );
    Editor.Undo.commit();

    _foo.c = 'c';
    _bar.b = 'b';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.add('bar', { json: JSON.stringify(_bar) } );
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
    Editor.Undo.add('dummy' );
    Editor.Undo.commit();

    expect(Editor.Undo.dirty()).to.be.deep.eql(false);

    // 2
    Editor.Undo.add('dummy' );
    Editor.Undo.commit();

    expect(Editor.Undo.dirty()).to.be.deep.eql(false);

    // 3
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    expect(Editor.Undo.dirty()).to.be.deep.eql(true);

    // 4
    Editor.Undo.save();
    expect(Editor.Undo.dirty()).to.be.deep.eql(false);

    // 5
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.add('dummy' );
    Editor.Undo.commit();

    expect(Editor.Undo.dirty()).to.be.deep.eql(true);

    done();
  });

  it('should work with collapse', function (done) {
    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.a = 'a';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.b = 'b';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    _foo.c = 'c';

    Editor.Undo.add('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.commit();

    //
    Editor.Undo.collapseTo(1);
    expect(Editor.Undo._global._groups.length).to.be.eql(2);
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
