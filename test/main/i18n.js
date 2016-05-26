'use strict';

describe('Editor.i18n', function () {
  beforeEach (() => {
    Editor.i18n.extend({
      test: {
        foo: '腐',
        bar: '爸'
      }
    });
  });

  afterEach (() => {
    Editor.i18n.unset('test');
  });

  it('should format the path', done => {
    expect(Editor.i18n.formatPath('i18n:test.foo/i18n:test.bar/foobar')).to.eql('腐/爸/foobar');

    done();
  });
});
