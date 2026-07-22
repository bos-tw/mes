'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const styles = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const tokenStandard = fs.readFileSync(path.join(ROOT, '.github', 'standards', 'ui-tokens.md'), 'utf8');
const componentStandard = fs.readFileSync(path.join(ROOT, '.github', 'standards', 'ui-components.md'), 'utf8');

assert.ok(
    styles.includes('--ui-modal-top-offset: clamp(var(--spacing-xl), 7.5vh, calc(var(--spacing-3xl) * 2));'),
    '全系統 Modal 必須使用正式上緣 offset token',
);

const overlayMatch = styles.match(/\.modal-overlay\s*\{([\s\S]*?)\}/);
assert.ok(overlayMatch, '缺少共用 .modal-overlay 樣式');
const overlayStyles = overlayMatch[1];

assert.ok(/align-items:\s*flex-start;/.test(overlayStyles), 'Modal overlay 必須固定由上緣開始排列');
assert.ok(!/align-items:\s*center;/.test(overlayStyles), 'Modal overlay 不可垂直置中，以免內容高度變化造成跳動');
assert.ok(
    /padding:\s*var\(--ui-modal-top-offset\) var\(--spacing-xl\) var\(--spacing-xl\);/.test(overlayStyles),
    'Modal overlay 必須使用正式上緣與既有水平／下緣 spacing token',
);
assert.ok(/overflow-y:\s*auto;/.test(overlayStyles), '固定上緣後 overlay 必須允許小螢幕垂直捲動');
assert.ok(/overscroll-behavior:\s*contain;/.test(overlayStyles), 'Modal overlay 必須限制捲動鏈傳遞至背景頁面');
assert.ok(tokenStandard.includes('`--ui-modal-top-offset`'), 'UI token 規範必須登錄 Modal 上緣 token');
assert.ok(componentStandard.includes('禁止模組自行改回垂直置中'), 'Modal 元件規範必須禁止局部恢復垂直置中');

console.log('modal-top-alignment.test.js passed');
