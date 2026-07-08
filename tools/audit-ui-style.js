#!/usr/bin/env node
/**
 * UI style audit tool.
 *
 * Scans CSS files for hardcoded spacing / radius declarations and documents
 * whether each declaration is covered by a ui-token-exception comment.
 *
 * Usage:
 *   node tools/audit-ui-style.js
 *   node tools/audit-ui-style.js styles.css
 *   node tools/audit-ui-style.js --format json
 *   node tools/audit-ui-style.js --write docs/ui-style-audit.md
 *   node tools/audit-ui-style.js --fail-on-issues
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_FILES = ['styles.css'];
const DEFAULT_REPORT = 'docs/ui-style-audit.md';
const STYLE_PROPS = new Set([
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'gap',
    'row-gap',
    'column-gap',
    'height',
    'min-height',
    'max-height',
    'border-radius',
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left'
]);

const TOKEN_HINTS = [
    {
        test: (prop, value) => prop.startsWith('padding') && /^(4px 6px|4px 8px|5px 6px|6px 8px|8px 10px|10px 12px|12px 16px|4px|6px|8px|10px|12px)$/.test(value),
        token: '--ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-*'
    },
    {
        test: (prop, value) => ['gap', 'row-gap', 'column-gap'].includes(prop) && /^(4px|6px|8px|10px|12px|8px 10px|8px 12px|10px 12px)$/.test(value),
        token: '--ui-section-gap / --ui-metric-gap'
    },
    {
        test: (prop, value) => prop.includes('height') && /^(28px|30px|32px|34px|36px|38px|40px)$/.test(value),
        token: '--ui-control-height or calc(var(--ui-control-height) +/- npx)'
    },
    {
        test: (prop, value) => prop.includes('radius') && /^(4px|6px|8px|10px|12px|999px)$/.test(value),
        token: '--ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill'
    },
    {
        test: (prop, value) => prop.startsWith('margin') && /^(4px|6px|8px|10px|12px|16px|20px|24px)$/.test(value),
        token: '--ui-section-gap or component stack token'
    }
];

const REVIEW_PATTERNS = [
    /vh\b/,
    /vw\b/,
    /%/,
    /\bmm\b/,
    /\brem\b/,
    /\bem\b/,
    /calc\(/,
    /clamp\(/,
    /min\(/,
    /max\(/
];

function getOptionValue(name) {
    const inlinePrefix = `${name}=`;
    const inlineArg = process.argv.find((arg) => arg.startsWith(inlinePrefix));
    if (inlineArg) return inlineArg.slice(inlinePrefix.length);

    const index = process.argv.indexOf(name);
    if (index === -1) return null;

    const value = process.argv[index + 1];
    return value && !value.startsWith('--') ? value : null;
}

function getPathArgs() {
    const args = [];
    const optionsWithValue = new Set(['--format', '--write', '--max-samples']);

    for (let index = 2; index < process.argv.length; index += 1) {
        const arg = process.argv[index];
        if (optionsWithValue.has(arg)) {
            index += 1;
            continue;
        }

        if ([...optionsWithValue].some((option) => arg.startsWith(`${option}=`))) {
            continue;
        }

        if (arg.startsWith('--')) {
            continue;
        }

        args.push(arg);
    }

    return args;
}

function toRel(absPath) {
    return path.relative(ROOT, absPath).replace(/\\/g, '/');
}

function resolveFiles(args) {
    const candidates = args.length > 0 ? args : DEFAULT_FILES;
    return candidates.map((file) => path.resolve(ROOT, file));
}

function cleanSelector(value) {
    return value
        .replace(/\/\*.*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function hasException(lines, lineIndex) {
    const start = Math.max(0, lineIndex - 4);
    const context = lines.slice(start, lineIndex + 1).join('\n');
    return /ui-token-exception\s*:/i.test(context);
}

function isHardcodedStyleValue(value) {
    const trimmed = value.trim();
    if (!trimmed || trimmed.includes('var(')) return false;
    if (/^(0|none|auto|inherit|initial|unset)$/i.test(trimmed)) return false;
    return /-?\d*\.?\d+(px|rem|em|vh|vw|%|mm)\b/.test(trimmed);
}

function classify(prop, value, exempted) {
    if (exempted) return 'exempted';

    const tokenHint = TOKEN_HINTS.find((hint) => hint.test(prop, value));
    if (tokenHint) {
        return 'token-candidate';
    }

    if (REVIEW_PATTERNS.some((pattern) => pattern.test(value))) {
        return 'review';
    }

    return 'review';
}

function suggestToken(prop, value) {
    const tokenHint = TOKEN_HINTS.find((hint) => hint.test(prop, value));
    return tokenHint ? tokenHint.token : '';
}

function scanCssFile(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`CSS file not found: ${toRel(filePath)}`);
    }

    const source = fs.readFileSync(filePath, 'utf8');
    const lines = source.split(/\r?\n/);
    const findings = [];
    const selectorStack = [];

    for (let index = 0; index < lines.length; index += 1) {
        const rawLine = lines[index];
        const line = rawLine.trim();

        if (line.includes('{')) {
            const selector = cleanSelector(line.split('{')[0]);
            if (selector) selectorStack.push(selector);
        }

        const currentSelector = selectorStack
            .filter((selector) => !selector.startsWith('@'))
            .slice(-1)[0] || selectorStack.slice(-1)[0] || '';

        const declaration = line.match(/^([a-zA-Z-]+)\s*:\s*([^;]+);/);
        if (declaration) {
            const prop = declaration[1];
            const value = declaration[2].trim();

            if (STYLE_PROPS.has(prop) && isHardcodedStyleValue(value)) {
                const exempted = hasException(lines, index);
                const classification = classify(prop, value, exempted);
                findings.push({
                    file: toRel(filePath),
                    line: index + 1,
                    selector: currentSelector,
                    property: prop,
                    value,
                    classification,
                    suggestedToken: suggestToken(prop, value)
                });
            }
        }

        if (line.includes('}')) {
            const closeCount = (line.match(/}/g) || []).length;
            for (let closeIndex = 0; closeIndex < closeCount; closeIndex += 1) {
                selectorStack.pop();
            }
        }
    }

    return findings;
}

function countBy(items, keyFn) {
    return items.reduce((acc, item) => {
        const key = keyFn(item);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
}

function sortCountEntries(counts) {
    return Object.entries(counts)
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

function buildSummary(findings) {
    const byClassification = countBy(findings, (finding) => finding.classification);
    const byProperty = countBy(findings, (finding) => finding.property);
    const byValue = countBy(findings, (finding) => `${finding.property}: ${finding.value}`);

    return {
        total: findings.length,
        tokenCandidates: byClassification['token-candidate'] || 0,
        review: byClassification.review || 0,
        exempted: byClassification.exempted || 0,
        byClassification,
        byProperty: sortCountEntries(byProperty),
        byValue: sortCountEntries(byValue)
    };
}

function renderHuman(report, maxSamples) {
    const lines = [];
    lines.push('═════════════════════════════════════════════════════════════════');
    lines.push('  MES UI Style Audit');
    lines.push('═════════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Scanned files: ${report.files.join(', ')}`);
    lines.push(`Total hardcoded spacing/radius findings: ${report.summary.total}`);
    lines.push(`Token candidates: ${report.summary.tokenCandidates}`);
    lines.push(`Needs review: ${report.summary.review}`);
    lines.push(`Covered by ui-token-exception: ${report.summary.exempted}`);
    lines.push('');

    lines.push('Top properties:');
    report.summary.byProperty.slice(0, 12).forEach(([key, count]) => {
        lines.push(`  ${String(count).padStart(4, ' ')}  ${key}`);
    });
    lines.push('');

    lines.push('Top values:');
    report.summary.byValue.slice(0, 15).forEach(([key, count]) => {
        lines.push(`  ${String(count).padStart(4, ' ')}  ${key}`);
    });

    if (maxSamples > 0) {
        lines.push('');
        lines.push(`Samples (${Math.min(maxSamples, report.findings.length)}):`);
        report.findings.slice(0, maxSamples).forEach((finding) => {
            const token = finding.suggestedToken ? ` -> ${finding.suggestedToken}` : '';
            lines.push(`  ${finding.file}:${finding.line} ${finding.property}: ${finding.value} [${finding.classification}]${token}`);
            if (finding.selector) lines.push(`      ${finding.selector}`);
        });
    }

    return `${lines.join('\n')}\n`;
}

function renderMarkdown(report) {
    const lines = [];
    lines.push('# UI Style Audit');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push(`Scanned files: ${report.files.map((file) => `\`${file}\``).join(', ')}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push('| Item | Count |');
    lines.push('|------|------:|');
    lines.push(`| Total hardcoded spacing/radius findings | ${report.summary.total} |`);
    lines.push(`| Token candidates | ${report.summary.tokenCandidates} |`);
    lines.push(`| Needs review | ${report.summary.review} |`);
    lines.push(`| Covered by ui-token-exception | ${report.summary.exempted} |`);
    lines.push('');
    lines.push('## Top Properties');
    lines.push('');
    lines.push('| Property | Count |');
    lines.push('|----------|------:|');
    report.summary.byProperty.slice(0, 20).forEach(([key, count]) => {
        lines.push(`| \`${key}\` | ${count} |`);
    });
    lines.push('');
    lines.push('## Top Values');
    lines.push('');
    lines.push('| Value | Count |');
    lines.push('|-------|------:|');
    report.summary.byValue.slice(0, 30).forEach(([key, count]) => {
        lines.push(`| \`${key}\` | ${count} |`);
    });
    lines.push('');
    lines.push('## Findings');
    lines.push('');
    lines.push('| File | Line | Selector | Declaration | Classification | Suggested token |');
    lines.push('|------|-----:|----------|-------------|----------------|-----------------|');
    report.findings.forEach((finding) => {
        const selector = finding.selector.replace(/\|/g, '\\|');
        const declaration = `${finding.property}: ${finding.value}`;
        lines.push(`| \`${finding.file}\` | ${finding.line} | \`${selector}\` | \`${declaration}\` | ${finding.classification} | ${finding.suggestedToken || ''} |`);
    });
    lines.push('');
    return `${lines.join('\n')}\n`;
}

function main() {
    const format = getOptionValue('--format') || 'human';
    const writePath = getOptionValue('--write');
    const maxSamples = Number(getOptionValue('--max-samples') || 25);
    const failOnIssues = process.argv.includes('--fail-on-issues');
    const pathArgs = getPathArgs();
    const files = resolveFiles(pathArgs);

    const findings = files.flatMap(scanCssFile);
    const report = {
        files: files.map(toRel),
        summary: buildSummary(findings),
        findings
    };

    if (writePath) {
        const absWritePath = path.resolve(ROOT, writePath === 'default' ? DEFAULT_REPORT : writePath);
        fs.mkdirSync(path.dirname(absWritePath), { recursive: true });
        fs.writeFileSync(absWritePath, renderMarkdown(report), 'utf8');
    }

    if (format === 'json') {
        process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
        process.stdout.write(renderHuman(report, maxSamples));
    }

    if (failOnIssues && report.summary.tokenCandidates > 0) {
        process.exitCode = 1;
    }
}

try {
    main();
} catch (error) {
    console.error(`UI style audit failed: ${error.message}`);
    process.exitCode = 1;
}
