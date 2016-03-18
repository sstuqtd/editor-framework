'use strict';

const path = require('path');
const chalk = require('chalk');
const async = require('async');

const electron = require('electron-prebuilt');
const jetpack = require('fs-jetpack');
const spawn = require('child_process').spawn;

// get cwd
let cwd = process.cwd();

// get main files
let mainTests = jetpack.find('test', {
  matching: ['main/**/*.js', 'share/**/*.js', '!**/*.skip.js']
});

// get renderer files
let rendererTests = jetpack.find('test', {
  matching: ['renderer/**/*.js', 'share/**/*.js', '!**/*.skip.js']
});

// process tests
let failedTests = [];
async.eachSeries([
  { files: mainTests, renderer: false },
  { files: rendererTests, renderer: true },
], (info, next) => {
  async.eachSeries(info.files, (file, done) => {
    console.log( chalk.magenta('Start test: ') + chalk.cyan( path.relative(cwd, file) ) );

    let args = [];
    if ( info.renderer ) {
      args = ['./test', 'test', '--renderer', '--reporter', 'spec', file];
    } else {
      args = ['./test', 'test', '--reporter', 'spec', file];
    }

    let app = spawn(electron, args, {
      stdio: [ 0, 1, 2, 'ipc' ]
    });

    app.on('message', data => {
      if ( data.channel === 'process:end' ) {
        if ( data.failures > 0 ) {
          failedTests.push(data.path);
        }
      }
    });

    app.on('exit', () => {
      done();
    });

  }, next );
}, err => {
  if (err) {
    throw err;
  }

  if ( !failedTests.length ) {
    console.log(chalk.green('================================='));
    console.log(chalk.green('All tests passed, Congratulations! '));
    console.log(chalk.green('================================='));
    return;
  }

  console.log(chalk.red('================================='));
  console.log(chalk.red(`${failedTests.length} failes: `));
  console.log(chalk.red('================================='));

  failedTests.forEach(file => {
    // SpawnSync(
    //   exePath,
    //   [cwd, '--test', file, '--reporter', 'spec'],
    //   {stdio: 'inherit'}
    // );
    console.log(chalk.red(` - ${file}`));
  });

  throw new Error(`${failedTests.length} test(s) faield.`);
});
