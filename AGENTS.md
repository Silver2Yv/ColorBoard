# 交互式调色盘 (ColorBoard) — PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-27
**Branch:** master
**Tech:** 纯原生 ES6 JS · Canvas 2D · Three.js r160 (CDN) · 零构建

## OVERVIEW
Web 端交互式调色盘，支持 RGB/HSV/HSL 三种色彩空间 + 2D/3D 双模式可视化。纯静态页面，ES6 Modules + Import Map，无需 npm install 或构建工具。

## STRUCTURE
```
ColorBoard/
├── index.html              # 主入口，含 Import Map (Three.js CDN)
├── css/style.css           # 全局样式 (165行)
├── js/
│   ├── main.js             # 应用入口，整合所有模块 (314行)
│   ├── state.js            # 全局状态管理 + 事件总线 (226行)
│   ├── color-space/        # 色彩空间转换 (纯函数)
│   │   ├── converter.js    # 8个转换函数: RGB↔HSV↔HSL↔HEX
│   │   ├── rgb.js          # RGB 数据结构 + clamp
│   │   ├── hsv.js          # HSV 数据结构与校验
│   │   └── hsl.js          # HSL 数据结构与校验
│   ├── renderer-2d/        # 2D 渲染器 (Canvas 2D)
│   │   ├── base.js         # 基类: Canvas初始化、PointerEvents、ResizeObserver
│   │   ├── rgb-triangle.js # RGB 三角形 (重心坐标插值)
│   │   └── rect-slider.js  # HSV/HSL 矩形 + 滑块
│   ├── renderer-3d/        # 3D 渲染器 (Three.js, 懒加载)
│   │   ├── scene.js        # 场景包装器: 相机、OrbitControls、射线拾取
│   │   ├── base-mesh.js    # 网格基类: 顶点着色、显示/隐藏、高亮
│   │   ├── rgb-cube.js     # RGB 立方体
│   │   ├── hsv-cylinder.js # HSV 圆柱体
│   │   ├── hsl-cone.js     # HSL 双锥体
│   │   └── spherical-mapper.js
│   ├── ui/                 # UI 控件 (各司其职，无耦合)
│   │   ├── mode-switch.js  # 2D/3D 模式切换
│   │   ├── space-switch.js # RGB/HSV/HSL 空间切换
│   │   └── color-display.js# 颜色值显示 + 色块预览
│   └── tests/
│       └── converter.test.js # 转换器单元测试 (322行)
└── docs/user-guide.md      # 用户指南
```

## WHERE TO LOOK

| 任务 | 位置 | 说明 |
|------|------|------|
| 添加新色彩空间 | `js/color-space/` → 新建数据结构 + `converter.js` 加函数 + `state.js` 加分支 | 始终以 RGB 为中间桥梁 |
| 添加新 2D 渲染器 | `js/renderer-2d/` | 继承 `base.js` 基类，实现 `render()` 和 `isInside()` |
| 添加新 3D 网格 | `js/renderer-3d/` | 继承 `base-mesh.js`，实现 `buildGeometry()` |
| 修改颜色选择逻辑 | `js/state.js` → `setColor()` | 所有空间的同步转换在此处理 |
| 修改 3D 懒加载 | `js/main.js` → `_load3DModules()` / `_initScene3D()` | 动态 import + Promise 缓存 |
| UI 按钮交互 | `js/ui/` 目录 | 各控件独立，通过 `state.js` 事件总线通信 |
| 运行测试 | `node js/tests/converter.test.js` | 无测试框架，原生 node + 自写 assert |

## CODE MAP

| 导出 | 类型 | 文件 | 角色 |
|------|------|------|------|
| `setColor` / `setMode` / `setSpace` | Function | `js/state.js` | 状态修改 + 事件触发 |
| `subscribe` / `getState` | Function | `js/state.js` | 事件订阅 + 状态读取 |
| `rgbToHsv` / `hsvToRgb` / `rgbToHsl` / `hslToRgb` / `hsvToHsl` / `hslToHsv` / `rgbToHex` / `hexToRgb` | Function | `js/color-space/converter.js` | 8 个纯转换函数 |
| `Renderer2DBase` | Class | `js/renderer-2d/base.js` | 2D 渲染器基类 |
| `RGBTriangle` | Class | `js/renderer-2d/rgb-triangle.js` | RGB 三角形渲染器 |
| `RectSlider` | Class | `js/renderer-2d/rect-slider.js` | HSV/HSL 通用矩形渲染器 |
| `Scene3D` | Class | `js/renderer-3d/scene.js` | Three.js 场景包装器 |
| `BaseColorMesh` | Class | `js/renderer-3d/base-mesh.js` | 3D 网格基类 |
| `ModeSwitch` / `SpaceSwitch` / `ColorDisplay` | Class | `js/ui/` | UI 控件 |

## CONVENTIONS (本项目特有)

- **懒加载 3D**: 2D 模块 `static import`，3D 模块 `dynamic import()` 首次切换时才加载，用 Promise 缓存防重复
- **共享 Canvas**: RGB 三角 + HSV/HSL 渲染器共用 `#canvas-2d` 内同一 `<canvas>`，通过渲染顺序控制可见性
- **事件总线**: 不要直接改 DOM。用 `state.setColor/setMode/setSpace` → 订阅 `color-change/mode-change/space-change`
- **RGB 中间桥梁**: 所有色彩空间转换统一经过 RGB，不一跳到位
- **容器 ID 约定**: Canvas 容器以 `-id` 形式（`canvas-2d`, `canvas-3d`）作为构造函数参数
- **自写断言**: 测试无框架依赖，`node` 直接运行，断言函数均在测试文件内定义
- **颜色值范围**: RGB 0-255, HSV/HSL H:0-360 S/V/L:0-100

## ANTI-PATTERNS (本项目禁止)

- **不要直接操作 `_state`** — 闭包保护，外部只能通过 `setColor/setMode/setSpace` 修改
- **不要在 3D 未加载时创建网格** — 先检查 `_3dReady`，再调用 `_3dModules`
- **不要添加 npm 依赖** — 项目零依赖，Three.js 通过 CDN Import Map 加载
- **不要在子类直接操作 canvas 尺寸** — 使用 `_updateSize()` / `resize()`，它处理 devicePixelRatio
- **不要跳过 `_disposed` 检查** — 3D 渲染器/场景的 `render()` 必须检查销毁标志

## UNIQUE STYLES

- **私有前缀**: `_` 前缀表示模块私有（`_renderers2d`, `_scene3d`, `_onModeChange`）
- **中文注释**: 所有文件使用中文 JSDoc 注释，每个函数有 `@param` / `@returns`
- **缩进**: JS 4 空格, CSS 2 空格
- **文件命名**: kebab-case (`rect-slider.js`, `color-display.js`)
- **类命名**: PascalCase (`RGBTriangle`, `Scene3D`)
- **函数命名**: camelCase，动词开头 (`setColor`, `subscribe`, `_onModeChange`)

## COMMANDS

```bash
# 开发 — 本地 HTTP 服务
python -m http.server 8080
# 浏览器访问 http://localhost:8080

# 测试
node js/tests/converter.test.js

# 直接打开 (file://协议)
# 浏览器打开 index.html 即可，无需服务
```

## NOTES

- **无构建**: 无需 `npm install`，无 webpack/vite，Three.js 从 jsDelivr CDN 加载
- **Import Map**: 在 `index.html` 中定义，修改 CDN 版本需同时更新 README
- **按需渲染**: 3D 无动画循环，仅在 `controls.change` 或显式调用 `render()` 时渲染
- **浏览器要求**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **移动端**: 建议优先 2D 模式，3D 帧率受 GPU 性能限制
- **git**: master 分支目前无提交记录 (初始仓库)
