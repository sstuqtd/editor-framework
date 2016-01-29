To run your app with editor-framework, you should download and put `editor-framework` into your app folder. You also need to create a `package.json` file in your app's root folder, and set its main to your app.js.

Your project structure should look like this:

```
your-app-path/
├── editor-framework/
├── package.json
└── app.js
```

The `package.json` should look like this:

```json
{
  "name": "your app name",
  "version": "0.0.1",
  "description": "A simple app based on editor-framework.",
  "dependencies": {},
  "main": "app.js" //<== Important!!! Must have.
}
```

## app.js

Here is an example:

```javascript
// require editor-framework at the beginning
require('./editor-framework');

// extends the app
Editor.App.extend({
  // optional, init commander in this pahse
  beforeInit: function ( commander ) {
  },

  // init your app
  init: function ( options ) {
  },

  // run your app
  run: function () {
    // create main window
    var mainWin = new Editor.Window('main', {
      'title': 'Editor Framework',
      'min-width': 800,
      'min-height': 600,
      'show': false,
      'resizable': true,
    });
    Editor.mainWindow = mainWin;

    // restore window size and position
    mainWin.restorePositionAndSize();

    // load and show main window
    mainWin.show();

    // load your first page
    mainWin.load( 'app://app.html' );

    // open devtools if needed
    if ( Editor.showDevtools ) {
        mainWin.openDevTools();
    }
    mainWin.focus();
  },
});
```

We also provide a yeoman generator [generator-editor-framework](https://github.com/fireball-x/generator-editor-framework)
to help users create an editor-framework app.

## Class Method: beforeInit(commander)

 - `commander` An instance of [commander.js](https://github.com/tj/commander.js)

Invoked at the very beginning of the app, before Editor module initialization. No method in `Editor` module can be used in this function.

## Class Method: init(options)

 - `options` The options parsed from `process.argv`

Invoked after `Editor` and its sub modules initialization. It is recommended to put following register work in this function:

 - register your protocol
 - register your profile path
 - register your package path
 - define your main menu

## Class Method: run()

Invoked after finish loading all packages. Basically you should open your main window in this function.

