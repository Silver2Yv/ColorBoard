import { getState } from '../state.js';

/**
 * 2D 渲染器基类
 *
 * 职责：
 * - Canvas 初始化与 devicePixelRatio 缩放
 * - Pointer Events 统一绑定（鼠标 + 触摸）
 * - 坐标转换（事件坐标 → Canvas 局部坐标）
 * - 生命周期管理（destroy 释放资源）
 *
 * 子类必须实现：
 * - render()     — 绘制内容
 * - isInside(x, y) — 判断坐标是否在交互区域内
 */
export class Renderer2DBase {
    /**
     * @param {string} containerId - 容器元素的 ID
     */
    constructor(containerId) {
        /** @type {HTMLElement} */
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container #${containerId} not found`);
        }

        // 使用容器中已有的 canvas，或创建新的
        /** @type {HTMLCanvasElement} */
        this.canvas = this.container.querySelector('canvas')
            || document.createElement('canvas');
        if (!this.container.contains(this.canvas)) {
            this.container.appendChild(this.canvas);
        }

        /** @type {CanvasRenderingContext2D} */
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        // 事件处理函数引用（供 destroy 移除用）
        this._onPointerDown = null;
        this._onPointerMove = null;
        this._onPointerUp = null;
        this._pointerBound = false;

        // 观察容器尺寸变化自动调整 canvas
        this._resizeObserver = new ResizeObserver(() => this.resize());
        this._resizeObserver.observe(this.container);

        // 初始尺寸设置
        this._updateSize();
    }

    /**
     * 设置 canvas 尺寸，适配 devicePixelRatio
     * @private
     */
    _updateSize() {
        const dpr = window.devicePixelRatio || 1;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;

        // 物理像素缓冲
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        // CSS 逻辑像素显示
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';

        // 统一缩放上下文，后续绘图使用逻辑像素
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /**
     * 容器尺寸变化时手动调整（ResizeObserver 自动调用，窗口 resize 可由外部触发）
     */
    resize() {
        this._updateSize();
        const state = getState();
        // 仅在 2D 模式下且渲染器匹配当前色彩空间时才重绘
        if (state.mode === '2d') {
            if (this.hasOwnProperty('space') && this.space !== state.space) {
                return;
            }
            if (this.constructor.name === 'RGBTriangle' && state.space !== 'rgb') {
                return;
            }
            this.render();
        }
    }

    /**
     * 绑定 Pointer Events
     *
     * @param {Function} onDown - (pos: {x, y}, evt: PointerEvent) => void
     * @param {Function} onMove - (pos: {x, y}, evt: PointerEvent) => void
     * @param {Function} onUp   - (pos: {x, y}, evt: PointerEvent) => void
     */
    bindPointerEvents(onDown, onMove, onUp) {
        this.unbindPointerEvents();

        this._onPointerDown = (evt) => {
            this.canvas.setPointerCapture(evt.pointerId);
            onDown(this.getPointerPos(evt), evt);
        };
        this._onPointerMove = (evt) => {
            onMove(this.getPointerPos(evt), evt);
        };
        this._onPointerUp = (evt) => {
            onUp(this.getPointerPos(evt), evt);
        };

        this.canvas.addEventListener('pointerdown', this._onPointerDown);
        this.canvas.addEventListener('pointermove', this._onPointerMove);
        this.canvas.addEventListener('pointerup', this._onPointerUp);
        this._pointerBound = true;
    }

    /**
     * 解绑 Pointer Events
     */
    unbindPointerEvents() {
        if (!this._pointerBound) return;
        this.canvas.removeEventListener('pointerdown', this._onPointerDown);
        this.canvas.removeEventListener('pointermove', this._onPointerMove);
        this.canvas.removeEventListener('pointerup', this._onPointerUp);
        this._onPointerDown = null;
        this._onPointerMove = null;
        this._onPointerUp = null;
        this._pointerBound = false;
    }

    /**
     * 将 PointerEvent 坐标转换为 Canvas 局部坐标（CSS 逻辑像素）
     *
     * @param {PointerEvent} evt
     * @returns {{x: number, y: number}}
     */
    getPointerPos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    /**
     * 清空画布（填充为黑色透明，因 alpha: false 实际为白色背景）
     */
    clear() {
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.width / dpr;
        const h = this.canvas.height / dpr;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, w, h);
    }

    /**
     * 渲染内容 — 子类必须实现
     * @abstract
     */
    render() {
        throw new Error('子类必须实现 render() 方法');
    }

    /**
     * 判断坐标是否在交互区域内 — 子类必须实现
     *
     * @param {number} x - CSS 逻辑像素 X
     * @param {number} y - CSS 逻辑像素 Y
     * @returns {boolean}
     * @abstract
     */
    isInside(x, y) {
        throw new Error('子类必须实现 isInside() 方法');
    }

    /**
     * 销毁实例，释放所有资源
     */
    destroy() {
        this.unbindPointerEvents();

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        this.ctx = null;
        this.canvas = null;
        this.container = null;
    }
}
