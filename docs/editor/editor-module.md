# The Editor Module

`Editor` is a module containing app-wide core editor functionality. You can access properties or methods of the `Editor ` module anytime, anywhere in your Editor-Framework app.

This module can be categorized into the following parts:

## Paths

The `Editor` module provides the following properties to give user access to common paths:

  - `Editor.App.path`: The current `app.js` working directory path.
  - `Editor.App.home`: Your application's home path. Usually it is `~/.{your-app-name}`
  - `Editor.frameworkPath`: The editor framework module path. Usually it is `{your-app}/editor-framework/`

## Protocols

Due to the complicated nature of path lookup between main and renderer processes, we created the following custom protocols to provide easy and consistent access to key file locations:

  - `editor-framework://`: Map to the editor framework module path.
  - `app://`: Map to the root path of your app.
  - `packages://{package-name}`: Map to the `{package-name}` path.
  - `packages://{package-name}/widget`: Map to a widget path.

If you know exactly how to reference a resource in your script, you can use absolute path or relative path as well.

A Url with custom protocols can also be used directly in HTML and CSS import. In main/renderer process, you can write:

```js
var myFilePath = Editor.url('app://myfolder/myfile.js');
```

Furthermore, the `Editor.url` method will convert your url to absolute path of the file system of your OS.


## Options

  - `Editor.dev`: Indicates if the application is running with `--dev` option.
  - `Editor.showDevtools`: Indicates if the application is running with `--show-devtools`.

## Editor.App

`Editor.App` refers to your `app.js` module. Read more in [Define your application](../../manual/define-your-app.md).


## TODO: introduce submodules in both main and renderer process
