'use strict';

/**
 * @module MainMenu
 */
let MainMenu = {};
module.exports = MainMenu;

// requires
const Ipc = require('./ipc');
const Menu = require('./menu');

// ==========================
// exports
// ==========================

MainMenu.init = function () {
  Ipc.sendToCore('main-menu:init');
};

MainMenu.apply = function () {
  Ipc.sendToCore('main-menu:apply');
};

MainMenu.update = function ( path, template ) {
  if ( Menu.checkTemplate(template) ) {
    Ipc.sendToCore('main-menu:update', path, template);
  }
};

MainMenu.add = function ( path, template ) {
  if ( Menu.checkTemplate(template) ) {
    Ipc.sendToCore('main-menu:add', path, template);
  }
};

MainMenu.remove = function ( path ) {
  Ipc.sendToCore('main-menu:remove', path);
};

MainMenu.set = function ( path, options ) {
  Ipc.sendToCore('main-menu:set', path, options);
};
