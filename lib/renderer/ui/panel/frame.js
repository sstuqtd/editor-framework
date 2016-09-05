'use strict';

const Path = require('fire-path');
const Mousetrap = require('mousetrap');

const ResMgr = require('../utils/resource-mgr');
const DomUtils = require('../utils/dom-utils');
const i18n = require('../../i18n');
const Ipc = require('../../ipc');
const Console = require('../../console');
const JS = require('../../../share/js-utils');
const IpcListener = require('../../../share/ipc-listener');

// ==========================
// exports
// ==========================

class PanelFrame extends window.HTMLElement {
  static get tagName () { return 'UI-PANEL-FRAME'; }

  /**
   * @property root
   */
  get root () {
    if ( this.shadowRoot ) {
      return this.shadowRoot;
    }
    return this;
  }

  /**
   * @property info
   */
  get info () {
    return this._info;
  }

  /**
   * @property name
   */
  get name () {
    if ( !this._info ) {
      return this.id;
    }
    return i18n.format(this._info.title);
  }

  /**
   * @property popable
   */
  get popable () {
    if ( !this._info ) {
      return true;
    }
    return this._info.popable;
  }

  /**
   * @property width
   */
  get width () {
    if ( !this._info ) {
      return 'auto';
    }

    let val = parseInt(this._info.width);
    if ( isNaN(val) ) {
      return 'auto';
    }

    return val;
  }

  /**
   * @property minWidth
   */
  get minWidth () {
    if ( !this._info ) {
      return 50;
    }

    let val = parseInt(this._info['min-width']);
    if ( isNaN(val) ) {
      return 50;
    }

    return val;
  }

  /**
   * @property maxWidth
   */
  get maxWidth () {
    if ( !this._info ) {
      return 'auto';
    }

    let val = parseInt(this._info['max-width']);
    if ( isNaN(val) ) {
      return 'auto';
    }

    return val;
  }

  /**
   * @property height
   */
  get height () {
    if ( !this._info ) {
      return 'auto';
    }

    let val = parseInt(this._info.height);
    if ( isNaN(val) ) {
      return 'auto';
    }

    return val;
  }

  /**
   * @property minHeight
   */
  get minHeight () {
    if ( !this._info ) {
      return 50;
    }

    let val = parseInt(this._info['min-height']);
    if ( isNaN(val) ) {
      return 50;
    }

    return val;
  }

  /**
   * @property maxHeight
   */
  get maxHeight () {
    if ( !this._info ) {
      return 'auto';
    }

    let val = parseInt(this._info['max-height']);
    if ( isNaN(val) ) {
      return 'auto';
    }

    return val;
  }

  /**
   * @method createdCallback
   */
  createdCallback () {
    // this.createShadowRoot(); // NOTE: move this to panel-loader.js
    this.classList.add('fit');
    this.tabIndex = -1;

    // for focus-mgr
    this._focusedElement = null;
    this._lastFocusedElement = null;

    // NOTE: assigned in Editor.Panel.newFrame();
    this._info = null;
  }

  /**
   * @method queryID
   */
  queryID ( id ) {
    return this.root.getElementById(id);
  }

  /**
   * @method query
   */
  query ( selector ) {
    return this.root.querySelector(selector);
  }

  /**
   * @method queryAll
   */
  queryAll ( selector ) {
    return this.root.querySelectorAll(selector);
  }

  /**
   * @method reset
   */
  reset () {
    // TODO: reset frameEL to the original state
  }

  /**
   * @method load
   */
  load ( cb ) {
    let entryFile = Path.join( this._info.path, this._info.main );

    ResMgr.importScript(entryFile).then(panelProto => {
      if ( !panelProto ) {
        throw new Error(`Failed to load panel-frame ${this.id}: no panel prototype return.`);
      }

      // if we have dependencies, load them first then create the panel frame
      if ( panelProto.dependencies && panelProto.dependencies.length ) {
        ResMgr.importScripts(panelProto.dependencies).then(() => {
          this._apply(panelProto);

          if ( cb ) {
            cb ( null );
          }
        }).catch( err => {
          if ( cb ) {
            cb ( err );
          }
        });

        return;
      }

      // else, create the panel frame directly
      this._apply(panelProto);

      if ( cb ) {
        cb ( null );
      }
    }).catch(err => {
      if ( cb ) {
        cb ( err );
      }
    });
  }

  _apply ( proto ) {
    let useShadowDOM = this._info['shadow-dom'];

    let template = proto.template;
    let style = proto.style;
    let listeners = proto.listeners;
    let behaviors = proto.behaviors;
    let selectors = proto.$;

    // NOTE: do not use delete to change proto, we need to reuse proto since it was cached
    JS.assignExcept(this, proto, [
      'dependencies', 'template', 'style', 'listeners', 'behaviors', '$'
    ]);

    // addon behaviors
    if ( behaviors ) {
      behaviors.forEach(be => {
        JS.addon(this, be);
      });
    }

    //
    if ( useShadowDOM ) {
      this.createShadowRoot();
    }

    let root = this.root;

    // update template
    if ( template ) {
      root.innerHTML = template;
    }

    // update style
    if ( style ) {
      let styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.textContent = style;

      root.insertBefore( styleElement, root.firstChild );
    }

    if ( useShadowDOM ) {
      root.insertBefore(
        DomUtils.createStyleElement('theme://elements/panel-frame.css'),
        root.firstChild
      );
    }

    // register selectors
    if ( selectors ) {
      for ( let name in selectors ) {
        if ( this[`$${name}`] ) {
          Console.warn(`failed to assign selector $${name}, already used.`);
          continue;
        }

        let el = root.querySelector(selectors[name]);
        if ( !el ) {
          Console.warn(`failed to query selector ${selectors[name]} to $${name}.`);
          continue;
        }

        this[`$${name}`] = el;
      }
    }

    // register listeners
    if ( listeners ) {
      for ( let name in listeners ) {
        this.addEventListener(name, listeners[name].bind(this));
      }
    }

    // register ipc messages
    if ( this.messages ) {
      let ipcListener = new IpcListener();

      for ( let name in this.messages ) {
        let fn = this.messages[name];

        if ( !fn || typeof fn !== 'function' ) {
          Console.warn(
            `Failed to register ipc message ${name} in panel ${this.id}, function not provide.`
          );
          continue;
        }

        ipcListener.on(name, (event, ...args) => {
          fn.apply( this, [event, ...args] );
        });
      }

      this._ipcListener = ipcListener;
    }

    // register profiles
    if ( this._info.profiles ) {
      this.profiles = this._info.profiles;

      for ( let name in this.profiles ) {
        let profile = this.profiles[name];

        profile.save = () => {
          Ipc.sendToMain('editor:save-profile', this.id, name, profile);
        };
      }
    }

    // register shortcuts
    if ( this._info.shortcuts ) {
      let mousetrapList = [];
      let mousetrap = new Mousetrap(this);
      mousetrapList.push(mousetrap);

      for ( let name in this._info.shortcuts ) {
        if ( name[0] !== '#' ) {
          let method = this._info.shortcuts[name];
          let fn = this[method];

          if ( !fn || typeof fn !== 'function' ) {
            Console.warn(
              `Failed to register shortcut, cannot find method ${method} in panel ${this.id}.`
            );
            continue;
          }

          mousetrap.bind(name, fn.bind(this));

          continue;
        }

        // sub-shortcuts
        let subElement = root.querySelector(name);
        if ( !subElement ) {
          Console.warn(`Failed to register shortcut for element ${name}, cannot find it.`);
          continue;
        }

        let subShortcuts = this._info.shortcuts[name];
        let subMousetrap = new Mousetrap(subElement);
        mousetrapList.push(subMousetrap);

        for ( let subShortcut in subShortcuts ) {
          let method = subShortcuts[subShortcut];
          let fn = this[method];

          if ( !fn || typeof fn !== 'function' ) {
            Console.warn(
              `Failed to register shortcut, cannot find method ${method} in panel ${this.id}.`
            );
            continue;
          }

          subMousetrap.bind(subShortcut, fn.bind(this));
        }
      }

      this._mousetrapList = mousetrapList;
    }
  }
}

module.exports = PanelFrame;
