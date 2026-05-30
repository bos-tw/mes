#!/usr/bin/env node
/**
 * MES 系統健康度審計工具
 * audit-system-health.js
 *
 * 用途：在新增或修改功能模組時，自動檢查系統的健康度與完整性。
 * 此工具涵蓋安全性、架構、前端程式碼、資料完整性與流程刪除守門的靜態分析。
 *
 * 使用方式：
 *   node tools/audit-system-health.js
 *   node tools/audit-system-health.js --fix-hints   (顯示更詳細的修復說明)
 *
 * 整合 validate-config-modules.js 之後，完整檢查請執行：
 *   node tools/validate-config-modules.js && node tools/audit-system-health.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOW_FIX_HINTS = process.argv.includes('--fix-hints');

const ERRORS   = [];
const WARNINGS = [];
const INFOS    = [];

// ─────────────────────────────────────────────
// 輔助函式
// ─────────────────────────────────────────────

function err(category, file, rule, message, fix) {
    ERRORS.push({ category, file, rule, message, fix });
}

function warn(category, file, rule, message, fix) {
    WARNINGS.push({ category, file, rule, message, fix });
}

function info(category, file, note) {
    INFOS.push({ category, file, note });
}

function readFile(rel) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return null;
    return fs.readFileSync(abs, 'utf-8');
}

function fileExists(rel) {
    return fs.existsSync(path.join(ROOT, rel));
}

function listDir(rel) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs);
}

// ─────────────────────────────────────────────
// S-1  硬編碼資料庫憑證
// ─────────────────────────────────────────────
function checkHardcodedCredentials() {
    console.log('🔍 [S-1] 檢查硬編碼資料庫憑證...');

    const configContent = readFile('api/config.php');
    if (!configContent) {
        warn('安全性', 'api/config.php', 'S-1 硬編碼憑證', '找不到 config.php，無法驗證', '確認檔案是否存在');
        return;
    }

    // 偵測是否有明文密碼定義（非環境變數形式）
    if (/define\s*\(\s*['"]DB_PASSWORD['"]\s*,\s*['"][^'"]{3,}['"]\s*\)/.test(configContent)) {
        err('安全性', 'api/config.php', 'S-1 硬編碼憑證',
            '資料庫密碼以明文硬編碼在 config.php',
            '改用環境變數：getenv(\'DB_PASSWORD\') ?: \'fallback\'，並透過 .env 或伺服器環境注入');
    }

    if (/define\s*\(\s*['"]DB_USER['"]\s*,\s*['"]root['"]\s*\)/.test(configContent)) {
        warn('安全性', 'api/config.php', 'S-1 硬編碼憑證',
            '使用 root 帳號連接資料庫（生產環境不建議）',
            '建立專用資料庫帳號，限制其只能存取 yucyuan 資料庫，並最小化權限');
    }
}

// ─────────────────────────────────────────────
// S-2  權限系統被停用
// ─────────────────────────────────────────────
function checkPermissionSystem() {
    console.log('🔍 [S-2] 檢查權限系統是否啟用...');

    const bootstrap = readFile('api/bootstrap.php');
    if (!bootstrap) return;

    // autoEnforcePermission 被注解掉
    const commentedOut = /\/\/\s*autoEnforcePermission\s*\(/.test(bootstrap) ||
                         /\/\*[\s\S]*?autoEnforcePermission[\s\S]*?\*\//.test(bootstrap);

    const activeCall = /^\s*autoEnforcePermission\s*\(/m.test(bootstrap);

    if (commentedOut && !activeCall) {
        err('安全性', 'api/bootstrap.php', 'S-2 權限系統停用',
            'autoEnforcePermission() 被注解，所有 API 端點缺乏權限控管',
            '取消注解 autoEnforcePermission()，並確認 roles / employee_roles 資料表有正確資料');
    }

    // 同時確認 roles & employee_roles 相關警告訊息
    if (!bootstrap.includes('autoEnforcePermission')) {
        info('安全性', 'api/bootstrap.php', 'autoEnforcePermission 函式不存在，可能尚未實作');
    }
}

// ─────────────────────────────────────────────
// S-3  角色 / 員工角色資料表可能為空
// ─────────────────────────────────────────────
function checkRoleFiles() {
    console.log('🔍 [S-3] 檢查角色相關 API 檔案...');

    const needed = [
        'api/roles/index.php',
        'api/roles/create.php',
        'api/employee_roles/index.php',
        'api/employee_roles/create.php'
    ];

    needed.forEach(f => {
        if (!fileExists(f)) {
            warn('安全性', f, 'S-3 角色系統', `缺少 ${f}`, '建立對應的 API 端點，並補充種子資料');
        }
    });

    // 提示需手動驗證資料庫資料
    info('安全性', 'DB: roles / employee_roles',
        '請手動確認資料庫 roles 與 employee_roles 資料表不為空；若為空，所有員工將無法取得任何系統權限');
}

// ─────────────────────────────────────────────
// S-5  列印範本缺少 credentials: 'include'
// ─────────────────────────────────────────────
function checkPrintTemplateCredentials() {
    console.log('🔍 [S-5] 檢查列印範本 API 呼叫是否攜帶 Cookie...');

    const printFiles = listDir('print').filter(f => f.endsWith('.html'));

    printFiles.forEach(fname => {
        const rel = `print/${fname}`;
        const content = readFile(rel);
        if (!content) return;

        // 尋找 fetch() 呼叫
        const fetchRegex = /fetch\s*\(\s*['"`][^'"`]*api[^'"`]*['"`]\s*([,{][^)]*?)?\)/gs;
        let match;
        const missedFetches = [];
        while ((match = fetchRegex.exec(content)) !== null) {
            const call = match[0];
            if (!call.includes('credentials')) {
                missedFetches.push(call.substring(0, 80).replace(/\n/g, ' ').trim());
            }
        }
        if (missedFetches.length > 0) {
            err('安全性', rel, 'S-5 缺少 credentials',
                `${missedFetches.length} 個 fetch() 呼叫未包含 credentials: 'include'，Cookie 不會隨請求傳送，導致 API 回傳 401\n  違規呼叫：${missedFetches.map((f, i) => `\n    [${i+1}] ${f}`).join('')}`,
                "在每個 fetch 選項中加入 credentials: 'include'");
        }

        // 特別檢查 loadReportDescription（若主迴圈已回報，此次跳過避免重複回報同一檔案）
        if (missedFetches.length === 0 &&
            (content.includes('loadReportDescription') || content.includes('report_descriptions'))) {
            if (!content.includes("credentials: 'include'") && !content.includes('credentials:"include"')) {
                err('安全性', rel, 'S-5 缺少 credentials',
                    'loadReportDescription() 或 report_descriptions API 呼叫未包含 credentials',
                    "fetch(url, { credentials: 'include' })");
            }
        }
    });
}

// ─────────────────────────────────────────────
// S-6  登入狀態硬編碼字串比對
// ─────────────────────────────────────────────
function checkLoginStatusCheck() {
    console.log('🔍 [S-6] 檢查登入員工狀態驗證...');

    const loginContent = readFile('api/login.php');
    if (!loginContent) return;

    if (/'active'/.test(loginContent) && !loginContent.includes('lookup')) {
        warn('安全性', 'api/login.php', 'S-6 硬編碼狀態字串',
            "登入驗證使用硬編碼字串 'active' 比較員工狀態，與 lookup_values 資料表不一致",
            '改為查詢 lookup_values 取得 active 對應的 id，再與 employees.status_lookup_id 比較');
    }
}

// ─────────────────────────────────────────────
// A-1  report_descriptions 模組命名不一致
// ─────────────────────────────────────────────
function checkReportDescriptionsNaming() {
    console.log('🔍 [A-1] 檢查 report_descriptions API 命名一致性...');

    const apiDir = 'api/report_descriptions';
    const files = listDir(apiDir);

    const hasNonStandard = files.some(f => ['create.php', 'list.php', 'get.php'].includes(f));
    const hasStandard    = files.some(f => ['index.php', 'show.php'].includes(f));

    if (hasNonStandard && !hasStandard) {
        warn('架構', `${apiDir}/`, 'A-1 命名不一致',
            'report_descriptions 使用 create.php/list.php/get.php，與其他 43 個模組（index.php/show.php/store.php）不同',
            '重新命名或建立對應別名；並更新所有呼叫方：print 範本與前端 JS');
    }
}

// ─────────────────────────────────────────────
// A-2  缺少 delete.php 的模組
// ─────────────────────────────────────────────
function checkMissingDeleteEndpoints() {
    console.log('🔍 [A-2] 檢查各模組是否缺少 delete 端點...');

    const apiRoot = path.join(ROOT, 'api');
    const skipDirs = new Set([
        'common', 'docs', 'tools', 'bootstrap.php', 'config.php',
        'diagnose.php', 'healthcheck.php', 'login.php', 'logout.php',
        'session.php'
    ]);

    if (!fs.existsSync(apiRoot)) return;

    fs.readdirSync(apiRoot).forEach(dir => {
        if (skipDirs.has(dir)) return;
        const dirPath = path.join(apiRoot, dir);
        if (!fs.statSync(dirPath).isDirectory()) return;

        const dirFiles = fs.readdirSync(dirPath);
        // 若有 index.php 或 create.php（真實業務模組），但沒有 delete.php
        const isModule = dirFiles.includes('index.php') || dirFiles.includes('create.php');
        if (isModule && !dirFiles.includes('delete.php')) {
            warn('架構', `api/${dir}/`, 'A-2 缺少 delete 端點',
                `模組 ${dir} 缺少 delete.php`,
                '若刪除為合法操作，請補充 delete.php；若不支援刪除，請在 README 中說明');
        }
    });
}

// ─────────────────────────────────────────────
// A-3  update.php / delete.php 接受 POST 偽裝方法
// ─────────────────────────────────────────────
function checkMethodFallback() {
    console.log('🔍 [A-3] 檢查 HTTP 方法偽裝 (POST fallback)...');

    const apiRoot = path.join(ROOT, 'api');
    if (!fs.existsSync(apiRoot)) return;

    let count = 0;
    const walkDir = (dir) => {
        fs.readdirSync(dir).forEach(item => {
            const full = path.join(dir, item);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) { walkDir(full); return; }
            if (!item.match(/^(update|delete)\.php$/)) return;

            const content = fs.readFileSync(full, 'utf-8');
            const rel = path.relative(ROOT, full).replace(/\\/g, '/');

            // 偵測 ['PUT','POST'] 或 ['DELETE','POST'] 混合接受
            if (/\[\s*['"](?:PUT|DELETE)['"]\s*,\s*['"]POST['"]\s*\]/.test(content) ||
                /\[\s*['"]POST['"]\s*,\s*['"](?:PUT|DELETE)['"]\s*\]/.test(content)) {
                // 每個違規檔案都個別回報（不再只報第一個）
                warn('架構', rel, 'A-3 POST 偽裝',
                    `${rel} 允許 POST 作為 PUT/DELETE 的替代方法（HTTP 方法偽裝）`,
                    '只接受標準 HTTP 方法；前端應在 fetch() 中正確設定 method: \'PUT\' 或 method: \'DELETE\'');
                count++;
            }
        });
    };
    walkDir(apiRoot);

    if (count > 0) {
        info('架構', `api/ (${count} 個檔案)`,
            `共 ${count} 個 update.php/delete.php 允許 POST 偽裝，已逐一列於上方；建議統一改為標準 HTTP 方法後移除 POST fallback`);
    }
}

// ─────────────────────────────────────────────
// F-1  JS 檔案過大
// ─────────────────────────────────────────────
function checkJsFileSize() {
    console.log('🔍 [F-1] 檢查 JS 檔案大小...');

    const WARN_LINES  = 1000;
    const ERROR_LINES = 2000;

    const jsDir = path.join(ROOT, 'js');
    if (!fs.existsSync(jsDir)) return;

    fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).forEach(fname => {
        const content = fs.readFileSync(path.join(jsDir, fname), 'utf-8');
        const lines = content.split('\n').length;

        if (lines >= ERROR_LINES) {
            err('前端', `js/${fname}`, 'F-1 JS 檔案過大',
                `${fname} 有 ${lines} 行，超過建議上限 ${ERROR_LINES} 行`,
                '將模組拆分為：資料存取層、業務邏輯層、UI 渲染層，分別存放在不同檔案中');
        } else if (lines >= WARN_LINES) {
            warn('前端', `js/${fname}`, 'F-1 JS 檔案過大',
                `${fname} 有 ${lines} 行，接近建議上限（${WARN_LINES} 行）`,
                '考慮將部分功能（例如列印、匯出、詳情顯示）拆分到獨立模組');
        }
    });
}

// ─────────────────────────────────────────────
// F-2  列印範本無法取得 CSRF Token
// ─────────────────────────────────────────────
function checkPrintTemplateCsrf() {
    console.log('🔍 [F-2] 檢查列印範本 CSRF Token 機制...');

    const printFiles = listDir('print').filter(f => f.endsWith('.html'));

    printFiles.forEach(fname => {
        const rel = `print/${fname}`;
        const content = readFile(rel);
        if (!content) return;

        // 只有在有 fetch 的範本才需要 CSRF
        if (!content.includes('fetch(')) return;

        // 若使用 sessionStorage 取 CSRF（sessionStorage 跨分頁不共享）
        if (content.includes("sessionStorage") && content.includes('csrf')) {
            warn('前端', rel, 'F-2 CSRF Token 取得問題',
                'sessionStorage 無法跨分頁共享，列印視窗將取不到 CSRF Token',
                '改用 Cookie-based CSRF（SameSite=Strict）或在每個 API 端點呼叫前透過獨立端點取得 token');
        }
    });
}

// ─────────────────────────────────────────────
// F-3  JS 模組 console.log 殘留
// ─────────────────────────────────────────────
function checkJsConsoleLog() {
    console.log('🔍 [F-3] 檢查 JS 模組 console.log 殘留...');

    const jsDir = path.join(ROOT, 'js');
    if (!fs.existsSync(jsDir)) return;

    // 排除 utils.js、data-sync.js（這些是框架/工具檔案，console 用法合理）
    const EXCLUDE = ['utils.js', 'data-sync.js'];

    fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !EXCLUDE.includes(f)).forEach(fname => {
        const content = fs.readFileSync(path.join(jsDir, fname), 'utf-8');
        // 找出非 warn/error/info 的 console.log（排除注釋行及區塊注釋）
        const lines = content.split('\n');
        let debugLogCount = 0;
        let inBlockComment = false;
        lines.forEach(line => {
            const trimmed = line.trim();
            // 追蹤 /* */ 區塊注釋狀態
            if (inBlockComment) {
                if (trimmed.includes('*/')) inBlockComment = false;
                return;
            }
            if (trimmed.startsWith('/*')) {
                if (!trimmed.includes('*/')) inBlockComment = true;
                return;
            }
            if (trimmed.startsWith('//')) return; // 單行注釋跳過
            if (/console\.log\s*\(/.test(trimmed)) {
                debugLogCount++;
            }
        });

        if (debugLogCount > 0) {
            warn('前端', `js/${fname}`, 'F-3 console.log 殘留',
                `${fname} 包含 ${debugLogCount} 個 console.log，上線前應移除以避免暴露系統資訊`,
                '將 console.log 全部移除或改為只在開發模式下輸出（const DEBUG = false;）');
        }
    });
}

// ─────────────────────────────────────────────
// J-1  JS 模組結構規範（'use strict' + IIFE + data-initialised）
// ─────────────────────────────────────────────
function checkJsModuleStructure() {
    console.log('🔍 [J-1] 檢查 JS 模組結構規範...');

    const jsDir = path.join(ROOT, 'js');
    if (!fs.existsSync(jsDir)) return;

    // 排除工具/框架檔案
    const EXCLUDE = ['utils.js', 'data-sync.js'];

    fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !EXCLUDE.includes(f)).forEach(fname => {
        const content = fs.readFileSync(path.join(jsDir, fname), 'utf-8');

        // 1. 'use strict'
        if (!content.includes("'use strict'")) {
            warn('前端', `js/${fname}`, 'J-1 缺少 use strict',
                `${fname} 缺少 'use strict'，無法捕捉靜默錯誤`,
                "在 IIFE 頂端加入 'use strict';");
        }

        // 2. IIFE 包裹 — 有 window.initialize 的模組應使用 IIFE 避免全域污染
        const hasInitExpose = /window\.initialize\w+\s*=/.test(content);
        const hasIIFE = /^\s*\(function\s*\(\s*\)/m.test(content);
        if (hasInitExpose && !hasIIFE) {
            warn('前端', `js/${fname}`, 'J-1 缺少 IIFE',
                `${fname} 直接在全域定義 window.initialize*，應使用 IIFE 避免污染全域命名空間`,
                '將整個模組包裹在 (function() { ... })();');
        }

        // 3. data-initialised 防重複初始化
        if (hasInitExpose && !content.includes('dataset.initialised')) {
            warn('前端', `js/${fname}`, 'J-1 缺少防重複初始化守衛',
                `${fname} 的初始化函數缺少 dataset.initialised 檢查，切換分頁時可能觸發重複初始化`,
                "在初始化函數開頭加入: if (!moduleRoot || moduleRoot.dataset.initialised === 'true') return; moduleRoot.dataset.initialised = 'true';");
        }
    });
}

// ─────────────────────────────────────────────
// J-2  JS 模組 XSS 風險（innerHTML 未用 escapeHtml）
// ─────────────────────────────────────────────
function checkJsXssRisk() {
    console.log('🔍 [J-2] 檢查 JS innerHTML XSS 風險...');

    const jsDir = path.join(ROOT, 'js');
    if (!fs.existsSync(jsDir)) return;

    const EXCLUDE = ['utils.js', 'data-sync.js', 'column_manager.js'];

    // 安全的插值：純數字/布林/格式化函數輸出/data-id 屬性
    const SAFE_CONTEXT = /formatDate|formatNumber|formatCurrency|formatDateTime|\.textContent|data-id=|data-page=|data-action=|item\.id\b|data\.id\b|record\.id\b|row\.id\b|\|\|\s*0|\|\|\s*'-'|parseInt|parseFloat|Number\(/;

    fs.readdirSync(jsDir)
        .filter(f => f.endsWith('.js') && !f.endsWith('.bak') && !EXCLUDE.includes(f))
        .forEach(fname => {
            const lines = fs.readFileSync(path.join(jsDir, fname), 'utf-8').split('\n');
            const hits = [];

            lines.forEach((line, i) => {
                const trimmed = line.trim();
                // 跳過註解行
                if (trimmed.startsWith('//')) return;
                // ① 單行 innerHTML 賦值含有模板插值
                if (/innerHTML\s*[+]?=/.test(trimmed) && /\$\{/.test(trimmed)) {
                    if (!trimmed.includes('escapeHtml') && !SAFE_CONTEXT.test(trimmed)) {
                        hits.push(`L${i + 1}`);
                    }
                }
                // ② 多行模板字串內部行：HTML 標籤直接包裹未逸出的插值
                // 典型模式：`<td>${item.name}</td>`、`<span>${data.customer}</span>`
                if (/<(?:td|th|span|div|p|li|a|label|h[1-6]|strong|em)[^>]*>\$\{/.test(trimmed)) {
                    if (!trimmed.includes('escapeHtml') && !SAFE_CONTEXT.test(trimmed)) {
                        hits.push(`L${i + 1}`);
                    }
                }
            });

            if (hits.length > 0) {
                err('前端', `js/${fname}`, 'J-2 XSS 風險：innerHTML 未用 escapeHtml',
                    `${fname} 在 ${hits.join(', ')} 行直接將伺服器資料插入 innerHTML 而未呼叫 escapeHtml()，可能導致 XSS`,
                    '所有插入 innerHTML 的使用者提供的字串欄位（名稱、地址、備註等）必須用 escapeHtml() 包裹');
            }
        });
}

// ─────────────────────────────────────────────
// D-3  雙重狀態欄位（status + status_lookup_id）
// ─────────────────────────────────────────────
function checkDualStatusFields() {
    console.log('🔍 [D-3] 檢查雙重狀態欄位...');

    // 靜態分析：掃描 API PHP 檔案是否同時使用兩種狀態欄位
    const apiRoot = path.join(ROOT, 'api');
    if (!fs.existsSync(apiRoot)) return;

    const affected = [];
    const skipDirs = new Set(['common', 'docs', 'tools', 'workflow_guard']);

    const walkDir = (dir) => {
        fs.readdirSync(dir).forEach(item => {
            const full = path.join(dir, item);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                const relDir = path.relative(apiRoot, full).replace(/\\/g, '/').split('/')[0];
                if (!skipDirs.has(relDir)) {
                    walkDir(full);
                }
                return;
            }
            if (!item.endsWith('.php')) return;

            const content = fs.readFileSync(full, 'utf-8');
            if (content.includes('status_lookup_id') && /[`'"]status[`'"]/.test(content)) {
                const rel = path.relative(ROOT, full).replace(/\\/g, '/');
                // 排除 bootstrap / lookup 本身
                if (!rel.includes('bootstrap') && !rel.includes('lookup')) {
                    affected.push(rel);
                }
            }
        });
    };
    walkDir(apiRoot);

    // 去重：只取目錄
    const affectedDirs = [...new Set(affected.map(f => f.split('/').slice(0, 2).join('/')))];

    if (affectedDirs.length > 0) {
        warn('資料完整性', affectedDirs.join(', '), 'D-3 雙重狀態欄位',
            `以下模組同時使用 status（varchar）和 status_lookup_id（FK），造成欄位語意重複：${affectedDirs.join(', ')}`,
            '在資料庫規格書確認主要狀態欄位後，棄用另一個；至少在 API 輸出層應統一回傳同一欄位');
    }
}

// ─────────────────────────────────────────────
// D-6  order_items 缺少軟刪除欄位
// ─────────────────────────────────────────────
function checkOrderItemsSoftDelete() {
    console.log('🔍 [D-6] 檢查 order_items 軟刪除欄位...');

    const files = [
        'api/order_items/index.php',
        'api/order_items/delete.php',
        'api/order_items/create.php'
    ];

    let hasSoftDelete = false;
    files.forEach(f => {
        const content = readFile(f);
        if (content && (content.includes('deleted_at') || content.includes('is_deleted'))) {
            hasSoftDelete = true;
        }
    });

    const jsContent = readFile('js/order_items.js');
    if (jsContent && (jsContent.includes('deleted_at') || jsContent.includes('is_deleted'))) {
        hasSoftDelete = true;
    }

    if (!hasSoftDelete) {
        warn('資料完整性', 'api/order_items/', 'D-6 缺少軟刪除',
            'order_items 可能缺少軟刪除機制（deleted_at 或 is_deleted）',
            '評估是否需要保留歷史訂單明細；若需要，加入 deleted_at TIMESTAMP NULL 欄位');
    }

    info('資料完整性', 'DB: order_items',
        '請手動確認資料庫 order_items 資料表是否有 deleted_at 欄位');
}

// ─────────────────────────────────────────────
// STRUCT  API 模組標準結構檢查
// ─────────────────────────────────────────────
function checkApiModuleStructure() {
    console.log('🔍 [STRUCT] 檢查 API 模組標準結構...');

    // 此系統的建立操作由 index.php 以 POST 路由處理，不使用獨立的 create.php/store.php
    const STANDARD_FILES = ['index.php', 'update.php', 'delete.php', 'helpers.php', 'show.php'];
    const OPTIONAL_FILES = new Set(['helpers.php', 'show.php']); // 可選檔案
    const IGNORE_DIRS    = new Set(['common', 'docs', 'tools', 'domain_event_outbox', 'number_sequences',
                                     'notifications', 'messages', 'dashboard', 'profile',
                                     'audit_logs', 'reports', 'permissions', 'role_permissions',
                                     'report_descriptions']);

    const apiRoot = path.join(ROOT, 'api');
    if (!fs.existsSync(apiRoot)) return;

    fs.readdirSync(apiRoot).forEach(dir => {
        const dirPath = path.join(apiRoot, dir);
        if (!fs.statSync(dirPath).isDirectory()) return;
        if (IGNORE_DIRS.has(dir)) return;

        const dirFiles = new Set(fs.readdirSync(dirPath));

        // 只檢查有 index.php 的真實業務模組
        if (!dirFiles.has('index.php')) return;

        STANDARD_FILES.forEach(f => {
            if (!OPTIONAL_FILES.has(f) && !dirFiles.has(f)) {
                warn('架構', `api/${dir}/${f}`, 'STRUCT API 結構缺失',
                    `模組 ${dir} 缺少標準檔案 ${f}`,
                    `參考其他模組（如 customers/）補充 ${f}`);
            }
        });
    });
}

// ─────────────────────────────────────────────
// DB HINT  需手動驗證的資料庫事項
// ─────────────────────────────────────────────
function showDatabaseHints() {
    console.log('🔍 [DB] 記錄需手動驗證的資料庫項目...');

    const dbChecks = [
        { id: 'D-1', table: 'number_sequences', desc: '若此資料表為空，工單/訂單編號自動產生功能將失效', fix: '插入各單據類型的起始序號設定' },
        { id: 'D-2', table: 'companies',        desc: '若此資料表為空，列印範本中的公司資訊欄位將顯示空白', fix: '插入至少一筆公司基本資料' },
        { id: 'D-3', table: '多個資料表',       desc: '同時存在 status（varchar）和 status_lookup_id（FK）欄位', fix: '確認哪個是主要欄位，棄用另一個' },
        { id: 'D-4', table: 'lookup_domains',   desc: 'id=0 的異常紀錄可能影響 FK 參照或前端渲染邏輯', fix: '確認此紀錄是否應該存在，若為誤植請移除' },
        { id: 'D-5', table: 'message_attachments', desc: 'COMMENT 欄位可能有亂碼（字元編碼問題）', fix: '執行 ALTER TABLE 修正 COMMENT 或重建資料表' }
    ];

    dbChecks.forEach(c => {
        info('資料庫 (需手動驗證)', `DB: ${c.table}`, `[${c.id}] ${c.desc}。建議修復：${c.fix}`);
    });
}

// ─────────────────────────────────────────────
// PRINT  列印範本使用的 API 路徑一致性
// ─────────────────────────────────────────────
function checkPrintApiPaths() {
    console.log('🔍 [PRINT] 檢查列印範本 API 路徑...');

    const printFiles = listDir('print').filter(f => f.endsWith('.html'));

    printFiles.forEach(fname => {
        const rel = `print/${fname}`;
        const content = readFile(rel);
        if (!content) return;

        // 偵測是否有相對路徑跨層的問題
        const deepPaths = content.match(/['"`]\.\.\/\.\.\/api\//g);
        if (deepPaths) {
            warn('前端', rel, 'PRINT 路徑層級',
                '使用 ../../api/ 路徑，若範本移動位置將失效',
                '改用絕對路徑（/mes/api/）或設定 BASE_URL 常數');
        }
    });
}

// ─────────────────────────────────────────────
// INDEX  index.html 中未載入的配置檔
// ─────────────────────────────────────────────
function checkConfigFilesLoadedInIndex() {
    console.log('🔍 [INDEX] 檢查 index.html 是否載入所有配置檔...');

    const indexContent = readFile('index.html');
    if (!indexContent) {
        warn('架構', 'index.html', 'INDEX 載入配置', '找不到 index.html', '確認檔案是否存在');
        return;
    }

    const configDir = path.join(ROOT, 'core', 'configs');
    if (!fs.existsSync(configDir)) return;

    const configFiles = fs.readdirSync(configDir).filter(f => f.endsWith('.config.js'));

    configFiles.forEach(fname => {
        if (!indexContent.includes(fname)) {
            err('架構', `core/configs/${fname}`, 'INDEX 配置未載入',
                `配置檔 ${fname} 存在但未在 index.html 中以 <script> 標籤載入`,
                `在 index.html 加入：<script src="core/configs/${fname}"></script>`);
        }
    });
}

// ─────────────────────────────────────────────
// E-1  匯出端點完整性與安全性檢查
// ─────────────────────────────────────────────
function checkExportEndpoints() {
    console.log('🔍 [E-1] 檢查匯出端點完整性與安全性...');

    const jsDir  = path.join(ROOT, 'js');
    const apiDir = path.join(ROOT, 'api');

    if (!fs.existsSync(jsDir)) return;

    // 步驟 1：找出 JS 中所有引用 export.php 的路徑
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    const referencedExports = new Set();

    jsFiles.forEach(fname => {
        const content = fs.readFileSync(path.join(jsDir, fname), 'utf-8');
        const matches = [...content.matchAll(/api\/([a-z_/]+\/export\.php)/g)];
        matches.forEach(m => referencedExports.add(m[1]));

        // 如果 JS 用 fetch() 呼叫 export.php，且未攜帶 credentials: 'include'
        // 用 window.open / window.location 不需要 credentials（瀏覽器自動帶 Cookie）
        const hasFetchExport = /fetch\s*\([^)]*export\.php/.test(content);
        if (hasFetchExport && !content.includes("credentials: 'include'")) {
            warn('安全性', `js/${fname}`, 'E-1 export fetch 缺少 credentials',
                'JS 使用 fetch() 呼叫 export.php，但未攜帶 credentials: \'include\'，Cookie 不會被傳送',
                "在 fetch 選項中加入 credentials: 'include'");
        }
    });

    // 步驟 2：確認 PHP 檔案存在，並檢查安全性呼叫
    referencedExports.forEach(relPath => {
        const phpFile = path.join(apiDir, relPath);

        if (!fs.existsSync(phpFile)) {
            err('架構', `api/${relPath}`, 'E-1 缺少 export.php',
                `JS 引用了 api/${relPath}，但此檔案不存在`,
                `建立 api/${relPath}，參考 api/audit_logs/export.php 的實作模式`);
            return;
        }

        const content = fs.readFileSync(phpFile, 'utf-8');

        if (!content.includes('requireAuth()')) {
            err('安全性', `api/${relPath}`, 'E-1 export.php 未驗證身份',
                `api/${relPath} 缺少 requireAuth()，任何人都能下載資料`,
                '在檔案頂端加入 requireAuth();');
        }

        if (!content.includes("requireMethod('GET')") && !content.includes('requireMethod("GET")')) {
            warn('架構', `api/${relPath}`, 'E-1 export.php 未限制 HTTP 方法',
                `api/${relPath} 缺少 requireMethod('GET')，非 GET 方法可能觸發匯出`,
                "加入 requireMethod('GET');");
        }

        if (!content.includes('declare(strict_types=1)')) {
            warn('架構', `api/${relPath}`, 'E-1 export.php 缺少 strict_types',
                `api/${relPath} 缺少 declare(strict_types=1)`,
                '在 <?php 後加入 declare(strict_types=1);');
        }
    });
}

// ─────────────────────────────────────────────
// H-1  help/ 目錄 JS 完整性檢查
// ─────────────────────────────────────────────
function checkHelpDirectoryIntegrity() {
    console.log('🔍 [H-1] 檢查 help/ 目錄完整性...');

    const helpDir = 'help';
    const helpIndex = readFile(`${helpDir}/index.html`);
    if (!helpIndex) {
        info('架構', 'help/index.html', 'help/ 目錄不存在或 index.html 缺失，跳過檢查');
        return;
    }

    // 掃描 help/ 中所有 .js 檔案（排除 node_modules 等）
    const helpDirAbs = path.join(ROOT, helpDir);
    if (!fs.existsSync(helpDirAbs)) return;

    const jsFiles = fs.readdirSync(helpDirAbs).filter(f => f.endsWith('.js'));

    jsFiles.forEach(fname => {
        // 檢查是否被 index.html 引用
        if (!helpIndex.includes(`src="${fname}"`)) {
            warn('架構', `${helpDir}/${fname}`, 'H-1 help/ JS 孤立檔案',
                `${helpDir}/${fname} 未被 help/index.html 載入，等同無效檔案`,
                `在 help/index.html 加入 <script src="${fname}"></script>，或確認此檔案是否仍需要`);
        }
    });

    // 檢查 script.js 中的選取器一致性：搜尋 Modal 關閉按鈕
    const scriptContent = readFile(`${helpDir}/script.js`);
    if (scriptContent && scriptContent.includes("querySelector('.search-close')")) {
        err('前端', `${helpDir}/script.js`, 'H-1 選取器不符',
            "script.js 使用 '.search-close' 選取搜尋 Modal 關閉按鈕，但 index.html 中該按鈕的 class 為 'modal-close'，導致關閉按鈕無效",
            "將 querySelector('.search-close') 改為 querySelector('#close-search-modal') 或 querySelector('.modal-close')");
    }
}

// ─────────────────────────────────────────────
// C-1  core/ 腳本載入順序檢查
// ─────────────────────────────────────────────
function checkCoreScriptLoadOrder() {
    console.log('🔍 [C-1] 檢查 core/ 腳本載入順序...');

    const indexContent = readFile('index.html');
    if (!indexContent) return;

    const lines = indexContent.split('\n');

    // 找出各腳本的行號
    let configLine = -1, rendererLine = -1, firstConfigFileLine = Infinity;

    lines.forEach((line, i) => {
        if (line.includes('core/module-config.js'))    configLine      = i;
        if (line.includes('core/module-renderer.js'))  rendererLine    = i;
        if (line.includes('core/configs/') && line.includes('.config.js') && i < firstConfigFileLine) {
            firstConfigFileLine = i;
        }
    });

    if (configLine === -1) {
        err('架構', 'index.html', 'C-1 腳本順序',
            'index.html 未載入 core/module-config.js',
            '加入：<script src="core/module-config.js"></script>');
        return;
    }

    if (rendererLine === -1) {
        err('架構', 'index.html', 'C-1 腳本順序',
            'index.html 未載入 core/module-renderer.js',
            '加入：<script src="core/module-renderer.js"></script>');
        return;
    }

    // module-config.js 必須在 module-renderer.js 之前
    if (configLine > rendererLine) {
        err('架構', 'index.html', 'C-1 腳本順序',
            'core/module-renderer.js 在 core/module-config.js 之前載入，會導致初始化失敗',
            '將 <script src="core/module-config.js"> 移到 module-renderer.js 之前');
    }

    // module-renderer.js 必須在所有 *.config.js 之前
    if (firstConfigFileLine !== Infinity && rendererLine > firstConfigFileLine) {
        err('架構', 'index.html', 'C-1 腳本順序',
            'core/configs/*.config.js 在 core/module-renderer.js 之前載入，配置呼叫 ModuleConfig.register() 時渲染引擎尚未就緒',
            '將 core/module-renderer.js 的 <script> 標籤移到所有 core/configs/ 載入之前');
    }
}

// ─────────────────────────────────────────────
// C-2  core/configs/*.config.js 格式規範檢查
// ─────────────────────────────────────────────
function checkConfigFileFormat() {
    console.log('🔍 [C-2] 檢查 core/configs 配置格式...');

    const configDir = path.join(ROOT, 'core', 'configs');
    if (!fs.existsSync(configDir)) return;

    const configFiles = fs.readdirSync(configDir).filter(f => f.endsWith('.config.js'));

    configFiles.forEach(fname => {
        const content = fs.readFileSync(path.join(configDir, fname), 'utf-8');
        const rel = `core/configs/${fname}`;

        // 規則：不應使用舊格式 dataAction:（應為 action:）
        // 注意：dataAttr 是合法屬性，不在此範圍
        if (/(?<![a-zA-Z])dataAction\s*:/.test(content)) {
            warn('架構', rel, 'C-2 舊格式 dataAction',
                '使用舊格式屬性 dataAction:，應改為 action:',
                '將 actions[] 內的 dataAction: 改為 action:，參考 core/configs/README.md');
        }

        // 規則：icon 不應帶 fas/far 前綴（renderer 會自動補）
        if (/\bicon\s*:\s*['"]fas /.test(content)) {
            warn('架構', rel, 'C-2 icon 格式',
                "icon 值包含 'fas ' 前綴（如 'fas fa-plus'），應改為只寫 'fa-plus'",
                "將 icon: 'fas fa-plus' 改為 icon: 'fa-plus'");
        }

        // 規則：actions 內不應使用 class: 'btn ...'（應為 style:）
        if (/class\s*:\s*['"]btn\s/.test(content)) {
            warn('架構', rel, 'C-2 舊格式 class',
                "按鈕設定使用 class: 'btn ...' 舊格式，應改為 style: 'primary'/'outline'/'danger'",
                "將 class: 'btn primary' 改為 style: 'primary'，參考 core/configs/README.md");
        }

        // 規則：標準 modal（非 requiresHtmlModal）必須有 hiddenFields
        const hasRealModal = /(?<![a-zA-Z])modal\s*:\s*\{/.test(content);
        if (hasRealModal && !content.includes('requiresHtmlModal') && !content.includes('hiddenFields')) {
            err('架構', rel, 'C-2 缺少 hiddenFields',
                'modal 定義缺少 hiddenFields: [\'id\']，會導致編輯模式無法傳遞 id',
                "在 modal: { 內加入 hiddenFields: ['id']");
        }
    });
}

// ─────────────────────────────────────────────
// M-1  modules/*.html 模組 HTML 樣式規範
// ─────────────────────────────────────────────
function checkModuleHtmlStyle() {
    console.log('🔍 [M-1] 檢查 modules/ HTML 樣式規範...');

    const modulesDir = path.join(ROOT, 'modules');
    if (!fs.existsSync(modulesDir)) return;

    // 按鈕 class 含有 btn-style 關鍵字但缺少 "btn" 前綴（支援多個類別，如 class="primary large"）
    // 正確用法是 class="btn primary"、class="btn outline"
    const BTN_ALONE_REGEX = /class=["'](?![^"']*\bbtn\b)[^"']*(primary|outline|danger|secondary|ghost|text)(?![a-z-])[^"']*["']/;

    // 舊式/已棄用的按鈕樣式類別
    const DEPRECATED_BTN_REGEX = /class=["'][^"']*(btn-icon|icon-btn|btn-primary|btn-danger|btn-default)[^"']*["']/;

    // Bootstrap 表格類別（此系統不使用 Bootstrap）
    const BOOTSTRAP_TABLE_REGEX = /class=["'][^"']*(table-bordered|table-hover|table-striped|table-condensed)[^"']*["']/;

    // inline style：僅排除整個 style 值恰好為 "display:none"（JS 隱藏用途），其餘均視為違規
    const INLINE_STYLE_REGEX = /style="(?!display:\s*none\s*;?\s*")/;

    fs.readdirSync(modulesDir)
        .filter(f => f.endsWith('.html') && !f.endsWith('.bak'))
        .forEach(fname => {
            const filePath = path.join(modulesDir, fname);
            const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
            const btnErrors = [];
            const deprecatedBtnErrors = [];
            const bootstrapErrors = [];
            const inlineStyleWarnings = [];

            lines.forEach((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('<!--')) return; // 跳過 HTML 注釋行

                // 檢查按鈕缺少 btn 前綴（只檢查 <button 標籤）
                if (/<button/.test(trimmed)) {
                    if (BTN_ALONE_REGEX.test(trimmed)) {
                        btnErrors.push(`L${i + 1}`);
                    }
                    if (DEPRECATED_BTN_REGEX.test(trimmed)) {
                        deprecatedBtnErrors.push(`L${i + 1}`);
                    }
                }

                // 檢查 Bootstrap 表格類別
                if (BOOTSTRAP_TABLE_REGEX.test(trimmed)) {
                    bootstrapErrors.push(`L${i + 1}`);
                }

                // 檢查 inline style（排除 display:none）
                if (INLINE_STYLE_REGEX.test(trimmed)) {
                    inlineStyleWarnings.push(`L${i + 1}`);
                }
            });

            if (btnErrors.length > 0) {
                err('前端', `modules/${fname}`, 'M-1 按鈕缺少 btn 前綴',
                    `${fname} 在 ${btnErrors.join(', ')} 行的按鈕 class 缺少 btn 前綴（如 class="outline" 應為 class="btn outline"）`,
                    '所有按鈕必須使用 class="btn primary"、class="btn outline" 等完整樣式，不可只用 class="primary"');
            }

            if (deprecatedBtnErrors.length > 0) {
                warn('前端', `modules/${fname}`, 'M-1 已棄用的按鈕樣式',
                    `${fname} 在 ${deprecatedBtnErrors.join(', ')} 行使用了已棄用的按鈕類別（btn-icon、icon-btn 等）`,
                    '改用 class="btn text" 或 class="btn text danger"，移除 btn-icon、icon-btn 等已棄用樣式');
            }

            if (bootstrapErrors.length > 0) {
                err('前端', `modules/${fname}`, 'M-1 Bootstrap 表格類別',
                    `${fname} 在 ${bootstrapErrors.join(', ')} 行使用了 Bootstrap 表格類別（系統不使用 Bootstrap）`,
                    '改用系統表格類別 class="data-table"，移除 table-bordered、table-hover、table-striped 等 Bootstrap 類別');
            }

            if (inlineStyleWarnings.length > 0) {
                warn('前端', `modules/${fname}`, 'M-1 HTML 內聯樣式',
                    `${fname} 在 ${inlineStyleWarnings.join(', ')} 行有 inline style（除 display:none 外均應移至 CSS）`,
                    '將 inline style 移至 styles.css，欄位寬度使用 .col-80/.col-100 等工具類別，佈局用 .subsection-header/.info-box 等語義類別');
            }
        });
}

// ─────────────────────────────────────────────
// P-1  PHP API 端點安全性基準（requireAuth + strict_types）
// ─────────────────────────────────────────────
function checkPhpApiSecurity() {
    console.log('🔍 [P-1] 檢查 PHP API 端點安全性基準...');

    // 寫入端點必須有 requireAuth()（讀取端點通常也需要，但這裡只強制寫入端點）
    // 注意：export.php 由 E-1 規則獨立檢查，此處不重複
    const WRITE_FILES = ['create.php', 'update.php', 'delete.php'];
    // 所有 CRUD 端點都應有 strict_types（export.php 由 E-1 獨立檢查）
    const ALL_CRUD    = ['index.php', 'create.php', 'update.php', 'delete.php', 'show.php'];
    const SKIP_DIRS   = new Set(['common', 'docs', 'tools', 'domain_event_outbox']);

    const apiRoot = path.join(ROOT, 'api');
    if (!fs.existsSync(apiRoot)) return;

    const strictMissing = [];
    const authMissing   = [];

    fs.readdirSync(apiRoot).forEach(dir => {
        const dirPath = path.join(apiRoot, dir);
        if (!fs.statSync(dirPath).isDirectory()) return;
        if (SKIP_DIRS.has(dir)) return;

        ALL_CRUD.forEach(fname => {
            const filePath = path.join(dirPath, fname);
            if (!fs.existsSync(filePath)) return;
            const content = fs.readFileSync(filePath, 'utf-8');
            if (!content.includes('declare(strict_types=1)'))
                strictMissing.push(`api/${dir}/${fname}`);
        });

        WRITE_FILES.forEach(fname => {
            const filePath = path.join(dirPath, fname);
            if (!fs.existsSync(filePath)) return;
            const content = fs.readFileSync(filePath, 'utf-8');
            // 排除被注釋掉的 requireAuth()（僅匹配非注釋行）
            const hasAuth = content.split('\n').some(line => {
                const t = line.trim();
                return !t.startsWith('//') && !t.startsWith('*') && t.includes('requireAuth()');
            });
            if (!hasAuth)
                authMissing.push(`api/${dir}/${fname}`);
        });
    });

    if (authMissing.length > 0) {
        err('安全性', `api/ (${authMissing.length} 個)`, 'P-1 寫入端點缺少 requireAuth()',
            `${authMissing.length} 個寫入端點（create/update/delete/export）缺少 requireAuth()，未登入者可直接修改資料：\n  ${authMissing.slice(0, 10).join('\n  ')}${authMissing.length > 10 ? `\n  ...及其他 ${authMissing.length - 10} 個` : ''}`,
            '在每個 CRUD 端點頂端加入 requireAuth();');
    }

    if (strictMissing.length > 0) {
        warn('架構', `api/ (${strictMissing.length} 個)`, 'P-1 缺少 strict_types',
            `${strictMissing.length} 個 API 端點缺少 declare(strict_types=1)（前 10 個）：\n  ${strictMissing.slice(0, 10).join('\n  ')}${strictMissing.length > 10 ? `\n  ...及其他 ${strictMissing.length - 10} 個` : ''}`,
            '在 <?php 行後加入 declare(strict_types=1);');
    }
}

// ─────────────────────────────────────────────
// DS-1  DataSync 跨分頁同步整合檢查
// ─────────────────────────────────────────────
function checkDataSyncIntegration() {
    console.log('🔍 [DS-1] 檢查 DataSync 跨分頁同步整合...');

    const jsDir = path.join(ROOT, 'js');
    if (!fs.existsSync(jsDir)) return;

    const EXCLUDE = ['utils.js', 'data-sync.js', 'column_manager.js'];

    fs.readdirSync(jsDir)
        .filter(f => f.endsWith('.js') && !f.endsWith('.bak') && !EXCLUDE.includes(f))
        .forEach(fname => {
            const content = fs.readFileSync(path.join(jsDir, fname), 'utf-8');

            // 只檢查有初始化函數的模組（功能模組，非工具腳本）
            const hasInit = /window\.initialize\w+/.test(content);
            if (!hasInit) return;

            const hasDataSync = content.includes('DataSync.createModuleHelper') ||
                                content.includes('dataSyncHelper');

            if (!hasDataSync) {
                warn('架構', `js/${fname}`, 'DS-1 缺少 DataSync 整合',
                    `${fname} 有初始化函數但未使用 DataSync.createModuleHelper()，其他分頁的相同模組不會自動同步`,
                    `在模組初始化時加入:\n  dataSyncHelper = DataSync.createModuleHelper('模組名稱', { onRefresh: () => loadData() });`);
                return;
            }

            // 有 DataSync 但 CRUD 成功後未 notify
            const hasCrudPost = /method\s*:\s*['"](?:POST|PUT|DELETE)['"]/.test(content);
            const hasNotify   = /dataSyncHelper\.notify(?:Created|Updated|Deleted)/.test(content);

            if (hasCrudPost && !hasNotify) {
                warn('架構', `js/${fname}`, 'DS-1 CRUD 後未呼叫 notify',
                    `${fname} 有 POST/PUT/DELETE 操作但找不到 dataSyncHelper.notify*() 呼叫，其他分頁不會收到更新通知`,
                    'CRUD 成功回調後加入 dataSyncHelper.notifyCreated/Updated/Deleted(data)');
            }
        });
}

// ─────────────────────────────────────────────
// WF-1  流程型資料刪除守門檢查
// ─────────────────────────────────────────────
function checkWorkflowDeleteGuard() {
    console.log('🔍 [WF-1] 檢查流程型資料刪除守門...');

    const guardFile = 'api/common/workflow_guard.php';
    const checkEndpoint = 'api/workflow_guard/check.php';
    const processModules = [
        { module: 'orders', api: 'api/orders/delete.php', js: 'js/orders.js', label: '訂單' },
        { module: 'work_orders', api: 'api/work_orders/delete.php', js: 'js/work_orders.js', label: '工單' },
        { module: 'inventory_items', api: 'api/inventory_items/delete.php', js: 'js/inventory_items.js', label: '庫存' },
        { module: 'shipping_orders', api: 'api/shipping_orders/delete.php', js: 'js/shipping_orders.js', label: '出貨' },
    ];

    const guardContent = readFile(guardFile);
    if (!guardContent) {
        err('資料完整性', guardFile, 'WF-1 流程刪除守門',
            '缺少流程刪除守門共用檔，訂單→工單→庫存→出貨的刪除可能產生幽靈資料',
            '建立 api/common/workflow_guard.php，集中判斷各流程節點是否允許刪除、退回或作廢');
        return;
    }

    if (!fileExists(checkEndpoint)) {
        err('資料完整性', checkEndpoint, 'WF-1 流程刪除守門',
            '缺少前端刪除預檢端點，使用者按刪除前無法取得流程影響與建議動作',
            '建立 api/workflow_guard/check.php，讓前端在刪除前呼叫此端點取得 workflow_guard 結果');
    }

    if (!guardContent.includes('getWorkflowDeleteAssessment')) {
        err('資料完整性', guardFile, 'WF-1 流程刪除守門',
            'workflow_guard.php 未提供 getWorkflowDeleteAssessment() 統一入口',
            '新增 getWorkflowDeleteAssessment(PDO $pdo, string $module, int $id)，並由各 delete API 共用');
    }

    processModules.forEach(({ module, api, js, label }) => {
        const apiContent = readFile(api);
        if (!apiContent) {
            err('資料完整性', api, 'WF-1 流程刪除守門',
                `${label}缺少 delete API，無法驗證刪除流程防呆`,
                `建立 ${api}，或明確移除前端刪除入口`);
            return;
        }

        if (!apiContent.includes('workflow_guard.php') || !apiContent.includes('getWorkflowDeleteAssessment')) {
            err('資料完整性', api, 'WF-1 流程刪除守門',
                `${label}刪除 API 未經 workflow_guard 檢查，可能直接刪除已進入後續流程的資料`,
                '在刪除前呼叫 getWorkflowDeleteAssessment()；若 blocked，回傳 409 與 workflow_guard 詳細資訊');
        }

        if (!apiContent.includes('workflow_guard')) {
            warn('資料完整性', api, 'WF-1 回應格式',
                `${label}刪除 API 未明確回傳 workflow_guard 欄位，前端可能無法呈現流程影響`,
                '被阻擋時回傳 { success:false, message, workflow_guard }，讓前端可顯示退回/作廢/取消動作');
        }

        const jsContent = readFile(js);
        if (!jsContent) {
            warn('前端', js, 'WF-1 前端刪除預檢',
                `${label}前端模組不存在，無法確認刪除前是否有流程預檢`,
                `若 ${label}有刪除按鈕，需在送出 DELETE 前呼叫 ${checkEndpoint}`);
            return;
        }

        if (!jsContent.includes('workflow_guard/check.php')) {
            warn('前端', js, 'WF-1 前端刪除預檢',
                `${label}前端刪除流程未呼叫 workflow_guard/check.php，使用者可能看不到流程影響提示`,
                '刪除前先呼叫 api/workflow_guard/check.php?module=...&action=delete&id=...，再依 allowed/impacts 顯示確認視窗');
        }

        if (!guardContent.includes(`'${module}'`)) {
            err('資料完整性', guardFile, 'WF-1 模組覆蓋',
                `workflow_guard.php 未覆蓋 ${module}，${label}刪除無法取得流程判斷`,
                `在 getWorkflowDeleteAssessment() 中加入 ${module} 對應的 assess*Delete()`);
        }
    });

    const shippingDelete = readFile('api/shipping_orders/delete.php') || '';
    if (/\bDELETE\s+FROM\s+shipping_orders\b/i.test(shippingDelete) ||
        /\bDELETE\s+FROM\s+shipping_order_items\b/i.test(shippingDelete)) {
        err('資料完整性', 'api/shipping_orders/delete.php', 'WF-1 出貨刪除追溯',
            '出貨單刪除仍包含硬刪 shipping_orders 或 shipping_order_items，會破壞流程追溯',
            '改為軟刪 shipping_orders，保留 shipping_order_items 作為追溯資料，並只釋放未出貨配貨數量');
    }

    if (!/UPDATE\s+shipping_orders\s+SET\s+deleted_at\s*=/i.test(shippingDelete)) {
        warn('資料完整性', 'api/shipping_orders/delete.php', 'WF-1 出貨刪除追溯',
            '出貨單刪除未明確更新 deleted_at，可能不是可追溯的軟刪除',
            '使用 UPDATE shipping_orders SET deleted_at = NOW()，列表端再排除 deleted_at IS NOT NULL');
    }

    info('資料完整性', 'WF-1 流程刪除守門',
        '已檢查訂單、工單、庫存、出貨刪除 API 與前端預檢是否接上 workflow_guard。');
}

// ─────────────────────────────────────────────
// 🚀 執行所有檢查
// ─────────────────────────────────────────────
function runAllChecks() {
    const sep = '═'.repeat(65);
    console.log(`\n${sep}`);
    console.log('  MES 系統健康度審計工具 v1.3');
    console.log(`${sep}\n`);

    checkHardcodedCredentials();
    checkPermissionSystem();
    checkRoleFiles();
    checkPrintTemplateCredentials();
    checkLoginStatusCheck();
    checkReportDescriptionsNaming();
    checkMissingDeleteEndpoints();
    checkMethodFallback();
    checkJsFileSize();
    checkJsConsoleLog();
    checkJsModuleStructure();
    checkJsXssRisk();
    checkPrintTemplateCsrf();
    checkDualStatusFields();
    checkOrderItemsSoftDelete();
    checkApiModuleStructure();
    showDatabaseHints();
    checkPrintApiPaths();
    checkConfigFilesLoadedInIndex();
    checkExportEndpoints();
    checkHelpDirectoryIntegrity();
    checkCoreScriptLoadOrder();
    checkConfigFileFormat();
    checkModuleHtmlStyle();
    checkPhpApiSecurity();
    checkDataSyncIntegration();
    checkWorkflowDeleteGuard();

    // ── 輸出報告 ──────────────────────────────
    console.log(`\n${sep}`);
    console.log('\n📊 審計結果摘要\n');

    const byCategory = {};
    const collect = (arr, level) => arr.forEach(item => {
        if (!byCategory[item.category]) byCategory[item.category] = { errors: [], warnings: [], infos: [] };
        byCategory[item.category][level].push(item);
    });
    collect(ERRORS,   'errors');
    collect(WARNINGS, 'warnings');
    collect(INFOS,    'infos');

    Object.keys(byCategory).forEach(cat => {
        const { errors, warnings, infos } = byCategory[cat];
        console.log(`\n【${cat}】`);

        errors.forEach((e, i) => {
            console.log(`  ❌ ${i + 1}. [${e.rule}]`);
            console.log(`      檔案: ${e.file}`);
            console.log(`      問題: ${e.message}`);
            if (SHOW_FIX_HINTS) console.log(`      修復: ${e.fix}`);
        });

        warnings.forEach((w, i) => {
            console.log(`  ⚠️  ${i + 1}. [${w.rule}]`);
            console.log(`      檔案: ${w.file}`);
            console.log(`      問題: ${w.message}`);
            if (SHOW_FIX_HINTS) console.log(`      修復: ${w.fix}`);
        });

        infos.forEach((n) => {
            console.log(`  ℹ️  ${n.file}`);
            console.log(`      ${n.note}`);
        });
    });

    console.log(`\n${sep}`);
    console.log(`\n  ❌ 錯誤: ${ERRORS.length}   ⚠️  警告: ${WARNINGS.length}   ℹ️  提示: ${INFOS.length}`);
    console.log(`\n  如需顯示修復建議，請加上 --fix-hints 參數`);
    console.log(`  node tools/audit-system-health.js --fix-hints`);
    console.log(`\n${sep}\n`);

    if (ERRORS.length > 0) {
        console.log('❌ 審計失敗！請修復上述錯誤後再提交變更。\n');
        process.exit(1);
    } else if (WARNINGS.length > 0) {
        console.log('⚠️  審計通過但存在警告，建議盡快處理。\n');
        process.exit(0);
    } else {
        console.log('✅ 審計通過！系統健康度良好。\n');
        process.exit(0);
    }
}

runAllChecks();
