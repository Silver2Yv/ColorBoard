/**
 * RGB 色彩空间数据结构
 *
 * r, g, b 取值 0-255，整数
 */

/**
 * 将数值限制在 [min, max] 范围内并四舍五入为整数
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min = 0, max = 255) {
  return Math.round(Math.min(Math.max(value, min), max));
}

/**
 * 创建 RGB 颜色对象，自动 clamp
 * @param {number} r 红 0-255
 * @param {number} g 绿 0-255
 * @param {number} b 蓝 0-255
 * @returns {{r: number, g: number, b: number}}
 */
export function createRGB(r, g, b) {
  return { r: clamp(r), g: clamp(g), b: clamp(b) };
}

/**
 * 检查颜色是否为有效 RGB 对象
 * @param {any} color
 * @returns {boolean}
 */
export function isValidRGB(color) {
  return (
    color !== null &&
    typeof color === 'object' &&
    Number.isInteger(color.r) && color.r >= 0 && color.r <= 255 &&
    Number.isInteger(color.g) && color.g >= 0 && color.g <= 255 &&
    Number.isInteger(color.b) && color.b >= 0 && color.b <= 255
  );
}
