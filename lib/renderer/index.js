'use strict';

const _ = require('lodash');

// export Editor
let Editor = require('./editor');

_.assign( Editor, require('../share/platform') );
_.assign( Editor, require('./console') );
_.assign( Editor, require('./ipc') );

Editor.Easing = require('../share/easing');
Editor.IpcListener = require('../share/ipc-listener');
Editor.JS = require('../share/js-utils');
Editor.KeyCode = require('../share/keycode');
Editor.Math = require('../share/math');
Editor.Selection = require('../share/selection');
Editor.Undo = require('../share/undo');
Editor.Utils = require('../share/editor-utils');

Editor.Audio = require('./audio');
Editor.Dialog = require('./dialog');
Editor.MainMenu = require('./main-menu');
Editor.Menu = require('./menu');
Editor.Package = require('./package');
Editor.Panel = require('./panel');
Editor.Window = require('./window' );
Editor.i18n = require('./i18n');

Editor.T = Editor.i18n.t;

// init EditorUI (promise)
require('./ui/init.js');

// global
window.unused = () => {};
window.Editor = Editor;

// export
module.exports = Editor;
