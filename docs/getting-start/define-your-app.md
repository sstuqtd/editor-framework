To run your app with editor-framework, you should download and put `editor-framework` into your app folder. You also need to create a `package.json` file in your app's root folder, and set its `main` field to your main entry script.

Generally, an editor-framework app is structured like this

```
your-app-path/
├── editor-framework/
├── package.json
└── main.js
```

The format of `package.json` is exactly the same as that of Node's modules, and the script specified by the main field is the startup script of your app, which will run the main process. An example of your package.json might look like this:

```json
{
  "name": "your app name",
  "version": "0.0.1",
  "description": "A simple app based on editor-framework.",
  "dependencies": {},
  "main": "main.js" //<== Important!!! Must have.
}
```

## Main Entry Script

The main entry script should call `Editor.App.extend` and give it a definition.
Here is an example:

```javascript
'use strict';

// require editor-framework at the beginning
require('./editor-framework');

// extends the app
Editor.App.extend({
  // optional, init commander before app inited
  beforeInit ( commander ) {
  },

  // init your app
  init ( opts, cb ) {
    if ( cb ) {
      cb ();
    }
  },

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

Read more details about App definition in [App lifecycle and events](./app-lifecycle-and-events.md).

## Yeoman Generator

To make things simple, we also provide a yeoman generator to create an editor-framework app --- [generator-editor-framework](https://github.com/fireball-x/generator-editor-framework).
