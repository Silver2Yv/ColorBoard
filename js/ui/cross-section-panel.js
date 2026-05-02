/**
 * 剖面控制面板
 *
 * 提供三个轴的滑块、数值输入与锁定按钮，支持按当前色彩空间动态切换标签与范围。
 * 通过订阅 space-change / cross-section-change 事件保持与 state 同步。
 */

import { getCrossSection, getState, setCrossSection, subscribe } from '../state.js';

const _SPACE_META = {
  rgb: {
    x: { label: 'R', min: 0, max: 255 },
    y: { label: 'G', min: 0, max: 255 },
    z: { label: 'B', min: 0, max: 255 }
  },
  hsv: {
    x: { label: 'H', min: 0, max: 360 },
    y: { label: 'S', min: 0, max: 100 },
    z: { label: 'V', min: 0, max: 100 }
  },
  hsl: {
    x: { label: 'H', min: 0, max: 360 },
    y: { label: 'S', min: 0, max: 100 },
    z: { label: 'L', min: 0, max: 100 }
  }
};

const _AXES = ['x', 'y', 'z'];

export class CrossSectionPanel {
  constructor() {
    this._container = document.getElementById('cross-section-panel');
    this._initialized = false;
    this._collapsed = false;
    this._toggleBtn = null;
    this._rows = {
      x: null,
      y: null,
      z: null
    };
  }

  /**
   * 初始化：创建控制面板、绑定事件、同步当前状态
   */
  init() {
    if (this._initialized || !this._container) {
      return;
    }
    this._initialized = true;

    this._build();
    this._bindEvents();

    this._container.classList.remove('hidden');

    subscribe('space-change', () => this._sync());
    subscribe('cross-section-change', () => this._sync());

    this._sync();
  }

  _build() {
    this._container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'cross-section-header';

    const title = document.createElement('h3');
    title.className = 'section-label';
    title.textContent = '剖面模式';

    this._toggleBtn = document.createElement('button');
    this._toggleBtn.className = 'btn cross-section-toggle';
    this._toggleBtn.type = 'button';
    this._toggleBtn.setAttribute('aria-label', '折叠剖面面板');
    this._toggleBtn.setAttribute('aria-expanded', 'true');
    this._toggleBtn.textContent = '折叠';

    header.appendChild(title);
    header.appendChild(this._toggleBtn);

    const controls = document.createElement('div');
    controls.className = 'cross-section-controls';

    for (const axis of _AXES) {
      const row = this._createRow(axis);
      this._rows[axis] = row;
      controls.appendChild(row.root);
    }

    this._container.appendChild(header);
    this._container.appendChild(controls);
  }

  _createRow(axis) {
    const root = document.createElement('div');
    root.className = 'cross-section-control';

    const label = document.createElement('label');
    label.className = 'cross-section-label';
    label.htmlFor = `cross-section-${axis}`;

    const inputRow = document.createElement('div');
    inputRow.className = 'cross-section-input-row';

    const slider = document.createElement('input');
    slider.id = `cross-section-${axis}`;
    slider.type = 'range';

    const number = document.createElement('input');
    number.type = 'number';

    const lockBtn = document.createElement('button');
    lockBtn.type = 'button';
    lockBtn.className = 'btn cross-section-lock';
    lockBtn.textContent = '锁定';

    inputRow.appendChild(slider);
    inputRow.appendChild(number);
    inputRow.appendChild(lockBtn);

    root.appendChild(label);
    root.appendChild(inputRow);

    return {
      root,
      label,
      slider,
      number,
      lockBtn
    };
  }

  _bindEvents() {
    this._toggleBtn.addEventListener('click', () => {
      this._collapsed = !this._collapsed;
      this._container.classList.toggle('cross-section-collapsed', this._collapsed);
      this._toggleBtn.textContent = this._collapsed ? '展开' : '折叠';
      this._toggleBtn.setAttribute('aria-expanded', String(!this._collapsed));
    });

    for (const axis of _AXES) {
      const row = this._rows[axis];

      row.slider.addEventListener('input', () => this._handleValueInput(axis, row.slider.value));
      row.number.addEventListener('input', () => this._handleValueInput(axis, row.number.value));
      row.lockBtn.addEventListener('click', () => this._toggleLock(axis));
    }
  }

  _handleValueInput(axis, rawValue) {
    const meta = this._getMeta();
    const bounds = meta[axis];
    const nextValue = this._clamp(this._toNumber(rawValue, bounds.min), bounds.min, bounds.max);
    const nextValues = this._getValues();

    nextValues[axis] = nextValue;
    this._setFieldValue(axis, nextValue);

    setCrossSection({ values: nextValues });
  }

  _toggleLock(axis) {
    const crossSection = getCrossSection();
    const currentValues = this._getValues();

    if (crossSection.enabled && crossSection.lockedAxis === axis) {
      setCrossSection({
        enabled: false,
        lockedAxis: null,
        values: currentValues
      });
      return;
    }

    setCrossSection({
      enabled: true,
      lockedAxis: axis,
      lockedValue: currentValues[axis],
      values: currentValues
    });
  }

  _sync() {
    const state = getState();
    const crossSection = getCrossSection();
    const meta = _SPACE_META[state.space] || _SPACE_META.rgb;

    for (const axis of _AXES) {
      const row = this._rows[axis];
      const axisMeta = meta[axis];
      const value = this._clamp(this._toNumber(crossSection.values[axis], axisMeta.min), axisMeta.min, axisMeta.max);

      row.label.textContent = `${axisMeta.label} (${axisMeta.min}-${axisMeta.max})`;
      row.slider.min = String(axisMeta.min);
      row.slider.max = String(axisMeta.max);
      row.slider.step = '1';
      row.number.min = String(axisMeta.min);
      row.number.max = String(axisMeta.max);
      row.number.step = '1';

      this._setFieldValue(axis, value);

      const locked = crossSection.enabled && crossSection.lockedAxis === axis;
      row.slider.disabled = locked;
      row.number.disabled = locked;
      row.lockBtn.classList.toggle('active', locked);
      row.lockBtn.textContent = locked ? '已锁定' : '锁定';
      row.root.classList.toggle('is-locked', locked);
    }

    const normalizedValues = {
      x: this._clamp(this._toNumber(crossSection.values.x, meta.x.min), meta.x.min, meta.x.max),
      y: this._clamp(this._toNumber(crossSection.values.y, meta.y.min), meta.y.min, meta.y.max),
      z: this._clamp(this._toNumber(crossSection.values.z, meta.z.min), meta.z.min, meta.z.max)
    };

    if (
      normalizedValues.x !== crossSection.values.x ||
      normalizedValues.y !== crossSection.values.y ||
      normalizedValues.z !== crossSection.values.z
    ) {
      setCrossSection({
        enabled: crossSection.enabled,
        lockedAxis: crossSection.lockedAxis,
        lockedValue: crossSection.lockedValue,
        values: normalizedValues
      });
    }
  }

  _setFieldValue(axis, value) {
    const row = this._rows[axis];
    const text = String(Math.round(value));
    row.slider.value = text;
    row.number.value = text;
  }

  _getValues() {
    const crossSection = getCrossSection();

    return {
      x: this._toNumber(crossSection.values.x, 0),
      y: this._toNumber(crossSection.values.y, 0),
      z: this._toNumber(crossSection.values.z, 0)
    };
  }

  _getMeta() {
    const space = getState().space;
    return _SPACE_META[space] || _SPACE_META.rgb;
  }

  _toNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  _clamp(value, min, max) {
    return Math.min(max, Math.max(min, Math.round(value)));
  }
}
