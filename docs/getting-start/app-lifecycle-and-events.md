You can define lifecycle callbacks, events and ipc messages in the app definition.

## lifecycle callbacks

You can define lifecycle callbacks directly in your app definition.

### beforeInit(commander)

 - `commander` Object - An instance of [commander.js](https://github.com/tj/commander.js)

Invoked at the very beginning of the app, before Editor module initialization. No method in `Editor` module can be used in this phase.

The `beforeInit` phase is designed for commander initialization. You can add additional command for your app in it.

**Example:**

```javascript
Editor.App.extend({
  beforeInit: ( commander ) => {
    commander.option('--path', 'Open a project by path');
  },
});
```

### init(opts, callback)

 - `opts` Object - The options parsed from `process.argv`
 - `callback` Function - The finished callback function

This function will be invoked after `Editor` and its sub-modules has been initialized. The init phase is asynchronous and accept a callback to finish. It is recommended to put the following work in this function:

 - register your protocol
 - register your profile path
 - init your modules
 - invoke `Editor.init`

**Example:**

```javascript
const Path = require('path');

Editor.App.extend({
  init ( opts, cb ) {
    Editor.init({
      'profile': {
        local: Path.join(Editor.App.path, '.settings'),
      },
      'package-search-path': [
        Editor.url('app://my-packages/'),
        Path.join(Editor.App.home, 'packages'),
      ]
    });

    if ( cb ) {
      cb ();
    }
  },
});
```

### run()

This function will be invoked after all packages loaded. Basically you should open your main window in this function.

**Example:**

```javascript
// extends the app
Editor.App.extend({
  // run your app
  run () {
    // create main window
    let mainWin = new Editor.Window('main', {
      title: 'My App',
      minWidth: 800,
      minHeight: 600,
      show: false,
      resizable: true,
    });
    Editor.mainWindow = mainWin;

    // load your app page
    mainWin.load( 'app://index.html' );

    // show and focus the main window
    mainWin.show();
    mainWin.focus();
  },
});
```
