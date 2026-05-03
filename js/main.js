/**
 * 应用主入口 — 整合所有模块：2D/3D 渲染器、UI 控件、状态管理
 *
 * 模块导入策略：
 * - 2D 渲染器和 UI 模块：静态 import（页面加载即需）
 * - 3D 渲染器（Three.js 依赖）：动态 import（首次切换到 3D 时才加载）
 *
 * 初始化顺序：
 *   1. UI 控件实例化 + init()
 *   2. 2D 渲染器实例化（共享 #canvas-2d 容器）
 *   3. 默认渲染：RGB 三角可见，HSV/HSL 矩形滑块已创建但不显示
 *   4. 订阅状态事件
 *   5. 绑定窗口 resize
 *
 * 模式切换逻辑：
 *   - 2D → 3D：首次切换时 lazy-load 3D 模块，创建 Scene3D + 当前空间网格
 *   - 3D → 2D：仅切换容器可见性（ModeSwitch 已处理），触发活跃渲染器重绘
 *
 * 空间切换逻辑：
 *   - 2D 模式：隐藏所有渲染器 → 显示活跃的一个（通过最后 render 覆盖共享 canvas）
 *   - 3D 模式：隐藏当前网格 → 显示新空间网格 → 渲染场景
 */

import { subscribe, getState, getCrossSection } from './state.js';
import { RGBTriangle } from './renderer-2d/rgb-triangle.js';
import { RectSlider } from './renderer-2d/rect-slider.js';
import { ModeSwitch } from './ui/mode-switch.js';
import { SpaceSwitch } from './ui/space-switch.js';
import { ColorDisplay } from './ui/color-display.js';
import { CrossSectionPanel } from './ui/cross-section-panel.js';
import { RGBCrossSection } from './renderer-cross-section/rgb-section.js';
import { HSVSectionRenderer } from './renderer-cross-section/hsv-section.js';
import { HSLSectionRenderer } from './renderer-cross-section/hsl-section.js';

// ============================================================
// 私有状态（不暴露到全局作用域）
// ============================================================

/** @type {{rgb: RGBTriangle, hsv: RectSlider, hsl: RectSlider}} */
const _renderers2d = {};

/** @type {Scene3D|null} 3D 场景实例（懒加载） */
let _scene3d = null;

/** @type {{rgb: RGBCube, hsv: HSVCylinder, hsl: HSLCone}} 3D 网格缓存 */
const _meshes3d = {};

/** @type {BaseColorMesh|null} 当前活跃的 3D 网格 */
let _currentMesh3d = null;

/** @type {boolean} 3D 模块是否已加载（含动态 import 完成的标志） */
let _3dReady = false;

/** @type {{Scene3D: Function, RGBCube: Function, HSVCylinder: Function, HSLCone: Function, CrossSectionPlane: Function}|null} */
let _3dModules = null;

/** @type {Promise|null} 正在进行的 3D 加载 Promise（防止并发重复加载） */
let _3dLoadPromise = null;

/** @type {CrossSectionRendererBase|null} 当前活跃的剖面 2D 渲染器 */
let _crossSectionRenderer = null;

/** @type {CrossSectionPlane|null} 3D 剖切平面 */
let _crossSectionPlane = null;

// ============================================================
// 初始化入口
// ============================================================

function init() {
    // 1. 创建 UI 控件并调用 init() 绑定事件
    const modeSwitch = new ModeSwitch();
    const spaceSwitch = new SpaceSwitch();
    const colorDisplay = new ColorDisplay();
    const crossSectionPanel = new CrossSectionPanel();
    modeSwitch.init();
    spaceSwitch.init();
    colorDisplay.init();
    crossSectionPanel.init();

    // 2. 创建 2D 渲染器（三者共享 #canvas-2d 容器内的同一个 <canvas> 元素）
    //    注意：RectSlider 创建时不会立即渲染，等待空间切换时再显示
    _renderers2d.rgb = new RGBTriangle('canvas-2d');
    _renderers2d.hsv = new RectSlider('canvas-2d', 'hsv');
    _renderers2d.hsl = new RectSlider('canvas-2d', 'hsl');

    // 3. 默认状态：mode='2d' / space='rgb' — 渲染 RGB 三角
    _renderers2d.rgb.render();

    // 4. 追加剖面 canvas 容器（位于剖面面板控制区下方）
    const csCanvasContainer = document.createElement('div');
    csCanvasContainer.id = 'cross-section-canvas';
    document.getElementById('cross-section-panel').appendChild(csCanvasContainer);

    // 5. 订阅状态事件
    subscribe('mode-change', _onModeChange);
    subscribe('space-change', _onSpaceChange);
    subscribe('color-change', _onColorChange);
    subscribe('cross-section-change', _onCrossSectionChange);

    // 6. 初始状态同步：2D 模式隐藏剖面面板
    _syncCrossSectionVisibility();

    // 7. 窗口尺寸变化处理
    window.addEventListener('resize', _onWindowResize);
}

// ============================================================
// 3D 懒加载
// ============================================================

/**
 * 首次切换到 3D 时，动态加载 Three.js 及所有 3D 模块
 * 使用 Promise 缓存，防止快速双击导致重复加载
 */
function _load3DModules() {
    if (_3dLoadPromise) {
        return _3dLoadPromise;
    }

    _3dLoadPromise = (async () => {
        // 并行加载 4 个模块
        const [
            sceneModule,
            cubeModule,
            cylinderModule,
            coneModule,
            crossSectionPlaneModule
        ] = await Promise.all([
            import('./renderer-3d/scene.js'),
            import('./renderer-3d/rgb-cube.js'),
            import('./renderer-3d/hsv-cylinder.js'),
            import('./renderer-3d/hsl-cone.js'),
            import('./renderer-3d/cross-section-plane.js')
        ]);

        // 确认加载期间未切回 2D
        if (getState().mode !== '3d') {
            _3dLoadPromise = null;
            return;
        }

        _3dModules = {
            Scene3D: sceneModule.Scene3D,
            RGBCube: cubeModule.RGBCube,
            HSVCylinder: cylinderModule.HSVCylinder,
            HSLCone: coneModule.HSLCone,
            CrossSectionPlane: crossSectionPlaneModule.CrossSectionPlane
        };

        _3dReady = true;
    })();

    return _3dLoadPromise;
}

/**
 * 创建并初始化 3D 场景（仅在 lazy-load 完成后调用一次）
 */
function _initScene3D() {
    _scene3d = new _3dModules.Scene3D('canvas-3d');

    // 绑定 3D 画布的点击事件，将坐标转发给活跃网格的 onClick()
    _scene3d.renderer.domElement.addEventListener('pointerdown', _on3DClick);

    // 创建当前色彩空间对应的 3D 网格
    const { space, color } = getState();
    _createMesh3D(space);
    if (_currentMesh3d && typeof _currentMesh3d.updateCrossSection === 'function') {
        _currentMesh3d.updateCrossSection(color);
    }

    // 创建剖切平面（初始隐藏）
    _crossSectionPlane = new _3dModules.CrossSectionPlane(_scene3d, space);

    // 创建当前空间对应的剖面 2D 渲染器
    _createCrossSectionRenderer(space);

    // 同步当前剖面状态
    _showCrossSectionIn3D();

    _scene3d.render();
}

/**
 * 按需创建指定色彩空间的 3D 网格（懒加载，仅在首次需要时创建）
 *
 * 注意各子类构造函数的差异：
 * - RGBCube 不自动添加到场景，需要手动调用 show()
 * - HSVCylinder / HSLCone 构造函数内自动 add + render
 *
 * @param {'rgb'|'hsv'|'hsl'} space
 */
function _createMesh3D(space) {
    if (_meshes3d[space]) return;

    let mesh;
    switch (space) {
        case 'rgb':
            mesh = new _3dModules.RGBCube(_scene3d);
            // RGBCube 构造时不自动添加到场景
            mesh.show();
            break;

        case 'hsv':
            mesh = new _3dModules.HSVCylinder(_scene3d);
            // HSVCylinder 构造时自动添加到场景
            break;

        case 'hsl':
            mesh = new _3dModules.HSLCone(_scene3d);
            // HSLCone 构造时自动添加到场景
            break;
    }

    _meshes3d[space] = mesh;
    _currentMesh3d = mesh;
}

/**
 * 在 3D 模式下切换活跃的色彩空间网格
 * 隐藏当前网格，显示新空间的网格（按需创建）
 *
 * @param {'rgb'|'hsv'|'hsl'} space
 */
function _switchMesh3D(space) {
    if (!_scene3d || !_3dReady) return;

    // 隐藏当前网格
    if (_currentMesh3d) {
        _currentMesh3d.hide();
    }

    // 如果目标网格尚未创建，则按需创建
    if (!_meshes3d[space]) {
        _createMesh3D(space);
    } else {
        // 已存在，直接显示
        _meshes3d[space].show();
    }

    _currentMesh3d = _meshes3d[space];
    const { color } = getState();
    if (_currentMesh3d && typeof _currentMesh3d.updateCrossSection === 'function') {
        _currentMesh3d.updateCrossSection(color);
    }
    _scene3d.render();
}

// ============================================================
// 事件处理器
// ============================================================

/**
 * 模式切换事件：2D ↔ 3D
 *
 * 首次切换到 3D 时，触发 lazy-load：
 *   动态 import Three.js 依赖 → 创建 Scene3D → 创建当前空间网格
 * 后续切换到 3D：仅调用 render() 刷新场景
 * 切换到 2D：调用活跃 2D 渲染器的 render() 覆盖共享 canvas
 */
function _onModeChange() {
    const { mode, space } = getState();

    if (mode === '3d') {
        // 显示剖面面板
        _syncCrossSectionVisibility();

        if (!_3dReady) {
            // 首次进入 3D：启动懒加载
            _load3DModules().then(() => {
                // 加载过程中可能已切回 2D
                if (getState().mode !== '3d') return;
                _initScene3D();
            });
        } else {
            // 已加载，刷新场景渲染
            _scene3d?.render();
            // 同步显示剖面渲染器和剖切平面
            _showCrossSectionIn3D();
        }
    } else if (mode === '2d') {
        // 隐藏剖面面板
        _syncCrossSectionVisibility();

        // 切换回 2D：确保活跃渲染器覆盖共享 canvas
        // （ModeSwitch._sync 已处理容器可见性）
        _renderers2d[space]?.render();
    }
}

/**
 * 空间切换事件：RGB ↔ HSV ↔ HSL
 *
 * 2D 模式：在共享 canvas 上渲染活跃的渲染器（覆盖其他渲染器的输出）
 * 3D 模式：切换场景中的活跃网格
 */
function _onSpaceChange() {
    const { mode, space } = getState();

    if (mode === '2d') {
        // 调用活跃渲染器的 render()，因其渲染顺序在所有订阅者中靠后，
        // 能够覆盖 RectSlider 等其他渲染器在 color-change 时的输出
        _renderers2d[space]?.render();
    } else if (mode === '3d') {
        _switchMesh3D(space);

        // 切换色彩空间时：重新创建剖面 2D 渲染器、更新剖切平面空间类型
        if (_crossSectionPlane) {
            _crossSectionPlane.space = space;
        }
        _createCrossSectionRenderer(space);

        const crossSection = getCrossSection();
        if (crossSection.enabled && crossSection.lockedAxis) {
            if (_crossSectionRenderer) {
                _crossSectionRenderer.renderCrossSection(
                    crossSection.lockedAxis,
                    crossSection.lockedValue,
                    space
                );
            }
            if (_crossSectionPlane) {
                _crossSectionPlane.show(crossSection.lockedAxis, crossSection.lockedValue);
            }
        }
    }
}

/**
 * 颜色变更事件：同步选择标记
 *
 * 每个 2D 渲染器都已独立订阅 color-change 并自更新，
 * 此处的作用是确保活跃渲染器最后绘制（覆盖共享 canvas 上的其他输出）。
 * 3D 模式下仅刷新场景渲染。
 */
function _onColorChange() {
    const { mode, space, color } = getState();

    if (mode === '2d') {
        // 活跃渲染器最后渲染，确保在共享 canvas 上可见
        _renderers2d[space]?.render();
    } else if (mode === '3d' && _scene3d) {
        if (_currentMesh3d && typeof _currentMesh3d.updateCrossSection === 'function') {
            _currentMesh3d.updateCrossSection(color);
        }
        _scene3d.render();

        // 更新剖面渲染器的选中标记
        const crossSection = getCrossSection();
        if (crossSection.enabled && crossSection.lockedAxis && _crossSectionRenderer) {
            _crossSectionRenderer.renderCrossSection(
                crossSection.lockedAxis,
                crossSection.lockedValue,
                space
            );
        }
    }
}

/**
 * 剖切面变更事件：同步剖面 2D 渲染器和 3D 剖切平面
 *
 * - lockedAxis 为 null（禁用剖面时）：隐藏 3D 平面
 * - lockedAxis 已设置：显示并更新位置
 */
function _onCrossSectionChange() {
    const crossSection = getCrossSection();
    const { mode, space } = getState();

    if (mode !== '3d') return;

    if (crossSection.enabled && crossSection.lockedAxis) {
        // 更新剖面 2D 渲染器
        if (_crossSectionRenderer) {
            _crossSectionRenderer.renderCrossSection(
                crossSection.lockedAxis,
                crossSection.lockedValue,
                space
            );
        }
        // 显示并更新 3D 剖切平面
        if (_crossSectionPlane) {
            _crossSectionPlane.show(crossSection.lockedAxis, crossSection.lockedValue);
        }
    } else {
        // 禁用剖面时隐藏 3D 剖切平面
        if (_crossSectionPlane) {
            _crossSectionPlane.hide();
        }
    }
}

/**
 * 3D 画布点击事件：将 clientX / clientY 传递给活跃网格的 onClick()
 *
 * @param {PointerEvent} evt
 */
function _on3DClick(evt) {
    if (_currentMesh3d && typeof _currentMesh3d.onClick === 'function') {
        _currentMesh3d.onClick(evt.clientX, evt.clientY);
    }
}

// ============================================================
// 剖面模式辅助函数
// ============================================================

/**
 * 根据当前色彩空间创建或切换剖面 2D 渲染器
 * 销毁旧的渲染器，创建当前空间对应的新渲染器
 *
 * @param {'rgb'|'hsv'|'hsl'} space
 */
function _createCrossSectionRenderer(space) {
    _destroyCrossSectionRenderer();

    const containerId = 'cross-section-canvas';
    if (!document.getElementById(containerId)) return;

    switch (space) {
        case 'rgb':
            _crossSectionRenderer = new RGBCrossSection(containerId);
            break;
        case 'hsv':
            _crossSectionRenderer = new HSVSectionRenderer(containerId);
            break;
        case 'hsl':
            _crossSectionRenderer = new HSLSectionRenderer(containerId);
            break;
    }
}

/**
 * 销毁当前剖面 2D 渲染器，释放 canvas 和事件监听
 */
function _destroyCrossSectionRenderer() {
    if (_crossSectionRenderer) {
        _crossSectionRenderer.destroy();
        _crossSectionRenderer = null;
    }
}

/**
 * 在 3D 模式下同步显示剖面渲染器和剖切平面
 * 剖面面板已在外部显示，此处负责绘制内容
 */
function _showCrossSectionIn3D() {
    const crossSection = getCrossSection();
    const { space } = getState();

    if (!_crossSectionRenderer || !_crossSectionPlane) return;

    if (crossSection.enabled && crossSection.lockedAxis) {
        _crossSectionRenderer.renderCrossSection(
            crossSection.lockedAxis,
            crossSection.lockedValue,
            space
        );
        _crossSectionPlane.show(crossSection.lockedAxis, crossSection.lockedValue);
    }
}

/**
 * 根据当前模式显示/隐藏 #cross-section-panel
 * 2D 模式隐藏，3D 模式显示
 */
function _syncCrossSectionVisibility() {
    const { mode } = getState();
    const panel = document.getElementById('cross-section-panel');
    const mainArea = document.querySelector('.main-area');
    if (panel) {
        panel.classList.toggle('hidden', mode === '2d');
    }
    if (mainArea) {
        mainArea.classList.toggle('layout-three-col', mode === '3d');
        mainArea.classList.toggle('layout-two-col', mode === '2d');
    }
}

/**
 * 窗口 resize 事件：通知所有活跃渲染器更新尺寸
 *
 * 各 2D 渲染器有内置 ResizeObserver，Scene3D 也有，
 * 此处为冗余保障，确保窗口 resize 时尺寸正确同步。
 */
function _onWindowResize() {
    const { mode } = getState();

    // 2D 渲染器共享同一容器，全部 resize 无副作用
    _renderers2d.rgb.resize();
    _renderers2d.hsv.resize();
    _renderers2d.hsl.resize();

    // 3D 场景 resize（如果已加载）
    if (_scene3d) {
        _scene3d.resize();
    }
}

// ============================================================
// 启动应用
// ============================================================
init();
