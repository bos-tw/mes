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
