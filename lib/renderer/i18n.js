'use strict';

const i18n = require('../share/i18n');
const Ipc = require('./ipc');

i18n.polyglot.extend( Ipc.sendToCoreSync('editor:get-i18n-phrases') );

module.exports = i18n;
