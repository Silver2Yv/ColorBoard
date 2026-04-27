/**
 * 颜色值显示模块
 *
 * 实时显示当前颜色的 HEX / RGB / HSV / HSL 值以及色块预览
 * 订阅 'color-change' 事件，从 state 读取颜色数据并刷新 DOM
 */

import { subscribe, getState } from '../state.js';
import { rgbToHex } from '../color-space/converter.js';

export class ColorDisplay {
  constructor() {
    this._preview = document.getElementById('color-preview');
    this._hexEl = document.getElementById('val-hex');
    this._rgbEl = document.getElementById('val-rgb');
    this._hsvEl = document.getElementById('val-hsv');
    this._hslEl = document.getElementById('val-hsl');
    this._initialized = false;
  }

  /**
   * 初始化：订阅颜色变更事件 + 首次刷新
   */
  init() {
    if (this._initialized) return;
    this._initialized = true;

    subscribe('color-change', () => this._update());

    this._update();
  }

  _update() {
    const state = getState();
    const c = state.color;

    this._preview.style.backgroundColor = c.hex || rgbToHex(c.r, c.g, c.b);

    this._hexEl.textContent = c.hex || rgbToHex(c.r, c.g, c.b);
    this._rgbEl.textContent = `${c.r}, ${c.g}, ${c.b}`;
    this._hsvEl.textContent = `${c.h}°, ${c.s}%, ${c.v}%`;
    this._hslEl.textContent = `${c.h}°, ${c.s}%, ${c.l}%`;
  }
}
