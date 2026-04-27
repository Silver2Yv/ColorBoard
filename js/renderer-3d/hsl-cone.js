import * as THREE from 'three';
import { BaseColorMesh } from './base-mesh.js';
import { setColor } from '../state.js';
import { hslToRgb } from '../color-space/converter.js';

export class HSLCone extends BaseColorMesh {
    constructor(scene3d) {
        super(scene3d);
        
        this.setVertexColors(this.geometry, this.vertexColorFn.bind(this));
        
        this.scene3d.add(this.mesh);
        this.scene3d.render();
    }

    buildGeometry() {
        const topGeom = new THREE.ConeGeometry(0.5, 0.5, 32, 20);
        topGeom.translate(0, 0.25, 0);

        const bottomGeom = new THREE.ConeGeometry(0.5, 0.5, 32, 20);
        bottomGeom.rotateX(Math.PI);
        bottomGeom.translate(0, -0.25, 0);

        const posAttr1 = topGeom.getAttribute('position');
        const posAttr2 = bottomGeom.getAttribute('position');
        const positions = new Float32Array(posAttr1.array.length + posAttr2.array.length);
        positions.set(posAttr1.array, 0);
        positions.set(posAttr2.array, posAttr1.array.length);

        const idxAttr1 = topGeom.getIndex();
        const idxAttr2 = bottomGeom.getIndex();
        const indices = new Uint32Array(idxAttr1.array.length + idxAttr2.array.length);
        indices.set(idxAttr1.array, 0);
        for (let i = 0; i < idxAttr2.array.length; i++) {
            indices[idxAttr1.array.length + i] = idxAttr2.array[i] + posAttr1.count;
        }

        const mergedGeom = new THREE.BufferGeometry();
        mergedGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        mergedGeom.setIndex(new THREE.BufferAttribute(indices, 1));
        
        if (topGeom.getAttribute('normal')) {
            const normAttr1 = topGeom.getAttribute('normal');
            const normAttr2 = bottomGeom.getAttribute('normal');
            const normals = new Float32Array(normAttr1.array.length + normAttr2.array.length);
            normals.set(normAttr1.array, 0);
            normals.set(normAttr2.array, normAttr1.array.length);
            mergedGeom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        }

        if (topGeom.getAttribute('uv')) {
            const uvAttr1 = topGeom.getAttribute('uv');
            const uvAttr2 = bottomGeom.getAttribute('uv');
            const uvs = new Float32Array(uvAttr1.array.length + uvAttr2.array.length);
            uvs.set(uvAttr1.array, 0);
            uvs.set(uvAttr2.array, uvAttr1.array.length);
            mergedGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        }

        return mergedGeom;
    }

    vertexColorFn(x, y, z) {
        let angle = Math.atan2(z, x);
        if (angle < 0) angle += 2 * Math.PI;
        const h = (angle / (2 * Math.PI)) * 360;

        const l = 50 + y * 100;

        const maxRadiusAtY = 0.5 * (1 - Math.abs(y * 2));

        let s = 0;
        if (maxRadiusAtY > 0.0001) {
            const radius = Math.sqrt(x * x + z * z);
            s = (radius / maxRadiusAtY) * 100;
            s = Math.max(0, Math.min(100, s));
        }

        const [r, g, b] = hslToRgb(h, s, l);
        return { r, g, b };
    }

    onClick(mouseX, mouseY) {
        const point = super.onClick(mouseX, mouseY);
        if (!point) return null;

        const localPoint = this.mesh.worldToLocal(point.clone());
        const { x, y, z } = localPoint;

        let angle = Math.atan2(z, x);
        if (angle < 0) angle += 2 * Math.PI;
        const h = (angle / (2 * Math.PI)) * 360;

        const l = 50 + y * 100;

        const maxRadiusAtY = 0.5 * (1 - Math.abs(y * 2));

        let s = 0;
        if (maxRadiusAtY > 0.0001) {
            const radius = Math.sqrt(x * x + z * z);
            s = (radius / maxRadiusAtY) * 100;
            s = Math.max(0, Math.min(100, s));
        }

        setColor({ h, s, l });

        this.highlight(point);

        return { h, s, l };
    }
}
