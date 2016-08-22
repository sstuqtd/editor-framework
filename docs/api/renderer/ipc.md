# Editor.Ipc

## Methods

### Editor.Ipc.cancelRequest (sessionID)

 - `sessionID` String - Session ID.

Cancel request sent to main or renderer process.

### Editor.Ipc.option (opts)

 - `opts` Object
   - `excludeSelf` Boolean - exclude send ipc message to main process when calling `Editor.Ipc.sendToAll`.

Ipc option used in `Editor.Ipc.sendToAll`.

### Editor.Ipc.sendToAll (message[, ...args, option])

 - `message` String - Ipc message.
 - `...args` ... - Whatever arguments the message needs.
 - `option` Object - You can indicate the last argument as an IPC option by `Editor.Ipc.option({...})`.

Send `message` with `...args` to all opened window and to main process asynchronously.
