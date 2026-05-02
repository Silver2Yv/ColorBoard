import * as THREE from 'three';

export class CrossSectionPlane {
    /**
     * @param {Object} scene3d - Three.js 场景包装器
     * @param {string} space - 色彩空间类型 ('rgb', 'hsv', 'hsl')
     */
    constructor(scene3d, space) {
        this.scene3d = scene3d;
        this.space = space;
        
        this.mesh = null;
        this.edges = null;
    }

    /**
     * 显示剖切平面
     * @param {string} lockedAxis - 锁定的坐标轴 (如 'r', 'g', 'b')
     * @param {number} lockedValue - 锁定的值
     */
    show(lockedAxis, lockedValue) {
        if (!this.mesh) {
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide
            });
            this.mesh = new THREE.Mesh(geometry, material);

            const edgesGeometry = new THREE.EdgesGeometry(geometry);
            const edgesMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5
            });
            this.edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
            
            this.mesh.add(this.edges);
        }

        // 添加到场景（scene3d 包装器应当有 add 方法）
        this.scene3d.add(this.mesh);

        this.update(lockedAxis, lockedValue);
    }

    /**
     * 隐藏剖切平面
     */
    hide() {
        if (this.mesh) {
            this.scene3d.remove(this.mesh);
        }
        this.scene3d.render();
    }

    /**
     * 更新剖切平面的位置和方向
     * @param {string} lockedAxis - 锁定的坐标轴
     * @param {number} lockedValue - 锁定的值
     */
    update(lockedAxis, lockedValue) {
        if (!this.mesh) return;

        // 重置旋转和位置
        this.mesh.rotation.set(0, 0, 0);
        this.mesh.position.set(0, 0, 0);

        if (this.space === 'rgb') {
            // 归一化映射到 -0.5 ~ 0.5
            const pos = (lockedValue / 255) - 0.5;

            if (lockedAxis === 'r') {
                // R 锁定：创建 YZ 平面
                this.mesh.rotation.y = Math.PI / 2;
                this.mesh.position.x = pos;
            } else if (lockedAxis === 'g') {
                // G 锁定：创建 XZ 平面
                this.mesh.rotation.x = Math.PI / 2;
                this.mesh.position.y = pos;
            } else if (lockedAxis === 'b') {
                // B 锁定：创建 XY 平面（默认）
                this.mesh.position.z = pos;
            }
        }

        this.scene3d.render();
    }
}
