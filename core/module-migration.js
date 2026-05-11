/**
 * 模組遷移工具
 * 
 * 協助將現有 HTML 模組轉換為配置格式
 * 在瀏覽器 Console 中執行
 */
(function() {
    'use strict';

    /**
     * 分析 HTML 模組並生成配置
     * @param {string} moduleId - 模組 ID
     */
    async function analyzeModule(moduleId) {
        try {
            const response = await fetch(`modules/${moduleId}.html`);
            if (!response.ok) {
                throw new Error(`無法載入 ${moduleId}.html`);
            }
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const moduleRoot = doc.querySelector(`[data-module="${moduleId}"]`);
            
            if (!moduleRoot) {
                throw new Error(`找不到 data-module="${moduleId}"`);
            }

            const config = {
                title: '',
                subtitle: '',
                actions: [],
                filters: [],
                columns: [],
                modal: null
            };

            // 分析標題
            const h2 = moduleRoot.querySelector('.content-header h2');
            if (h2) config.title = h2.textContent.trim();
            
            const subtitle = moduleRoot.querySelector('.content-header .subtitle');
            if (subtitle) config.subtitle = subtitle.textContent.trim();

            // 分析動作按鈕
            const actionBtns = moduleRoot.querySelectorAll('.header-actions button[data-action]');
            actionBtns.forEach(btn => {
                const action = {
                    action: btn.dataset.action,
                    label: btn.querySelector('span')?.textContent.trim() || btn.textContent.trim().replace(/\s+/g, ' '),
                    icon: '',
                    style: btn.classList.contains('primary') ? 'primary' : 
                           btn.classList.contains('danger') ? 'danger' : 'outline'
                };
                
                const icon = btn.querySelector('i.fas, i.far, i.fab');
                if (icon) {
                    const iconClass = Array.from(icon.classList).find(c => c.startsWith('fa-'));
                    if (iconClass) action.icon = iconClass;
                }
                
                // 清理 label 中的圖示文字
                action.label = action.label.replace(/^\s*/, '').trim();
                
                config.actions.push(action);
            });

            // 分析篩選欄位
            const filterForm = moduleRoot.querySelector('.filter-form');
            if (filterForm) {
                const labels = filterForm.querySelectorAll('.form-grid > label');
                labels.forEach(label => {
                    const span = label.querySelector('span');
                    const input = label.querySelector('input, select');
                    
                    if (input) {
                        const filter = {
                            name: input.name,
                            label: span ? span.textContent.trim() : '',
                            type: input.tagName === 'SELECT' ? 'select' : input.type || 'text',
                            placeholder: input.placeholder || ''
                        };
                        
                        if (filter.type === 'select') {
                            filter.options = Array.from(input.options)
                                .filter(opt => opt.value)
                                .map(opt => ({ value: opt.value, label: opt.textContent }));
                        }
                        
                        config.filters.push(filter);
                    }
                });
            }

            // 分析表格欄位
            const table = moduleRoot.querySelector('table[data-*-table], table.data-table');
            if (table) {
                const ths = table.querySelectorAll('thead th');
                ths.forEach(th => {
                    const column = {
                        key: th.dataset.column || th.dataset.sort || th.textContent.trim().toLowerCase().replace(/\s+/g, '_'),
                        label: th.textContent.replace(/\s*$/, '').trim()
                    };
                    
                    // 移除排序圖示文字
                    column.label = column.label.replace(/\s*$/, '').trim();
                    
                    if (column.label === '操作') {
                        column.selectable = false;
                    }
                    
                    config.columns.push(column);
                });
            }

            // 分析 Modal
            const modal = moduleRoot.querySelector('.modal-overlay[data-*-modal]');
            if (modal) {
                const modalConfig = {
                    title: '',
                    sections: []
                };
                
                const modalTitle = modal.querySelector('[data-modal-title]');
                if (modalTitle) modalConfig.title = modalTitle.textContent.trim();
                
                const sections = modal.querySelectorAll('.form-section');
                sections.forEach(section => {
                    const sectionConfig = {
                        title: '',
                        fields: []
                    };
                    
                    const h4 = section.querySelector('h4');
                    if (h4) sectionConfig.title = h4.textContent.trim();
                    
                    const labels = section.querySelectorAll('.form-grid .inline-label');
                    labels.forEach(label => {
                        const span = label.querySelector('span');
                        const input = label.querySelector('input, select, textarea');
                        
                        if (input && input.type !== 'hidden') {
                            const field = {
                                name: input.name,
                                label: span ? span.textContent.replace('*', '').trim() : '',
                                type: input.tagName === 'SELECT' ? 'select' : 
                                      input.tagName === 'TEXTAREA' ? 'textarea' : input.type || 'text',
                                required: input.required,
                                placeholder: input.placeholder || ''
                            };
                            
                            if (label.classList.contains('full-width')) {
                                field.fullWidth = true;
                            }
                            
                            if (field.type === 'select') {
                                field.options = Array.from(input.options)
                                    .filter(opt => opt.value)
                                    .map(opt => ({ value: opt.value, label: opt.textContent }));
                            }
                            
                            if (field.type === 'textarea') {
                                field.rows = input.rows || 3;
                            }
                            
                            sectionConfig.fields.push(field);
                        }
                    });
                    
                    if (sectionConfig.fields.length > 0 || section.innerHTML.includes('data-')) {
                        modalConfig.sections.push(sectionConfig);
                    }
                });
                
                config.modal = modalConfig;
            }

            return config;
        } catch (error) {
            console.error('分析模組失敗:', error);
            return null;
        }
    }

    /**
     * 生成配置檔程式碼
     * @param {string} moduleId - 模組 ID
     * @param {Object} config - 配置物件
     */
    function generateConfigCode(moduleId, config) {
        const code = `/**
 * ${config.title}模組配置
 */
(function() {
    'use strict';

    ModuleConfig.register('${moduleId}', ${JSON.stringify(config, null, 8).replace(/"([^"]+)":/g, '$1:')});

})();`;
        
        return code;
    }

    /**
     * 分析並輸出配置
     * @param {string} moduleId - 模組 ID
     */
    async function migrateModule(moduleId) {
        console.log(`正在分析模組: ${moduleId}...`);
        
        const config = await analyzeModule(moduleId);
        if (!config) {
            console.error('分析失敗');
            return;
        }
        
        console.log('\n=== 分析結果 ===');
        console.log(config);
        
        console.log('\n=== 配置檔程式碼 ===');
        const code = generateConfigCode(moduleId, config);
        console.log(code);
        
        // 複製到剪貼簿
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(code);
                console.log('\n✅ 配置程式碼已複製到剪貼簿！');
            } catch (e) {
                console.log('\n⚠️ 無法複製到剪貼簿，請手動複製上方程式碼');
            }
        }
        
        return config;
    }

    /**
     * 批次分析所有模組
     */
    async function analyzeAllModules() {
        const modules = [
            'companies', 'customers', 'suppliers', 'employees', 'departments',
            'machines', 'tools', 'screening_items', 'screening_services',
            'orders', 'order_items', 'work_orders', 'shipping_orders',
            'return_orders', 'inventory_items', 'inventory_transactions',
            'lookup_values', 'audit_logs'
        ];
        
        const results = [];
        
        for (const moduleId of modules) {
            try {
                const config = await analyzeModule(moduleId);
                if (config) {
                    results.push({ moduleId, config, status: 'success' });
                } else {
                    results.push({ moduleId, status: 'failed' });
                }
            } catch (e) {
                results.push({ moduleId, status: 'error', error: e.message });
            }
        }
        
        console.log('\n=== 批次分析結果 ===');
        console.table(results.map(r => ({
            模組: r.moduleId,
            狀態: r.status,
            欄位數: r.config?.columns?.length || 0,
            篩選數: r.config?.filters?.length || 0
        })));
        
        return results;
    }

    // 暴露到全域
    window.ModuleMigration = {
        analyze: analyzeModule,
        migrate: migrateModule,
        analyzeAll: analyzeAllModules,
        generateCode: generateConfigCode
    };

    console.log('模組遷移工具已載入。使用方式：');
    console.log('  ModuleMigration.migrate("companies") - 分析並生成配置');
    console.log('  ModuleMigration.analyzeAll() - 批次分析所有模組');

})();
