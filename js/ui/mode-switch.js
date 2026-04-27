/**
 * 模式切换模块（2D / 3D）
 *
 * 控制渲染模式切换，管理对应 canvas 容器的可见性
 * 点击按钮 → setMode() → 触发 'mode-change' 事件 → 同步 UI
 */

import { subscribe, getState, setMode } from '../state.js';

export class ModeSwitch {
  constructor() {
    this._btn2d = document.getElementById('btn-2d');
    this._btn3d = document.getElementById('btn-3d');
    this._canvas2d = document.getElementById('canvas-2d');
    this._canvas3d = document.getElementById('canvas-3d');
    this._initialized = false;
  }

  /**
   * 初始化：绑定事件 + 订阅状态变更 + 首次同步
   */
  init() {
    if (this._initialized) return;
    this._initialized = true;

    this._btn2d.addEventListener('click', () => setMode('2d'));
    this._btn3d.addEventListener('click', () => setMode('3d'));

    subscribe('mode-change', () => this._sync());

    this._sync();
  }

  _sync() {
    const state = getState();
    const is2d = state.mode === '2d';

    this._btn2d.classList.toggle('active', is2d);
    this._btn3d.classList.toggle('active', !is2d);
    this._canvas2d.classList.toggle('hidden', !is2d);
    this._canvas3d.classList.toggle('hidden', is2d);
  }
}
