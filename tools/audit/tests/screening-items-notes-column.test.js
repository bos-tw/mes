'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const config = fs.readFileSync(path.join(ROOT, 'core', 'configs', 'screening_items.config.js'), 'utf8');
const moduleScript = fs.readFileSync(path.join(ROOT, 'js', 'screening_items.js'), 'utf8');

const columnsSection = config.split('columns: [')[1].split('],')[0];
const columns = Array.from(columnsSection.matchAll(/key:\s*'([^']+)'/g), (match) => match[1]);
const nameIndex = columns.indexOf('name');
const notesIndex = columns.indexOf('notes');

assert.ok(nameIndex >= 0, '受篩產品欄位必須保留產品規格');
assert.strictEqual(notesIndex, nameIndex + 1, '備註必須獨立為產品規格右側欄位');
assert.ok(columnsSection.includes("{ key: 'notes', label: '備註', sortable: true, selectable: true }"), '備註必須納入欄位設定');
assert.ok(moduleScript.includes('<td>${escapeHtml(item.notes ?? \'-\')}</td>'), '列表必須把備註渲染為獨立儲存格');
assert.ok(!moduleScript.includes('table-secondary">${escapeHtml(item.notes)}'), '產品規格欄不可再內嵌備註');
assert.ok(moduleScript.includes('getTableColumnCount()'), '空白與載入列必須依目前表頭計算跨欄數');

console.log('screening-items-notes-column.test.js passed');
