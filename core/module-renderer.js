/**
 * 模組渲染引擎 v2
 *
 * 根據模組配置動態生成標準化的 HTML 結構
 * 支援完整的模組功能：header, toolbar, table, modal, detail-modal
 *
 * @version 2.0.0
 */
(function() {
    'use strict';

    const { toKebabCase } = ModuleConfig.utils;
    const filterDrawerControllers = new WeakMap();

    /**
     * 取得模組的 data 屬性前綴
     * 支援自定義 dataPrefix，否則使用 kebab-case 轉換
     * @param {Object} config 模組配置
     * @returns {string} data 屬性前綴
     */
    function getDataPrefix(config) {
        return config.dataPrefix || toKebabCase(config.id);
    }

    function getSelectableColumns(config) {
        const columns = config.columns || [];
        return columns.filter(col => {
            if (!col || col.selectable === false) return false;
            if (!col.key || !col.label) return false;
            if (col.isCheckbox || col.type === 'checkbox' || col.key === 'checkbox') return false;
            return true;
        });
    }

    /**
     * HTML 模板片段
     */
    const TEMPLATES = {

        /**
         * 內容標題區
         */
        contentHeader: (config) => {
            const { title, subtitle } = config;
            const actions = config.actions || [];
            const kebabId = getDataPrefix(config);
            const hasSelectableColumns = getSelectableColumns(config).length > 0;

            let actionsHtml = '';
            if (actions.length > 0 || config.tableHeaderActionsInHeader) {
                const actionButtons = actions.map(action => {
                    const btnClass = action.style === 'primary' ? 'btn primary' :
                                     action.style === 'danger' ? 'btn danger' : 'btn outline';
                    const icon = action.icon ? `<i class="fas ${action.icon}"></i> ` : '';
                    const disabled = action.disabled ? ' disabled' : '';
                    const extraHtml = action.extraHtml || '';
                    // 如果 wrapLabel 為 true，用 span 包住 label
                    const labelHtml = action.wrapLabel ? `<span>${action.label}</span>` : action.label;
                    return `        <button type="button" class="${btnClass}" data-action="${action.action}"${disabled}>${icon}${labelHtml}${extraHtml}</button>`;
                });

                if (config.tableHeaderActionsInHeader) {
                    if (config.filterLayout === 'drawer') {
                        actionButtons.push(`        <button type="button" class="btn outline" data-action="open-filter-drawer" aria-expanded="false">
            <i class="fas fa-search"></i> 搜尋
            <span class="filter-count hidden" data-${kebabId}-filter-count>0</span>
        </button>`);
                    }
                    if (hasSelectableColumns) {
                        actionButtons.push(`        <button type="button" class="btn outline" data-action="toggle-column-selector">
            <i class="fas fa-columns"></i> 欄位設定
        </button>`);
                    }
                }

                actionsHtml = `
    <div class="header-actions">
${actionButtons.join('\n')}
    </div>`;
            }

            return `<div class="content-header${actions.length > 0 || config.tableHeaderActionsInHeader ? ' with-actions' : ''}">
    <div>
        <h2>${title}</h2>
        ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    </div>${actionsHtml}
</div>`;
        },

        /**
         * 模組警告訊息區
         */
        moduleAlert: (config) => {
            const kebabId = getDataPrefix(config);
            return `    <div class="module-alert hidden" data-${kebabId}-alert></div>`;
        },

        /**
         * 欄位選擇器
         */
        columnSelector: (config) => {
            const selectableColumns = getSelectableColumns(config);
            if (selectableColumns.length === 0) return '';

            const kebabId = getDataPrefix(config);

            const columnOptions = selectableColumns.map(col => {
                const checked = col.defaultVisible !== false ? ' checked' : '';
                return `                <label class="column-option">
                    <input type="checkbox" data-column="${col.key}"${checked}>
                    <span>${col.label}</span>
                </label>`;
            }).join('\n');

            return `    <div class="column-selector hidden" data-${kebabId}-column-selector>
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
        },

        /**
         * 篩選工具列
         */
        filterToolbar: (config) => {
            const filters = config.filters || [];
            const toolbarButtons = config.toolbarButtons || [];
            if (filters.length === 0 && toolbarButtons.length === 0) return '';

            const kebabId = getDataPrefix(config);

            const filterFields = filters.map(filter => {
                let inputHtml = '';
                const dataAttr = filter.dataAttr ? ` ${filter.dataAttr}` : '';

                switch (filter.type) {
                    case 'select':
                        const options = (filter.options || []).map(opt =>
                            `                        <option value="${opt.value}"${opt.selected ? ' selected' : ''}>${opt.label}</option>`
                        ).join('\n');
                        // 如果有 placeholder，加入空白選項；否則直接用 options
                        const emptyOption = filter.placeholder ? `                        <option value="">${filter.placeholder}</option>\n` : '';
                        inputHtml = `<select name="${filter.name}"${dataAttr}>
${emptyOption}${options}
                    </select>`;
                        break;
                    case 'date':
                        inputHtml = `<input type="date" name="${filter.name}"${dataAttr}>`;
                        break;
                    case 'number':
                        inputHtml = `<input type="number" name="${filter.name}" placeholder="${filter.placeholder || ''}"${dataAttr}>`;
                        break;
                    case 'checkbox':
                        inputHtml = `<input type="checkbox" name="${filter.name}"${dataAttr}>`;
                        // checkbox 使用與其他欄位相同的結構，但 input 在 span 前面
                        return `                <label class="filter-checkbox">
                    ${inputHtml}
                    <span>${filter.label}</span>
                </label>`;
                    default:
                        inputHtml = `<input type="text" name="${filter.name}" placeholder="${filter.placeholder || ''}"${dataAttr}>`;
                }

                return `                <label>
                    <span>${filter.label}</span>
                    ${inputHtml}
                </label>`;
            }).join('\n');

            // 工具列按鈕
            let toolbarBtnsHtml = '';
            if (toolbarButtons.length > 0) {
                const btns = toolbarButtons.map(btn => {
                    const btnClass = btn.style === 'primary' ? 'btn primary small' : 'btn outline small';
                    const icon = btn.icon ? `<i class="fas ${btn.icon}"></i> ` : '';
                    return `                <button type="button" class="${btnClass}" data-action="${btn.action}">${icon}${btn.label}</button>`;
                }).join('\n');
                toolbarBtnsHtml = `
            <div class="toolbar-buttons">
${btns}
            </div>`;
            }

            if (config.filterLayout === 'drawer') {
                return `    <div class="filter-summary-bar hidden" data-${kebabId}-filter-summary></div>
        <div class="filter-drawer-overlay hidden" data-${kebabId}-filter-overlay></div>
        <aside class="filter-drawer hidden" data-${kebabId}-filter-drawer aria-hidden="true">
            <div class="filter-drawer-header">
                <div>
                    <h3><i class="fas fa-search"></i> 搜尋條件</h3>
                    ${config.filterHint ? `<p>${config.filterHint}</p>` : ''}
                </div>
                <button type="button" class="filter-drawer-close" data-action="close-filter-drawer" aria-label="關閉搜尋面板">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form class="filter-form filter-form-drawer" data-${kebabId}-filter>
                <div class="form-grid">
${filterFields}
                </div>
                <div class="form-actions">
                    <button type="button" class="btn outline small" data-action="reset-filter">重設</button>
                    <button type="submit" class="btn primary small">${config.filterSubmitLabel || '套用'}</button>
                </div>
            </form>${toolbarBtnsHtml}
        </aside>`;
            }

            return `    <section class="module-toolbar compact">
            <form class="filter-form" data-${kebabId}-filter>
                <div class="form-grid">
${filterFields}
                </div>${config.filterHint ? `
                <p class="form-hint">${config.filterHint}</p>` : ''}
                <div class="form-actions">
                    <button type="submit" class="btn primary small">${config.filterSubmitLabel || '套用'}</button>
                    <button type="button" class="btn outline small" data-action="reset-filter">重設</button>
                </div>
            </form>${toolbarBtnsHtml}
        </section>`;
        },

        /**
         * 資料表格
         */
        dataTable: (config) => {
            const columns = config.columns || [];
            const tableClass = config.tableClass || 'data-table';
            const tableHeaderActions = config.tableHeaderActions || false;
            const tableWrapperClass = config.tableWrapperClass || 'table-responsive';

            if (columns.length === 0) return '';

            const kebabId = getDataPrefix(config);
            const hasSelectableColumns = getSelectableColumns(config).length > 0;

            const headerCells = columns.map(col => {
                // 處理 checkbox 欄位
                if (col.isCheckbox || col.type === 'checkbox') {
                    return `                        <th class="checkbox-col"><input type="checkbox" data-action="select-all" title="全選"></th>`;
                }

                const dataCol = col.key ? ` data-column="${col.key}"` : '';
                const isSortable = col.sortable !== false && col.key && col.key !== 'actions';
                const dataSort = isSortable ? ` data-sort="${col.key}"` : '';
                const style = col.width ? ` style="width: ${col.width}"` : '';
                const sortIcon = isSortable ? ' <i class="fas fa-sort"></i>' : '';
                return `                        <th${dataCol}${dataSort}${style}>${col.label}${sortIcon}</th>`;
            }).join('\n');

            // 表格標題區操作按鈕（如欄位設定按鈕）
            const tableHeaderActionsHtml = tableHeaderActions && !config.tableHeaderActionsInHeader ? `
            <div class="table-header-actions">
                ${config.filterLayout === 'drawer' ? `<button type="button" class="btn outline small" data-action="open-filter-drawer" aria-expanded="false">
                    <i class="fas fa-search"></i> 搜尋
                    <span class="filter-count hidden" data-${kebabId}-filter-count>0</span>
                </button>` : ''}
                ${hasSelectableColumns ? `<button type="button" class="btn outline small" data-action="toggle-column-selector">
                    <i class="fas fa-columns"></i> 欄位設定
                </button>` : ''}
            </div>` : '';

            // 表格摘要區（如 lookup_values 的顯示模式）
            const tableMetaHtml = config.tableMeta ? `
            <div class="table-meta">
                <span data-${kebabId}-summary></span>
            </div>` : '';

            // 分頁區（可選擇關閉）
            const paginationHtml = config.noPagination ? '' : `
            <div class="pagination" data-${kebabId}-pagination></div>`;

            return `    <section class="table-section">${tableHeaderActionsHtml}${tableMetaHtml}
            <div class="${tableWrapperClass}">
                <table class="${tableClass}" data-${kebabId}-table>
                    <thead>
                        <tr>
${headerCells}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="${columns.length}" class="text-center">資料載入中...</td>
                        </tr>
                    </tbody>
                </table>
            </div>${paginationHtml}
        </section>`;
        },

        /**
         * Modal 表單欄位
         */
        formField: (field, kebabId) => {
            const required = field.required ? ' required' : '';
            const requiredMark = field.required ? ' <abbr title="必填">*</abbr>' : '';
            const fullWidth = field.fullWidth ? ' full-width' : '';
            const dataAttr = field.dataAttr ? ` ${field.dataAttr}` : '';
            const readonly = field.readonly ? ' readonly' : '';
            const disabled = field.disabled ? ' disabled' : '';
            const maxlength = field.maxlength ? ` maxlength="${field.maxlength}"` : '';
            const minlength = field.minlength ? ` minlength="${field.minlength}"` : '';
            const labelDataAttr = field.labelDataAttr ? ` ${field.labelDataAttr}` : '';
            const containerDataAttr = field.containerDataAttr ? ` ${field.containerDataAttr}` : '';
            const helpText = field.helpText ? `\n                        <small>${field.helpText}</small>` : '';
            const autocomplete = field.autocomplete || 'off';
            const hiddenClass = field.hidden ? ' hidden' : '';
            const extraAttrs = field.attributes ? ' ' + Object.entries(field.attributes).map(([k, v]) => `${k}="${v}"`).join(' ') : '';

            let inputHtml = '';
            switch (field.type) {
                case 'select':
                    const multiple = field.multiple ? ' multiple' : '';
                    const opts = (field.options || []).map(o =>
                        `<option value="${o.value}">${o.label}</option>`
                    ).join('\n                            ');
                    // multiple select 不需要預設 placeholder option
                    const placeholderOpt = !field.multiple ? `<option value="">${field.placeholder || '請選擇'}</option>` : '';
                    inputHtml = `<select name="${field.name}"${required}${multiple}${dataAttr}${disabled}${extraAttrs}>
                            ${placeholderOpt}
                            ${opts}
                        </select>`;
                    break;
                case 'textarea':
                    inputHtml = `<textarea name="${field.name}" rows="${field.rows || 3}"${required}${maxlength}${dataAttr} placeholder="${field.placeholder || ''}" autocomplete="${autocomplete}">${field.value || ''}</textarea>`;
                    break;
                case 'hidden':
                    return `                    <input type="hidden" name="${field.name}"${dataAttr}>`;
                case 'static':
                    inputHtml = `<span class="static-value" data-field="${field.name}">${field.value || '-'}</span>`;
                    break;
                case 'number':
                    const min = field.min !== undefined ? ` min="${field.min}"` : '';
                    const max = field.max !== undefined ? ` max="${field.max}"` : '';
                    const step = field.step !== undefined ? ` step="${field.step}"` : '';
                    inputHtml = `<input type="number" name="${field.name}"${required}${readonly}${disabled}${min}${max}${step}${dataAttr} placeholder="${field.placeholder || ''}" autocomplete="${autocomplete}">`;
                    break;
                case 'date':
                    inputHtml = `<input type="date" name="${field.name}"${required}${readonly}${disabled}${dataAttr}>`;
                    break;
                case 'email':
                    inputHtml = `<input type="email" name="${field.name}"${required}${readonly}${disabled}${maxlength}${dataAttr} placeholder="${field.placeholder || ''}" autocomplete="${autocomplete}">`;
                    break;
                case 'tel':
                    inputHtml = `<input type="tel" name="${field.name}"${required}${readonly}${disabled}${maxlength}${dataAttr} placeholder="${field.placeholder || ''}" autocomplete="${autocomplete}">`;
                    break;
                case 'password':
                    inputHtml = `<input type="password" name="${field.name}"${minlength}${required}${readonly}${disabled}${dataAttr} placeholder="${field.placeholder || ''}" autocomplete="${field.autocomplete || 'new-password'}">`;
                    break;
                case 'checkbox':
                    const checked = field.checked ? ' checked' : '';
                    inputHtml = `<input type="checkbox" name="${field.name}"${checked}${disabled}${dataAttr}>`;
                    // checkbox 使用特殊的 class，使用 checkboxLabel 或 label 作為顯示文字
                    const checkboxDisplayLabel = field.checkboxLabel || field.label || '';
                    return `                    <label class="inline-label checkbox-field${fullWidth}${hiddenClass}"${labelDataAttr}${containerDataAttr}>
                        ${inputHtml}
                        <span>${checkboxDisplayLabel}</span>${helpText}
                    </label>`;
                case 'richtext':
                    // 富文本編輯器，渲染為空容器，由 JS 初始化
                    inputHtml = `<div class="rich-editor-container"${dataAttr}></div>`;
                    break;
                case 'file':
                    const accept = field.accept ? ` accept="${field.accept}"` : '';
                    const multipleFile = field.multiple ? ' multiple' : '';
                    inputHtml = `<input type="file" name="${field.name}"${accept}${multipleFile}${dataAttr}>`;
                    break;
                case 'custom':
                    // 自訂 HTML
                    return field.customHtml || '';
                case 'datetime-local':
                    inputHtml = `<input type="datetime-local" name="${field.name}"${required}${readonly}${disabled}${dataAttr}>`;
                    break;
                default:
                    inputHtml = `<input type="${field.type || 'text'}" name="${field.name}"${maxlength}${required}${readonly}${disabled}${dataAttr} placeholder="${field.placeholder || ''}" autocomplete="${autocomplete}">`;
            }


            return `                    <label class="inline-label${fullWidth}${hiddenClass}"${labelDataAttr}${containerDataAttr}>
                        <span>${field.label}${requiredMark}</span>
                        ${inputHtml}${helpText}
                    </label>`;
        },

        /**
         * 渲染單一 section
         */
        formSection: (section, kebabId) => {
            const fields = (section.fields || []).map(field =>
                TEMPLATES.formField(field, kebabId)
            ).join('\n');

            const customHtml = section.customHtml || '';
            const extraHtml = section.extraHtml || '';  // 在 fields 後追加的 HTML
            const sectionClass = section.className ? ` ${section.className}` : '';
            const sectionDataAttr = section.dataAttr ? ` ${section.dataAttr}` : '';

            // 支援 gridColumns 設定欄數
            let gridClass = 'form-grid';
            if (section.gridColumns === 2) gridClass += ' form-grid-two-columns';
            else if (section.gridColumns === 3) gridClass += ' form-grid-three-columns';
            else if (section.gridColumns === 4) gridClass += ' form-grid-four-columns';

            const formGridHtml = fields ? `
                <div class="${gridClass}">
${fields}
                </div>` : '';

            const titleHtml = section.title ? `<h4>${section.title}</h4>` : '';

            return `                <div class="form-section${sectionClass}"${sectionDataAttr}>
                    ${titleHtml}${formGridHtml}${extraHtml}${customHtml}
                </div>`;
        },

        /**
         * Modal 對話框
         */
        modal: (config) => {
            const { modal } = config;
            if (!modal) return '';

            const kebabId = getDataPrefix(config);
            const sizeClass = modal.size ? ` ${modal.size}` : '';
            const extraClass = modal.className ? ` ${modal.className}` : '';

            let formContent = '';

            // noSections 模式：欄位在 form-grid 內，不用 section 包裹
            if (modal.noSections && modal.fields) {
                const fieldsHtml = (modal.fields || []).map(field =>
                    TEMPLATES.formField(field, kebabId)
                ).join('\n');
                formContent = `            <div class="form-grid">
${fieldsHtml}
            </div>`;
            }
            // formRows 模式：多個 row，每個 row 內有多個並排的 section
            // 注意：formRows 內的子 section 使用 TEMPLATES.formSection()（產生 <div>）
            // 這是刻意設計：子 section 是版面輔助區塊，不需要語義化 <section> 標籤
            else if (modal.formRows) {
                formContent = modal.formRows.map(row => {
                    const sectionsHtml = row.sections.map(section =>
                        TEMPLATES.formSection(section, kebabId)
                    ).join('\n');
                    // 根據 sections 數量自動加上欄數 class
                    const columnClass = row.sections.length === 1 ? ' single-column' : (row.sections.length >= 3 ? ' three-columns' : '');
                    return `            <div class="form-row${columnClass}">
${sectionsHtml}
            </div>`;
                }).join('\n\n');

                // formRows 後可以接續額外的 sections（不並排）
                if (modal.sections) {
                    const additionalSections = (modal.sections || []).map(section =>
                        TEMPLATES.formSection(section, kebabId)
                    ).join('\n\n');
                    formContent += '\n\n' + additionalSections;
                }
            }
            // 標準模式：使用 sections（不並排）
            // 注意：此模式使用語義化 <section> 標籤（而非 TEMPLATES.formSection() 的 <div>）
            // 原因：頂層表單區塊應使用 HTML5 語義元素，以符合 WAI-ARIA 和 SEO 規範
            else if (modal.sections) {
                formContent = (modal.sections || []).map(section => {
                    const fields = (section.fields || []).map(field =>
                        TEMPLATES.formField(field, kebabId)
                    ).join('\n');

                    const customHtml = section.customHtml || '';
                    const sectionClass = section.className ? ` ${section.className}` : '';
                    const sectionDataAttr = section.dataAttr ? ` ${section.dataAttr}` : '';

                    // 支援 gridColumns 設定欄數
                    let gridClass = 'form-grid';
                    if (section.gridColumns === 2) gridClass += ' form-grid-two-columns';
                    else if (section.gridColumns === 3) gridClass += ' form-grid-three-columns';
                    else if (section.gridColumns === 4) gridClass += ' form-grid-four-columns';

                    const formGridHtml = fields ? `
                <div class="${gridClass}">
${fields}
                </div>` : '';

                    const titleHtml = section.title ? `<h4>${section.title}</h4>` : '';
                    return `            <section class="form-section${sectionClass}"${sectionDataAttr}>
                ${titleHtml}${formGridHtml}${customHtml}
            </section>`;
                }).join('\n\n');
            }

            const customFormContent = modal.customFormContent || '';
            const submitLabel = modal.submitLabel || '儲存';
            const cancelLabel = modal.cancelLabel || '取消';
            const submitDataAction = modal.submitDataAction ? ` data-action="${modal.submitDataAction}"` : '';
            // noAlignRight 模式：form-actions 不加 align-right
            const alignRightClass = modal.noAlignRight ? '' : ' align-right';

            // 隱藏欄位
            let hiddenFieldsHtml = '';
            if (modal.hiddenFields && modal.hiddenFields.length > 0) {
                hiddenFieldsHtml = modal.hiddenFields.map(name =>
                    `            <input type="hidden" name="${name}">`
                ).join('\n') + '\n';
            }

            // 表單按鈕：支援 formActions 自訂按鈕陣列，或使用預設的取消+送出
            let formActionsHtml = '';
            if (modal.formActions && Array.isArray(modal.formActions)) {
                const buttons = modal.formActions.map(btn => {
                    const btnType = btn.type === 'submit' ? 'submit' : 'button';
                    const btnClass = btn.style === 'primary' ? 'btn primary' :
                                     btn.style === 'danger' ? 'btn danger' : 'btn outline';
                    const icon = btn.icon ? `<i class="fas ${btn.icon}"></i> ` : '';
                    const dataAction = btn.action ? ` data-action="${btn.action}"` : '';
                    return `                <button type="${btnType}" class="${btnClass}"${dataAction}>${icon}${btn.label}</button>`;
                }).join('\n');
                formActionsHtml = `            <div class="form-actions${alignRightClass}">
${buttons}
            </div>`;
            } else {
                formActionsHtml = `            <div class="form-actions${alignRightClass}">
                <button type="button" class="btn outline" data-action="cancel">${cancelLabel}</button>
                <button type="submit" class="btn primary"${submitDataAction}>${submitLabel}</button>
            </div>`;
            }

            return `<div class="modal-overlay hidden" data-${kebabId}-modal>
    <div class="modal-window${sizeClass}${extraClass}">
        <button type="button" class="modal-close" data-action="close-modal" aria-label="關閉">
            <i class="fas fa-times"></i>
        </button>
        <h3 data-modal-title>${modal.title || modal.createTitle || '新增資料'}</h3>
        <div class="modal-alert hidden" data-${kebabId}-modal-alert role="alert"></div>

        <form data-${kebabId}-form novalidate>
${hiddenFieldsHtml}${formContent}
${customFormContent}
${formActionsHtml}
        </form>
    </div>
</div>`;
        },

        /**
         * 詳情 Modal
         */
        detailModal: (config) => {
            const { detailModal } = config;
            if (!detailModal) return '';

            const kebabId = getDataPrefix(config);
            const sizeClass = detailModal.size ? ` ${detailModal.size}` : ' large';

            let sectionsHtml = '';

            // 支援新格式: fields (頂層欄位列表)
            if (detailModal.fields && detailModal.fields.length > 0) {
                const fields = detailModal.fields.map(field => {
                    return `                    <div class="detail-item">
                        <label>${field.label}</label>
                        <span data-field="${field.key}">${field.defaultValue || '-'}</span>
                    </div>`;
                }).join('\n');

                sectionsHtml = `            <div class="detail-grid">
${fields}
            </div>`;

                // 如果有 detailSection (用於顯示 JSON 等詳細資料)
                if (detailModal.detailSection) {
                    const ds = detailModal.detailSection;
                    sectionsHtml += `
            <section class="detail-section">
                <h4>${ds.title}</h4>
                <pre class="detail-json" data-${kebabId}-${ds.field}></pre>
            </section>`;
                }
            }
            // 支援舊格式: sections
            else if (detailModal.sections && detailModal.sections.length > 0) {
                sectionsHtml = detailModal.sections.map(section => {
                    const fields = (section.fields || []).map(field => {
                        return `                    <div class="detail-item">
                        <label>${field.label}</label>
                        <span data-field="${field.key}">${field.defaultValue || '-'}</span>
                    </div>`;
                    }).join('\n');

                    return `            <section class="detail-section">
                <h4>${section.title}</h4>
                <div class="detail-grid">
${fields}
                </div>
            </section>`;
                }).join('\n\n');
            }

            const defaultButtons = detailModal.showEditButton === false
                ? [{ action: 'close-detail-modal', label: '關閉', style: 'outline' }]
                : [
                    { action: 'close-detail-modal', label: '關閉', style: 'outline' },
                    { action: 'edit-from-detail', label: '編輯', style: 'primary' }
                ];
            const buttons = (detailModal.buttons || defaultButtons).map(btn => {
                const btnClass = btn.style === 'primary' ? 'primary' : 'outline';
                const icon = btn.icon ? `<i class="fas ${btn.icon}"></i> ` : '';
                const extraAttr = btn.dataAttr ? ` ${btn.dataAttr}` : '';
                return `            <button type="button" class="${btnClass}" data-action="${btn.action}"${extraAttr}>${icon}${btn.label}</button>`;
            }).join('\n');

            // 支援自訂詳情內容選擇器（向後相容）
            // 預設使用 data-{kebabId}-details，但可透過 contentDataAttr 自訂
            const contentDataAttr = detailModal.contentDataAttr || `data-${kebabId}-details`;

            return `<div class="modal-overlay hidden" data-${kebabId}-detail-modal>
    <div class="modal-window${sizeClass}">
        <button type="button" class="modal-close" data-action="close-detail-modal" aria-label="關閉">
            <i class="fas fa-times"></i>
        </button>
        <h3><i class="fas fa-info-circle"></i> ${detailModal.title || '資料詳情'}</h3>

        <div class="detail-content" ${contentDataAttr}>
${sectionsHtml}
        </div>

        <div class="form-actions">
${buttons}
        </div>
    </div>
</div>`;
        },

        /**
         * 額外的項目 Modal（如出貨單的新增項目）
         */
        addItemModal: (config) => {
            const { addItemModal } = config;
            if (!addItemModal) return '';

            const kebabId = getDataPrefix(config);
            const sizeClass = addItemModal.size ? ` ${addItemModal.size}` : ' medium';
            const icon = addItemModal.icon ? `<i class="fas ${addItemModal.icon}"></i> ` : '';

            // 渲染表單區塊
            let sectionsHtml = '';
            if (addItemModal.sections && addItemModal.sections.length > 0) {
                sectionsHtml = addItemModal.sections.map(section => {
                    // 如果有 customHtml，直接使用
                    if (section.customHtml) {
                        return `            <section class="form-section">
                <h4>${section.title}</h4>
${section.customHtml}
            </section>`;
                    }

                    // 否則渲染 fields
                    const fields = (section.fields || []).map(field =>
                        TEMPLATES.formField(field, kebabId)
                    ).join('\n');

                    return `            <section class="form-section">
                <h4>${section.title}</h4>
                <div class="form-grid">
${fields}
                </div>
            </section>`;
                }).join('\n\n');
            }

            const submitLabel = addItemModal.submitLabel || '儲存';
            const submitIcon = addItemModal.submitIcon ? `<i class="fas ${addItemModal.submitIcon}"></i> ` : '';
            const submitStyle = addItemModal.submitStyle || 'primary';

            return `<div class="modal-overlay hidden" data-add-item-modal>
    <div class="modal-window${sizeClass}">
        <button type="button" class="modal-close" data-action="close-add-item-modal" aria-label="關閉">
            <i class="fas fa-times"></i>
        </button>
        <h3>${icon}${addItemModal.title || '新增項目'}</h3>

        <div class="modal-alert hidden" data-add-item-modal-alert></div>

        <form data-add-item-form novalidate>
            <input type="hidden" name="shipping_order_id">

${sectionsHtml}

            <div class="form-actions">
                <button type="button" class="outline" data-action="close-add-item-modal">取消</button>
                <button type="submit" class="${submitStyle}">${submitIcon}${submitLabel}</button>
            </div>
        </form>
    </div>
</div>`;
        }
    };

    /**
     * 側欄頁籤佈局模板
     */
    const SIDEBAR_TABS = {
        /**
         * 渲染側欄頁籤 + 內容區
         */
        render: (config) => {
            const tabs = config.sidebarTabs;
            if (!tabs || !tabs.items) return '';

            const kebabId = getDataPrefix(config);

            // 側欄頁籤按鈕
            const tabButtons = tabs.items.map((tab, i) => {
                const activeClass = tab.value === (tabs.defaultValue || tabs.items[0].value) ? ' active' : '';
                const icon = tab.icon ? `<i class="fas ${tab.icon}"></i>` : '';
                const badge = tab.badge ? ` <span class="tab-badge" data-${kebabId}-tab-badge-${tab.value}></span>` : '';
                return `            <button type="button" class="sidebar-tab-btn${activeClass}" data-tab-value="${tab.value}">
                ${icon} ${tab.label}${badge}
            </button>`;
            }).join('\n');

            // 內容區工具列（搜尋 + 篩選）
            const toolbarItems = [];

            // 搜尋欄
            if (tabs.searchField) {
                const sf = tabs.searchField;
                toolbarItems.push(`<div class="search-input-wrap">
                    <i class="fas fa-search"></i>
                    <input type="text" name="${sf.name}" placeholder="${sf.placeholder || '搜尋...'}">
                </div>`);
            }

            // 額外篩選（如通知類型）
            if (tabs.extraFilters) {
                tabs.extraFilters.forEach(filter => {
                    if (filter.type === 'select') {
                        const opts = (filter.options || []).map(o => `<option value="${o.value}">${o.label}</option>`).join('');
                        toolbarItems.push(`<select class="filter-select" name="${filter.name}" title="${filter.label}">${opts}</select>`);
                    } else if (filter.type === 'checkbox') {
                        const dataAttr = filter.dataAttr ? ` ${filter.dataAttr}` : '';
                        toolbarItems.push(`<label class="filter-checkbox" data-unread-filter-label>
                    <input type="checkbox" name="${filter.name}"${dataAttr}>
                    <span>${filter.label}</span>
                </label>`);
                    }
                });
            }

            const toolbarHtml = toolbarItems.length > 0 ? `
            <div class="sidebar-content-toolbar" data-${kebabId}-toolbar>
                ${toolbarItems.join('\n                ')}
            </div>` : '';

            return `<div class="sidebar-tabs-layout" data-${kebabId}-sidebar-layout>
        <nav class="sidebar-tabs-nav" data-${kebabId}-tab-nav>
${tabButtons}
        </nav>
        <div class="sidebar-tabs-content">${toolbarHtml}
${TEMPLATES.dataTable(config)}
        </div>
    </div>`;
        }
    };

    /**
     * 模組渲染器
     */
    class ModuleRenderer {
        /**
         * 初始化配置式搜尋抽屜互動。
         * 既有模組若已有自訂抽屜邏輯，不需啟用 useGenericFilterDrawer。
         */
        static initFilterDrawer(moduleId, container) {
            const config = ModuleConfig.get(moduleId);
            if (!config || config.filterLayout !== 'drawer' || !config.useGenericFilterDrawer || !container) {
                return;
            }

            const kebabId = getDataPrefix(config);
            const moduleRoot = container.querySelector(`[data-module="${moduleId}"]`);
            if (!moduleRoot || moduleRoot.dataset.genericFilterDrawerInitialised === 'true') {
                return;
            }
            moduleRoot.dataset.genericFilterDrawerInitialised = 'true';

            const form = moduleRoot.querySelector(`[data-${kebabId}-filter]`);
            const drawer = moduleRoot.querySelector(`[data-${kebabId}-filter-drawer]`);
            const overlay = moduleRoot.querySelector(`[data-${kebabId}-filter-overlay]`);
            const summary = moduleRoot.querySelector(`[data-${kebabId}-filter-summary]`);
            const countBadge = moduleRoot.querySelector(`[data-${kebabId}-filter-count]`);
            const openButton = moduleRoot.querySelector('[data-action="open-filter-drawer"]');
            const closeButton = moduleRoot.querySelector('[data-action="close-filter-drawer"]');

            if (!form || !drawer || !overlay) {
                return;
            }

            const setDrawerOpen = (isOpen) => {
                drawer.classList.toggle('hidden', !isOpen);
                overlay.classList.toggle('hidden', !isOpen);
                drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
                if (openButton) {
                    openButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                }
                if (isOpen) {
                    drawer.querySelector('input, select, button')?.focus();
                }
            };

            const getFieldLabel = (field) => {
                const label = field.closest('label');
                const labelText = label ? label.querySelector('span')?.textContent.trim() : '';
                return labelText || field.name;
            };

            const getFieldValueText = (field) => {
                if (field.type === 'checkbox') {
                    return field.checked ? '是' : '';
                }
                if (field.tagName === 'SELECT') {
                    const option = field.options[field.selectedIndex];
                    return field.value && option ? option.textContent.trim() : '';
                }
                return (field.value || '').trim();
            };

            const updateSummary = () => {
                const chips = [];
                form.querySelectorAll('[name]').forEach((field) => {
                    if (field.name === 'perPage') {
                        return;
                    }
                    const text = getFieldValueText(field);
                    if (text) {
                        chips.push(`${getFieldLabel(field)}：${text}`);
                    }
                });

                if (summary) {
                    summary.textContent = '';
                    summary.classList.toggle('hidden', chips.length === 0);
                    if (chips.length > 0) {
                        const content = document.createElement('div');
                        const clearButton = document.createElement('button');
                        content.className = 'filter-summary-content';
                        chips.forEach((text) => {
                            const chip = document.createElement('span');
                            chip.className = 'filter-chip';
                            chip.textContent = text;
                            content.appendChild(chip);
                        });
                        clearButton.type = 'button';
                        clearButton.className = 'btn outline small';
                        clearButton.dataset.action = 'clear-filter-summary';
                        clearButton.textContent = '清除搜尋';
                        summary.append(content, clearButton);
                    }
                }

                if (countBadge) {
                    countBadge.textContent = String(chips.length);
                    countBadge.classList.toggle('hidden', chips.length === 0);
                }
                if (openButton) {
                    openButton.classList.toggle('has-active-filters', chips.length > 0);
                }
            };

            const controller = {
                open: () => setDrawerOpen(true),
                close: () => setDrawerOpen(false),
                updateSummary,
                resetAndSubmit: () => {
                    form.reset();
                    updateSummary();
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                }
            };
            filterDrawerControllers.set(moduleRoot, controller);

            openButton?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                controller.open();
            });
            closeButton?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                controller.close();
            });
            overlay.addEventListener('click', (event) => {
                event.stopImmediatePropagation();
                controller.close();
            });
            form.addEventListener('submit', () => {
                controller.close();
                updateSummary();
            });
            form.querySelector('[data-action="reset-filter"]')?.addEventListener('click', () => {
                setTimeout(updateSummary, 0);
            });
            summary?.addEventListener('click', (event) => {
                if (!event.target.closest('[data-action="clear-filter-summary"]')) {
                    return;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                controller.resetAndSubmit();
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    controller.close();
                }
            });

            updateSummary();
        }

        static getFilterDrawerController(moduleId, container) {
            const moduleRoot = container?.querySelector?.(`[data-module="${moduleId}"]`) ||
                (container?.matches?.(`[data-module="${moduleId}"]`) ? container : null);
            return moduleRoot ? filterDrawerControllers.get(moduleRoot) || null : null;
        }

        /**
         * 渲染完整模組 HTML
         */
        static render(moduleId) {
            const config = ModuleConfig.get(moduleId);
            if (!config) {
                console.error(`ModuleRenderer: 找不到模組配置 ${moduleId}`);
                return `<div class="module-error">模組 ${moduleId} 尚未配置</div>`;
            }

            const customHtml = config.customHtml || '';
            const afterTableHtml = config.afterTableHtml || '';
            const customModalHtml = config.customModalHtml || '';

            // 側欄頁籤佈局模式
            if (config.sidebarTabs) {
                const parts = [
                    `<div data-module="${moduleId}">`,
                    TEMPLATES.contentHeader(config),
                    '<div class="content-area">',
                    TEMPLATES.moduleAlert(config),
                    customHtml,
                    TEMPLATES.columnSelector(config),
                    SIDEBAR_TABS.render(config),
                    '</div>',
                    TEMPLATES.modal(config),
                    TEMPLATES.detailModal(config),
                    TEMPLATES.addItemModal(config),
                    customModalHtml,
                    '</div>'
                ];
                return parts.filter(p => p).join('\n');
            }

            const parts = [
                `<div data-module="${moduleId}">`,
                TEMPLATES.contentHeader(config),
                '<div class="content-area">',
                TEMPLATES.moduleAlert(config),
                customHtml,
                TEMPLATES.columnSelector(config),
                TEMPLATES.filterToolbar(config),
                TEMPLATES.dataTable(config),
                afterTableHtml,
                '</div>',
                TEMPLATES.modal(config),
                TEMPLATES.detailModal(config),
                TEMPLATES.addItemModal(config),
                customModalHtml,  // 支援額外的自訂 Modal HTML
                '</div>'
            ];

            return parts.filter(p => p).join('\n');
        }

        /**
         * 渲染並插入到容器
         */
        static renderTo(moduleId, container) {
            const html = this.render(moduleId);
            if (html && container) {
                container.innerHTML = html;
                this.initFilterDrawer(moduleId, container);
            }
        }

        /**
         * 只渲染特定部分
         */
        static renderPart(moduleId, templateName) {
            const config = ModuleConfig.get(moduleId);
            if (!config || !TEMPLATES[templateName]) {
                return '';
            }
            return TEMPLATES[templateName](config);
        }

        /**
         * 取得模板函數
         */
        static getTemplates() {
            return { ...TEMPLATES };
        }
    }

    window.ModuleRenderer = ModuleRenderer;

})();
