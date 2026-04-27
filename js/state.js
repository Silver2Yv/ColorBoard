/**
 * 单源状态管理模块 + 自定义事件总线
 *
 * 管理应用全局状态：颜色值、渲染模式、色彩空间
 * 通过闭包保护内部状态，对外暴露 getState 返回深拷贝
 *
 * ===== 导出的 API =====
 * - setColor(input)   — 从 RGB / HSV / HSL 更新颜色，自动同步所有空间
 * - setMode(mode)     — 切换 '2d' / '3d' 渲染模式
 * - setSpace(space)   — 切换 'rgb' / 'hsv' / 'hsl' 色彩空间
 * - subscribe(event, callback) — 订阅事件，返回 unsubscribe 函数
 * - getState()        — 返回状态深拷贝
 *
 * ===== 事件 =====
 * - 'color-change'  — setColor 触发
 * - 'mode-change'   — setMode 触发
 * - 'space-change'  — setSpace 触发
 */

import {
  rgbToHsv, hsvToRgb,
  rgbToHsl, hslToRgb,
  hsvToHsl, hslToHsv,
  rgbToHex
} from './color-space/converter.js';

// ============================================================
// 内部状态（闭包保护，外部不可直接访问）
// ============================================================
const _state = {
  color: { r: 0, g: 0, b: 0, h: 0, s: 0, v: 0, l: 0, hex: '#000000' },
  mode: '2d',
  space: 'rgb',
  ui: {
    selected2D: { x: 0, y: 0 },
    selected3D: { x: 0, y: 0, z: 0 }
  }
};

// ============================================================
// 事件总线
// ============================================================
const _listeners = {
  'color-change': [],
  'mode-change': [],
  'space-change': []
};

function emit(eventName) {
  const cbs = _listeners[eventName];
  if (cbs) {
    for (let i = 0; i < cbs.length; i++) {
      cbs[i]();
    }
  }
}

// ============================================================
// 工具函数
// ============================================================

function roundInt(v) {
  return Math.round(v);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================
// 初始化：默认颜色 #FF5733（r=255, g=87, b=51）
// 计算对应的 HSV / HSL / HEX 并写入状态
// ============================================================
function initDefault() {
  const r = 255, g = 87, b = 51;
  const hsv = rgbToHsv(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  _state.color.r = r;
  _state.color.g = g;
  _state.color.b = b;
  _state.color.h = roundInt(hsv.h);
  _state.color.s = roundInt(hsv.s);
  _state.color.v = roundInt(hsv.v);
  _state.color.l = roundInt(hsl.l);
  _state.color.hex = '#FF5733';
}

initDefault();

// ============================================================
// setColor：从任意颜色空间更新颜色
//
// 始终以 RGB 为中间桥梁，确保所有空间的值同步一致：
//   输入空间 → RGB → 所有其他空间
// ============================================================

/**
 * @param {{r?:number,g?:number,b?:number} | {h?:number,s?:number,v?:number} | {h?:number,s?:number,l?:number}} input
 */
function setColor(input) {
  let r, g, b;

  if ('r' in input) {
    // ── RGB 输入 ──
    r = roundInt(input.r);
    g = roundInt(input.g);
    b = roundInt(input.b);
    const hsv = rgbToHsv(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    _state.color.r = r;
    _state.color.g = g;
    _state.color.b = b;
    _state.color.h = roundInt(hsv.h);
    _state.color.s = roundInt(hsv.s);
    _state.color.v = roundInt(hsv.v);
    _state.color.l = roundInt(hsl.l);
    _state.color.hex = rgbToHex(r, g, b);

  } else if ('v' in input) {
    // ── HSV 输入：hsvToRgb → rgbToHsl ──
    const h = roundInt(input.h);
    const s = roundInt(input.s);
    const v = roundInt(input.v);
    const rgb = hsvToRgb(h, s, v);
    const hsl = hsvToHsl(h, s, v);
    r = rgb.r; g = rgb.g; b = rgb.b;
    _state.color.r = r;
    _state.color.g = g;
    _state.color.b = b;
    _state.color.h = h;
    _state.color.s = s;
    _state.color.v = v;
    _state.color.l = roundInt(hsl.l);
    _state.color.hex = rgbToHex(r, g, b);

  } else if ('l' in input) {
    // ── HSL 输入：hslToRgb → rgbToHsv ──
    const h = roundInt(input.h);
    const s = roundInt(input.s);
    const l = roundInt(input.l);
    const rgb = hslToRgb(h, s, l);
    const hsv = hslToHsv(h, s, l);
    r = rgb.r; g = rgb.g; b = rgb.b;
    _state.color.r = r;
    _state.color.g = g;
    _state.color.b = b;
    _state.color.h = h;
    _state.color.s = roundInt(hsv.s);
    _state.color.v = roundInt(hsv.v);
    _state.color.l = l;
    _state.color.hex = rgbToHex(r, g, b);

  }

  emit('color-change');
}

// ============================================================
// setMode：切换 2D / 3D 渲染模式
// ============================================================

/**
 * @param {'2d'|'3d'} mode
 */
function setMode(mode) {
  if (mode === '2d' || mode === '3d') {
    _state.mode = mode;
    emit('mode-change');
  }
}

// ============================================================
// setSpace：切换色彩空间（影响 UI 控件显示）
// ============================================================

/**
 * @param {'rgb'|'hsv'|'hsl'} space
 */
function setSpace(space) {
  if (space === 'rgb' || space === 'hsv' || space === 'hsl') {
    _state.space = space;
    emit('space-change');
  }
}

// ============================================================
// subscribe：订阅事件
// ============================================================

/**
 * 订阅一个事件
 * @param {string} event - 'color-change' | 'mode-change' | 'space-change'
 * @param {Function} callback
 * @returns {Function} unsubscribe - 调用后取消订阅
 */
function subscribe(event, callback) {
  if (!_listeners[event]) {
    _listeners[event] = [];
  }
  _listeners[event].push(callback);

  // 返回取消订阅函数
  return function unsubscribe() {
    const idx = _listeners[event].indexOf(callback);
    if (idx !== -1) {
      _listeners[event].splice(idx, 1);
    }
  };
}

// ============================================================
// getState：获取状态深拷贝
// ============================================================

/**
 * 返回当前状态的深拷贝（防止外部篡改内部状态）
 * @returns {Object}
 */
function getState() {
  return deepClone(_state);
}

// ============================================================
// 导出公开 API
// ============================================================
export { setColor, setMode, setSpace, subscribe, getState };
