import * as THREE from 'three';
import { BaseColorMesh } from './base-mesh.js';
import { setColor } from '../state.js';
import { hsvToRgb } from '../color-space/converter.js';

export class HSVCylinder extends BaseColorMesh {
    buildGeometry() {
        return new THREE.CylinderGeometry(0.5, 0.5, 1, 32, 20);
    }

    constructor(scene3d) {
        super(scene3d);

        this.setVertexColors(this.geometry, (x, y, z) => {
            let angle = Math.atan2(z, x);
            let h = (angle / (2 * Math.PI)) * 360;
            if (h < 0) h += 360;

            let radius = Math.sqrt(x * x + z * z) / 0.5;
            let s = Math.min(100, Math.max(0, radius * 100));
            
            let v = Math.min(100, Math.max(0, (y + 0.5) * 100));

            // Top/bottom center points (radius=0): S=0, H=0 (grayscale based on V)
            if (s === 0) {
                h = 0;
            }

            return hsvToRgb(h, s, v);
        });

        this.scene3d.add(this.mesh);
    }

    onClick(mouseX, mouseY) {
        const point = super.onClick(mouseX, mouseY);
        
        if (point) {
            const localPoint = this.mesh.worldToLocal(point.clone());
            
            let angle = Math.atan2(localPoint.z, localPoint.x);
            let h = (angle / (2 * Math.PI)) * 360;
            if (h < 0) h += 360;

            let radius = Math.sqrt(localPoint.x * localPoint.x + localPoint.z * localPoint.z) / 0.5;
            let s = Math.min(100, Math.max(0, radius * 100));
            
            let v = Math.min(100, Math.max(0, (localPoint.y + 0.5) * 100));

            if (s === 0) {
                h = 0;
            }

            setColor({
                h: Math.round(h),
                s: Math.round(s),
                v: Math.round(v)
            });
            
            this.highlight(point);
            this.scene3d.render();
            
            return point;
        }
        
        return null;
    }

    updateCrossSection(color) {
        if (this.crossSectionPlane) {
            // V 范围 0-100，映射到 y: -0.5 到 0.5
            this.crossSectionPlane.position.y = (color.v / 100) - 0.5;
        }
    }
}
