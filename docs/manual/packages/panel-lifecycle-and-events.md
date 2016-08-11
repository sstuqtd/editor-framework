# Panel Callbacks and Events

## Lifecycle Callbacks:

*Called by Editor-Framework during the panel's lifecycle*
- **'ready':** Invoked after the panel has been loaded successfully and is ready to be shown
- **'run(argv)':** Invoked when panel opened or panel is shown through `Editor.Panel.open`. The `argv` is an `Object` that you send through the `Editor.Panel.open` call.
- **'close':** Invoked after is panel or its parent window is closed.

## Panel Events:

*Events received in response to actions by a user*
- **'panel-show':** Emitted immediately after any time the panel is shown
- **'panel-hide':** Emitted immediately after any time the panel is hidden
- **'panel-resize':** Emitted when the panel is resized
- **'panel-cut':** Emitted when content in the panel is cut
- **'panel-copy':** Emitted when content in the panel is copied
- **'panel-paste':** Emitted when content is pasted in the panel

## Example Usage:

**In panel/panel.js**

```javascript
Editor.Panel.extend({
  // ...
  listeners: {
    click (event) {
      event.stopPropagation();
      console.log('click!');
    },

    open() {
      console.log("Opened panel");
    },

    'panel-resize' ( event ) {
      console.log(event.target);
    }
  }
  // ...
})
```
