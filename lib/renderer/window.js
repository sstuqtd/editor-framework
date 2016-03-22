'use strict';

const Electron = require('electron');

let _inspecting = false;
let _maskEL;

function _webviewEL ( el ) {
  if ( !el ) {
    return null;
  }

  if ( el.tagName === 'WEBVIEW' ) {
    return el;
  }

  // in shadow
  if ( el.parentNode && el.parentNode.host ) {
    if ( el.parentNode.host.tagName === 'WEBVIEW' ) {
      return el.parentNode.host;
    }
  }

  return null;
}

function _elementFromPoint ( x, y ) {
  let el = document.elementFromPoint(x,y);
  while ( el && el.shadowRoot ) {
    let nextEL = el.shadowRoot.elementFromPoint(x,y);
    if ( !nextEL ) {
      return el;
    }

    el = nextEL;
  }

  return el;
}

function _mousemove ( event ) {
  event.preventDefault();
  event.stopPropagation();

  _maskEL.remove();

  let el = _elementFromPoint( event.clientX, event.clientY );
  let rect = el.getBoundingClientRect();

  // if we are in web-view, show red color
  if ( _webviewEL(el) ) {
    _maskEL.style.backgroundColor = 'rgba( 128, 0, 0, 0.4)';
    _maskEL.style.outline = '1px solid #f00';
  } else {
    _maskEL.style.backgroundColor = 'rgba( 0, 128, 255, 0.5)';
    _maskEL.style.outline = '1px solid #09f';
  }

  //
  document.body.appendChild(_maskEL);
  _maskEL.style.top = `${rect.top+1}px`;
  _maskEL.style.left = `${rect.left+1}px`;
  _maskEL.style.width = `${rect.width-2}px`;
  _maskEL.style.height = `${rect.height-2}px`;

  _maskEL.children[0].innerText =
    `<${el.tagName.toLowerCase()} class="${el.className}" />`;
}

function _mousedown ( event ) {
  event.preventDefault();
  event.stopPropagation();

  _inspectOFF ();

  let el = document.elementFromPoint( event.clientX, event.clientY );
  let webviewEL = _webviewEL(el);
  if ( webviewEL ) {
    webviewEL.openDevTools();
    if ( webviewEL.devToolsWebContents ) {
      webviewEL.devToolsWebContents.focus();
    }
    return;
  }

  // NOTE: we use ipcRenderer directly here to make it runnable in Test Runner
  Electron.ipcRenderer.send( 'window:inspect-at', event.clientX, event.clientY );
}

function _keydown ( event ) {
  event.preventDefault();
  event.stopPropagation();

  if ( event.which === 27 ) {
    _inspectOFF ();
  }
}

function _inspectOFF () {
  _inspecting = false;
  _maskEL.remove();
  _maskEL = null;

  window.removeEventListener('mousemove', _mousemove, true);
  window.removeEventListener('mousedown', _mousedown, true);
  window.removeEventListener('keydown', _keydown, true);
}

function _inspectON () {
  if ( _inspecting ) {
    return;
  }
  _inspecting = true;

  //
  if ( !_maskEL ) {
    _maskEL = document.createElement('div');
    _maskEL.style.position = 'absolute';
    _maskEL.style.zIndex = '999';
    _maskEL.style.top = '0';
    _maskEL.style.right = '0';
    _maskEL.style.bottom = '0';
    _maskEL.style.left = '0';
    _maskEL.style.backgroundColor = 'rgba( 0, 128, 255, 0.5)';
    _maskEL.style.outline = '1px solid #09f';
    _maskEL.style.cursor = 'default';

    let label = document.createElement('div');
    label.style.display = 'inline-block';
    label.style.position = 'relative';
    label.style.top = '-18px';
    label.style.left = '0px';
    label.style.padding = '0px 5px';
    label.style.fontSize = '12px';
    label.style.fontWeight = 'bold';
    label.style.whiteSpace = 'nowrap';
    label.style.color = '#333';
    label.style.backgroundColor = '#f90';
    label.innerText = '';
    _maskEL.appendChild(label);
    document.body.appendChild(_maskEL);
  }

  window.addEventListener('mousemove', _mousemove, true);
  window.addEventListener('mousedown', _mousedown, true);
  window.addEventListener('keydown', _keydown, true);
}

// ==========================
// Methods
// ==========================

let Window = {
  open ( name, url, options ) {
    Editor.sendToCore( 'window:open', name, url, options );
  },

  focus () {
    Editor.sendToCore( 'window:focus' );
  },

  load ( url, argv ) {
    Editor.sendToCore( 'window:load', url, argv );
  },

  resize ( w, h, useContentSize ) {
    Editor.sendToCore( 'window:resize', w, h, useContentSize );
  },

  resizeSync ( w, h, useContentSize ) {
    if ( useContentSize ) {
      Electron.remote.getCurrentWindow().setContentSize(w,h);
    } else {
      Electron.remote.getCurrentWindow().setSize(w,h);
    }
  },

  center () {
    Editor.sendToCore( 'window:center' );
  },
};

// ==========================
// Ipc events
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('window:inspect', function () {
  _inspectON ();
});

module.exports = Window;
