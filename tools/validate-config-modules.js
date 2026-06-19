/**
 * 配置化模組驗證工具
 * 用途：確保所有配置化模組符合規範
 *
 * 執行方式：node tools/validate-config-modules.js
 */

const fs = require('fs');
const path = require('path');

const ERRORS = [];
const WARNINGS = [];

// ============================================
// 規則 1: 配置檔必須有 hiddenFields: ['id']
// ============================================
function checkHiddenFields() {
    console.log('\n🔍 檢查規則 1: 配置檔必須有 hiddenFields...');

    const configDir = path.join(__dirname, '../core/configs');
    const configFiles = fs.readdirSync(configDir).filter(f => f.endsWith('.config.js'));

    configFiles.forEach(file => {
        const filePath = path.join(configDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // 精確匹配 modal: { （排除 modal: null、addItemModal:、detailModal: 等情況）
        const hasRealModal = /(?<![a-zA-Z])modal\s*:\s*\{/.test(content);
        if (hasRealModal && !content.includes('requiresHtmlModal')) {
            // 完全配置化的 modal 必須有 hiddenFields
            if (!content.includes('hiddenFields:')) {
                ERRORS.push({
                    file: `core/configs/${file}`,
                    rule: '配置檔必須有 hiddenFields',
                    message: 'Modal 定義中缺少 hiddenFields: [\'id\']',
                    fix: '在 modal 物件中加入: hiddenFields: [\'id\']'
                });
            }
        }
    });
}

// ============================================
// 規則 2: JS 不可使用不安全的 querySelector 賦值
// ============================================
function checkUnsafeQuerySelector() {
    console.log('\n🔍 檢查規則 2: 禁止不安全的 querySelector 賦值...');

    const jsDir = path.join(__dirname, '../js');
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

    // 允許的例外（混合模式或特殊情況）
    const allowedExceptions = [
        'work_order_first_piece_dimensions.js', // 非配置化模組
        'shipping_orders.js' // 混合模式
    ];

    jsFiles.forEach(file => {
        if (allowedExceptions.includes(file)) return;

        const filePath = path.join(jsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // 檢查危險模式: querySelector(...).value =
        const unsafePattern = /querySelector\([^)]+\)\.value\s*=/;

        lines.forEach((line, index) => {
            if (unsafePattern.test(line) && !line.includes('//')) {
                ERRORS.push({
                    file: `js/${file}`,
                    line: index + 1,
                    rule: '禁止不安全的 querySelector 賦值',
                    message: `發現不安全的模式: querySelector().value =`,
                    code: line.trim(),
                    fix: '使用 setFieldValue() 函數或加入 null 檢查'
                });
            }
        });
    });
}

// ============================================
// 規則 3: 配置化模組必須有對應的 JS 防禦性函數
// ============================================
function checkDefensiveFunctions() {
    console.log('\n🔍 檢查規則 3: JS 必須有防禦性函數...');

    const configDir = path.join(__dirname, '../core/configs');
    const configFiles = fs.readdirSync(configDir).filter(f => f.endsWith('.config.js'));

    configFiles.forEach(file => {
        const moduleName = file.replace('.config.js', '');
        const jsFile = `${moduleName}.js`;
        const jsPath = path.join(__dirname, '../js', jsFile);

        if (!fs.existsSync(jsPath)) return;

        const configContent = fs.readFileSync(path.join(configDir, file), 'utf-8');
        const jsContent = fs.readFileSync(jsPath, 'utf-8');

        // 精確匹配 modal: {（排除 modal: null、detailModal:、addItemModal: 等情況）
        const hasRealModal = /(?<![a-zA-Z])modal\s*:\s*\{/.test(configContent);
        if (hasRealModal && !configContent.includes('requiresHtmlModal')) {
            if (!jsContent.includes('setFieldValue') && !jsContent.includes('setShippingField')) {
                WARNINGS.push({
                    file: `js/${jsFile}`,
                    rule: 'JS 應該有防禦性函數',
                    message: '建議加入 setFieldValue() 函數以避免 null 錯誤',
                    fix: '參考 lookup_domains.js 的 setFieldValue 實作'
                });
            }
        }
    });
}

// ============================================
// 規則 4: 混合模式必須有 HTML 檔案
// ============================================
function checkMixedModeHtmlFiles() {
    console.log('\n🔍 檢查規則 4: 混合模式必須有 HTML 檔案...');

    const configDir = path.join(__dirname, '../core/configs');
    const configFiles = fs.readdirSync(configDir).filter(f => f.endsWith('.config.js'));

    configFiles.forEach(file => {
        const moduleName = file.replace('.config.js', '');
        const configPath = path.join(configDir, file);
        const content = fs.readFileSync(configPath, 'utf-8');

        if (content.includes('requiresHtmlModal: true')) {
            const htmlPath = path.join(__dirname, '../modules', `${moduleName}.html`);

            if (!fs.existsSync(htmlPath)) {
                ERRORS.push({
                    file: `core/configs/${file}`,
                    rule: '混合模式必須有 HTML 檔案',
                    message: `配置設定 requiresHtmlModal: true 但缺少 modules/${moduleName}.html`,
                    fix: `檢查 modules/${moduleName}.html.bak 是否誤重新命名`
                });
            }
        }
    });
}

// ============================================
// 規則 5: Modal 尺寸必須使用標準值
// ============================================
function checkModalSize() {
    console.log('\n🔍 檢查規則 5: Modal 尺寸必須使用標準值...');

    const validSizes = ['xlarge', 'large', 'medium', 'small'];
    const configDir = path.join(__dirname, '../core/configs');
    const configFiles = fs.readdirSync(configDir).filter(f => f.endsWith('.config.js'));

    configFiles.forEach(file => {
        const filePath = path.join(configDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // 檢查是否有 size 定義
        const sizeMatch = content.match(/size:\s*['"]([^'"]+)['"]/);
        if (sizeMatch && !validSizes.includes(sizeMatch[1])) {
            WARNINGS.push({
                file: `core/configs/${file}`,
                rule: 'Modal 尺寸必須使用標準值',
                message: `發現非標準尺寸: ${sizeMatch[1]}`,
                fix: `使用標準尺寸: ${validSizes.join(', ')}`
            });
        }
    });
}

// ============================================
// 規則 6: 表格操作按鈕必須使用標準樣式
// ============================================
function checkTableButtonStyles() {
    console.log('\n🔍 檢查規則 6: 表格操作按鈕必須使用標準樣式...');

    const jsDir = path.join(__dirname, '../js');
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

    // 禁止的樣式模式
    const forbiddenPatterns = [
        { pattern: /class="btn-icon"/, name: 'btn-icon (已棄用)' },
        { pattern: /class="btn-icon danger"/, name: 'btn-icon danger (已棄用)' },
        { pattern: /class="btn text purple"/, name: 'btn text purple (禁止自訂顏色)' },
        { pattern: /class="btn text success"/, name: 'btn text success (禁止自訂顏色)' },
        { pattern: /class="btn outline small"[^>]*data-action="(edit|delete|view)"/, name: 'btn outline small (表格內禁用)' }
    ];

    jsFiles.forEach(file => {
        const filePath = path.join(jsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            forbiddenPatterns.forEach(({ pattern, name }) => {
                if (pattern.test(line) && !line.trim().startsWith('//')) {
                    ERRORS.push({
                        file: `js/${file}`,
                        line: index + 1,
                        rule: '表格操作按鈕必須使用標準樣式',
                        message: `發現禁止的樣式: ${name}`,
                        code: line.trim().substring(0, 80) + (line.length > 80 ? '...' : ''),
                        fix: '表格操作按鈕請使用: btn text 或 btn text danger'
                    });
                }
            });
        });
    });
}

// ============================================
// 規則 7: 操作按鈕語意、事件與圖示必須一致
// ============================================
function checkOperationButtonSemantics() {
    console.log('\n🔍 檢查規則 7: 操作按鈕語意、事件與圖示必須一致...');

    const scanTargets = [
        { dir: 'js', extensions: ['.js'] },
        { dir: 'modules', extensions: ['.html'] },
        { dir: 'core/configs', extensions: ['.js'] }
    ];
    const expectedIcons = {
        print: 'fa-print',
        'print-detail': 'fa-print',
        'print-single': 'fa-print',
        'print-work-order': 'fa-print',
        'print-screening-report': 'fa-file-medical-alt',
        view: 'fa-eye',
        'view-detail': 'fa-eye',
        'view-details': 'fa-eye',
        'view-work-order': 'fa-eye',
        'view-shipping-order': 'fa-eye',
        'view-return-orders': 'fa-eye',
        edit: 'fa-edit',
        'edit-work-order': 'fa-edit',
        'edit-order-item': 'fa-edit',
        'edit-order-item-inline': 'fa-edit',
        'edit-screening-item': 'fa-edit',
        delete: 'fa-trash',
        'delete-item': 'fa-trash',
        'delete-work-order': 'fa-trash',
        'delete-order-item': 'fa-trash',
        'delete-order-item-inline': 'fa-trash',
        'delete-screening-item': 'fa-trash',
        'delete-blocked': 'fa-trash',
        'copy-order-item': 'fa-copy'
    };
    const semanticIcons = new Set(Object.values(expectedIcons));

    scanTargets.forEach(({ dir, extensions }) => {
        const absoluteDir = path.join(__dirname, '..', dir);
        if (!fs.existsSync(absoluteDir)) return;

        fs.readdirSync(absoluteDir)
            .filter(file => extensions.includes(path.extname(file)))
            .forEach(file => {
                const filePath = path.join(absoluteDir, file);
                const relativePath = `${dir}/${file}`.replace(/\\/g, '/');
                const content = fs.readFileSync(filePath, 'utf-8');
                const buttonPattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
                let match;

                while ((match = buttonPattern.exec(content)) !== null) {
                    const attributes = match[1];
                    const body = match[2];
                    const classMatch = attributes.match(/class=["']([^"']*)["']/i);
                    const classNames = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
                    const isTableActionButton = classNames.includes('btn') && classNames.includes('text');
                    if (!isTableActionButton) continue;

                    const line = content.slice(0, match.index).split('\n').length;
                    const action = attributes.match(/data-action=["']([^"']+)["']/i)?.[1] || '';
                    const iconClasses = body.match(/<i\b[^>]*class=["']([^"']*)["']/i)?.[1]
                        ?.split(/\s+/)
                        .filter(Boolean) || [];
                    const semanticIcon = iconClasses.find(icon => semanticIcons.has(icon));

                    if (/\sonclick\s*=/i.test(attributes)) {
                        ERRORS.push({
                            file: relativePath,
                            line,
                            rule: '操作按鈕禁止 inline onclick',
                            message: '表格操作按鈕使用 inline onclick，會繞過共用事件與樣式標準化',
                            code: match[0].replace(/\s+/g, ' ').trim().substring(0, 120),
                            fix: '改用 data-action 並在模組根節點或表格使用事件委派'
                        });
                    }

                    if (semanticIcon && !action) {
                        ERRORS.push({
                            file: relativePath,
                            line,
                            rule: '操作按鈕必須有 data-action',
                            message: `使用 ${semanticIcon} 圖示的表格按鈕缺少 data-action`,
                            code: match[0].replace(/\s+/g, ' ').trim().substring(0, 120),
                            fix: '加入符合語意的 data-action，交由全域操作按鈕標準化器處理'
                        });
                    }

                    const expectedIcon = expectedIcons[action];
                    if (expectedIcon && !iconClasses.includes(expectedIcon)) {
                        ERRORS.push({
                            file: relativePath,
                            line,
                            rule: '操作按鈕 icon 必須一致',
                            message: `data-action="${action}" 必須使用 ${expectedIcon}`,
                            code: match[0].replace(/\s+/g, ' ').trim().substring(0, 120),
                            fix: `將 Font Awesome icon 改為 fas ${expectedIcon}`
                        });
                    }

                    if (classNames.includes('purple')) {
                        ERRORS.push({
                            file: relativePath,
                            line,
                            rule: '操作按鈕禁止自訂顏色',
                            message: '發現 purple 自訂色彩 class',
                            fix: '移除自訂色彩 class，依 data-action 由 .op-role-* 統一套色'
                        });
                    }

                    ['success', 'warning'].forEach(colorClass => {
                        const stateAction = action === 'toggle-active' || action === 'set-active-logo';
                        if (classNames.includes(colorClass) && !stateAction) {
                            ERRORS.push({
                                file: relativePath,
                                line,
                                rule: '操作按鈕禁止自訂顏色',
                                message: `${colorClass} 僅允許用於狀態切換 action`,
                                fix: '移除自訂色彩 class，依 data-action 由 .op-role-* 統一套色'
                            });
                        }
                    });

                    const isDeleteAction = action === 'delete'
                        || action.startsWith('delete-')
                        || action.startsWith('clear-');
                    if (classNames.includes('danger') && !isDeleteAction) {
                        ERRORS.push({
                            file: relativePath,
                            line,
                            rule: '操作按鈕禁止自訂顏色',
                            message: `data-action="${action || '(缺少)'}" 不得使用 danger`,
                            fix: '移除 danger，依 data-action 的語意角色統一套色'
                        });
                    }
                }
            });
    });
}

// ============================================
// 執行所有檢查
// ============================================
function runAllChecks() {
    console.log('🚀 開始執行配置化模組驗證...\n');
    console.log('=' .repeat(60));

    checkHiddenFields();
    checkUnsafeQuerySelector();
    checkDefensiveFunctions();
    checkMixedModeHtmlFiles();
    checkModalSize();
    checkTableButtonStyles();
    checkOperationButtonSemantics();

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 驗證結果：\n');

    if (ERRORS.length === 0 && WARNINGS.length === 0) {
        console.log('✅ 所有檢查通過！系統符合配置化規範。\n');
        process.exit(0);
    }

    if (ERRORS.length > 0) {
        console.log(`❌ 發現 ${ERRORS.length} 個錯誤：\n`);
        ERRORS.forEach((err, index) => {
            console.log(`${index + 1}. ${err.file}${err.line ? `:${err.line}` : ''}`);
            console.log(`   規則: ${err.rule}`);
            console.log(`   問題: ${err.message}`);
            if (err.code) console.log(`   程式碼: ${err.code}`);
            console.log(`   修復: ${err.fix}\n`);
        });
    }

    if (WARNINGS.length > 0) {
        console.log(`⚠️  發現 ${WARNINGS.length} 個警告：\n`);
        WARNINGS.forEach((warn, index) => {
            console.log(`${index + 1}. ${warn.file}`);
            console.log(`   規則: ${warn.rule}`);
            console.log(`   建議: ${warn.message}`);
            console.log(`   修復: ${warn.fix}\n`);
        });
    }

    console.log('='.repeat(60));

    if (ERRORS.length > 0) {
        console.log('\n❌ 驗證失敗！請修復上述錯誤。\n');
        process.exit(1);
    } else {
        console.log('\n✅ 驗證通過（但有警告）\n');
        process.exit(0);
    }
}

// 執行
runAllChecks();
