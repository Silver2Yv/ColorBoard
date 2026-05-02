import { CrossSectionRendererBase } from './base.js';
import { setColor, getState } from '../state.js';

export class RGBCrossSection extends CrossSectionRendererBase {
    constructor(containerId) {
        super(containerId);
        
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: false });
        
        this._cachedAxis = null;
        this._cachedValue = null;
        this._cachedWidth = 0;
        this._cachedHeight = 0;
        
        this.bindPointerEvents(
            this.onPointerDown.bind(this),
            this.onPointerMove.bind(this)
        );
    }
    
    updateCache(lockedAxis, lockedValue) {
        const pw = this.canvas.width;
        const ph = this.canvas.height;
        
        if (pw === 0 || ph === 0) return;
        
        this.offscreenCanvas.width = pw;
        this.offscreenCanvas.height = ph;
        
        const imageData = this.offscreenCtx.createImageData(pw, ph);
        const data = imageData.data;
        
        for (let y = 0; y < ph; y++) {
            const normY = ph > 1 ? y / (ph - 1) : 0;
            const valY = Math.round((1 - normY) * 255);
            
            for (let x = 0; x < pw; x++) {
                const normX = pw > 1 ? x / (pw - 1) : 0;
                const valX = Math.round(normX * 255);
                
                let r, g, b;
                if (lockedAxis === 'x') {
                    r = lockedValue;
                    g = valY;
                    b = valX;
                } else if (lockedAxis === 'y') {
                    r = valX;
                    g = lockedValue;
                    b = valY;
                } else {
                    r = valX;
                    g = valY;
                    b = lockedValue;
                }
                
                const idx = (y * pw + x) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }
        
        this.offscreenCtx.putImageData(imageData, 0, 0);
        
        this._cachedAxis = lockedAxis;
        this._cachedValue = lockedValue;
        this._cachedWidth = pw;
        this._cachedHeight = ph;
    }
    
    renderCrossSection(lockedAxis, lockedValue) {
        const pw = this.canvas.width;
        const ph = this.canvas.height;
        
        if (pw === 0 || ph === 0) return;
        
        const safeLockedValue = Math.round(lockedValue);
        
        if (
            this._cachedAxis !== lockedAxis || 
            this._cachedValue !== safeLockedValue || 
            this._cachedWidth !== pw || 
            this._cachedHeight !== ph
        ) {
            this.updateCache(lockedAxis, safeLockedValue);
        }
        
        this.clear();
        
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        
        this.ctx.drawImage(this.offscreenCanvas, 0, 0, w, h);
        
        const state = getState();
        let selValX = 0;
        let selValY = 0;
        
        if (lockedAxis === 'x') {
            selValX = state.color.b;
            selValY = state.color.g;
        } else if (lockedAxis === 'y') {
            selValX = state.color.r;
            selValY = state.color.b;
        } else {
            selValX = state.color.r;
            selValY = state.color.g;
        }
        
        const markerX = (selValX / 255) * w;
        const markerY = (1 - selValY / 255) * h;
        
        this.drawMarker(markerX, markerY);
    }
    
    onPointerDown(pos) {
        this.handleInput(pos);
    }
    
    onPointerMove(pos) {
        this.handleInput(pos);
    }
    
    handleInput(pos) {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        
        if (w === 0 || h === 0) return;
        
        const normX = Math.max(0, Math.min(1, pos.x / w));
        const normY = Math.max(0, Math.min(1, pos.y / h));
        
        const valX = Math.round(normX * 255);
        const valY = Math.round((1 - normY) * 255);
        
        const lockedAxis = this._cachedAxis;
        const lockedValue = this._cachedValue;
        
        if (!lockedAxis) return;
        
        let r, g, b;
        if (lockedAxis === 'x') {
            r = lockedValue;
            g = valY;
            b = valX;
        } else if (lockedAxis === 'y') {
            r = valX;
            g = lockedValue;
            b = valY;
        } else {
            r = valX;
            g = valY;
            b = lockedValue;
        }
        
        setColor({ r, g, b });
    }
}
