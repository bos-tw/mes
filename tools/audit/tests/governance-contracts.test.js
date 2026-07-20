'use strict';

const assert = require('assert');
const {
    scanAuditImmutabilityContracts,
    scanCiContracts,
    scanCssContracts,
    scanFailOpen,
    scanInventorySourceContracts,
    scanMenuContracts,
    scanOutboxContracts,
    scanReadPermissionContracts,
    scanSqlSchemaContracts,
    scanStateContracts,
    scanUpdateNotificationContracts,
    scanUiShellContracts
} = require('../rules/governance-contracts');

assert.strictEqual(scanFailOpen({ 'safe.js': 'if (permissions.length === 0) { return false; }' }).length, 0);
assert.strictEqual(scanFailOpen({ 'unsafe.js': 'if (permissions.length === 0) { return true; }' })[0].rule.startsWith('SEC-3'), true);

const permissionFiles = {
    'api/bootstrap.php': "'GET' => 'read'; autoEnforcePermission($employee); isAutomaticPermissionGranted([], 'x', 'read');",
    'api/orders/index.php': "require_once __DIR__ . '/../bootstrap.php'; if ($_SERVER['REQUEST_METHOD'] === 'GET') {}",
};
assert.strictEqual(scanReadPermissionContracts({ root: '.', files: permissionFiles }).length, 0);
assert.strictEqual(scanReadPermissionContracts({ root: '.', files: { ...permissionFiles, 'api/orders/index.php': "if ($_SERVER['REQUEST_METHOD'] === 'GET') {}" } }).length, 1);

const schema = { tables: { orders: { id: {}, customer_id: {} }, work_orders: { id: {}, status_lookup_id: {} } } };
assert.strictEqual(scanSqlSchemaContracts({ 'api/orders/index.php': '$sql = "SELECT o.id FROM orders o";' }, schema).length, 0);
assert.strictEqual(scanSqlSchemaContracts({ 'api/orders/index.php': '$sql = "SELECT o.missing FROM orders o";' }, schema).length, 1);

const menuFiles = {
    'index.php': '<a data-page="orders" data-title="接單">',
    'core/module-assets.js': 'const initializers = { orders: "initializeOrdersModule" };',
    'js/orders.js': 'window.initializeOrdersModule = () => {};',
    'core/configs/orders.config.js': 'ModuleConfig.register("orders", {});'
};
assert.strictEqual(scanMenuContracts(menuFiles).length, 0);
assert.strictEqual(scanMenuContracts({ ...menuFiles, 'core/module-assets.js': '' }).length, 1);

assert.strictEqual(scanStateContracts({}, schema).length, 0);
assert.strictEqual(scanStateContracts({}, { tables: { work_orders: { status: {}, status_lookup_id: {} } } }).length, 1);
assert.strictEqual(scanStateContracts({
    'api/dashboard/charts_data.php': '$sql = "SELECT status, COUNT(*) FROM work_orders GROUP BY status";'
}, schema).length, 1);
assert.strictEqual(scanStateContracts({
    'api/dashboard/charts_data.php': '$sql = "SELECT lv.value_key AS status, COUNT(*) FROM work_orders wo JOIN lookup_values lv ON lv.id = wo.status_lookup_id GROUP BY lv.value_key";'
}, schema).length, 0);

const inventoryFiles = {
    'api/inventory_items/index.php': 'ensureInventoryItemSource(',
    'api/work_orders/partial_receipt.php': 'ensureInventoryItemSource(',
    'api/work_orders/update.php': 'ensureInventoryItemSource(',
    'api/return_order_items/helpers.php': 'INSERT INTO inventory_item_sources',
    'api/rescreen_batches/helpers.php': 'INSERT INTO inventory_item_sources',
    'tools/sync-local-schema.ps1': 'NOT EXISTS(SELECT 1 FROM inventory_items ii WHERE NOT EXISTS(SELECT 1 FROM inventory_item_sources iis))'
};
assert.strictEqual(scanInventorySourceContracts(inventoryFiles).length, 0);
assert.strictEqual(scanInventorySourceContracts({ ...inventoryFiles, 'api/work_orders/update.php': '' }).length, 1);

const auditFiles = {
    'api/audit_logs/delete.php': 'http_response_code(405);',
    'migrations/2026_07_16_enforce_immutable_audit_logs.sql': 'BEFORE UPDATE ON audit_logs; BEFORE DELETE ON audit_logs;',
    'tools/sync-local-schema.ps1': '2026_07_16_enforce_immutable_audit_logs.sql'
};
assert.strictEqual(scanAuditImmutabilityContracts(auditFiles).length, 0);
assert.strictEqual(scanAuditImmutabilityContracts({ ...auditFiles, 'api/audit_logs/delete.php': 'DELETE FROM audit_logs' }).length > 0, true);

assert.strictEqual(scanOutboxContracts({ 'api/orders/index.php': 'SELECT 1' }).length, 0);
assert.strictEqual(scanOutboxContracts({ 'api/orders/index.php': 'INSERT INTO domain_event_outbox (id) VALUES (1)' }).length, 1);

const ciFiles = {
    'tools/audit-frontend-assets.js': 'process.exit(0);',
    '.github/workflows/system-health-audit.yml': 'run: node tools/audit-frontend-assets.js\nrun: vendor/bin/phpunit --configuration phpunit.xml'
};
assert.strictEqual(scanCiContracts(ciFiles).length, 0);
assert.strictEqual(scanCiContracts({ ...ciFiles, '.github/workflows/system-health-audit.yml': '' }).length, 2);

const cssFiles = {
    'index.php': '<link rel="stylesheet" href="styles/tokens.css?v=1"><link rel="stylesheet" href="styles.css?v=1">',
    'api/cache_version.php': "$baseDir . '/styles'",
    'styles/tokens.css': ':root { --ui-radius-pill: 999px; }',
    'styles.css': '.pill { border-radius: var(--ui-radius-pill); }'
};
assert.strictEqual(scanCssContracts(cssFiles).length, 0);
assert.strictEqual(scanCssContracts({ ...cssFiles, 'styles/tokens.css': ':root { --ui-radius-pill: var(--ui-radius-pill); }' }).length, 1);
assert.strictEqual(scanCssContracts({ ...cssFiles, 'styles.css': '.pill { border-radius: var(--missing); }' }).length, 1);
assert.strictEqual(scanCssContracts({ ...cssFiles, 'api/cache_version.php': '' }).length, 1);

const uiShellFiles = {
    'core/workspace-navigation.js': "const FAVORITES_KEY = 'favorites'; favoritesFlyout.className = 'workspace-favorites-flyout'; document.body.appendChild(favoritesFlyout); trigger.setAttribute('aria-expanded', 'true'); if (event.key === 'Escape') close(); event.target.closest('[data-workspace-open]'); event.target.closest('[data-remove-favorite]'); document.addEventListener('pointerdown', close);",
    'core/feedback.js': '<button type="button" class="btn outline" data-dialog-cancel>取消</button><button type="button" class="btn ${options.danger === false ? \'primary\' : \'danger\'}" data-dialog-confirm>確認</button>',
    'styles.css': '.btn.danger { color: white; }',
    'styles/components.css': '.app-dialog-stage-neutral { color: green; }',
    'styles/workspaces.css': '.workspace-favorite-toggle { position: absolute; z-index: 2; top: 50%; transform: translateY(-50%); } .workspace-favorites-flyout { position: fixed; }'
};
assert.strictEqual(scanUiShellContracts(uiShellFiles).length, 0);
assert.strictEqual(scanUiShellContracts({ ...uiShellFiles, 'core/workspace-navigation.js': `${uiShellFiles['core/workspace-navigation.js']} const RECENTS_KEY = "recent";` }).length, 1);
assert.strictEqual(scanUiShellContracts({ ...uiShellFiles, 'core/feedback.js': '<button>取消</button>' }).length, 1);
assert.strictEqual(scanUiShellContracts({ ...uiShellFiles, 'styles/workspaces.css': '.workspace-favorite-toggle { position: absolute; } .workspace-favorites-flyout { position: fixed; }' }).length, 1);
assert.strictEqual(scanUiShellContracts({ ...uiShellFiles, 'core/workspace-navigation.js': '<details><summary>我的收藏</summary></details>' }).length, 1);

const updateFiles = {
    'script.js': `
        const SNOOZE_DURATION_MS = 15;
        const MAX_RELOAD_RETRIES = 1;
        const OWNED_CACHE_PREFIXES = ['mes-'];
        new BroadcastChannel('mes-app-version');
        window.AppUnsavedChanges.hasAny();
        window.__MES_ALLOW_UPDATE_RELOAD__ = true;
        url.searchParams.set('_asset_version', version);
        showUpdateBanner(ver);
        button.className = 'btn outline';
        button.className = 'btn primary';`,
    'styles/components.css': '.app-update-banner { display: flex; }',
    'api/version.php': "header('Cache-Control: no-cache, no-store, must-revalidate'); 'build_id' => $version; 'released_at' => $date; 'required' => false;"
};
assert.strictEqual(scanUpdateNotificationContracts(updateFiles).length, 0);
assert.strictEqual(scanUpdateNotificationContracts({
    ...updateFiles,
    'script.js': "async function autoReloadForVersion() { const registrations = await navigator.serviceWorker.getRegistrations(); showUpdateBanner(ver); }"
}).length > 0, true);
assert.strictEqual(scanUpdateNotificationContracts({ ...updateFiles, 'api/version.php': '' }).length, 1);

console.log('governance-contracts.test.js passed');
