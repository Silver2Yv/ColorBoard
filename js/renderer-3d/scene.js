import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

/**
 * Three.js 场景包装器
 * 按需渲染模式（无动画循环），仅在 controls 变化或显式调用 render() 时渲染
 */
export class Scene3D {
    /**
     * @param {string} containerId - 容器 DOM 元素的 id
     */
    constructor(containerId) {
        this._container = document.getElementById(containerId);
        if (!this._container) {
            throw new Error(`容器 #${containerId} 未找到`);
        }

        const width = this._container.clientWidth;
        const height = this._container.clientHeight;
        const aspect = width / height;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.camera.position.set(1.5, 1.5, 1.5);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this._container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableRotate = true;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 10;

        this.controls.addEventListener('change', () => this.render());

        this._axesHelper = new THREE.AxesHelper(1.2);
        this.scene.add(this._axesHelper);

        this._gridHelper = new THREE.GridHelper(2, 10);
        this.scene.add(this._gridHelper);

        this._raycaster = new THREE.Raycaster();
        this._resizeObserver = new ResizeObserver(() => this.resize());
        this._resizeObserver.observe(this._container);

        this._disposed = false;
        this.render();
    }

    /**
     * 将网格对象添加到场景
     * @param {THREE.Object3D} mesh
     */
    add(mesh) {
        this.scene.add(mesh);
    }

    /**
     * 从场景移除网格对象
     * @param {THREE.Object3D} mesh
     */
    remove(mesh) {
        this.scene.remove(mesh);
    }

    /**
     * 渲染单帧
     */
    render() {
        if (this._disposed) return;
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 根据容器新尺寸调整相机比例和渲染器大小
     */
    resize() {
        if (this._disposed) return;

        const width = this._container.clientWidth;
        const height = this._container.clientHeight;

        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.render();
    }

    /**
     * 将鼠标/指针坐标转换为射线，返回与场景对象的交点
     * @param {number} mouseX - 鼠标在页面中的 clientX
     * @param {number} mouseY - 鼠标在页面中的 clientY
     * @returns {THREE.Intersection[]}
     */
    getRaycasterIntersection(mouseX, mouseY) {
        const rect = this.renderer.domElement.getBoundingClientRect();

        const ndcX = ((mouseX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((mouseY - rect.top) / rect.height) * 2 + 1;

        this._raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
        return this._raycaster.intersectObjects(this.scene.children, false);
    }

    /**
     * 销毁所有资源：释放渲染器、断开观察器、移除 DOM
     */
    dispose() {
        if (this._disposed) return;
        this._disposed = true;

        this.controls.dispose();
        this._resizeObserver.disconnect();

        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this._raycaster = null;
        this._container = null;
    }
}
