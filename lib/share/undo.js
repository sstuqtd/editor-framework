'use strict';

class UndoCommand {
  constructor ( info ) {
    this.info = info;
  }
  undo () { Editor.warn('Please implement undo function in your command'); }
  redo () { Editor.warn('Please implement redo function in your command'); }
}

class UndoList {
  constructor () {
    this.commands = [];
    this.position = -1;
    this.savePosition = -1;

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
    // check if can undo
    if ( this.position < 0 ) {
      return;
    }

    let cmd = this.commands[this.position];
    cmd.undo();
    this.position--;
  }

  redo () {
    // check if can redo
    if ( this.position >= this.commands.length-1 ) {
      return;
    }

    this.position++;
    let cmd = this.commands[this.position];
    cmd.redo();
  }

  record ( id, info ) {
    let ctor = this._id2cmdDef[id];
    if ( !ctor ) {
      Editor.error( `Can not find undo command ${id}, please register it first` );
      return;
    }

    this._clearRedo();
    let cmd = new ctor(info);
    this.commands.push(cmd);
    this.position += 1;
  }

  save () {
    this.savePosition = this.position;
  }

  clear () {
    this.commands = [];
    this.position = -1;
    this.savePosition = -1;
  }

  dirty () {
    return this.savePosition !== this.position;
  }

  _clearRedo () {
    if ( this.position+1 === this.commands.length ) {
      return;
    }

    this.commands = this.commands.slice(0, this.position+1);
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

  record ( id, info ) {
    if ( Editor.isPageLevel ) {
      Editor.sendToCore('undo:record', id, info );
      return;
    }

    _global.record(id, info);
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

  dirty () {
    if ( Editor.isPageLevel ) {
      return Editor.sendToCoreSync('undo:is-dirty');
    }

    return _global.dirty();
  },

  reset () {
    if ( Editor.isPageLevel ) {
      return Editor.sendToCoreSync('undo:reset');
    }

    return _global.reset();
  },

  register ( id, def ) {
    _global.register(id,def);
  },

  local () {
    return new UndoList();
  },

  Command: UndoCommand,

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
  Ipc.on( 'undo:save', () => { Undo.save(); });
  Ipc.on( 'undo:clear', () => { Undo.clear(); });
  Ipc.on( 'undo:dirty', event => { event.returnValue = Undo.dirty(); });
  Ipc.on( 'undo:reset', () => { Undo.reset(); });
}
