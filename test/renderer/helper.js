'use strict';

describe('Test ghost-tester', function () {
  let testEL;

  beforeEach(function (done) {
    testEL = document.createElement('div');
    testEL.classList.add('layout');
    testEL.classList.add('fit');

    document.body.appendChild(testEL);
    done();
  });

  afterEach(function (done) {
    testEL.remove();
    done();
  });

  this.timeout(50);

  it('should respond keydown "a"', function ( done ) {
    testEL.addEventListener( 'keydown', function ( event ) {
      expect(event.keyCode).to.be.eql(Editor.KeyCode('a'));

      done();
    });

    Helper.keydown( testEL, 'a');
  });

  it('should respond "command + t"', function ( done ) {
    testEL.addEventListener( 'keydown', function ( event ) {
      assert(event.metaKey);
      expect(event.keyCode).to.be.eql(Editor.KeyCode('t'));

      done();
    });
    Helper.keydown( testEL, 't', ['command'] );
  });

  it('should respond keyup "b"', function ( done ) {
    testEL.addEventListener( 'keyup', function ( event ) {
      expect(event.keyCode).to.be.eql(Editor.KeyCode('b'));

      done();
    });
    Helper.keyup( testEL, 'b');
  });

  it('should respond click', function ( done ) {
    testEL.addEventListener( 'click', event => {
      expect(event.which).to.be.eql(1);

      done();
    });

    Helper.click( testEL );
  });

  it('should respond mousedown on right button', function ( done ) {
    testEL.addEventListener('mousedown', event => {
      expect(event.which).to.be.eql(3);

      done();
    });

    Helper.mousedown( testEL, 'right' );
  });

  it('should respond mouseup on left button', function ( done ) {
    testEL.addEventListener( 'mouseup', event => {
      expect(event.which).to.be.eql(1);

      done();
    });

    Helper.mouseup( testEL, 'left' );
  });

  it('should respond dblclick on left button', function ( done ) {
    testEL.addEventListener( 'dblclick', event => {
      expect(event.which).to.be.eql(1);

      done();
    });

    Helper.dblclick( testEL, 'left' );
  });

  it('should respond mousewheel', function ( done ) {
    testEL.addEventListener( 'mousewheel', event => {
      expect(event.deltaY).to.be.equal(10);
      done();
    });

    Helper.mousewheel( testEL, null, 10 );
  });

  it('should respond mousemove step', function ( done ) {
    this.timeout(0);

    let results = [
      { x: 0, y: 0 },
      { x: 20, y: 20 },
      { x: 40, y: 40 },
      { x: 60, y: 60 },
      { x: 80, y: 80 },
      { x: 100, y: 100 },
    ];
    let idx = 0;
    testEL.addEventListener( 'mousemove', event => {
      expect( event.clientX ).to.equal(results[idx].x);
      expect( event.clientY ).to.equal(results[idx].y);
      idx += 1;

      if ( idx >= results.length ) {
        done();
        return;
      }
    });

    Helper.mousemoveStep( testEL, 'left', { x: 0, y: 0 }, { x: 100, y: 100 }, 5 );
  });
});
