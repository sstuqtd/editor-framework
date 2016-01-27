'use strict';

describe('errors', function () {
  this.timeout(0);

  it('should report error', function ( done ) {
    expect(obj.nothing).to.eql('foobar');
    done();
  });

  it('should report error in nested function', function ( done ) {
    setTimeout( function () {
      expect(obj.nothing).to.eql('foobar');
      done();
    }, 10 );
  });
});
