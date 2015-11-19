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

  describe('Editor.Undo.record', function () {
    beforeEach(function () {
      Editor.Undo.clear();
      Helper.reset();
    });

    it('should record the foo commands', function (done) {
      _foo.a = 'a';
      Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );

      _foo.b = 'b';
      Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );

      _foo.c = 'c';
      Editor.Undo.record('foo', { json: JSON.stringify(_foo) } );

      expect( Editor.Undo._global.commands.length ).to.be.eql(3);

      done();
    });

  });

});
