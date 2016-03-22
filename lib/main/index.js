'use strict';

global.unused = () => {};

const _ = require('lodash');

let Editor = require('./editor');

_.assign( Editor, require('../share/platform') );
_.assign( Editor, require('./console') );
_.assign( Editor, require('./ipc') );

Editor.JS = require('../share/js-utils');
Editor.Utils = require('../share/editor-utils');
Editor.Math = require('../share/math');
Editor.IpcListener = require('../share/ipc-listener');
Editor.Selection = require('../share/selection');
Editor.Undo = require('../share/undo');
Editor.KeyCode = require('../share/keycode');

Editor.i18n = require('./i18n');
Editor.App = require('./app');
Editor.Menu = require('./menu');
Editor.Window = require('./window');
Editor.Worker = require('./worker');
Editor.Panel = require('./panel');
Editor.Package = require('./package');
Editor.Protocol = require('./protocol');
Editor.DevTools = require('./devtools');
Editor.Debugger = require('./debugger');
Editor.MainMenu = require('./main-menu');
Editor.Profile = require('./profile');
Editor.Dialog = require('./dialog');

Editor.T = Editor.i18n.t;

module.exports = Editor;
