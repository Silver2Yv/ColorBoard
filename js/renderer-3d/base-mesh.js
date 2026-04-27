import * as THREE from 'three';

export class BaseColorMesh {
    constructor(scene3d) {
        this.scene3d = scene3d;
        this.mesh = null;
        this.highlightSphere = null;
        
        this.geometry = this.buildGeometry();
        this.material = new THREE.MeshBasicMaterial({ vertexColors: true });
        
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    buildGeometry() {
        throw new Error("buildGeometry() must be implemented by subclasses");
    }

    setVertexColors(geometry, colorFn) {
        const positionAttribute = geometry.getAttribute('position');
        const colors = [];

        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);

            const { r, g, b } = colorFn(x, y, z);
            
            colors.push(r / 255, g / 255, b / 255);
        }

        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    show() {
        if (this.mesh) {
            this.scene3d.add(this.mesh);
        }
        if (this.highlightSphere) {
            this.scene3d.add(this.highlightSphere);
        }
        this.scene3d.render();
    }

    hide() {
        if (this.mesh) {
            this.scene3d.remove(this.mesh);
        }
        if (this.highlightSphere) {
            this.scene3d.remove(this.highlightSphere);
        }
        this.scene3d.render();
    }

    dispose() {
        this.hide();
        if (this.geometry) {
            this.geometry.dispose();
            this.geometry = null;
        }
        if (this.material) {
            this.material.dispose();
            this.material = null;
        }
        if (this.mesh) {
            this.mesh = null;
        }
        
        if (this.highlightSphere) {
            this.highlightSphere.geometry.dispose();
            this.highlightSphere.material.dispose();
            this.highlightSphere = null;
        }
    }

    highlight(position) {
        if (!this.highlightSphere) {
            const geometry = new THREE.SphereGeometry(0.03);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            this.highlightSphere = new THREE.Mesh(geometry, material);
            
            if (this.scene3d.scene.children.includes(this.mesh)) {
                this.scene3d.add(this.highlightSphere);
            }
        }
        
        this.highlightSphere.position.copy(position);
        this.scene3d.render();
    }

    onClick(mouseX, mouseY) {
        if (!this.mesh) return null;
        
        const intersects = this.scene3d.getRaycasterIntersection(mouseX, mouseY);
        const match = intersects.find(intersect => intersect.object === this.mesh);
        
        if (match) {
            return match.point;
        }
        
        return null;
    }
}
