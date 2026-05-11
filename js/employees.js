/**
 * Employees Module
 * 員工管理模組
 */
(function() {
    'use strict';

    function initializeEmployeesModule(container) {
        const moduleRoot = container.querySelector('[data-module="employees"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        const alertBox = moduleRoot.querySelector('[data-employees-alert]');
        const filterForm = moduleRoot.querySelector('[data-employees-filter]');
        const tableElement = moduleRoot.querySelector('[data-employees-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-employees-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-employees-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-employees-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-employees-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');
        const openFilterDrawerButton = moduleRoot.querySelector('[data-action="open-filter-drawer"]');
        const closeFilterDrawerButton = moduleRoot.querySelector('[data-action="close-filter-drawer"]');
        const filterDrawer = moduleRoot.querySelector('[data-employees-filter-drawer]');
        const filterOverlay = moduleRoot.querySelector('[data-employees-filter-overlay]');
        const filterSummary = moduleRoot.querySelector('[data-employees-filter-summary]');
        const filterCountBadge = moduleRoot.querySelector('[data-employees-filter-count]');

        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const batchPrintButton = moduleRoot.querySelector('.content-header [data-action="batch-print"], .content-header [data-action="print"]');
        const batchExportButton = moduleRoot.querySelector('.content-header [data-action="batch-export"], .content-header [data-action="export"]');
        const selectionCountBadge = moduleRoot.querySelector('[data-selection-count]');
        const selectAllCheckbox = tableElement ? tableElement.querySelector('thead [data-action="select-all"]') : null;

        const employeeNumberInput = modalForm ? modalForm.querySelector('input[name="employee_number"]') : null;
        const accountInput = modalForm ? modalForm.querySelector('input[name="account"]') : null;
        const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
        const departmentInput = modalForm ? modalForm.querySelector('select[name="department_id"]') : null;
        const jobTitleInput = modalForm ? modalForm.querySelector('input[name="job_title"]') : null;
        const emailInput = modalForm ? modalForm.querySelector('input[name="email"]') : null;
        const statusLookupSelect = modalForm ? modalForm.querySelector('select[name="status_lookup_id"]') : null;
        const passwordFieldWrapper = modalForm ? modalForm.querySelector('[data-password-field]') : null;
        const passwordInput = passwordFieldWrapper ? passwordFieldWrapper.querySelector('input[name="password"]') : null;

        const employeesCache = new Map();
        const selectedEmployeeIds = new Set();
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
        let dataSyncHelper = null;

        /**
         * 填充下拉選單選項（從 lookup_values API 載入）
         */
        async function populateSelectOptions(selectElement, lookupDomain) {
            if (!selectElement) {
                return;
            }

            try {
                const response = await fetch(`api/lookup_values/index.php?domain_key=${lookupDomain}&perPage=1000`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await response.json();
                if (!result.success || !Array.isArray(result.data)) {
                    throw new Error('查詢值載入失敗');
                }

                const options = result.data;
                const currentValue = selectElement.value;

                selectElement.innerHTML = '';
                const placeholderOption = document.createElement('option');
                placeholderOption.value = '';
                placeholderOption.textContent = selectElement.getAttribute('data-placeholder') || '請選擇';
                selectElement.appendChild(placeholderOption);

                options.forEach((option) => {
                    const optionElement = document.createElement('option');
                    optionElement.value = String(option.id);
                    optionElement.textContent = option.value_label;
                    optionElement.setAttribute('data-value-key', option.value_key);
                    selectElement.appendChild(optionElement);
                });

                if (currentValue && selectElement.querySelector(`option[value="${currentValue}"]`)) {
                    selectElement.value = currentValue;
                }
            } catch (error) {
                console.error('載入查詢值時發生錯誤：', error);
            }
        }

        // 載入動態狀態選項
        async function initializeLookupSelects() {
            // 載入篩選器中的狀態選項
            const filterStatusSelect = filterForm ? filterForm.querySelector('select[name="status"]') : null;
            if (filterStatusSelect && filterStatusSelect.hasAttribute('data-lookup-domain')) {
                await populateSelectOptions(filterStatusSelect, 'EMPLOYEE_STATUS');
            }

            // 載入表單中的狀態選項
            const formStatusSelect = modalForm ? modalForm.querySelector('select[name="status_lookup_id"]') : null;
            if (formStatusSelect && formStatusSelect.hasAttribute('data-lookup-domain')) {
                await populateSelectOptions(formStatusSelect, 'EMPLOYEE_STATUS');
            }
            updateFilterSummary();
        }

        // 初始化載入狀態選項
        initializeLookupSelects();

        // Modal 內部錯誤訊息顯示（若沒有 modalAlertBox，會回退到頁面 alert）
        function showModalAlert(type, message, autoHide = true) {
            if (!modalAlertBox) {
                showAlert(type, message);
                return;
            }

            modalAlertBox.textContent = message;
            modalAlertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
            modalAlertBox.classList.add(type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'error');

            if (autoHide && type === 'success') {
                setTimeout(() => hideModalAlert(), 3000);
            }

            const modalWindow = modalOverlay ? modalOverlay.querySelector('.modal-window') : null;
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
                console.warn(`employees: 欄位不存在 - ${name}`);
            }
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

        function setFilterDrawerOpen(isOpen) {
            const controller = window.ModuleRenderer?.getFilterDrawerController?.('employees', moduleRoot);
            if (isOpen) controller?.open();
            else controller?.close();
        }

        function openFilterDrawer() {
            setFilterDrawerOpen(true);
        }

        function closeFilterDrawer() {
            setFilterDrawerOpen(false);
        }

        function collectFilterValues() {
            if (!filterForm) {
                return { keyword: '', status: '', statusLabel: '', perPage: 10 };
            }

            const formData = new FormData(filterForm);
            const keyword = (formData.get('keyword') || '').toString().trim();
            const status = (formData.get('status') || '').toString().trim();
            const perPageValue = Number.parseInt((formData.get('perPage') || '10').toString(), 10);
            const statusField = filterForm.elements.status;
            let statusLabel = '';
            if (status && statusField instanceof HTMLSelectElement) {
                const selectedOption = statusField.options[statusField.selectedIndex];
                statusLabel = selectedOption ? (selectedOption.textContent || '').trim() : '';
            }

            return {
                keyword,
                status,
                statusLabel,
                perPage: Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10
            };
        }

        function updateFilterSummary() {
            window.ModuleRenderer?.getFilterDrawerController?.('employees', moduleRoot)?.updateSummary();
        }

        function updateSelectionUI() {
            const count = selectedEmployeeIds.size;
            if (batchPrintButton) {
                batchPrintButton.disabled = count === 0;
            }
            if (selectionCountBadge) {
                selectionCountBadge.textContent = String(count);
                selectionCountBadge.classList.toggle('hidden', count === 0);
            }

            if (selectAllCheckbox && tableBody) {
                const checkboxes = Array.from(tableBody.querySelectorAll('input[data-action="select-row"]'));
                const checkedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
                const hasRows = checkboxes.length > 0;
                selectAllCheckbox.checked = hasRows && checkedCount === checkboxes.length;
                selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
            }
        }

        function renderTableRows(rows) {
            if (!tableBody) {
                return;
            }

            if (!rows || rows.length === 0) {
                selectedEmployeeIds.clear();
                tableBody.innerHTML = '<tr><td colspan="9" class="text-center">尚無符合條件的資料。</td></tr>';
                updateSelectionUI();
                return;
            }

            const visibleIds = new Set(rows.map((employee) => Number.parseInt(employee.id, 10)).filter(Number.isInteger));
            for (const id of Array.from(selectedEmployeeIds)) {
                if (!visibleIds.has(id)) {
                    selectedEmployeeIds.delete(id);
                }
            }

            const html = rows.map((employee) => {
                const employeeId = Number.parseInt(employee.id, 10);
                const departmentName = employee.department && employee.department.name ? employee.department.name : '-';
                const lastLogin = employee.last_login_at ? employee.last_login_at : '-';
                const isSelected = selectedEmployeeIds.has(employeeId) ? ' checked' : '';
                employeesCache.set(employeeId, employee);

                return `
                    <tr data-id="${employeeId}">
                        <td class="checkbox-col"><input type="checkbox" data-action="select-row" value="${employeeId}"${isSelected}></td>
                        <td>${escapeHtml(employee.employee_number) || '-'}</td>
                        <td>${escapeHtml(employee.name) || '-'}</td>
                        <td>${escapeHtml(departmentName)}</td>
                        <td>${escapeHtml(employee.job_title) || '-'}</td>
                        <td>${escapeHtml(employee.email) || '-'}</td>
                        <td>${escapeHtml(employee.status_label || formatStatus(employee.status))}</td>
                        <td>${escapeHtml(lastLogin)}</td>
                        <td>
                            <button type="button" class="btn text" data-action="edit" title="編輯"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn text danger" data-action="delete" title="刪除"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;

            // 重新套用欄位可見性設定
            const colManager = window.employeeColumnManager || (typeof ColumnManagerAutoInit !== 'undefined' && ColumnManagerAutoInit.getManager('employees'));
            if (colManager) {
                colManager.onTableUpdated();
            }
            updateSelectionUI();
        }

        function renderLoadingRow() {
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="9" class="text-center">資料載入中...</td></tr>';
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

        function formatStatus(status) {
            switch (status) {
                case 'active':
                    return '在職';
                case 'resigned':
                    return '離職';
                case 'unpaid_leave':
                    return '留職停薪';
                default:
                    return status || '-';
            }
        }

        async function loadDepartments() {
            if (!departmentInput) {
                return;
            }

            try {
                const response = await fetch('api/departments/index.php?perPage=1000', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    console.warn('載入部門列表失敗：', response.status);
                    return;
                }

                const result = await response.json();
                if (!result.success || !Array.isArray(result.data)) {
                    console.warn('部門列表資料格式錯誤');
                    return;
                }

                // 清空現有選項，保留第一個"請選擇部門"
                departmentInput.innerHTML = '<option value="">請選擇部門</option>';

                // 添加部門選項
                result.data.forEach(department => {
                    const option = document.createElement('option');
                    option.value = department.id;
                    option.textContent = department.name;
                    departmentInput.appendChild(option);
                });
            } catch (error) {
                console.error('載入部門列表時發生錯誤：', error);
            }
        }

        function getVisibleEmployees() {
            return Array.from(employeesCache.values());
        }

        function valueOrDash(value) {
            if (value === null || value === undefined || String(value).trim() === '') {
                return '-';
            }

            return String(value);
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

        function buildEmployeeListPrintDocument(employees) {
            const rows = employees.map((employee, index) => {
                const departmentName = employee.department && employee.department.name ? employee.department.name : '';

                return `
                    <tr>
                        <td class="text-center">${escapeHtml(String(index + 1))}</td>
                        <td>${escapeHtml(valueOrDash(employee.employee_number))}</td>
                        <td>${escapeHtml(valueOrDash(employee.name))}</td>
                        <td>${escapeHtml(valueOrDash(departmentName))}</td>
                        <td>${escapeHtml(valueOrDash(employee.job_title))}</td>
                        <td>${escapeHtml(valueOrDash(employee.email))}</td>
                        <td>${escapeHtml(valueOrDash(employee.status_label || formatStatus(employee.status)))}</td>
                        <td>${escapeHtml(valueOrDash(employee.last_login_at))}</td>
                    </tr>
                `;
            }).join('');

            const bodyHtml = employees.length === 0
                ? '<p class="text-center">沒有可列印的員工資料。</p>'
                : `<table>
                    <thead>
                        <tr>
                            <th>序號</th>
                            <th>員工編號</th>
                            <th>姓名</th>
                            <th>所屬部門</th>
                            <th>職稱</th>
                            <th>電子郵件</th>
                            <th>狀態</th>
                            <th>最近登入</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>`;

            return buildPrintShell('員工基本資料', bodyHtml, `
                <span>筆數：${employees.length}</span>
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
                buildEmployeeListPrintDocument(getVisibleEmployees()),
                '員工基本資料列印'
            );
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

        function sortEmployees(employees) {
            if (!state.sortField) return employees;

            return employees.sort((a, b) => {
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

        async function loadEmployees(page = 1) {
            if (!filterForm) {
                return;
            }

            hideAlert();
            renderLoadingRow();

            const params = new URLSearchParams();
            const { keyword, status, perPage } = collectFilterValues();

            state.page = Math.max(1, page);
            state.perPage = perPage;

            params.set('page', String(state.page));
            params.set('perPage', String(state.perPage));
            if (keyword !== '') {
                params.set('keyword', keyword);
            }
            if (status !== '') {
                params.set('status', status);
            }

            try {
                const response = await fetch(`api/employees/index.php?${params.toString()}`, {
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

                const employees = Array.isArray(result.data) ? result.data : [];
                employeesCache.clear();

                // 應用排序
                const sortedEmployees = sortEmployees(employees);
                renderTableRows(sortedEmployees);

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || employees.length;
                } else {
                    state.totalPages = 1;
                    state.total = employees.length;
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
                employee_number: employeeNumberInput ? employeeNumberInput.value.trim() : '',
                account: accountInput ? accountInput.value.trim() : '',
                name: nameInput ? nameInput.value.trim() : '',
                department_id: departmentInput ? departmentInput.value.trim() : '',
                job_title: jobTitleInput ? jobTitleInput.value.trim() : '',
                email: emailInput ? emailInput.value.trim() : '',
                status_lookup_id: statusLookupSelect ? statusLookupSelect.value : '',
                password: passwordInput ? passwordInput.value : '',
            };
        }

        async function openModal(mode, employee) {
            if (!modalOverlay || !modalForm) {
                return;
            }

            modalForm.reset();
            state.currentEditingId = mode === 'edit' && employee ? employee.id : null;

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯員工' : '新增員工';
            }

            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.required = mode !== 'edit';
                passwordInput.placeholder = mode === 'edit' ? '若不變更請留空' : '請輸入登入密碼';
            }

            if (passwordFieldWrapper) {
                const small = passwordFieldWrapper.querySelector('small');
                if (small) {
                    small.style.display = mode === 'edit' ? 'block' : 'none';
                }
            }

            // 載入部門列表
            await loadDepartments();

            if (employee) {
                if (employeeNumberInput) employeeNumberInput.value = employee.employee_number || '';
                if (accountInput) accountInput.value = employee.account || '';
                if (nameInput) nameInput.value = employee.name || '';
                if (departmentInput) departmentInput.value = employee.department && employee.department.id ? employee.department.id : '';
                if (jobTitleInput) jobTitleInput.value = employee.job_title || '';
                if (emailInput) emailInput.value = employee.email || '';

                // 設定狀態
                if (statusLookupSelect) {
                    statusLookupSelect.value = employee.status_lookup_id || '';
                }
            } else {
                // 新增模式的預設值
                if (statusLookupSelect) {
                    const activeOption = statusLookupSelect.querySelector('option[data-value-key="active"]');
                    if (activeOption) {
                        statusLookupSelect.value = activeOption.value;
                    }
                }
            }

            modalOverlay.classList.remove('hidden');
            setFormInitialSnapshot();
            if (employeeNumberInput) {
                employeeNumberInput.focus();
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
            if (passwordInput) {
                passwordInput.required = true;
                passwordInput.placeholder = '';
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
                loadEmployees(1);
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
                loadEmployees(1);
            });
        }

        if (headerCreateButton) {
            headerCreateButton.addEventListener('click', () => {
                hideAlert();
                openModal('create');
            });
        }

        if (batchPrintButton) {
            batchPrintButton.addEventListener('click', () => {
                const visibleEmployees = getVisibleEmployees();
                const selectedEmployees = Array.from(selectedEmployeeIds)
                    .map((id) => employeesCache.get(id))
                    .filter((employee) => !!employee);
                const printRows = selectedEmployees.length > 0 ? selectedEmployees : visibleEmployees;
                printWindowDocument(
                    buildEmployeeListPrintDocument(printRows),
                    '員工基本資料列印'
                );
            });
        }

        if (batchExportButton) {
            batchExportButton.addEventListener('click', () => {
                const visibleEmployees = getVisibleEmployees();
                const selectedEmployees = Array.from(selectedEmployeeIds)
                    .map((id) => employeesCache.get(id))
                    .filter((employee) => !!employee);
                const exportRows = selectedEmployees.length > 0 ? selectedEmployees : visibleEmployees;

                if (exportRows.length === 0) {
                    showAlert('error', '目前沒有可匯出的員工資料。');
                    return;
                }

                const csvRows = [
                    ['員工編號', '姓名', '所屬部門', '職稱', '電子郵件', '狀態', '最近登入'],
                    ...exportRows.map((employee) => {
                        const departmentName = employee.department && employee.department.name ? employee.department.name : '-';
                        return [
                            valueOrDash(employee.employee_number),
                            valueOrDash(employee.name),
                            valueOrDash(departmentName),
                            valueOrDash(employee.job_title),
                            valueOrDash(employee.email),
                            valueOrDash(employee.status_label || formatStatus(employee.status)),
                            valueOrDash(employee.last_login_at)
                        ];
                    })
                ];

                const csvContent = '\uFEFF' + csvRows
                    .map((line) => line.map((cell) => {
                        const text = String(cell ?? '');
                        if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
                            return `"${text.replace(/"/g, '""')}"`;
                        }
                        return text;
                    }).join(','))
                    .join('\r\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showAlert('success', `已匯出 ${exportRows.length} 筆員工資料。`);
            });
        }

        if (modalForm) {
            modalForm.addEventListener('input', () => {
                updateDirtyState();
            });

            modalForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const employeeNumberValue = employeeNumberInput ? employeeNumberInput.value.trim() : '';
                const accountValue = accountInput ? accountInput.value.trim() : '';
                const nameValue = nameInput ? nameInput.value.trim() : '';
                const emailValue = emailInput ? emailInput.value.trim() : '';
                const jobTitleValue = jobTitleInput ? jobTitleInput.value.trim() : '';
                const departmentValueRaw = departmentInput ? departmentInput.value.trim() : '';
                const statusLookupValue = statusLookupSelect ? statusLookupSelect.value : '';
                const passwordValue = passwordInput ? passwordInput.value : '';

                if (employeeNumberValue === '') {
                    showModalAlert('error', '請輸入員工編號。', false);
                    return;
                }

                if (accountValue === '') {
                    showModalAlert('error', '請輸入登入帳號。', false);
                    return;
                }

                if (nameValue === '') {
                    showModalAlert('error', '請輸入員工姓名。', false);
                    return;
                }

                if (emailValue === '') {
                    showModalAlert('error', '請輸入電子郵件。', false);
                    return;
                }

                const payload = {
                    employee_number: employeeNumberValue,
                    account: accountValue,
                    name: nameValue,
                    email: emailValue,
                };

                if (statusLookupValue !== '') {
                    payload.status_lookup_id = Number.parseInt(statusLookupValue, 10);
                }

                if (departmentValueRaw !== '') {
                    payload.department_id = Number.parseInt(departmentValueRaw, 10);
                }

                if (jobTitleValue !== '') {
                    payload.job_title = jobTitleValue;
                }

                if (passwordValue !== '') {
                    payload.password = passwordValue;
                }

                hideAlert();

                const isEdit = state.currentEditingId !== null;
                if (!isEdit && !payload.password) {
                    showModalAlert('error', '請輸入登入密碼。', false);
                    return;
                }

                const endpoint = isEdit ? `api/employees/update.php?id=${state.currentEditingId}` : 'api/employees/index.php';
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

                    closeModal(true);
                    showAlert('success', isEdit ? '員工資料已更新。' : '員工建立成功。');
                    if (dataSyncHelper) {
                        if (isEdit) {
                            dataSyncHelper.notifyUpdated(result.data);
                        } else {
                            dataSyncHelper.notifyCreated(result.data);
                        }
                    }
                    loadEmployees(state.page);
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
                    showAlert('error', '無法取得員工編號。');
                    return;
                }

                if (action === 'edit') {
                    hideAlert();
                    await openEditForm(id);
                } else if (action === 'delete') {
                    hideAlert();
                    await deleteEmployee(id);
                }
            });

            tableBody.addEventListener('change', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLInputElement) || target.dataset.action !== 'select-row') {
                    return;
                }

                const id = Number.parseInt(target.value || '', 10);
                if (!Number.isInteger(id)) {
                    return;
                }

                if (target.checked) {
                    selectedEmployeeIds.add(id);
                } else {
                    selectedEmployeeIds.delete(id);
                }
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

                loadEmployees(nextPage);
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
                    loadEmployees(state.page);
                });
            }
        }

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                if (!tableBody) return;
                const shouldSelectAll = selectAllCheckbox.checked;
                const checkboxes = tableBody.querySelectorAll('input[data-action="select-row"]');
                checkboxes.forEach((checkbox) => {
                    checkbox.checked = shouldSelectAll;
                    const id = Number.parseInt(checkbox.value || '', 10);
                    if (!Number.isInteger(id)) return;
                    if (shouldSelectAll) {
                        selectedEmployeeIds.add(id);
                    } else {
                        selectedEmployeeIds.delete(id);
                    }
                });
                updateSelectionUI();
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeFilterDrawer();
            }
        });

        async function openEditForm(id) {
            try {
                const response = await fetch(`api/employees/show.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error(`讀取員工資料失敗（${response.status}）`);
                }
                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error(result.message || '讀取員工資料失敗。');
                }
                employeesCache.set(result.data.id, result.data);
                openModal('edit', result.data);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '無法讀取員工資料。');
            }
        }

        async function deleteEmployee(id) {
            const confirmed = window.confirm('確認刪除此員工資料？');
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/employees/delete.php?id=${id}`, {
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

                showAlert('success', '員工資料已刪除。');
                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ id });
                }
                loadEmployees(state.page);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗，請稍後再試。');
            }
        }

        loadEmployees(1);

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('employees', {
                onRefresh: () => loadEmployees(state.page),
                debounceMs: 300
            });
        }
    }

    window.initializeEmployeesModule = initializeEmployeesModule;
})();
