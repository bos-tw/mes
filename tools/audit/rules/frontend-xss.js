'use strict';

const fs = require('fs');
const path = require('path');

const EXCLUDED_FILES = new Set([
    'utils.js',
    'data-sync.js',
    'column_manager.js'
]);

// Keep this list aligned with the legacy J-2 behavior until fixture coverage
// is broad enough to safely replace the line-based detector.
const SAFE_CONTEXT = /formatDate|formatNumber|formatCurrency|formatDateTime|\.textContent|data-id=|data-page=|data-action=|item\.id\b|data\.id\b|record\.id\b|row\.id\b|\|\|\s*0|\|\|\s*'-'|parseInt|parseFloat|Number\(/;

const PROVABLY_SAFE_CALLS = [
    'escapeHtml',
    'safeEscapeHtml',
    'formatDate',
    'formatNumber',
    'formatCurrency',
    'formatDateTime',
    'formatTaiwanDate',
    'formatInteger',
    'formatDecimal',
    'formatBillingDay',
    'formatRejectionRate',
    'formatDimension',
    'formatPpm',
    'getTableColumnCount',
    'escapeHtmlSafe'
];

const REVIEWED_SAFE_FUNCTIONS_BY_FILE = {
    'customers.js': new Set(['valueOrDash', 'formatWithTooltip', 'formatNotes']),
    'dashboard_calendar_events.js': new Set(['getStatusBadge']),
    'domain_event_outbox.js': new Set(['getStatusBadge']),
    'inventory_items.js': new Set([
        'getQualityStatusClass',
        'getQualityStatusLabel',
        'getRefTypeLabel',
        'getStatusClass',
        'getStatusLabel'
    ]),
    'inventory_transactions.js': new Set(['buildSourceDisplay', 'getRefTypeLabel']),
    'order_items.js': new Set(['getWeightVarianceCell']),
    'orders.js': new Set(['renderOrderStatusBadge']),
    'production_quality_records.js': new Set(['truncate']),
    'production_work_order_schedule.js': new Set(['renderScheduleWorkOrderLabel']),
    'return_orders.js': new Set(['getStatusBadge']),
    'screening_services.js': new Set(['formatStatus']),
    'shipping_orders.js': new Set(['getDeliveryMethodLabel', 'getStatusClass', 'getStatusLabel']),
    'shipping_order_items.js': new Set(['getStatusClass', 'getStatusLabel']),
    'shipping_quality_inspections.js': new Set(['formatResult']),
    'suppliers.js': new Set(['valueOrDash']),
    'work_orders.js': new Set(['getImageTypeLabel'])
};

const REVIEWED_SAFE_IDENTIFIERS_BY_FILE = {
    'customers.js': new Set(['field.value', 'nameDisplay', 'renderedName', 'statusBadge']),
    'dashboard_calendar_events.js': new Set(['expiredBadge']),
    'inventory_items.js': new Set(['customerDisplay', 'directionClass', 'directionLabel']),
    'inventory_transactions.js': new Set([
        'afterQty',
        'directionClass',
        'directionLabel',
        'orderNumber',
        'product',
        'qty',
        'sourceDisplay',
        'workOrderNumber'
    ]),
    'messages.js': new Set(['attachmentIcon', 'displayUser', 'recipientInfo', 'statusIcon']),
    'notifications.js': new Set(['actionsHtml', 'priorityHtml', 'statusIcon', 'typeHtml']),
    'orders.js': new Set(['totalUnits', 'unitW', 'unitWeightG']),
    'production_quality_records.js': new Set(['reworkBadge']),
    'production_work_order_schedule.js': new Set([
        'scheduledText',
        'sequence',
        'statusText',
        'tooltipText',
        'workOrderNumber',
        'windowText'
    ]),
    'report_descriptions.js': new Set(['statusClass', 'statusText']),
    'screening_items.js': new Set(['unitPrice', 'weight']),
    'shipping_orders.js': new Set(['returnStatusClass', 'returnStatusLabel', 'statusClass']),
    'shipping_order_items.js': new Set(['statusClass']),
    'work_orders.js': new Set([
        'customerDisplay',
        'defectInput',
        'defectQuantity',
        'notesCell',
        'ppm',
        'toleranceMinus',
        'tolerancePlus'
    ]),
    'work_order_images.js': new Set(['typeLabel'])
};

function getTemplateExpressions(line) {
    return [...String(line || '').matchAll(/\$\{([^{}]*)\}/g)]
        .map(match => match[1].trim());
}

function isLiteral(value) {
    const trimmed = String(value || '').trim();
    return /^(['"]).*\1$/.test(trimmed) ||
        /^-?\d+(?:\.\d+)?$/.test(trimmed) ||
        /^(?:true|false|null|undefined)$/.test(trimmed);
}

function isSimpleLiteralTernary(expression) {
    const match = String(expression || '').match(/^[^?]+\?\s*(.+?)\s*:\s*(.+)$/);
    return Boolean(match && isLiteral(match[1]) && isLiteral(match[2]));
}

function isProvablySafeExpression(expression, fileName = '') {
    const value = String(expression || '').trim();
    if (!value) return false;

    if (PROVABLY_SAFE_CALLS.some(name =>
        new RegExp(`\\b${name}\\s*\\(`).test(value)
    )) {
        return true;
    }

    const reviewedFunctions = REVIEWED_SAFE_FUNCTIONS_BY_FILE[fileName] || new Set();
    if ([...reviewedFunctions].some(name =>
        new RegExp(`\\b${name}\\s*\\(`).test(value)
    )) {
        return true;
    }

    const reviewedIdentifiers = REVIEWED_SAFE_IDENTIFIERS_BY_FILE[fileName] || new Set();
    if (reviewedIdentifiers.has(value)) return true;

    if (isSimpleLiteralTernary(value)) return true;
    if (/^(?:index|sequence)\s*\+\s*\d+$/.test(value)) return true;
    if (/^[\w?.[\]]+\.length$/.test(value)) return true;
    if (/\.(?:toFixed|toLocaleString)\s*\(/.test(value)) return true;
    if (/\bMath\.(?:round|floor|ceil|abs)\s*\(/.test(value)) return true;

    return false;
}

function hasOnlyProvablySafeExpressions(line, fileName = '') {
    const expressions = getTemplateExpressions(line);
    return expressions.length > 0 &&
        expressions.every(expression => isProvablySafeExpression(expression, fileName));
}

function scanJsXssContent(content, fileName = '') {
    const hits = [];
    const lines = String(content || '').split('\n');

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//')) return;

        if (/innerHTML\s*[+]?=/.test(trimmed) && /\$\{/.test(trimmed)) {
            if (
                !trimmed.includes('escapeHtml') &&
                !SAFE_CONTEXT.test(trimmed) &&
                !hasOnlyProvablySafeExpressions(trimmed, fileName)
            ) {
                hits.push(index + 1);
            }
        }

        if (/<(?:td|th|span|div|p|li|a|label|h[1-6]|strong|em)[^>]*>\$\{/.test(trimmed)) {
            if (
                !trimmed.includes('escapeHtml') &&
                !SAFE_CONTEXT.test(trimmed) &&
                !hasOnlyProvablySafeExpressions(trimmed, fileName)
            ) {
                hits.push(index + 1);
            }
        }
    });

    return [...new Set(hits)];
}

function checkJsXssRisk({ root, reportError, log = console.log }) {
    log('🔍 [J-2] 檢查 JS innerHTML XSS 風險...');

    const jsDir = path.join(root, 'js');
    if (!fs.existsSync(jsDir)) return;

    fs.readdirSync(jsDir)
        .filter(file =>
            file.endsWith('.js') &&
            !file.endsWith('.bak') &&
            !EXCLUDED_FILES.has(file)
        )
        .forEach((file) => {
            const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
            const hits = scanJsXssContent(content, file);
            if (hits.length === 0) return;

            reportError(
                '前端',
                `js/${file}`,
                'J-2 XSS 風險：innerHTML 未用 escapeHtml',
                `${file} 在 ${hits.map(line => `L${line}`).join(', ')} 行直接將伺服器資料插入 innerHTML 而未呼叫 escapeHtml()，可能導致 XSS`,
                '所有插入 innerHTML 的使用者提供的字串欄位（名稱、地址、備註等）必須用 escapeHtml() 包裹'
            );
        });
}

module.exports = {
    checkJsXssRisk,
    getTemplateExpressions,
    isProvablySafeExpression,
    scanJsXssContent
};
