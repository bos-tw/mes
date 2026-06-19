'use strict';

const assert = require('assert');
const {
    getTemplateExpressions,
    isProvablySafeExpression,
    scanJsXssContent
} = require('../rules/frontend-xss');

assert.deepStrictEqual(
    scanJsXssContent('row.innerHTML = `<td>${item.customer_name}</td>`;'),
    [1]
);

assert.deepStrictEqual(
    scanJsXssContent('row.innerHTML = `<td>${escapeHtml(item.customer_name)}</td>`;'),
    []
);

assert.deepStrictEqual(
    scanJsXssContent('row.innerHTML = `<td>${formatNumber(item.quantity)}</td>`;'),
    []
);

assert.deepStrictEqual(
    scanJsXssContent('// row.innerHTML = `<td>${item.customer_name}</td>`;'),
    []
);

assert.deepStrictEqual(
    scanJsXssContent([
        'const html = `',
        '  <span>${item.customer_name}</span>',
        '`;'
    ].join('\n')),
    [2]
);

assert.deepStrictEqual(
    scanJsXssContent('<td>${index + 1}</td>'),
    []
);

assert.deepStrictEqual(
    scanJsXssContent('<td>${item.is_active ? \'啟用\' : \'停用\'}</td>'),
    []
);

assert.deepStrictEqual(
    scanJsXssContent('<td>${item.quantity.toLocaleString()}</td>'),
    []
);

assert.deepStrictEqual(
    scanJsXssContent('<td>${formatDecimal(item.length_mm)}</td>'),
    []
);

assert.deepStrictEqual(
    scanJsXssContent('<td>${getStatusLabel(item.status)}</td>'),
    [1]
);

assert.deepStrictEqual(
    getTemplateExpressions('<td>${index + 1}</td><td>${item.name}</td>'),
    ['index + 1', 'item.name']
);
assert.strictEqual(isProvablySafeExpression('safeEscapeHtml(item.name)'), true);
assert.strictEqual(isProvablySafeExpression('item.notes'), false);
assert.strictEqual(isProvablySafeExpression('valueOrDash(item.name)', 'customers.js'), true);
assert.strictEqual(isProvablySafeExpression('valueOrDash(item.name)', 'unknown.js'), false);
assert.strictEqual(isProvablySafeExpression('statusBadge', 'customers.js'), true);
assert.strictEqual(isProvablySafeExpression('statusBadge', 'unknown.js'), false);

console.log('frontend-xss.test.js passed');
