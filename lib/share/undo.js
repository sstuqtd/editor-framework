'use strict';

const EventEmitter = require('events');

class Command {
  constructor ( info, desc ) {
    this.info = info;
    this.desc = desc;
  }
  undo () { Editor.warn('Please implement undo function in your command'); }
  redo () { Editor.warn('Please implement redo function in your command'); }
  dirty () { return true; }
}

class CommandGroup {
  constructor () {
    this._commands = [];
  }

  undo () {
    for ( let i = this._commands.length-1; i >= 0; --i ) {
      this._commands[i].undo();
    }
  }

  redo () {
    for ( let i = 0; i < this._commands.length; ++i ) {
      this._commands[i].redo();
    }
  }

  dirty () {
    for ( let i = 0; i < this._commands.length; ++i ) {
      if ( this._commands[i].dirty() ) {
        return true;
      }
    }
    return false;
  }

  add ( cmd ) {
    this._commands.push(cmd);
  }

  clear () {
    this._commands = [];
  }

  canStash () {
    return this._commands.length;
  }
}

class UndoList extends EventEmitter {
  constructor () {
    super();

    this._curGroup = new CommandGroup();
    this._groups = [];
    this._position = -1;
    this._savePosition = -1;

    this._id2cmdDef = {};
  }

  register ( id, def ) {
    this._id2cmdDef[id] = def;
  }

  reset () {
    this.clear();
    this._id2cmdDef = {};
  }

  undo () {
    // check if we have unstash group
    if ( this._curGroup.canStash() ) {
      this._curGroup.undo();
      this._changed();

      this._curGroup.clear();
      return;
    }

    // check if can undo
    if ( this._position < 0 ) {
      return;
    }

    this._position--;
    let group = this._groups[this._position];
    group.undo();

    this._changed();
  }

  redo () {
    // check if can redo
    if ( this._position >= this._groups.length-1 ) {
      return;
    }

    this._position++;
    let group = this._groups[this._position];
    group.redo();

    this._changed();
  }

  record ( id, info, desc ) {
    let ctor = this._id2cmdDef[id];
    if ( !ctor ) {
      Editor.error( `Can not find undo command ${id}, please register it first` );
      return;
    }

    this._clearRedo();
    let cmd = new ctor(info,desc);
    this._curGroup.add(cmd);

    this._changed();
  }

  stash () {
    if ( this._curGroup.canStash() ) {
      this._groups.push(this._curGroup);
      this._position += 1;

      this._changed();
    }
    this._curGroup = new CommandGroup();
  }

  save () {
    this._savePosition = this._position;
    this._changed();
  }

  clear () {
    this._curGroup = new CommandGroup();
    this._groups = [];
    this._position = -1;
    this._savePosition = -1;
  }

  dirty () {
    if ( this._savePosition === this._position ) {
      let min = Math.min(this._position, this._savePosition);
      let max = Math.max(this._position, this._savePosition);

      for ( let i=min+1; i <= max; i++ ) {
        if ( this._groups[i].dirty() ) {
          return true;
        }
      }
    }

    return false;
  }

  _clearRedo () {
    if ( this._position+1 === this._groups.length ) {
      return;
    }

    this._groups = this._groups.slice(0, this._position+1);
    this._curGroup.clear();
  }

  _changed () {
    this.emit('changed');
  }
}

let _global;

if ( Editor.isCoreLevel ) {
  _global = new UndoList();
}

/**
 * Undo
 * @module Editor.Undo
 */
let Undo = {
  undo () {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:perform-undo');
      return;
    }

    _global.undo();
  },

  redo () {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:perform-redo');
      return;
    }

    _global.redo();
  },

  record ( id, info, desc ) {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:record', id, info, desc );
      return;
    }

    _global.record(id, info, desc);
  },

  stash () {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:stash' );
      return;
    }

    _global.stash();
  },

  save () {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:save');
      return;
    }

    _global.save();
  },

  clear () {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:clear');
      return;
    }

    _global.clear();
  },

  reset () {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:reset');
      return;
    }

    return _global.reset();
  },

  dirty () {
    if ( Editor.isPageLevel ) {
      return Editor.sendToCoreSync('undo:is-dirty');
    }

    return _global.dirty();
  },

  register ( id, def ) {
    _global.register(id,def);
  },

  local () {
    return new UndoList();
  },

  Command: Command,

  // for TEST
  _global: _global,
};

module.exports = Undo;

// ==========================
// Ipc
// ==========================

if ( Editor.isCoreLevel ) {
  const Ipc = require('ipc');

  Ipc.on( 'undo:perform-undo', () => { Undo.undo(); });
  Ipc.on( 'undo:perform-redo', () => { Undo.redo(); });
  Ipc.on( 'undo:record', () => { Undo.record(); });
  Ipc.on( 'undo:stash', () => { Undo.stash(); });
  Ipc.on( 'undo:save', () => { Undo.save(); });
  Ipc.on( 'undo:clear', () => { Undo.clear(); });
  Ipc.on( 'undo:dirty', event => { event.returnValue = Undo.dirty(); });
  Ipc.on( 'undo:reset', () => { Undo.reset(); });
}
