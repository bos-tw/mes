/**
 * Customers Module
 * 客戶管理模組
 */
(function() {
    'use strict';

    function initializeCustomersModule(container, context = null) {
        const moduleRoot = container.querySelector('[data-module="customers"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';
        // 欄位管理器由 column_manager.js 自動初始化，不需要手動呼叫

        const alertBox = moduleRoot.querySelector('[data-customers-alert]');
        const filterForm = moduleRoot.querySelector('[data-customers-filter]');
        const tableElement = moduleRoot.querySelector('[data-customers-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-customers-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-customers-modal]');
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-customers-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-customers-modal-alert]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');
        const openFilterDrawerButton = moduleRoot.querySelector('[data-action="open-filter-drawer"]');
        const closeFilterDrawerButton = moduleRoot.querySelector('[data-action="close-filter-drawer"]');
        const filterDrawer = moduleRoot.querySelector('[data-customers-filter-drawer]');
        const filterOverlay = moduleRoot.querySelector('[data-customers-filter-overlay]');
        const filterSummary = moduleRoot.querySelector('[data-customers-filter-summary]');
        const filterCountBadge = moduleRoot.querySelector('[data-customers-filter-count]');
        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const batchPrintButton = moduleRoot.querySelector('.content-header [data-action="batch-print"]');
        const batchExportButton = moduleRoot.querySelector('.content-header [data-action="batch-export"]');
        const selectAllCheckbox = tableElement ? tableElement.querySelector('thead [data-action="select-all"]') : null;

    const customerNumberInput = modalForm ? modalForm.querySelector('input[name="customer_number"]') : null;
    const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
    const productCategoryInput = modalForm ? modalForm.querySelector('input[name="product_category"]') : null;
    const websiteInput = modalForm ? modalForm.querySelector('input[name="website"]') : null;
    const faxInput = modalForm ? modalForm.querySelector('input[name="fax"]') : null;
    const invoiceTitleInput = modalForm ? modalForm.querySelector('input[name="invoice_title"]') : null;
    const companyRegisteredAddressInput = modalForm ? modalForm.querySelector('input[name="company_registered_address"]') : null;
    const contactPersonInput = modalForm ? modalForm.querySelector('input[name="contact_person"]') : null;
    const phoneInput = modalForm ? modalForm.querySelector('input[name="phone"]') : null;
    const emailInput = modalForm ? modalForm.querySelector('input[name="email"]') : null;
    const addressInput = modalForm ? modalForm.querySelector('input[name="address"]') : null;
    const invoiceAddressInput = modalForm ? modalForm.querySelector('input[name="invoice_address"]') : null;
    const shippingAddressInput = modalForm ? modalForm.querySelector('input[name="shipping_address"]') : null;
    const salesContactPersonInput = modalForm ? modalForm.querySelector('input[name="sales_contact_person"]') : null;
    const salesContactExtensionInput = modalForm ? modalForm.querySelector('input[name="sales_contact_extension"]') : null;
    const salesContactMobileInput = modalForm ? modalForm.querySelector('input[name="sales_contact_mobile"]') : null;
    const salesContactEmailInput = modalForm ? modalForm.querySelector('input[name="sales_contact_email"]') : null;
    const financeContactPersonInput = modalForm ? modalForm.querySelector('input[name="finance_contact_person"]') : null;
    const financeContactExtensionInput = modalForm ? modalForm.querySelector('input[name="finance_contact_extension"]') : null;
    const financeContactMobileInput = modalForm ? modalForm.querySelector('input[name="finance_contact_mobile"]') : null;
    const financeContactEmailInput = modalForm ? modalForm.querySelector('input[name="finance_contact_email"]') : null;
    const billingDaySelect = modalForm ? modalForm.querySelector('select[name="billing_day"]') : null;
    const reconciliationDaySelect = modalForm ? modalForm.querySelector('select[name="reconciliation_day"]') : null;
    const paymentMethodSelect = modalForm ? modalForm.querySelector('select[name="payment_method"]') : null;
    const minimumOrderAmountInput = modalForm ? modalForm.querySelector('input[name="minimum_order_amount"]') : null;
    const weightTolerancePercentageInput = modalForm ? modalForm.querySelector('input[name="weight_tolerance_percentage"]') : null;
    const taxIdInput = modalForm ? modalForm.querySelector('input[name="tax_id"]') : null;
    const invoiceStampFileInput = modalForm ? modalForm.querySelector('[data-invoice-stamp-input]') : null;
    const invoiceAttachmentPathInput = modalForm ? modalForm.querySelector('input[name="invoice_attachment_path"]') : null;
    const removeInvoiceAttachmentInput = modalForm ? modalForm.querySelector('[data-remove-invoice-stamp]') : null;
    const invoiceStampPreviewWrapper = modalForm ? modalForm.querySelector('[data-invoice-stamp-preview]') : null;
    const invoiceStampPreviewImage = modalForm ? modalForm.querySelector('[data-invoice-stamp-preview-image]') : null;
    const openInvoiceStampLink = modalForm ? modalForm.querySelector('[data-action="open-invoice-stamp"]') : null;
    const clearInvoiceStampButton = modalForm ? modalForm.querySelector('[data-action="clear-invoice-stamp"]') : null;
    const notesTextarea = modalForm ? modalForm.querySelector('textarea[name="notes"]') : null;
    const isActiveSelect = modalForm ? modalForm.querySelector('select[name="is_active"]') : null;
    const customerToolAnalysisContainer = modalForm ? modalForm.querySelector('[data-customer-tool-analysis]') : null;

        const customersCache = new Map();
        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            currentEditingId: null,
            formSnapshot: null,
            sortField: 'customer_number',
            sortDirection: 'asc',
        };

        let isFormDirty = false;
    const selectedCustomerIds = new Set();
    const sortableHeaders = tableElement ? Array.from(tableElement.querySelectorAll('th[data-sort]')) : [];
    const totalColumns = 18;
    let invoiceStampObjectUrl = null;

    function revokeInvoiceStampObjectUrl() {
        if (invoiceStampObjectUrl) {
            URL.revokeObjectURL(invoiceStampObjectUrl);
            invoiceStampObjectUrl = null;
        }
    }

    function normalizeAttachmentPath(path) {
        if (!path) {
            return '';
        }

        const trimmed = path.trim();
        if (trimmed === '') {
            return '';
        }

        if (/^(?:https?:|data:|blob:)/i.test(trimmed)) {
            return trimmed;
        }

        return trimmed;
    }

    function setInvoiceStampPreview(source) {
        if (!invoiceStampPreviewWrapper || !invoiceStampPreviewImage || !openInvoiceStampLink) {
            return;
        }

        if (!source) {
            invoiceStampPreviewWrapper.classList.add('hidden');
            invoiceStampPreviewImage.removeAttribute('src');
            openInvoiceStampLink.href = '#';
            openInvoiceStampLink.classList.add('disabled');
            openInvoiceStampLink.setAttribute('aria-disabled', 'true');
            openInvoiceStampLink.tabIndex = -1;
            return;
        }

        invoiceStampPreviewWrapper.classList.remove('hidden');
        invoiceStampPreviewImage.src = source;
        openInvoiceStampLink.href = source;
        openInvoiceStampLink.classList.remove('disabled');
        openInvoiceStampLink.setAttribute('aria-disabled', 'false');
        openInvoiceStampLink.tabIndex = 0;
    }

    function updateInvoiceStampPreviewFromPath(path) {
        revokeInvoiceStampObjectUrl();
        const normalized = normalizeAttachmentPath(path);
        setInvoiceStampPreview(normalized);
    }

    function updateInvoiceStampPreviewFromFile(file) {
        if (!file) {
            updateInvoiceStampPreviewFromPath(invoiceAttachmentPathInput ? invoiceAttachmentPathInput.value : '');
            return;
        }

        revokeInvoiceStampObjectUrl();
        invoiceStampObjectUrl = URL.createObjectURL(file);
        setInvoiceStampPreview(invoiceStampObjectUrl);
    }

    function resetInvoiceStampPreview() {
        revokeInvoiceStampObjectUrl();
        setInvoiceStampPreview('');
    }

    function collectCustomerFormValues() {
        return {
            customer_number: customerNumberInput ? customerNumberInput.value.trim() : '',
            name: nameInput ? nameInput.value.trim() : '',
            is_active: isActiveSelect ? isActiveSelect.value : '1',
            product_category: productCategoryInput ? productCategoryInput.value.trim() : '',
            website: websiteInput ? websiteInput.value.trim() : '',
            fax: faxInput ? faxInput.value.trim() : '',
            invoice_title: invoiceTitleInput ? invoiceTitleInput.value.trim() : '',
            company_registered_address: companyRegisteredAddressInput ? companyRegisteredAddressInput.value.trim() : '',
            contact_person: contactPersonInput ? contactPersonInput.value.trim() : '',
            phone: phoneInput ? phoneInput.value.trim() : '',
            email: emailInput ? emailInput.value.trim() : '',
            address: addressInput ? addressInput.value.trim() : '',
            invoice_address: invoiceAddressInput ? invoiceAddressInput.value.trim() : '',
            shipping_address: shippingAddressInput ? shippingAddressInput.value.trim() : '',
            sales_contact_person: salesContactPersonInput ? salesContactPersonInput.value.trim() : '',
            sales_contact_extension: salesContactExtensionInput ? salesContactExtensionInput.value.trim() : '',
            sales_contact_mobile: salesContactMobileInput ? salesContactMobileInput.value.trim() : '',
            sales_contact_email: salesContactEmailInput ? salesContactEmailInput.value.trim() : '',
            finance_contact_person: financeContactPersonInput ? financeContactPersonInput.value.trim() : '',
            finance_contact_extension: financeContactExtensionInput ? financeContactExtensionInput.value.trim() : '',
            finance_contact_mobile: financeContactMobileInput ? financeContactMobileInput.value.trim() : '',
            finance_contact_email: financeContactEmailInput ? financeContactEmailInput.value.trim() : '',
            billing_day: billingDaySelect ? billingDaySelect.value : '',
            reconciliation_day: reconciliationDaySelect ? reconciliationDaySelect.value : '',
            payment_method: paymentMethodSelect ? paymentMethodSelect.value : '',
            minimum_order_amount: minimumOrderAmountInput ? minimumOrderAmountInput.value.trim() : '',
            weight_tolerance_percentage: weightTolerancePercentageInput ? weightTolerancePercentageInput.value.trim() : '',
            tax_id: taxIdInput ? taxIdInput.value.trim() : '',
            invoice_attachment_path: invoiceAttachmentPathInput ? invoiceAttachmentPathInput.value.trim() : '',
            remove_invoice_attachment: removeInvoiceAttachmentInput ? removeInvoiceAttachmentInput.value : '0',
            notes: notesTextarea ? notesTextarea.value.trim() : '',
        };
    }

    
function setFieldValue(name, value, form = modalForm) {
            if (!form) return;
            const field = form.querySelector(`[name="${name}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = !!value;
                } else {
                    field.value = value ?? '';
                }
            } else {
                console.warn(`customers: 欄位不存在 - ${name}`);
            }
        }

        function formatWithTooltip(value, maxLength = 50) {
            if (value === null || value === undefined) {
                return '-';
            }

            const trimmed = value.toString().trim();
            if (trimmed === '') {
                return '-';
            }

            if (trimmed.length <= maxLength) {
                return escapeHtml(trimmed);
            }

            const truncated = `${trimmed.slice(0, maxLength - 1)}…`;
            return `<span title="${escapeHtml(trimmed)}">${escapeHtml(truncated)}</span>`;
        }

        function formatDateTime(value) {
            if (!value) {
                return '-';
            }

            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return escapeHtml(value);
            }

            return escapeHtml(date.toLocaleString('zh-TW', { hour12: false }));
        }

        function formatBillingDay(value) {
            if (value === null || value === undefined || value === '') {
                return '-';
            }

            const numeric = Number.parseInt(value, 10);
            if (!Number.isFinite(numeric)) {
                return '-';
            }

            return escapeHtml(`${numeric} 日`);
        }

        function formatNotes(value) {
            return formatWithTooltip(value, 60);
        }

        function formatCurrency(value) {
            if (value === null || value === undefined || value === '') {
                return '0.00';
            }
            return Number(value).toLocaleString('zh-TW', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        function formatPercentage(value, fallback = '3%') {
            if (value === null || value === undefined || value === '') {
                return fallback;
            }

            const numeric = Number(value);
            if (!Number.isFinite(numeric)) {
                return fallback;
            }

            return `${numeric.toLocaleString('zh-TW', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            })}%`;
        }

        function renderCustomerToolAnalysis(analysis) {
            if (!customerToolAnalysisContainer) {
                return;
            }

            if (!analysis) {
                customerToolAnalysisContainer.classList.add('text-muted');
                customerToolAnalysisContainer.innerHTML = '儲存客戶後，這裡會顯示載具紀錄與遺留分析。';
                return;
            }

            const outstandingRecords = Array.isArray(analysis.outstanding_records)
                ? analysis.outstanding_records.filter((record) =>
                    Number(record.incoming_quantity || 0) > 0 || Number(record.returned_quantity || 0) > 0
                )
                : [];

            customerToolAnalysisContainer.classList.remove('text-muted');
            customerToolAnalysisContainer.innerHTML = `
                <div class="detail-grid" style="margin-bottom: 0.75rem;">
                    <div class="detail-item">
                        <div class="detail-label">進場載具紀錄</div>
                        <div class="detail-value">${escapeHtml(String(analysis.incoming_total_quantity || 0))} 個</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">歷史已歸還</div>
                        <div class="detail-value">${escapeHtml(String(analysis.returned_total_quantity || 0))} 個</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">可能仍留廠</div>
                        <div class="detail-value ${Number(analysis.outstanding_total_quantity || 0) > 0 ? 'text-danger' : 'text-success'}">${escapeHtml(String(analysis.outstanding_total_quantity || 0))} 個</div>
                    </div>
                    <div class="detail-item full-width">
                        <div class="detail-label">分析口徑</div>
                        <div class="detail-value">${escapeHtml(analysis.basis_note || '-')}</div>
                    </div>
                </div>
                ${outstandingRecords.length > 0 ? `
                <div class="table-responsive">
                    <table class="data-table compact">
                        <thead>
                            <tr>
                                <th>載具名稱</th>
                                <th>類型</th>
                                <th>進場</th>
                                <th>已歸還</th>
                                <th>可能留廠</th>
                                <th>狀態</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${outstandingRecords.slice(0, 10).map((record) => `
                            <tr>
                                <td>${escapeHtml(record.tool_name || '-')}</td>
                                <td>${escapeHtml(record.tool_type || '-')}</td>
                                <td class="text-right">${escapeHtml(String(record.incoming_quantity || 0))}</td>
                                <td class="text-right">${escapeHtml(String(record.returned_quantity || 0))}</td>
                                <td class="text-right ${Number(record.outstanding_quantity || 0) > 0 ? 'text-danger' : ''}">${escapeHtml(String(record.outstanding_quantity || 0))}</td>
                                <td>${escapeHtml(record.status_label || '-')}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : '<div class="text-muted">目前沒有可分析的客戶載具進出紀錄。</div>'}
            `;
        }

        // Modal 內部錯誤訊息顯示
        function showModalAlert(type, message, autoHide = true) {
            if (!modalAlertBox) {
                // 如果 modal alert 不存在,fallback 到頁面 alert
                showAlert(type, message);
                return;
            }

            modalAlertBox.textContent = message;
            modalAlertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
            modalAlertBox.classList.add(type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'error');

            // 自動隱藏 (成功訊息 3 秒,錯誤訊息不自動隱藏)
            if (autoHide && type === 'success') {
                setTimeout(() => {
                    hideModalAlert();
                }, 3000);
            }

            // 滾動到 modal 頂部,確保用戶看到訊息
            const modalWindow = modalOverlay ? modalOverlay.querySelector('.modal-window') : null;
            if (modalWindow) {
                modalWindow.scrollTop = 0;
            }
        }

        function hideModalAlert() {
            if (!modalAlertBox) {
                return;
            }

            modalAlertBox.classList.add('hidden');
            modalAlertBox.textContent = '';
            modalAlertBox.classList.remove('success', 'error', 'warning', 'info');
        }

        function showAlert(type, message) {
            if (!alertBox) {
                return;
            }

            alertBox.textContent = message;
            alertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
            alertBox.classList.add(
                type === 'success' ? 'success'
                : type === 'warning' ? 'warning'
                : type === 'info' ? 'info'
                : 'error'
            );
        }

        function hideAlert() {
            if (!alertBox) {
                return;
            }

            alertBox.textContent = '';
            alertBox.classList.add('hidden');
            alertBox.classList.remove('success', 'error', 'warning', 'info');
        }

        function setFilterDrawerOpen(isOpen) {
            const controller = window.ModuleRenderer?.getFilterDrawerController?.('customers', moduleRoot);
            if (isOpen) controller?.open();
            else controller?.close();
        }

        function openFilterDrawer() {
            setFilterDrawerOpen(true);
        }

        function closeFilterDrawer() {
            setFilterDrawerOpen(false);
        }

        function updateFilterSummary() {
            window.ModuleRenderer?.getFilterDrawerController?.('customers', moduleRoot)?.updateSummary();
        }

        function updateSortIndicators() {
            if (sortableHeaders.length === 0) {
                return;
            }

            sortableHeaders.forEach((header) => {
                header.classList.remove('sort-asc', 'sort-desc');
                const icon = header.querySelector('i.fas');
                if (icon) {
                    icon.classList.remove('fa-sort-up', 'fa-sort-down');
                    if (!icon.classList.contains('fa-sort')) {
                        icon.classList.add('fa-sort');
                    }
                }
            });

            if (!state.sortField) {
                return;
            }

            const activeHeader = sortableHeaders.find((header) => header.getAttribute('data-sort') === state.sortField);
            if (!activeHeader) {
                return;
            }

            activeHeader.classList.add(state.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            const activeIcon = activeHeader.querySelector('i.fas');
            if (activeIcon) {
                activeIcon.classList.remove('fa-sort');
                activeIcon.classList.add(state.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
            }
        }

        const defaultDescColumns = new Set(['created_at', 'updated_at']);

        function toggleSortForHeader(header) {
            const sortField = header.getAttribute('data-sort');
            if (!sortField) {
                return;
            }

            if (state.sortField === sortField) {
                state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortField = sortField;
                state.sortDirection = defaultDescColumns.has(sortField) ? 'desc' : 'asc';
            }

            updateSortIndicators();
            loadCustomers(1);
        }

        sortableHeaders.forEach((header) => {
            header.setAttribute('role', 'button');
            header.tabIndex = 0;
            header.addEventListener('click', () => toggleSortForHeader(header));
            header.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleSortForHeader(header);
                }
            });
        });

        function renderLoadingRow() {
            if (!tableBody) {
                return;
            }

            tableBody.innerHTML = `<tr><td colspan="${Number(totalColumns)}" class="text-center">資料載入中...</td></tr>`;
        }

        function renderEmptyState() {
            if (!tableBody) {
                return;
            }

            tableBody.innerHTML = `<tr><td colspan="${Number(totalColumns)}" class="text-center">尚無符合條件的資料。</td></tr>`;
            selectedCustomerIds.clear();
            updateSelectionUI();
        }

        function getVisibleCustomers() {
            return Array.from(customersCache.values());
        }

        function valueOrDash(value) {
            if (value === null || value === undefined || value === '') {
                return '-';
            }
            return escapeHtml(value);
        }

        function plainStatus(customer) {
            return customer && customer.is_active !== 0 && customer.is_active !== '0' ? '啟用' : '已停用';
        }

        function printWindowDocument(html, title) {
            const printWindow = window.open('', '_blank', 'width=1100,height=800');
            if (!printWindow) {
                showAlert('error', '無法開啟列印視窗，請檢查瀏覽器是否封鎖彈出視窗。');
                return;
            }

            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.document.title = title || '列印';
            printWindow.focus();
        }

        function buildPrintShell(title, bodyHtml, metaHtml = '') {
            const printedAt = new Date().toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });

            return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(title)}</title>
    <style>
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        body {
            margin: 24px;
            color: #222;
            font-family: "Microsoft JhengHei", "Noto Sans TC", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.55;
        }
        h1 {
            margin: 0 0 8px;
            font-size: 22px;
            text-align: center;
        }
        h2 {
            margin: 20px 0 8px;
            padding-bottom: 4px;
            border-bottom: 2px solid #334155;
            font-size: 15px;
        }
        .meta {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            margin: 0 0 16px;
            color: #555;
            flex-wrap: wrap;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th,
        td {
            border: 1px solid #888;
            padding: 7px 8px;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
        }
        th {
            background: #f0f3f7;
            font-weight: 700;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0;
            border-top: 1px solid #888;
            border-left: 1px solid #888;
        }
        .detail-item {
            display: grid;
            grid-template-columns: 118px 1fr;
            min-height: 34px;
            border-right: 1px solid #888;
            border-bottom: 1px solid #888;
        }
        .detail-label {
            padding: 7px 8px;
            background: #f0f3f7;
            font-weight: 700;
        }
        .detail-value {
            padding: 7px 8px;
            white-space: pre-wrap;
            word-break: break-word;
        }
        .full-width {
            grid-column: 1 / -1;
        }
        .empty {
            padding: 32px;
            text-align: center;
            color: #777;
            border: 1px solid #aaa;
        }
        .print-actions {
            position: fixed;
            top: 16px;
            right: 16px;
            display: flex;
            gap: 8px;
        }
        .print-actions button {
            border: 0;
            border-radius: 4px;
            padding: 8px 14px;
            cursor: pointer;
            color: #fff;
            background: #2563eb;
        }
        .print-actions button.secondary {
            background: #64748b;
        }
        @media print {
            body { margin: 12mm; }
            .print-actions { display: none; }
            th,
            .detail-label {
                background: #f0f3f7 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .detail-grid {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="print-actions">
        <button type="button" onclick="window.print()">列印</button>
        <button type="button" class="secondary" onclick="window.close()">關閉</button>
    </div>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">
        <span>列印時間：${escapeHtml(printedAt)}</span>
        ${metaHtml}
    </div>
    ${bodyHtml}
</body>
</html>`;
        }

        function buildCustomerListPrintDocument(customers) {
            const { keyword } = collectFilterValues();
            const rows = customers.map((customer, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${valueOrDash(customer.customer_number)}</td>
                    <td>${valueOrDash(customer.name)}</td>
                    <td>${escapeHtml(plainStatus(customer))}</td>
                    <td>${valueOrDash(customer.contact_person)}</td>
                    <td>${valueOrDash(customer.phone)}</td>
                    <td>${valueOrDash(customer.fax)}</td>
                    <td>${valueOrDash(customer.email)}</td>
                    <td>${valueOrDash(customer.tax_id)}</td>
                    <td>${formatBillingDay(customer.billing_day)}</td>
                    <td>${valueOrDash(customer.payment_method)}</td>
                    <td>${formatCurrency(customer.minimum_order_amount)}</td>
                    <td>${escapeHtml(formatPercentage(customer.weight_tolerance_percentage))}</td>
                    <td>${valueOrDash(customer.address)}</td>
                </tr>
            `).join('');

            const bodyHtml = customers.length === 0
                ? '<div class="empty">目前沒有可列印的客戶資料。</div>'
                : `<table>
                    <thead>
                        <tr>
                            <th style="width: 44px;">#</th>
                            <th>客戶編號</th>
                            <th>客戶名稱</th>
                            <th>狀態</th>
                            <th>聯絡人</th>
                            <th>電話</th>
                            <th>傳真</th>
                            <th>Email</th>
                            <th>統一編號</th>
                            <th>結帳日</th>
                            <th>付款方式</th>
                            <th>最低委託額度</th>
                            <th>重量公差</th>
                            <th>地址</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>`;

            return buildPrintShell('客戶基本資料', bodyHtml, `
                <span>篩選：${keyword ? escapeHtml(keyword) : '全部'}</span>
                <span>本頁筆數：${customers.length}</span>
            `);
        }

        function renderDetailSection(title, fields) {
            const items = fields.map((field) => `
                <div class="detail-item${field.fullWidth ? ' full-width' : ''}">
                    <div class="detail-label">${escapeHtml(field.label)}</div>
                    <div class="detail-value">${field.value}</div>
                </div>
            `).join('');

            return `<h2>${escapeHtml(title)}</h2><div class="detail-grid">${items}</div>`;
        }

        function buildCustomerDetailPrintDocument(customer) {
            const statusText = plainStatus(customer);
            const title = `客戶詳細資料 - ${customer.name || customer.customer_number || ''}`;
            const customerToolAnalysis = customer.customer_tool_analysis || null;
            const outstandingRecords = Array.isArray(customerToolAnalysis?.outstanding_records)
                ? customerToolAnalysis.outstanding_records.filter((record) =>
                    Number(record.incoming_quantity || 0) > 0 || Number(record.returned_quantity || 0) > 0
                )
                : [];
            const bodyHtml = [
                renderDetailSection('基本資訊', [
                    { label: '客戶編號', value: valueOrDash(customer.customer_number) },
                    { label: '客戶名稱', value: valueOrDash(customer.name) },
                    { label: '狀態', value: escapeHtml(statusText) },
                    { label: '商品別', value: valueOrDash(customer.product_category) },
                    { label: '公司網址', value: valueOrDash(customer.website), fullWidth: true },
                ]),
                renderDetailSection('聯絡與地址', [
                    { label: '聯絡人', value: valueOrDash(customer.contact_person) },
                    { label: '聯絡電話', value: valueOrDash(customer.phone) },
                    { label: '傳真', value: valueOrDash(customer.fax) },
                    { label: '電子郵件', value: valueOrDash(customer.email) },
                    { label: '公司登記地址', value: valueOrDash(customer.company_registered_address), fullWidth: true },
                    { label: '公司營業住址', value: valueOrDash(customer.address), fullWidth: true },
                    { label: '發票寄送地址', value: valueOrDash(customer.invoice_address), fullWidth: true },
                    { label: '收/送貨地址', value: valueOrDash(customer.shipping_address), fullWidth: true },
                ]),
                renderDetailSection('業務聯絡', [
                    { label: '聯絡人', value: valueOrDash(customer.sales_contact_person) },
                    { label: '分機', value: valueOrDash(customer.sales_contact_extension) },
                    { label: '手機', value: valueOrDash(customer.sales_contact_mobile) },
                    { label: 'Email', value: valueOrDash(customer.sales_contact_email) },
                ]),
                renderDetailSection('財務資訊', [
                    { label: '財務聯絡人', value: valueOrDash(customer.finance_contact_person) },
                    { label: '財務分機', value: valueOrDash(customer.finance_contact_extension) },
                    { label: '財務手機', value: valueOrDash(customer.finance_contact_mobile) },
                    { label: '財務 Email', value: valueOrDash(customer.finance_contact_email) },
                    { label: '結帳日', value: formatBillingDay(customer.billing_day) },
                    { label: '對帳日', value: formatBillingDay(customer.reconciliation_day) },
                    { label: '發票抬頭', value: valueOrDash(customer.invoice_title) },
                    { label: '統一編號', value: valueOrDash(customer.tax_id) },
                    { label: '付款方式', value: valueOrDash(customer.payment_method) },
                    { label: '最低委託額度', value: formatCurrency(customer.minimum_order_amount) },
                    { label: '重量公差', value: escapeHtml(formatPercentage(customer.weight_tolerance_percentage)) },
                    { label: '發票印章附件', value: valueOrDash(customer.invoice_attachment_path) },
                ]),
                renderDetailSection('其他資訊', [
                    { label: '備註', value: valueOrDash(customer.notes), fullWidth: true },
                    { label: '建立時間', value: formatDateTime(customer.created_at) },
                    { label: '更新時間', value: formatDateTime(customer.updated_at) },
                ]),
                customerToolAnalysis ? renderDetailSection('客戶載具紀錄與遺留分析', [
                    { label: '進場載具紀錄', value: `${escapeHtml(String(customerToolAnalysis.incoming_total_quantity || 0))} 個` },
                    { label: '歷史已歸還', value: `${escapeHtml(String(customerToolAnalysis.returned_total_quantity || 0))} 個` },
                    { label: '可能仍留廠', value: `${escapeHtml(String(customerToolAnalysis.outstanding_total_quantity || 0))} 個` },
                    { label: '分析口徑', value: valueOrDash(customerToolAnalysis.basis_note), fullWidth: true },
                    { label: '遺留摘要', value: outstandingRecords.length > 0 ? escapeHtml(outstandingRecords.slice(0, 6).map((record) => `${record.tool_name || '-'}:${record.outstanding_quantity || 0}`).join('、')) : '目前沒有可分析的載具進出紀錄', fullWidth: true },
                ]) : '',
            ].join('');

            return buildPrintShell(title, bodyHtml, `
                <span>客戶編號：${valueOrDash(customer.customer_number)}</span>
                <span>狀態：${escapeHtml(statusText)}</span>
            `);
        }

        function handlePrintList() {
            printWindowDocument(
                buildCustomerListPrintDocument(getVisibleCustomers()),
                '客戶基本資料列印'
            );
        }

        function updateSelectionUI() {
            if (!selectAllCheckbox || !tableBody) {
                return;
            }

            const checkboxes = Array.from(tableBody.querySelectorAll('input[data-action="select-row"]'));
            if (checkboxes.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
                return;
            }

            const checkedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
            selectAllCheckbox.checked = checkedCount === checkboxes.length;
            selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        }

        function pruneSelectionToVisibleRows(rows) {
            const visibleIds = new Set((rows || []).map((customer) => Number(customer.id)));
            Array.from(selectedCustomerIds).forEach((id) => {
                if (!visibleIds.has(id)) {
                    selectedCustomerIds.delete(id);
                }
            });
        }

        function handlePrintSelectedList() {
            const selectedCustomers = Array.from(selectedCustomerIds)
                .map((id) => customersCache.get(id))
                .filter(Boolean);

            if (selectedCustomers.length === 0) {
                showAlert('error', '請先勾選要列印的客戶資料。');
                updateSelectionUI();
                return;
            }

            printWindowDocument(
                buildCustomerListPrintDocument(selectedCustomers),
                '客戶基本資料選取列印'
            );
        }

        function handleBatchPrint() {
            if (selectedCustomerIds.size > 0) {
                handlePrintSelectedList();
                return;
            }
            handlePrintList();
        }

        function renderTableRows(rows) {
            if (!tableBody) {
                return;
            }

            if (!Array.isArray(rows) || rows.length === 0) {
                renderEmptyState();
                return;
            }

            pruneSelectionToVisibleRows(rows);

            const html = rows.map((customer, index) => {
                customersCache.set(customer.id, customer);
                const isChecked = selectedCustomerIds.has(Number(customer.id)) ? 'checked' : '';

                const isActive = customer.is_active !== 0 && customer.is_active !== '0';
                const statusBadge = isActive
                    ? '<span class="status-badge active">啟用</span>'
                    : '<span class="status-badge inactive">已停用</span>';
                const toggleIcon = isActive ? 'fa-ban' : 'fa-check-circle';
                const toggleTitle = isActive ? '停用' : '啟用';
                const toggleClass = isActive ? 'warning' : 'success';
                const nameDisplay = isActive
                    ? escapeHtml(customer.name)
                    : `${escapeHtml(customer.name)} <span class="text-muted">(已停用)</span>`;
                const renderedName = customer.name ? nameDisplay : '-';

                return `
                    <tr data-id="${customer.id}" class="${isActive ? '' : 'row-inactive'}">
                        <td class="checkbox-col"><input type="checkbox" data-action="select-row" aria-label="選擇客戶 ${escapeHtml(customer.customer_number || customer.id)}" ${isChecked}></td>
                        <td>${customer.customer_number ? escapeHtml(customer.customer_number) : '-'}</td>
                        <td>${renderedName}</td>
                        <td>${statusBadge}</td>
                        <td>${customer.contact_person ? escapeHtml(customer.contact_person) : '-'}</td>
                        <td>${customer.phone ? escapeHtml(customer.phone) : '-'}</td>
                        <td>${customer.fax ? escapeHtml(customer.fax) : '-'}</td>
                        <td>${customer.email ? escapeHtml(customer.email) : '-'}</td>
                        <td>${formatWithTooltip(customer.address)}</td>
                        <td>${formatBillingDay(customer.billing_day)}</td>
                        <td>${customer.payment_method ? escapeHtml(customer.payment_method) : '-'}</td>
                        <td>${formatCurrency(customer.minimum_order_amount)}</td>
                        <td>${escapeHtml(formatPercentage(customer.weight_tolerance_percentage))}</td>
                        <td>${customer.tax_id ? escapeHtml(customer.tax_id) : '-'}</td>
                        <td>${formatNotes(customer.notes)}</td>
                        <td>${formatDateTime(customer.created_at)}</td>
                        <td>${formatDateTime(customer.updated_at)}</td>
                        <td>
                            <button type="button" class="btn text" data-action="print-detail" title="列印詳細資料"><i class="fas fa-print"></i></button>
                            <button type="button" class="btn text" data-action="edit" title="編輯"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn text ${toggleClass}" data-action="toggle-active" title="${toggleTitle}"><i class="fas ${toggleIcon}"></i></button>
                            <button type="button" class="btn text danger" data-action="delete" title="刪除"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;

            // 更新欄位可見性
            if (window.customerColumnManager) {
                window.customerColumnManager.onTableUpdated();
            }

            updateSelectionUI();
        }

        function renderPagination() {
            if (!paginationContainer) {
                return;
            }

            if (state.totalPages <= 1) {
                paginationContainer.innerHTML = '';
                return;
            }

            const prevDisabled = state.page <= 1 ? 'disabled' : '';
            const nextDisabled = state.page >= state.totalPages ? 'disabled' : '';

            paginationContainer.innerHTML = `
                <button type="button" data-page="${state.page - 1}" ${prevDisabled}>上一頁</button>
                <span>第 ${state.page} / ${state.totalPages} 頁，共 ${state.total} 筆資料</span>
                <button type="button" data-page="${state.page + 1}" ${nextDisabled}>下一頁</button>
            `;
        }

        function collectFilterValues() {
            if (!filterForm) {
                return { keyword: '', perPage: state.perPage };
            }

            const formData = new FormData(filterForm);
            const keywordValue = formData.get('keyword');
            const perPageValue = formData.get('perPage');

            const keyword = keywordValue ? keywordValue.toString().trim() : '';
            const perPage = perPageValue ? Number.parseInt(perPageValue.toString(), 10) : Number.NaN;

            return {
                keyword,
                perPage: Number.isFinite(perPage) && perPage > 0 ? perPage : 10,
            };
        }

        async function loadCustomers(page = 1) {
            hideAlert();
            renderLoadingRow();

            const { keyword, perPage } = collectFilterValues();

            state.page = Math.max(1, page);
            state.perPage = perPage;

            const params = new URLSearchParams();
            params.set('page', String(state.page));
            params.set('perPage', String(state.perPage));
            if (keyword !== '') {
                params.set('keyword', keyword);
            }
            if (state.sortField) {
                params.set('sortField', state.sortField);
                params.set('sortDirection', state.sortDirection);
            }

            try {
                const response = await fetch(`api/customers/index.php?${params.toString()}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`載入失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || '載入失敗，請稍後再試。');
                }

                const customers = Array.isArray(result.data) ? result.data : [];
                customersCache.clear();

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || customers.length;
                } else {
                    state.totalPages = 1;
                    state.total = customers.length;
                }

                if (customers.length === 0) {
                    renderEmptyState();
                } else {
                    renderTableRows(customers);
                }

                renderPagination();
                updateSortIndicators();
                updateFilterSummary();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入失敗，請稍後再試。');
                renderEmptyState();
                updateFilterSummary();
            }
        }

        function getFormSnapshot() {
            if (!modalForm) {
                return {};
            }

            const snapshot = { ...collectCustomerFormValues() };
            if (invoiceStampFileInput && invoiceStampFileInput.files && invoiceStampFileInput.files[0]) {
                snapshot.invoice_stamp_file_name = invoiceStampFileInput.files[0].name;
            } else {
                snapshot.invoice_stamp_file_name = '';
            }
            return snapshot;
        }

        function setFormSnapshot() {
            state.formSnapshot = getFormSnapshot();
            isFormDirty = false;
        }

        function hasUnsavedChanges() {
            if (!modalForm || !state.formSnapshot) {
                return false;
            }

            const current = getFormSnapshot();
            return Object.keys(state.formSnapshot).some((key) => state.formSnapshot ? state.formSnapshot[key] !== current[key] : false);
        }

        function updateDirtyState() {
            isFormDirty = hasUnsavedChanges();
        }

        function populateForm(customer) {
            if (!modalForm) {
                return;
            }

            if (customerNumberInput) customerNumberInput.value = customer.customer_number || '';
            if (nameInput) nameInput.value = customer.name || '';
            if (isActiveSelect) isActiveSelect.value = customer.is_active !== undefined && customer.is_active !== null ? String(customer.is_active) : '1';
            if (productCategoryInput) productCategoryInput.value = customer.product_category || '';
            if (websiteInput) websiteInput.value = customer.website || '';
            if (faxInput) faxInput.value = customer.fax || '';
            if (invoiceTitleInput) invoiceTitleInput.value = customer.invoice_title || '';
            if (companyRegisteredAddressInput) companyRegisteredAddressInput.value = customer.company_registered_address || '';
            if (contactPersonInput) contactPersonInput.value = customer.contact_person || '';
            if (phoneInput) phoneInput.value = customer.phone || '';
            if (emailInput) emailInput.value = customer.email || '';
            if (addressInput) addressInput.value = customer.address || '';
            if (invoiceAddressInput) invoiceAddressInput.value = customer.invoice_address || '';
            if (shippingAddressInput) shippingAddressInput.value = customer.shipping_address || '';
            if (salesContactPersonInput) salesContactPersonInput.value = customer.sales_contact_person || '';
            if (salesContactExtensionInput) salesContactExtensionInput.value = customer.sales_contact_extension || '';
            if (salesContactMobileInput) salesContactMobileInput.value = customer.sales_contact_mobile || '';
            if (salesContactEmailInput) salesContactEmailInput.value = customer.sales_contact_email || '';
            if (financeContactPersonInput) financeContactPersonInput.value = customer.finance_contact_person || '';
            if (financeContactExtensionInput) financeContactExtensionInput.value = customer.finance_contact_extension || '';
            if (financeContactMobileInput) financeContactMobileInput.value = customer.finance_contact_mobile || '';
            if (financeContactEmailInput) financeContactEmailInput.value = customer.finance_contact_email || '';
            if (billingDaySelect) billingDaySelect.value = customer.billing_day !== null && customer.billing_day !== undefined ? String(customer.billing_day) : '';
            if (reconciliationDaySelect) reconciliationDaySelect.value = customer.reconciliation_day !== null && customer.reconciliation_day !== undefined ? String(customer.reconciliation_day) : '';
            if (paymentMethodSelect) paymentMethodSelect.value = customer.payment_method || '';
            if (minimumOrderAmountInput) minimumOrderAmountInput.value = customer.minimum_order_amount !== null && customer.minimum_order_amount !== undefined ? customer.minimum_order_amount : '';
            if (weightTolerancePercentageInput) weightTolerancePercentageInput.value = customer.weight_tolerance_percentage !== null && customer.weight_tolerance_percentage !== undefined ? customer.weight_tolerance_percentage : '3.00';
            if (taxIdInput) taxIdInput.value = customer.tax_id || '';
            if (invoiceAttachmentPathInput) invoiceAttachmentPathInput.value = customer.invoice_attachment_path || '';
            if (removeInvoiceAttachmentInput) removeInvoiceAttachmentInput.value = '0';
            if (invoiceStampFileInput) {
                invoiceStampFileInput.value = '';
            }
            updateInvoiceStampPreviewFromPath(customer.invoice_attachment_path || '');
            if (notesTextarea) notesTextarea.value = customer.notes || '';
            renderCustomerToolAnalysis(customer.customer_tool_analysis || null);
        }

        function openModal(mode, customer = null) {
            if (!modalOverlay || !modalForm) {
                return;
            }

            modalForm.reset();
            state.currentEditingId = null;
            isFormDirty = false;
            state.formSnapshot = null;
            if (invoiceAttachmentPathInput) {
                invoiceAttachmentPathInput.value = '';
            }
            if (removeInvoiceAttachmentInput) {
                removeInvoiceAttachmentInput.value = '0';
            }
            resetInvoiceStampPreview();
            if (invoiceStampFileInput) {
                invoiceStampFileInput.value = '';
            }
            renderCustomerToolAnalysis(null);

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯客戶基本資料' : '新增客戶基本資料';
            }

            if (mode === 'edit' && customer) {
                state.currentEditingId = Number(customer.id);
                populateForm(customer);
            }

            modalOverlay.classList.remove('hidden');
            setFormSnapshot();

            if (nameInput) {
                nameInput.focus();
            }
        }

        function closeModal(force = false) {
            if (!modalOverlay || modalOverlay.classList.contains('hidden')) {
                return;
            }

            if (!force && isFormDirty && hasUnsavedChanges()) {
                const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
                if (!confirmed) {
                    return;
                }
            }

            if (modalForm) {
                modalForm.reset();
            }
            if (invoiceAttachmentPathInput) {
                invoiceAttachmentPathInput.value = '';
            }
            if (removeInvoiceAttachmentInput) {
                removeInvoiceAttachmentInput.value = '0';
            }
            if (invoiceStampFileInput) {
                invoiceStampFileInput.value = '';
            }
            resetInvoiceStampPreview();
            renderCustomerToolAnalysis(null);
            hideModalAlert(); // 關閉 modal 時清除錯誤訊息
            modalOverlay.classList.add('hidden');
            state.currentEditingId = null;
            state.formSnapshot = null;
            isFormDirty = false;
        }

        async function openEditModal(id) {
            const cached = customersCache.get(id);
            if (cached && Object.prototype.hasOwnProperty.call(cached, 'customer_tool_analysis')) {
                openModal('edit', cached);
                return;
            }

            try {
                const response = await fetch(`api/customers/show.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`讀取客戶資料失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error(result.message || '讀取客戶資料失敗。');
                }

                customersCache.set(result.data.id, result.data);
                openModal('edit', result.data);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '無法讀取客戶資料。');
            }
        }

        function handleModuleContext(nextContext) {
            const rawCustomerId = nextContext?.customerId ?? nextContext?.highlightId ?? null;
            const customerId = Number.parseInt(rawCustomerId, 10);
            if (!Number.isInteger(customerId) || customerId <= 0) {
                return;
            }

            hideAlert();
            openEditModal(customerId);
        }

        async function fetchCustomerDetail(id) {
            const response = await fetch(`api/customers/show.php?id=${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            const result = await response.json();
            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || `讀取客戶資料失敗（${response.status}）`);
            }

            customersCache.set(result.data.id, result.data);
            return result.data;
        }

        async function handlePrintCustomerDetail(id) {
            try {
                hideAlert();
                const customer = await fetchCustomerDetail(id);
                printWindowDocument(
                    buildCustomerDetailPrintDocument(customer),
                    `客戶詳細資料 - ${customer.name || customer.customer_number || id}`
                );
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '列印客戶詳細資料失敗。');
            }
        }

        async function toggleCustomerActive(id) {
            const customer = customersCache.get(id);
            const isActive = customer && (customer.is_active !== 0 && customer.is_active !== '0');
            const actionLabel = isActive ? '停用' : '啟用';
            const confirmed = await window.AppFeedback.confirm({ title: `${actionLabel}客戶`, message: `確認${actionLabel}此客戶？`, impact: '客戶後續接單可用狀態', danger: false });
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/customers/toggle_active.php?id=${id}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '操作失敗，請稍後再試。');
                }

                showAlert('success', result.message || `客戶已${actionLabel}。`);
                loadCustomers(state.page);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '操作失敗，請稍後再試。');
            }
        }

        async function deleteCustomer(id) {
            // 先查詢關聯資料統計
            try {
                const statsResponse = await fetch(`api/customers/stats.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                const statsResult = await statsResponse.json();
                if (!statsResponse.ok || !statsResult.success) {
                    throw new Error(statsResult.message || '無法取得客戶關聯資料。');
                }

                const { customer, stats, has_related_data } = statsResult.data;

                // 建立確認訊息
                let confirmMessage = `⚠️ 警告：您即將刪除客戶資料！\n\n`;
                confirmMessage += `客戶編號：${customer.customer_number}\n`;
                confirmMessage += `客戶名稱：${customer.name}\n\n`;

                if (has_related_data) {
                    confirmMessage += `🔗 此客戶有以下關聯資料：\n`;
                    confirmMessage += `   • 訂單：${stats.orders} 筆\n`;
                    confirmMessage += `   • 訂單品項：${stats.order_items} 筆\n`;
                    confirmMessage += `   • 工單：${stats.work_orders} 筆\n`;
                    confirmMessage += `   • 庫存品項：${stats.inventory_items} 筆\n\n`;
                    confirmMessage += `❌ 刪除後，上述關聯資料將無法正確顯示客戶資訊！\n\n`;
                    confirmMessage += `💡 建議：如果只是暫時不使用此客戶，請改用「停用」功能。\n\n`;
                }

                confirmMessage += `確定要永久刪除此客戶嗎？此操作無法復原！`;

                const confirmed = await window.AppFeedback.confirm({ title: '刪除客戶', message: confirmMessage, impact: '訂單、工單、庫存與出退貨歷史', guidance: '若只是暫時不使用，請取消並改用停用。' });
                if (!confirmed) {
                    return;
                }

                // 如果有關聯資料，再次確認
                if (has_related_data) {
                    const doubleConfirm = await window.AppFeedback.confirm({
                        title: '最後確認永久刪除',
                        message: `此客戶有 ${stats.orders} 筆訂單、${stats.work_orders} 筆工單等關聯資料。`,
                        impact: '刪除後這些紀錄將失去客戶資訊連結',
                        confirmLabel: '永久刪除'
                    });
                    if (!doubleConfirm) {
                        return;
                    }
                }

                // 執行刪除
                const response = await fetch(`api/customers/delete.php?id=${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '刪除失敗，請稍後再試。');
                }

                showAlert('success', result.message || '客戶資料已刪除。');
                state.total = Math.max(0, state.total - 1);
                const isLastItemOnPage = state.page > 1 && state.total <= state.perPage * (state.page - 1);
                const targetPage = isLastItemOnPage ? state.page - 1 : state.page;
                loadCustomers(targetPage);

                // 發送資料同步通知（含依賴模組）
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('customers', DataSync.EVENT_TYPES.DELETED, { id });
                }
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗，請稍後再試。');
            }
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (event) => {
                if (event.target === modalOverlay) {
                    closeModal();
                }
            });
        }

        if (modalCloseButton) {
            modalCloseButton.addEventListener('click', () => closeModal());
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => closeModal());
        }

        if (filterForm) {
            filterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                closeFilterDrawer();
                loadCustomers(1);
            });
        }

        if (resetFilterButton && filterForm) {
            resetFilterButton.addEventListener('click', () => {
                filterForm.reset();
                if ('perPage' in filterForm.elements) {
                    filterForm.elements.perPage.value = '10';
                }
                closeFilterDrawer();
                updateFilterSummary();
                loadCustomers(1);
            });
        }

        if (headerCreateButton) {
            headerCreateButton.addEventListener('click', () => {
                hideAlert();
                openModal('create');
            });
        }

        if (batchPrintButton) {
            batchPrintButton.addEventListener('click', handleBatchPrint);
        }

        if (batchExportButton) {
            batchExportButton.addEventListener('click', async () => {
                try {
                    const filterFormData = new FormData(filterForm);
                    const keyword = filterFormData.get('keyword') || '';

                    const params = new URLSearchParams();
                    if (keyword !== '') {
                        params.set('keyword', keyword);
                    }

                    const queryString = params.toString();
                    const url = `api/customers/export.php${queryString ? '?' + queryString : ''}`;

                    showAlert('info', '正在準備匯出檔案...');

                    const response = await fetch(url, {
                        method: 'GET',
                        credentials: 'include',
                    });

                    if (!response.ok) {
                        throw new Error('匯出失敗');
                    }

                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;

                    const contentDisposition = response.headers.get('Content-Disposition');
                    let filename = '客戶資料.xlsx';
                    if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i);
                        if (filenameMatch && filenameMatch[1]) {
                            filename = decodeURIComponent(filenameMatch[1]);
                        }
                    }

                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(downloadUrl);
                    document.body.removeChild(a);

                    showAlert('success', '客戶資料已匯出。');
                } catch (error) {
                    console.error(error);
                    showAlert('error', error.message || '匯出失敗，請稍後再試。');
                }
            });
        }

        if (modalForm) {
            if (openInvoiceStampLink) {
                openInvoiceStampLink.addEventListener('click', (event) => {
                    if (openInvoiceStampLink.classList.contains('disabled') || !openInvoiceStampLink.href || openInvoiceStampLink.getAttribute('href') === '#') {
                        event.preventDefault();
                    }
                });
            }

            if (invoiceStampFileInput) {
                const maxInvoiceStampSize = 5 * 1024 * 1024; // 5 MB
                const allowedInvoiceStampTypes = new Set(['image/jpeg', 'image/png', 'image/gif']);

                invoiceStampFileInput.addEventListener('change', () => {
                    if (!invoiceStampFileInput.files || invoiceStampFileInput.files.length === 0) {
                        updateInvoiceStampPreviewFromPath(invoiceAttachmentPathInput ? invoiceAttachmentPathInput.value : '');
                        updateDirtyState();
                        return;
                    }

                    const file = invoiceStampFileInput.files[0];
                    if (file.size > maxInvoiceStampSize) {
                        showModalAlert('error', '發票印章附件大小不可超過 5 MB。', false);
                        invoiceStampFileInput.value = '';
                        updateInvoiceStampPreviewFromPath(invoiceAttachmentPathInput ? invoiceAttachmentPathInput.value : '');
                        updateDirtyState();
                        return;
                    }

                    if (!allowedInvoiceStampTypes.has(file.type)) {
                        showModalAlert('error', '發票印章附件僅支援 JPG、PNG 或 GIF 格式。', false);
                        invoiceStampFileInput.value = '';
                        updateInvoiceStampPreviewFromPath(invoiceAttachmentPathInput ? invoiceAttachmentPathInput.value : '');
                        updateDirtyState();
                        return;
                    }

                    if (removeInvoiceAttachmentInput) {
                        removeInvoiceAttachmentInput.value = '0';
                    }

                    updateInvoiceStampPreviewFromFile(file);
                    updateDirtyState();
                });
            }

            if (clearInvoiceStampButton) {
                clearInvoiceStampButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (invoiceStampFileInput) {
                        invoiceStampFileInput.value = '';
                    }
                    if (invoiceAttachmentPathInput) {
                        invoiceAttachmentPathInput.value = '';
                    }
                    if (removeInvoiceAttachmentInput) {
                        removeInvoiceAttachmentInput.value = '1';
                    }
                    resetInvoiceStampPreview();
                    updateDirtyState();
                });
            }

            // 複製公司登記住址按鈕
            if (modalForm) {
                const copyButtons = modalForm.querySelectorAll('[data-action="copy-registered-address"]');
                copyButtons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        const targetField = button.getAttribute('data-target');
                        const sourceValue = companyRegisteredAddressInput ? companyRegisteredAddressInput.value : '';

                        if (!targetField) {
                            return;
                        }

                        const targetElement = modalForm.querySelector(`[name="${targetField}"]`);
                        if (targetElement) {
                            targetElement.value = sourceValue;
                            // 觸發 input 事件以更新表單狀態
                            targetElement.dispatchEvent(new Event('input', { bubbles: true }));

                            // 顯示提示訊息
                            if (sourceValue.trim() !== '') {
                                showModalAlert('success', '已複製公司登記住址。', true);
                            } else {
                                showModalAlert('error', '公司登記住址為空，無法複製。', false);
                            }
                        }
                    });
                });
            }

            modalForm.addEventListener('input', updateDirtyState);
            modalForm.addEventListener('change', updateDirtyState);

            modalForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const values = collectCustomerFormValues();
                const customerNumber = values.customer_number;
                const name = values.name;

                if (customerNumberInput) {
                    customerNumberInput.value = customerNumber;
                }

                if (nameInput) {
                    nameInput.value = name;
                }

                if (customerNumber === '') {
                    showModalAlert('error', '請輸入客戶編號。', false);
                    customerNumberInput?.focus();
                    return;
                }

                if (name === '') {
                    showModalAlert('error', '請輸入客戶名稱。', false);
                    nameInput?.focus();
                    return;
                }

                hideModalAlert();

                const isEdit = state.currentEditingId !== null;
                const endpoint = isEdit ? `api/customers/update.php?id=${state.currentEditingId}` : 'api/customers/index.php';

                const formData = new FormData();
                Object.entries(values).forEach(([key, value]) => {
                    formData.append(key, value ?? '');
                });

                if (invoiceStampFileInput && invoiceStampFileInput.files && invoiceStampFileInput.files[0]) {
                    formData.append('invoice_stamp_file', invoiceStampFileInput.files[0]);
                }

                if (isEdit) {
                    formData.append('_method', 'PUT');
                }

                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                        },
                        body: formData,
                    });

                    const result = await response.json();
                    if (!response.ok || !result.success) {
                        const message = result && result.message ? result.message : '儲存失敗，請稍後再試。';
                        const errors = result && result.errors ? Object.values(result.errors).join('、') : '';
                        showModalAlert('error', `${message}${errors ? ` (${errors})` : ''}`, false);

                        // 如果有指定錯誤欄位,自動聚焦到該欄位
                        if (result.field && modalForm) {
                            const errorField = modalForm.querySelector(`[name="${result.field}"]`);
                            if (errorField) {
                                errorField.focus();
                                errorField.select();
                            }
                        }
                        return;
                    }

                    closeModal(true);
                    showAlert('success', isEdit ? '客戶資料已更新。' : '客戶資料已新增。');
                    loadCustomers(isEdit ? state.page : 1);

                    // 發送資料同步通知（含依賴模組）
                    if (typeof DataSync !== 'undefined') {
                        DataSync.notifyWithDependencies('customers', isEdit ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED, result.data);
                    }
                } catch (error) {
                    console.error(error);
                    showModalAlert('error', error.message || '儲存失敗，請稍後再試。', false);
                }
            });
        }

        if (tableBody) {
            tableBody.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const actionElement = target.closest('[data-action]');
                if (!actionElement) {
                    return;
                }

                const row = target.closest('tr[data-id]');
                if (!row) {
                    return;
                }

                const id = Number.parseInt(row.getAttribute('data-id') || '', 10);
                if (!Number.isInteger(id)) {
                    showAlert('error', '無法取得客戶編號。');
                    return;
                }

                if (actionElement.dataset.action === 'print-detail') {
                    handlePrintCustomerDetail(id);
                } else if (actionElement.dataset.action === 'edit') {
                    hideAlert();
                    openEditModal(id);
                } else if (actionElement.dataset.action === 'toggle-active') {
                    hideAlert();
                    toggleCustomerActive(id);
                } else if (actionElement.dataset.action === 'delete') {
                    hideAlert();
                    deleteCustomer(id);
                }
            });

            tableBody.addEventListener('change', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLInputElement) || target.dataset.action !== 'select-row') {
                    return;
                }

                const row = target.closest('tr[data-id]');
                const id = Number.parseInt(row ? row.getAttribute('data-id') || '' : '', 10);
                if (!Number.isInteger(id)) {
                    return;
                }

                if (target.checked) {
                    selectedCustomerIds.add(id);
                } else {
                    selectedCustomerIds.delete(id);
                }

                updateSelectionUI();
            });
        }

        if (selectAllCheckbox && tableBody) {
            selectAllCheckbox.addEventListener('change', () => {
                const shouldSelectAll = selectAllCheckbox.checked;
                const checkboxes = Array.from(tableBody.querySelectorAll('input[data-action="select-row"]'));
                checkboxes.forEach((checkbox) => {
                    checkbox.checked = shouldSelectAll;
                    const row = checkbox.closest('tr[data-id]');
                    const id = Number.parseInt(row ? row.getAttribute('data-id') || '' : '', 10);
                    if (!Number.isInteger(id)) {
                        return;
                    }

                    if (shouldSelectAll) {
                        selectedCustomerIds.add(id);
                    } else {
                        selectedCustomerIds.delete(id);
                    }
                });

                updateSelectionUI();
            });
        }

        if (paginationContainer) {
            paginationContainer.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const pageAttr = target.getAttribute('data-page');
                if (!pageAttr) {
                    return;
                }

                const nextPage = Number.parseInt(pageAttr, 10);
                if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage > state.totalPages) {
                    return;
                }

                loadCustomers(nextPage);
            });
        }

        container.addEventListener('module:context', (event) => {
            handleModuleContext(event?.detail?.context ?? null);
        });

        updateSortIndicators();
        loadCustomers(1);
        handleModuleContext(context);

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('customers', {
                onRefresh: () => loadCustomers(state.page),
                debounceMs: 300
            });
        }

        window.customersModule = {
            viewDetail: openEditModal
        };
    }

    window.initializeCustomersModule = initializeCustomersModule;
})();
