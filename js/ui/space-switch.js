/**
 * 色彩空间切换模块（RGB / HSV / HSL）
 *
 * 控制色彩空间切换，高亮当前选中的空间按钮
 * 点击按钮 → setSpace() → 触发 'space-change' 事件 → 同步 UI
 */

import { subscribe, getState, setSpace } from '../state.js';

export class SpaceSwitch {
  constructor() {
    this._btns = {
      rgb: document.getElementById('btn-rgb'),
      hsv: document.getElementById('btn-hsv'),
      hsl: document.getElementById('btn-hsl')
    };
    this._initialized = false;
  }

  /**
   * 初始化：绑定事件 + 订阅状态变更 + 首次同步
   */
  init() {
    if (this._initialized) return;
    this._initialized = true;

    this._btns.rgb.addEventListener('click', () => setSpace('rgb'));
    this._btns.hsv.addEventListener('click', () => setSpace('hsv'));
    this._btns.hsl.addEventListener('click', () => setSpace('hsl'));

    subscribe('space-change', () => this._sync());

    this._sync();
  }

  _sync() {
    const state = getState();
    const activeSpace = state.space;

    for (const [space, btn] of Object.entries(this._btns)) {
      btn.classList.toggle('active', space === activeSpace);
    }
  }
}
