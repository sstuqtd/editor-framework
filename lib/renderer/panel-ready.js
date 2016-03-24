'use strict';

(() => {
  // only window open with panelID needs send request
  if ( Editor.argv.panelID ) {
    Editor.Panel.load( Editor.argv.panelID, ( err, frameEL, panelInfo ) => {
      if ( err ) {
        return;
      }

      if ( panelInfo.type === 'dockable' ) {
        let dockEL = document.createElement('editor-dock');
        dockEL.noCollapse = true;
        dockEL.classList.add('fit');

        let panelEL = document.createElement('editor-dock-panel');
        panelEL.add(frameEL);
        panelEL.select(0);

        Polymer.dom(dockEL).appendChild(panelEL);
        document.body.appendChild(dockEL);

        Editor.UI.DockUtils.root = dockEL;
      }
      else {
        document.body.appendChild(frameEL);

        Editor.UI.DockUtils.root = frameEL;
      }
      Editor.UI.DockUtils.reset();

      Editor.Ipc.sendToMain( 'panel:ready', Editor.argv.panelID );

      // save layout after css layouted
      Editor.UI.DockUtils.saveLayout();
    });
  }
})();
