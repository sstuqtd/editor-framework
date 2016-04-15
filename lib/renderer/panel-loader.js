'use strict';

/**
 * @module PanelLoader
 */
let PanelLoader = {};
module.exports = PanelLoader;

// requires
const Path = require('fire-path');
const UI = require('./ui');

// ==========================
// exports
// ==========================

PanelLoader.load = function ( panelID, info, cb ) {
  let entryFile = Path.join( info.path, info.main );

  if ( !info.ui ) {
    // TODO: load javascript through ajax
    if ( cb ) {
      cb ( new Error(`no ui method provide`) );
    }
  } else if ( info.ui === 'polymer' ) {
    UI.PolymerUtils.import( entryFile, ( err ) => {
      if ( err ) {
        if ( cb ) {
          cb ( new Error(`Failed to load panel ${panelID}: ${err.message}`) );
        }
        return;
      }

      let frameCtor = UI.PolymerUtils.panels[panelID];
      if ( !frameCtor ) {
        if ( cb ) {
          cb ( new Error(`Failed to load panel ${panelID}: Can not find panel frame constructor in "UI.PolymerUtils.panels"`) );
        }
        return;
      }

      if ( cb ) {
        cb ( null, frameCtor );
      }
    });
  }
};
