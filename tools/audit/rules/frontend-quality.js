'use strict';

const fs = require('fs');
const path = require('path');

const WARN_LINES = 1000;
const ERROR_LINES = 2000;

const BTN_ALONE_REGEX = /class=["'](?![^"']*\bbtn\b)[^"']*(primary|outline|danger|secondary|ghost|text)(?![a-z-])[^"']*["']/;
const DEPRECATED_BTN_REGEX = /class=["'][^"']*(btn-icon|icon-btn|btn-primary|btn-danger|btn-default)[^"']*["']/;
const BOOTSTRAP_TABLE_REGEX = /class=["'][^"']*(table-bordered|table-hover|table-striped|table-condensed)[^"']*["']/;
const INLINE_STYLE_REGEX = /style="(?!display:\s*none\s*;?\s*")/;

function classifyJsFileSize(lineCount) {
    if (lineCount >= ERROR_LINES) return 'error';
    if (lineCount >= WARN_LINES) return 'warning';
    return null;
}

function checkJsFileSize({
    root,
    reportError,
    reportWarning,
    log = console.log
}) {
    log('🔍 [F-1] 檢查 JS 檔案大小...');

    const jsDir = path.join(root, 'js');
    if (!fs.existsSync(jsDir)) return;

    fs.readdirSync(jsDir)
        .filter(file => file.endsWith('.js'))
        .forEach((file) => {
            const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
            const lineCount = content.split('\n').length;
            const classification = classifyJsFileSize(lineCount);

            if (classification === 'error') {
                reportWarning(
                    '前端',
                    `js/${file}`,
                    'F-1 JS 檔案過大',
                    `${file} 有 ${lineCount} 行，超過建議上限 ${ERROR_LINES} 行`,
                    '將模組拆分為：資料存取層、業務邏輯層、UI 渲染層，分別存放在不同檔案中'
                );
            } else if (classification === 'warning') {
                reportWarning(
                    '前端',
                    `js/${file}`,
                    'F-1 JS 檔案過大',
                    `${file} 有 ${lineCount} 行，接近建議上限（${WARN_LINES} 行）`,
                    '考慮將部分功能（例如列印、匯出、詳情顯示）拆分到獨立模組'
                );
            }
        });
}

function scanModuleHtmlStyle(content) {
    const result = {
        buttonMissingPrefix: [],
        deprecatedButtonClass: [],
        bootstrapTableClass: [],
        inlineStyle: []
    };

    String(content || '').split('\n').forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('<!--')) return;

        if (/<button/.test(trimmed)) {
            if (BTN_ALONE_REGEX.test(trimmed)) {
                result.buttonMissingPrefix.push(index + 1);
            }
            if (DEPRECATED_BTN_REGEX.test(trimmed)) {
                result.deprecatedButtonClass.push(index + 1);
            }
        }

        if (BOOTSTRAP_TABLE_REGEX.test(trimmed)) {
            result.bootstrapTableClass.push(index + 1);
        }

        if (INLINE_STYLE_REGEX.test(trimmed)) {
            result.inlineStyle.push(index + 1);
        }
    });

    return result;
}

function formatLines(lines) {
    return lines.map(line => `L${line}`).join(', ');
}

function checkModuleHtmlStyle({
    root,
    reportError,
    reportWarning,
    log = console.log
}) {
    log('🔍 [M-1] 檢查 modules/ HTML 樣式規範...');

    const modulesDir = path.join(root, 'modules');
    if (!fs.existsSync(modulesDir)) return;

    fs.readdirSync(modulesDir)
        .filter(file => file.endsWith('.html') && !file.endsWith('.bak'))
        .forEach((file) => {
            const content = fs.readFileSync(path.join(modulesDir, file), 'utf8');
            const result = scanModuleHtmlStyle(content);

            if (result.buttonMissingPrefix.length > 0) {
                reportError(
                    '前端',
                    `modules/${file}`,
                    'M-1 按鈕缺少 btn 前綴',
                    `${file} 在 ${formatLines(result.buttonMissingPrefix)} 行的按鈕 class 缺少 btn 前綴（如 class="outline" 應為 class="btn outline"）`,
                    '所有按鈕必須使用 class="btn primary"、class="btn outline" 等完整樣式，不可只用 class="primary"'
                );
            }

            if (result.deprecatedButtonClass.length > 0) {
                reportWarning(
                    '前端',
                    `modules/${file}`,
                    'M-1 已棄用的按鈕樣式',
                    `${file} 在 ${formatLines(result.deprecatedButtonClass)} 行使用了已棄用的按鈕類別（btn-icon、icon-btn 等）`,
                    '改用 class="btn text" 或 class="btn text danger"，移除 btn-icon、icon-btn 等已棄用樣式'
                );
            }

            if (result.bootstrapTableClass.length > 0) {
                reportError(
                    '前端',
                    `modules/${file}`,
                    'M-1 Bootstrap 表格類別',
                    `${file} 在 ${formatLines(result.bootstrapTableClass)} 行使用了 Bootstrap 表格類別（系統不使用 Bootstrap）`,
                    '改用系統表格類別 class="data-table"，移除 table-bordered、table-hover、table-striped 等 Bootstrap 類別'
                );
            }

            if (result.inlineStyle.length > 0) {
                reportWarning(
                    '前端',
                    `modules/${file}`,
                    'M-1 HTML 內聯樣式',
                    `${file} 在 ${formatLines(result.inlineStyle)} 行有 inline style（除 display:none 外均應移至 CSS）`,
                    '將 inline style 移至 styles.css，欄位寬度使用 .col-80/.col-100 等工具類別，佈局用 .subsection-header/.info-box 等語義類別'
                );
            }
        });
}

module.exports = {
    checkJsFileSize,
    checkModuleHtmlStyle,
    classifyJsFileSize,
    scanModuleHtmlStyle
};
