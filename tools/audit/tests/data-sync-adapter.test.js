'use strict';

const assert = require('assert');
const { runAudit } = require('../../audit-data-sync');

const audit = runAudit();

assert.strictEqual(audit.schemaVersion, 1);
assert.ok(Array.isArray(audit.results));
assert.ok(audit.counts);
assert.strictEqual(typeof audit.counts.P0, 'number');
assert.strictEqual(typeof audit.counts.P1, 'number');
assert.ok(Array.isArray(audit.splitWorkOrderIssues));

console.log('data-sync-adapter.test.js passed');
