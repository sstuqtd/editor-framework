(() => {
  'use strict';

  let _importCount = 0;

  function _createLayouts ( parentEL, infos, importList ) {
    for ( let i = 0; i < infos.length; ++i ) {
      let info = infos[i];

      let el;

      if ( info.type === 'dock' ) {
        el = document.createElement('editor-dock');
      } else if ( info.type === 'panel' ) {
        el = document.createElement('editor-dock-panel');
      }

      if ( !el ) {
        continue;
      }

      if ( info.row !== undefined ) {
        el.row = info.row;
      }

      if ( info.width !== undefined ) {
        el.curWidth = info.width;
      }

      if ( info.height !== undefined ) {
        el.curHeight = info.height;
      }

      if ( info.docks ) {
        _createLayouts ( el, info.docks, importList );
      } else if ( info.panels ) {
        for ( var j = 0; j < info.panels.length; ++j ) {
          importList.push( { dockEL: el, panelID: info.panels[j], active: j === info.active } );
        }
      }

      parentEL.appendChild(el);
    }
    parentEL._initResizers();
  }

  Editor.JS.mixin(EditorUI, {
    templatize ( parentEL, innerHTML, props ) {
      let tmpl = document.createElement('template');
      tmpl.innerHTML = innerHTML;

      // Prepare the template
      parentEL.templatize(tmpl);
      let instance = parentEL.stamp(props);

      return instance;
    },

    // binding helpers
    bind ( el1, value1, el2, value2 ) {
      let camelValue2 = EditorUI.camelCase(value2);
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
    },

    bindUUID ( el1, value1, el2, value2 ) {
      let camelValue2 = EditorUI.camelCase(value2);
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
    },

    // parent operation
    getSelfOrAncient ( element, parentType ) {
      let parent = element;
      while ( parent ) {
        if ( parent instanceof parentType ) {
          return parent;
        }

        parent = Polymer.dom(parent).parentNode;
      }

      return 0;
    },

    isSelfOrAncient ( element, ancientEL ) {
      let parent = element;
      while ( parent ) {
        if ( parent === ancientEL ) {
          return true;
        }

        parent = Polymer.dom(parent).parentNode;
      }

      return false;
    },

    //
    createLayout ( parentEL, layoutInfo ) {
      let importList = [];

      // if we have root, clear all children in it
      let rootEL = EditorUI.DockUtils.root;
      if ( rootEL ) {
        rootEL.remove();
        EditorUI.DockUtils.root = null;
      }

      rootEL = document.createElement('editor-dock');
      rootEL.classList.add('fit');
      rootEL.setAttribute('no-collapse', '');

      if ( layoutInfo ) {
        if ( layoutInfo.row ) {
          rootEL.setAttribute('row', '');
        }

        _createLayouts( rootEL, layoutInfo.docks, importList );
      }

      parentEL.appendChild(rootEL);
      EditorUI.DockUtils.root = rootEL;

      return importList;
    },

    //
    importing: false,
    import ( url, cb ) {
      ++_importCount;
      EditorUI.importing = true;

      Polymer.Base.importHref( url, function () {
        --_importCount;
        if ( _importCount === 0 ) {
          EditorUI.importing = false;
        }

        if ( cb ) cb ();
      }, function () {
        --_importCount;
        if ( _importCount === 0 ) {
          EditorUI.importing = false;
        }

        if ( cb ) {
          cb ( new Error(`${url} not found.`) );
        }
      });
    },

  });
})();
