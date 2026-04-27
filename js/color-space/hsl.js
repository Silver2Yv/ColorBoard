/**
 * HSL 色彩空间数据结构
 *
 * h 取值 0-360，s/l 取值 0-100
 * h 表示色相（Hue），s 表示饱和度（Saturation），l 表示亮度（Lightness）
 */

/**
 * 将数值限制在指定范围内
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clampChannel(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 创建 HSL 颜色对象，自动 clamp
 * @param {number} h 色相 0-360
 * @param {number} s 饱和度 0-100
 * @param {number} l 亮度 0-100
 * @returns {{h: number, s: number, l: number}}
 */
export function createHSL(h, s, l) {
  return {
    h: clampChannel(h, 0, 360),
    s: clampChannel(s, 0, 100),
    l: clampChannel(l, 0, 100)
  };
}

/**
 * 检查颜色是否为有效 HSL 对象
 * @param {any} color
 * @returns {boolean}
 */
export function isValidHSL(color) {
  return (
    color !== null &&
    typeof color === 'object' &&
    typeof color.h === 'number' && color.h >= 0 && color.h <= 360 &&
    typeof color.s === 'number' && color.s >= 0 && color.s <= 100 &&
    typeof color.l === 'number' && color.l >= 0 && color.l <= 100
  );
}
