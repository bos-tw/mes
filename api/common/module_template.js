/**
 * 模組模板系統 - 統一管理模組的共用 HTML 結構
 * 
 * 使用方式：
 * 1. 在模組 HTML 中使用簡化的結構
 * 2. 系統會自動套用標準化的 header、toolbar 等結構
 * 
 * @version 1.0.0
 */
(function() {
    'use strict';

    /**
     * 模組模板配置
     * 在此定義各模組的標準配置
     */
    const MODULE_CONFIGS = {
        // 範例配置結構 - 實際配置由各模組 HTML 的 data 屬性提供
        // 'module_name': {
        //     title: '模組標題',
        //     subtitle: '模組副標題',
        //     headerActions: [
        //         { type: 'create', label: '新增', icon: 'fa-plus', primary: true },
        //         { type: 'print', label: '列印', icon: 'fa-print' },
        //         { type: 'export', label: '匯出', icon: 'fa-file-export' }
        //     ]
        // }
    };

    /**
     * 標準 Content Header 模板
     * @param {Object} config - 配置物件
     * @returns {string} HTML 字串
     */
    function createContentHeader(config) {
        const { title, subtitle, actions = [] } = config;
        
        let actionsHtml = '';
        if (actions.length > 0) {
            const actionButtons = actions.map(action => {
                const btnClass = action.primary ? 'btn primary' : 'btn outline';
                const iconHtml = action.icon ? `<i class="fas ${action.icon}"></i> ` : '';
                const disabledAttr = action.disabled ? ' disabled' : '';
                const extraHtml = action.extraHtml || '';
                return `<button type="button" class="${btnClass}" data-action="${action.type}"${disabledAttr}>${iconHtml}${action.label}${extraHtml}</button>`;
            }).join('\n            ');
            
            actionsHtml = `
    <div class="header-actions">
        ${actionButtons}
    </div>`;
        }

        return `<div class="content-header with-actions">
    <div>
        <h2>${title}</h2>
        <p class="subtitle">${subtitle}</p>
    </div>${actionsHtml}
</div>`;
    }

    /**
     * 標準 Module Alert 模板
     * @param {string} moduleName - 模組名稱 (kebab-case)
     * @returns {string} HTML 字串
     */
    function createModuleAlert(moduleName) {
        return `<div class="module-alert hidden" data-${moduleName}-alert></div>`;
    }

    /**
     * 標準 Column Selector 模板
     * @param {string} moduleName - 模組名稱 (kebab-case)
     * @param {Array} columns - 欄位配置陣列
     * @returns {string} HTML 字串
     */
    function createColumnSelector(moduleName, columns) {
        const columnOptions = columns.map(col => {
            const checked = col.defaultVisible !== false ? ' checked' : '';
            return `            <label class="column-option">
                <input type="checkbox" data-column="${col.key}"${checked}>
                <span>${col.label}</span>
            </label>`;
        }).join('\n');

        return `<div class="column-selector hidden" data-${moduleName}-column-selector>
        <div class="column-selector-header">
            <h4>顯示欄位設定</h4>
            <button type="button" class="close-btn" data-action="close-column-selector">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="column-selector-body">
${columnOptions}
        </div>
        <div class="column-selector-footer">
            <button type="button" class="btn outline small" data-action="select-all-columns">全選</button>
            <button type="button" class="btn outline small" data-action="deselect-all-columns">全不選</button>
            <button type="button" class="btn primary small" data-action="apply-column-settings">套用</button>
        </div>
    </div>`;
    }

    /**
     * 標準 Modal 結構模板
     * @param {Object} config - Modal 配置
     * @returns {string} HTML 字串
     */
    function createModal(config) {
        const { 
            moduleName, 
            title = '新增資料', 
            size = '', // '', 'large', 'medium'
            formSections = [],
            hasForm = true
        } = config;

        const sizeClass = size ? ` ${size}` : '';
        const modalAttr = `data-${moduleName}-modal`;
        const alertAttr = `data-${moduleName}-modal-alert`;
        const formAttr = `data-${moduleName}-form`;

        let content = '';
        if (hasForm) {
            const sectionsHtml = formSections.map(section => createFormSection(section)).join('\n');
            content = `
        <form ${formAttr} novalidate>
            <input type="hidden" name="id">
            ${sectionsHtml}
            <div class="form-actions">
                <button type="button" class="outline" data-action="cancel">取消</button>
                <button type="submit" class="primary">儲存</button>
            </div>
        </form>`;
        }

        return `<div class="modal-overlay hidden" ${modalAttr}>
    <div class="modal-window${sizeClass}">
        <button type="button" class="modal-close" data-action="close-modal" aria-label="關閉">
            <i class="fas fa-times"></i>
        </button>
        <h3 data-modal-title>${title}</h3>
        <div class="modal-alert hidden" ${alertAttr} role="alert"></div>
        ${content}
    </div>
</div>`;
    }

    /**
     * 建立表單區塊
     * @param {Object} section - 區塊配置
     * @returns {string} HTML 字串
     */
    function createFormSection(section) {
        const { title, fields = [] } = section;
        
        const fieldsHtml = fields.map(field => createFormField(field)).join('\n');
        
        return `<section class="form-section">
                <h4>${title}</h4>
                <div class="form-grid">
                    ${fieldsHtml}
                </div>
            </section>`;
    }

    /**
     * 建立表單欄位
     * @param {Object} field - 欄位配置
     * @returns {string} HTML 字串
     */
    function createFormField(field) {
        const { 
            name, 
            label, 
            type = 'text', 
            required = false, 
            placeholder = '',
            fullWidth = false,
            options = [], // for select
            rows = 3 // for textarea
        } = field;

        const requiredMark = required ? ' <abbr title="必填">*</abbr>' : '';
        const requiredAttr = required ? ' required' : '';
        const widthClass = fullWidth ? ' full-width' : '';

        let inputHtml = '';
        switch (type) {
            case 'select':
                const optionsHtml = options.map(opt => 
                    `<option value="${opt.value}">${opt.label}</option>`
                ).join('\n                            ');
                inputHtml = `<select name="${name}"${requiredAttr}>
                            <option value="">請選擇</option>
                            ${optionsHtml}
                        </select>`;
                break;
            case 'textarea':
                inputHtml = `<textarea name="${name}" rows="${rows}"${requiredAttr} placeholder="${placeholder}" autocomplete="off"></textarea>`;
                break;
            default:
                inputHtml = `<input type="${type}" name="${name}"${requiredAttr} placeholder="${placeholder}" autocomplete="off">`;
        }

        return `<label class="inline-label${widthClass}">
                        <span>${label}${requiredMark}</span>
                        ${inputHtml}
                    </label>`;
    }

    /**
     * 模組模板工具類別
     */
    class ModuleTemplate {
        constructor() {
            this.initialized = false;
        }

        /**
         * 從 data 屬性解析模組配置
         * @param {HTMLElement} moduleRoot - 模組根元素
         * @returns {Object} 配置物件
         */
        parseConfigFromDataAttributes(moduleRoot) {
            const config = {};
            
            // 解析標題配置
            const headerEl = moduleRoot.querySelector('[data-template-header]');
            if (headerEl) {
                config.title = headerEl.dataset.title || '';
                config.subtitle = headerEl.dataset.subtitle || '';
                
                // 解析動作按鈕
                const actionsAttr = headerEl.dataset.actions;
                if (actionsAttr) {
                    try {
                        config.actions = JSON.parse(actionsAttr);
                    } catch (e) {
                        console.warn('ModuleTemplate: 無法解析 actions 配置', e);
                    }
                }
            }

            return config;
        }

        /**
         * 套用模板到模組
         * @param {HTMLElement} moduleRoot - 模組根元素
         */
        applyTemplate(moduleRoot) {
            // 尋找需要套用模板的元素
            const templateHeader = moduleRoot.querySelector('[data-template="header"]');
            if (templateHeader) {
                const config = {
                    title: templateHeader.dataset.title || '未命名模組',
                    subtitle: templateHeader.dataset.subtitle || '',
                    actions: []
                };

                // 解析動作按鈕配置
                const actionsJson = templateHeader.dataset.actions;
                if (actionsJson) {
                    try {
                        config.actions = JSON.parse(actionsJson);
                    } catch (e) {
                        console.warn('ModuleTemplate: 無法解析 header actions', e);
                    }
                }

                // 建立 header HTML
                const headerHtml = createContentHeader(config);
                
                // 建立臨時容器來解析 HTML
                const temp = document.createElement('div');
                temp.innerHTML = headerHtml;
                const newHeader = temp.firstElementChild;

                // 替換 placeholder
                templateHeader.replaceWith(newHeader);
            }
        }

        /**
         * 初始化模組模板系統
         */
        init() {
            if (this.initialized) return;

            // 監聽模組載入事件
            document.addEventListener('module:loaded', (e) => {
                const { moduleRoot } = e.detail || {};
                if (moduleRoot) {
                    this.applyTemplate(moduleRoot);
                }
            });

            this.initialized = true;
            console.log('ModuleTemplate: 初始化完成');
        }
    }

    // 建立全域實例
    const moduleTemplate = new ModuleTemplate();

    // 暴露到全域
    window.ModuleTemplate = {
        instance: moduleTemplate,
        createContentHeader,
        createModuleAlert,
        createColumnSelector,
        createModal,
        createFormSection,
        createFormField,
        init: () => moduleTemplate.init()
    };

    // DOM Ready 時自動初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => moduleTemplate.init());
    } else {
        moduleTemplate.init();
    }

})();
