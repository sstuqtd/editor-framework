'use strict';

const _ = require('lodash');

window.unused = () => {};

// load editor-init.js
let Editor = require('./editor');

_.assign( Editor, require('../share/platform') );
_.assign( Editor, require('./console') );
_.assign( Editor, require('./ipc') );

Editor.JS = require('../share/js-utils');
Editor.Utils = require('../share/editor-utils');
Editor.Math = require('../share/math');
Editor.Easing = require('../share/easing');
Editor.IpcListener = require('../share/ipc-listener');

Editor.i18n = require('./i18n');
Editor.T = Editor.i18n.t;

Editor.Selection = require('../share/selection');
Editor.Undo = require('../share/undo');
Editor.KeyCode = require('../share/keycode');

Editor.Dialog = require('./dialog');
Editor.Menu = require('./menu');
Editor.Window = require('./window' );
Editor.Panel = require('./panel');
Editor.Package = require('./package');

Editor.MainMenu = require('./main-menu');
Editor.Audio = require('./audio');

// init EditorUI (promise)
require('./ui/init.js');
