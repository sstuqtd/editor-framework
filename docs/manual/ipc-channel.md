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


- [Editor.sendToWindows]()
- [Editor.sendToMainWindow]()
- [Editor.sendToAll]()
- [Editor.sendToCore]()
- [Editor.sendToPanel]()
- [windowInstance.sendToPage]() you can use `Editor.Window.find` to get window instance
- [windowInstance.sendRequestToPage]() see also windowInstance.cancelRequestToPage


## Page Level

In page-level script, you can use the following method to send messages:

- [Editor.sendToWindows]()
- [Editor.sendToMainWindow]()
- [Editor.sendToCore]()
- [Editor.sendToCoreSync]() will get return value directly
- [Editor.sendToPanel]()
- [Editor.sendRequestToCore]() see also `Editor.cancelRequestToCore`

## Message Handlers

TODO:
