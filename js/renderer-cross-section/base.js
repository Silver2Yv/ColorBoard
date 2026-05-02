/**
 * 剖面 2D 渲染器基类
 *
 * 职责：
 * - 创建并挂载 canvas
 * - 监听容器尺寸变化并适配 devicePixelRatio
 * - 统一 Pointer Events 绑定
 * - 提供局部坐标转换、清空画布与选中标记绘制
 *
 * 子类必须实现：
 * - renderCrossSection(lockedAxis, lockedValue, space)
 */
export class CrossSectionRendererBase {
    /**
     * @param {string} containerId - 容器元素的 ID
     */
    constructor(containerId) {
        /** @type {HTMLElement} */
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container #${containerId} not found`);
        }

        /** @type {HTMLCanvasElement} */
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);

        /** @type {CanvasRenderingContext2D} */
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        this._resizeObserver = new ResizeObserver(() => this.resize());
        this._resizeObserver.observe(this.container);

        this._pointerDown = false;
        this._onPointerDown = null;
        this._onPointerMove = null;
        this._onPointerUp = null;
        this._onPointerCancel = null;

        this._lastRenderArgs = null;

        this.resize();
    }

    /**
     * 根据容器尺寸调整 canvas 尺寸
     * 实际像素上限 256×256，通过 CSS 放大填满容器
     */
    resize() {
        if (!this.container || !this.canvas || !this.ctx) {
            return;
        }

        const MAX_PIXELS = 256;
        const cw = this.container.clientWidth;
        const ch = this.container.clientHeight;

        // 限制 Canvas 物理像素尺寸为 256×256 上限
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.min(Math.round(cw * dpr), MAX_PIXELS);
        this.canvas.height = Math.min(Math.round(ch * dpr), MAX_PIXELS);

        // CSS 放大填满容器
        this.canvas.style.width = `${cw}px`;
        this.canvas.style.height = `${ch}px`;

        // 坐标变换：CSS 逻辑像素 → Canvas 物理像素
        const sx = cw > 0 ? this.canvas.width / cw : 1;
        const sy = ch > 0 ? this.canvas.height / ch : 1;
        this.ctx.setTransform(sx, 0, 0, sy, 0, 0);
    }

    /**
     * 绑定 pointerdown / pointermove，用于点击和拖拽选色
     *
     * @param {Function} onDown - (pos: {x, y}, evt: PointerEvent) => void
     * @param {Function} onMove - (pos: {x, y}, evt: PointerEvent) => void
     */
    bindPointerEvents(onDown, onMove) {
        this.unbindPointerEvents();

        this._onPointerDown = (evt) => {
            this._pointerDown = true;
            this.canvas.setPointerCapture(evt.pointerId);
            onDown(this.getPointerPos(evt), evt);
        };

        this._onPointerMove = (evt) => {
            if (!this._pointerDown) {
                return;
            }
            onMove(this.getPointerPos(evt), evt);
        };

        this._onPointerUp = (evt) => {
            this._pointerDown = false;
            if (this.canvas.hasPointerCapture(evt.pointerId)) {
                this.canvas.releasePointerCapture(evt.pointerId);
            }
        };

        this._onPointerCancel = () => {
            this._pointerDown = false;
        };

        this.canvas.addEventListener('pointerdown', this._onPointerDown);
        this.canvas.addEventListener('pointermove', this._onPointerMove);
        this.canvas.addEventListener('pointerup', this._onPointerUp);
        this.canvas.addEventListener('pointercancel', this._onPointerCancel);
    }

    /**
     * 解绑 Pointer Events
     */
    unbindPointerEvents() {
        if (!this.canvas) {
            return;
        }

        if (this._onPointerDown) {
            this.canvas.removeEventListener('pointerdown', this._onPointerDown);
        }
        if (this._onPointerMove) {
            this.canvas.removeEventListener('pointermove', this._onPointerMove);
        }
        if (this._onPointerUp) {
            this.canvas.removeEventListener('pointerup', this._onPointerUp);
        }
        if (this._onPointerCancel) {
            this.canvas.removeEventListener('pointercancel', this._onPointerCancel);
        }

        this._onPointerDown = null;
        this._onPointerMove = null;
        this._onPointerUp = null;
        this._onPointerCancel = null;
        this._pointerDown = false;
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
     * 清空画布
     */
    clear() {
        if (!this.ctx || !this.canvas || !this.container) {
            return;
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.container.clientWidth, this.container.clientHeight);
    }

    /**
     * 绘制白色圆点 + 黑边的选中标记
     *
     * @param {number} x - CSS 逻辑像素 X
     * @param {number} y - CSS 逻辑像素 Y
     */
    drawMarker(x, y) {
        if (!this.ctx) {
            return;
        }

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#000000';
        this.ctx.stroke();
        this.ctx.restore();
    }

    /**
     * 剖面渲染入口 — 子类必须实现
     *
     * @param {string} lockedAxis
     * @param {number} lockedValue
     * @param {string} space
     * @abstract
     */
    renderCrossSection(lockedAxis, lockedValue, space) {
        throw new Error('子类必须实现 renderCrossSection() 方法');
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
        this._lastRenderArgs = null;
    }
}
