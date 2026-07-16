'use strict';

const crypto = require('crypto');

const NON_BASELINEABLE_RULES = new Set([
    'S-1',
    'S-2',
    'P-1',
    'WF-1',
    'SEC-3',
    'PERM-2',
    'SCHEMA-1',
    'NAV-1',
    'STATE-1',
    'INV-1',
    'AUDIT-1',
    'OUTBOX-1',
    'ASSET-1',
    'CSS-1',
    'TEST-1',
    'UX-1',
    'UPDATE-1'
]);

const MEDIUM_CONFIDENCE_RULES = new Set([
    'J-2',
    'M-1'
]);

const LOW_CONFIDENCE_RULES = new Set([
    'DS-1'
]);

const RULE_CLASSIFICATIONS = new Map([
    ['F-1', 'policy-debt'],
    ['J-2', 'needs-review'],
    ['M-1', 'policy-debt'],
    ['A-3', 'policy-debt'],
    ['D-3', 'policy-debt'],
    ['DS-1', 'needs-review']
]);

function extractRuleId(value) {
    const match = String(value || '').trim().match(/^([A-Z]+(?:-\d+)?)/);
    return match ? match[1] : 'INFO';
}

function normalizeFingerprintPart(value) {
    return String(value || '')
        .replace(/\\/g, '/')
        .replace(/\r?\n/g, ' ')
        .replace(/在\s+L\d+(?:,\s*L\d+)*\s+行/g, '在 <lines> 行')
        .replace(/\d+/g, '<n>')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function createFingerprint({ ruleId, file, message }) {
    const source = [
        normalizeFingerprintPart(ruleId),
        normalizeFingerprintPart(file),
        normalizeFingerprintPart(message)
    ].join('|');

    return crypto.createHash('sha256').update(source).digest('hex').slice(0, 20);
}

function severityForLevel(level, ruleId) {
    if (level === 'info') return 'Info';
    if (level === 'warning') return 'P2';
    if (NON_BASELINEABLE_RULES.has(ruleId)) return 'P0';
    return 'P1';
}

function confidenceForRule(ruleId) {
    if (LOW_CONFIDENCE_RULES.has(ruleId)) return 'low';
    if (MEDIUM_CONFIDENCE_RULES.has(ruleId)) return 'medium';
    return 'high';
}

function classificationForFinding(level, ruleId) {
    if (level === 'info') return 'advisory';
    if (RULE_CLASSIFICATIONS.has(ruleId)) {
        return RULE_CLASSIFICATIONS.get(ruleId);
    }
    if (NON_BASELINEABLE_RULES.has(ruleId) || level === 'error') {
        return 'true-defect';
    }
    return 'policy-debt';
}

function createFinding({
    level,
    category,
    file,
    rule,
    message,
    fix,
    note
}) {
    const findingMessage = message || note || '';
    const ruleId = extractRuleId(rule || file);
    const severity = severityForLevel(level, ruleId);

    return {
        // Legacy fields remain available while rules migrate to the structured API.
        category,
        file,
        rule,
        message,
        fix,
        note,
        ruleId,
        severity,
        domain: category,
        line: null,
        remediation: fix || null,
        confidence: confidenceForRule(ruleId),
        classification: classificationForFinding(level, ruleId),
        fingerprint: createFingerprint({ ruleId, file, message: findingMessage }),
        baselineAllowed: !NON_BASELINEABLE_RULES.has(ruleId)
    };
}

module.exports = {
    createFinding,
    createFingerprint,
    extractRuleId,
    NON_BASELINEABLE_RULES,
    RULE_CLASSIFICATIONS
};
