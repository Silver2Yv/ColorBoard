import { Renderer2DBase } from './base.js';
import { getState, setColor, subscribe } from '../state.js';

/**
 * RectSlider (HSV/HSL 模式的 2D 取色器)
 * 左侧主矩形: X=Hue, Y=Saturation
 * 右侧垂直滑块: V 或 L
 */
export class RectSlider extends Renderer2DBase {
    /**
     * @param {string} containerId
     * @param {'hsv'|'hsl'} space
     */
    constructor(containerId, space) {
        super(containerId);
        this.space = space;

        this._cachedV = -1;
        this._cachedL = -1;
        this._cachedWidth = -1;
        this._cachedHeight = -1;

        this.offscreenCanvas = document.createElement('canvas');
        /** @type {CanvasRenderingContext2D} */
        this.offCtx = this.offscreenCanvas.getContext('2d', { alpha: false });

        this._draggingArea = null;

        this.unsubscribe = subscribe('color-change', () => this.render());

        this.bindPointerEvents(
            this.onPointerDown.bind(this),
            this.onPointerMove.bind(this),
            this.onPointerUp.bind(this)
        );
    }

    _getLayout() {
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.width / dpr;
        const h = this.canvas.height / dpr;
        
        const rectW = w - 40;
        const sliderX = w - 35;
        const sliderW = 30;

        return { w, h, rectW, sliderX, sliderW, dpr };
    }

    /**
     * The hue/saturation square draws a linear RGB gradient per hue column.
     * Math note: In HSV space, varying Saturation from 100 to 0 (top to bottom) is a linear interpolation in RGB space.
     * Canvas createLinearGradient naturally interpolates in RGB space, so drawing a gradient from S=100 to S=0 perfectly matches HSV.
     * We convert the top (S=100) and bottom (S=0) HSV values to HSL natively supported by canvas.
     */
    _updateOffscreen(rectW, h, color, dpr) {
        const physW = Math.round(rectW * dpr);
        const physH = Math.round(h * dpr);
        
        this.offscreenCanvas.width = physW;
        this.offscreenCanvas.height = physH;

        for (let x = 0; x < physW; x++) {
            const hue = (x / Math.max(1, physW - 1)) * 360;
            const grad = this.offCtx.createLinearGradient(0, 0, 0, physH);

            if (this.space === 'hsv') {
                grad.addColorStop(0, `hsl(${hue}, 100%, ${color.v / 2}%)`);
                grad.addColorStop(1, `hsl(${hue}, 0%, ${color.v}%)`);
            } else {
                grad.addColorStop(0, `hsl(${hue}, 100%, ${color.l}%)`);
                grad.addColorStop(1, `hsl(${hue}, 0%, ${color.l}%)`);
            }

            this.offCtx.fillStyle = grad;
            this.offCtx.fillRect(x, 0, 1.5, physH);
        }
    }

    render() {
        const { w, h, rectW, sliderX, sliderW, dpr } = this._getLayout();
        const state = getState();
        const color = state.color;

        const needsRedraw = 
            this._cachedWidth !== w ||
            this._cachedHeight !== h ||
            (this.space === 'hsv' && this._cachedV !== color.v) ||
            (this.space === 'hsl' && this._cachedL !== color.l);

        if (needsRedraw) {
            this._updateOffscreen(rectW, h, color, dpr);
            this._cachedWidth = w;
            this._cachedHeight = h;
            this._cachedV = color.v;
            this._cachedL = color.l;
        }

        this.clear();
        this.ctx.drawImage(this.offscreenCanvas, 0, 0, rectW, h);

        const sliderGrad = this.ctx.createLinearGradient(0, h, 0, 0);

        if (this.space === 'hsv') {
            sliderGrad.addColorStop(0, `hsl(0, 0%, 0%)`);
            sliderGrad.addColorStop(1, `hsl(${color.h}, 100%, ${100 - color.s / 2}%)`);
        } else {
            sliderGrad.addColorStop(0, `hsl(${color.h}, ${color.s}%, 0%)`);
            sliderGrad.addColorStop(0.5, `hsl(${color.h}, ${color.s}%, 50%)`);
            sliderGrad.addColorStop(1, `hsl(${color.h}, ${color.s}%, 100%)`);
        }

        this.ctx.fillStyle = sliderGrad;
        this.ctx.fillRect(sliderX, 0, sliderW, h);

        this.ctx.strokeStyle = 'white';
        
        const cx = (color.h / 360) * rectW;
        const cy = (1 - color.s / 100) * h;
        
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, cy);
        this.ctx.lineTo(rectW, cy);
        this.ctx.moveTo(cx, 0);
        this.ctx.lineTo(cx, h);
        this.ctx.stroke();

        const val = this.space === 'hsv' ? color.v : color.l;
        const sy = (1 - val / 100) * h;
        
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(sliderX, sy);
        this.ctx.lineTo(sliderX + sliderW, sy);
        this.ctx.stroke();
    }

    isInside(x, y) {
        const { h, rectW, sliderX, sliderW } = this._getLayout();
        
        if (y < 0 || y > h) return false;
        if (x >= 0 && x <= rectW) return true;
        if (x >= sliderX && x <= sliderX + sliderW) return true;
        
        return false;
    }

    onPointerDown(pos, evt) {
        const { rectW, sliderX } = this._getLayout();
        
        if (pos.x <= rectW + 5) {
            this._draggingArea = 'rect';
        } else if (pos.x >= sliderX - 5) {
            this._draggingArea = 'slider';
        } else {
            this._draggingArea = null;
        }

        if (this._draggingArea) {
            this.onPointerMove(pos, evt);
        }
    }

    onPointerMove(pos, evt) {
        if (!this._draggingArea) return;

        const { h, rectW } = this._getLayout();
        const color = getState().color;

        if (this._draggingArea === 'rect') {
            const x = Math.max(0, Math.min(pos.x, rectW));
            const y = Math.max(0, Math.min(pos.y, h));
            
            const hue = (x / rectW) * 360;
            const sat = (1 - y / h) * 100;
            
            if (this.space === 'hsv') {
                setColor({ h: hue, s: sat, v: color.v });
            } else {
                setColor({ h: hue, s: sat, l: color.l });
            }
        } else if (this._draggingArea === 'slider') {
            const y = Math.max(0, Math.min(pos.y, h));
            const val = (1 - y / h) * 100;
            
            if (this.space === 'hsv') {
                setColor({ h: color.h, s: color.s, v: val });
            } else {
                setColor({ h: color.h, s: color.s, l: val });
            }
        }
    }

    onPointerUp(pos, evt) {
        this._draggingArea = null;
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        
        if (this.offscreenCanvas) {
            this.offscreenCanvas.width = 0;
            this.offscreenCanvas.height = 0;
            this.offscreenCanvas = null;
        }
        this.offCtx = null;
        
        super.destroy();
    }
}
