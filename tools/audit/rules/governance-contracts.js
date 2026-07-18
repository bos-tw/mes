'use strict';

const fs = require('fs');
const path = require('path');

function walk(root, predicate = () => true) {
    if (!fs.existsSync(root)) return [];
    const output = [];
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        const absolute = path.join(root, entry.name);
        if (entry.isDirectory()) output.push(...walk(absolute, predicate));
        else if (predicate(absolute)) output.push(absolute);
    }
    return output;
}

function rel(root, file) {
    return path.relative(root, file).replace(/\\/g, '/');
}

function issue(rule, file, message, fix, category = '治理契約') {
    return { level: 'error', category, file, rule, message, fix };
}

function scanFailOpen(files) {
    const findings = [];
    for (const [file, source] of Object.entries(files)) {
        const patterns = [
            /permissions\.length\s*={2,3}\s*0\s*\)\s*\{[^}]{0,160}?return\s+true\s*;/g,
            /\$permissions\s*={2,3}\s*\[\]\s*\)\s*\{[^}]{0,160}?return\s+true\s*;/g,
            /empty\s*\(\s*\$permissions\s*\)\s*\)\s*\{[^}]{0,160}?return\s+true\s*;/g
        ];
        if (patterns.some(pattern => pattern.test(source))) {
            findings.push(issue('SEC-3 空權限 fail-open', file, '偵測到權限清單為空時回傳 true 的放行邏輯。', '空權限必須回傳 false；必要公開端點應使用明確白名單。', '安全性'));
        }
    }
    return findings;
}

function scanReadPermissionContracts({ root, files }) {
    const findings = [];
    const skipModules = new Set(['common', 'docs', 'profile', 'session', 'login', 'logout', 'healthcheck', 'diagnose']);
    const bootstrap = files['api/bootstrap.php'] || '';
    const centralContractOk = /'GET'\s*=>\s*'read'/.test(bootstrap)
        && /autoEnforcePermission\s*\(/.test(bootstrap)
        && /isAutomaticPermissionGranted/.test(bootstrap);
    if (!centralContractOk) {
        findings.push(issue('PERM-2 GET read permission', 'api/bootstrap.php', '集中權限閘門未明確將 GET 映射至 read。', '保留 GET/HEAD -> read 並呼叫 autoEnforcePermission。', '安全性'));
        return findings;
    }

    function importsBootstrap(file, visited = new Set()) {
        if (visited.has(file)) return false;
        visited.add(file);
        const source = files[file] || '';
        if (/bootstrap\.php/.test(source)) return true;
        const directory = path.posix.dirname(file);
        for (const match of source.matchAll(/require(?:_once)?\s+__DIR__\s*\.\s*['"]([^'"]+\.php)['"]/g)) {
            const imported = path.posix.normalize(path.posix.join(directory, match[1]));
            if (importsBootstrap(imported, visited)) return true;
        }
        return false;
    }

    for (const [file, source] of Object.entries(files)) {
        const match = file.match(/^api\/([^/]+)\/([^/]+\.php)$/);
        if (!match || skipModules.has(match[1]) || /\/(helpers|validation)\.php$/.test(file)) continue;
        const handlesGet = /(?:REQUEST_METHOD|getRequestMethod\s*\(\))/.test(source) && /['"]GET['"]/.test(source)
            || /\/(?:index|show|list|get|export|search|stats|options|public)\.php$/.test(file);
        if (!handlesGet) continue;
        if (/generate-api-docs\.php$/.test(file)) continue;
        const guarded = importsBootstrap(file)
            || /requirePermission\s*\(\s*['"][^'"]+\.read['"]/.test(source);
        if (!guarded) {
            findings.push(issue('PERM-2 GET read permission', file, 'GET 端點未載入集中 bootstrap，也沒有明確執行模組 read permission。', '載入 api/bootstrap.php，或明確 requirePermission("{module}.read")。', '安全性'));
        }
    }
    return findings;
}

function scanApiPermissionRegistration({ files }) {
    const findings = [];
    const bootstrap = files['api/bootstrap.php'] || '';
    const mappedModules = new Set(
        [...bootstrap.matchAll(/['"]([^'"]+)['"]\s*=>\s*['"][^'"]+['"]/g)].map(match => match[1])
    );
    const skipModules = new Set([
        'common', 'docs', 'profile', 'session', 'login', 'logout', 'healthcheck', 'diagnose',
        'dashboard', 'status_board', 'workflow_guard'
    ]);
    const moduleFiles = new Map();

    for (const [file, source] of Object.entries(files)) {
        const match = file.match(/^api\/([^/]+)\/([^/]+\.php)$/);
        if (!match || /\/(helpers|validation)\.php$/.test(file)) continue;
        if (!moduleFiles.has(match[1])) moduleFiles.set(match[1], []);
        moduleFiles.get(match[1]).push({ file, source });
    }

    for (const [module, endpoints] of moduleFiles) {
        if (skipModules.has(module)) continue;
        if (!endpoints.some(({ source }) => /requireAuth\s*\(\)|requirePermission\s*\(/.test(source))) continue;
        if (!mappedModules.has(module) && !endpoints.every(({ source }) => /requirePermission\s*\(/.test(source))) {
            findings.push(issue(
                'PERM-3 API module permission registration',
                `api/${module}`,
                `API 模組 ${module} 使用登入／權限保護，但未在 bootstrap legacy permission map 註冊。`,
                `在 api/bootstrap.php 註冊 ${module} 的正式權限映射，或讓每個端點明確呼叫 requirePermission。`,
                '安全性'
            ));
        }
    }

    for (const [file, source] of Object.entries(files)) {
        if (!/^api\/[^/]+\.php$/.test(file) || file === 'api/diagnose.php') continue;
        if (/requireAuth\s*\(\)/.test(source) && !/requirePermission\s*\(/.test(source)) {
            findings.push(issue(
                'PERM-3 top-level API permission contract',
                file,
                '頂層 API 只驗證登入，未明確限制敏感操作權限。',
                '加入正式 requirePermission，並將讀取／寫入授權寫入端點契約。',
                '安全性'
            ));
        }
    }

    return findings;
}

function scanSqlSchemaContracts(files, schema) {
    const findings = [];
    const tables = schema?.tables || {};
    const reserved = new Set(['where', 'set', 'values', 'left', 'right', 'inner', 'outer', 'join', 'on', 'order', 'group', 'limit', 'having', 'union', 'as']);
    const seen = new Set();
    const add = (file, table, column) => {
        const key = `${file}|${table}|${column}`;
        if (seen.has(key) || !tables[table] || tables[table][column]) return;
        seen.add(key);
        findings.push(issue('SCHEMA-1 SQL/schema contract', file, `SQL 引用不存在的欄位 ${table}.${column}。`, '修正 SQL 欄位名稱，或先以 migration 與 schema contract 正式新增欄位。', '資料完整性'));
    };

    for (const [file, source] of Object.entries(files)) {
        if (!file.startsWith('api/') || !file.endsWith('.php')) continue;
        const sqlBlocks = [...source.matchAll(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gs)]
            .map(match => match[0])
            .filter(value => /\b(?:SELECT|FROM|JOIN|INSERT|UPDATE|DELETE|WHERE|SET)\b/i.test(value));
        for (const sqlSource of sqlBlocks) {
            const aliases = new Map();
            for (const match of sqlSource.matchAll(/\b(?:FROM|JOIN|UPDATE|INTO)\s+`?([a-z][a-z0-9_]*)`?(?:\s+(?:AS\s+)?([a-z][a-z0-9_]*))?/gi)) {
                const table = match[1].toLowerCase();
                const alias = (match[2] || table).toLowerCase();
                if (tables[table] && !reserved.has(alias)) aliases.set(alias, table);
                if (tables[table]) aliases.set(table, table);
            }
            for (const match of sqlSource.matchAll(/\b([a-z][a-z0-9_]*)\.`?([a-z][a-z0-9_]*)`?/gi)) {
                const table = aliases.get(match[1].toLowerCase());
                if (table) add(file, table, match[2].toLowerCase());
            }
            for (const match of sqlSource.matchAll(/\bINSERT\s+INTO\s+`?([a-z][a-z0-9_]*)`?\s*\(([^)]+)\)/gi)) {
                const table = match[1].toLowerCase();
                if (!tables[table] || /[$%'".]/.test(match[2])) continue;
                match[2].split(',').map(value => value.replace(/[`\s]/g, '').toLowerCase()).filter(Boolean).forEach(column => add(file, table, column));
            }
        }
    }
    return findings;
}

function scanMenuContracts(files) {
    const findings = [];
    const index = files['index.php'] || '';
    const manifest = files['core/module-assets.js'] || '';
    for (const match of index.matchAll(/<a[^>]+data-page="([^"]+)"[^>]*data-title="([^"]*)"[^>]*>/g)) {
        const id = match[1];
        const title = match[2];
        if (/placeholder|todo|尚未完成|開發中/i.test(`${id} ${title}`)) {
            findings.push(issue('NAV-1 正式選單契約', 'index.php', `正式選單模組 ${id} 仍是 placeholder／開發中入口。`, '完成模組或從正式選單下架。', '前端'));
        }
        const hasInitializer = new RegExp(`(?:^|[,{\\s])${id}\\s*:`).test(manifest);
        const hasJs = Object.prototype.hasOwnProperty.call(files, `js/${id}.js`);
        const hasView = Object.prototype.hasOwnProperty.call(files, `modules/${id}.html`)
            || Object.prototype.hasOwnProperty.call(files, `core/configs/${id}.config.js`);
        if (!hasInitializer || !hasJs || !hasView) {
            findings.push(issue('NAV-1 正式選單契約', 'index.php', `選單模組 ${id} 缺少 ${[!hasInitializer && 'initializer manifest', !hasJs && 'JS', !hasView && 'HTML/config'].filter(Boolean).join('、')}。`, '補齊可運作模組資產，或從正式選單移除入口。', '前端'));
        }
    }
    return findings;
}

function scanStateContracts(files, schema) {
    const findings = [];
    const columns = schema?.tables?.work_orders || {};
    if (columns.status && columns.status_lookup_id) {
        findings.push(issue('STATE-1 單一狀態來源', 'DB: work_orders', 'work_orders 同時存在 status 與 status_lookup_id。', '以 status_lookup_id 為唯一狀態來源並移除 status。', '資料完整性'));
    }
    for (const [file, source] of Object.entries(files)) {
        if (!file.startsWith('api/') || !file.endsWith('.php')) continue;
        if (/\bwork_orders\s*\.\s*`?status`?\b/i.test(source) || /\bwo\s*\.\s*`?status`?\b/i.test(source)) {
            findings.push(issue('STATE-1 單一狀態來源', file, 'SQL 直接讀取已淘汰的 work_orders.status。', 'JOIN lookup_values 並使用 value_key 作為狀態。', '資料完整性'));
        }
    }
    return findings;
}

function scanInventorySourceContracts(files) {
    const requirements = new Map([
        ['api/inventory_items/index.php', /ensureInventoryItemSource\s*\(/],
        ['api/work_orders/partial_receipt.php', /ensureInventoryItemSource\s*\(/],
        ['api/work_orders/update.php', /ensureInventoryItemSource\s*\(/],
        ['api/return_order_items/helpers.php', /INSERT\s+INTO\s+inventory_item_sources/i],
        ['api/rescreen_batches/helpers.php', /INSERT\s+INTO\s+inventory_item_sources/i]
    ]);
    const findings = [];
    for (const [file, pattern] of requirements) {
        if (!pattern.test(files[file] || '')) {
            findings.push(issue('INV-1 庫存來源鏈', file, '庫存建立路徑未同步寫入 inventory_item_sources。', '在相同 transaction 呼叫 ensureInventoryItemSource 或寫入正式來源鏈。', '資料完整性'));
        }
    }
    const sync = files['tools/sync-local-schema.ps1'] || '';
    if (!/NOT\s+EXISTS\s*\(SELECT\s+1\s+FROM\s+inventory_items[\s\S]+inventory_item_sources/i.test(sync)) {
        findings.push(issue('INV-1 庫存來源鏈', 'tools/sync-local-schema.ps1', 'schema 同步未阻擋有效庫存缺少正式來源鏈。', '在 migration check 加入有效庫存 NOT EXISTS 來源鏈檢查。', '資料完整性'));
    }
    return findings;
}

function scanAuditImmutabilityContracts(files) {
    const findings = [];
    const endpoint = files['api/audit_logs/delete.php'] || '';
    const migration = files['migrations/2026_07_16_enforce_immutable_audit_logs.sql'] || '';
    const sync = files['tools/sync-local-schema.ps1'] || '';
    if (/DELETE\s+FROM\s+audit_logs/i.test(endpoint) || !/(405|410)/.test(endpoint)) {
        findings.push(issue('AUDIT-1 稽核不可變', 'api/audit_logs/delete.php', '稽核刪除端點仍可實體刪除，或未明確拒絕。', '端點固定回傳 405/410，清理需求另建受稽核 archive 流程。', '安全性'));
    }
    if (!/BEFORE\s+UPDATE[\s\S]+audit_logs/i.test(migration) || !/BEFORE\s+DELETE[\s\S]+audit_logs/i.test(migration)) {
        findings.push(issue('AUDIT-1 稽核不可變', 'migrations/2026_07_16_enforce_immutable_audit_logs.sql', '缺少 audit_logs UPDATE/DELETE 資料庫阻擋 trigger。', '建立 BEFORE UPDATE 與 BEFORE DELETE trigger。', '安全性'));
    }
    if (!/2026_07_16_enforce_immutable_audit_logs\.sql/.test(sync)) {
        findings.push(issue('AUDIT-1 稽核不可變', 'tools/sync-local-schema.ps1', '不可變稽核 migration 未納入 schema 同步。', '加入 migrationChecks 並驗證兩個 trigger。', '安全性'));
    }
    return findings;
}

function scanOutboxContracts(files) {
    const findings = [];
    for (const [file, source] of Object.entries(files)) {
        if (file.startsWith('migrations/') || file.startsWith('docs/') || file.startsWith('api/domain_event_outbox/')) continue;
        if (/\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+`?domain_event_outbox`?/i.test(source)) {
            findings.push(issue('OUTBOX-1 Outbox 契約', file, '發現 Outbox producer/consumer 寫入，但系統沒有正式發布契約。', '完成 producer、consumer、retry/dead-letter 契約，否則移除寫入。', '架構'));
        }
    }
    const index = files['index.php'] || '';
    if (/data-page="domain_event_outbox"/.test(index) || files['js/domain_event_outbox.js'] || files['core/configs/domain_event_outbox.config.js']) {
        findings.push(issue('OUTBOX-1 Outbox 契約', 'index.php', '已下架的 Outbox 再次出現在正式 UI 資產。', '保持舊 API 410，勿提供人工 CRUD。', '架構'));
    }
    return findings;
}

function scanCiContracts(files) {
    const findings = [];
    const workflow = files['.github/workflows/system-health-audit.yml'] || '';
    if (!files['tools/audit-frontend-assets.js'] || !/node tools\/audit-frontend-assets\.js/.test(workflow)) {
        findings.push(issue('ASSET-1 前端資產預算', '.github/workflows/system-health-audit.yml', '前端資產預算未納入 CI blocking。', '執行 tools/audit-frontend-assets.js 並保留非零 exit code。', '效能'));
    }
    if (!/vendor\/bin\/phpunit[^\r\n]*/.test(workflow)) {
        findings.push(issue('TEST-1 PHPUnit blocking', '.github/workflows/system-health-audit.yml', 'CI 未執行 PHPUnit，無法阻擋測試啟動失敗。', '加入獨立 PHPUnit step，不得使用 continue-on-error。', '測試'));
    }
    return findings;
}

function scanCssContracts(files) {
    const findings = [];
    const definitions = new Map();
    const cssFiles = Object.entries(files).filter(([file]) => file === 'styles.css' || file.startsWith('styles/'));

    for (const [file, source] of cssFiles) {
        for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;{}]+);/gi)) {
            definitions.set(match[1], { file, value: match[2].trim() });
        }
    }

    for (const [name, definition] of definitions) {
        if (new RegExp(`var\\(\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s*[,\\)])`).test(definition.value)) {
            findings.push(issue('CSS-1 token contract', definition.file, `CSS token ${name} 直接引用自己，瀏覽器會將其視為無效值。`, '恢復實際值或改為引用另一個已定義 token。', '前端'));
        }
    }

    for (const [file, source] of cssFiles) {
        for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,\s*[^)]+)?\)/gi)) {
            if (!definitions.has(match[1]) && !match[2]) {
                findings.push(issue('CSS-1 token contract', file, `CSS 引用未定義且沒有 fallback 的 token ${match[1]}。`, '定義該 token，或提供不改變既有版面的 fallback。', '前端'));
            }
        }
    }

    const index = files['index.php'] || '';
    for (const match of index.matchAll(/<link[^>]+href="(?!https?:\/\/)([^"?]+\.css)(?:\?[^" ]*)?"/gi)) {
        if (!Object.prototype.hasOwnProperty.call(files, match[1])) {
            findings.push(issue('CSS-1 token contract', 'index.php', `入口引用不存在的 CSS：${match[1]}。`, '補齊檔案或移除入口引用。', '前端'));
        }
    }

    if (!/\$baseDir\s*\.\s*['"]\/styles['"]/.test(files['api/cache_version.php'] || '')) {
        findings.push(issue('CSS-1 token contract', 'api/cache_version.php', '前端 cache version 未掃描 styles 目錄，子樣式修改後瀏覽器可能沿用舊 CSS。', '將 $baseDir . \'/styles\' 納入 mesFrontendCacheScanTargets。', '前端'));
    }

    return findings;
}

function scanUiShellContracts(files) {
    const findings = [];
    const navigation = files['core/workspace-navigation.js'] || '';
    const feedback = files['core/feedback.js'] || '';
    const css = `${files['styles.css'] || ''}\n${files['styles/components.css'] || ''}\n${files['styles/workspaces.css'] || ''}`;

    if (/(?:RECENTS_KEY|data-workspace-recents|workspace-flow|mes_workspace_recents)/.test(navigation)) {
        findings.push(issue('UX-1 shell interaction contract', 'core/workspace-navigation.js', '側邊欄重新出現最近使用或流程圓形捷徑。', '保留搜尋與收藏；不要恢復未符合實際工作方式的快速流程區。', '前端'));
    }
    if (!/class="btn outline"\s+data-dialog-cancel/.test(feedback)
        || !/class="btn \$\{options\.danger === false \? 'primary' : 'danger'\}"\s+data-dialog-confirm/.test(feedback)) {
        findings.push(issue('UX-1 shell interaction contract', 'core/feedback.js', '共用確認框未使用系統 btn outline／primary／danger 按鈕規範。', '共用 modal 動作按鈕必須使用既有 .btn 語意樣式。', '前端'));
    }
    if (!/\.btn\.danger\s*\{/.test(css) || !/\.app-dialog-stage-neutral\s*\{/.test(css)) {
        findings.push(issue('UX-1 shell interaction contract', 'styles.css', '共用確認框缺少危險按鈕或一般操作階段樣式。', '補齊 .btn.danger 與 .app-dialog-stage-neutral。', '前端'));
    }
    const favoriteRule = css.match(/\.workspace-favorite-toggle\s*\{([^}]*)\}/)?.[1] || '';
    if (!/top:\s*50%/.test(favoriteRule)
        || !/transform:\s*translateY\(-50%\)/.test(favoriteRule)
        || !/z-index:\s*[1-9]/.test(favoriteRule)) {
        findings.push(issue('UX-1 shell interaction contract', 'styles/workspaces.css', '收藏星號缺少明確垂直定位或點擊層級，可能錯位到下一列並失去點擊功能。', '保留 top: 50%、translateY(-50%) 與正 z-index，讓星號固定在所屬選單列。', '前端'));
    }
    const flyoutRule = css.match(/\.workspace-favorites-flyout\s*\{([^}]*)\}/)?.[1] || '';
    if (!/position:\s*fixed/.test(flyoutRule)
        || !/document\.body\.appendChild\(favoritesFlyout\)/.test(navigation)
        || !/aria-expanded/.test(navigation)
        || !/event\.key\s*===\s*'Escape'/.test(navigation)
        || !/data-workspace-open/.test(navigation)
        || !/data-remove-favorite/.test(navigation)
        || !/addEventListener\('pointerdown'/.test(navigation)) {
        findings.push(issue('UX-1 shell interaction contract', 'core/workspace-navigation.js', '我的收藏未使用可離開側邊欄裁切區的右側飛出選單，或缺少關閉與鍵盤契約。', '收藏清單應以 fixed portal 掛到 body，並保留 aria-expanded、點擊外部及 Escape 關閉。', '前端'));
    }
    return findings;
}

function scanUpdateNotificationContracts(files) {
    const findings = [];
    const script = files['script.js'] || '';
    const css = `${files['styles.css'] || ''}\n${files['styles/components.css'] || ''}`;
    const versionApi = files['api/version.php'] || '';

    if (/autoReloadForVersion|mes_auto_reloaded_asset_version/.test(script)
        || !/showUpdateBanner\(ver\)/.test(script)
        || !/SNOOZE_DURATION_MS\s*=/.test(script)) {
        findings.push(issue('UPDATE-1 frontend update contract', 'script.js', '版本差異未穩定採用「提示使用者／稍後提醒」流程，或又恢復自動強制重載。', '版本不一致時顯示持續通知，由使用者選擇立即更新或稍後提醒。', '前端'));
    }
    if (!/AppUnsavedChanges/.test(script)
        || !/__MES_ALLOW_UPDATE_RELOAD__/.test(script)
        || !/MAX_RELOAD_RETRIES\s*=\s*1/.test(script)
        || !/BroadcastChannel/.test(script)) {
        findings.push(issue('UPDATE-1 frontend update contract', 'script.js', '更新重載缺少未儲存資料防護、跨分頁同步或有限重試。', '保留 AppUnsavedChanges 防護、BroadcastChannel 同步及最多一次補救重載。', '資料完整性'));
    }
    if (/serviceWorker\.getRegistrations\s*\(|registrations\.map\([^)]*unregister/.test(script)
        || !/OWNED_CACHE_PREFIXES/.test(script)
        || !/searchParams\.set\('_asset_version'/.test(script)) {
        findings.push(issue('UPDATE-1 frontend update contract', 'script.js', '更新流程可能清除非本系統快取，或未用版本化 URL 強制載入新資產。', '只清理由本系統命名的 CacheStorage，並以 _asset_version 產生新的資產請求。', '前端'));
    }
    if (!/\.app-update-banner\s*\{/.test(css)
        || !/'btn outline'/.test(script)
        || !/'btn primary'/.test(script)
        || /app-update-banner[\s\S]{0,1000}style\.cssText/.test(script)) {
        findings.push(issue('UPDATE-1 frontend update contract', 'styles/components.css', '更新提示未遵循共用元件與按鈕樣式規範。', '使用 .app-update-banner 與既有 btn outline／primary 語意樣式，不得注入 inline style。', '前端'));
    }
    if (!/'build_id'\s*=>/.test(versionApi)
        || !/'released_at'\s*=>/.test(versionApi)
        || !/'required'\s*=>/.test(versionApi)
        || !/Cache-Control:\s*no-cache,\s*no-store/.test(versionApi)) {
        findings.push(issue('UPDATE-1 frontend update contract', 'api/version.php', '版本 API 缺少部署識別、發布時間、更新等級或 no-store 契約。', '回傳 build_id、released_at、required，並禁止快取版本端點。', '前端'));
    }
    return findings;
}

function loadRepositoryFiles(root) {
    const files = {};
    const roots = ['api', 'core', 'js', 'modules', 'migrations', 'tools', 'styles', '.github/workflows'];
    for (const item of roots) {
        const absolute = path.join(root, item);
        for (const file of walk(absolute, candidate => /\.(php|js|html|css|ps1|sql|ya?ml)$/.test(candidate))) {
            files[rel(root, file)] = fs.readFileSync(file, 'utf8');
        }
    }
    for (const file of ['index.php', 'script.js', 'styles.css']) {
        const absolute = path.join(root, file);
        if (fs.existsSync(absolute)) files[file] = fs.readFileSync(absolute, 'utf8');
    }
    return files;
}

function runGovernanceContracts(root) {
    const files = loadRepositoryFiles(root);
    const contractPath = path.join(root, 'tools/schema-contract.json');
    const schema = fs.existsSync(contractPath) ? JSON.parse(fs.readFileSync(contractPath, 'utf8')) : { tables: {} };
    const findings = [];
    if (!Object.keys(schema.tables || {}).length) {
        findings.push(issue('SCHEMA-1 SQL/schema contract', 'tools/schema-contract.json', '找不到可用的實際 schema contract。', '執行 php tools/export-schema-contract.php --write tools/schema-contract.json。', '資料完整性'));
    }
    const productionPermissionFiles = Object.fromEntries(Object.entries(files).filter(([file]) => file === 'script.js' || file.startsWith('api/') || file.startsWith('js/')));
    findings.push(...scanFailOpen(productionPermissionFiles));
    findings.push(...scanReadPermissionContracts({ root, files }));
    findings.push(...scanApiPermissionRegistration({ files }));
    findings.push(...scanSqlSchemaContracts(files, schema));
    findings.push(...scanMenuContracts(files));
    findings.push(...scanStateContracts(files, schema));
    findings.push(...scanInventorySourceContracts(files));
    findings.push(...scanAuditImmutabilityContracts(files));
    const productionOutboxFiles = Object.fromEntries(Object.entries(files).filter(([file]) => file === 'index.php' || file.startsWith('api/') || file.startsWith('js/') || file.startsWith('core/')));
    findings.push(...scanOutboxContracts(productionOutboxFiles));
    findings.push(...scanCiContracts(files));
    findings.push(...scanCssContracts(files));
    findings.push(...scanUiShellContracts(files));
    findings.push(...scanUpdateNotificationContracts(files));
    return findings;
}

module.exports = {
    runGovernanceContracts,
    scanAuditImmutabilityContracts,
    scanCiContracts,
    scanCssContracts,
    scanFailOpen,
    scanInventorySourceContracts,
    scanApiPermissionRegistration,
    scanMenuContracts,
    scanOutboxContracts,
    scanReadPermissionContracts,
    scanSqlSchemaContracts,
    scanStateContracts,
    scanUpdateNotificationContracts,
    scanUiShellContracts
};
