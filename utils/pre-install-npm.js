'use strict';

var Npm = require('npm');
var Fs = require('fs');

var _defaultRegistry = 'https://registry.npmjs.org/';

var setupMirror = require('./libs/setup-mirror');

setupMirror(function() {
  var mirror = JSON.parse(Fs.readFileSync('local-setting.json')).mirror;
  Npm.load({}, function () {
    var registry = _defaultRegistry;
    if (mirror === 'china') {
      registry = 'http://registry.npm.taobao.org/';
    }
    Npm.config.set('registry', registry, 'user');
    Npm.config.save('user', function (err) {
      // foo = bar is now saved to ~/.npmrc or wherever
      if (err) {
        throw err;
      }
    });
  });
});
