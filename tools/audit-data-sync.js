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

function buildMarkdownReport(results, dependencies) {
    const generatedAt = new Date().toISOString();
    const counts = results.reduce((acc, result) => {
        acc[result.priority] = (acc[result.priority] || 0) + 1;
        return acc;
    }, {});

    const lines = [];
    lines.push('# DataSync Audit Report');
    lines.push('');
    lines.push(`Generated at: ${generatedAt}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- P0: ${counts.P0 || 0}`);
    lines.push(`- P1: ${counts.P1 || 0}`);
    lines.push(`- P2: ${counts.P2 || 0}`);
    lines.push(`- OK: ${counts.OK || 0}`);
    lines.push(`- Dependency sources: ${Object.keys(dependencies).length}`);
    lines.push(`- Stateful refresh review: ${results.filter((result) => result.statefulRefreshRisk).length}`);
    lines.push('');
    lines.push('## Module Matrix');
    lines.push('');
    lines.push('| Priority | Module | Helper | CRUD | Notify | Dependents | Dependency Sources | Issues |');
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
            formatList(result.issues)
        ].map((value) => String(value).replace(/\|/g, '\\|')).join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
    });

    lines.push('');
    lines.push('## Recommended Order');
    lines.push('');
    results
        .filter((result) => result.priority !== 'OK')
        .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || a.moduleName.localeCompare(b.moduleName))
        .forEach((result) => {
            lines.push(`- ${result.priority} ${result.moduleName}: ${formatList(result.issues)}`);
        });

    lines.push('');
    lines.push('## Stateful Refresh Review');
    lines.push('');
    lines.push('These modules keep local UI state such as caches, expanded rows, open detail modals, edit modals, or action buttons. When dependencies change, manual review must confirm the open state is refreshed, not only the main list.');
    lines.push('');
    lines.push('| Module | Signals | Dependency Sources | Has onDependencyUpdate | Notes |');
    lines.push('| --- | --- | --- | --- | --- |');

    results
        .filter((result) => result.statefulRefreshRisk)
        .sort((a, b) => a.moduleName.localeCompare(b.moduleName))
        .forEach((result) => {
            const notes = result.dependencyHandler
                ? 'verify open state refresh path'
                : 'uses generic onRefresh; inspect open state manually';
            lines.push([
                result.moduleName,
                formatList(result.statefulSignals),
                formatList(result.dependencySources),
                result.dependencyHandler ? 'yes' : 'no',
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

function main() {
    const args = process.argv.slice(2);
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

    const dependencies = parseDependencies();
    const inverseDependencies = invertDependencies(dependencies);
    const results = listModuleFiles()
        .map((fileName) => analyzeModule(fileName, dependencies, inverseDependencies))
        .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || a.moduleName.localeCompare(b.moduleName));

    printConsoleSummary(results);
    printSplitWorkOrderDataSyncSummary(dependencies);

    if (reportPath) {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, buildMarkdownReport(results, dependencies), 'utf8');
        console.log(`Report written: ${path.relative(ROOT, reportPath)}`);
    }

    const hasP0 = results.some((result) => result.priority === 'P0');
    process.exitCode = hasP0 ? 1 : 0;
}

main();
