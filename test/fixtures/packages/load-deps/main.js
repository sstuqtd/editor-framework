var CoreTest = require('./core/test');
var Test = require('./test');

module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'demo-simple:open': function () {
        Editor.Panel.open('demo-simple.panel');
    },
};
