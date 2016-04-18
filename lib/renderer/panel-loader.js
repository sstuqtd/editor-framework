'use strict';

/**
 * @module PanelLoader
 */
let PanelLoader = {};
module.exports = PanelLoader;

// requires
const Path = require('fire-path');
const UI = require('./ui');
const Panel = require('./panel');
const JS = require('../share/js-utils');

// ==========================
// exports
// ==========================

function _createPanelFrame ( proto ) {
  let frameEL = document.createElement('div');
  let template = proto.template;
  let style = proto.style;


  delete proto.template;
  delete proto.style;
  JS.mixin(frameEL, proto);

  if ( template ) {
    let root = frameEL.createShadowRoot();
    root.innerHTML = template;

    if ( style ) {
      let styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.textContent = style;
      root.insertBefore( styleElement, root.firstChild );
    }
  }

  return frameEL;
}

PanelLoader.load = function ( panelID, info, cb ) {
  let entryFile = Path.join( info.path, info.main );

  if ( !info.ui ) {
    UI.ResUtils.loadScripts([entryFile]).then(
      // success
      () => {
        let proto = Panel.popPanelProto();
        if ( !proto ) {
          if ( cb ) {
            cb ( new Error(`Failed to load panel ${panelID}: Can not find panel frame constructor in "UI.PolymerUtils.panels"`) );
          }
          return;
        }

        let frameEL = _createPanelFrame(proto);
        if ( cb ) {
          cb ( null, frameEL );
        }
      },

      // error
      () => {
        if ( cb ) {
          cb ( new Error(`no ui method provide`) );
        }
      }
    );
  } else if ( info.ui === 'polymer' ) {
    UI.PolymerUtils.import( entryFile, ( err ) => {
      if ( err ) {
        if ( cb ) {
          cb ( new Error(`Failed to load panel ${panelID}: ${err.message}`) );
        }
        return;
      }

      let ctor = UI.PolymerUtils.panels[panelID];
      if ( !ctor ) {
        if ( cb ) {
          cb ( new Error(`Failed to load panel ${panelID}: Can not find panel frame constructor in "UI.PolymerUtils.panels"`) );
        }
        return;
      }

      if ( cb ) {
        cb ( null, new ctor() );
      }
    });
  }
};
