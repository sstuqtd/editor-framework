'use strict';

const Ipc = require('ipc');
const _ = require('lodash');

let _lastActiveHelper = null;
let _helpers = {};

const IPC_SELECTED = 'selection:selected';       // argument is an array of ids
const IPC_UNSELECTED = 'selection:unselected';   // argument is an array of ids
const IPC_ACTIVATED = 'selection:activated';     // argument is an id
const IPC_DEACTIVATED = 'selection:deactivated'; // argument is an id
const IPC_HOVERIN = 'selection:hoverin';         // argument is an id
const IPC_HOVEROUT = 'selection:hoverout';       // argument is an id
const IPC_CONTEXT = 'selection:context';
const IPC_CHANGED = 'selection:changed';
const IPC_PATCH = 'selection:patch';

function _sendToAll () {
  // send _selection:xxx for sync selection data exclude self
  let args = [].slice.call( arguments, 1 );
  args.push(Editor.selfExcluded);
  args.unshift('_'+arguments[0]);
  Editor.sendToAll.apply( Editor, args );

  // send selection:xxx for user
  Editor.sendToAll.apply( Editor, arguments );
}

/**
 * SelectionHelper
 * @module Editor.Selection
 */

class SelectionHelper {
  constructor (type) {
    this.type = type;
    this.selection = [];
    this.lastActive = null;
    this.lastHover = null;
    this._context = null; // NOTE: it is better to use lastHover, but some platform have bug with lastHover
  }

  //
  _activate (id) {
    if (this.lastActive !== id) {
      if (this.lastActive) {
        _sendToAll( IPC_DEACTIVATED, this.type, this.lastActive );
      }
      this.lastActive = id;
      _sendToAll( IPC_ACTIVATED, this.type, id );
      _lastActiveHelper = this;

      return;
    }

    // check if last-acctive-helper is the same
    if ( _lastActiveHelper !== this ) {
      _lastActiveHelper = this;
      _sendToAll(IPC_ACTIVATED, this.type, this.lastActive);
    }
  }

  //
  _unselectOthers (id) {
    id = id || [];
    if (!Array.isArray(id)) {
      id = [id];
    }

    let unselects = _.difference(this.selection, id);
    if ( unselects.length ) {
      _sendToAll(IPC_UNSELECTED, this.type, unselects);

      this.selection = _.intersection(this.selection, id);

      // DISABLE NOTE:
      // use the order of the new select.
      // this needs us can synchornize order of the selection in all process.
      // this.selection = _.intersection(id, this.selection);

      return true;
    }

    return false;
  }

  //
  select (id, unselectOthers) {
    let changed = false;
    id = id || [];
    if (!Array.isArray(id)) {
      id = [id];
    }
    unselectOthers = unselectOthers !== undefined ? unselectOthers : true;

    // unselect others
    if (unselectOthers) {
      changed = this._unselectOthers(id);
    }

    // send selected message
    if ( id.length ) {
      let diff = _.difference(id, this.selection);

      if ( diff.length  ) {
        this.selection = this.selection.concat(diff);
        _sendToAll(IPC_SELECTED, this.type, diff);
        changed = true;
      }
    }

    // activate others
    if ( id.length ) {
      this._activate(id[id.length - 1]);
    } else {
      this._activate(null);
    }

    // send changed message
    if ( changed ) {
      _sendToAll(IPC_CHANGED, this.type);
    }
  }

  //
  unselect (id) {
    let changed = false;
    let unselectActiveObj = false;

    id = id || [];
    if (!Array.isArray(id)) {
      id = [id];
    }

    // send unselected message
    if ( id.length ) {
      let unselects = _.intersection( this.selection, id );
      this.selection = _.difference( this.selection, id );

      if ( unselects.length ) {
        if ( unselects.indexOf(this.lastActive) !== -1 ) {
          unselectActiveObj = true;
        }

        _sendToAll(IPC_UNSELECTED, this.type, unselects);
        changed = true;
      }
    }

    // activate another
    if (unselectActiveObj) {
      if ( this.selection.length ) {
        this._activate(this.selection[this.selection.length - 1]);
      } else {
        this._activate(null);
      }
    }

    // send changed message
    if ( changed ) {
      _sendToAll(IPC_CHANGED, this.type);
    }
  }

  //
  hover (id) {
    if ( this.lastHover !== id ) {
      if ( this.lastHover ) {
        _sendToAll(IPC_HOVEROUT, this.type, this.lastHover);
      }

      this.lastHover = id;

      if ( id ) {
        _sendToAll(IPC_HOVERIN, this.type, id);
      }
    }
  }

  //
  setContext (id) {
    this._context = id;
    _sendToAll(IPC_CONTEXT, this.type, id);
  }

  //
  patch (srcID, destID) {
    let idx = this.selection.indexOf(srcID);
    if ( idx !== -1 ) {
      this.selection[idx] = destID;
    }
    if ( this.lastActive === srcID ) {
      this.lastActive = destID;
    }
    if ( this.lastHover === srcID ) {
      this.lastHover = destID;
    }
    if ( this._context === srcID ) {
      this._context = destID;
    }
    _sendToAll(IPC_PATCH, this.type, srcID, destID);
  }

  //
  clear () {
    _sendToAll(IPC_UNSELECTED, this.type, this.selection);
    this.selection = [];
    this._activate(null);

    _sendToAll(IPC_CHANGED, this.type);
  }
}

Object.defineProperty(SelectionHelper.prototype, 'contexts', {
  enumerable: true,
  get () {
    let id = this._context;
    if ( !id ) {
      return [];
    }

    let idx = this.selection.indexOf(id);
    if (idx === -1) {
      return [id];
    }

    // make the first one as current active
    let selection = this.selection.slice(0);
    let tmp = selection[idx];
    selection.splice(idx,1);
    selection.unshift(tmp);

    return selection;
  },
});

/**
 * ConfirmableSelectionHelper
 * @module Editor.Selection
 */

class ConfirmableSelectionHelper extends SelectionHelper {
  constructor (type) {
    super(type);

    this.confirmed = true;
    this._confirmedSnapShot = []; // for cancel
  }

  //
  _checkConfirm (confirm) {
    if ( !this.confirmed && confirm ) {
      // confirm selecting
      this.confirm();
    } else if ( this.confirmed && !confirm ) {
      // take snapshot
      this._confirmedSnapShot = this.selection.slice();
      this.confirmed = false;
    }
  }

  //
  _activate (id) {
    if ( this.confirmed ) {
      super._activate( id );
    }
  }

  //
  select (id, unselectOthers, confirm) {
    confirm = confirm !== undefined ? confirm : true;

    this._checkConfirm(confirm);
    super.select(id, unselectOthers);
  }

  //
  unselect (id, confirm) {
    confirm = confirm !== undefined ? confirm : true;

    this._checkConfirm(confirm);
    super.unselect(id);
  }

  //
  confirm () {
    if ( !this.confirmed ) {
      this._confirmedSnapShot = [];
      this.confirmed = true;

      if ( this.selection.length > 0 ) {
        this._activate(this.selection[this.selection.length - 1]);
      } else {
        this._activate(null);
      }
    }
  }

  //
  cancel () {
    if ( !this.confirmed ) {
      super.select(this._confirmedSnapShot, true);
      this._confirmedSnapShot = [];
      this.confirmed = true;
    }
  }

  //
  clear () {
    super.clear();
    this.confirm();
  }
}

/**
 * Selection
 * @module Editor.Selection
 */

var Selection = {
  register ( type ) {
    if ( !Editor.isCoreLevel ) {
      Editor.warn('Editor.Selection.register can only be called in core level.');
      return;
    }

    if ( _helpers[type] ) {
      return;
    }

    _helpers[type] = new ConfirmableSelectionHelper(type);
  },

  reset () {
    for ( let p in _helpers ) {
      _helpers[p].clear();
    }
    _helpers = {};
  },

  local () {
    return new ConfirmableSelectionHelper('local');
  },

  /**
   * Confirms all current selecting objects, no matter which type they are.
   * This operation may trigger deactivated and activated events.
   * @method confirm
   */
  confirm () {
    for ( let p in _helpers ) {
      _helpers[p].confirm();
    }
  },

  /**
   * Cancels all current selecting objects, no matter which type they are.
   * This operation may trigger selected and unselected events.
   * @method cancel
   */
  cancel () {
    for ( let p in _helpers ) {
      _helpers[p].cancel();
    }
  },

  /**
   * if confirm === false, it means you are in rect selecting state, but have not confirmed yet.
   * in this state, the `selected` messages will be broadcasted, but the `activated` messages will not.
   * after that, if you confirm the selection, `activated` message will be sent, otherwise `unselected` message will be sent.
   * if confirm === true, the activated will be sent in the same time.
   * @method select
   * @param {string} type
   * @param {(string|string[])} id
   * @param {Boolean} [unselectOthers=true]
   * @param {Boolean} [confirm=true]
   */
  select ( type, id, unselectOthers, confirm ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Editor.error('Can not find the type %s for selection, please register it first', type);
      return;
    }

    if ( id && typeof id !== 'string' && !Array.isArray(id) ) {
      Editor.error('The 2nd argument for Editor.Selection.select must be string or array');
      return;
    }

    helper.select(id, unselectOthers, confirm);
  },

  /**
   * unselect with type and id
   * @method unselect
   * @param {string} type
   * @param {(string|string[])} id
   * @param {Boolean} [confirm=true]
   */
  unselect (type, id, confirm) {
    let helper = _helpers[type];
    if ( !helper ) {
      Editor.error('Can not find the type %s for selection, please register it first', type);
      return;
    }

    if ( id && typeof id !== 'string' && !Array.isArray(id) ) {
      Editor.error('The 2nd argument for Editor.Selection.select must be string or array');
      return;
    }

    helper.unselect(id, confirm);
  },

  /**
   * @method hover
   * @param {string} type
   * @param {string} id
   */
  hover ( type, id ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Editor.error('Can not find the type %s for selection, please register it first', type);
      return;
    }

    helper.hover(id);
  },

  /**
   * @method setContext
   * @param {string} type
   * @param {string} id
   */
  setContext ( type, id ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Editor.error('Can not find the type %s for selection, please register it first', type);
      return;
    }

    if ( id && typeof id !== 'string' ) {
      Editor.error('The 2nd argument for Editor.Selection.setContext must be string');
      return;
    }

    helper.setContext(id);
  },

  /**
   * @method patch
   * @param {string} type
   * @srcID {string}
   * @destID {string}
   */
  patch ( type, srcID, destID ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Editor.error('Can not find the type %s for selection, please register it first', type);
      return;
    }

    helper.patch(srcID, destID);
  },

  /**
   * @method clear
   * @param {string} type
   */
  clear ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Editor.error('Can not find the type %s for selection, please register it first', type);
      return;
    }

    helper.clear();
  },

  /**
   * @method hovering
   * @param {string} type
   * @return {string} hovering
   */
  hovering ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Editor.error('Can not find the type %s for selection, please register it first', type);
      return null;
    }

    return helper.lastHover;
  },

  /**
   * @method contexts
   * @param {string} type
   * @return {string} contexts
   */
  contexts ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Editor.error('Can not find the type %s for selection, please register it first', type);
      return null;
    }

    return helper.contexts;
  },

  /**
   * @method curActivate
   * @param {string} type
   * @return {string} current activated
   */
  curActivate ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Editor.error('Can not find the type %s for selection, please register it first', type);
      return null;
    }

    return helper.lastActive;
  },

  /**
   * @method curGlobalActivate
   * @return {object} - { type, id }
   */
  curGlobalActivate () {
    if ( !_lastActiveHelper ) {
      return null;
    }

    return {
      type: _lastActiveHelper.type,
      id: _lastActiveHelper.lastActive,
    };
  },

  /**
   * @method curSelection
   * @param {string} type
   * @return {string[]} selected list
   */
  curSelection: function ( type ) {
    let helper = _helpers[type];
    if ( !helper ) {
      Editor.error('Can not find the type %s for selection, please register it first', type);
      return null;
    }

    return helper.selection.slice();
  },

  /**
   * @method filter
   * @param {string[]} items - an array of ids
   * @param {string} mode - ['top-level', 'deep', 'name']
   * @param {function} func
   */
  filter ( items, mode, func ) {
    let results, item, i, j;

    if ( mode === 'name' ) {
      results = items.filter(func);
    }
    else {
      results = [];
      for ( i = 0; i < items.length; ++i ) {
        item = items[i];
        let add = true;

        for ( j = 0; j < results.length; ++j ) {
          let addedItem = results[j];

          // existed
          if ( item === addedItem ) {
            add = false;
            break;
          }

          let cmp = func( addedItem, item );
          if ( cmp > 0 ) {
            add = false;
            break;
          } else if ( cmp < 0 ) {
            results.splice(j, 1);
            --j;
          }
        }

        if ( add ) {
          results.push(item);
        }
      }
    }

    return results;
  },
};

module.exports = Selection;

// ==========================
// Ipc
// ==========================

// recv ipc message and update the local data

Ipc.on( '_selection:selected', function ( type, ids ) {
  let helper = _helpers[type];
  if ( !helper ) {
    Editor.error('Can not find the type %s for selection, please register it first', type);
    return;
  }

  // NOTE: it is possible we recv messages from ourself
  ids = ids.filter(function (x) {
    return helper.selection.indexOf(x) === -1;
  });

  // NOTE: we don't consider message from multiple source, in that case
  //       even the data was right, the messages still goes wrong.
  if (ids.length === 1) {
    helper.selection.push(ids[0]);
  }
  else if (ids.length > 1) {
    // NOTE: push.apply has limitation in item counts
    helper.selection = helper.selection.concat(ids);
  }
});

Ipc.on( '_selection:unselected', function ( type, ids ) {
  let helper = _helpers[type];
  if ( !helper ) {
    Editor.error('Can not find the type %s for selection, please register it first', type);
    return;
  }

  helper.selection = helper.selection.filter( function (x) {
    return ids.indexOf(x) === -1;
  });
});

Ipc.on( '_selection:activated', function ( type, id ) {
  let helper = _helpers[type];
  if ( !helper ) {
    Editor.error('Can not find the type %s for selection, please register it first', type);
    return;
  }

  _lastActiveHelper = helper;
  helper.lastActive = id;
});

Ipc.on( '_selection:deactivated', function ( type, id ) {
  unused(id);

  let helper = _helpers[type];
  if ( !helper ) {
    Editor.error('Can not find the type %s for selection, please register it first', type);
    return;
  }

  if ( _lastActiveHelper === helper ) {
    _lastActiveHelper = null;
  }
  helper.lastActive = null;
});

Ipc.on( '_selection:hoverin', function ( type, id ) {
  let helper = _helpers[type];
  if ( !helper ) {
    Editor.error('Can not find the type %s for selection, please register it first', type);
    return;
  }

  helper.lastHover = id;
});

Ipc.on( '_selection:hoverout', function ( type, id ) {
  unused(id);

  let helper = _helpers[type];
  if ( !helper ) {
    Editor.error('Can not find the type %s for selection, please register it first', type);
    return;
  }

  helper.lastHover = null;
});

Ipc.on( '_selection:context', function ( type, id ) {
  let helper = _helpers[type];
  if ( !helper ) {
    Editor.error('Can not find the type %s for selection, please register it first', type);
    return;
  }

  helper._context = id;
});

Ipc.on( '_selection:patch', function ( type, srcID, destID ) {
  let helper = _helpers[type];
  if ( !helper ) {
    Editor.error('Can not find the type %s for selection, please register it first', type);
    return;
  }

  //
  let idx = helper.selection.indexOf(srcID);
  if ( idx !== -1 ) {
    helper.selection[idx] = destID;
  }
  if ( helper.lastActive === srcID ) {
    helper.lastActive = destID;
  }
  if ( helper.lastHover === srcID ) {
    helper.lastHover = destID;
  }
  if ( helper._context === srcID ) {
    helper._context = destID;
  }
});

// ==========================
// init
// ==========================

if ( Editor.isCoreLevel ) {
  Ipc.on( 'selection:get-registers', function ( event ) {
    let results = [];
    for ( let key in _helpers ) {
      let helper = _helpers[key];
      results.push({
        type: key,
        selection: helper.selection,
        lastActive: helper.lastActive,
        lastHover: helper.lastHover,
        context: helper._context,
        isLastGlobalActive: helper === _lastActiveHelper,
      });
    }
    event.returnValue = results;
  });
}

if ( Editor.isPageLevel ) {
  (() => {
    let results = Editor.sendToCoreSync('selection:get-registers');
    for ( let i = 0; i < results.length; ++i ) {
      let info = results[i];
      if ( _helpers[info.type] ) {
        return;
      }

      let helper = new ConfirmableSelectionHelper(info.type);
      helper.selection = info.selection.slice();
      helper.lastActive = info.lastActive;
      helper.lastHover = info.lastHover;
      helper._context = info.context;

      _helpers[info.type] = helper;

      if ( info.isLastGlobalActive ) {
        _lastActiveHelper = helper;
      }
    }
  })();
}
