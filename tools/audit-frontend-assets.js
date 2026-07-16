#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.php'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'core', 'module-assets.js'), 'utf8');
const localScripts = [...index.matchAll(/<script[^>]+src="(?!https?:\/\/)([^"?]+)[^"]*"/g)].map(match => match[1]);
const bytes = localScripts.reduce((total, file) => {
    const absolute = path.join(root, file);
    return total + (fs.existsSync(absolute) ? fs.statSync(absolute).size : 0);
}, 0);
const errors = [];

if (localScripts.length > 12) errors.push(`入口本機腳本 ${localScripts.length} 支，超過預算 12 支`);
if (bytes > 1024 * 1024) errors.push(`入口本機腳本 ${(bytes / 1024).toFixed(1)} KiB，超過預算 1024 KiB`);

const configDir = path.join(root, 'core', 'configs');
for (const file of fs.readdirSync(configDir).filter(name => name.endsWith('.config.js'))) {
    const id = file.replace(/\.config\.js$/, '');
    if (!manifest.includes(`'${id}'`)) errors.push(`配置 ${file} 未登錄於 module-assets manifest`);
}

const directBusinessAssets = localScripts.filter(file => file.startsWith('core/configs/') || /^js\/(?!data-sync\.js|utils\.js)/.test(file));
if (directBusinessAssets.length) errors.push(`入口仍直接載入業務資產：${directBusinessAssets.join(', ')}`);

console.log(`入口資產：${localScripts.length} 支本機腳本，${(bytes / 1024).toFixed(1)} KiB`);
console.log('預算：最多 12 支、1024 KiB；業務 config/JS 必須按需載入');
if (errors.length) {
    errors.forEach(error => console.error(`ERROR: ${error}`));
    process.exit(1);
}
console.log('PASS: 前端資產預算與按需載入契約通過');
