'use strict';

// main-process
if ( process.type !== 'browser' ) {
  throw new Error('Do not require editor-framework in page-level.');
}

module.exports = require('./core/init');
