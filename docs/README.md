This section explains how to extend Editor-Framework by creating and modifying packages with the [Editor-Framework](https://github.com/cocos-creator/editor-framework) API.

## FAQ

## Manual

  - Getting Started
    - [Defining Your App](manual/getting-started/defining-your-app.md)
    - [App Lifecycle and Events](manual/getting-started/app-lifecycle-and-events.md)
    - [Introduction to IPC](manual/getting-started/introduction-to-ipc.md)
  - Writing A Package
    - [Creating A Package](manual/packages/creating-a-package.md)
    - [Extending Main Menu](manual/packages/extending-main-menu.md)
    - [Creating Panels](manual/packages/creating-panels.md)
    - [Panel Frame Reference](manual/packages/panel-frame-reference.md)
    - [Registering Shortcuts](manual/packages/register-shortcuts.md)
    - [i18n](manual/packages/i18n.md)
    - [Creating Single Page Panel](manual/packages/creating-single-page-panel.md)
    - [Loading and Building Packages](manual/packages/load-and-build-packages.md) **out of date & deprecated**
  - Customize Your Application
    - [Editor Configuration](manual/customization/editor-configuration.md)
    - Default Layout **todo**
    - Custom Commands **todo**
    - [Custom Protocol](manual/customization/custom-protocol.md)
  - UI Programming
    - [Writing UI for Panel](manual/ui/writing-ui-for-panel.md)
    - [Using UI Kit](manual/ui/using-ui-kit.md) **todo**
    - [Focusable Module](manual/ui/focusable.md)
    - [UI Layout](manual/ui/ui-layout.md)
  - Work With Vue
    - Creating Vue Panels **todo**
  - Work With Polymer
    - [Polymer Primer](manual/polymer/polymer-primer.md) **deprecated**
    - [Creating Polymer Panels](manual/polymer/create-polymer-panels.md) **deprecated**
    - [Creating Polymer Element](manual/polymer/create-polymer-element.md) **deprecated**
    - [Event Binding](manual/polymer/event-binding.md) **deprecated**
  - Misc
    - [Online/Offline Event Detection](manual/misc/online-offline-events.md)

## API

  - Modules for the Main Process
    - [Editor](api/main/editor.md)
    - [Editor (Console Module)](api/main/console.md)
    - [Editor.App](api/main/app.md)
    - [Editor.Debugger](api/main/debugger.md)
    - [Editor.DevTools](api/main/devtools.md)
    - [Editor.Dialog](api/main/dialog.md)
    - [Editor.Ipc](api/main/ipc.md)
    - [Editor.MainMenu](api/main/main-menu.md)
    - [Editor.Menu](api/main/menu.md)
    - [Editor.Package](api/main/package.md)
    - [Editor.Panel](api/main/panel.md)
    - [Editor.Profile](api/main/profile.md)
    - [Editor.Protocol](api/main/protocol.md)
    - [Editor.Window](api/main/window.md)
    - [Editor.Worker](api/main/worker.md)
    - [Editor.i18n](api/main/i18n.md)
  - Modules for the Renderer Process (Web Page)
    - [Editor](api/renderer/editor.md)
    - [Editor (Console Module)](api/renderer/console.md)
    - [Editor.Audio](api/renderer/audio.md)
    - [Editor.Dialog](api/renderer/dialog.md)
    - [Editor.Ipc](api/main/ipc.md)
    - [Editor.MainMenu](api/main/main-menu.md)
    - [Editor.Menu](api/main/menu.md)
    - [Editor.Package](api/main/package.md)
    - [Editor.Panel](api/main/panel.md)
    - [Editor.Protocol](api/main/protocol.md)
    - [Editor.Window](api/main/window.md)
    - [Editor.UI](api/renderer/ui/ui.md)
      - Utils
        - [Editor.UI.DockUtils](api/renderer/ui/dock-utils.md)
        - [Editor.UI.DragDrop](api/renderer/ui/drag-drop.md)
      - Behaviors
        - [Editor.UI.ButtonState](api/renderer/ui/button-state.md)
        - [Editor.UI.Disable](api/renderer/ui/disable.md)
        - [Editor.UI.Dockable](api/renderer/ui/dockable.md)
        - [Editor.UI.Droppable](api/renderer/ui/droppable.md)
        - [Editor.UI.Focusable](api/renderer/ui/focusable.md)
        - [Editor.UI.InputState](api/renderer/ui/input-state.md)
        - [Editor.UI.Readonly](api/renderer/ui/readonly.md)
        - [Editor.UI.Resizable](api/renderer/ui/resizable.md)
      - Dock Element
        - [Editor.UI.DockResizer](api/renderer/ui/dock-resizer.md)
        - [Editor.UI.Dock](api/renderer/ui/dock.md)
        - [Editor.UI.MainDock](api/renderer/ui/main-dock.md)
        - [Editor.UI.Tab](api/renderer/ui/tab.md)
        - [Editor.UI.Tabs](api/renderer/ui/tabs.md)
        - [Editor.UI.Panel](api/renderer/ui/panel.md)
        - [Editor.UI.PanelFrame](api/renderer/ui/panel-frame.md)
      - UI Element
        - [Editor.UI.BoxContainer](api/renderer/ui/box-container.md)
        - [Editor.UI.Button](api/renderer/ui/button.md)
        - [Editor.UI.Checkbox](api/renderer/ui/checkbox.md)
        - [Editor.UI.Color](api/renderer/ui/color.md)
        - [Editor.UI.ColorPicker](api/renderer/ui/color-picker.md)
        - [Editor.UI.Hint](api/renderer/ui/hint.md)
        - [Editor.UI.Input](api/renderer/ui/input.md)
        - [Editor.UI.Loader](api/renderer/ui/loader.md)
        - [Editor.UI.Markdown](api/renderer/ui/markdown.md)
        - [Editor.UI.NumInput](api/renderer/ui/num-input.md)
        - [Editor.UI.Progress](api/renderer/ui/progress.md)
        - [Editor.UI.Prop](api/renderer/ui/prop.md)
        - [Editor.UI.Section](api/renderer/ui/section.md)
        - [Editor.UI.Select](api/renderer/ui/select.md)
        - [Editor.UI.Shadow](api/renderer/ui/shadow.md)
        - [Editor.UI.Slider](api/renderer/ui/slider.md)
        - [Editor.UI.TextArea](api/renderer/ui/text-area.md)
        - [Editor.UI.WebView](api/renderer/ui/webview.md)
  - Modules for Both Processes
    - [Editor](api/share/editor.md)

## Development

  - [Running Tests](development/running-tests.md)
  - [Writing Tests](development/writing-tests.md)
  - [Debugging the Main Process](development/debug-main-process.md)
