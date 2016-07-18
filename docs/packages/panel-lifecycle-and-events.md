# Panel Lifecycle Events

## DOM Event

### 'panel-show'

Emitted when the panel is shown

### 'panel-hide'

Emitted when the panel is hidden

### 'panel-resize'

Emitted when the panel is resized

### panel-cut

Emitted when the panel is cut

### panel-copy

Emitted when the panel is copy

### panel-paste

Emitted when the panel is pasted

## Lifecycle Callback

### ready()

Invoked when panel frame loaded successfully.

### run(argv)

Invoked when panel opened or panel is shown through `Editor.Panel.open`.
The `argv` is an `Object` that you send through the `Editor.Panel.open` call.

### close()

Invoked before panel close or window close.

*TODO: Provide more information and context of when the above lifecycle action takes place (e.g. is `show` called before or after the close actually takes place?)*
