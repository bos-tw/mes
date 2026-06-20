#!/usr/bin/env node
/**
 * DataSync audit tool.
 *
 * Scans frontend modules for DataSync subscription, notification, dependency,
 * and UI state refresh risks. This tool is intentionally static: it gives us a
 * reliable project-wide map before we start patching modules one by one.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');
const DATA_SYNC_FILE = path.join(JS_DIR, 'data-sync.js');
const DEFAULT_REPORT = path.join(ROOT, 'docs', 'data-sync-audit.md');

const EXCLUDED_FILES = new Set([
    'utils.js',
    'data-sync.js',
    'column_manager.js',
    'order_item_quick_editor.js'
]);

const CORE_MODULES = new Set([
    'orders',
    'order_items',
    'work_orders',
    'inventory_items',
    'shipping_orders',
    'shipping_order_items',
    'return_orders'
]);

const BUTTON_STATE_PATTERNS = [
    /data-action=/,
    /\.disabled\s*=/,
    /disabled\b/,
    /aria-disabled/,
    /can[A-Z]\w+/,
    /has[A-Z]\w+/,
    /lifecycle_locked/,
    /status[_A-Za-z]*\s*[=!]==?/
];

const CRUD_PATTERNS = {
    post: /method\s*:\s*['"]POST['"]/,
    put: /method\s*:\s*['"]PUT['"]/,
    patch: /method\s*:\s*['"]PATCH['"]/,
    delete: /method\s*:\s*['"]DELETE['"]/
};

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function listModuleFiles() {
    return fs.readdirSync(JS_DIR)
        .filter((file) => file.endsWith('.js'))
        .filter((file) => !file.endsWith('.bak'))
        .filter((file) => !EXCLUDED_FILES.has(file))
        .sort();
}

function extractObjectLiteral(source, marker) {
    const markerIndex = source.indexOf(marker);
    if (markerIndex === -1) {
        return null;
    }

    const start = source.indexOf('{', markerIndex);
    if (start === -1) {
        return null;
    }

    let depth = 0;
    let inString = false;
    let stringQuote = '';
    let escaped = false;

    for (let i = start; i < source.length; i += 1) {
        const ch = source[i];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (ch === '\\') {
                escaped = true;
            } else if (ch === stringQuote) {
                inString = false;
                stringQuote = '';
            }
            continue;
        }

        if (ch === '\'' || ch === '"' || ch === '`') {
            inString = true;
            stringQuote = ch;
            continue;
        }

        if (ch === '{') {
            depth += 1;
        } else if (ch === '}') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(start, i + 1);
            }
        }
    }

    return null;
}

function parseDependencies() {
    const source = readText(DATA_SYNC_FILE);
    const objectLiteral = extractObjectLiteral(source, 'const MODULE_DEPENDENCIES');
    if (!objectLiteral) {
        throw new Error('Unable to find MODULE_DEPENDENCIES in js/data-sync.js');
    }

    try {
        // MODULE_DEPENDENCIES is a plain object literal with string keys/values.
        // Evaluating this isolated literal keeps parsing simple and deterministic.
        // eslint-disable-next-line no-new-func
        return Function(`"use strict"; return (${objectLiteral});`)();
    } catch (error) {
        throw new Error(`Unable to parse MODULE_DEPENDENCIES: ${error.message}`);
    }
}

function findStringConstants(content) {
    const constants = new Map();
    const regex = /const\s+([A-Z][A-Z0-9_]*)\s*=\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        constants.set(match[1], match[2]);
    }

    return constants;
}

function resolveStringExpression(expression, constants) {
    const trimmed = expression.trim();
    const literalMatch = trimmed.match(/^['"]([^'"]+)['"]$/);
    if (literalMatch) {
        return literalMatch[1];
    }

    return constants.get(trimmed) || null;
}

function findCreateModuleHelpers(content) {
    const helpers = [];
    const constants = findStringConstants(content);
    const regex = /DataSync\.createModuleHelper\s*\(\s*([^,\n)]+)\s*,?/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const moduleName = resolveStringExpression(match[1], constants);
        helpers.push(moduleName || `(dynamic:${match[1].trim()})`);
    }

    return helpers;
}

function findNotifyModules(content) {
    const notifyModules = new Set();
    const directRegex = /DataSync\.notify(?:WithDependencies)?\s*\(\s*['"]([^'"]+)['"]/g;
    const helperNotifyRegex = /dataSyncHelper\.notify(?:Created|Updated|Deleted|BulkUpdated)\s*\(/g;

    let match;
    while ((match = directRegex.exec(content)) !== null) {
        notifyModules.add(match[1]);
    }

    if (helperNotifyRegex.test(content)) {
        notifyModules.add('(helper)');
    }

    return Array.from(notifyModules).sort();
}

function findCrudMethods(content) {
    return Object.entries(CRUD_PATTERNS)
        .filter(([, regex]) => regex.test(content))
        .map(([method]) => method.toUpperCase());
}

function hasButtonStateRisk(content) {
    return BUTTON_STATE_PATTERNS.some((regex) => regex.test(content));
}

function hasDependencyHandler(content) {
    return /onDependencyUpdate\s*:/.test(content);
}

function hasRefreshHandler(content) {
    return /onRefresh\s*:/.test(content);
}

function findStatefulSignals(content) {
    const signals = [];
    const checks = [
        ['cache', /\b(?:\w+Cache|cached[A-Z]\w*|cache[A-Z]\w*)\b/],
        ['expanded_row', /expanded\w*Ids|render\w*DetailRow|detail-row|toggle\w*Items/],
        ['detail_modal', /detailModal|openDetailModal|renderDetail(?:Content|View)?/],
        ['edit_modal', /currentEditingId|editingId|openEditModal|openModal\s*\(|classList\.remove\(\s*['"]hidden['"]\s*\)/],
        ['button_state', new RegExp(BUTTON_STATE_PATTERNS.map((regex) => regex.source).join('|'))]
    ];

    checks.forEach(([name, regex]) => {
        if (regex.test(content)) {
            signals.push(name);
        }
    });

    return signals;
}

function getModuleNameFromFile(fileName) {
    return fileName.replace(/\.js$/, '');
}

function invertDependencies(dependencies) {
    const inverse = {};

    Object.entries(dependencies).forEach(([source, targets]) => {
        targets.forEach((target) => {
            if (!inverse[target]) {
                inverse[target] = [];
            }
            inverse[target].push(source);
        });
    });

    Object.keys(inverse).forEach((key) => inverse[key].sort());
    return inverse;
}

function analyzeModule(fileName, dependencies, inverseDependencies) {
    const moduleName = getModuleNameFromFile(fileName);
    const filePath = path.join(JS_DIR, fileName);
    const content = readText(filePath);
    const helperModules = findCreateModuleHelpers(content);
    const notifyModules = findNotifyModules(content);
    const crudMethods = findCrudMethods(content);
    const dependents = dependencies[moduleName] || [];
    const dependencySources = inverseDependencies[moduleName] || [];
    const hasInitializer = /window\.initialize\w+/.test(content);
    const buttonStateRisk = hasButtonStateRisk(content);
    const dependencyHandler = hasDependencyHandler(content);
    const refreshHandler = hasRefreshHandler(content);
    const statefulSignals = findStatefulSignals(content);
    const statefulRefreshRisk = dependencySources.length > 0 && helperModules.length > 0 && statefulSignals.length > 0;

    const issues = [];

    if (hasInitializer && helperModules.length === 0) {
        issues.push('missing_createModuleHelper');
    }

    if (crudMethods.length > 0 && notifyModules.length === 0) {
        issues.push('crud_without_notify');
    }

    if (helperModules.length > 0 && !refreshHandler) {
        issues.push('helper_without_onRefresh');
    }

    if (dependencySources.length > 0 && helperModules.length > 0 && !dependencyHandler && !refreshHandler) {
        issues.push('dependency_without_refresh_path');
    }

    if (buttonStateRisk && dependencySources.length > 0 && !dependencyHandler && !refreshHandler) {
        issues.push('button_state_without_dependency_handler');
    }

    if (crudMethods.length > 0 && dependents.length === 0 && !CORE_MODULES.has(moduleName)) {
        issues.push('crud_module_without_dependents');
    }

    if (helperModules.length > 0 && !helperModules.includes(moduleName)) {
        issues.push(`helper_module_name_mismatch:${helperModules.join(',')}`);
    }

    return {
        moduleName,
        fileName,
        hasInitializer,
        helperModules,
        notifyModules,
        crudMethods,
        dependents,
        dependencySources,
        buttonStateRisk,
        dependencyHandler,
        refreshHandler,
        statefulSignals,
        statefulRefreshRisk,
        issues,
        priority: getPriority(moduleName, issues)
    };
}

function getPriority(moduleName, issues) {
    if (issues.length === 0) {
        return 'OK';
    }
    if (CORE_MODULES.has(moduleName)) {
        return 'P0';
    }
    if (
        issues.includes('crud_without_notify') ||
        issues.includes('missing_createModuleHelper') ||
        issues.includes('button_state_without_dependency_handler')
    ) {
        return 'P1';
    }
    return 'P2';
}

function formatList(items) {
    return items.length > 0 ? items.join(', ') : '-';
}

function translateIssue(issue) {
    const labels = {
        crud_module_without_dependents: 'CRUD 模組未設定相依刷新目標',
        crud_module_without_notify: 'CRUD 模組未發送 DataSync 通知',
        notify_module_without_dependencies: '通知模組未設定相依關係',
        dependency_source_without_refresh_handler: '相依來源未設定刷新處理'
    };
    return labels[issue] || issue;
}

function translateSignal(signal) {
    const labels = {
        cache: '快取',
        expanded_row: '展開列',
        detail_modal: '明細視窗',
        edit_modal: '編輯視窗',
        button_state: '按鈕狀態'
    };
    return labels[signal] || signal;
}

function buildMarkdownReport(results, dependencies) {
    const generatedAt = new Date().toISOString();
    const counts = results.reduce((acc, result) => {
        acc[result.priority] = (acc[result.priority] || 0) + 1;
        return acc;
    }, {});

    const lines = [];
    lines.push('# DataSync 稽核報告');
    lines.push('');
    lines.push(`產生時間：${generatedAt}`);
    lines.push('');
    lines.push('## 摘要');
    lines.push('');
    lines.push(`- P0: ${counts.P0 || 0}`);
    lines.push(`- P1: ${counts.P1 || 0}`);
    lines.push(`- P2: ${counts.P2 || 0}`);
    lines.push(`- 通過：${counts.OK || 0}`);
    lines.push(`- 相依來源數：${Object.keys(dependencies).length}`);
    lines.push(`- 狀態型介面刷新檢查數：${results.filter((result) => result.statefulRefreshRisk).length}`);
    lines.push('');
    lines.push('## 模組矩陣');
    lines.push('');
    lines.push('| 優先級 | 模組 | 輔助模組 | CRUD 方法 | 通知模組 | 相依刷新目標 | 相依來源 | 問題 |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');

    results.forEach((result) => {
        lines.push([
            result.priority,
            result.moduleName,
            formatList(result.helperModules),
            formatList(result.crudMethods),
            formatList(result.notifyModules),
            formatList(result.dependents),
            formatList(result.dependencySources),
            formatList(result.issues.map(translateIssue))
        ].map((value) => String(value).replace(/\|/g, '\\|')).join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
    });

    lines.push('');
    lines.push('## 建議處理順序');
    lines.push('');
    results
        .filter((result) => result.priority !== 'OK')
        .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || a.moduleName.localeCompare(b.moduleName))
        .forEach((result) => {
            lines.push(`- ${result.priority} ${result.moduleName}：${formatList(result.issues.map(translateIssue))}`);
        });

    lines.push('');
    lines.push('## 狀態型介面刷新檢查');
    lines.push('');
    lines.push('以下模組會保留快取、展開列、明細視窗、編輯視窗或按鈕狀態等本機介面狀態。相依資料變更時，需人工確認目前開啟的介面狀態會同步刷新，而不只是重新載入主列表。');
    lines.push('');
    lines.push('| 模組 | 狀態訊號 | 相依來源 | 有 onDependencyUpdate | 備註 |');
    lines.push('| --- | --- | --- | --- | --- |');

    results
        .filter((result) => result.statefulRefreshRisk)
        .sort((a, b) => a.moduleName.localeCompare(b.moduleName))
        .forEach((result) => {
            const notes = result.dependencyHandler
                ? '請確認目前開啟狀態的刷新路徑'
                : '使用通用 onRefresh，需人工檢查開啟中的介面狀態';
            lines.push([
                result.moduleName,
                formatList(result.statefulSignals.map(translateSignal)),
                formatList(result.dependencySources),
                result.dependencyHandler ? '是' : '否',
                notes
            ].map((value) => String(value).replace(/\|/g, '\\|')).join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
        });

    lines.push('');
    return lines.join('\n');
}

function priorityWeight(priority) {
    return { P0: 0, P1: 1, P2: 2, OK: 3 }[priority] ?? 4;
}

function printConsoleSummary(results) {
    const grouped = results.reduce((acc, result) => {
        if (!acc[result.priority]) {
            acc[result.priority] = [];
        }
        acc[result.priority].push(result);
        return acc;
    }, {});

    ['P0', 'P1', 'P2', 'OK'].forEach((priority) => {
        const group = grouped[priority] || [];
        console.log(`${priority}: ${group.length}`);
        group.slice(0, 12).forEach((result) => {
            console.log(`  - ${result.moduleName}: ${formatList(result.issues)}`);
        });
        if (group.length > 12) {
            console.log(`  ... ${group.length - 12} more`);
        }
    });

    const statefulReviewCount = results.filter((result) => result.statefulRefreshRisk).length;
    console.log(`Stateful refresh review: ${statefulReviewCount}`);
}

function requireDependency(dependencies, source, target, issues) {
    const targets = dependencies[source] || [];
    if (!targets.includes(target)) {
        issues.push(`${source} missing dependency ${target}`);
    }
}

function requireFilePattern(filePath, regex, label, issues) {
    if (!fs.existsSync(filePath)) {
        issues.push(`${path.relative(ROOT, filePath)} missing`);
        return;
    }

    const content = readText(filePath);
    if (!regex.test(content)) {
        issues.push(label);
    }
}

function checkSplitWorkOrderDataSync(dependencies) {
    const issues = [];

    requireDependency(dependencies, 'work_orders', 'inventory_items', issues);
    requireDependency(dependencies, 'work_orders', 'inventory_transactions', issues);
    requireDependency(dependencies, 'work_orders', 'production_work_order_schedule', issues);
    requireDependency(dependencies, 'inventory_items', 'shipping_orders', issues);
    requireDependency(dependencies, 'inventory_items', 'shipping_order_items', issues);
    requireDependency(dependencies, 'inventory_items', 'work_orders', issues);
    requireDependency(dependencies, 'shipping_orders', 'inventory_items', issues);

    requireFilePattern(
        path.join(JS_DIR, 'work_orders.js'),
        /partial_receipt\.php[\s\S]*notifyWithDependencies\(['"]work_orders['"]/,
        'work_orders partial receipt must notify DataSync dependencies',
        issues
    );
    requireFilePattern(
        path.join(JS_DIR, 'inventory_items.js'),
        /receipt_type|partial|部分/,
        'inventory_items must render partial/final receipt state',
        issues
    );
    requireFilePattern(
        path.join(JS_DIR, 'shipping_orders.js'),
        /receipt_type|partial|部分/,
        'shipping_orders must expose partial inventory state',
        issues
    );
    requireFilePattern(
        path.join(JS_DIR, 'production_work_order_schedule.js'),
        /schedule_nodes\.php[\s\S]*node_key/,
        'production schedule must persist split machine-run nodes',
        issues
    );

    return issues;
}

function printSplitWorkOrderDataSyncSummary(dependencies) {
    const issues = checkSplitWorkOrderDataSync(dependencies);

    if (issues.length === 0) {
        console.log('Split work order DataSync review: OK');
        return issues;
    }

    console.log(`Split work order DataSync review: ${issues.length} issue(s)`);
    issues.forEach((issue) => {
        console.log(`  - ${issue}`);
    });
    return issues;
}

function runAudit() {
    const dependencies = parseDependencies();
    const inverseDependencies = invertDependencies(dependencies);
    const results = listModuleFiles()
        .map((fileName) => analyzeModule(fileName, dependencies, inverseDependencies))
        .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || a.moduleName.localeCompare(b.moduleName));
    const splitWorkOrderIssues = checkSplitWorkOrderDataSync(dependencies);
    const counts = results.reduce((summary, result) => {
        summary[result.priority] = (summary[result.priority] || 0) + 1;
        return summary;
    }, { P0: 0, P1: 0, P2: 0, OK: 0 });

    return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        counts,
        dependencies,
        results,
        splitWorkOrderIssues
    };
}

function main() {
    const args = process.argv.slice(2);
    const jsonOutput = args.includes('--format=json') ||
        (args.includes('--format') && args[args.indexOf('--format') + 1] === 'json');
    const writeIndex = args.findIndex((arg) => arg === '--write' || arg.startsWith('--write='));
    let reportPath = null;

    if (writeIndex !== -1) {
        const arg = args[writeIndex];
        if (arg.includes('=')) {
            reportPath = path.resolve(ROOT, arg.split('=').slice(1).join('='));
        } else {
            reportPath = args[writeIndex + 1] ? path.resolve(ROOT, args[writeIndex + 1]) : DEFAULT_REPORT;
        }
    }

    const audit = runAudit();

    if (reportPath) {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, buildMarkdownReport(audit.results, audit.dependencies), 'utf8');
    }

    if (jsonOutput) {
        process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
    } else {
        printConsoleSummary(audit.results);
        printSplitWorkOrderDataSyncSummary(audit.dependencies);
        if (reportPath) {
            console.log(`Report written: ${path.relative(ROOT, reportPath)}`);
        }
    }

    process.exitCode = audit.counts.P0 > 0 || audit.counts.P1 > 0 ? 1 : 0;
}

if (require.main === module) {
    main();
}

module.exports = {
    runAudit
};
