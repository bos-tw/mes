/**
 * Companies Module
 * 公司管理模組
 */
(function() {
    'use strict';

    function initializeCompaniesModule(container) {
        const moduleRoot = container.querySelector('[data-module="companies"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        const alertBox = moduleRoot.querySelector('[data-companies-alert]');
        const filterForm = moduleRoot.querySelector('[data-companies-filter]');
        const tableElement = moduleRoot.querySelector('[data-companies-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-companies-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-companies-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-companies-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-companies-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');
        const openFilterDrawerButton = moduleRoot.querySelector('[data-action="open-filter-drawer"]');
        const closeFilterDrawerButton = moduleRoot.querySelector('[data-action="close-filter-drawer"]');
        const filterDrawer = moduleRoot.querySelector('[data-companies-filter-drawer]');
        const filterOverlay = moduleRoot.querySelector('[data-companies-filter-overlay]');
        const filterSummary = moduleRoot.querySelector('[data-companies-filter-summary]');
        const filterCountBadge = moduleRoot.querySelector('[data-companies-filter-count]');

        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const batchPrintButton = moduleRoot.querySelector('.content-header [data-action="batch-print"]');
        const batchExportButton = moduleRoot.querySelector('.content-header [data-action="batch-export"]');

        const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
        const nameEnInput = modalForm ? modalForm.querySelector('input[name="name_en"]') : null;
        const taxIdInput = modalForm ? modalForm.querySelector('input[name="tax_id"]') : null;
        const phoneInput = modalForm ? modalForm.querySelector('input[name="phone"]') : null;
        const faxInput = modalForm ? modalForm.querySelector('input[name="fax"]') : null;
        const emailInput = modalForm ? modalForm.querySelector('input[name="email"]') : null;
        const addressInput = modalForm ? modalForm.querySelector('input[name="address"]') : null;

        // LOGO 管理相關元素
        const logoSection = modalOverlay ? modalOverlay.querySelector('[data-logo-section]') : null;
        const logoCreateHint = modalOverlay ? modalOverlay.querySelector('[data-logo-create-hint]') : null;
        const logoEditArea = modalOverlay ? modalOverlay.querySelector('[data-logo-edit-area]') : null;
        const logoFileInput = modalOverlay ? modalOverlay.querySelector('[data-logo-file-input]') : null;
        const logoLibrary = modalOverlay ? modalOverlay.querySelector('[data-logo-library]') : null;

        const companiesCache = new Map();
        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            currentEditingId: null,
            formInitialSnapshot: null,
            sortField: null,
            sortDirection: 'asc', // 'asc' or 'desc'
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

            alertBox.classList.add('hidden');
            alertBox.textContent = '';
            alertBox.classList.remove('success', 'error');
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
                console.warn(`companies: 欄位不存在 - ${name}`);
            }
        }

        function updateSortIndicators() {
            if (!tableElement) return;

            // 清除所有排序指示器
            const allHeaders = tableElement.querySelectorAll('th[data-sort]');
            allHeaders.forEach(header => {
                header.classList.remove('sort-asc', 'sort-desc');
            });

            // 設置當前排序列的指示器
            if (state.sortField) {
                const currentHeader = tableElement.querySelector(`th[data-sort="${state.sortField}"]`);
                if (currentHeader) {
                    currentHeader.classList.add(state.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            }
        }

        function sortCompanies(companies) {
            if (!state.sortField) return companies;

            return companies.sort((a, b) => {
                let aValue = getNestedProperty(a, state.sortField);
                let bValue = getNestedProperty(b, state.sortField);

                // 處理空值
                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return state.sortDirection === 'asc' ? 1 : -1;
                if (bValue == null) return state.sortDirection === 'asc' ? -1 : 1;

                // 轉換為字符串進行比較
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();

                if (state.sortDirection === 'asc') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            });
        }

        function getNestedProperty(obj, path) {
            return path.split('.').reduce((current, key) => current && current[key], obj);
        }

        function getTableColumnCount() {
            if (!tableElement || !tableElement.tHead || !tableElement.tHead.rows.length) {
                return 6;
            }
            return tableElement.tHead.rows[0].cells.length || 6;
        }

        function setFilterDrawerOpen(isOpen) {
            const controller = window.ModuleRenderer?.getFilterDrawerController?.('companies', moduleRoot);
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
            window.ModuleRenderer?.getFilterDrawerController?.('companies', moduleRoot)?.updateSummary();
        }

        function renderTableRows(rows) {
            if (!tableBody) {
                return;
            }

            if (!rows || rows.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="${getTableColumnCount()}" class="text-center">尚無符合條件的資料。</td></tr>`;
                return;
            }

            const html = rows.map((company) => {
                companiesCache.set(company.id, company);

                return `
                    <tr data-id="${company.id}">
                        <td>${escapeHtml(company.name) || '-'}</td>
                        <td>${escapeHtml(company.address) || '-'}</td>
                        <td>${escapeHtml(company.phone) || '-'}</td>
                        <td>${escapeHtml(company.email) || '-'}</td>
                        <td>${escapeHtml(company.tax_id) || '-'}</td>
                        <td>
                            <button type="button" class="btn text" data-action="edit" title="編輯"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn text danger" data-action="delete" title="刪除"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;
            const manager = window.companyColumnManager;
            if (manager) {
                manager.onTableUpdated();
            }
        }

        function renderLoadingRow() {
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="${getTableColumnCount()}" class="text-center">資料載入中...</td></tr>`;
            }
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
                <span>第 ${state.page} / ${state.totalPages} 頁， 共 ${state.total} 筆資料</span>
                <button type="button" data-page="${state.page + 1}" ${nextDisabled}>下一頁</button>
            `;
        }

        function getVisibleCompanies() {
            return Array.from(companiesCache.values());
        }

        function getCurrentKeyword() {
            if (!filterForm) {
                return '';
            }

            const formData = new FormData(filterForm);
            return (formData.get('keyword') || '').toString().trim();
        }

        function escapeCsvCell(value) {
            const normalized = value == null ? '' : String(value);
            return `"${normalized.replace(/"/g, '""')}"`;
        }

        function buildCsvContent(companies) {
            const headers = ['公司名稱', '英文名稱', '統一編號', '電話', '傳真', 'Email', '地址'];
            const lines = [headers.map(escapeCsvCell).join(',')];

            companies.forEach((company) => {
                lines.push([
                    company.name || '',
                    company.name_en || '',
                    company.tax_id || '',
                    company.phone || '',
                    company.fax || '',
                    company.email || '',
                    company.address || '',
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

        function buildPrintDocument(companies) {
            const printedAt = new Date().toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
            const keyword = getCurrentKeyword();
            const rows = companies.map((company, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(company.name) || '-'}</td>
                    <td>${escapeHtml(company.name_en) || '-'}</td>
                    <td>${escapeHtml(company.tax_id) || '-'}</td>
                    <td>${escapeHtml(company.phone) || '-'}</td>
                    <td>${escapeHtml(company.fax) || '-'}</td>
                    <td>${escapeHtml(company.email) || '-'}</td>
                    <td>${escapeHtml(company.address) || '-'}</td>
                </tr>
            `).join('');

            return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>公司基本資料列印</title>
    <style>
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        body {
            margin: 24px;
            color: #222;
            font-family: "Microsoft JhengHei", "Noto Sans TC", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
        }
        h1 {
            margin: 0 0 8px;
            font-size: 22px;
            text-align: center;
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
            th { background: #f0f3f7 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="print-actions">
        <button type="button" onclick="window.print()">列印</button>
        <button type="button" class="secondary" onclick="window.close()">關閉</button>
    </div>
    <h1>公司基本資料</h1>
    <div class="meta">
        <span>列印時間：${escapeHtml(printedAt)}</span>
        <span>篩選：${keyword ? escapeHtml(keyword) : '全部'}</span>
        <span>本頁筆數：${companies.length}</span>
    </div>
    ${companies.length === 0 ? '<div class="empty">目前沒有可列印的公司資料。</div>' : `
    <table>
        <thead>
            <tr>
                <th style="width: 44px;">#</th>
                <th>公司名稱</th>
                <th>英文名稱</th>
                <th>統一編號</th>
                <th>電話</th>
                <th>傳真</th>
                <th>Email</th>
                <th>地址</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>`}
</body>
</html>`;
        }

        function handlePrint() {
            const companies = getVisibleCompanies();
            const printWindow = window.open('', '_blank', 'width=1100,height=800');

            if (!printWindow) {
                showAlert('error', '無法開啟列印視窗，請檢查瀏覽器是否封鎖彈出視窗。');
                return;
            }

            printWindow.document.open();
            printWindow.document.write(buildPrintDocument(companies));
            printWindow.document.close();
            printWindow.focus();
        }

        function handleBatchExport() {
            const companies = getVisibleCompanies();
            if (!companies || companies.length === 0) {
                showAlert('error', '目前沒有可匯出的公司資料。');
                return;
            }

            const csvContent = buildCsvContent(companies);
            const fileName = `companies_${createTimestampForFilename()}.csv`;
            downloadCsvFile(csvContent, fileName);
            showAlert('success', `已匯出 ${companies.length} 筆公司資料。`);
        }

        async function loadCompanies(page = 1) {
            if (!filterForm) {
                return;
            }

            hideAlert();
            renderLoadingRow();

            const formData = new FormData(filterForm);
            const params = new URLSearchParams();
            const keyword = (formData.get('keyword') || '').toString().trim();
            const perPageValue = parseInt((formData.get('perPage') || '10').toString(), 10);

            state.page = Math.max(1, page);
            state.perPage = Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10;

            params.set('page', String(state.page));
            params.set('perPage', String(state.perPage));
            if (keyword !== '') {
                params.set('keyword', keyword);
            }

            try {
                const response = await fetch(`api/companies/index.php?${params.toString()}`, {
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

                const companies = Array.isArray(result.data) ? result.data : [];
                companiesCache.clear();

                // 應用排序
                const sortedCompanies = sortCompanies(companies);
                renderTableRows(sortedCompanies);

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || companies.length;
                } else {
                    state.totalPages = 1;
                    state.total = companies.length;
                }

                renderPagination();
                updateSortIndicators();
                updateFilterSummary();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入失敗，請稍後再試。');
                renderTableRows([]);
                updateFilterSummary();
            }
        }

        function setFormInitialSnapshot() {
            state.formInitialSnapshot = getFormSnapshot();
            isFormDirty = false;
        }

        function hasUnsavedChanges() {
            if (!modalForm || !state.formInitialSnapshot) {
                return false;
            }

            const current = getFormSnapshot();
            return Object.keys(state.formInitialSnapshot).some((key) => state.formInitialSnapshot[key] !== current[key]);
        }

        function updateDirtyState() {
            isFormDirty = hasUnsavedChanges();
        }

        function getFormSnapshot() {
            if (!modalForm) {
                return {};
            }

            return {
                name: nameInput ? nameInput.value.trim() : '',
                tax_id: taxIdInput ? taxIdInput.value.trim() : '',
                phone: phoneInput ? phoneInput.value.trim() : '',
                email: emailInput ? emailInput.value.trim() : '',
                address: addressInput ? addressInput.value.trim() : '',
            };
        }

        async function openModal(mode, company) {
            if (!modalOverlay || !modalForm) {
                return;
            }

            modalForm.reset();
            state.currentEditingId = mode === 'edit' && company ? company.id : null;

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯公司' : '新增公司';
            }

            // LOGO 區塊：新增模式顯示提示，編輯模式顯示上傳區域
            if (logoCreateHint && logoEditArea) {
                if (mode === 'edit' && company) {
                    // 編輯模式：隱藏提示，顯示上傳區域
                    logoCreateHint.classList.add('hidden');
                    logoEditArea.classList.remove('hidden');
                    loadCompanyLogos(company.id);
                } else {
                    // 新增模式：顯示提示，隱藏上傳區域
                    logoCreateHint.classList.remove('hidden');
                    logoEditArea.classList.add('hidden');
                    if (logoLibrary) {
                        logoLibrary.innerHTML = '<div class="logo-empty-state">尚無 LOGO，請上傳圖片</div>';
                    }
                }
            }

            if (company) {
                if (nameInput) nameInput.value = company.name || '';
                if (nameEnInput) nameEnInput.value = company.name_en || '';
                if (taxIdInput) taxIdInput.value = company.tax_id || '';
                if (phoneInput) phoneInput.value = company.phone || '';
                if (faxInput) faxInput.value = company.fax || '';
                if (emailInput) emailInput.value = company.email || '';
                if (addressInput) addressInput.value = company.address || '';
            }

            modalOverlay.classList.remove('hidden');
            setFormInitialSnapshot();
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
            modalOverlay.classList.add('hidden');
            hideModalAlert();
            state.currentEditingId = null;
            state.formInitialSnapshot = null;
            isFormDirty = false;
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
                loadCompanies(1);
            });
        }

        if (resetFilterButton && filterForm) {
            resetFilterButton.addEventListener('click', () => {
                filterForm.reset();
                if (filterForm.elements.perPage) {
                    filterForm.elements.perPage.value = '10';
                }
                closeFilterDrawer();
                updateFilterSummary();
                loadCompanies(1);
            });
        }

        if (headerCreateButton) {
            headerCreateButton.addEventListener('click', () => {
                hideAlert();
                openModal('create');
            });
        }

        if (batchPrintButton) {
            batchPrintButton.addEventListener('click', handlePrint);
        }

        if (batchExportButton) {
            batchExportButton.addEventListener('click', handleBatchExport);
        }

        if (modalForm) {
            modalForm.addEventListener('input', () => {
                updateDirtyState();
            });

            modalForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const nameValue = nameInput ? nameInput.value.trim() : '';
                const nameEnValue = nameEnInput ? nameEnInput.value.trim() : '';
                const taxIdValue = taxIdInput ? taxIdInput.value.trim() : '';
                const phoneValue = phoneInput ? phoneInput.value.trim() : '';
                const faxValue = faxInput ? faxInput.value.trim() : '';
                const emailValue = emailInput ? emailInput.value.trim() : '';
                const addressValue = addressInput ? addressInput.value.trim() : '';

                if (nameValue === '') {
                    showModalAlert('error', '請輸入公司名稱。', false);
                    return;
                }

                const payload = {
                    name: nameValue,
                };

                if (nameEnValue !== '') {
                    payload.name_en = nameEnValue;
                }

                if (taxIdValue !== '') {
                    payload.tax_id = taxIdValue;
                }

                if (phoneValue !== '') {
                    payload.phone = phoneValue;
                }

                if (faxValue !== '') {
                    payload.fax = faxValue;
                }

                if (emailValue !== '') {
                    payload.email = emailValue;
                }

                if (addressValue !== '') {
                    payload.address = addressValue;
                }

                hideAlert();

                const isEdit = state.currentEditingId !== null;
                const endpoint = isEdit ? `api/companies/update.php?id=${state.currentEditingId}` : 'api/companies/index.php';
                const method = isEdit ? 'PUT' : 'POST';

                try {
                    const response = await fetch(endpoint, {
                        method,
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    const result = await response.json();
                    if (!response.ok || !result.success) {
                        const message = result && result.message ? result.message : '儲存失敗，請稍後再試。';
                        const errors = result && result.errors ? Object.values(result.errors).join('、') : '';
                        showModalAlert('error', `${message}${errors ? `（${errors}）` : ''}`, false);
                        return;
                    }

                    // 通知 DataSync 資料已變更
                    if (typeof DataSync !== 'undefined') {
                        const eventType = isEdit ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED;
                        DataSync.notifyWithDependencies('companies', eventType, result.data);
                    }

                    if (isEdit) {
                        // 編輯模式：關閉 Modal 並顯示成功訊息
                        closeModal(true);
                        showAlert('success', '公司資料已更新。');
                        loadCompanies(state.page);
                    } else {
                        // 新增模式：切換到編輯模式，讓用戶可以上傳 LOGO
                        showModalAlert('success', '公司建立成功！現在可以上傳 LOGO。');
                        loadCompanies(state.page);

                        // 取得新建立的公司 ID 並切換到編輯模式
                        if (result.data && result.data.id) {
                            state.currentEditingId = result.data.id;
                            if (modalTitle) {
                                modalTitle.textContent = '編輯公司';
                            }
                            // 顯示 LOGO 上傳區域
                            if (logoCreateHint) logoCreateHint.classList.add('hidden');
                            if (logoEditArea) logoEditArea.classList.remove('hidden');
                            loadCompanyLogos(result.data.id);
                            setFormInitialSnapshot();
                        }
                    }
                } catch (error) {
                    console.error(error);
                    showModalAlert('error', error.message || '儲存失敗，請稍後再試。', false);
                }
            });
        }

        if (tableBody) {
            tableBody.addEventListener('click', async (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                // 找到帶有 data-action 屬性的元素（可能是按鈕或其子元素）
                const actionElement = target.closest('[data-action]');
                const action = actionElement ? actionElement.dataset.action : null;
                if (!action) {
                    return;
                }

                const row = target.closest('tr');
                if (!row) {
                    return;
                }

                const id = Number.parseInt(row.getAttribute('data-id') || '', 10);
                if (!Number.isInteger(id)) {
                    showAlert('error', '無法取得公司編號。');
                    return;
                }

                if (action === 'edit') {
                    hideAlert();
                    await openEditForm(id);
                } else if (action === 'delete') {
                    hideAlert();
                    await deleteCompany(id);
                }
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

                loadCompanies(nextPage);
            });
        }

        if (tableElement) {
            const tableHead = tableElement.querySelector('thead');
            if (tableHead) {
                tableHead.addEventListener('click', (event) => {
                    const target = event.target;
                    if (!(target instanceof HTMLElement)) {
                        return;
                    }

                    const headerCell = target.closest('th[data-sort]');
                    if (!headerCell) {
                        return;
                    }

                    const sortField = headerCell.getAttribute('data-sort');
                    if (!sortField) {
                        return;
                    }

                    // 切換排序方向
                    if (state.sortField === sortField) {
                        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        state.sortField = sortField;
                        state.sortDirection = 'asc';
                    }

                    // 重新載入並排序數據
                    loadCompanies(state.page);
                });
            }
        }

        async function openEditForm(id) {
            try {
                const response = await fetch(`api/companies/update.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error(`讀取公司資料失敗（${response.status}）`);
                }
                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error(result.message || '讀取公司資料失敗。');
                }
                companiesCache.set(result.data.id, result.data);
                openModal('edit', result.data);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '無法讀取公司資料。');
            }
        }

        async function deleteCompany(id) {
            const confirmed = window.confirm('確認刪除此公司資料？');
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/companies/update.php?id=${id}`, {
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

                showAlert('success', '公司資料已刪除。');
                // 通知 DataSync 資料已刪除
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('companies', DataSync.EVENT_TYPES.DELETED, { id });
                }
                loadCompanies(state.page);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗，請稍後再試。');
            }
        }

        loadCompanies(1);

        // ===== LOGO 管理功能 =====

        // 載入公司 LOGO 列表
        async function loadCompanyLogos(companyId) {
            if (!logoLibrary) return;

            try {
                const response = await fetch(`api/companies/logos.php?company_id=${companyId}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '載入 LOGO 失敗');
                }

                renderLogoLibrary(result.data || []);
            } catch (error) {
                console.error('Load logos error:', error);
                logoLibrary.innerHTML = '<div class="logo-empty-state">載入 LOGO 時發生錯誤</div>';
            }
        }

        // 渲染 LOGO 列表
        function renderLogoLibrary(logos) {
            if (!logoLibrary) return;

            if (!logos || logos.length === 0) {
                logoLibrary.innerHTML = '<div class="logo-empty-state">尚無 LOGO，請上傳圖片</div>';
                return;
            }

            const html = logos.map(logo => `
                <div class="logo-item ${logo.is_active ? 'active' : ''}" data-logo-id="${logo.id}">
                    <div class="logo-preview">
                        <img src="${escapeHtml(logo.file_path)}" alt="LOGO" loading="lazy">
                    </div>
                    <div class="logo-info">
                        <span class="logo-name" title="${escapeHtml(logo.file_name)}">${escapeHtml(logo.file_name)}</span>
                        <span class="logo-meta">${formatFileSize(logo.file_size)} · ${formatDate(logo.uploaded_at)}</span>
                    </div>
                    <div class="logo-actions">
                        <button type="button" class="btn text small" data-action="preview-logo" data-path="${escapeHtml(logo.file_path)}" title="預覽">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn text small ${logo.is_active ? 'success' : ''}" data-action="set-active-logo" title="${logo.is_active ? '使用中' : '設為使用中'}">
                            <i class="fas fa-check-circle"></i>
                        </button>
                        <button type="button" class="btn text small danger" data-action="delete-logo" title="刪除" ${logo.is_active ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    ${logo.is_active ? '<span class="logo-badge">使用中</span>' : ''}
                </div>
            `).join('');

            logoLibrary.innerHTML = html;
        }

        // 格式化檔案大小
        function formatFileSize(bytes) {
            if (!bytes) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        // 格式化日期
        function formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
        }

        // 上傳 LOGO
        async function uploadLogo(companyId, file) {
            const formData = new FormData();
            formData.append('company_id', companyId);
            formData.append('logo', file);

            try {
                const response = await fetch('api/companies/logos.php', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '上傳失敗');
                }

                showModalAlert('success', 'LOGO 上傳成功。');
                loadCompanyLogos(companyId);
            } catch (error) {
                console.error('Upload logo error:', error);
                showModalAlert('error', error.message || '上傳 LOGO 失敗。', false);
            }
        }

        // 設定使用中 LOGO
        async function setActiveLogo(logoId) {
            try {
                const response = await fetch(`api/companies/logos.php?id=${logoId}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ is_active: 1 }),
                });

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '設定失敗');
                }

                showModalAlert('success', '已設定為使用中的 LOGO。');
                if (state.currentEditingId) {
                    loadCompanyLogos(state.currentEditingId);
                }
            } catch (error) {
                console.error('Set active logo error:', error);
                showModalAlert('error', error.message || '設定 LOGO 失敗。', false);
            }
        }

        // 刪除 LOGO
        async function deleteLogo(logoId) {
            const confirmed = window.confirm('確認刪除此 LOGO？');
            if (!confirmed) return;

            try {
                const response = await fetch(`api/companies/logos.php?id=${logoId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '刪除失敗');
                }

                showModalAlert('success', 'LOGO 已刪除。');
                if (state.currentEditingId) {
                    loadCompanyLogos(state.currentEditingId);
                }
            } catch (error) {
                console.error('Delete logo error:', error);
                showModalAlert('error', error.message || '刪除 LOGO 失敗。', false);
            }
        }

        // 預覽 LOGO（Lightbox）
        function previewLogo(logoPath) {
            const lightbox = document.createElement('div');
            lightbox.className = 'logo-lightbox';
            lightbox.innerHTML = `<img src="${escapeHtml(logoPath)}" alt="LOGO 預覽">`;
            lightbox.addEventListener('click', () => lightbox.remove());
            document.body.appendChild(lightbox);
        }

        // 綁定 LOGO 檔案上傳事件
        if (logoFileInput) {
            const maxLogoSize = 2 * 1024 * 1024; // 2 MB
            const allowedLogoTypes = new Set(['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']);

            logoFileInput.addEventListener('change', () => {
                if (!logoFileInput.files || logoFileInput.files.length === 0) {
                    return;
                }

                if (!state.currentEditingId) {
                    showModalAlert('warning', '請先儲存公司資料後，再上傳 LOGO。', false);
                    logoFileInput.value = '';
                    return;
                }

                const file = logoFileInput.files[0];
                if (file.size > maxLogoSize) {
                    showModalAlert('error', 'LOGO 圖片大小不可超過 2MB。', false);
                    logoFileInput.value = '';
                    return;
                }

                if (!allowedLogoTypes.has(file.type)) {
                    showModalAlert('error', 'LOGO 僅支援 PNG、JPG、SVG 或 WebP 格式。', false);
                    logoFileInput.value = '';
                    return;
                }

                uploadLogo(state.currentEditingId, file);
                logoFileInput.value = '';
            });
        }

        // 綁定 LOGO 列表事件（事件委派）
        if (logoLibrary) {
            logoLibrary.addEventListener('click', (e) => {
                const target = e.target;
                if (!(target instanceof HTMLElement)) return;

                const actionBtn = target.closest('[data-action]');
                if (!actionBtn) return;

                const action = actionBtn.dataset.action;
                const logoItem = actionBtn.closest('.logo-item');
                const logoId = logoItem ? parseInt(logoItem.dataset.logoId, 10) : null;

                if (action === 'preview-logo') {
                    const path = actionBtn.dataset.path;
                    if (path) previewLogo(path);
                } else if (action === 'set-active-logo' && logoId) {
                    setActiveLogo(logoId);
                } else if (action === 'delete-logo' && logoId) {
                    if (!actionBtn.disabled) {
                        deleteLogo(logoId);
                    }
                }
            });
        }

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('companies', {
                onRefresh: () => loadCompanies(state.page),
                debounceMs: 300
            });
        }
    }

    window.initializeCompaniesModule = initializeCompaniesModule;
})();
