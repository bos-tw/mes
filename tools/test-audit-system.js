#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const commands = [
    ['node', ['--check', 'tools/audit-system-health.js']],
    ['node', ['--check', 'tools/audit-data-sync.js']],
    ['node', ['--check', 'tools/audit/core/finding.js']],
    ['node', ['--check', 'tools/audit/core/baseline.js']],
    ['node', ['--check', 'tools/audit/core/git-scope.js']],
    ['node', ['--check', 'tools/audit/core/reporter.js']],
    ['node', ['--check', 'tools/audit/rules/frontend-xss.js']],
    ['node', ['--check', 'tools/audit/rules/frontend-quality.js']],
    ['node', ['--check', 'tools/audit/rules/governance-contracts.js']],
    ['node', ['--check', 'tools/audit/adapters/data-sync.js']],
    ['node', ['tools/audit/tests/finding.test.js']],
    ['node', ['tools/audit/tests/baseline.test.js']],
    ['node', ['tools/audit/tests/frontend-xss.test.js']],
    ['node', ['tools/audit/tests/frontend-quality.test.js']],
    ['node', ['tools/audit/tests/table-action-density.test.js']],
    ['node', ['tools/audit/tests/work-order-stage-guide-removal.test.js']],
    ['node', ['tools/audit/tests/dashboard-work-queue-removal.test.js']],
    ['node', ['tools/audit/tests/governance-contracts.test.js']],
    ['node', ['tools/audit/tests/basic-settings-font-preference.test.js']],
    ['node', ['tools/audit/tests/order-item-editor-parity.test.js']],
    ['node', ['tools/audit/tests/version-checker-behavior.test.js']],
    ['node', ['tools/audit/tests/data-sync-adapter.test.js']]
];

for (const [command, args] of commands) {
    const label = `${command} ${args.join(' ')}`;
    console.log(`\n> ${label}`);
    const result = childProcess.spawnSync(command, args, {
        cwd: ROOT,
        stdio: 'inherit',
        shell: false
    });

    if (result.error) {
        console.error(result.error.message);
        process.exit(1);
    }
    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}

console.log('\nAudit system tests passed.');
