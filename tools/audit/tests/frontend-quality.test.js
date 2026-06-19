'use strict';

const assert = require('assert');
const {
    classifyJsFileSize,
    scanModuleHtmlStyle
} = require('../rules/frontend-quality');

assert.strictEqual(classifyJsFileSize(999), null);
assert.strictEqual(classifyJsFileSize(1000), 'warning');
assert.strictEqual(classifyJsFileSize(1999), 'warning');
assert.strictEqual(classifyJsFileSize(2000), 'error');

const result = scanModuleHtmlStyle([
    '<button class="outline">搜尋</button>',
    '<button class="btn btn-icon">編輯</button>',
    '<table class="table-striped">',
    '<div style="width: 10px"></div>',
    '<div style="display:none"></div>',
    '<!-- <button class="danger">刪除</button> -->'
].join('\n'));

assert.deepStrictEqual(result.buttonMissingPrefix, [1]);
assert.deepStrictEqual(result.deprecatedButtonClass, [2]);
assert.deepStrictEqual(result.bootstrapTableClass, [3]);
assert.deepStrictEqual(result.inlineStyle, [4]);

console.log('frontend-quality.test.js passed');
