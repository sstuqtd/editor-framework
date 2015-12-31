(function () {
'use strict';

const Electron = require('electron');
const ipcRenderer = Electron.ipcRenderer;

EditorUI.WebView = Polymer({
    is: 'editor-webview',

    behaviors: [EditorUI.droppable],

    listeners: {
        'drop-area-enter': '_onDropAreaEnter',
        'drop-area-leave': '_onDropAreaLeave',
        'drop-area-accept': '_onDropAreaAccept',
    },

    properties: {
        src: {
            type: String,
            value: 'empty.html',
        },
    },

    ready: function () {
        this._initDroppable( this.$.dropArea );

        ipcRenderer.on('editor:dragstart', () => {
            this.$.dropArea.hidden = false;
        });

        ipcRenderer.on('editor:dragend', () => {
            this.$.dropArea.hidden = true;
        });
    },

    reload: function () {
        this.$.loader.hidden = false;
        this.$.view.reloadIgnoringCache();
    },

    openDevTools: function () {
        this.$.view.openDevTools();
    },

    _onViewDidFinishLoad: function ( event ) {
        this.$.loader.hidden = true;
    },

    _onDropAreaEnter: function ( event ) {
        event.stopPropagation();
    },

    _onDropAreaLeave: function ( event ) {
        event.stopPropagation();
    },

    _onDropAreaAccept: function ( event ) {
        event.stopPropagation();

        // event.detail.dragItems.forEach( function ( uuid ) {
        //     // TODO
        //     Editor.log( 'drop ' + uuid );
        // }.bind(this));
    },
});

})();
