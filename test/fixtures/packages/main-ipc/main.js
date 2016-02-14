'use strict';

module.exports = {
  load () {
  },

  unload () {
  },

  messages: {
    'say-hello' ( event, reply ) {
      reply('hello');
    },

    'say-hello-02' ( event, reply ) {
      reply('hello-02');
    },

    'another:say-hello-03' ( event, reply ) {
      reply('hello-03');
    },
  }
};
