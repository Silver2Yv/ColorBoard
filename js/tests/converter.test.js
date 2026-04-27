/**
 * converter.js 单元测试
 *
 * 测试所有 8 个转换函数 + 6 组 round-trip 精度
 * 运行方式：node js/tests/converter.test.js
 */

import {
  rgbToHsv, hsvToRgb,
  rgbToHsl, hslToRgb,
  hsvToHsl, hslToHsv,
  rgbToHex, hexToRgb
} from '../color-space/converter.js';

// ============================================================
// 工具函数
// ============================================================

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

function assertClose(actual, expected, threshold, label) {
  const diff = Math.abs(actual - expected);
  assert(diff <= threshold, `${label}: ${actual} ≈ ${expected} (diff=${diff})`);
}

function assertEachChannelClose(actual, expected, channels, threshold, label) {
  for (const ch of channels) {
    assertClose(actual[ch], expected[ch], threshold, `${label}.${ch}`);
  }
}

function assertEqual(actual, expected, label) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  assert(actualStr === expectedStr, `${label}: ${actualStr} === ${expectedStr}`);
}

// ============================================================
// 已知值测试 — RGB → HSV
// ============================================================

console.log('\n--- RGB → HSV 已知值 ---');

// 纯红
let result = rgbToHsv(255, 0, 0);
assertEachChannelClose(result, { h: 0, s: 100, v: 100 }, ['h', 's', 'v'], 0.01, '纯红 rgbToHsv');

// 纯绿
result = rgbToHsv(0, 255, 0);
assertEachChannelClose(result, { h: 120, s: 100, v: 100 }, ['h', 's', 'v'], 0.01, '纯绿 rgbToHsv');

// 纯蓝
result = rgbToHsv(0, 0, 255);
assertEachChannelClose(result, { h: 240, s: 100, v: 100 }, ['h', 's', 'v'], 0.01, '纯蓝 rgbToHsv');

// 黑色
result = rgbToHsv(0, 0, 0);
assertEqual(result, { h: 0, s: 0, v: 0 }, '黑色 rgbToHsv');

// 白色
result = rgbToHsv(255, 255, 255);
assertEqual(result, { h: 0, s: 0, v: 100 }, '白色 rgbToHsv');

// 灰色
result = rgbToHsv(128, 128, 128);
assertEqual(result, { h: 0, s: 0, v: 50.2 }, '灰色 rgbToHsv');

// ============================================================
// 已知值测试 — HSV → RGB
// ============================================================

console.log('\n--- HSV → RGB 已知值 ---');

result = hsvToRgb(0, 100, 100);
assertEqual(result, { r: 255, g: 0, b: 0 }, 'HSV(0,100,100) → RGB 纯红');

result = hsvToRgb(120, 100, 100);
assertEqual(result, { r: 0, g: 255, b: 0 }, 'HSV(120,100,100) → RGB 纯绿');

result = hsvToRgb(240, 100, 100);
assertEqual(result, { r: 0, g: 0, b: 255 }, 'HSV(240,100,100) → RGB 纯蓝');

result = hsvToRgb(0, 0, 0);
assertEqual(result, { r: 0, g: 0, b: 0 }, 'HSV(0,0,0) → RGB 黑色');

result = hsvToRgb(0, 0, 100);
assertEqual(result, { r: 255, g: 255, b: 255 }, 'HSV(0,0,100) → RGB 白色');

result = hsvToRgb(0, 0, 50);
assertEqual(result, { r: 128, g: 128, b: 128 }, 'HSV(0,0,50) → RGB 灰色');

// ============================================================
// 已知值测试 — RGB → HSL
// ============================================================

console.log('\n--- RGB → HSL 已知值 ---');

result = rgbToHsl(255, 0, 0);
assertEachChannelClose(result, { h: 0, s: 100, l: 50 }, ['h', 's', 'l'], 0.01, '纯红 rgbToHsl');

result = rgbToHsl(0, 255, 0);
assertEachChannelClose(result, { h: 120, s: 100, l: 50 }, ['h', 's', 'l'], 0.01, '纯绿 rgbToHsl');

result = rgbToHsl(0, 0, 255);
assertEachChannelClose(result, { h: 240, s: 100, l: 50 }, ['h', 's', 'l'], 0.01, '纯蓝 rgbToHsl');

result = rgbToHsl(0, 0, 0);
assertEqual(result, { h: 0, s: 0, l: 0 }, '黑色 rgbToHsl');

result = rgbToHsl(255, 255, 255);
assertEqual(result, { h: 0, s: 0, l: 100 }, '白色 rgbToHsl');

result = rgbToHsl(128, 128, 128);
assertEqual(result, { h: 0, s: 0, l: 50.2 }, '灰色 rgbToHsl');

// ============================================================
// 已知值测试 — HSL → RGB
// ============================================================

console.log('\n--- HSL → RGB 已知值 ---');

result = hslToRgb(0, 100, 50);
assertEqual(result, { r: 255, g: 0, b: 0 }, 'HSL(0,100,50) → RGB 纯红');

result = hslToRgb(120, 100, 50);
assertEqual(result, { r: 0, g: 255, b: 0 }, 'HSL(120,100,50) → RGB 纯绿');

result = hslToRgb(240, 100, 50);
assertEqual(result, { r: 0, g: 0, b: 255 }, 'HSL(240,100,50) → RGB 纯蓝');

result = hslToRgb(0, 0, 0);
assertEqual(result, { r: 0, g: 0, b: 0 }, 'HSL(0,0,0) → RGB 黑色');

result = hslToRgb(0, 0, 100);
assertEqual(result, { r: 255, g: 255, b: 255 }, 'HSL(0,0,100) → RGB 白色');

result = hslToRgb(0, 0, 50);
assertEqual(result, { r: 128, g: 128, b: 128 }, 'HSL(0,0,50) → RGB 灰色');

// ============================================================
// Round-trip 精度测试
// ============================================================

console.log('\n--- Round-trip 精度测试 ---');

const testColors = [
  { name: '纯红',      rgb: { r: 255, g: 0,   b: 0   } },
  { name: '纯绿',      rgb: { r: 0,   g: 255, b: 0   } },
  { name: '纯蓝',      rgb: { r: 0,   g: 0,   b: 255 } },
  { name: '黑色',      rgb: { r: 0,   g: 0,   b: 0   } },
  { name: '白色',      rgb: { r: 255, g: 255, b: 255 } },
  { name: '灰色',      rgb: { r: 128, g: 128, b: 128 } },
  { name: '黄色',      rgb: { r: 255, g: 255, b: 0   } },
  { name: '青色',      rgb: { r: 0,   g: 255, b: 255 } },
  { name: '品红',      rgb: { r: 255, g: 0,   b: 255 } },
  { name: '暗红',      rgb: { r: 139, g: 0,   b: 0   } },
  { name: '橙色',      rgb: { r: 255, g: 165, b: 0   } },
  { name: '紫罗兰',    rgb: { r: 238, g: 130, b: 238 } },
];

// RGB → HSV → RGB
console.log('  RGB→HSV→RGB round-trip:');
for (const { name, rgb } of testColors) {
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const restored = hsvToRgb(hsv.h, hsv.s, hsv.v);
  assertEachChannelClose(restored, rgb, ['r', 'g', 'b'], 1, `  ${name}`);
}

// RGB → HSL → RGB
console.log('\n  RGB→HSL→RGB round-trip:');
for (const { name, rgb } of testColors) {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const restored = hslToRgb(hsl.h, hsl.s, hsl.l);
  assertEachChannelClose(restored, rgb, ['r', 'g', 'b'], 1, `  ${name}`);
}

// HSV → RGB → HSV
console.log('\n  HSV→RGB→HSV round-trip:');
const testHsvColors = [
  { name: '纯红',   hsv: { h: 0,   s: 100, v: 100 } },
  { name: '纯绿',   hsv: { h: 120, s: 100, v: 100 } },
  { name: '纯蓝',   hsv: { h: 240, s: 100, v: 100 } },
  { name: '黑色',   hsv: { h: 0,   s: 0,   v: 0   } },
  { name: '白色',   hsv: { h: 0,   s: 0,   v: 100 } },
  { name: '灰色',   hsv: { h: 0,   s: 0,   v: 50  } },
  { name: '黄色',   hsv: { h: 60,  s: 100, v: 100 } },
  { name: '暗红',   hsv: { h: 0,   s: 100, v: 54.5 } },
  { name: '低饱和', hsv: { h: 200, s: 20,  v: 80  } },
  { name: '暗色',   hsv: { h: 300, s: 80,  v: 30  } },
];
for (const { name, hsv } of testHsvColors) {
  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const restored = rgbToHsv(rgb.r, rgb.g, rgb.b);
  assertEachChannelClose(restored, hsv, ['h', 's', 'v'], 1, `  ${name}`);
}

// HSL → RGB → HSL
console.log('\n  HSL→RGB→HSL round-trip:');
const testHslColors = [
  { name: '纯红',   hsl: { h: 0,   s: 100, l: 50  } },
  { name: '纯绿',   hsl: { h: 120, s: 100, l: 50  } },
  { name: '纯蓝',   hsl: { h: 240, s: 100, l: 50  } },
  { name: '黑色',   hsl: { h: 0,   s: 0,   l: 0   } },
  { name: '白色',   hsl: { h: 0,   s: 0,   l: 100 } },
  { name: '灰色',   hsl: { h: 0,   s: 0,   l: 50  } },
  { name: '黄色',   hsl: { h: 60,  s: 100, l: 50  } },
  { name: '浅红',   hsl: { h: 0,   s: 100, l: 75  } },
  { name: '低饱和', hsl: { h: 200, s: 20,  l: 60  } },
  { name: '暗色',   hsl: { h: 300, s: 80,  l: 25  } },
];
for (const { name, hsl } of testHslColors) {
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  const restored = rgbToHsl(rgb.r, rgb.g, rgb.b);
  assertEachChannelClose(restored, hsl, ['h', 's', 'l'], 1, `  ${name}`);
}

// HSV → HSL → HSV
console.log('\n  HSV→HSL→HSV round-trip:');
for (const { name, hsv } of testHsvColors) {
  const hsl = hsvToHsl(hsv.h, hsv.s, hsv.v);
  const restored = hslToHsv(hsl.h, hsl.s, hsl.l);
  assertEachChannelClose(restored, hsv, ['h', 's', 'v'], 1, `  ${name}`);
}

// HSL → HSV → HSL
console.log('\n  HSL→HSV→HSL round-trip:');
for (const { name, hsl } of testHslColors) {
  const hsv = hslToHsv(hsl.h, hsl.s, hsl.l);
  const restored = hsvToHsl(hsv.h, hsv.s, hsv.v);
  assertEachChannelClose(restored, hsl, ['h', 's', 'l'], 1, `  ${name}`);
}

// ============================================================
// HEX 转换测试
// ============================================================

console.log('\n--- HEX 转换 ---');

// RGB → HEX
assertEqual(rgbToHex(255, 0, 0), '#FF0000', '纯红 → HEX');
assertEqual(rgbToHex(0, 255, 0), '#00FF00', '纯绿 → HEX');
assertEqual(rgbToHex(0, 0, 255), '#0000FF', '纯蓝 → HEX');
assertEqual(rgbToHex(0, 0, 0), '#000000', '黑色 → HEX');
assertEqual(rgbToHex(255, 255, 255), '#FFFFFF', '白色 → HEX');
assertEqual(rgbToHex(255, 87, 51), '#FF5733', '橙色 → HEX');
assertEqual(rgbToHex(128, 128, 128), '#808080', '灰色 → HEX');

// HEX → RGB
assertEqual(hexToRgb('#FF0000'), { r: 255, g: 0, b: 0 }, '#FF0000 → RGB');
assertEqual(hexToRgb('#00FF00'), { r: 0, g: 255, b: 0 }, '#00FF00 → RGB');
assertEqual(hexToRgb('#0000FF'), { r: 0, g: 0, b: 255 }, '#0000FF → RGB');
assertEqual(hexToRgb('#000000'), { r: 0, g: 0, b: 0 }, '#000000 → RGB');
assertEqual(hexToRgb('#FFFFFF'), { r: 255, g: 255, b: 255 }, '#FFFFFF → RGB');
assertEqual(hexToRgb('#FF5733'), { r: 255, g: 87, b: 51 }, '#FF5733 → RGB');

// 3 位简写 HEX
assertEqual(hexToRgb('#F00'), { r: 255, g: 0, b: 0 }, '#F00 → RGB');
assertEqual(hexToRgb('#0F0'), { r: 0, g: 255, b: 0 }, '#0F0 → RGB');
assertEqual(hexToRgb('#00F'), { r: 0, g: 0, b: 255 }, '#00F → RGB');
assertEqual(hexToRgb('#FFF'), { r: 255, g: 255, b: 255 }, '#FFF → RGB');
assertEqual(hexToRgb('#000'), { r: 0, g: 0, b: 0 }, '#000 → RGB');
assertEqual(hexToRgb('#F53'), { r: 255, g: 85, b: 51 }, '#F53 → RGB');

// HEX round-trip
assertEqual(hexToRgb(rgbToHex(180, 120, 60)), { r: 180, g: 120, b: 60 }, 'RGB→HEX→RGB round-trip');
assertEqual(rgbToHex(hexToRgb('#AABBCC').r, hexToRgb('#AABBCC').g, hexToRgb('#AABBCC').b), '#AABBCC', 'HEX→RGB→HEX round-trip');

// ============================================================
// 边界值测试 — 特殊情况
// ============================================================

console.log('\n--- 边界值测试 ---');

// RGB 最小值最大值
result = rgbToHsv(0, 0, 0);
assert(result.h === 0 && result.s === 0 && result.v === 0, 'RGB(0,0,0) → HSV(0,0,0)');

result = rgbToHsv(255, 255, 255);
assert(result.s === 0 && result.v === 100, 'RGB(255,255,255) → HSV s=0, v=100');

result = rgbToHsl(0, 0, 0);
assert(result.h === 0 && result.s === 0 && result.l === 0, 'RGB(0,0,0) → HSL(0,0,0)');

result = rgbToHsl(255, 255, 255);
assert(result.s === 0 && result.l === 100, 'RGB(255,255,255) → HSL s=0, l=100');

// HSV 边界
result = hsvToRgb(0, 0, 0);
assert(result.r === 0 && result.g === 0 && result.b === 0, 'HSV(0,0,0) → RGB(0,0,0)');

result = hsvToRgb(360, 100, 100);
assertEqual(result, { r: 255, g: 0, b: 0 }, 'HSV(360,100,100) → RGB 纯红 (h=360 折回)');

// HSL 边界
result = hslToRgb(0, 0, 0);
assert(result.r === 0 && result.g === 0 && result.b === 0, 'HSL(0,0,0) → RGB(0,0,0)');

result = hslToRgb(360, 100, 50);
assertEqual(result, { r: 255, g: 0, b: 0 }, 'HSL(360,100,50) → RGB 纯红 (h=360 折回)');

// ============================================================
// 汇总
// ============================================================

console.log(`\n========================================`);
console.log(`结果: ${passed} 通过, ${failed} 失败`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
