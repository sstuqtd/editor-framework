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
  Ipc.sendToCore('package:reload', name);
};

Package.queryInfos = function ( cb ) {
  Ipc.sendRequestToCore('package:query-infos', cb);
};

Package.queryInfo = function ( name, cb ) {
  Ipc.sendRequestToCore('package:query-info', name, cb);
};
