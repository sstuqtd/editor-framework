'use strict';

/**
 * @module Editor.Utils
 */
let EditorUtils = {
  /**
   * @method padLeft
   * @param {string} text
   * @param {number} width
   * @param {string} ch - the character used to pad
   * @return {string}
   */
  padLeft ( text, width, ch ) {
    text = text.toString();
    width -= text.length;
    if ( width > 0 ) {
      return new Array( width + 1 ).join(ch) + text;
    }
    return text;
  },

  /**
   * @method formatFrame
   * @param {number} frame
   * @param {number} frameRate
   * @return {string}
   */
  formatFrame ( frame, frameRate ) {
    let decimals = Math.floor(Math.log10(frameRate))+1;
    let text = '';

    if ( frame < 0 ) {
      text = '-';
      frame = -frame;
    }

    return text +
      Math.floor(frame/frameRate) + ':' +
      EditorUtils.padLeft(frame % frameRate, decimals, '0');
  },

  /**
   * @method smoothScale
   * @param {number} curScale
   * @param {number} delta
   * @return {number}
   */
  smoothScale ( curScale, delta ) {
    let scale = curScale;
    scale = Math.pow( 2, delta * 0.002) * scale;

    return scale;
  },

  /**
   * Wrap error so that it can be sent between core and page level
   * @method wrapError
   */
  wrapError ( err ) {
    return {
      message: err.message,
      stack: err.stack,
    };
  },

  /**
   */
  arrayCmpFilter ( items, func ) {
    let results = [];
    for ( let i = 0; i < items.length; ++i ) {
      let item = items[i];
      let add = true;

      for ( let j = 0; j < results.length; ++j ) {
        let addedItem = results[j];

        if ( item === addedItem ) {
          // existed
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

    return results;
  },

  /**
   * @method fitSize
   * @param {number} srcWidth
   * @param {number} srcHeight
   * @param {number} destWidth
   * @param {number} destHeight
   * @return {number[]} - [width, height]
   */
  fitSize ( srcWidth, srcHeight, destWidth, destHeight ) {
    let width, height;

    if (
      srcWidth > destWidth &&
      srcHeight > destHeight
    ) {
      width = destWidth;
      height = srcHeight * destWidth/srcWidth;

      if ( height > destHeight ) {
        height = destHeight;
        width = srcWidth * destHeight/srcHeight;
      }

    } else if ( srcWidth > destWidth ) {
      width = destWidth;
      height = srcHeight * destWidth/srcWidth;

    } else if ( srcHeight > destHeight ) {
      width = srcWidth * destHeight/srcHeight;
      height = destHeight;

    } else {
      width = srcWidth;
      height = srcHeight;
    }

    return [width,height];
  }
};

module.exports = EditorUtils;
