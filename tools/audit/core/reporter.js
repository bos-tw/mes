'use strict';

const fs = require('fs');
const path = require('path');

function buildReport(errors, warnings, infos) {
    const findings = [...errors, ...warnings, ...infos];

    return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        summary: {
            errors: errors.length,
            warnings: warnings.length,
            infos: infos.length,
            total: findings.length,
            bySeverity: findings.reduce((counts, finding) => {
                counts[finding.severity] = (counts[finding.severity] || 0) + 1;
                return counts;
            }, {})
        },
        findings
    };
}

function renderJson(report) {
    return `${JSON.stringify(report, null, 2)}\n`;
}

function escapeMarkdown(value) {
    return String(value || '')
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, '<br>');
}

function renderMarkdown(report) {
    const lines = [
        '# MES 系統健康度審計報告',
        '',
        `產生時間：${report.generatedAt}`,
        '',
        '## 摘要',
        '',
        `- 錯誤：${report.summary.errors}`,
        `- 警告：${report.summary.warnings}`,
        `- 資訊：${report.summary.infos}`,
        `- 總計：${report.summary.total}`,
        '',
        '## 發現項目',
        '',
        '| 嚴重度 | 規則 | 分類 | 領域 | 檔案 | 問題 | 信心 | Fingerprint |',
        '|---|---|---|---|---|---|---|---|'
    ];

    report.findings.forEach((finding) => {
        lines.push([
            finding.severity,
            finding.ruleId,
            finding.classification,
            escapeMarkdown(finding.domain),
            escapeMarkdown(finding.file),
            escapeMarkdown(finding.message || finding.note),
            finding.confidence,
            finding.fingerprint
        ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
    });

    if (report.comparison) {
        lines.push(
            '',
            '## 基準線比較',
            '',
            `- 新增：${report.comparison.summary.new}`,
            `- 既有：${report.comparison.summary.existing}`,
            `- 已解決：${report.comparison.summary.resolved}`,
            `- 阻擋：${report.comparison.summary.blocking}`
        );
    }

    return `${lines.join('\n')}\n`;
}

function writeReport(root, outputPath, report) {
    const absolutePath = path.resolve(root, outputPath);
    const content = path.extname(absolutePath).toLowerCase() === '.json'
        ? renderJson(report)
        : renderMarkdown(report);

    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf8');

    return absolutePath;
}

module.exports = {
    buildReport,
    renderJson,
    renderMarkdown,
    writeReport
};
