'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const shell = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

assert.match(
    css,
    /--ui-table-action-size:\s*24px;[\s\S]*--ui-table-action-gap:\s*2px;/,
    '表格操作按鈕必須使用 24px compact 尺寸與 2px 緊密間距。'
);
assert.match(
    css,
    /\.table-actions\s*\{[^}]*gap:\s*var\(--ui-table-action-gap\);/s,
    '表格操作欄必須使用 compact spacing token。'
);
assert.match(
    css,
    /:is\(td\.table-actions,[^}]+\.op-action-btn\s*\{[^}]*width:\s*var\(--ui-table-action-size\);[^}]*min-width:\s*var\(--ui-table-action-size\);[^}]*height:\s*var\(--ui-table-action-size\);[^}]*min-height:\s*var\(--ui-table-action-size\);[^}]*font-size:\s*var\(--font-sm\);/s,
    '表格操作按鈕必須使用共用 compact 尺寸與字級 token。'
);
assert.match(
    shell,
    /const OPERATION_ACTION_CELL_SELECTOR = 'td\.table-actions, td\.actions, td\.actions-cell, td\.actions-col';/,
    '操作按鈕正規化必須涵蓋所有既有操作欄 class。'
);
assert.match(
    shell,
    /cell\.classList\.add\('table-actions'\);[\s\S]*cell\.querySelectorAll\(OPERATION_ACTION_SELECTOR\)\.forEach\(normalizeOperationActionElement\);/,
    '所有操作欄都必須套用共用 table-actions/op-action-btn 契約。'
);

console.log('table-action-density.test.js passed');
