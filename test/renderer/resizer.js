'use strict';

describe('<editor-dock-resizer>', function () {
  this.timeout(0);

  Editor.Window.resizeSync( 800, 400 );
  Editor.Window.center();

  let totalSize = 780 - EditorUI.DockUtils.resizerSpace * 2;

  Helper.runElement('editor-framework://test/fixtures/resizer.html', 'horizontal', '#container');

  beforeEach(function ( done ) {
    Helper.targetEL._finalizeSizeRecursively(true);
    Helper.targetEL._finalizeMinMaxRecursively();
    Helper.targetEL._finalizeStyleRecursively();

    done();
  });

  it('should layout the elements in same size', function ( done ) {
    let size = totalSize/3;
    size = Math.floor(size);

    expect(Helper.targetEL.querySelector('#box1').offsetWidth).to.eql(size);
    expect(Helper.targetEL.querySelector('#box2').offsetWidth).to.eql(size);
    expect(Helper.targetEL.querySelector('#box3').offsetWidth).to.eql(size);

    done();
  });

  it('should continue resize the next element if the first element reach the min-width', function ( done ) {
    let resizer = Helper.targetEL.querySelector('editor-dock-resizer');
    let rect = resizer.getBoundingClientRect();

    Helper.mousetrack(resizer, 'left', 1000,
      `M${rect.left},${rect.top+50}
       L${rect.left+400},${rect.top+50}
       `,
      function () {
        expect(Helper.targetEL.querySelector('#box1').offsetWidth).to.eql(totalSize-200-200);
        expect(Helper.targetEL.querySelector('#box2').offsetWidth).to.eql(200);
        expect(Helper.targetEL.querySelector('#box3').offsetWidth).to.eql(200);

        done();
      }
    );
  });

  it('should not resize the last element when we resize in the reverse direction', function ( done ) {
    let resizer = Helper.targetEL.querySelector('editor-dock-resizer');
    let rect = resizer.getBoundingClientRect();

    Helper.mousetrack(resizer, 'left', 1000,
      `M${rect.left},${rect.top+50}
       L${rect.left+400},${rect.top+50}
       L${rect.left-400},${rect.top+50}
       `,
      function () {
        expect(Helper.targetEL.querySelector('#box1').offsetWidth).to.eql(200);
        expect(Helper.targetEL.querySelector('#box2').offsetWidth).to.eql(totalSize-200-200);
        expect(Helper.targetEL.querySelector('#box3').offsetWidth).to.eql(200);

        done();
      }
    );
  });

});
