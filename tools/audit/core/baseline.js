'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_BASELINE_PATH = 'tools/audit-baseline.json';

function isTrackableFinding(finding) {
    return finding.severity !== 'Info';
}

function normalizeIdentityPart(value) {
    return String(value || '')
        .replace(/\\/g, '/')
        .replace(/\r?\n/g, ' ')
        .replace(/在\s+L\d+(?:,\s*L\d+)*\s+行/g, '在 <lines> 行')
        .replace(/\d+/g, '<n>')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function createFindingIdentity(finding) {
    return [
        normalizeIdentityPart(finding.ruleId),
        normalizeIdentityPart(finding.file),
        normalizeIdentityPart(finding.message || finding.note)
    ].join('|');
}

function createBaseline(report, metadata = {}) {
    const findings = report.findings
        .filter(finding => isTrackableFinding(finding) && finding.baselineAllowed)
        .map(finding => ({
            fingerprint: finding.fingerprint,
            ruleId: finding.ruleId,
            severity: finding.severity,
            classification: finding.classification,
            domain: finding.domain,
            file: finding.file,
            message: finding.message || finding.note,
            confidence: finding.confidence
        }))
        .sort((left, right) => left.fingerprint.localeCompare(right.fingerprint));

    return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        sourceCommit: metadata.sourceCommit || null,
        reviewed: true,
        summary: {
            findings: findings.length,
            bySeverity: findings.reduce((counts, finding) => {
                counts[finding.severity] = (counts[finding.severity] || 0) + 1;
                return counts;
            }, {})
        },
        findings
    };
}

function loadBaseline(root, baselinePath = DEFAULT_BASELINE_PATH) {
    const absolutePath = path.resolve(root, baselinePath);
    if (!fs.existsSync(absolutePath)) return null;

    const baseline = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    if (baseline.schemaVersion !== 1 || !Array.isArray(baseline.findings)) {
        throw new Error(`不支援的審計基準線格式：${baselinePath}`);
    }

    return baseline;
}

function writeBaseline(root, baselinePath, baseline) {
    const absolutePath = path.resolve(root, baselinePath || DEFAULT_BASELINE_PATH);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
    return absolutePath;
}

function compareWithBaseline(report, baseline) {
    const currentFindings = report.findings.filter(isTrackableFinding);
    const baselineByFingerprint = new Map(
        baseline.findings.map(finding => [finding.fingerprint, finding])
    );
    const baselineByIdentity = new Map(
        baseline.findings.map(finding => [createFindingIdentity(finding), finding])
    );
    const currentByFingerprint = new Map(
        currentFindings.map(finding => [finding.fingerprint, finding])
    );
    const currentByIdentity = new Map(
        currentFindings.map(finding => [createFindingIdentity(finding), finding])
    );

    const existing = currentFindings.filter(finding =>
        finding.baselineAllowed &&
        (
            baselineByFingerprint.has(finding.fingerprint) ||
            baselineByIdentity.has(createFindingIdentity(finding))
        )
    );
    const added = currentFindings.filter(finding =>
        !finding.baselineAllowed ||
        (
            !baselineByFingerprint.has(finding.fingerprint) &&
            !baselineByIdentity.has(createFindingIdentity(finding))
        )
    );
    const resolved = baseline.findings.filter(finding =>
        !currentByFingerprint.has(finding.fingerprint) &&
        !currentByIdentity.has(createFindingIdentity(finding))
    );
    const blocking = added.filter(finding =>
        finding.severity === 'P0' ||
        finding.severity === 'P1' ||
        finding.severity === 'P2'
    );

    return {
        summary: {
            new: added.length,
            existing: existing.length,
            resolved: resolved.length,
            blocking: blocking.length
        },
        new: added,
        existing,
        resolved,
        blocking
    };
}

module.exports = {
    DEFAULT_BASELINE_PATH,
    compareWithBaseline,
    createBaseline,
    createFindingIdentity,
    loadBaseline,
    writeBaseline
};
