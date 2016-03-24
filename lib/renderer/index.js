'use strict';

const _ = require('lodash');

// export EditorR
let EditorR = require('./editor');

_.assign( EditorR, require('../share/platform') );
_.assign( EditorR, require('./console') );

EditorR.Easing = require('../share/easing');
EditorR.IpcListener = require('../share/ipc-listener');
EditorR.JS = require('../share/js-utils');
EditorR.KeyCode = require('../share/keycode');
EditorR.Math = require('../share/math');
EditorR.Selection = require('../share/selection');
EditorR.Undo = require('../share/undo');
EditorR.Utils = require('../share/utils');

EditorR.Audio = require('./audio');
EditorR.Dialog = require('./dialog');
EditorR.Ipc = require('./ipc');
EditorR.MainMenu = require('./main-menu');
EditorR.Menu = require('./menu');
EditorR.Package = require('./package');
EditorR.Panel = require('./panel');
EditorR.Protocol = require('./protocol');
EditorR.UI = require('./ui');
EditorR.Window = require('./window' );
EditorR.i18n = require('./i18n');

EditorR.T = EditorR.i18n.t;

// global
window.unused = () => {};
window.Editor = EditorR;

// export
module.exports = EditorR;
