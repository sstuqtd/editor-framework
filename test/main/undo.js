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

describe('Editor.Undo', function () {
  Helper.run({
    'undo': {
      'foo': FooCmd,
      'bar': BarCmd
    }
  });

  beforeEach(function () {
    _foo = {};
    _bar = {};

    Editor.Undo.clear();
    Helper.reset();
  });

  it('should record the foo commands', function (done) {
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    _foo.a = 'a';
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    _foo.b = 'b';
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    _foo.c = 'c';
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    expect( Editor.Undo._global._groups.length ).to.be.eql(4);
    expect( Editor.Undo._global._groups[3]._commands[0].info.json ).to.be.eql(JSON.stringify({
      a: 'a', b: 'b', c: 'c'
    }));

    done();
  });

  it('should undo the foo object correctly', function (done) {
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    _foo.a = 'a';
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    _foo.b = 'b';
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    _foo.c = 'c';
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

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
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    _foo.a = 'a';
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    _foo.b = 'b';
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    _foo.c = 'c';
    Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );
    Editor.Undo.stash();

    Editor.Undo.undo();
    Editor.Undo.undo();
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


    done();
  });

});
