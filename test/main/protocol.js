'use strict';

const Path = require('fire-path');

describe('Editor.url', function () {
  it('should return original path if we don\'t provide protocol', function ( done ) {
    expect(Editor.url('foo/bar/foobar.js')).to.eql('foo/bar/foobar.js');

    done();
  });

  it('should return original if the protocol is default protocol', function ( done ) {
    expect(Editor.url('http://foo/bar/foobar.js')).to.eql('http://foo/bar/foobar.js');
    expect(Editor.url('https://foo/bar/foobar.js')).to.eql('https://foo/bar/foobar.js');
    expect(Editor.url('ftp://foo/bar/foobar.js')).to.eql('ftp://foo/bar/foobar.js');
    expect(Editor.url('ssh://foo/bar/foobar.js')).to.eql('ssh://foo/bar/foobar.js');
    expect(Editor.url('file:///foo/bar/foobar.js')).to.eql('file:///foo/bar/foobar.js');

    done();
  });

  it('should return registerred protocol path', function ( done ) {
    expect(Editor.url('app://foo/bar/foobar.js')).to.eql(
      Path.join(Editor.App.path, 'foo/bar/foobar.js')
    );

    done();
  });
});
