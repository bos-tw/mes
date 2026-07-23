#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const migration = read('migrations/2026_07_22_add_order_item_expected_delivery.sql');
const helpers = read('api/order_items/helpers.php');
const createApi = read('api/order_items/index.php');
const updateApi = read('api/order_items/update.php');
const deleteApi = read('api/order_items/delete.php');
const copyApi = read('api/order_items/copy.php');
const orderUpdateApi = read('api/orders/update.php');
const ordersHelpers = read('api/orders/helpers.php');
const workOrderSources = [
    read('api/work_orders/show.php'),
    read('api/work_orders/helpers.php'),
    read('api/work_orders/search_order_items.php'),
    read('api/reports/screening_inspection.php'),
];
const orderItemsHtml = read('modules/order_items.html');
const workOrdersHtml = read('modules/work_orders.html');
const orderItemsScript = read('js/order_items.js');
const ordersScript = read('js/orders.js');
const ordersConfig = read('core/configs/orders.config.js');

[
    'expected_delivery_date',
    'expected_delivery_period',
    'idx_order_items_delivery_schedule',
    'UPDATE order_items oi',
].forEach((contract) => {
    assert.ok(migration.includes(contract), `交期 migration 缺少：${contract}`);
});

assert.ok(helpers.includes("$errors['expected_delivery_date'] = '細項交期格式不正確。'"), '細項交期必須通過日期格式驗證');
assert.ok(migration.includes('independent, manually maintained commitment'), 'migration 必須保留訂單主表交期的人工維護責任');
assert.ok(!migration.includes('UPDATE orders o'), 'migration 不可依細項判斷或回寫訂單主表交期');
assert.ok(!helpers.includes('function recalculateOrderFinalDelivery'), '細項 helper 不可自動彙總訂單主表交期');

[createApi, updateApi, deleteApi, copyApi].forEach((source, index) => {
    assert.ok(!source.includes('recalculateOrderFinalDelivery'), `細項寫入路徑 ${index + 1} 不可回寫訂單主表交期`);
});

workOrderSources.forEach((source, index) => {
    assert.ok(source.includes('oi.expected_delivery_date'), `工單交期來源 ${index + 1} 未讀取訂單細項`);
    assert.ok(!source.includes('o.expected_delivery_date'), `工單交期來源 ${index + 1} 仍誤用訂單主表`);
});

['name="expected_delivery_date"', 'name="expected_delivery_period"'].forEach((contract) => {
    assert.ok(orderItemsHtml.includes(contract), `客戶批號 Modal 缺少：${contract}`);
    assert.ok(workOrdersHtml.includes(contract), `工單 Modal 缺少唯讀交期資訊：${contract}`);
});
assert.ok(orderItemsScript.includes('state.orderContext?.expectedDeliveryDate'), '新增細項必須預帶訂單預設交期');
assert.ok(orderItemsScript.includes('expected_delivery_period: expectedDeliveryPeriodSelect'), '細項交期時段必須送入 API');
assert.ok(ordersHelpers.includes("if (array_key_exists('expected_delivery_date', $payload))"), '訂單 API 必須接受使用者輸入的預訂交期');
assert.ok(!orderUpdateApi.includes('訂單最終交期不可直接修改。'), '訂單更新 API 不可阻擋人工修改預訂交期');
assert.ok(!ordersScript.includes('active_order_item_count'), '訂單 UI 不可依細項數量鎖定預訂交期');
assert.ok(ordersScript.includes("input[name=\"expected_delivery_date\"]"), '訂單 UI 必須保留可提交的預訂交期欄位');
assert.ok(ordersConfig.includes("label: '預訂交期'"), '訂單主表欄名必須顯示預訂交期');
assert.ok(ordersConfig.includes('預訂交期由使用者自行維護'), '訂單 Modal 必須說明預訂交期由使用者維護');

console.log('order-item-delivery-contract.test.js passed');
