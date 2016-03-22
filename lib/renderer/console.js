'use strict';

const Util = require('util');
const Ipc = require('./ipc');

// ==========================
// console log API
// ==========================

let Console = {
  /**
   * Log the normal message and show on the console.
   * The method will send ipc message `console:log` to core.
   * @method log
   * @param {...*} [arg] - whatever arguments the message needs
   */
  log (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.log(text);
    Ipc.sendToCore('console:log', text);
  },

  success (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.log('%c' + text, 'color: green');
    Ipc.sendToCore('console:success', text);
  },

  failed (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.log('%c' + text, 'color: red');
    Ipc.sendToCore('console:failed', text);
  },

  info (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.info(text);
    Ipc.sendToCore('console:info', text);
  },

  warn (text, ...args) {
    if ( args.length ) {
      text = Util.format.apply(Util, arguments);
    } else {
      text = '' + text;
    }
    console.warn(text);
    Ipc.sendToCore('console:warn', text);
  },

  error (text, ...args) {
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
  },
};

module.exports = Console;
