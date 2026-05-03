import * as THREE from 'three';
import { BaseColorMesh } from './base-mesh.js';
import { setColor } from '../state.js';

export class RGBCube extends BaseColorMesh {
    buildGeometry() {
        return new THREE.BoxGeometry(1, 1, 1, 20, 20, 20);
    }

    constructor(scene3d) {
        super(scene3d);
        
        this.setVertexColors(this.geometry, (x, y, z) => {
            return {
                r: (x + 0.5) * 255,
                g: (y + 0.5) * 255,
                b: (z + 0.5) * 255
            };
        });
    }

    onClick(mouseX, mouseY) {
        const point = super.onClick(mouseX, mouseY);
        
        if (point) {
            const localPoint = this.mesh.worldToLocal(point.clone());
            
            const r = Math.round((localPoint.x + 0.5) * 255);
            const g = Math.round((localPoint.y + 0.5) * 255);
            const b = Math.round((localPoint.z + 0.5) * 255);
            
            setColor({
                r: Math.max(0, Math.min(255, r)),
                g: Math.max(0, Math.min(255, g)),
                b: Math.max(0, Math.min(255, b))
            });
            
            this.highlight(point);
            
            return point;
        }
        
        return null;
    }

    updateCrossSection(color) {
        if (this.crossSectionPlane) {
            // RGB 立方体中 Y 轴映射到绿色分量
            this.crossSectionPlane.position.y = (color.g / 255) - 0.5;
        }
    }
}
