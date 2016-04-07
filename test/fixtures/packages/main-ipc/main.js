'use strict';

module.exports = {
  load () {
  },

  unload () {
  },

  messages: {
    'say-hello' ( event ) {
      event.reply('hello');
    },

    'say-hello-02' ( event ) {
      event.reply('hello-02');
    },

    'another:say-hello-03' ( event ) {
      event.reply('hello-03');
    },
  }
};
