'use strict';

/**
 * @module Editor
 */
let Console = {};
module.exports = Console;

// requires
const Electron = require('electron');
const Util = require('util');
const Winston = require('winston');

const Ipc = require('./ipc');

let _consoleConnected = false;
let _logs = [];

// ==========================
// exports
// ==========================

/**
 * Log the normal message and show on the console.
 * The method will send ipc message `console:log` to all windows.
 * @method log
 * @param {...*} [args] - whatever arguments the message needs
 */
Console.log = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected )
    _logs.push({ type: 'log', message: text });

  Winston.normal(text);
  Ipc.sendToWindows('console:log',text);
};

/**
 * Log the success message and show on the console
 * The method will send ipc message `console:success` to all windows.
 * @method success
 * @param {...*} [args] - whatever arguments the message needs
 */
Console.success = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected )
    _logs.push({ type: 'success', message: text });

  Winston.success(text);
  Ipc.sendToWindows('console:success',text);
};

/**
 * Log the failed message and show on the console
 * The method will send ipc message `console:failed` to all windows.
 * @method failed
 * @param {...*} [args] - whatever arguments the message needs
 */
Console.failed = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected )
    _logs.push({ type: 'failed', message: text });

  Winston.failed(text);
  Ipc.sendToWindows('console:failed',text);
};

/**
 * Log the info message and show on the console
 * The method will send ipc message `console:info` to all windows.
 * @method info
 * @param {...*} [args] - whatever arguments the message needs
 */
Console.info = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected )
    _logs.push({ type: 'info', message: text });

  Winston.info(text);
  Ipc.sendToWindows('console:info',text);
};

/**
 * Log the warnning message and show on the console,
 * it also shows the call stack start from the function call it.
 * The method will send ipc message `console:warn` to all windows.
 * @method warn
 * @param {...*} [args] - whatever arguments the message needs
 */
Console.warn = function (...args) {
  let text = Util.format.apply(Util, args);

  if ( _consoleConnected )
    _logs.push({ type: 'warn', message: text });

  Winston.warn(text);
  Ipc.sendToWindows('console:warn',text);
};

/**
 * Log the error message and show on the console,
 * it also shows the call stack start from the function call it.
 * The method will sends ipc message `console:error` to all windows.
 * @method error
 * @param {...*} [args] - whatever arguments the message needs
 */
Console.error = function (...args) {
  let text = Util.format.apply(Util, args);

  let err = new Error('dummy');
  let lines = err.stack.split('\n');
  text = text + '\n' + lines.splice(2).join('\n');

  if ( _consoleConnected )
    _logs.push({ type: 'error', message: text });

  Winston.error(text);
  Ipc.sendToWindows('console:error',text);
};

/**
 * Log the fatal message and show on the console,
 * the app will quit immediately after that.
 * @method fatal
 * @param {...*} [args] - whatever arguments the message needs
 */
Console.fatal = function (...args) {
  let text = Util.format.apply(Util, args);

  let e = new Error('dummy');
  let lines = e.stack.split('\n');
  text = text + '\n' + lines.splice(2).join('\n');

  if ( _consoleConnected )
    _logs.push({ type: 'fatal', message: text });

  Winston.fatal(text);
  // NOTE: fatal error will close app immediately, no need for ipc.
};

/**
 * Connect to console panel. Once the console connected, all logs will kept in `core-level` and display
 * on the console panel in `page-level`.
 * @method connectToConsole
 */
Console.connectToConsole = function () {
  _consoleConnected = true;
};

/**
 * Clear the logs
 * @method clearLog
 */
Console.clearLog = function () {
  _logs = [];
  Ipc.sendToAll('console:clear');
};

// ==========================
// Ipc Events
// ==========================

const ipcMain = Electron.ipcMain;

ipcMain.on('console:log', (event, ...args) => {
  Console.log.apply(null,args);
});

ipcMain.on('console:success', (event, ...args) => {
  Console.success.apply(null,args);
});

ipcMain.on('console:failed', (event, ...args) => {
  Console.failed.apply(null,args);
});

ipcMain.on('console:info', (event, ...args) => {
  Console.info.apply(null,args);
});

ipcMain.on('console:warn', (event, ...args) => {
  Console.warn.apply(null,args);
});

ipcMain.on('console:error', (event, ...args) => {
  Console.error.apply(null,args);
});

ipcMain.on('console:query', ( event, reply ) => {
  reply(_logs);
});

ipcMain.on('_console:clear', () => {
  Console.clearLog();
});
