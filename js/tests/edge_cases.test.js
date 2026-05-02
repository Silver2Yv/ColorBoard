/**
 * 剖面模式边缘案例测试（临时 QA 脚本）
 * 运行方式：node js/tests/edge_cases.test.js
 */

import {
    getCrossSection,
    setCrossSection,
    setColor,
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
    assert(JSON.stringify(actual) === JSON.stringify(expected),
        `${label}: ${JSON.stringify(actual)} === ${JSON.stringify(expected)}`);
}

// ============================================================
// Edge 1: setCrossSection({lockedAxis: null}) 解锁
// ============================================================
console.log('\n--- Edge 1: 通过 null lockedAxis 解锁 ---');

// 先锁定 x 轴
setCrossSection({ lockedAxis: 'x', lockedValue: 200 });
let cs = getCrossSection();
assert(cs.lockedAxis === 'x', '锁定 x 轴成功');
assert(cs.lockedValue === 255, 'lockedValue 重置为当前颜色 r 分量=255');

// 然后通过 null 解锁
setCrossSection({ lockedAxis: null });
cs = getCrossSection();
assert(cs.lockedAxis === null, '解锁后 lockedAxis 为 null');
assert(cs.enabled === false, '默认 enabled 保持 false');

// ============================================================
// Edge 2: 快速 lock/unlock 序列
// ============================================================
console.log('\n--- Edge 2: 快速 lock/unlock 序列 ---');

let eventCount = 0;
const unsub = subscribe('cross-section-change', () => { eventCount++; });

setCrossSection({ lockedAxis: 'x' });
setCrossSection({ lockedAxis: 'y' });
setCrossSection({ lockedAxis: 'z' });
setCrossSection({ lockedAxis: null });

assert(eventCount === 4, '4 次 setCrossSection 触发 4 次 cross-section-change 事件');

unsub();

// ============================================================
// Edge 3: 同时设置 enabled + lockedAxis + lockedValue
// ============================================================
console.log('\n--- Edge 3: enabled + lockedAxis + lockedValue 同时设置 ---');

setCrossSection({ enabled: true, lockedAxis: 'y', lockedValue: 128 });
cs = getCrossSection();

// 注意：切换 lockedAxis 时 lockedValue 会被重置为当前颜色的对应分量
// 当前颜色 r=200, g=20, b=30 (从之前的 state.test.js 后续状态)
// 所以 lockedValue 会被重置为 g=20
assert(cs.enabled === true, 'enabled 设为 true');
assert(cs.lockedAxis === 'y', 'lockedAxis 设为 y');
assert(cs.lockedValue === 20, `lockedValue 重置为 g 分量 (当前颜色 g=${cs.values.y})`);

// ============================================================
// Edge 4: 设置同一轴（不切换），检查 lockedValue 是否被保留
// ============================================================
console.log('\n--- Edge 4: 设置同一轴不重置 lockedValue ---');

setCrossSection({ lockedAxis: 'y', lockedValue: 77 });
cs = getCrossSection();
assert(cs.lockedAxis === 'y', 'lockedAxis 仍为 y');
assert(cs.lockedValue === 77, 'lockedValue 保留为 77 (未重置)');

// ============================================================
// Edge 5: 锁定后调用 setColor，验证锁轴保持
// ============================================================
console.log('\n--- Edge 5: 锁定轴时 setColor 保持分量 ---');

setCrossSection({ lockedAxis: 'z', lockedValue: 50 });
setColor({ r: 100, g: 150, b: 200 });

cs = getCrossSection();
assert(cs.values.z === 50, 'z 轴被锁，color 的 b 分量应保持为 50');

// ============================================================
// Edge 6: 禁用剖面后再 setColor，验证不再锁定
// ============================================================
console.log('\n--- Edge 6: 禁用剖面后不再锁轴 ---');

setCrossSection({ lockedAxis: null });
setColor({ r: 30, g: 60, b: 90 });

cs = getCrossSection();
assert(cs.lockedAxis === null, 'lockedAxis 为 null');
assert(cs.enabled === false, 'enabled 为 false');

console.log(`\n========================================`);
console.log(`结果: ${passed} 通过, ${failed} 失败`);
console.log(`========================================`);

if (failed > 0) {
    process.exit(1);
}
