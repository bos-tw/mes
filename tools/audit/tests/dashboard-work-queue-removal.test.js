'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const dashboardConfig = fs.readFileSync(path.join(root, 'core/configs/dashboard.config.js'), 'utf8');
const dashboardScript = fs.readFileSync(path.join(root, 'js/dashboard.js'), 'utf8');
const workspaceCss = fs.readFileSync(path.join(root, 'styles/workspaces.css'), 'utf8');

assert.doesNotMatch(dashboardConfig, /dashboard-work-queue|data-dashboard-open|我的工作佇列/, '儀表板不得重新加入可由「我的收藏」取代的工作佇列。');
assert.doesNotMatch(dashboardScript, /data-dashboard-open|dashboardOpen/, '儀表板不得保留工作佇列的無效事件處理。');
assert.doesNotMatch(workspaceCss, /dashboard-work-queue/, '共用樣式不得殘留工作佇列規則。');

console.log('dashboard-work-queue-removal.test.js passed');
