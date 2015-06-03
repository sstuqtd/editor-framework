## Register Your Widgets

Define a widget in `page-level`, then save it to your package's `widget` folder.

```html
<dom-module id="simple-widget">
    <style>
        :host {
            color: red;
        }
    </style>

    <template>
        This is a simple widget
    </template>
</dom-module>

<script>
    Editor.registerWidget( 'simple-widget', {
        is: 'simple-widget',
    });
</script>
```
Register the html file in `package.json`:

```json
{
  "name": "simple",
  "widgets": {
    "simple-widget": "widget/simple-widget.html"
  }
}
```

Once you register the package in package.json, you can use the name as the route path in
`widget://` protocol to use your widgets in other html file.

For example, suppose you have a `panel.html` in other packages, you can import the widget above
like this:

```html
<link rel="import" href="widgets://simple-widget/simple-widget.html">
```
