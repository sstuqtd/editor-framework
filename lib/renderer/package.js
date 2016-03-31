'use strict';

/**
 * @module Package
 */
let Package = {};
module.exports = Package;

// requires
const Ipc = require('./ipc');

// ==========================
// exports
// ==========================

Package.reload = function ( name ) {
  Ipc.sendToMain('package:reload', name);
};

Package.queryInfos = function ( cb ) {
  Ipc.sendToMain('package:query-infos', cb);
};

Package.queryInfo = function ( name, cb ) {
  Ipc.sendToMain('package:query-info', name, cb);
};
