'use strict';

// main-process
if ( process.type !== 'browser' ) {
  throw new Error('Do not require editor-framework in renderer process.');
}

module.exports = require('./lib/main/');
