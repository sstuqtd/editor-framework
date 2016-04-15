## CHANGELOG

### v0.6.0 (developing)

 - remove polymer

### v0.5.2 (developing)

 - Fix set break point in an ipc message in renderer will lead to devtools crash
 - Add `Editor.Protocol.register` in renderer process
 - Add `deprecate` function in global and window
 - deprecate `pkgDependencies` in `package.json`, use `packages` instead
 - deprecate `panels` in `package.json`, use `panel` instead. for multiple panel registry, use `panel.x` for the additional panel.
 - deprecate `Editor.registerPanel`, use `Editor.polymerPanel` instead
 - deprecate `Editor.registerElement`, use `Editor.polymerElement` instead

### v0.5.1

 - Provide `Editor.App.quit` callback for user to control the quiting phase in Editor
 - Fix `Editor.Ipc.sendTo` will swallow last argument if it is a number
 - Simplify `Editor.Ipc.sendToPanel` message
 - Require the first argument for `event.reply` be `null` or instance of `Error`
 - Add explicit timeout error for callback in `Editor.sendXXXX`
 - Add explicit panel not found error for callback in `Editor.sendToPanel`
 - Add explicit message not found error for callback in `Editor.sendToPanel`

### v0.5.0

 - upgrade to Electron v0.37.5
 - modulize the code
 - use shadow dom for panel content
 - disableAutoHideCursor by default for Editor.Window
 - add mouse hint for tests
 - add REPL interaction for main process
 - add `Editor.DevTools` in main process
 - upgrade `globby` and `del` to latest version (the promise one)
 - replace `commander.js` with `yargs`
 - BREAKING CHANGES
   - change the way of register ipc messages in package's entry point
   - change the field to register main menu item in `package.json` from `menus` to `main-menu`
   - replace `Editor.runMode` with `Editor.argv._command`
   - replace `Editor.runOpts` with `Editor.argv`
   - replace `Editor.isDev` with `Editor.dev`
   - replace `Editor.showDevtools` with `Editor.argv.showDevtools`
   - remove `Editor.events`, use `Editor.App` `on`, `off`, `once` and `emit` instead
   - replace `Editor.mainWindow` with `Editor.Window.main`
   - replace `Editor.loadProfile` with `Editor.Profile.load`
   - replace `Editor.registerProfilePath` with `Editor.Profile.register`
   - replace `Editor.registerProtocol` with `Editor.Protocol.register`
   - replace `Editor.focused` with `Editor.App.focused`
   - replace `Editor.isCoreLevel` with `Editor.isMainProcess`
   - replace `Editor.isPageLevel` with `Editor.isRendererProcess`
   - put `Editor.sendXXXX` functions to `Editor.Ipc` module
   - replace `Editor.sendToCore` to `Editor.Ipc.sendToMain`
   - replace `Editor.sendToCoreSync` to `Editor.Ipc.sendToMainSync`
   - replace `Editor.sendToMainWindow` to `Editor.Ipc.sendToMainWin`
   - replace `Editor.sendToPanel` to `Editor.Ipc.sendToPanel`
   - replace `Editor.sendToPackage` to `Editor.Ipc.sendToPackage`
   - replace `Editor.sendToWindows` to `Editor.Ipc.sendToWins`
   - replace `Editor.sendToAll` to `Editor.Ipc.sendToAll`
   - replace `Editor.Window.sendToPage` to `Editor.Window.send`
   - remove `Editor.sendRequestXXX`, just add your callback directly in `sendToMain`, `Window.send` and `sendToPanel`
   - replace `EditorUI` with `Editor.UI`
   - put `EditorUI.bind` and several functions to `Editor.UI.PolymerUtils`
   - all `window:` message becomes `editor:window-`
   - all `package:` message becomes `editor:package-`
   - all `panel:` message becomes `editor:panel-`
   - all `console:` message becomes `editor:console-`
   - the first parameter of the panel ipc message will be `event`
   - replace `reply` callback with `event.reply` for `sendRequestXXX` replys

### v0.4.0

 - upgrade to Electron v0.36.3
 - writing the code in es6 (working in progress)
 - define the entry app through `Editor.App.extend` instead of `global.__app`
 - replace `Editor.name` with `Editor.App.name`
 - replace `Editor.appPath` with `Editor.App.path`
 - replace `Editor.appHome` with `Editor.App.home`
 - replace `Editor.App.initCommander` with `Editor.App.beforeInit`
 - remove `Editor.App.load`, `Editor.App.unload`
 - `Editor.App` no longer accept ipc-message `app:*` register in it
 - support minify editor-framework in final product
 - move `core/` to `lib/main/`
 - move `page/` to `lib/renderer/`
 - move `share/` to `lib/share/`
 - change the unit test working pipeline
 - replace `Editor.registerPackagePath` with `Editor.Package.addPath`
 - replace `Editor.unregisterPackagePath` with `Editor.Package.removePath`
 - replace `Editor._packagePathList` with `Editor.Package.paths`
 - support load dependent packages through `pkgDependencies` in `package.json`
 - add `Editor.init` and `Editor.reset` which can help register environment quickly
 - replace `panel:open` ipc to `panel:run` in renderer process
 - add `panel-ready` function in panel element, it will invoked when panel been totally setup
 - add `Editor.Undo` module
 - support `path` when define a menu template
 - add `Editor.Menu.update` which can update a submenu without change its position
 - add `Editor.Menu.walk` which can walking the menu template tree
 - add `Editor.Menu.register` and add `Editor.Menu.getMenu`, useful when caching a menu template
 - add i18n solution
