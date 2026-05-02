# 交互式调色盘 (ColorBoard)

一个基于 Web 的交互式调色盘工具，支持 RGB、HSV、HSL 三种色彩空间，提供 2D 和 3D 两种可视化模式。

## 功能特性

- **三种色彩空间** — 支持 RGB、HSV、HSL 实时切换，颜色值自动同步转换
- **2D 可视化** — RGB 三角形（重心坐标插值）、HSV/HSL 矩形 + 滑块面板
- **3D 可视化** — RGB 立方体、HSV 圆柱体、HSL 双锥体（Three.js 渲染，支持旋转/缩放）
- **实时颜色显示** — HEX、RGB、HSV、HSL 四种格式同步更新，带色块预览
- **触摸支持** — 基于 Pointer Events，兼容鼠标和触摸屏操作
- **懒加载架构** — 3D 模块（Three.js）在首次切换到 3D 模式时才动态加载
- **3D 剖面模式** — 在 3D 模式下锁定任意坐标轴，实时生成 2D 剖面色谱平面，支持剖面上直接选色

## 快速开始

本项目为纯静态页面，无需构建工具，直接打开即可运行。

**方式一：直接打开**

用浏览器打开 `index.html` 即可使用。

**方式二：本地 HTTP 服务**

```bash
python -m http.server 8080
```

然后在浏览器中访问 `http://localhost:8080`。

## 文件结构

```
ColorBoard/
├── index.html              # 主入口页面
├── package.json            # 项目配置（ES module）
├── css/
│   └── style.css           # 样式表
├── js/
│   ├── main.js             # 应用入口，模块整合与初始化
│   ├── state.js            # 全局状态管理与事件总线
│   ├── color-space/        # 色彩空间转换
│   │   ├── converter.js    # RGB/HSV/HSL/HEX 双向转换函数
│   │   ├── rgb.js          # RGB 数据结构与校验
│   │   ├── hsv.js          # HSV 数据结构与校验
│   │   └── hsl.js          # HSL 数据结构与校验
│   ├── renderer-2d/        # 2D 渲染器（Canvas 2D）
│   │   ├── base.js         # 2D 渲染器基类（Canvas 初始化、Pointer Events、ResizeObserver）
│   │   ├── rgb-triangle.js # RGB 三角形渲染器（重心坐标）
│   │   └── rect-slider.js  # HSV/HSL 矩形+滑块渲染器
│   ├── renderer-3d/        # 3D 渲染器（Three.js）
│   │   ├── scene.js        # Three.js 场景包装器（相机、OrbitControls、射线拾取）
│   │   ├── base-mesh.js    # 3D 网格基类（顶点着色、显示/隐藏、高亮标记）
│   │   ├── rgb-cube.js     # RGB 立方体网格
│   │   ├── hsv-cylinder.js # HSV 圆柱体网格
│   │   ├── hsl-cone.js     # HSL 双锥体网格
│   │   ├── spherical-mapper.js
│   │   └── cross-section-plane.js # 3D 剖切平面（半透明 PlaneGeometry）
│   ├── renderer-cross-section/ # 剖面 2D 渲染器
│   │   ├── base.js         # 剖面渲染器基类（Canvas 初始化、Pointer Events、ResizeObserver）
│   │   ├── rgb-section.js  # RGB 剖面渲染器（锁定 R/G/B 轴，G-B/R-B/R-G 切面）
│   │   ├── hsv-section.js  # HSV 剖面渲染器（锁定 H/S/V 轴，S-V/H-V/H-S 切面）
│   │   └── hsl-section.js  # HSL 剖面渲染器（锁定 H/S/L 轴，S-L/H-L/H-S 切面）
│   ├── ui/                 # UI 控件
│   │   ├── mode-switch.js  # 2D/3D 模式切换
│   │   ├── space-switch.js # RGB/HSV/HSL 空间切换
│   │   ├── color-display.js# 颜色值显示与色块预览
│   │   └── cross-section-panel.js # 剖面控制面板（轴锁定、滑块、数值输入）
│   └── tests/
│       └── converter.test.js # 转换器单元测试
└── docs/
    └── user-guide.md       # 用户指南
```

## 剖面模式

剖面模式是 3D 可视化下的高级功能，允许用户锁定色彩空间中的一个坐标轴，实时观察该位置上的二维色彩切片，并在切片上直接选色。

### 操作方式

在 3D 模式下，控制面板底部会显示"剖面模式"区域，包含三个坐标轴对应的滑块、数值输入和锁定按钮：

1. **锁定轴** — 点击某个轴对应的"锁定"按钮，锁定该轴的当前值。3D 场景中会出现一个半透明白色剖切平面，标明锁定位置。
2. **调整锁定值** — 锁定轴后，其滑块和输入框不可操作，锁定值由当前颜色值决定。如需修改锁定值，先解锁再重新锁定。
3. **剖面选色** — 锁定后，下方会显示该位置上的二维色彩切片。在切面上点击或拖动即可选择颜色，被锁定的轴的值保持不变。
4. **解锁** — 再次点击已锁定的轴的"已锁定"按钮即可解锁，恢复 3D 场景正常操作。

### 各空间的剖面含义

| 色彩空间 | 锁定轴 | 剖面含义 |
|---------|--------|---------|
| RGB | R | G-B 平面（固定红色分量） |
| RGB | G | R-B 平面（固定绿色分量） |
| RGB | B | R-G 平面（固定蓝色分量） |
| HSV | H | S-V 平面（固定色相） |
| HSV | S | H-V 平面（固定饱和度） |
| HSV | V | H-S 平面（固定明度） |
| HSL | H | S-L 平面（固定色相） |
| HSL | S | H-L 平面（固定饱和度） |
| HSL | L | H-S 平面（固定亮度） |

### 技术细节

- 剖面模式仅在 3D 模式下可用，切换到 2D 模式时自动隐藏
- 切换色彩空间时，剖面渲染器自动切换为对应的 2D 切片，3D 剖切平面同步更新
- 2D 剖面通过 Canvas 2D 像素级计算渲染，RGB 使用预缓存优化性能
- 3D 剖切平面使用 Three.js `PlaneGeometry` + `EdgesGeometry`，半透明显示
- 剖面状态（锁定轴、锁定值、各轴数值）通过事件总线与全局状态同步

## 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|---------|
| Chrome | 90 |
| Firefox | 88 |
| Safari | 14 |
| Edge | 90 |

需要浏览器支持 ES6 模块、Canvas 2D、WebGL（3D 模式）、Pointer Events、ResizeObserver 和 ES2020 动态 import。

## 技术栈

- **语言** — 纯原生 ES6 JavaScript
- **2D 渲染** — Canvas 2D API
- **3D 渲染** — Three.js r160（通过 CDN 加载）
- **3D 控件** — OrbitControls（Three.js 扩展）
- **模块管理** — 原生 ES6 Modules + Import Map
- **无构建工具** — 零配置，直接运行

## 性能指标

| 指标 | 目标 |
|------|------|
| 2D 模式帧率（桌面端） | >= 30 fps |
| 3D 模式帧率（桌面端） | >= 30 fps |
| 2D 模式帧率（移动端） | >= 20 fps |
| 3D 模式帧率（移动端） | >= 20 fps |
| 内存占用 | <= 100 MB |
| 3D 模块首次加载 | 动态懒加载，不阻塞页面启动 |

3D 模式下帧率受设备 GPU 性能影响。移动端建议优先使用 2D 模式。
