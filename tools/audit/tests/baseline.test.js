'use strict';

const assert = require('assert');
const {
    compareWithBaseline,
    createBaseline,
    createFindingIdentity
} = require('../core/baseline');
const { findingTouchesChangedFile, parsePathList } = require('../core/git-scope');

function finding(overrides) {
    return {
        fingerprint: 'default',
        ruleId: 'F-1',
        severity: 'P1',
        classification: 'policy-debt',
        domain: '前端',
        file: 'js/example.js',
        message: 'example',
        confidence: 'high',
        baselineAllowed: true,
        ...overrides
    };
}

const historical = finding({ fingerprint: 'historical' });
const nonBaselineable = finding({
    fingerprint: 'security',
    ruleId: 'S-2',
    severity: 'P0',
    baselineAllowed: false
});
const report = {
    findings: [
        historical,
        nonBaselineable,
        finding({ fingerprint: 'info', severity: 'Info' })
    ]
};

const baseline = createBaseline(report, { sourceCommit: 'abc123' });
assert.strictEqual(baseline.findings.length, 1);
assert.strictEqual(baseline.findings[0].fingerprint, 'historical');
assert.strictEqual(baseline.sourceCommit, 'abc123');

const comparison = compareWithBaseline(report, baseline);
assert.strictEqual(comparison.summary.existing, 1);
assert.strictEqual(comparison.summary.new, 1);
assert.strictEqual(comparison.summary.blocking, 1);
assert.strictEqual(comparison.blocking[0].ruleId, 'S-2');

const resolvedComparison = compareWithBaseline({ findings: [] }, baseline);
assert.strictEqual(resolvedComparison.summary.resolved, 1);

const oldLineList = finding({
    fingerprint: 'legacy-lines',
    ruleId: 'J-2',
    message: 'example.js 在 L10, L20 行有風險'
});
const newLineList = finding({
    fingerprint: 'stable-lines',
    ruleId: 'J-2',
    message: 'example.js 在 L10 行有風險'
});
const lineListComparison = compareWithBaseline(
    { findings: [newLineList] },
    { findings: [oldLineList] }
);

assert.strictEqual(createFindingIdentity(oldLineList), createFindingIdentity(newLineList));
assert.strictEqual(lineListComparison.summary.existing, 1);
assert.strictEqual(lineListComparison.summary.new, 0);
assert.strictEqual(lineListComparison.summary.resolved, 0);

assert.deepStrictEqual(parsePathList("js\\a.js\r\nmodules/b.html\n"), [
    'js/a.js',
    'modules/b.html'
]);
assert.strictEqual(
    findingTouchesChangedFile(
        finding({ file: 'js/example.js' }),
        ['js/example.js']
    ),
    true
);
assert.strictEqual(
    findingTouchesChangedFile(
        finding({ file: 'modules/' }),
        ['modules/example.html']
    ),
    true
);

console.log('baseline.test.js passed');
