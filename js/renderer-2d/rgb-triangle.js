import { Renderer2DBase } from './base.js';
import { setColor, subscribe, getState } from '../state.js';

export class RGBTriangle extends Renderer2DBase {
    constructor(containerId) {
        super(containerId);
        
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: true });
        
        this.selX = null;
        this.selY = null;
        this.isDragging = false;
        
        this._unsubscribe = subscribe('color-change', () => {
            const state = getState();
            if (state.mode !== '2d' || state.space !== 'rgb') return;
            this.updateSelectionFromColor(state.color.r, state.color.g, state.color.b);
            this.render();
        });

        this.bindPointerEvents(
            this.onPointerDown.bind(this),
            this.onPointerMove.bind(this),
            this.onPointerUp.bind(this)
        );

        const state = getState();
        this.updateSelectionFromColor(state.color.r, state.color.g, state.color.b);
    }

    getGeometry() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        const cx = w / 2;
        const cy = h / 2;
        const size = Math.min(w, h) * 0.48;
        
        const cos30 = Math.cos(Math.PI / 6);
        const sin30 = Math.sin(Math.PI / 6);
        
        const A = { x: cx, y: cy - size };
        const B = { x: cx - size * cos30, y: cy + size * sin30 };
        const C = { x: cx + size * cos30, y: cy + size * sin30 };
        
        return { A, B, C, cx, cy, size, w, h };
    }

    getBarycentric(x, y, geom) {
        const { A, B, C } = geom || this.getGeometry();
        const denominator = (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);
        const u = ((B.y - C.y) * (x - C.x) + (C.x - B.x) * (y - C.y)) / denominator;
        const v = ((C.y - A.y) * (x - C.x) + (A.x - C.x) * (y - C.y)) / denominator;
        const w = 1 - u - v;
        return { u, v, w };
    }

    isInside(x, y) {
        const { u, v, w } = this.getBarycentric(x, y);
        const eps = 1e-6;
        return u >= -eps && v >= -eps && w >= -eps;
    }

    updateSelectionFromColor(r, g, b) {
        const sum = r + g + b;
        if (sum === 0) {
            this.selX = this.getGeometry().cx;
            this.selY = this.getGeometry().cy;
            return;
        }
        
        const u = r / sum;
        const v = g / sum;
        const w = b / sum;

        const { A, B, C } = this.getGeometry();
        this.selX = A.x * u + B.x * v + C.x * w;
        this.selY = A.y * u + B.y * v + C.y * w;
    }

    updateCache() {
        const dpr = window.devicePixelRatio || 1;
        const pw = this.canvas.width;
        const ph = this.canvas.height;
        
        this.offscreenCanvas.width = pw;
        this.offscreenCanvas.height = ph;

        const geom = this.getGeometry();
        const pGeom = {
            A: { x: geom.A.x * dpr, y: geom.A.y * dpr },
            B: { x: geom.B.x * dpr, y: geom.B.y * dpr },
            C: { x: geom.C.x * dpr, y: geom.C.y * dpr }
        };

        const imageData = this.offscreenCtx.createImageData(pw, ph);
        const data = imageData.data;

        for (let y = 0; y < ph; y++) {
            for (let x = 0; x < pw; x++) {
                const { u, v, w } = this.getBarycentric(x, y, pGeom);
                if (u >= 0 && v >= 0 && w >= 0) {
                    const idx = (y * pw + x) * 4;
                    const m = Math.max(u, v, w);
                    if (m > 0) {
                        data[idx] = (u / m) * 255;
                        data[idx + 1] = (v / m) * 255;
                        data[idx + 2] = (w / m) * 255;
                        data[idx + 3] = 255;
                    }
                }
            }
        }
        
        this.offscreenCtx.putImageData(imageData, 0, 0);
    }

    render() {
        const pw = this.canvas.width;
        const ph = this.canvas.height;
        
        if (this.offscreenCanvas.width !== pw || this.offscreenCanvas.height !== ph) {
            this.updateCache();
        }

        this.clear();

        const w = this.container.clientWidth;
        const h = this.container.clientHeight;

        this.ctx.drawImage(this.offscreenCanvas, 0, 0, w, h);

        if (this.selX !== null && this.selY !== null) {
            this.ctx.beginPath();
            this.ctx.arc(this.selX, this.selY, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fill();
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = '#000000';
            this.ctx.stroke();
        }
    }

    onPointerDown(pos, evt) {
        const state = getState();
        if (state.mode !== '2d' || state.space !== 'rgb') return;
        if (this.isInside(pos.x, pos.y)) {
            this.isDragging = true;
            this.handleInput(pos.x, pos.y);
        }
    }

    onPointerMove(pos, evt) {
        const state = getState();
        if (state.mode !== '2d' || state.space !== 'rgb') return;
        if (this.isDragging && this.isInside(pos.x, pos.y)) {
            this.handleInput(pos.x, pos.y);
        }
    }

    onPointerUp(pos, evt) {
        this.isDragging = false;
    }

    handleInput(x, y) {
        const { u, v, w } = this.getBarycentric(x, y);
        this.selX = x;
        this.selY = y;
        
        const state = getState();
        const oldMax = Math.max(state.color.r, state.color.g, state.color.b);
        const val = oldMax > 0 ? oldMax : 255;

        const m = Math.max(u, v, w);
        let r = 0, g = 0, b = 0;
        
        if (m > 0) {
            r = Math.round((u / m) * val);
            g = Math.round((v / m) * val);
            b = Math.round((w / m) * val);
        }
        
        const clamp = (val) => Math.max(0, Math.min(255, val));
        
        setColor({ 
            r: clamp(r), 
            g: clamp(g), 
            b: clamp(b) 
        });
    }

    destroy() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
        super.destroy();
    }
}
