'use strict';

let DockUtils = {};
module.exports = DockUtils;

// requires
const Electron = require('electron');
const Async = require('async');

const Console = require('../../console');
const Ipc = require('../../ipc');
const Panel = require('../../panel');
const Window = require('../../window');
const DomUtils = require('./dom-utils');

const _resizerSpace = 3; // 3 is resizer size

let _resultDock = null;
let _potentialDocks = [];
let _dockMask = null;

let _dragenterCnt = 0;
let _draggingInfo = null;

let _layouting = false;

// ==========================
// exports
// ==========================

/**
 * @property root
 */
DockUtils.root = null;

/**
 * @property resizerSpace
 */
DockUtils.resizerSpace = _resizerSpace;

DockUtils.dragstart = function ( dataTransfer, tabEL ) {
  dataTransfer.setData('editor/type', 'tab');

  let frameEL = tabEL.frameEL;
  let panelID = frameEL.id;
  let panelEL = frameEL.parentNode;
  let panelRect = panelEL.getBoundingClientRect();

  _draggingInfo = {
    panelID: panelID,
    panelRectWidth: panelRect.width,
    panelRectHeight: panelRect.height,

    panelWidth: panelEL.width,
    panelHeight: panelEL.height,
    panelComputedWidth: panelEL.computedWidth,
    panelComputedHeight: panelEL.computedHeight,
    panelCurWidth: panelEL.curWidth,
    panelCurHeight: panelEL.curHeight,

    panelMinWidth: panelEL.minWidth,
    panelMinHeight: panelEL.minHeight,
    panelMaxWidth: panelEL.maxWidth,
    panelMaxHeight: panelEL.maxHeight,

    parentDockRow: panelEL.parentNode.row,
  };

  if ( Ipc.sendToWins ) {
    Ipc.sendToWins('editor:panel-dragstart', _draggingInfo, Ipc.option({
      excludeSelf: true
    }));
    Ipc.sendToWins('editor:dragstart');
  }
};

DockUtils.dragoverTab = function ( target ) {
  if ( !_draggingInfo ) {
    return;
  }

  Window.focus();

  // clear docks hints
  _potentialDocks = [];
  _resultDock = null;

  if ( _dockMask ) {
    _dockMask.remove();
  }

  let rect = target.getBoundingClientRect();
  _updateMask ( 'tab', rect.left, rect.top, rect.width, rect.height+2 );
};

DockUtils.dropTab = function ( target, insertBeforeTabEL ) {
  if ( !_draggingInfo ) {
    return;
  }

  let panelID = _draggingInfo.panelID;
  let frameEL = Panel.find(panelID);

  if ( frameEL ) {
    let panelEL = frameEL.parentNode;
    let targetPanelEL = target.panelEL;

    let needCollapse = panelEL !== targetPanelEL;
    let currentTabEL = panelEL.$.tabs.findTab(frameEL);

    if ( needCollapse ) {
      panelEL.closeNoCollapse(currentTabEL);
    }

    //
    let idx = targetPanelEL.insert( currentTabEL, frameEL, insertBeforeTabEL );
    targetPanelEL.select(idx);

    if ( needCollapse ) {
      panelEL.collapse();
    }

    // reset internal states
    _reset();

    //
    DockUtils.flush();
    DockUtils.saveLayout();

    // NOTE: you must focus after DockUtils flushed
    // NOTE: do not use panelEL focus, the activeTab is still not assigned
    frameEL.focus();
    if ( Panel.isDirty(frameEL.id) ) {
      targetPanelEL.outOfDate(frameEL);
    }
  } else {
    Panel.close(panelID, (err, closed) => {
      if ( err ) {
        Console.error(`Failed to close panel ${panelID}: ${err.stack}`);
        return;
      }

      if ( !closed ) {
        return;
      }

      Panel.newFrame(panelID, (err, frameEL) => {
        if ( err ) {
          Console.error(err.stack);
          return;
        }

        window.requestAnimationFrame ( () => {
          let targetPanelEL = target.panelEL;
          let newTabEL = document.createElement('ui-dock-tab');
          newTabEL.name = frameEL.name;

          let idx = targetPanelEL.insert( newTabEL, frameEL, insertBeforeTabEL );
          targetPanelEL.select(idx);

          // reset internal states
          _reset();

          //
          DockUtils.flush();
          DockUtils.saveLayout();

          Panel.dock(panelID, frameEL);

          // NOTE: you must focus after DockUtils flushed
          // NOTE: do not use panelEL focus, the activeTab is still not assigned
          frameEL.focus();
          if ( Panel.isDirty(frameEL.id) ) {
            targetPanelEL.outOfDate(frameEL);
          }

          // DELME: this is for the polymer fallback
          if ( frameEL._info.ui === 'polymer' ) {
            if ( frameEL['panel-ready'] ) {
              frameEL['panel-ready']();
            }

            return;
          }

          // start loading
          frameEL.load(err => {
            if ( err ) {
              Console.error(err.stack);
              return;
            }

            if ( frameEL.ready ) {
              frameEL.ready();
            }
          });
        });
      });
    });
  }
};

DockUtils.dragoverDock = function ( target ) {
  if ( !_draggingInfo ) {
    return;
  }

  _potentialDocks.push(target);
};

DockUtils.reset = function () {
  if ( !DockUtils.root ) {
    return;
  }

  if ( DockUtils.root._dockable ) {
    this.root._finalizeSizeRecursively(true);
    this.root._finalizeMinMaxRecursively();
    this.root._finalizeStyleRecursively();
    this.root._notifyResize();
  } else {
    // NOTE: non-dockable panel is a single panel frame
    DomUtils.fire(DockUtils.root, 'panel-resize');
  }
};

DockUtils.flushWithCollapse = function () {
  this.root._collapseRecursively();

  if ( !DockUtils.root ) {
    return;
  }

  if ( DockUtils.root._dockable ) {
    this.root._finalizeSizeRecursively(false);
    this.root._finalizeMinMaxRecursively();
    this.root._finalizeStyleRecursively();
    this.root._notifyResize();
  } else {
    // NOTE: non-dockable panel is a single panel frame
    DomUtils.fire(DockUtils.root, 'panel-resize');
  }
};

DockUtils.flush = function () {
  if ( !DockUtils.root ) {
    return;
  }

  if ( DockUtils.root._dockable ) {
    this.root._finalizeMinMaxRecursively();
    this.root._finalizeStyleRecursively();
    this.root._notifyResize();
  } else {
    // NOTE: non-dockable panel is a single panel frame
    DomUtils.fire(DockUtils.root, 'panel-resize');
  }
};

DockUtils.reflow = function () {
  if ( !DockUtils.root ) {
    return;
  }

  if ( DockUtils.root._dockable ) {
    DockUtils.root._reflowRecursively();
    DockUtils.root._notifyResize();
  } else {
    // NOTE: non-dockable panel is a single panel frame
    DomUtils.fire(DockUtils.root, 'panel-resize');
  }
};

DockUtils.layout = function (mainDock, info) {
  let frameInfos = [];

  DomUtils.clear(mainDock);

  // failed to load layout
  if ( !info || !info.type || info.type.indexOf('dock') !== 0 ) {
    return frameInfos;
  }

  //
  if ( info.type === 'dock-v' ) {
    mainDock.row = false;
  } else if ( info.type === 'dock-h' ) {
    mainDock.row = true;
  }

  _createLayouts( mainDock, info.children, frameInfos );

  return frameInfos;
};

DockUtils.loadLayout = function (mainDock, cb) {
  Ipc.sendToMain( 'editor:window-query-layout', (err, layout, needReset) => {
    if ( !layout ) {
      if (cb) {
        cb ( false );
      }
      return;
    }

    // NOTE: needReset implies this is a default layout
    DockUtils.resetLayout(mainDock, layout, (err) => {
      if (cb) {
        cb ( err ? false : needReset );
      }
    });
  });
};

DockUtils.resetLayout = function (mainDock, info, cb) {
  _layouting = true;

  Async.waterfall([
    // close all panels
    next => {
      Panel._unloadAll(next);
    },

    // create layout
    next => {
      let results = DockUtils.layout(mainDock, info);
      next ( null, results );
    },

    // dock panel frames
    (results, next) => {
      let frameELs = [];

      Async.each(results, (info, done) => {
        Panel.newFrame (info.panelID, (err, frameEL) => {
          if ( err ) {
            Console.error(err.stack);
            done();
            return;
          }

          let dockAt = info.dockEL;
          dockAt.add(frameEL);
          if ( info.active ) {
            dockAt.select(frameEL);
          }

          Panel.dock(info.panelID, frameEL);
          frameELs.push(frameEL);
          done();
        });
      }, err => {
        // close error panels
        DockUtils.flushWithCollapse();
        DockUtils.saveLayout();

        next(err, frameELs);
      });
    },

    // load all panels
    (frameELs, next) => {
      frameELs.forEach(frameEL => {
        // DELME: this is for the polymer fallback
        if ( frameEL._info.ui === 'polymer' ) {
          if ( frameEL['panel-ready'] ) {
            frameEL['panel-ready']();
          }
          return;
        }

        // start loading
        frameEL.load(err => {
          if ( err ) {
            Console.error(err.stack);
            return;
          }

          if ( frameEL.ready ) {
            frameEL.ready();
          }
        });
      });

      next();
    },

  ], err => {
    _layouting = false;

    if ( cb ) {
      cb ( err );
    }
  });
};

DockUtils.saveLayout = function () {
  // don't save layout when we are layouting
  if ( _layouting ) {
    return;
  }

  window.requestAnimationFrame ( () => {
    Ipc.sendToMain('editor:window-save-layout', DockUtils.dumpLayout());
  });
};

/**
 * @method dumpLayout
 *
 * Dump the layout of the panels in current window
 */
DockUtils.dumpLayout = function () {
  let root = DockUtils.root;
  if ( !root ) {
    return null;
  }

  if ( root._dockable ) {
    let type = root.row ? 'dock-h': 'dock-v';
    return {
      'type': type,
      'children': _getDocks(root),
    };
  } else {
    let id = root.getAttribute('id');
    let rect = root.getBoundingClientRect();

    return {
      'type': 'standalone',
      'panel': id,
      'width': rect.width,
      'height': rect.height,
    };
  }
};

/**
 * @method isPanel
 */
DockUtils.isPanel = function (el) {
  return el.tagName === 'UI-DOCK-PANEL';
};

/**
 * @method isPanelFrame
 */
DockUtils.isPanelFrame = function (el) {
  return el.tagName === 'UI-PANEL-FRAME';
};

/**
 * @method isResizer
 */
DockUtils.isResizer = function (el) {
  return el.tagName === 'UI-DOCK-RESIZER';
};

/**
 * @method isTab
 */
DockUtils.isTab = function (el) {
  return el.tagName === 'UI-DOCK-TAB';
};

/**
 * @method isTabBar
 */
DockUtils.isTabBar = function (el) {
  return el.tagName === 'UI-DOCK-TABS';
};

// ==========================
// Internal
// ==========================

function _getPanels ( panelEL ) {
  let panels = [];

  for ( let i = 0; i < panelEL.children.length; ++i ) {
    let childEL = panelEL.children[i];
    let id = childEL.id;
    panels.push(id);
  }

  return panels;
}

function _getDocks ( dockEL ) {
  let docks = [];

  for ( let i = 0; i < dockEL.children.length; ++i ) {
    let childEL = dockEL.children[i];

    if ( !childEL._dockable ) {
      continue;
    }

    let rect = childEL.getBoundingClientRect();
    let info = {
      'width': rect.width,
      'height': rect.height,
    };

    if ( DockUtils.isPanel(childEL) ) {
      info.type = 'panel';
      info.active = childEL.activeIndex;
      info.children = _getPanels(childEL);
    } else {
      let type = childEL.row ? 'dock-h': 'dock-v';
      info.type = type;
      info.children = _getDocks(childEL);
    }

    docks.push(info);
  }

  return docks;
}

function _createLayouts ( parentEL, infos, frameInfos ) {
  if ( !infos ) {
    return;
  }

  for ( let i = 0; i < infos.length; ++i ) {
    let info = infos[i];

    let el;

    if ( info.type === 'dock-v' ) {
      el = document.createElement('ui-dock');
      el.row = false;
    } else if ( info.type === 'dock-h' ) {
      el = document.createElement('ui-dock');
      el.row = true;
    } else if ( info.type === 'panel' ) {
      el = document.createElement('ui-dock-panel');
    }

    if ( !el ) {
      Editor.warn(`Failed to create layout from ${info}`);
      continue;
    }

    if ( info.width !== undefined ) {
      el.curWidth = info.width;
    }

    if ( info.height !== undefined ) {
      el.curHeight = info.height;
    }

    if ( info.type === 'panel' ) {
      for ( let j = 0; j < info.children.length; ++j ) {
        frameInfos.push({
          dockEL: el,
          panelID: info.children[j],
          active: j === info.active
        });
      }
    } else {
      _createLayouts ( el, info.children, frameInfos );
    }

    parentEL.appendChild(el);
  }

  parentEL._initResizers();
}

function _updateMask ( type, x, y, w, h ) {
  if ( !_dockMask ) {
    // add dock mask
    _dockMask = document.createElement('div');
    _dockMask.classList.add('dock-mask');
    _dockMask.oncontextmenu = function() { return false; };
  }

  if ( type === 'dock' ) {
    _dockMask.classList.remove('tab');
    _dockMask.classList.add('dock');
  } else if ( type === 'tab' ) {
    _dockMask.classList.remove('dock');
    _dockMask.classList.add('tab');
  }

  _dockMask.style.left = x + 'px';
  _dockMask.style.top = y + 'px';
  _dockMask.style.width = w + 'px';
  _dockMask.style.height = h + 'px';

  if ( !_dockMask.parentElement ) {
    document.body.appendChild(_dockMask);
  }
}

function _reset () {
  if ( _dockMask ) {
    _dockMask.remove();
  }

  _resultDock = null;
  _dragenterCnt = 0;
  _draggingInfo = null;
}

// ==========================
// Ipc
// ==========================

const ipcRenderer = Electron.ipcRenderer;

ipcRenderer.on('editor:panel-dragstart', ( event, info ) => {
  _draggingInfo = info;
});

ipcRenderer.on('editor:panel-dragend', () => {
  _reset();
});

ipcRenderer.on('editor:reset-layout', (event, info) => {
  DockUtils.resetLayout(DockUtils.root, info, (err) => {
    if ( !err ) {
      DockUtils.reset();
    }
  });
});

// ==========================
// Dom
// ==========================

window.addEventListener('resize', () => {
  DockUtils.reflow();
});

document.addEventListener('dragenter', event => {
  if ( !_draggingInfo ) {
    return;
  }

  event.stopPropagation();
  ++_dragenterCnt;
});

document.addEventListener('dragleave', event => {
  if ( !_draggingInfo ) {
    return;
  }

  event.stopPropagation();
  --_dragenterCnt;

  if ( _dragenterCnt === 0 ) {
    if ( _dockMask ) {
      _dockMask.remove();
    }
  }
});

document.addEventListener('dragover', event => {
  if ( !_draggingInfo ) {
    return;
  }

  event.dataTransfer.dropEffect = 'move';
  event.preventDefault();

  Window.focus();

  let minDistance = null;
  _resultDock = null;

  for ( let i = 0; i < _potentialDocks.length; ++i ) {
    let hintTarget = _potentialDocks[i];
    let targetRect = hintTarget.getBoundingClientRect();
    let center_x = targetRect.left + targetRect.width/2;
    let center_y = targetRect.top + targetRect.height/2;
    let pos = null;

    let leftDist = Math.abs(event.x - targetRect.left);
    let rightDist = Math.abs(event.x - targetRect.right);
    let topDist = Math.abs(event.y - targetRect.top);
    let bottomDist = Math.abs(event.y - targetRect.bottom);
    let minEdge = 100;
    let distanceToEdgeCenter = -1;

    if ( leftDist < minEdge ) {
      minEdge = leftDist;
      distanceToEdgeCenter = Math.abs(event.y - center_y);
      pos = 'left';
    }

    if ( rightDist < minEdge ) {
      minEdge = rightDist;
      distanceToEdgeCenter = Math.abs(event.y - center_y);
      pos = 'right';
    }

    if ( topDist < minEdge ) {
      minEdge = topDist;
      distanceToEdgeCenter = Math.abs(event.x - center_x);
      pos = 'top';
    }

    if ( bottomDist < minEdge ) {
      minEdge = bottomDist;
      distanceToEdgeCenter = Math.abs(event.x - center_x);
      pos = 'bottom';
    }

    //
    if ( pos !== null && (minDistance === null || distanceToEdgeCenter < minDistance) ) {
      minDistance = distanceToEdgeCenter;
      _resultDock = { target: hintTarget, position: pos };
    }
  }

  if ( _resultDock ) {
    let rect = _resultDock.target.getBoundingClientRect();
    let maskRect = null;

    let panelComputedWidth = _draggingInfo.panelComputedWidth;
    let panelComputedHeight = _draggingInfo.panelComputedHeight;
    let panelRectWidth = _draggingInfo.panelRectWidth;
    let panelRectHeight = _draggingInfo.panelRectHeight;

    let hintWidth = panelComputedWidth === 'auto' ? rect.width/2 : panelRectWidth;
    hintWidth = Math.min( hintWidth, Math.min( rect.width/2, 200 ) );

    let hintHeight = panelComputedHeight === 'auto' ? rect.height/2 : panelRectHeight;
    hintHeight = Math.min( hintHeight, Math.min( rect.height/2, 200 ) );

    if ( _resultDock.position === 'top' ) {
      maskRect = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: hintHeight,
      };
    } else if ( _resultDock.position === 'bottom' ) {
      maskRect = {
        left: rect.left,
        top: rect.bottom-hintHeight,
        width: rect.width,
        height: hintHeight
      };
    } else if ( _resultDock.position === 'left' ) {
      maskRect = {
        left: rect.left,
        top: rect.top,
        width: hintWidth,
        height: rect.height
      };
    } else if ( _resultDock.position === 'right' ) {
      maskRect = {
        left: rect.right-hintWidth,
        top: rect.top,
        width: hintWidth,
        height: rect.height
      };
    }

    //
    _updateMask ( 'dock', maskRect.left, maskRect.top, maskRect.width, maskRect.height );
  } else {
    if ( _dockMask ) {
      _dockMask.remove();
    }
  }

  _potentialDocks = [];
});

document.addEventListener('dragend', () => {
  // reset internal states
  _reset();
  if ( Ipc.sendToWins ) {
    Ipc.sendToWins( 'editor:panel-dragend', Ipc.option({
      excludeSelf: true
    }));
    Ipc.sendToWins( 'editor:dragend' );
  }
});

document.addEventListener('drop', event => {
  if ( Ipc.sendToWins ) {
    Ipc.sendToWins( 'editor:dragend' );
  }

  event.preventDefault();
  event.stopPropagation();

  if ( _resultDock === null ) {
    return;
  }

  let panelID = _draggingInfo.panelID;
  let panelRectWidth = _draggingInfo.panelRectWidth;
  let panelRectHeight = _draggingInfo.panelRectHeight;

  let panelWidth = _draggingInfo.panelWidth;
  let panelHeight = _draggingInfo.panelHeight;
  let panelComputedWidth = _draggingInfo.panelComputedWidth;
  let panelComputedHeight = _draggingInfo.panelComputedHeight;
  let panelCurWidth = _draggingInfo.panelCurWidth;
  let panelCurHeight = _draggingInfo.panelCurHeight;

  let panelMinWidth = _draggingInfo.panelMinWidth;
  let panelMinHeight = _draggingInfo.panelMinHeight;
  let panelMaxWidth = _draggingInfo.panelMaxWidth;
  let panelMaxHeight = _draggingInfo.panelMaxHeight;

  let parentDockRow = _draggingInfo.parentDockRow;

  let targetDockEL = _resultDock.target;
  let dockPosition = _resultDock.position;

  let frameEL = Panel.find(panelID);
  if ( !frameEL ) {
    Panel.close(panelID, (err, closed) => {
      if ( err ) {
        Console.error(`Failed to close panel ${panelID}: ${err.stack}`);
        return;
      }

      if ( !closed ) {
        return;
      }

      Panel.newFrame(panelID, (err, frameEL) => {
        if ( err ) {
          Console.error(err.stack);
          return;
        }

        window.requestAnimationFrame (() => {
          let newPanel = document.createElement('ui-dock-panel');
          newPanel.width = panelWidth;
          newPanel.height = panelHeight;
          newPanel.minWidth = panelMinWidth;
          newPanel.maxWidth = panelMaxWidth;
          newPanel.minHeight = panelMinHeight;
          newPanel.maxHeight = panelMaxHeight;

          // NOTE: here must use frameEL's width, height attribute to determine computed size
          let elWidth = frameEL.width;
          newPanel.computedWidth = elWidth === 'auto' ? 'auto' : panelComputedWidth;

          let elHeight = frameEL.height;
          newPanel.computedHeight = elHeight === 'auto' ? 'auto' : panelComputedHeight;

          // if parent is row, the height will be ignore
          if ( parentDockRow ) {
            newPanel.curWidth = newPanel.computedWidth === 'auto' ? 'auto' : panelRectWidth;
            newPanel.curHeight = newPanel.computedHeight === 'auto' ? 'auto' : panelCurHeight;
          }
          // else if parent is column, the width will be ignore
          else {
            newPanel.curWidth = newPanel.computedWidth === 'auto' ? 'auto' : panelCurWidth;
            newPanel.curHeight = newPanel.computedHeight === 'auto' ? 'auto' : panelRectHeight;
          }

          newPanel.add(frameEL);
          newPanel.select(0);

          //
          targetDockEL.addDock( dockPosition, newPanel );

          // reset internal states
          _reset();

          //
          DockUtils.flush();
          DockUtils.saveLayout();

          Panel.dock(panelID, frameEL);

          // NOTE: you must focus after DockUtils flushed
          // NOTE: do not use panelEL focus, the activeTab is still not assigned
          frameEL.focus();
          if ( Panel.isDirty(frameEL.id) ) {
            newPanel.outOfDate(frameEL);
          }

          // DELME: this is for the polymer fallback
          if ( frameEL._info.ui === 'polymer' ) {
            if ( frameEL['panel-ready'] ) {
              frameEL['panel-ready']();
            }

            return;
          }

          // start loading
          frameEL.load(err => {
            if ( err ) {
              Console.error(err.stack);
              return;
            }

            if ( frameEL.ready ) {
              frameEL.ready();
            }
          });
        });
      });
    });

    return;
  }

  let panelEL = frameEL.parentNode;

  if (
    targetDockEL === panelEL &&
    targetDockEL.tabCount === 1
  ) {
    return;
  }

  let parentDock = panelEL.parentNode;

  //
  let currentTabEL = panelEL.$.tabs.findTab(frameEL);
  panelEL.closeNoCollapse(currentTabEL);

  //
  let newPanel = document.createElement('ui-dock-panel');
  newPanel.width = panelWidth;
  newPanel.height = panelHeight;
  newPanel.minWidth = panelMinWidth;
  newPanel.maxWidth = panelMaxWidth;
  newPanel.minHeight = panelMinHeight;
  newPanel.maxHeight = panelMaxHeight;

  // NOTE: here must use frameEL's width, height attribute to determine computed size
  let elWidth = frameEL.width;
  newPanel.computedWidth = elWidth === 'auto' ? 'auto' : panelComputedWidth;

  let elHeight = frameEL.height;
  newPanel.computedHeight = elHeight === 'auto' ? 'auto' : panelComputedHeight;

  // if parent is row, the height will be ignore
  if ( parentDock.row ) {
    newPanel.curWidth = newPanel.computedWidth === 'auto' ? 'auto' : panelRectWidth;
    newPanel.curHeight = newPanel.computedHeight === 'auto' ? 'auto' : panelCurHeight;
  }
  // else if parent is column, the width will be ignore
  else {
    newPanel.curWidth = newPanel.computedWidth === 'auto' ? 'auto' : panelCurWidth;
    newPanel.curHeight = newPanel.computedHeight === 'auto' ? 'auto' : panelRectHeight;
  }

  newPanel.add(frameEL);
  newPanel.select(0);

  //
  targetDockEL.addDock( dockPosition, newPanel );

  //
  let totallyRemoved = panelEL.children.length === 0;
  panelEL.collapse();

  // if we totally remove the panelEL, check if targetDock has the ancient as panelEL does
  // if that is true, add parentEL's size to targetDock's flex style size
  if ( totallyRemoved ) {
    let hasSameAncient = false;

    // if newPanel and oldPanel have the same parent, don't do the calculation.
    // it means newPanel just move under the same parent dock in same direction.
    if ( newPanel.parentNode !== parentDock ) {
      let sibling = newPanel;
      let newParent = newPanel.parentNode;

      while ( newParent && newParent._dockable ) {
        if ( newParent === parentDock ) {
          hasSameAncient = true;
          break;
        }

        sibling = newParent;
        newParent = newParent.parentNode;
      }

      if ( hasSameAncient ) {
        let size = 0;

        if ( parentDock.row ) {
          size = sibling.curWidth + _resizerSpace + panelCurWidth;
          sibling.curWidth = size;
        } else {
          size = sibling.curHeight + _resizerSpace + panelCurHeight;
          sibling.curHeight = size;
        }

        sibling.style.flex = `0 0 ${size}px`;
      }
    }
  }

  // reset internal states
  _reset();

  //
  DockUtils.flush();
  DockUtils.saveLayout();

  // NOTE: you must focus after DockUtils flushed
  // NOTE: do not use panelEL focus, the activeTab is still not assigned
  frameEL.focus();
  if ( Panel.isDirty(frameEL.id) ) {
    newPanel.outOfDate(frameEL);
  }
});
