/**
 * state.js 单元测试
 *
 * 验证 crossSection 子状态、事件和锁轴逻辑
 * 运行方式：node js/tests/state.test.js
 */

import {
  getState,
  getCrossSection,
  setColor,
  setCrossSection,
  subscribe
} from '../state.js';

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

function assertEqual(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label}: ${JSON.stringify(actual)} === ${JSON.stringify(expected)}`);
}

console.log('\n--- crossSection 状态 ---');

const state = getState();
assert('crossSection' in state, 'getState() 包含 crossSection');
assertEqual(getCrossSection(), {
  enabled: false,
  lockedAxis: null,
  lockedValue: 0,
  values: { x: 255, y: 87, z: 51 }
}, 'getCrossSection() 返回剖面状态深拷贝');

console.log('\n--- cross-section-change 事件 ---');

let crossSectionEventCount = 0;
const unsubscribe = subscribe('cross-section-change', () => {
  crossSectionEventCount++;
});

setCrossSection({ lockedAxis: 'x', lockedValue: 128 });
assert(crossSectionEventCount === 1, 'setCrossSection() 触发 cross-section-change');
assertEqual(getCrossSection(), {
  enabled: false,
  lockedAxis: 'x',
  lockedValue: 255,
  values: { x: 255, y: 87, z: 51 }
}, '切换 lockedAxis 时 lockedValue 重置为当前颜色对应分量');

unsubscribe();

console.log('\n--- 锁轴保持逻辑 ---');

setCrossSection({ enabled: true, lockedAxis: 'x', lockedValue: 200 });
setColor({ r: 10, g: 20, b: 30 });

const nextState = getState();
assert(nextState.color.r === 200, '锁定 x 轴时 setColor() 保持 r 不变');
assert(nextState.color.g === 20 && nextState.color.b === 30, '锁定 x 轴时 setColor() 更新其他两轴');

console.log(`\n========================================`);
console.log(`结果: ${passed} 通过, ${failed} 失败`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
