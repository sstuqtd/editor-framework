'use strict';

const Ipc = require('ipc');

describe('behaviors', function () {
  let win;

  // close window afterward
  after(function ( done ) {
    win.close();
    win.nativeWin.on('closed', () => {
      done();
    });
  });

  //
  it('running on page-level', function (done) {
    this.timeout(0);

    Ipc.on('runner:end', () => {
      done();
    });

    win = new Editor.Window('main', {
      'title': 'Test Behaviours',
      'width': 400,
      'height': 400,
      'show': true,
      'resizable': false,
    });
    win.load('editor-framework://test/behaviors.html');
  });
});
