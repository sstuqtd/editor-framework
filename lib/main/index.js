'use strict';

const _ = require('lodash');

// export Editor
let Editor = require('./editor');

_.assign( Editor, require('../share/platform') );
_.assign( Editor, require('./console') );
_.assign( Editor, require('./ipc') );

Editor.IpcListener = require('../share/ipc-listener');
Editor.JS = require('../share/js-utils');
Editor.KeyCode = require('../share/keycode');
Editor.Math = require('../share/math');
Editor.Selection = require('../share/selection');
Editor.Undo = require('../share/undo');
Editor.Utils = require('../share/editor-utils');

Editor.App = require('./app');
Editor.Debugger = require('./debugger');
Editor.DevTools = require('./devtools');
Editor.Dialog = require('./dialog');
Editor.MainMenu = require('./main-menu');
Editor.Menu = require('./menu');
Editor.Package = require('./package');
Editor.Panel = require('./panel');
Editor.Profile = require('./profile');
Editor.Protocol = require('./protocol');
Editor.Window = require('./window');
Editor.Worker = require('./worker');
Editor.i18n = require('./i18n');

Editor.T = Editor.i18n.t;

// global
global.Editor = Editor;
global.unused = () => {};

// export
module.exports = Editor;
