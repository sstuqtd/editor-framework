# Editor Framework

[Documentation](https://github.com/cocos-creator/editor-framework/tree/master/docs) |
[Downloads](https://github.com/cocos-creator/editor-framework/releases/) |
[Install](#install) |
[Features](#features)

[![Circle CI](https://circleci.com/gh/cocos-creator/editor-framework.svg?style=svg)](https://circleci.com/gh/cocos-creator/editor-framework)
[![Build Status](https://travis-ci.org/cocos-creator/editor-framework.svg?branch=master)](https://travis-ci.org/cocos-creator/editor-framework)
[![Build status](https://ci.appveyor.com/api/projects/status/ugkft1nmcy2wklrl?svg=true)](https://ci.appveyor.com/project/jwu/editor-framework)
[![bitHound Overall Score](https://www.bithound.io/github/cocos-creator/editor-framework/badges/score.svg)](https://www.bithound.io/github/cocos-creator/editor-framework)
[![Dependency Status](https://david-dm.org/cocos-creator/editor-framework.svg)](https://david-dm.org/cocos-creator/editor-framework)
[![devDependency Status](https://david-dm.org/cocos-creator/editor-framework/dev-status.svg)](https://david-dm.org/cocos-creator/editor-framework#info=devDependencies)

Editor Framework gives you power to easily write professional multi-panel desktop software in HTML5 and node.js.

The framework is based on top of [Electron](http://github.com/atom/electron).
It is designed conforming to Electron’s [main and renderer process architecture](https://github.com/atom/electron/blob/master/docs/tutorial/quick-start.md).
To make multiple windows communicate easily, Editor Framework extends [Electron’s IPC message API](https://github.com/atom/electron/blob/master/docs/api/ipc-renderer.md), making it easier to send and receive callbacks between the main and renderer processes.

It is designed for full extensibility. In the main process, we achieve this by introducing a package management module and several registration APIs. The user can load or unload packages on the fly without closing or restarting the app. In the renderer process, we use HTML5 Web Component standards (Custom Element and Shadow DOM) by default, and providing a set of builtin ui-kit to help user extend the widgets and panels. We also allow user integrate their ui framework such as Polymer, Vue.js, React and so on.

**NOTE: editor-framework is currently under active developing. The document is a little bit out of date, but still can help you getting start. I will update the doc as soon as possible.**

![demo-01](https://cloud.githubusercontent.com/assets/174891/16065534/3480115a-32de-11e6-88ba-9bdb5f047602.png)

## Install

Suppose you have an Electron project, if not, just create an empty directory and run `npm init` in it.
After that, install editor-framework as a package of your project:

```bash
npm install --save editor-framework
```

## Usage

Here is a simple example to show you how to use editor-framework in your Electron project.

**package.json**

```json
{
  "name": "your app name",
  "version": "0.0.1",
  "description": "A simple app based on editor-framework.",
  "dependencies": {},
  "main": "main.js"
}
```

**main.js**

```javascript
const Editor = require('editor-framework');

Editor.App.extend({
  init ( opts, cb ) {
    Editor.init({
      'package-search-path': [
        Editor.url('app://packages/'),
      ],
    });

    if ( cb ) {
      cb ();
    }
  },

  run () {
    // create main window
    let mainWin = new Editor.Window('main', {
      title: 'Editor Framework',
      width: 900,
      height: 700,
      minWidth: 900,
      minHeight: 700,
      show: false,
      resizable: true,
    });
    Editor.Window.main = mainWin;

    // restore window size and position
    mainWin.restorePositionAndSize();

    // load and show main window
    mainWin.load( 'app://index.html' );
    mainWin.show();

    // open dev tools if needed
    if ( Editor.argv.showDevtools ) {
      // NOTE: open dev-tools before did-finish-load will make it insert an unused <style> in page-level
      mainWin.nativeWin.webContents.once('did-finish-load', function () {
        mainWin.openDevTools({
          detach: true
        });
      });
    }
    mainWin.focus();
  },
});
```

**index.html**

```html
<html>
  <head>
    <title>Main Window</title>
    <meta charset="utf-8">

    <style>
      #mainDock {
        position: relative;
      }
    </style>
  </head>

  <body class="layout vertical">
    <main-dock class="flex-1"></main-dock>
  </body>
</html>
```

## Features

### Extends Your App through Packages

 - Dynamically load and unload packages
 - Watch package changes and notify changes immediately
 - Hot reload your packages

### Manage Panels

 - Freely docks panel anywhere in multiple windows
 - Dynamically load user define panels from package
 - Easily register and respond to ipc messages for your panel
 - Easily register shortcuts (hotkeys) for your panel
 - Save and load panel profiles
 - Save and load panels layout in json

### Menu Extends

 - Manipulate menu items by menu path (`foo/bar/foobar` for example)
 - Dynamically add and remove menu item
 - Dynamically change menu item state (enabled, checked, visible, ...)
 - Load user menu from packages

### Builtin UI-KIT

 - A bunch of ui elements to boost your developing
   - `<ui-button>`
   - `<ui-checkbox>`
   - `<ui-color>` and `<ui-color-picker>`
   - `<ui-input>`
   - `<ui-num-input>`
   - `<ui-select>`
   - `<ui-slider>`
   - `<ui-text-area>`
 - A [ui-kit-preview](https://github.com/fireball-packages/ui-kit-preview) to help you learn and custom ui-kit
 - Developing ui elements by Custom Element and Shadow DOM
 - Allow user customize their theme for ui elements
 - Can be integrate with any other UI frameworks (Polymer, Vue.js, React, ...)
 - Well designed with focus behavior (Use our own focus manager for better user experience)
 - Uniform events (`change`, `confirm` and `cancel`) in every ui element to make our ui-kit friendly for Undo/Redo system

### UI Property

 - A `<ui-prop>` element to help user write properties/inspector panel
 - Automatically detect and choose a view for the property by type
 - Allow user register their own property type and customize the view for it
 - Support nested property (for `object` type and `array` type)
 - Support disable, readonly property in hierarchy

### Profiles

 - Customize your profile for different scope (globa, local, project, ...)
 - Load and save profiles through unified API

### Logs

 - Uniform log interface for main and renderer process
 - Sort and store all windows and main process logs in one place
 - Support log to file
 - Integrate with [console](https://github.com/fireball-packages/console) for display and query your logs

### Selection

 - Selection cached and synced among windows
 - User can register his own selection type
 - Automatically filtering selections

### IPC

 - Enhance IPC Programming Experience
 - Allow sending ipc message to specific panel
 - Allow sending ipc message to specific window
 - Allow sending ipc request and waiting for the reply in callback function

### Undo & Redo

 - Global Undo and Redo

### Test Driven Workflow

 - Integrate [node-tap](http://www.node-tap.org/) to the test framework
 - Detect your package changes and automatically run tests under it in [tester](https://github.com/fireball-packages/tester)
 - A helper module to simulate UI input (mouse, keyboard) to help user write panel tests
 - Automatically recreate your test target (windows, widgets, panels, ...) after each test case

## Develop

### Getting Start

Clone the repo:

```bash
git clone https://github.com/cocos-creator/editor-framework
```

Run `npm install` in it:

```bash
npm install
npm run build # build styles
```

### Install and Run Examples

#### example-apps

```bash
git clone https://github.com/exsdk/example-apps
npm start ./example-apps/${example-name}
```

#### example-apps/demo

The example-apps provide a demo project to help user developing packages. To use the demo project,
first we need to install it. Go to the demo folder and run the following command:

```bash
cd ./example-apps/demo
npm install
bower install
gulp update
```

After you success to install it, you can run the demo in editor-framework root directory through the command:

```bash
npm start ./example-apps/demo
```

### Test Environment

To test the editor-framework itself, just run:

```bash
npm test [./your/test/file] -- [options]

## or

npm start ./test -- test ./your/test/file [options]
```

You can also run a single test or a bunch of tests in one directory by:

```bash
npm test ${your/test/path}
```

You can also force to run tests in renderer by `--renderer` option:

```bash
npm test ${your/test/path} -- --renderer
```

You can load specific package and run its tests by `--package` option:

```bash
npm test ${your/test/path} -- --package
```

To debug a test, use `--detail` option:

```bash
npm test ${your/test/path} -- --detail
```

To change a reporter, use `--reporter name` option:

```bash
npm test ${your/test/path} -- --reporter classic
```

### Write Your Test

**Main Process**

```js
suite(tap, 'Test Main Process', t => {
  t.test ('should be ok', t => {
    t.end();
  });
});
```

**Renderer Process**

```html
<template id="basic">
  <div class="title">Hello World</div>
</template>
```

```js
suite(tap, 'Test Renderer Process', t => {
  t.test('should be ok', t => {
    helper.runElement(
      'app://test/my-template.html', 'basic', 'div.title',
      el => {
        t.assert(el, 'element not found');
        t.equal(el.innertText, 'Hello World');

        t.end();
      }
    );
  });
});
```

### Generate Documentation

To generate the document, just run:

```bash
npm run api
```

It will generate the API document in `./apidocs`, you can browse it by open `./apidocs/index.html`.

## License (MIT)

Copyright (c) 2015 Cocos Creator

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
