/**
 * 模組結構檢查工具
 * 
 * 此腳本用於檢查所有模組 HTML 結構是否符合規範
 * 在瀏覽器 Console 中執行此腳本
 * 
 * 使用方式：將此腳本內容複製到瀏覽器 Console 執行
 */

(function() {
    'use strict';

    /**
     * 標準模組結構規範
     */
    const STANDARD_STRUCTURE = {
        // 必要元素
        required: [
            { selector: '[data-module]', description: '模組根元素 data-module 屬性' },
            { selector: '.content-header', description: '內容標題區 .content-header' },
            { selector: '.content-header h2', description: '標題 h2' },
            { selector: '.content-area', description: '內容區 .content-area' }
        ],
        // 建議元素
        recommended: [
            { selector: '.content-header .subtitle', description: '副標題 .subtitle' },
            { selector: '.module-alert', description: '模組警告訊息區' },
            { selector: '.module-toolbar', description: '工具列區域' },
            { selector: 'table[data-*-table]', description: '資料表格' }
        ],
        // 禁止的結構
        forbidden: [
            { pattern: /sticky/i, description: '不應使用 sticky 類別' },
            { pattern: /style\s*=\s*["'][^"']*grid-column/i, description: '不應使用 inline grid-column 樣式' },
            { pattern: /btn-primary|btn-outline/i, description: '按鈕應使用 "btn primary" 或 "btn outline"，不是 "btn-primary"' }
        ]
    };

    /**
     * 檢查模組結構
     * @param {string} moduleHtml - 模組 HTML 內容
     * @param {string} moduleName - 模組名稱
     * @returns {Object} 檢查結果
     */
    function checkModuleStructure(moduleHtml, moduleName) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(moduleHtml, 'text/html');
        const issues = [];
        const passed = [];

        // 檢查必要元素
        STANDARD_STRUCTURE.required.forEach(item => {
            const element = doc.querySelector(item.selector);
            if (!element) {
                issues.push({
                    type: 'error',
                    message: `缺少必要元素: ${item.description}`,
                    selector: item.selector
                });
            } else {
                passed.push({
                    type: 'pass',
                    message: `✓ ${item.description}`,
                    selector: item.selector
                });
            }
        });

        // 檢查建議元素
        STANDARD_STRUCTURE.recommended.forEach(item => {
            const element = doc.querySelector(item.selector);
            if (!element) {
                issues.push({
                    type: 'warning',
                    message: `建議加入: ${item.description}`,
                    selector: item.selector
                });
            }
        });

        // 檢查禁止的結構
        STANDARD_STRUCTURE.forbidden.forEach(item => {
            if (item.pattern.test(moduleHtml)) {
                issues.push({
                    type: 'error',
                    message: `發現禁止的結構: ${item.description}`,
                    pattern: item.pattern.toString()
                });
            }
        });

        // 檢查特定元素的一致性
        const contentHeader = doc.querySelector('.content-header');
        if (contentHeader) {
            // 檢查是否有 actions 但沒有 with-actions 類別
            const hasActions = contentHeader.querySelector('.header-actions');
            const hasWithActionsClass = contentHeader.classList.contains('with-actions');
            
            if (hasActions && !hasWithActionsClass) {
                issues.push({
                    type: 'error',
                    message: '有 .header-actions 但 .content-header 缺少 with-actions 類別'
                });
            }
        }

        // 檢查 Modal 結構
        const modals = doc.querySelectorAll('.modal-overlay');
        modals.forEach((modal, index) => {
            const window = modal.querySelector('.modal-window');
            if (window) {
                // 檢查尺寸類別
                const classes = window.className;
                if (classes.includes('modal-window-large') || classes.includes('modal-window-medium')) {
                    issues.push({
                        type: 'error',
                        message: `Modal #${index + 1}: 使用了錯誤的尺寸類別格式，應使用 "modal-window large" 而非 "modal-window-large"`
                    });
                }
            }

            // 檢查 form 是否有 novalidate
            const form = modal.querySelector('form');
            if (form && !form.hasAttribute('novalidate')) {
                issues.push({
                    type: 'warning',
                    message: `Modal #${index + 1}: form 應加上 novalidate 屬性`
                });
            }

            // 檢查按鈕格式
            const buttons = modal.querySelectorAll('button');
            buttons.forEach(btn => {
                if (btn.className.includes('btn-primary') || btn.className.includes('btn-outline')) {
                    issues.push({
                        type: 'error',
                        message: `Modal #${index + 1}: 按鈕使用了錯誤的類別格式`
                    });
                }
            });
        });

        return {
            moduleName,
            issues: issues.filter(i => i.type === 'error'),
            warnings: issues.filter(i => i.type === 'warning'),
            passed,
            score: Math.round((passed.length / (passed.length + issues.filter(i => i.type === 'error').length)) * 100)
        };
    }

    /**
     * 批次檢查所有模組
     */
    async function checkAllModules() {
        const moduleFiles = [
            'audit_logs', 'companies', 'customers', 'dashboard', 'departments',
            'employees', 'inventory_items', 'inventory_transactions', 'lookup_values',
            'machines', 'order_items', 'orders', 'production_quality_records',
            'production_records', 'return_orders', 'screening_items', 'screening_services',
            'shipping_order_items', 'shipping_orders', 'suppliers', 'tools', 'work_orders'
        ];

        const results = [];

        for (const moduleName of moduleFiles) {
            try {
                const response = await fetch(`modules/${moduleName}.html`);
                if (response.ok) {
                    const html = await response.text();
                    const result = checkModuleStructure(html, moduleName);
                    results.push(result);
                }
            } catch (error) {
                results.push({
                    moduleName,
                    issues: [{ type: 'error', message: `無法載入: ${error.message}` }],
                    warnings: [],
                    passed: [],
                    score: 0
                });
            }
        }

        return results;
    }

    /**
     * 輸出檢查報告
     * @param {Array} results - 檢查結果陣列
     */
    function printReport(results) {
        console.log('\n========================================');
        console.log('      模組結構檢查報告');
        console.log('========================================\n');

        let totalScore = 0;
        let errorCount = 0;
        let warningCount = 0;

        results.forEach(result => {
            const status = result.issues.length === 0 ? '✅' : '❌';
            console.log(`${status} ${result.moduleName} (分數: ${result.score}%)`);
            
            if (result.issues.length > 0) {
                result.issues.forEach(issue => {
                    console.log(`   ❌ ${issue.message}`);
                    errorCount++;
                });
            }
            
            if (result.warnings.length > 0) {
                result.warnings.forEach(warning => {
                    console.log(`   ⚠️ ${warning.message}`);
                    warningCount++;
                });
            }

            totalScore += result.score;
        });

        const avgScore = Math.round(totalScore / results.length);

        console.log('\n----------------------------------------');
        console.log(`總計: ${results.length} 個模組`);
        console.log(`平均分數: ${avgScore}%`);
        console.log(`錯誤數: ${errorCount}`);
        console.log(`警告數: ${warningCount}`);
        console.log('----------------------------------------\n');

        // 列出需要修正的模組
        const needsFix = results.filter(r => r.issues.length > 0);
        if (needsFix.length > 0) {
            console.log('需要修正的模組:');
            needsFix.forEach(r => console.log(`  - ${r.moduleName}`));
        }
    }

    // 暴露到全域供使用
    window.ModuleStructureChecker = {
        checkModuleStructure,
        checkAllModules,
        printReport,
        STANDARD_STRUCTURE,
        
        // 快速執行全部檢查並輸出報告
        async runFullCheck() {
            console.log('開始檢查所有模組結構...');
            const results = await checkAllModules();
            printReport(results);
            return results;
        }
    };

    console.log('模組結構檢查工具已載入。執行 ModuleStructureChecker.runFullCheck() 開始檢查。');

})();
