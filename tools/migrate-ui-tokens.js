#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const target = path.resolve(__dirname, '..', 'styles.css');
const allowed = new Set(['4', '5', '6', '8', '10', '12', '16', '20', '24']);
const heights = new Set(['28', '30', '32', '34', '36', '38', '40']);
const radii = new Set(['4', '6', '8', '10', '12', '999']);
const paddingValues = new Set(['4px 6px', '4px 8px', '5px 6px', '6px 8px', '8px 10px', '10px 12px', '12px 16px', '4px', '6px', '8px', '10px', '12px']);
const gapValues = new Set(['4px', '6px', '8px', '10px', '12px', '8px 10px', '8px 12px', '10px 12px']);
const marginValues = new Set(['4px', '6px', '8px', '10px', '12px', '16px', '20px', '24px']);

function tokenized(value, kind = 'space') {
    return value.replace(/(\d+)px/g, (_, number) => {
        if (kind === 'height') return `var(--ui-control-height-${number}px)`;
        if (kind === 'radius') return number === '999' ? 'var(--ui-radius-pill)' : `var(--ui-radius-${number}px)`;
        return allowed.has(number) ? `var(--ui-space-${number}px)` : `${number}px`;
    });
}

let changed = 0;
const source = fs.readFileSync(target, 'utf8');
const output = source.replace(/^(\s*)([a-z-]+)\s*:\s*([^;]+);/gm, (line, indent, property, rawValue) => {
    // Custom properties are token definitions, not token consumers. Rewriting
    // them can create cycles such as --ui-radius-pill: var(--ui-radius-pill).
    if (property.startsWith('--')) return line;
    const value = rawValue.trim();
    let kind = '';
    if (property.startsWith('padding') && paddingValues.has(value)) kind = 'space';
    else if (['gap', 'row-gap', 'column-gap'].includes(property) && gapValues.has(value)) kind = 'space';
    else if (property.includes('height') && heights.has(value.replace('px', ''))) kind = 'height';
    else if (property.includes('radius') && radii.has(value.replace('px', ''))) kind = 'radius';
    else if (property.startsWith('margin') && marginValues.has(value)) kind = 'space';
    if (!kind) return line;
    changed += 1;
    return `${indent}${property}: ${tokenized(value, kind)};`;
});

if (!process.argv.includes('--write')) {
    console.log(`${changed} 個 token candidate 可轉換；加上 --write 套用。`);
    process.exit(0);
}
fs.writeFileSync(target, output, 'utf8');
console.log(`已將 ${changed} 個 token candidate 轉為設計 token。`);
