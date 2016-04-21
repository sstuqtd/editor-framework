'use strict';

const electron = require('electron-prebuilt');
const spawn = require('child_process').spawn;

let args = [
  process.argv[2],
].concat(process.argv.slice(3));

let app = spawn(electron, args, {
  stdio: 'inherit'
});

app.on('close', () => {
  // User closed the app. Kill the host process.
  process.exit();
});
