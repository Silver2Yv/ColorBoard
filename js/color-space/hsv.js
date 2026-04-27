/**
 * HSV 色彩空间数据结构
 *
 * h 取值 0-360，s/v 取值 0-100
 * h 表示色相（Hue），s 表示饱和度（Saturation），v 表示明度（Value）
 */

/**
 * 将数值限制在指定范围内（保留小数，不四舍五入为整数）
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clampChannel(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 创建 HSV 颜色对象，自动 clamp
 * @param {number} h 色相 0-360
 * @param {number} s 饱和度 0-100
 * @param {number} v 明度 0-100
 * @returns {{h: number, s: number, v: number}}
 */
export function createHSV(h, s, v) {
  return {
    h: clampChannel(h, 0, 360),
    s: clampChannel(s, 0, 100),
    v: clampChannel(v, 0, 100)
  };
}

/**
 * 检查颜色是否为有效 HSV 对象
 * @param {any} color
 * @returns {boolean}
 */
export function isValidHSV(color) {
  return (
    color !== null &&
    typeof color === 'object' &&
    typeof color.h === 'number' && color.h >= 0 && color.h <= 360 &&
    typeof color.s === 'number' && color.s >= 0 && color.s <= 100 &&
    typeof color.v === 'number' && color.v >= 0 && color.v <= 100
  );
}
