'use strict';

const assert = require('assert');
const {
    createFinding,
    createFingerprint,
    extractRuleId
} = require('../core/finding');

assert.strictEqual(extractRuleId('J-2 innerHTML XSS'), 'J-2');
assert.strictEqual(extractRuleId('STRUCT API 結構'), 'STRUCT');

const securityFinding = createFinding({
    level: 'error',
    category: '安全性',
    file: 'api/bootstrap.php',
    rule: 'S-2 權限系統停用',
    message: '權限系統被停用',
    fix: '啟用權限系統'
});

assert.strictEqual(securityFinding.ruleId, 'S-2');
assert.strictEqual(securityFinding.severity, 'P0');
assert.strictEqual(securityFinding.baselineAllowed, false);
assert.strictEqual(securityFinding.classification, 'true-defect');
assert.strictEqual(securityFinding.remediation, '啟用權限系統');

const firstFingerprint = createFingerprint({
    ruleId: 'F-1',
    file: 'js/work_orders.js',
    message: 'work_orders.js 共 2,100 行'
});
const secondFingerprint = createFingerprint({
    ruleId: 'F-1',
    file: 'js/work_orders.js',
    message: 'work_orders.js 共 2,200 行'
});

assert.strictEqual(firstFingerprint, secondFingerprint);
assert.match(firstFingerprint, /^[a-f0-9]{20}$/);

const firstLineListFingerprint = createFingerprint({
    ruleId: 'J-2',
    file: 'js/work_orders.js',
    message: 'work_orders.js 在 L10, L20, L30 行有風險'
});
const secondLineListFingerprint = createFingerprint({
    ruleId: 'J-2',
    file: 'js/work_orders.js',
    message: 'work_orders.js 在 L10 行有風險'
});

assert.strictEqual(firstLineListFingerprint, secondLineListFingerprint);

const heuristicFinding = createFinding({
    level: 'warning',
    category: '架構',
    file: 'js/work_orders.js',
    rule: 'DS-1 CRUD 後未呼叫 notify',
    message: '可能缺少通知'
});

assert.strictEqual(heuristicFinding.severity, 'P2');
assert.strictEqual(heuristicFinding.confidence, 'low');
assert.strictEqual(heuristicFinding.classification, 'needs-review');

const policyDebtFinding = createFinding({
    level: 'error',
    category: '前端',
    file: 'js/work_orders.js',
    rule: 'F-1 JS 檔案過大',
    message: '檔案超過建議大小'
});

assert.strictEqual(policyDebtFinding.classification, 'policy-debt');

console.log('finding.test.js passed');
