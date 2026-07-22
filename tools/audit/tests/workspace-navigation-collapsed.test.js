'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const navigation = fs.readFileSync(path.join(root, 'core', 'workspace-navigation.js'), 'utf8');
const shell = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const workspaceStyles = fs.readFileSync(path.join(root, 'styles', 'workspaces.css'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

assert.ok(navigation.includes('data-workspace-search-trigger'), '縮小側欄必須提供搜尋圖示觸發器');
assert.ok(navigation.includes('workspace-search-flyout'), '縮小側欄搜尋必須沿用工作區快顯框');
assert.ok(navigation.includes('openCollapsedMenu'), '含子項目的縮小側欄選單必須支援快顯功能清單');
assert.ok(navigation.includes('window.WorkspaceNavigation'), '側欄收合行為必須能呼叫共用快顯控制器');
assert.ok(shell.includes('window.WorkspaceNavigation?.openCollapsedMenu(this)'), '縮小側欄點選含子項目的選單不可展開完整側欄');
assert.ok(workspaceStyles.includes('.workspace-favorites-trigger.workspace-search-trigger {\n    display: none;'), '展開側欄不可重複顯示搜尋圖示觸發器');
assert.ok(workspaceStyles.includes('.app-container.sidebar-collapsed .workspace-search {\n    display: none;'), '縮小側欄不可顯示會溢出的搜尋輸入框');
assert.ok(workspaceStyles.includes('.app-container.sidebar-collapsed .workspace-search-trigger {\n    display: flex;'), '縮小側欄搜尋必須改為圖示按鈕');
assert.ok(workspaceStyles.includes('.app-container.sidebar-collapsed .workspace-favorite-toggle {\n    display: none;'), '縮小側欄不可顯示與主選單重疊的收藏星號');
assert.ok(styles.includes('overflow-x: hidden;'), '側欄必須禁止水平溢出瀏覽器邊界');
assert.ok(styles.includes('background: var(--color-bg-disabled) !important;'), '展開訂單明細列必須使用較深的既有中性灰背景');

console.log('workspace-navigation-collapsed.test.js passed');
