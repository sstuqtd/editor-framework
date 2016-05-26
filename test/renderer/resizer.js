'use strict';

describe('<ui-dock-resizer>', function() {
  this.timeout(0);

  describe('<ui-dock-resizer> horizontal', () => {
    let totalSize = 480 - Editor.UI.DockUtils.resizerSpace * 2;

    Helper.runElement('editor-framework://test/fixtures/resizer.html', 'horizontal', '#container');

    beforeEach(done => {
      Editor.Window.resizeSync( 500, 200, true );
      Editor.Window.center();

      setTimeout(() => {
        Helper.targetEL._finalizeSizeRecursively(true);
        Helper.targetEL._finalizeMinMaxRecursively();
        Helper.targetEL._finalizeStyleRecursively();

        done();
      }, 100);
    });

    it('should layout the elements in same size', done => {
      let size = totalSize/3;
      size = Math.round(size);

      expect(Helper.targetEL.querySelector('#box1').offsetWidth).to.eql(size);
      expect(Helper.targetEL.querySelector('#box2').offsetWidth).to.eql(size);
      expect(Helper.targetEL.querySelector('#box3').offsetWidth).to.eql(size);

      done();
    });

    it('should continue resize the next element if the first element reach the min-width', done => {
      let resizer = Helper.targetEL.querySelector('ui-dock-resizer');
      let rect = resizer.getBoundingClientRect();

      Helper.mousetrack(resizer, 'left', 1000,
        `M${rect.left},${rect.top+50}
         L${rect.left+400},${rect.top+50}
         `,
        () => {
          expect(Helper.targetEL.querySelector('#box1').offsetWidth).to.eql(totalSize-100-100);
          expect(Helper.targetEL.querySelector('#box2').offsetWidth).to.eql(100);
          expect(Helper.targetEL.querySelector('#box3').offsetWidth).to.eql(100);

          done();
        }
      );
    });

    it('should not resize the last element when we resize in the reverse direction', done => {
      let resizer = Helper.targetEL.querySelector('ui-dock-resizer');
      let rect = resizer.getBoundingClientRect();

      Helper.mousetrack(resizer, 'left', 1000,
        `M${rect.left},${rect.top+50}
         L${rect.left+400},${rect.top+50}
         L${rect.left-400},${rect.top+50}
         `,
        () => {
          expect(Helper.targetEL.querySelector('#box1').offsetWidth).to.eql(100);
          expect(Helper.targetEL.querySelector('#box2').offsetWidth).to.eql(totalSize-100-100);
          expect(Helper.targetEL.querySelector('#box3').offsetWidth).to.eql(100);

          done();
        }
      );
    });
  });

  describe('<ui-dock-resizer> vertical', () => {
    let totalSize = 480 - Editor.UI.DockUtils.resizerSpace * 2;

    Helper.runElement('editor-framework://test/fixtures/resizer.html', 'vertical', '#container');

    beforeEach(done => {
      Editor.Window.resizeSync( 200, 500, true );
      Editor.Window.center();

      setTimeout(() => {
        Helper.targetEL._finalizeSizeRecursively(true);
        Helper.targetEL._finalizeMinMaxRecursively();
        Helper.targetEL._finalizeStyleRecursively();

        done();
      }, 100);
    });

    it('should layout the elements in same size', done => {
      let size = totalSize/3;
      size = Math.round(size);

      expect(Helper.targetEL.querySelector('#box1').offsetHeight).to.eql(size);
      expect(Helper.targetEL.querySelector('#box2').offsetHeight).to.eql(size);
      expect(Helper.targetEL.querySelector('#box3').offsetHeight).to.eql(size);

      done();
    });

    it('should continue resize the next element if the first element reach the min-width', done => {
      let resizer = Helper.targetEL.querySelector('ui-dock-resizer');
      let rect = resizer.getBoundingClientRect();

      Helper.mousetrack(resizer, 'left', 1000,
        `M${rect.left+50},${rect.top}
         L${rect.left+50},${rect.top+400}
         `,
        () => {
          expect(Helper.targetEL.querySelector('#box1').offsetHeight).to.eql(totalSize-100-100);
          expect(Helper.targetEL.querySelector('#box2').offsetHeight).to.eql(100);
          expect(Helper.targetEL.querySelector('#box3').offsetHeight).to.eql(100);

          done();
        }
      );
    });

    it('should not resize the last element when we resize in the reverse direction', done => {
      let resizer = Helper.targetEL.querySelector('ui-dock-resizer');
      let rect = resizer.getBoundingClientRect();

      Helper.mousetrack(resizer, 'left', 1000,
        `M${rect.left+50},${rect.top}
         L${rect.left+50},${rect.top+400}
         L${rect.left+50},${rect.top-400}
         `,
        () => {
          expect(Helper.targetEL.querySelector('#box1').offsetHeight).to.eql(100);
          expect(Helper.targetEL.querySelector('#box2').offsetHeight).to.eql(totalSize-100-100);
          expect(Helper.targetEL.querySelector('#box3').offsetHeight).to.eql(100);

          done();
        }
      );
    });
  });
});
