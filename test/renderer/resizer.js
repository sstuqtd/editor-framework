'use strict';

describe('<editor-dock-resizer>', function () {
  this.timeout(0);

  Editor.Window.resizeSync( 800, 400 );
  Editor.Window.center();

  Helper.runElement('editor-framework://test/fixtures/resizer.html', 'simple', '#container');

  beforeEach(function ( done ) {
    Helper.targetEL._finalizeSizeRecursively(true);
    Helper.targetEL._finalizeMinMaxRecursively();
    Helper.targetEL._finalizeStyleRecursively();

    done();
  });

  it('should work', function ( done ) {
    let resizer = Helper.targetEL.querySelector('editor-dock-resizer');
    let rect = resizer.getBoundingClientRect();

    Helper.mousetrack(
      resizer,
      'left',
      { x: rect.left, y: rect.top + 50 },
      { x: rect.left + 400, y: rect.top + 50 },
      1000,
      function () {
        done();
      }
    );
  });
});
