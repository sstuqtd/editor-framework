title: Ipc Channel
category: editor
permalinks: editor/ipc-channel
---

# Ipc Channel Between Core and Page Process

Editor framework (and Fireball) has two levels of processes:

- Core-level process: In charge of creating window and web pages, access to file system, run any task that iojs (or nodejs) are capable of.
- Page-level process: Render HTML web page and run client-side JavaScript. Each web page is rendered in a separated page-level process so they will not pollute each other's DOM.

To better understand these two type of processes, read [Electron's introduction document](https://github.com/atom/electron/blob/master/docs/tutorial/quick-start.md#introduction), core-level process is Electron's main process, page-level process is Electron's renderer process.

To allow communication between core and page processes. We enhanced [Electron's ipc API](https://github.com/atom/electron/blob/master/docs/api/ipc-renderer.md) (ipc stands for Inter-process communication). Fireball and Editor Framework user will have much cleaner and easier API to build ipc communication channel between core and page level processes.

## Ipc Channel Identifier

An Ipc channel is a string to identify the message between processes. The message sender send the message with a specific channel identifier. And message handler in other process can specify which channel to "listen to".

We recommend the following pattern for an Ipc channel identifier:

```json
'package-name-or-scope:channel-name'
```

Basically you can use any string as channel identifier, but we strongly recommend you connect package name and descriptive channel name with a colon to make a channel identifier. Let's see it in action:

```json
'editor:reset-layout'
```

Editor framework use this channel to send message for reseting editor layout. `editor` is the scope, `reset-layout` describe what the channel is for.

```json
'demo-simple:open'
```

`demo-simple` is the name of an example package, you can see the code [here.](https://github.com/fireball-packages/package-examples/tree/master/simple) `open` is the action taken for message handler, usually this channel is for open a package panel, so we can use `sendToPanel` method like this:

```js
// first argument is panelID, second is channel id
Editor.sendToPanel('demo-simple.panel', 'demo-simple:open');
```

To understand panelID, read [panelID part in register panel docs](register-panels.md#panel-id).

Let's see message sending methods:


## Core Level

In core-level script, you can use the following method to send messages:


- [Editor.sendToWindows](http://docs.fireball-x.com/api/modules/Editor.html#method_sendToWindows)
- [Editor.sendToMainWindow](http://docs.fireball-x.com/api/modules/Editor.html#method_sendToMainWindow)
- [Editor.sendToAll](http://docs.fireball-x.com/api/modules/Editor.html#method_sendToAll)
- [Editor.sendToCore](http://docs.fireball-x.com/api/modules/Editor.html#method_sendToCore)
- [Editor.sendToPanel](http://docs.fireball-x.com/api/modules/Editor.html#method_sendToPanel)
- [windowInstance.sendToPage](http://docs.fireball-x.com/api/classes/Window.html#method_sendToPage) you can use `Editor.Window.find` to get window instance
- [windowInstance.sendRequestToPage](http://docs.fireball-x.com/api/classes/Window.html#method_sendRequestToPage) see also windowInstance.cancelRequestToPage
- [Editor.cancelRequestToPage](http://docs.fireball-x.com/api/classes/Window.html#method_cancelRequestToPage)

## Page Level

In page-level script, you can use the following method to send messages:

- [Editor.sendToWindows](http://docs.fireball-x.com/api/modules/Editor.html#method_sendToWindows)
- [Editor.sendToMainWindow](http://docs.fireball-x.com/api/modules/Editor.html#method_sendToMainWindow)
- [Editor.sendToCore](http://docs.fireball-x.com/api/modules/Editor.html#method_sendToCore)
- [Editor.sendToCoreSync](http://docs.fireball-x.com/api/modules/Editor.html#method_sendToCoreSync) will get return value directly
- [Editor.sendToPanel](http://docs.fireball-x.com/api/modules/Editor.html#method_sendToPanel)
- [Editor.sendRequestToCore](http://docs.fireball-x.com/api/modules/Editor.html#method_sendRequestToCore)

See also [Editor.cancelRequestToCore](http://docs.fireball-x.com/api/modules/Editor.html#method_cancelRequestToCore) for cancel request.

## Message Handlers

### On Core Level

Register a message handler in core-level script is easy, just add a property with the name of Ipc channel id to your core-level module:

```js
module.exports = {
    // ...

    'demo-simple:open': function () {
        // do your job in core level, such as open a panel
        Editor.Panel.open('demo-simple.panel');
    }
};
```

### On Page Level

Register the Ipc channel id you want to listen to in `panels.panel.messages` property of `package.json`:
```json
"panels": {
  "panel": {
    "messages": [
        "demo-simple:run"
    ]
  }
}
```
Please notice `panel` is the name for panelID, you can register your panel with any name you like, see [Create Panels](packages/create-panels.md).

Once Ipc channel id registered, you can add a property in your `Editor.registerPanel` object:

```js
Editor.registerPanel( 'demo-simple.panel', {
    is: 'demo-simple',
    // ...
    // to receive IPC message on page-level, you need to register message in package.json
    "demo-simple:run" : function () {
        // run some tasks on page-level
    }
});
```

## Message With Parameter

You can pass any number of parameters you like with a message:

```js
// on core-level
Editor.sendToPanel('demo-simple.panel', 'demo-simple:log', someText);

// on page-level
Editor.registerPanel( 'demo-simple.panel', {
    // log the text passed to editor console
    "demo-simple:log" : function (text) {
        Editor.log(text);
    }
}
```

## Broadcast Message

TODO:
