# Creating Panels

In Editor-Framework, a `Panel` acts like a dockable "mini-window". Each panel contains a panel frame.

You can define a polymer element as your panel frame, and register it in `package.json`. Editor-Framework will dynamically then load your polymer element when the panel is opened.

## Step 1: Define the main script for your panel

To define a panel frame, first create a javascript file like this (for instance in `panel/panel.js`):


```javascript
Editor.Panel.extend({
  style: `
    h1 {
      color: #09f;
    }
  `,

  template: `
    <h1>This is a simple panel</h1>
  `,

  ready () {
  },
});
```

Available options to be passed to `extend` include:

- `template` (string): Raw HTML to be rendered as contents of panel.
- `style` (string): Raw CSS Styles to be accessible within panel
- `listeners` (object): Mapping for IPC message definitions and their respective callbacks. The callback function will be executed whenever it's matching key is received by this package's listener.
- `$` (array of strings): List of DOM IDs within your template which will be stored in the selectors object (`$`).
For example, if your template HTML contained a selector `<span id="my_title">Title</span>`, then could access its DOM node from
the code code using `$.my_title`:

  ```javascript
  // In panel/panel.js:
  Editor.Panel.extend({
    //...

    template: `
      <div><span id="my_title">Title</span></div>
    `,
    $: {
      my_title: "#my_title"
    },

    /// ...
  });

  // In panel initializer:
  init ( panel ) {
    let myTitleElm = panel.$my_title;
    // ...
  },
  ```


## Step 2: Add the panel definition to your package.json

Then save it to your package's `panel` field. After that register the html file in `package.json`:

```json
{
  "name": "simple",
  "panel": {
    "main": "panel/panel.js",
    "type": "dockable",
    "title": "Simple Panel Title",
    "width": 800,
    "height": 600
  }
}
```

## Step 3: Opening the panel:

Once your package is loaded, you can use `Editor.Panel.open('simple')` to open your panel. Note that the argument passed to `Editor.Panel.open` corresponds to the `name` field in the package's JSON definition.

### Panel ID

A Panel-ID is a string of the format `{package-name}{panel-suffix-name}`, where `panel-suffix-name` is the string after `panel`.
It is used in most of the functions in `Editor.Panel` that need to operate on a specific panel.

Suppose we have the following `package.json` file:

```json
{
  "name": "foo",
  "panel": {
    "frame": "panel/simple.html"
  },
  "panel.02": {
    "frame": "panel/simple.html"
  },
  "panel-03": {
    "frame": "panel/simple.html"
  },
  "panel@04": {
    "frame": "panel/simple.html"
  }
}
```

The file registers four panels `panel`, `panel.02`, `panel-03` and `panel@04`,
which correspond to the four panel IDs: `foo`, `foo.02`, `foo-03` and `foo@04`.

## Additional `package.json` Options

 - `main`: String (path) - Panel's main entry file.
 - `type`: String - Panel's type, can be `'dockable'`, `'float'`, `'fixed-size'`, `'quick'` and `'simple'`. Default is `'dockable'`
 - `title` String - Panel window's title in tab.
 - `frame` Boolean - Specify false to create a Frameless Window. Default is true.
 - `resizable` Boolean - Indicate if the window can be resized. Default is true.
 - `width` Integer - Panel window’s width in pixels. Default is 400.
 - `height` Integer - Panel window’s height in pixels. Default is 400.
 - `min-width` Integer - Panel window’s minimum width. Default is 200.
 - `min-height` Integer - Panel window’s minimum height. Default is 200.
 - `max-width` Integer - Panel window’s maximum width.
 - `max-height` Integer - Panel window’s maximum height.

## Registering a Template

Template HTML can be defined within the panel's main JS file (eg `package-name/panel/panel.js`).

*TODO: Expand Example*

## Registering Styles

TODO:

## Registering Behaviors

TODO:

## Registering Selectors ($)

TODO:

## Registering Ipc Messages

TODO:

## Registering Shortcuts

TODO:

## Registering Profiles

TODO:

## Example panel.js file:

```javascript
'use strict';

const Focusable = require('editor-framework/lib/renderer/ui/behaviors/focusable');

Editor.Panel.extend({
  style: `
    h1 {
      color: #09f;
    }
  `,

  template: `
    <h1 id="my_title">This is just a panel with a title</h1>
  `,

  listeners: {
    click ( event ) {
      event.stopPropagation();
      console.log('click!');
    },

    'panel-resize' ( event ) {
      console.log(event.target);
    },
  },

  $: {
    my_title: "#my_title"
  },

  ready () {
  },

  init(panel) {
    console.log(`Initialized Panel with title elm`,  panel.$my_title);
  },

  run (argv) {

  },
});

```
