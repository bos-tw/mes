'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const modalHtml = fs.readFileSync(path.join(ROOT, 'modules', 'order_items.html'), 'utf8');
const ordersScript = fs.readFileSync(path.join(ROOT, 'js', 'orders.js'), 'utf8');
const orderItemsScript = fs.readFileSync(path.join(ROOT, 'js', 'order_items.js'), 'utf8');

const requiredModalContracts = [
    'data-order-items-modal',
    'name="screening_item_id"',
    'data-screening-create-panel',
    'name="total_weight_kg"',
    'name="customer_batch_number"',
    'data-drawings-rows',
    'data-attachments-rows',
    'data-tools-rows',
    'data-services-rows',
    'data-metrics',
];

requiredModalContracts.forEach((contract) => {
    assert.ok(modalHtml.includes(contract), `完整客戶批號 Modal 缺少契約：${contract}`);
});

assert.ok(
    ordersScript.includes('fetch(`modules/order_items.html'),
    '訂單主表必須直接載入 modules/order_items.html 的完整 Modal',
);
assert.ok(
    ordersScript.includes('editor.openCreate(getOrderContext(orderId))'),
    '訂單主表新增明細必須呼叫共用完整編輯器',
);
assert.ok(
    ordersScript.includes('editor.openEdit(getOrderContext(orderId), orderItemId)'),
    '訂單主表編輯明細必須呼叫共用完整編輯器',
);
assert.ok(!ordersScript.includes('OrderItemQuickEditor'), '訂單主表禁止重新接回縮水快速表單');
assert.ok(!ordersScript.includes('loadOrderItemQuickEditor'), '訂單主表禁止載入縮水快速表單');
assert.ok(orderItemsScript.includes('editorOnly'), 'order_items 必須保留 editor-only 共用模式');
assert.ok(orderItemsScript.includes('orderItemsController'), 'order_items 必須公開共用 Modal 控制器');
assert.ok(orderItemsScript.includes("'api/order_items/index.php'"), '共用新增流程必須使用正式訂單明細 API');

console.log('order-item-editor-parity.test.js passed');
