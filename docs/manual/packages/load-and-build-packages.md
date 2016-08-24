# Loading and Building Packages

Packages can be developed in any of the following file formats:

- HTML
- JavaScript with ES6 and ES7 features
- [Stylus](https://learnboost.github.io/stylus/)
- [Less](http://lesscss.org/)
- [Sass](http://sass-lang.com/)
- [CoffeeScript](http://coffeescript.org/) will be supported, PR is welcome!
- [TypeScript](http://www.typescriptlang.org/) will be supported, PR is welcome!

To make sure package users are facing a consistent file format, Editor-Framework provides a pipeline to automatically build any of the above file formats to vanilla ES5 JavaScript and CSS. Here's how:

## Loading Packages

To load packages into your Editor-Framework app, you must either:

- Specify a path to load your packages from by running the method `Editor.registerPackagePath` in your `App.init` function. Then put all your packages into that path folder.
- By default, Editor-Framework loads all packages in the [/demo](../../../demo) folder. You can also create your packages here to quickly see it in the "Package Manager" list.
- You can also put your packages into `~/.{app-name}/packages` folder. Read the [create packages](./create-your-package.md#create-your-package) doc for more details.

## Building and Redirecting Packages

Sometimes you may have your own building pipeline for developing a package, and you would like to compile the result to a specific directory. Nothing to stop you doing that, the only thing you need do is specific the entry dir for your compiled results by setting the `"entry-dir"` property in `package.json`.

You can redirect the loading path by add the property `"entry-dir": "./your/path"` to your package's `package.json` file. If a package has `"entry-dir": "./your/path"`, Editor Framework will load the package at `package-name/your/path` folder.

## File Change Watcher

When Editor-framework is running, it will watch all loaded packages. If you modify any files in your package:

- A File change notification will be fired by the package watcher.
- Then go through the dirty notify pipeline.

A dirty notification has a different pipeline for renderer process changes and main process changes:

- For renderer process changes (for example you changed the html or style in your `panel.html` file) it will send an ipc message to the panel indicating panel out-of-date. And your panel's tab will turn red. You can reload the editor page to remove the 'out-of-date' state of the page by selecting `Developer/Reload` or by pressing Command+R (on Mac) or Control+R (on Windows).
![red tab](https://cloud.githubusercontent.com/assets/344547/8019179/70f804fe-0c73-11e5-8736-8df1a71e34a4.png)
- For main process changes (for example, a modification to the `main.js` file) Editor-Framework will unload and reload the package.

## Manually Reloading a Package

With your package loaded in Package Manager, you can also reload your package by clicking the 'Reload' button in your package item:

![image](https://cloud.githubusercontent.com/assets/344547/8019037/beb6e248-0c6c-11e5-868d-9fe40c056155.png)

When the 'Reload' button is clicked, Package Manager will:

- Check if the package has building enabled. If yes, it will rebuild it.
- If the rebuild is successful, unload the package. If an error was raised while compiling, don't go to next step.
- Load the package again.
