# 交互式调色盘 (ColorBoard)

一个基于 Web 的交互式调色盘工具，支持 RGB、HSV、HSL 三种色彩空间，提供 2D 和 3D 两种可视化模式。

## 功能特性

- **三种色彩空间** — 支持 RGB、HSV、HSL 实时切换，颜色值自动同步转换
- **2D 可视化** — RGB 三角形（重心坐标插值）、HSV/HSL 矩形 + 滑块面板
- **3D 可视化** — RGB 立方体、HSV 圆柱体、HSL 双锥体（Three.js 渲染，支持旋转/缩放）
- **实时颜色显示** — HEX、RGB、HSV、HSL 四种格式同步更新，带色块预览
- **触摸支持** — 基于 Pointer Events，兼容鼠标和触摸屏操作
- **懒加载架构** — 3D 模块（Three.js）在首次切换到 3D 模式时才动态加载

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
│   │   └── spherical-mapper.js
│   ├── ui/                 # UI 控件
│   │   ├── mode-switch.js  # 2D/3D 模式切换
│   │   ├── space-switch.js # RGB/HSV/HSL 空间切换
│   │   └── color-display.js# 颜色值显示与色块预览
│   └── tests/
│       └── converter.test.js # 转换器单元测试
└── docs/
    └── user-guide.md       # 用户指南
```

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
