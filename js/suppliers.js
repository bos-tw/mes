/**
 * Suppliers Module
 * 供應商管理模組
 */
(function() {
    'use strict';

    function initializeSuppliersModule(container) {
        const moduleRoot = container.querySelector('[data-module="suppliers"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';
        // 欄位管理器由 column_manager.js 自動初始化，不需要手動呼叫

        const alertBox = moduleRoot.querySelector('[data-suppliers-alert]');
        const filterForm = moduleRoot.querySelector('[data-suppliers-filter]');
        const tableElement = moduleRoot.querySelector('[data-suppliers-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-suppliers-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-suppliers-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-suppliers-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-suppliers-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');
        const openFilterDrawerButton = moduleRoot.querySelector('[data-action="open-filter-drawer"]');
        const closeFilterDrawerButton = moduleRoot.querySelector('[data-action="close-filter-drawer"]');
        const filterDrawer = moduleRoot.querySelector('[data-suppliers-filter-drawer]');
        const filterOverlay = moduleRoot.querySelector('[data-suppliers-filter-overlay]');
        const filterSummary = moduleRoot.querySelector('[data-suppliers-filter-summary]');
        const filterCountBadge = moduleRoot.querySelector('[data-suppliers-filter-count]');

        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const batchPrintButton = moduleRoot.querySelector('.content-header [data-action="batch-print"]');
        const batchExportButton = moduleRoot.querySelector('.content-header [data-action="batch-export"]');
        const selectAllCheckbox = tableElement ? tableElement.querySelector('thead [data-action="select-all"]') : null;

        const supplierNumberInput = modalForm ? modalForm.querySelector('input[name="supplier_number"]') : null;
        const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
        const serviceTypeInput = modalForm ? modalForm.querySelector('input[name="service_type"]') : null;
        const supplierTypeInput = modalForm ? modalForm.querySelector('input[name="supplier_type"]') : null;
        const productCategoryInput = modalForm ? modalForm.querySelector('input[name="product_category"]') : null;
        const ownerInput = modalForm ? modalForm.querySelector('input[name="owner"]') : null;
        const contactPersonInput = modalForm ? modalForm.querySelector('input[name="contact_person"]') : null;
        const contactMobileInput = modalForm ? modalForm.querySelector('input[name="contact_mobile"]') : null;
        const phoneInput = modalForm ? modalForm.querySelector('input[name="phone"]') : null;
        const faxInput = modalForm ? modalForm.querySelector('input[name="fax"]') : null;
        const emailInput = modalForm ? modalForm.querySelector('input[name="email"]') : null;
        const taxIdInput = modalForm ? modalForm.querySelector('input[name="tax_id"]') : null;
        const addressInput = modalForm ? modalForm.querySelector('input[name="address"]') : null;
        const factoryAddressInput = modalForm ? modalForm.querySelector('input[name="factory_address"]') : null;
        const paymentMethodInput = modalForm ? modalForm.querySelector('input[name="payment_method"]') : null;
        const attachmentPathInput = modalForm ? modalForm.querySelector('input[name="attachment_path"]') : null;
        const attachmentFileInput = modalForm ? modalForm.querySelector('input[name="attachment_file"]') : null;
        const removeAttachmentInput = modalForm ? modalForm.querySelector('[data-remove-attachment]') : null;
        const attachmentPreview = modalForm ? modalForm.querySelector('[data-attachment-preview]') : null;
        const attachmentFilename = modalForm ? modalForm.querySelector('[data-attachment-filename]') : null;
        const openAttachmentLink = modalForm ? modalForm.querySelector('[data-action="open-attachment"]') : null;
        const clearAttachmentButton = modalForm ? modalForm.querySelector('[data-action="clear-attachment"]') : null;
        const notesTextarea = modalForm ? modalForm.querySelector('textarea[name="notes"]') : null;
        const bankAccountNameInput = modalForm ? modalForm.querySelector('input[name="bank_account_name"]') : null;
        const bankNameInput = modalForm ? modalForm.querySelector('input[name="bank_name"]') : null;
        const bankCodeInput = modalForm ? modalForm.querySelector('input[name="bank_code"]') : null;
        const bankBranchNameInput = modalForm ? modalForm.querySelector('input[name="bank_branch_name"]') : null;
        const bankBranchCodeInput = modalForm ? modalForm.querySelector('input[name="bank_branch_code"]') : null;
        const bankAccountNumberInput = modalForm ? modalForm.querySelector('input[name="bank_account_number"]') : null;

        const suppliersCache = new Map();
        const selectedSupplierIds = new Set();
        const sortableHeaders = tableElement ? Array.from(tableElement.querySelectorAll('th[data-sort]')) : [];
        const totalColumns = 14;
        const defaultDescColumns = new Set(['created_at', 'updated_at']);
        let attachmentObjectUrl = null;

        function revokeAttachmentObjectUrl() {
            if (attachmentObjectUrl) {
                URL.revokeObjectURL(attachmentObjectUrl);
                attachmentObjectUrl = null;
            }
        }

        function normalizeAttachmentPath(path) {
            if (!path) {
                return '';
            }
            const trimmed = path.trim();
            if (trimmed === '' || /^(?:https?:|data:|blob:)/i.test(trimmed)) {
                return trimmed;
            }
            return trimmed;
        }

        function updateAttachmentPreview(filename, url) {
            if (!attachmentPreview || !attachmentFilename || !openAttachmentLink) {
                return;
            }
            if (!filename) {
                attachmentPreview.classList.add('hidden');
                attachmentFilename.textContent = '';
                openAttachmentLink.href = '#';
                return;
            }
            attachmentFilename.textContent = filename;
            openAttachmentLink.href = url || '#';
            attachmentPreview.classList.remove('hidden');
        }

        function resetAttachmentPreview() {
            revokeAttachmentObjectUrl();
            updateAttachmentPreview('', '#');
        }

        function updateAttachmentPreviewFromPath(path) {
            revokeAttachmentObjectUrl();
            const normalized = normalizeAttachmentPath(path);
            if (!normalized) {
                resetAttachmentPreview();
                return;
            }
            const filename = normalized.split('/').pop() || '附件';
            updateAttachmentPreview(filename, normalized);
        }

        function updateAttachmentPreviewFromFile(file) {
            revokeAttachmentObjectUrl();
            attachmentObjectUrl = URL.createObjectURL(file);
            updateAttachmentPreview(file.name, attachmentObjectUrl);
        }

        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            currentEditingId: null,
            formSnapshot: null,
            sortField: 'created_at',
            sortDirection: 'desc',
        };

        let isFormDirty = false;

        function showModalAlert(type, message, autoHide = true) {
            if (!modalAlertBox) { showAlert(type, message); return; }
            modalAlertBox.textContent = message;
            modalAlertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
            modalAlertBox.classList.add(type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'error');
            if (autoHide && type === 'success') setTimeout(() => hideModalAlert(), 3000);
            const modalWindow = modalOverlay?.querySelector('.modal-window');
            if (modalWindow) modalWindow.scrollTop = 0;
        }

        function hideModalAlert() {
            if (!modalAlertBox) return;
            modalAlertBox.classList.add('hidden');
            modalAlertBox.textContent = '';
            modalAlertBox.classList.remove('success', 'error', 'warning', 'info');
        }

        function setFieldValue(name, value) {
            if (!modalForm) {
                return;
            }

            const field = modalForm.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value || '';
            } else {
                console.warn(`suppliers: 欄位不存在 - ${name}`);
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

        function showAlert(type, message) {
            if (!alertBox) {
                return;
            }

            alertBox.textContent = message;
            alertBox.classList.remove('hidden', 'success', 'error');
            alertBox.classList.add(type === 'success' ? 'success' : 'error');
        }

        function hideAlert() {
            if (!alertBox) {
                return;
            }

            alertBox.textContent = '';
            alertBox.classList.add('hidden');
            alertBox.classList.remove('success', 'error');
        }

        function setFilterDrawerOpen(isOpen) {
            const controller = window.ModuleRenderer?.getFilterDrawerController?.('suppliers', moduleRoot);
            if (isOpen) controller?.open();
            else controller?.close();
        }

        function openFilterDrawer() {
            setFilterDrawerOpen(true);
        }

        function closeFilterDrawer() {
            setFilterDrawerOpen(false);
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
            loadSuppliers(1);
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
            selectedSupplierIds.clear();
            updateSelectionUI();
        }

        function getVisibleSuppliers() {
            return Array.from(suppliersCache.values());
        }

        function valueOrDash(value) {
            if (value === null || value === undefined || String(value).trim() === '') {
                return '-';
            }
            return escapeHtml(String(value));
        }

        function buildPrintShell(title, bodyHtml, metaHtml = '') {
            const printedAt = new Date().toLocaleString('zh-TW', {
                hour12: false,
            });

            return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(title)}</title>
    <style>
        @page { size: A4; margin: 12mm; }
        body { font-family: "Microsoft JhengHei", Arial, sans-serif; color: #222; margin: 0; }
        h1 { font-size: 20px; text-align: center; margin: 0 0 12px; }
        .print-meta { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; color: #555; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #999; padding: 5px 6px; text-align: left; vertical-align: top; }
        th { background: #f0f0f0; font-weight: 700; }
        .text-center { text-align: center; }
        .print-actions { position: fixed; right: 20px; bottom: 20px; display: flex; gap: 8px; }
        .print-actions button { border: none; border-radius: 4px; background: #2563eb; color: #fff; padding: 8px 14px; cursor: pointer; }
        .print-actions button.secondary { background: #6c757d; }
        @media print {
            .print-actions { display: none; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="print-actions">
        <button type="button" onclick="window.print()">列印</button>
        <button type="button" class="secondary" onclick="window.close()">關閉</button>
    </div>
    <h1>${escapeHtml(title)}</h1>
    <div class="print-meta">
        <span>列印時間：${escapeHtml(printedAt)}</span>
        ${metaHtml}
    </div>
    ${bodyHtml}
</body>
</html>`;
        }

        function buildSupplierListPrintDocument(suppliers) {
            const rows = suppliers.map((supplier, index) => `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${valueOrDash(supplier.supplier_number)}</td>
                    <td>${valueOrDash(supplier.name)}</td>
                    <td>${valueOrDash(supplier.service_type)}</td>
                    <td>${valueOrDash(supplier.supplier_type)}</td>
                    <td>${valueOrDash(supplier.contact_person)}</td>
                    <td>${valueOrDash(supplier.phone)}</td>
                    <td>${valueOrDash(supplier.email)}</td>
                    <td>${valueOrDash(supplier.payment_method)}</td>
                    <td>${valueOrDash(supplier.tax_id)}</td>
                </tr>
            `).join('');

            const bodyHtml = suppliers.length === 0
                ? '<p class="text-center">沒有可列印的供應商資料。</p>'
                : `<table>
                    <thead>
                        <tr>
                            <th>序號</th>
                            <th>供應商編號</th>
                            <th>供應商名稱</th>
                            <th>服務類型</th>
                            <th>供應商性質</th>
                            <th>聯絡人</th>
                            <th>聯絡電話</th>
                            <th>電子郵件</th>
                            <th>付款方式</th>
                            <th>統一編號</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>`;

            return buildPrintShell('供應商基本資料', bodyHtml, `
                <span>筆數：${suppliers.length}</span>
            `);
        }

        function printWindowDocument(html, title) {
            const printWindow = window.open('', '_blank', 'width=1100,height=800');
            if (!printWindow) {
                showAlert('error', '無法開啟列印視窗，請允許瀏覽器彈出視窗。');
                return;
            }

            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.document.title = title || '列印';
            printWindow.focus();
        }

        function handlePrintList() {
            printWindowDocument(
                buildSupplierListPrintDocument(getVisibleSuppliers()),
                '供應商基本資料列印'
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
            const visibleIds = new Set((rows || []).map((supplier) => Number(supplier.id)));
            Array.from(selectedSupplierIds).forEach((id) => {
                if (!visibleIds.has(id)) {
                    selectedSupplierIds.delete(id);
                }
            });
        }

        function handlePrintSelectedList() {
            const selectedSuppliers = Array.from(selectedSupplierIds)
                .map((id) => suppliersCache.get(id))
                .filter(Boolean);

            if (selectedSuppliers.length === 0) {
                showAlert('error', '請先勾選要列印的供應商資料。');
                updateSelectionUI();
                return;
            }

            printWindowDocument(
                buildSupplierListPrintDocument(selectedSuppliers),
                '供應商基本資料選取列印'
            );
        }

        function handleBatchPrint() {
            if (selectedSupplierIds.size > 0) {
                handlePrintSelectedList();
                return;
            }
            handlePrintList();
        }

        function escapeCsvCell(value) {
            const normalized = value == null ? '' : String(value);
            return `"${normalized.replace(/"/g, '""')}"`;
        }

        function buildCsvContent(suppliers) {
            const headers = ['供應商編號', '供應商名稱', '服務類型', '供應商性質', '聯絡人', '聯絡電話', '電子郵件', '付款方式', '統一編號', '建立時間', '更新時間'];
            const lines = [headers.map(escapeCsvCell).join(',')];
            suppliers.forEach((supplier) => {
                lines.push([
                    supplier.supplier_number || '',
                    supplier.name || '',
                    supplier.service_type || '',
                    supplier.supplier_type || '',
                    supplier.contact_person || '',
                    supplier.phone || '',
                    supplier.email || '',
                    supplier.payment_method || '',
                    supplier.tax_id || '',
                    supplier.created_at || '',
                    supplier.updated_at || '',
                ].map(escapeCsvCell).join(','));
            });
            return lines.join('\r\n');
        }

        function createTimestampForFilename() {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        }

        function downloadCsvFile(content, filename) {
            const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        function handleBatchExport() {
            const suppliers = getVisibleSuppliers();
            if (!suppliers || suppliers.length === 0) {
                showAlert('error', '目前沒有可匯出的供應商資料。');
                return;
            }

            const content = buildCsvContent(suppliers);
            const fileName = `suppliers_${createTimestampForFilename()}.csv`;
            downloadCsvFile(content, fileName);
            showAlert('success', `已匯出 ${suppliers.length} 筆供應商資料。`);
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

            const html = rows.map((supplier, index) => {
                suppliersCache.set(supplier.id, supplier);
                const isChecked = selectedSupplierIds.has(Number(supplier.id)) ? 'checked' : '';
                return `
                    <tr data-id="${supplier.id}">
                        <td class="checkbox-col"><input type="checkbox" data-action="select-row" aria-label="選擇供應商 ${escapeHtml(supplier.supplier_number || supplier.id)}" ${isChecked}></td>
                        <td>${supplier.supplier_number ? escapeHtml(supplier.supplier_number) : '-'}</td>
                        <td>${supplier.name ? escapeHtml(supplier.name) : '-'}</td>
                        <td>${supplier.service_type ? escapeHtml(supplier.service_type) : '-'}</td>
                        <td>${supplier.supplier_type ? escapeHtml(supplier.supplier_type) : '-'}</td>
                        <td>${supplier.contact_person ? escapeHtml(supplier.contact_person) : '-'}</td>
                        <td>${supplier.phone ? escapeHtml(supplier.phone) : '-'}</td>
                        <td>${supplier.email ? escapeHtml(supplier.email) : '-'}</td>
                        <td>${supplier.payment_method ? escapeHtml(supplier.payment_method) : '-'}</td>
                        <td>${supplier.tax_id ? escapeHtml(supplier.tax_id) : '-'}</td>
                        <td>${formatDateTime(supplier.created_at)}</td>
                        <td>${formatDateTime(supplier.updated_at)}</td>
                        <td>
                            <button type="button" class="btn text" data-action="edit" title="編輯"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn text danger" data-action="delete" title="刪除"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;

            // 套用欄位可見性設定
            if (window.supplierColumnManager) {
                window.supplierColumnManager.onTableUpdated();
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
            const keyword = (formData.get('keyword') || '').toString().trim();
            const perPageValue = Number.parseInt((formData.get('perPage') || '10').toString(), 10);

            return {
                keyword,
                perPage: Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10,
            };
        }

        function updateFilterSummary() {
            window.ModuleRenderer?.getFilterDrawerController?.('suppliers', moduleRoot)?.updateSummary();
        }

        async function loadSuppliers(page = 1) {
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
                const response = await fetch(`api/suppliers/index.php?${params.toString()}`, {
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

                const suppliers = Array.isArray(result.data) ? result.data : [];
                suppliersCache.clear();

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || suppliers.length;
                } else {
                    state.totalPages = 1;
                    state.total = suppliers.length;
                }

                if (suppliers.length === 0) {
                    renderEmptyState();
                } else {
                    renderTableRows(suppliers);
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

        function collectSupplierFormValues() {
            return {
                supplier_number: supplierNumberInput ? supplierNumberInput.value.trim() : '',
                name: nameInput ? nameInput.value.trim() : '',
                service_type: serviceTypeInput ? serviceTypeInput.value.trim() : '',
                supplier_type: supplierTypeInput ? supplierTypeInput.value.trim() : '',
                product_category: productCategoryInput ? productCategoryInput.value.trim() : '',
                owner: ownerInput ? ownerInput.value.trim() : '',
                contact_person: contactPersonInput ? contactPersonInput.value.trim() : '',
                contact_mobile: contactMobileInput ? contactMobileInput.value.trim() : '',
                phone: phoneInput ? phoneInput.value.trim() : '',
                fax: faxInput ? faxInput.value.trim() : '',
                email: emailInput ? emailInput.value.trim() : '',
                tax_id: taxIdInput ? taxIdInput.value.trim() : '',
                address: addressInput ? addressInput.value.trim() : '',
                factory_address: factoryAddressInput ? factoryAddressInput.value.trim() : '',
                payment_method: paymentMethodInput ? paymentMethodInput.value.trim() : '',
                attachment_path: attachmentPathInput ? attachmentPathInput.value.trim() : '',
                remove_attachment: removeAttachmentInput ? removeAttachmentInput.value : '0',
                notes: notesTextarea ? notesTextarea.value.trim() : '',
                bank_account_name: bankAccountNameInput ? bankAccountNameInput.value.trim() : '',
                bank_name: bankNameInput ? bankNameInput.value.trim() : '',
                bank_code: bankCodeInput ? bankCodeInput.value.trim() : '',
                bank_branch_name: bankBranchNameInput ? bankBranchNameInput.value.trim() : '',
                bank_branch_code: bankBranchCodeInput ? bankBranchCodeInput.value.trim() : '',
                bank_account_number: bankAccountNumberInput ? bankAccountNumberInput.value.trim() : '',
            };
        }

        function getFormSnapshot() {
            return { ...collectSupplierFormValues() };
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

        function populateForm(supplier) {
            if (!modalForm) {
                return;
            }

            if (supplierNumberInput) supplierNumberInput.value = supplier.supplier_number || '';
            if (nameInput) nameInput.value = supplier.name || '';
            if (serviceTypeInput) serviceTypeInput.value = supplier.service_type || '';
            if (supplierTypeInput) supplierTypeInput.value = supplier.supplier_type || '';
            if (productCategoryInput) productCategoryInput.value = supplier.product_category || '';
            if (ownerInput) ownerInput.value = supplier.owner || '';
            if (contactPersonInput) contactPersonInput.value = supplier.contact_person || '';
            if (contactMobileInput) contactMobileInput.value = supplier.contact_mobile || '';
            if (phoneInput) phoneInput.value = supplier.phone || '';
            if (faxInput) faxInput.value = supplier.fax || '';
            if (emailInput) emailInput.value = supplier.email || '';
            if (taxIdInput) taxIdInput.value = supplier.tax_id || '';
            if (addressInput) addressInput.value = supplier.address || '';
            if (factoryAddressInput) factoryAddressInput.value = supplier.factory_address || '';
            if (paymentMethodInput) paymentMethodInput.value = supplier.payment_method || '';
            if (attachmentPathInput) attachmentPathInput.value = supplier.attachment_path || '';
            if (notesTextarea) notesTextarea.value = supplier.notes || '';
            if (bankAccountNameInput) bankAccountNameInput.value = supplier.bank_account_name || '';
            if (bankNameInput) bankNameInput.value = supplier.bank_name || '';
            if (bankCodeInput) bankCodeInput.value = supplier.bank_code || '';
            if (bankBranchNameInput) bankBranchNameInput.value = supplier.bank_branch_name || '';
            if (bankBranchCodeInput) bankBranchCodeInput.value = supplier.bank_branch_code || '';
            if (bankAccountNumberInput) bankAccountNumberInput.value = supplier.bank_account_number || '';

            // 更新附件預覽
            if (attachmentFileInput) {
                attachmentFileInput.value = '';
            }
            if (removeAttachmentInput) {
                removeAttachmentInput.value = '0';
            }
            updateAttachmentPreviewFromPath(supplier.attachment_path || '');
        }

        function openModal(mode, supplier = null) {
            if (!modalOverlay || !modalForm) {
                return;
            }

            modalForm.reset();
            state.currentEditingId = null;
            state.formSnapshot = null;
            isFormDirty = false;

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯供應商' : '新增供應商';
            }

            if (mode === 'edit' && supplier) {
                state.currentEditingId = Number(supplier.id);
                populateForm(supplier);
            }

            modalOverlay.classList.remove('hidden');
            setFormSnapshot();

            if (supplierNumberInput) {
                supplierNumberInput.focus();
            }
        }

        function closeModal(force = false) {
            if (!modalOverlay || modalOverlay.classList.contains('hidden')) {
                return;
            }

            if (!force && isFormDirty && hasUnsavedChanges()) {
                const confirmed = window.confirm('表單資料尚未儲存,確定要關閉嗎?');
                if (!confirmed) {
                    return;
                }
            }

            if (modalForm) {
                modalForm.reset();
            }

            // 清理附件預覽
            resetAttachmentPreview();
            if (attachmentFileInput) {
                attachmentFileInput.value = '';
            }
            if (removeAttachmentInput) {
                removeAttachmentInput.value = '0';
            }

            modalOverlay.classList.add('hidden');
            hideModalAlert();
            state.currentEditingId = null;
            state.formSnapshot = null;
            isFormDirty = false;
        }

        async function openEditModal(id) {
            const cached = suppliersCache.get(id);
            if (cached) {
                openModal('edit', cached);
                return;
            }

            try {
                const response = await fetch(`api/suppliers/show.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`讀取供應商資料失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error(result.message || '讀取供應商資料失敗。');
                }

                suppliersCache.set(result.data.id, result.data);
                openModal('edit', result.data);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '無法讀取供應商資料。');
            }
        }

        async function deleteSupplier(id) {
            const confirmed = window.confirm('確認刪除此供應商資料？');
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/suppliers/delete.php?id=${id}`, {
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

                showAlert('success', result.message || '供應商資料已刪除。');
                // 通知 DataSync 資料已刪除
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('suppliers', DataSync.EVENT_TYPES.DELETED, { id });
                }
                loadSuppliers(state.page);
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
                loadSuppliers(1);
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
                loadSuppliers(1);
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
            batchExportButton.addEventListener('click', handleBatchExport);
        }

        if (paginationContainer) {
            paginationContainer.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const pageButton = target.closest('button[data-page]');
                if (!pageButton) {
                    return;
                }

                const requestedPage = Number.parseInt(pageButton.getAttribute('data-page') || '', 10);
                if (Number.isNaN(requestedPage)) {
                    return;
                }

                loadSuppliers(requestedPage);
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

                const action = actionElement.getAttribute('data-action');
                const row = actionElement.closest('tr');
                if (!row) {
                    return;
                }

                const id = Number.parseInt(row.getAttribute('data-id') || '', 10);
                if (!Number.isInteger(id)) {
                    return;
                }

                if (action === 'edit') {
                    openEditModal(id);
                } else if (action === 'delete') {
                    deleteSupplier(id);
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
                    selectedSupplierIds.add(id);
                } else {
                    selectedSupplierIds.delete(id);
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
                        selectedSupplierIds.add(id);
                    } else {
                        selectedSupplierIds.delete(id);
                    }
                });

                updateSelectionUI();
            });
        }

        if (modalForm) {
            modalForm.addEventListener('input', () => updateDirtyState());
            modalForm.addEventListener('change', () => updateDirtyState());

            // 附件上傳處理
            if (attachmentFileInput) {
                const maxAttachmentSize = 10 * 1024 * 1024; // 10 MB

                attachmentFileInput.addEventListener('change', () => {
                    if (!attachmentFileInput.files || attachmentFileInput.files.length === 0) {
                        updateAttachmentPreviewFromPath(attachmentPathInput ? attachmentPathInput.value : '');
                        updateDirtyState();
                        return;
                    }

                    const file = attachmentFileInput.files[0];
                    if (file.size > maxAttachmentSize) {
                        showModalAlert('error', '附件大小不可超過 10 MB。', false);
                        attachmentFileInput.value = '';
                        updateAttachmentPreviewFromPath(attachmentPathInput ? attachmentPathInput.value : '');
                        updateDirtyState();
                        return;
                    }

                    if (removeAttachmentInput) {
                        removeAttachmentInput.value = '0';
                    }

                    updateAttachmentPreviewFromFile(file);
                    updateDirtyState();
                });
            }

            // 清除附件按鈕
            if (clearAttachmentButton) {
                clearAttachmentButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (attachmentFileInput) {
                        attachmentFileInput.value = '';
                    }
                    if (attachmentPathInput) {
                        attachmentPathInput.value = '';
                    }
                    if (removeAttachmentInput) {
                        removeAttachmentInput.value = '1';
                    }
                    resetAttachmentPreview();
                    updateDirtyState();
                });
            }

            modalForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const payload = collectSupplierFormValues();
                if (!payload.supplier_number) {
                    showModalAlert('error', '請輸入供應商編號。', false);
                    if (supplierNumberInput) {
                        supplierNumberInput.focus();
                    }
                    return;
                }

                if (!payload.name) {
                    showModalAlert('error', '請輸入供應商名稱。', false);
                    if (nameInput) {
                        nameInput.focus();
                    }
                    return;
                }

                const isEdit = state.currentEditingId !== null;
                const endpoint = isEdit ? `api/suppliers/update.php?id=${state.currentEditingId}` : 'api/suppliers/index.php';

                try {
                    let response;

                    // 檢查是否有新上傳的檔案
                    const hasNewFile = attachmentFileInput && attachmentFileInput.files && attachmentFileInput.files.length > 0;

                    if (hasNewFile) {
                        // 使用 FormData 上傳檔案
                        const formData = new FormData();

                        // 編輯模式時使用 POST + _method 覆蓋,因為 FormData 的 PUT 請求 PHP 無法正確解析
                        if (isEdit) {
                            formData.append('_method', 'PUT');
                        }

                        for (const [key, value] of Object.entries(payload)) {
                            if (value !== null && value !== undefined) {
                                formData.append(key, value);
                            }
                        }
                        formData.append('attachment_file', attachmentFileInput.files[0]);

                        response = await fetch(endpoint, {
                            method: 'POST', // FormData 一律使用 POST
                            credentials: 'include',
                            headers: {
                                'Accept': 'application/json',
                            },
                            body: formData,
                        });
                    } else {
                        // 使用 JSON 提交
                        const method = isEdit ? 'PUT' : 'POST';
                        response = await fetch(endpoint, {
                            method,
                            credentials: 'include',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(payload),
                        });
                    }                    const result = await response.json();
                    if (!response.ok || !result.success) {
                        const message = result && result.message ? result.message : '儲存失敗,請稍後再試。';
                        const errors = result && result.errors ? Object.values(result.errors).join('、') : '';
                        showModalAlert('error', `${message}${errors ? `(${errors})` : ''}`, false);
                        return;
                    }

                    closeModal(true);
                    showAlert('success', result.message || (isEdit ? '供應商資料已更新。' : '供應商資料已新增。'));
                    // 通知 DataSync 資料已變更
                    if (typeof DataSync !== 'undefined') {
                        const eventType = isEdit ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED;
                        DataSync.notifyWithDependencies('suppliers', eventType, result.data);
                    }
                    loadSuppliers(isEdit ? state.page : 1);
                } catch (error) {
                    console.error(error);
                    showModalAlert('error', error.message || '儲存失敗,請稍後再試。', false);
                }
            });
        }

        loadSuppliers(1);

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('suppliers', {
                onRefresh: () => loadSuppliers(state.page),
                debounceMs: 300
            });
        }
    }

    window.initializeSuppliersModule = initializeSuppliersModule;
})();
