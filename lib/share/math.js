'use strict';

const _d2r = Math.PI / 180.0;
const _r2d = 180.0 / Math.PI;

/**
 * [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math)
 */
let _Math = {
  /**
   * @property {number} TWO_PI - Two Pi
   */
  TWO_PI: 2.0 * Math.PI,

  /**
   * @property {number} HALF_PI - Half Pi
   */
  HALF_PI: 0.5 * Math.PI,

  /**
   * @property {number} D2R - degree to radius
   */
  D2R: _d2r,

  /**
   * @property {number} R2D - radius to degree
   */
  R2D: _r2d,

  /**
   * degree to radius
   * @method deg2rad
   * @param {number} degree
   * @return {number} radius
   */
  deg2rad ( degree ) {
    return degree * _d2r;
  },

  /**
   * radius to degree
   * @method rad2deg
   * @param {number} radius
   * @return {number} degree
   */
  rad2deg ( radius ) {
    return radius * _r2d;
  },

  /**
   * let radius in -pi to pi
   * @method rad180
   * @param {number} radius
   * @return {number} clamped radius
   */
  rad180 ( radius ) {
    if ( radius > Math.PI || radius < -Math.PI ) {
      radius = (radius + _Math.TOW_PI) % _Math.TOW_PI;
    }
    return radius;
  },

  /**
   * let radius in 0 to 2pi
   * @method rad360
   * @param {number} radius
   * @return {number} clamped radius
   */
  rad360 ( radius ) {
    if ( radius > _Math.TWO_PI ) {
      return radius % _Math.TOW_PI;
    } else if ( radius < 0.0 ) {
      return _Math.TOW_PI + radius % _Math.TOW_PI;
    }

    return radius;
  },

  /**
   * let degree in -180 to 180
   * @method deg180
   * @param {number} degree
   * @return {number} clamped degree
   */
  deg180 ( degree ) {
    if ( degree > 180.0 || degree < -180.0 ) {
      degree = (degree + 360.0) % 360.0;
    }
    return degree;
  },

  /**
   * let degree in 0 to 360
   * @method deg360
   * @param {number} degree
   * @return {number} clamped degree
   */
  deg360 ( degree ) {
    if ( degree > 360.0 ) {
      return degree % 360.0;
    } else if ( degree < 0.0 ) {
      return 360.0 + degree % 360.0;
    }
    return degree;
  },

  /**
   * Returns a floating-point random number between min (inclusive) and max (exclusive).
   * @method randomRange
   * @param {number} min
   * @param {number} max
   * @return {number} the random number
   */
  randomRange (min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Returns a random integer between min (inclusive) and max (exclusive).
   * @method randomRangeInt
   * @param {number} min
   * @param {number} max
   * @return {number} the random integer
   */
  randomRangeInt (min, max) {
    return Math.floor(_Math.randomRange(min, max));
  },

  /**
   * Clamps a value between a minimum float and maximum float value.
   * @method clamp
   * @param {number} val
   * @param {number} min
   * @param {number} max
   * @return {number}
   */
  clamp ( val, min, max ) {
    if (typeof min !== 'number') {
      Editor.error('[clamp] min value must be type number');
      return;
    }

    if (typeof max !== 'number') {
      Editor.error('[clamp] max value must be type number');
      return;
    }

    if (min > max) {
      Editor.error('[clamp] max value must not less than min value');
      return;
    }

    return Math.min( Math.max( val, min ), max );
  },

  /**
   * Clamps a value between 0 and 1.
   * @method clamp01
   * @param {number} val
   * @return {number}
   */
  clamp01 ( val ) {
    return Math.min( Math.max( val, 0 ), 1 );
  },

  /**
   * @method calculateMaxRect
   * @param {Rect} out
   * @param {Vec2} p0
   * @param {Vec2} p1
   * @param {Vec2} p2
   * @param {Vec2} p3
   * @return {Rect} just the out rect itself
   */
  calculateMaxRect (out, p0, p1, p2, p3) {
    let minX = Math.min(p0.x, p1.x, p2.x, p3.x);
    let maxX = Math.max(p0.x, p1.x, p2.x, p3.x);
    let minY = Math.min(p0.y, p1.y, p2.y, p3.y);
    let maxY = Math.max(p0.y, p1.y, p2.y, p3.y);

    out.x = minX;
    out.y = minY;
    out.width = maxX - minX;
    out.height = maxY - minY;

    return out;
  },

  /**
   * @method lerp
   * @param {number} from
   * @param {number} to
   * @param {number} ratio - the interpolation coefficient
   * @return {number}
   */
  lerp (from, to, ratio) {
    return from + (to - from) * ratio;
  },

  /**
   * @method numOfDecimals
   * get number of decimals for decimal part
   */
  numOfDecimals (val) {
    return _Math.clamp(Math.floor( Math.log10(val) ), 0, 20);
  },

  /**
   * @method numOfDecimalsF
   * get number of decimals for fractional part
   */
  numOfDecimalsF (val) {
    return _Math.clamp(-Math.floor( Math.log10(val) ), 0, 20);
  },

  /**
   * @method toPrecision
   */
  toPrecision( val, precision ) {
    precision = _Math.clamp(precision, 0, 20);
    return parseFloat(val.toFixed(precision));
  },

  /**
   * @method bezier
   * @param {number} c0
   * @param {number} c1
   * @param {number} c2
   * @param {number} c3
   * @param {number} t - the ratio
   */
  // Reference:
  // - http://devmag.org.za/2011/04/05/bzier-curves-a-tutorial/
  // - http://devmag.org.za/2011/06/23/bzier-path-algorithms/
  // - http://pomax.github.io/bezierinfo/
  bezier (c0, c1, c2, c3, t) {
    let t1 = 1 - t;
    return c0 * t1 * t1 * t1 +
           c1 * 3 * t1 * t1 * t +
           c2 * 3 * t1 * t * t +
           c3 * t * t * t;
  }
};

module.exports = _Math;
