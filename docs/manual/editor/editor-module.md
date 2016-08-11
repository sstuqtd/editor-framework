# The Editor Module

`Editor` is a module containing app-wide core editor functionality. You can access properties or methods of the `Editor ` module anytime, anywhere in your Editor-Framework app.

This module can be categorized into the following parts:

## Paths

The `Editor` module provides the following properties to give user access to common paths:

  - `Editor.App.path`: The current `app.js` working directory path.
  - `Editor.App.home`: Your application's home path. Usually it is `~/.{your-app-name}`
  - `Editor.frameworkPath`: The Editor-Framework module path. Usually it is `{your-app}/editor-framework/`

## Options

  - `Editor.dev`: Indicates if the application is running with `--dev` option.
  - `Editor.showDevtools`: Indicates if the application is running with `--show-devtools`.

## Editor.App

`Editor.App` refers to your `app.js` module. Read more in [Define your application](../getting-started/define-your-app.md).

## TODO: introduce submodules in both main and renderer process
