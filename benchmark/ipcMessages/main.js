var Ipc = require('ipc');

module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'benchmark-ipc-messages:open': function () {
        Editor.Panel.open('benchmark-ipc-messages.panel1');
        Editor.Panel.open('benchmark-ipc-messages.panel2');
    },

    'benchmark-ipc-messages:test-main': function(reply) {
        reply();
    }
};
