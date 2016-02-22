## Main and Renderer Process

editor-framework has two levels of processes:

- Main Process: In charge of creating window and web pages, share data among renderer processes.
- Renderer Process: Render HTML web page and run client-side JavaScript. Each window is a separated renderer process.

To better understand these two type of processes, read [Electron's introduction document](https://github.com/atom/electron/blob/master/docs/tutorial/quick-start.md). If you're still confused, think of main process as a node.js server, and renderer process as a web client.

Electron provides two IPC modules [ipcMain ](https://github.com/atom/electron/blob/master/docs/api/ipc-main.md) and [ipcRenderer](https://github.com/atom/electron/blob/master/docs/api/ipc-renderer.md) to allow users communication between main and renderer processes. The editor-framework encapsulate these two modules to make it even easier for more complex scenarios.

## IPC Message Identifier

An IPC message is a string to identify the message between processes. The message sender sends the message with a specific identifier. And message receiver in other process can specify which channel to "listen to".

We recommend the following pattern for an IPC message identifier:

```json
'package-name-or-scope:message-name'
```

Basically you can use any string as message identifier, but we strongly recommend you connect package name and descriptive message name with a colon to make a channel identifier. Let's see it in action:

```json
'editor:reset-layout'
```

Editor framework use this message for reseting editor layout. `editor` is the scope, `reset-layout` is the action.
