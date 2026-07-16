#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = ['script.js', ...fs.readdirSync(path.join(root, 'js')).filter(file => file.endsWith('.js')).map(file => `js/${file}`)];
const native = [];
let common = 0;

for (const file of files) {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
        if (line.includes('AppFeedback.')) common += 1;
        if (/(^|[^A-Za-z])(?:window\.)?(?:confirm|alert)\(/.test(line) && !line.includes('AppFeedback.')) {
            native.push({ file, line: index + 1, text: line.trim(), navigationGuard: /尚未儲存|未儲存|遺失/.test(line) });
        }
    });
}

const violations = native.filter(item => !item.navigationGuard);
const report = [
    '# Native Feedback Audit', '',
    `- 共用 AppFeedback 呼叫：${common}`,
    `- 保留的同步未儲存導覽守門：${native.length - violations.length}`,
    `- 未遷移的原生危險操作／一般提示：${violations.length}`,
    '',
    '同步未儲存守門必須在分頁關閉事件中立即回傳 boolean，因此保留瀏覽器原生 confirm；所有可非同步的危險操作均使用具流程節點、影響範圍、焦點管理與 ARIA 的 AppFeedback modal。',
    '',
    ...native.map(item => `- ${item.file}:${item.line} — ${item.navigationGuard ? '允許：未儲存導覽守門' : '違規'} — ${item.text}`)
].join('\n');

const writeIndex = process.argv.indexOf('--write');
if (writeIndex >= 0) {
    const output = process.argv[writeIndex + 1] || 'docs/native-feedback-audit.md';
    fs.writeFileSync(path.resolve(root, output), `${report}\n`, 'utf8');
}
console.log(`AppFeedback=${common}, native navigation guards=${native.length - violations.length}, violations=${violations.length}`);
if (violations.length) {
    violations.forEach(item => console.error(`ERROR ${item.file}:${item.line} ${item.text}`));
    process.exit(1);
}
