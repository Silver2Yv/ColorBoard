import { CrossSectionRendererBase } from './base.js';
import { hsvToRgb } from '../color-space/converter.js';
import * as state from '../state.js';

const RENDER_SIZE = 256;

/**
 * HSV 剖面 2D 渲染器
 * 负责绘制 HSV 颜色空间的二维切片
 */
export class HSVSectionRenderer extends CrossSectionRendererBase {
    /**
     * @param {string} containerId - 容器元素的 ID
     */
    constructor(containerId) {
        super(containerId);

        this._offscreenCanvas = document.createElement('canvas');
        this._offscreenCtx = this._offscreenCanvas.getContext('2d', { alpha: false });
        this._cachedAxis = null;
        this._cachedValue = null;

        this._bindEvents();
    }

    _bindEvents() {
        const handlePointer = (pos) => {
            if (!this._lastRenderArgs) return;
            const { lockedAxis, lockedValue } = this._lastRenderArgs;
            
            const cw = this.container.clientWidth;
            const ch = this.container.clientHeight;
            
            if (cw === 0 || ch === 0) return;

            const nx = Math.max(0, Math.min(1, pos.x / cw));
            const ny = Math.max(0, Math.min(1, 1 - (pos.y / ch)));

            let h = 0, s = 0, v = 0;
            if (lockedAxis === 'h') {
                h = lockedValue;
                s = nx * 100;
                v = ny * 100;
            } else if (lockedAxis === 's') {
                s = lockedValue;
                h = nx * 360;
                v = ny * 100;
            } else if (lockedAxis === 'v') {
                v = lockedValue;
                h = nx * 360;
                s = ny * 100;
            }
            
            state.setColor({ h, s, v });
        };
        
        this.bindPointerEvents(handlePointer, handlePointer);
    }

    /**
     * 更新离屏缓存
     * @param {string} lockedAxis
     * @param {number} lockedValue
     */
    _updateCache(lockedAxis, lockedValue) {
        this._offscreenCanvas.width = RENDER_SIZE;
        this._offscreenCanvas.height = RENDER_SIZE;

        const imageData = this._offscreenCtx.createImageData(RENDER_SIZE, RENDER_SIZE);
        const data = imageData.data;

        for (let y = 0; y < RENDER_SIZE; y++) {
            const ny = 1 - (y / (RENDER_SIZE - 1));

            for (let x = 0; x < RENDER_SIZE; x++) {
                const nx = x / (RENDER_SIZE - 1);

                let h = 0, s = 0, v = 0;
                if (lockedAxis === 'h') {
                    h = lockedValue;
                    s = nx * 100;
                    v = ny * 100;
                } else if (lockedAxis === 's') {
                    s = lockedValue;
                    h = nx * 360;
                    v = ny * 100;
                } else if (lockedAxis === 'v') {
                    v = lockedValue;
                    h = nx * 360;
                    s = ny * 100;
                }

                const rgb = hsvToRgb(h, s, v);

                const index = (y * RENDER_SIZE + x) * 4;
                data[index] = rgb.r;
                data[index + 1] = rgb.g;
                data[index + 2] = rgb.b;
                data[index + 3] = 255;
            }
        }

        this._offscreenCtx.putImageData(imageData, 0, 0);

        this._cachedAxis = lockedAxis;
        this._cachedValue = lockedValue;
    }
    
    /**
     * 剖面渲染实现
     * @param {string} lockedAxis 
     * @param {number} lockedValue 
     * @param {string} space 
     */
    renderCrossSection(lockedAxis, lockedValue, space) {
        if (space !== 'hsv') return;
        this._lastRenderArgs = { lockedAxis, lockedValue };

        const safeValue = Math.round(lockedValue);

        if (this._cachedAxis !== lockedAxis || this._cachedValue !== safeValue) {
            this._updateCache(lockedAxis, safeValue);
        }

        this.clear();

        const cw = this.container.clientWidth;
        const ch = this.container.clientHeight;

        this.ctx.drawImage(this._offscreenCanvas, 0, 0, RENDER_SIZE, RENDER_SIZE, 0, 0, cw, ch);
        
        const currentState = state.getState();
        const currentColor = currentState.color;

        let markerX = 0, markerY = 0;

        if (lockedAxis === 'h') {
            markerX = (currentColor.s / 100) * cw;
            markerY = (1 - (currentColor.v / 100)) * ch;
        } else if (lockedAxis === 's') {
            markerX = (currentColor.h / 360) * cw;
            markerY = (1 - (currentColor.v / 100)) * ch;
        } else if (lockedAxis === 'v') {
            markerX = (currentColor.h / 360) * cw;
            markerY = (1 - (currentColor.s / 100)) * ch;
        }
        
        this.drawMarker(markerX, markerY);
    }
}
