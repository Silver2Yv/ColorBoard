import { CrossSectionRendererBase } from './base.js';
import { hslToRgb } from '../color-space/converter.js';
import { setColor, getState } from '../state.js';

/**
 * HSL 色彩空间 2D 剖面渲染器
 */
export class HSLSectionRenderer extends CrossSectionRendererBase {
    /**
     * @param {string} containerId - 容器元素的 ID
     */
    constructor(containerId) {
        super(containerId);
        
        this._lockedAxis = null;
        this._lockedValue = 0;
        this._cachedAxis = null;
        this._cachedValue = null;
        
        // 内部 256x256 canvas 用于像素操作，提升渲染性能
        this._renderSize = 256;
        this._renderCanvas = document.createElement('canvas');
        this._renderCanvas.width = this._renderSize;
        this._renderCanvas.height = this._renderSize;
        this._renderCtx = this._renderCanvas.getContext('2d', { alpha: false });
        this._imageData = this._renderCtx.createImageData(this._renderSize, this._renderSize);
        
        this.bindPointerEvents(
            (pos, evt) => this._handlePointer(pos, evt),
            (pos, evt) => this._handlePointer(pos, evt)
        );
    }

    /**
     * 处理指针事件，计算并更新颜色
     * @param {{x: number, y: number}} pos 
     * @param {PointerEvent} evt 
     */
    _handlePointer(pos, evt) {
        if (!this._lockedAxis) return;
        
        const cw = this.container.clientWidth;
        const ch = this.container.clientHeight;

        const nx = Math.max(0, Math.min(1, pos.x / cw));
        const ny = Math.max(0, Math.min(1, pos.y / ch));
        
        let h = 0, s = 0, l = 0;
        
        if (this._lockedAxis === 'x') {
            // 锁定 H：绘制 S×L 平面 (X=S, Y=L 反向)
            h = this._lockedValue;
            s = nx * 100;
            l = (1 - ny) * 100;
        } else if (this._lockedAxis === 'y') {
            // 锁定 S：绘制 H×L 平面 (X=H, Y=L 反向)
            h = nx * 360;
            s = this._lockedValue;
            l = (1 - ny) * 100;
        } else if (this._lockedAxis === 'z') {
            // 锁定 L：绘制 H×S 平面 (X=H, Y=S 反向)
            h = nx * 360;
            s = (1 - ny) * 100;
            l = this._lockedValue;
        }
        
        setColor({ h, s, l });
    }

    /**
     * 更新离屏像素缓存（仅在 lockedAxis 或 lockedValue 变化时调用）
     */
    _updateCache() {
        const data = this._imageData.data;
        const size = this._renderSize;
        const lockedAxis = this._lockedAxis;
        const lockedValue = this._lockedValue;
        let i = 0;

        for (let y = 0; y < size; y++) {
            const ny = y / (size - 1);
            for (let x = 0; x < size; x++) {
                const nx = x / (size - 1);

                let h, s, l;
                if (lockedAxis === 'x') {
                    h = lockedValue;
                    s = nx * 100;
                    l = (1 - ny) * 100;
                } else if (lockedAxis === 'y') {
                    h = nx * 360;
                    s = lockedValue;
                    l = (1 - ny) * 100;
                } else {
                    h = nx * 360;
                    s = (1 - ny) * 100;
                    l = lockedValue;
                }

                const rgb = hslToRgb(h, s, l);
                data[i++] = rgb.r;
                data[i++] = rgb.g;
                data[i++] = rgb.b;
                data[i++] = 255;
            }
        }

        this._renderCtx.putImageData(this._imageData, 0, 0);
        this._cachedAxis = lockedAxis;
        this._cachedValue = lockedValue;
    }

    /**
     * 剖面渲染入口
     * @param {string} lockedAxis 'x' | 'y' | 'z'
     * @param {number} lockedValue
     * @param {string} space 'rgb' | 'hsv' | 'hsl'
     */
    renderCrossSection(lockedAxis, lockedValue, space) {
        if (space !== 'hsl') return;

        const safeValue = Math.round(lockedValue);

        if (this._cachedAxis !== lockedAxis || this._cachedValue !== safeValue) {
            this._lockedAxis = lockedAxis;
            this._lockedValue = safeValue;
            this._updateCache();
        }

        this.clear();

        const cw = this.container.clientWidth;
        const ch = this.container.clientHeight;

        this.ctx.drawImage(
            this._renderCanvas,
            0, 0, this._renderSize, this._renderSize,
            0, 0, cw, ch
        );

        const appState = getState();
        const color = appState.color;
        let mx = 0, my = 0;

        if (lockedAxis === 'x') {
            mx = (color.s / 100) * cw;
            my = (1 - color.l / 100) * ch;
        } else if (lockedAxis === 'y') {
            mx = (color.h / 360) * cw;
            my = (1 - color.l / 100) * ch;
        } else if (lockedAxis === 'z') {
            mx = (color.h / 360) * cw;
            my = (1 - color.s / 100) * ch;
        }

        this.drawMarker(mx, my);
    }
}
