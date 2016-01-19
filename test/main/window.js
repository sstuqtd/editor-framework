'use strict';

describe('Editor.Window', function () {
  it('should open the window and load local file', function ( done ) {
    let editorWin = new Editor.Window();
    editorWin.load('editor-framework://test/fixtures/simple.html');
    editorWin.nativeWin.webContents.on('dom-ready', () => {
      done();
    });
  });

  it('should open the window and load remote web-site', function ( done ) {
    this.timeout(10000);
    let editorWin = new Editor.Window();
    editorWin.load('http://www.baidu.com');

    expect ( editorWin._url ).to.eql('http://www.baidu.com');
    editorWin.nativeWin.webContents.on('dom-ready', () => {
      done();
    });
  });
});
