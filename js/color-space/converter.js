/**
 * 色彩空间转换器
 *
 * 纯函数集合，实现 RGB / HSV / HSL / HEX 之间的双向转换
 * 无 DOM 依赖，可在 Node.js 和浏览器中运行
 */

import { clamp } from './rgb.js';

// ============================================================
// RGB ↔ HSV
// ============================================================

/**
 * RGB → HSV 转换
 * @param {number} r 红 0-255
 * @param {number} g 绿 0-255
 * @param {number} b 蓝 0-255
 * @returns {{h: number, s: number, v: number}}
 */
export function rgbToHsv(r, g, b) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const v = max * 100;

  if (delta !== 0) {
    s = (delta / max) * 100;

    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * (((bNorm - rNorm) / delta) + 2);
    } else {
      h = 60 * (((rNorm - gNorm) / delta) + 4);
    }

    if (h < 0) h += 360;
  }

  return { h: Math.round(h * 100) / 100, s: Math.round(s * 100) / 100, v: Math.round(v * 100) / 100 };
}

/**
 * HSV → RGB 转换
 * @param {number} h 色相 0-360
 * @param {number} s 饱和度 0-100
 * @param {number} v 明度 0-100
 * @returns {{r: number, g: number, b: number}}
 */
export function hsvToRgb(h, s, v) {
  const sNorm = s / 100;
  const vNorm = v / 100;

  if (sNorm === 0) {
    const gray = Math.round(vNorm * 255);
    return { r: gray, g: gray, b: gray };
  }

  const sector = h / 60;
  const sectorIndex = Math.floor(sector) % 6;

  const c = vNorm * sNorm;
  const x = c * (1 - Math.abs((sector % 2) - 1));
  const m = vNorm - c;

  let rNorm = 0, gNorm = 0, bNorm = 0;

  switch (sectorIndex) {
    case 0: rNorm = c; gNorm = x; bNorm = 0; break;
    case 1: rNorm = x; gNorm = c; bNorm = 0; break;
    case 2: rNorm = 0; gNorm = c; bNorm = x; break;
    case 3: rNorm = 0; gNorm = x; bNorm = c; break;
    case 4: rNorm = x; gNorm = 0; bNorm = c; break;
    case 5: rNorm = c; gNorm = 0; bNorm = x; break;
  }

  return {
    r: clamp((rNorm + m) * 255),
    g: clamp((gNorm + m) * 255),
    b: clamp((bNorm + m) * 255)
  };
}

// ============================================================
// RGB ↔ HSL
// ============================================================

/**
 * RGB → HSL 转换
 * @param {number} r 红 0-255
 * @param {number} g 绿 0-255
 * @param {number} b 蓝 0-255
 * @returns {{h: number, s: number, l: number}}
 */
export function rgbToHsl(r, g, b) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  const l = ((max + min) / 2) * 100;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = (delta / (1 - Math.abs(2 * (l / 100) - 1))) * 100;

    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * (((bNorm - rNorm) / delta) + 2);
    } else {
      h = 60 * (((rNorm - gNorm) / delta) + 4);
    }

    if (h < 0) h += 360;
  }

  return { h: Math.round(h * 100) / 100, s: Math.round(s * 100) / 100, l: Math.round(l * 100) / 100 };
}

/**
 * HSL → RGB 转换
 * @param {number} h 色相 0-360
 * @param {number} s 饱和度 0-100
 * @param {number} l 亮度 0-100
 * @returns {{r: number, g: number, b: number}}
 */
export function hslToRgb(h, s, l) {
  const sNorm = s / 100;
  const lNorm = l / 100;

  if (sNorm === 0) {
    const gray = clamp(lNorm * 255);
    return { r: gray, g: gray, b: gray };
  }

  const sector = h / 60;
  const sectorIndex = Math.floor(sector) % 6;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((sector % 2) - 1));
  const m = lNorm - c / 2;

  let rNorm = 0, gNorm = 0, bNorm = 0;

  switch (sectorIndex) {
    case 0: rNorm = c; gNorm = x; bNorm = 0; break;
    case 1: rNorm = x; gNorm = c; bNorm = 0; break;
    case 2: rNorm = 0; gNorm = c; bNorm = x; break;
    case 3: rNorm = 0; gNorm = x; bNorm = c; break;
    case 4: rNorm = x; gNorm = 0; bNorm = c; break;
    case 5: rNorm = c; gNorm = 0; bNorm = x; break;
  }

  return {
    r: clamp((rNorm + m) * 255),
    g: clamp((gNorm + m) * 255),
    b: clamp((bNorm + m) * 255)
  };
}

// ============================================================
// HSV ↔ HSL
// ============================================================

/**
 * HSV → HSL 转换
 * @param {number} h 色相 0-360
 * @param {number} s 饱和度 0-100
 * @param {number} v 明度 0-100
 * @returns {{h: number, s: number, l: number}}
 */
export function hsvToHsl(h, s, v) {
  const sNorm = s / 100;
  const vNorm = v / 100;

  const l = vNorm * (2 - sNorm) / 2;
  let sOut = 0;

  if (l !== 0 && l !== 1) {
    sOut = (vNorm * sNorm) / (1 - Math.abs(2 * l - 1));
  }

  return {
    h: Math.round(h * 100) / 100,
    s: Math.round(Math.min(sOut, 1) * 10000) / 100,
    l: Math.round(l * 10000) / 100
  };
}

/**
 * HSL → HSV 转换
 * @param {number} h 色相 0-360
 * @param {number} s 饱和度 0-100
 * @param {number} l 亮度 0-100
 * @returns {{h: number, s: number, v: number}}
 */
export function hslToHsv(h, s, l) {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const v = lNorm + sNorm * Math.min(lNorm, 1 - lNorm);
  let sOut = 0;

  if (v !== 0) {
    sOut = 2 * (v - lNorm) / v;
  }

  return {
    h: Math.round(h * 100) / 100,
    s: Math.round(Math.min(sOut, 1) * 10000) / 100,
    v: Math.round(v * 10000) / 100
  };
}

// ============================================================
// RGB ↔ HEX
// ============================================================

/**
 * RGB → HEX 转换
 * 输出大写 6 位 HEX，如 "#FF5733"
 * @param {number} r 红 0-255
 * @param {number} g 绿 0-255
 * @param {number} b 蓝 0-255
 * @returns {string}
 */
export function rgbToHex(r, g, b) {
  const toHex = (n) => clamp(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * HEX → RGB 转换
 * 支持 6 位 (#RRGGBB) 和 3 位 (#RGB) 简写
 * @param {string} hex HEX 颜色字符串
 * @returns {{r: number, g: number, b: number}}
 */
export function hexToRgb(hex) {
  let cleanHex = hex.replace(/^#/, '');

  // 处理 3 位简写
  if (cleanHex.length === 3) {
    cleanHex = cleanHex[0] + cleanHex[0] +
               cleanHex[1] + cleanHex[1] +
               cleanHex[2] + cleanHex[2];
  }

  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16)
  };
}
