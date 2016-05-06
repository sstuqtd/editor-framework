'use strict';

const Async = require('async');
const Less = require('less');
const Globby = require('globby');
const Path = require('fire-path');
const Fs = require('fire-fs');
const Chalk = require('chalk');

let srcDir = './styles';
let destDir = './dist/css';
let absSrcDir = Path.resolve(srcDir);

Fs.emptyDirSync(destDir);

Async.series([
  // build less
  next => {
    let paths = Globby.sync(`${srcDir}/**/*.less`);
    Async.eachLimit( paths, 5, ( path, done ) => {
      path = Path.normalize(path);

      let relpath = Path.relative(absSrcDir, path);
      let content = Fs.readFileSync( path, { encoding: 'utf8' } );
      let dest = Path.join(destDir, Path.dirname(relpath), Path.basename(relpath, '.less')) + '.css';

      process.stdout.write(Chalk.blue('compile ') + Chalk.cyan(relpath) + ' ...... ');
      Less.render(content, (e, output) => {
        Fs.ensureDirSync(Path.dirname(dest));
        Fs.writeFileSync(dest, output.css, 'utf8');

        process.stdout.write(Chalk.green('done\n'));
        done();
      });
    }, err => {
      next(err);
    });
  },

  // copy other files
  next => {
    let paths = Globby.sync([
      `${srcDir}/**/*.*`,
      `!${srcDir}/**/*.less`
    ]);
    Async.eachLimit( paths, 5, ( path, done ) => {
      path = Path.normalize(path);

      let relpath = Path.relative(absSrcDir, path);
      let content = Fs.readFileSync( path );
      let dest = Path.join(destDir, relpath);

      process.stdout.write(Chalk.blue('copy ') + Chalk.cyan(relpath) + ' ...... ');

      Fs.ensureDirSync(Path.dirname(dest));
      Fs.writeFileSync(dest, content);

      process.stdout.write(Chalk.green('done\n'));
      done();
    }, err => {
      next(err);
    });
  },

], err => {
  if ( err ) {
    console.error(Chalk.red(err.stack));
  }

  console.log(Chalk.green('finish'));
});

