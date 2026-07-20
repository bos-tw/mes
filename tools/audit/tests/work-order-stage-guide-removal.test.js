'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const moduleAssets = fs.readFileSync(path.join(root, 'core/module-assets.js'), 'utf8');
const workOrders = fs.readFileSync(path.join(root, 'js/work_orders.js'), 'utf8');
const workspaceCss = fs.readFileSync(path.join(root, 'styles/workspaces.css'), 'utf8');

assert.doesNotMatch(moduleAssets, /work-orders\/(?:workspace|state-machine)\.js/, '工單模組不得重新載入六階段導引資源。');
assert.doesNotMatch(workOrders, /WorkOrder(?:Workspace|StateMachine)/, '工單主程式不得重新啟動六階段導引。');
assert.doesNotMatch(workspaceCss, /work-order-stage-(?:workspace|tabs|progress|help)|stage-marker|stage-complete/, '共用樣式不得殘留六階段導引元件。');
assert.ok(!fs.existsSync(path.join(root, 'js/work-orders/workspace.js')), '六階段導引程式應維持移除狀態。');
assert.ok(!fs.existsSync(path.join(root, 'js/work-orders/state-machine.js')), '僅供六階段導引使用的狀態映射應維持移除狀態。');

console.log('work-order-stage-guide-removal.test.js passed');
