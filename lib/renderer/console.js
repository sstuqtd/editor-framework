'use strict';

/**
 * @module Editor
 */
let Console = {};
module.exports = Console;

// requires
const Util = require('util');
const Ipc = require('./ipc');

// ==========================
// exports
// ==========================

/**
 * Log the normal message and show on the console.
 * The method will send ipc message `console:log` to core.
 * @method log
 * @param {...*} [arg] - whatever arguments the message needs
 */
Console.log = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.log(text);
  Ipc.sendToCore('console:log', text);
};

Console.success = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.log('%c' + text, 'color: green');
  Ipc.sendToCore('console:success', text);
};

Console.failed = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.log('%c' + text, 'color: red');
  Ipc.sendToCore('console:failed', text);
};

Console.info = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.info(text);
  Ipc.sendToCore('console:info', text);
};

Console.warn = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.warn(text);
  Ipc.sendToCore('console:warn', text);
};

Console.error = function (text, ...args) {
  if ( args.length ) {
    text = Util.format.apply(Util, arguments);
  } else {
    text = '' + text;
  }
  console.error(text);

  let e = new Error('dummy');
  let lines = e.stack.split('\n');
  text = text + '\n' + lines.splice(2).join('\n');

  Ipc.sendToCore('console:error',text);
};
