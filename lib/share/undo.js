'use strict';

/**
 * @class Command
 */
class Command {
  constructor ( info ) {
    this.info = info;
  }
  undo () { Editor.warn('Please implement undo function in your command'); }
  redo () { Editor.warn('Please implement redo function in your command'); }
  dirty () { return true; }
}

/**
 * @class CommandGroup
 */
class CommandGroup {
  constructor () {
    this._commands = [];
    this.desc = '';
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

  canCommit () {
    return this._commands.length;
  }
}

/**
 * @class UndoList
 */
class UndoList {
  constructor (type) {
    this._type = type;
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
    // check if we have un-commit group
    if ( this._curGroup.canCommit() ) {
      this._curGroup.undo();
      this._changed('undo-cache');

      this._curGroup.clear();
      return;
    }

    // check if can undo
    if ( this._position < 0 ) {
      return;
    }

    let group = this._groups[this._position];
    group.undo();
    this._position--;

    this._changed('undo');
  }

  redo () {
    // check if can redo
    if ( this._position >= this._groups.length-1 ) {
      return;
    }

    this._position++;
    let group = this._groups[this._position];
    group.redo();

    this._changed('redo');
  }

  add ( id, info ) {
    let ctor = this._id2cmdDef[id];
    if ( !ctor ) {
      Editor.error( `Can not find undo command ${id}, please register it first` );
      return;
    }

    this._clearRedo();
    let cmd = new ctor(info);
    this._curGroup.add(cmd);

    this._changed('add-command');
  }

  commit () {
    if ( this._curGroup.canCommit() ) {
      this._groups.push(this._curGroup);
      this._position++;

      this._changed('commit');
    }
    this._curGroup = new CommandGroup();
  }

  cancel () {
    this._curGroup.clear();
  }

  collapseTo ( index ) {
    // invalid index
    if ( index > this._position || index < 0 ) {
      Editor.warn(`Can not collapse undos to ${index}`);
      return;
    }

    // do nothing if index is same as position
    if ( index === this._position ) {
      return;
    }

    // TODO: we can check if command is same type as the before one,
    //       then invoke command.collapse(otherCmdInfo) when collapse commands
    let group = this._groups[index];
    for ( let i = index+1; i < this._groups.length; ++i ) {
      let g = this._groups[i];
      g._commands.forEach(cmd => {
        group.add(cmd);
      });
    }
    this._groups = this._groups.slice(0, index+1);

    this._position = index;
    if ( this._savePosition > this._position ) {
      this._savePosition = this._position;
    }
    this._changed('collapse');
  }

  save () {
    this._savePosition = this._position;
    this._changed('save');
  }

  clear () {
    this._curGroup = new CommandGroup();
    this._groups = [];
    this._position = -1;
    this._savePosition = -1;

    this._changed('clear');
  }

  dirty () {
    if ( this._savePosition !== this._position ) {
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

  setCurrentDescription ( desc ) {
    this._curGroup.desc = desc;
  }

  _clearRedo () {
    if ( this._position+1 === this._groups.length ) {
      return;
    }

    this._groups = this._groups.slice(0, this._position+1);
    this._curGroup.clear();

    if ( this._savePosition > this._position ) {
      this._savePosition = this._position;
    }
    this._changed('clear-redo');
  }

  _changed ( type ) {
    if ( this._type === 'local' ) {
      return;
    }

    Editor.sendToAll('undo:changed', type);
  }
}

let _global;

if ( Editor.isCoreLevel ) {
  _global = new UndoList('global');
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

  add ( id, info ) {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:add', id, info );
      return;
    }

    _global.add(id, info);
  },

  commit () {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:commit');
      return;
    }

    _global.commit();
  },

  cancel () {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:cancel');
      return;
    }

    _global.cancel();
  },

  collapseTo ( index ) {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:collapse', index );
      return;
    }

    _global.collapseTo(index);
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
      return Editor.sendToCoreSync('undo:dirty');
    }

    return _global.dirty();
  },

  setCurrentDescription ( desc ) {
    if ( Editor.isPageLevel ) {
      return Editor.sendToCoreSync('undo:set-desc', desc);
    }

    return _global.setCurrentDescription( desc );
  },

  register ( id, def ) {
    _global.register(id,def);
  },

  local () {
    return new UndoList('local');
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
  Ipc.on( 'undo:add', ( id, info ) => { Undo.add( id, info ); });
  Ipc.on( 'undo:commit', () => { Undo.commit(); });
  Ipc.on( 'undo:cancel', () => { Undo.cancel(); });
  Ipc.on( 'undo:collapse', ( index ) => { Undo.collapseTo( index ); });
  Ipc.on( 'undo:save', () => { Undo.save(); });
  Ipc.on( 'undo:clear', () => { Undo.clear(); });
  Ipc.on( 'undo:dirty', event => { event.returnValue = Undo.dirty(); });
  Ipc.on( 'undo:set-desc', desc => { Undo.setCurrentDescription(desc); });
  Ipc.on( 'undo:reset', () => { Undo.reset(); });
}
