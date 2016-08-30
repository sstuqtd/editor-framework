'use strict';

let PolymerUtils = {};
module.exports = PolymerUtils;

// requires
const Path = require('fire-path');
const Mousetrap = require('mousetrap');

const DomUtils = require('./dom-utils');
const Console = require('../../console');
const i18n = require('../../i18n');
const Ipc = require('../../ipc');
const JS = require('../../../share/js-utils');
const IpcListener = require('../../../share/ipc-listener');

let _importCount = 0;

// ==========================
// exports
// ==========================

PolymerUtils.importing = false;

PolymerUtils.templatize = function ( parentEL, innerHTML, props ) {
  let tmpl = document.createElement('template');
  tmpl.innerHTML = innerHTML;

  // Prepare the template
  parentEL.templatize(tmpl);
  let instance = parentEL.stamp(props);

  return instance;
};

// binding helpers
PolymerUtils.bind = function ( el1, value1, el2, value2 ) {
  let camelValue2 = DomUtils.camelCase(value2);
  el1.addEventListener( value1+'-changed', function ( event ) {
    if ( event.detail.path ) {
      el2.set( event.detail.path, event.detail.value );
    } else {
      el2.set( camelValue2, event.detail.value );
    }
  });
  el2.addEventListener( value2+'-changed', function ( event ) {
    if ( event.detail.path ) {
      el1.set( event.detail.path, event.detail.value );
    } else {
      el1.set( value1, event.detail.value );
    }
  });
};

PolymerUtils.bindUUID = function ( el1, value1, el2, value2 ) {
  let camelValue2 = DomUtils.camelCase(value2);
  el1.addEventListener( value1+'-changed', function ( event ) {
    if ( event.detail.path === value1+'.uuid' ) {
      el2.set( camelValue2, event.detail.value );
    } else {
      if ( event.detail.value ) {
        el2.set( camelValue2, event.detail.value.uuid );
      } else {
        el2.set( camelValue2, null );
      }
    }
  });
  el2.addEventListener(value2+'-changed', function ( event ) {
    el1.set(value1, {
      uuid: event.detail.value
    });
  });
};

// parent operation
PolymerUtils.getSelfOrAncient = function ( element, parentType ) {
  let parent = element;
  while ( parent ) {
    if ( parent instanceof parentType ) {
      return parent;
    }

    parent = Polymer.dom(parent).parentNode;
  }

  return 0;
};

PolymerUtils.isSelfOrAncient = function ( element, ancientEL ) {
  let parent = element;
  while ( parent ) {
    if ( parent === ancientEL ) {
      return true;
    }

    parent = Polymer.dom(parent).parentNode;
  }

  return false;
};

//
PolymerUtils.import = function ( url, cb ) {
  ++_importCount;
  PolymerUtils.importing = true;

  Polymer.Base.importHref( url, function () {
    --_importCount;
    if ( _importCount === 0 ) {
      PolymerUtils.importing = false;
    }

    if ( cb ) cb ();
  }, function () {
    --_importCount;
    if ( _importCount === 0 ) {
      PolymerUtils.importing = false;
    }

    if ( cb ) {
      cb ( new Error(`${url} not found.`) );
    }
  });
};

PolymerUtils.registerElement = function ( obj ) {
  if ( !obj.is ) {
    let script = document.currentScript;
    let parent = script.parentElement;
    if ( parent && parent.tagName === 'DOM-MODULE' ) {
      obj.is = parent.id;
    } else {
      Console.error('Failed to register widget %s. The script must be inside a <dom-module> tag.');
      return;
    }
  }

  if ( !PolymerUtils.elements ) {
    PolymerUtils.elements = {};
  }

  if ( PolymerUtils.elements[obj.is] ) {
    Console.error('Failed to register widget %s since it already exists.', obj.is );
    return;
  }

  obj._T = function ( key, option ) {
    return i18n.t( key, option );
  };
  PolymerUtils.elements[obj.is] = Polymer(obj);
};

PolymerUtils.registerPanel = function ( panelID, obj ) {
  if ( !obj.is ) {
    let script = document.currentScript;
    let parent = script.parentElement;
    if ( parent && parent.tagName === 'DOM-MODULE' ) {
      obj.is = parent.id;
    } else {
      Console.error(`Failed to register panel ${panelID}, the script must be inside a <dom-module> tag.`);
      return;
    }
  }

  if ( !PolymerUtils.panels ) {
    PolymerUtils.panels = {};
  }

  if ( PolymerUtils.panels[panelID] !== undefined ) {
    Console.error(`Failed to register panel ${panelID}, that panelID has already been registered.`);
    return;
  }

  obj._T = function ( key, option ) {
    return i18n.t( key, option );
  };
  PolymerUtils.panels[panelID] = Polymer(obj);
};

PolymerUtils.newFrame = function ( panelID, info, cb ) {
  let entryFile = Path.join( info.path, info.main );

  PolymerUtils.import( entryFile, ( err ) => {
    if ( err ) {
      if ( cb ) {
        cb ( new Error(`Failed to load panel ${panelID}: ${err.message}`) );
      }
      return;
    }

    let ctor = PolymerUtils.panels[panelID];
    if ( !ctor ) {
      if ( cb ) {
        cb ( new Error(`Failed to load panel ${panelID}: Cannot find panel frame constructor in "UI.PolymerUtils.panels"`) );
      }
      return;
    }

    let frameEL = new ctor();
    frameEL._info = info;

    frameEL.classList.add('fit');
    frameEL.tabIndex = 1;

    frameEL.setAttribute('id', panelID);
    if ( info.icon ) {
      frameEL.icon = new Image();
      frameEL.icon.src = Path.join( info.path, info.icon );
    }

    JS.assign(frameEL, {
      get name () {
        if ( !this._info ) {
          return this.id;
        }
        return i18n.format(this._info.title);
      },
      get popable () {
        if ( !this._info ) {
          return true;
        }
        return this._info.popable;
      },
      get width () {
        if ( !this._info ) {
          return 'auto';
        }

        let val = parseInt(this._info.width);
        if ( isNaN(val) ) {
          return 'auto';
        }

        return val;
      },
      get minWidth () {
        if ( !this._info ) {
          return 50;
        }

        let val = parseInt(this._info['min-width']);
        if ( isNaN(val) ) {
          return 50;
        }

        return val;
      },
      get maxWidth () {
        if ( !this._info ) {
          return 'auto';
        }

        let val = parseInt(this._info['max-width']);
        if ( isNaN(val) ) {
          return 'auto';
        }

        return val;
      },
      get height () {
        if ( !this._info ) {
          return 'auto';
        }

        let val = parseInt(this._info.height);
        if ( isNaN(val) ) {
          return 'auto';
        }

        return val;
      },
      get minHeight () {
        if ( !this._info ) {
          return 50;
        }

        let val = parseInt(this._info['min-height']);
        if ( isNaN(val) ) {
          return 50;
        }

        return val;
      },
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
    });

    // register ipc events
    let ipcListener = new IpcListener();
    for ( let name in frameEL.messages ) {
      _registerIpc( ipcListener, panelID, frameEL, name, frameEL.messages[name] );
    }
    frameEL._ipcListener = ipcListener;

    // register profiles
    frameEL.profiles = info.profiles;
    for ( let type in info.profiles ) {
      _registerProfile ( panelID, type, info.profiles[type] );
    }

    // register shortcuts
    // TODO: load overwrited shortcuts from profile?
    if ( info.shortcuts ) {
      let mousetrapList = [];
      let mousetrap = new Mousetrap(frameEL);
      mousetrapList.push(mousetrap);

      for ( let name in info.shortcuts ) {
        if ( name.length > 1 && name[0] === '#' ) {
          let subElement;

          if ( !info.ui ) {
            subElement = frameEL.root.querySelector(name);
          } else {
            subElement = frameEL.querySelector(name);
          }

          if ( !subElement ) {
            Console.warn(`Failed to register shortcut for element ${name}, cannot find it.`);
            continue;
          }

          let subShortcuts = info.shortcuts[name];
          let subMousetrap = new Mousetrap(subElement);
          mousetrapList.push(subMousetrap);

          for ( let subShortcut in subShortcuts ) {
            _registerShortcut(
              panelID,
              subMousetrap,
              frameEL, // NOTE: here must be frameEL
              subShortcut,
              subShortcuts[subShortcut]
            );
          }
        } else {
          _registerShortcut(
            panelID,
            mousetrap,
            frameEL,
            name,
            info.shortcuts[name]
          );
        }
      }

      frameEL._mousetrapList = mousetrapList;
    }

    if ( cb ) {
      cb ( null, frameEL );
    }
  });
};

function _registerIpc ( ipcListener, panelID, frameEL, message, fn ) {
  if ( !fn || typeof fn !== 'function' ) {
    Console.warn(
      `Failed to register ipc message ${message} in panel ${panelID}, function not provide.`
    );
    return;
  }

  ipcListener.on(message, (event, ...args) => {
    fn.apply( frameEL, [event, ...args] );
  });
}

function _registerProfile ( panelID, type, profile ) {
  profile.save = function () {
    Ipc.sendToMain('editor:save-profile', panelID, type, profile);
  };
}

function _registerShortcut ( panelID, mousetrap, frameEL, shortcut, methodName ) {
  let fn = frameEL[methodName];

  if ( !fn || typeof fn !== 'function' ) {
    Console.warn(
      `Failed to register shortcut, cannot find method ${methodName} in panel ${panelID}.`
    );
    return;
  }

  mousetrap.bind(shortcut, fn.bind(frameEL) );
}
