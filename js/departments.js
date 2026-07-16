/**
 * Departments Module
 * 部門管理模組
 */
(function() {
    'use strict';

    function initializeDepartmentsModule(container) {
        const moduleRoot = container.querySelector('[data-module="departments"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        const alertBox = moduleRoot.querySelector('[data-departments-alert]');
        const filterForm = moduleRoot.querySelector('[data-departments-filter]');
        const tableElement = moduleRoot.querySelector('[data-departments-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-departments-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-departments-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-departments-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-departments-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');

        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const printButton = moduleRoot.querySelector('.content-header [data-action="print"]');

        const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
        const parentInput = modalForm ? modalForm.querySelector('input[name="parent_department_id"]') : null;

        const departmentsCache = new Map();
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

        // Modal 內部錯誤訊息顯示
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
                console.warn(`departments: 欄位不存在 - ${name}`);
            }
        }

        function formatDateTime(value) {
            return value && value !== '' ? value : '-';
        }

        function getVisibleDepartments() {
            return Array.from(departmentsCache.values());
        }

        function valueOrDash(value) {
            if (value === null || value === undefined || String(value).trim() === '') {
                return '-';
            }

            return String(value);
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

        function sortDepartments(departments) {
            if (!state.sortField) return departments;

            return departments.sort((a, b) => {
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

        function renderLoadingRow() {
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">資料載入中...</td></tr>';
            }
        }

        function renderTableRows(rows) {
            if (!tableBody) {
                return;
            }

            if (!rows || rows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">尚無符合條件的資料。</td></tr>';
                return;
            }

            const html = rows.map((department) => {
                const departmentId = Number.parseInt(department.id, 10);
                departmentsCache.set(departmentId, department);
                const parentName = department.parent && department.parent.name ? department.parent.name : '-';

                return `
                    <tr data-id="${departmentId}">
                        <td>${escapeHtml(department.name)}</td>
                        <td>${escapeHtml(parentName)}</td>
                        <td>${escapeHtml(formatDateTime(department.created_at))}</td>
                        <td>${escapeHtml(formatDateTime(department.updated_at))}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text" data-action="edit" title="修改"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn text danger" data-action="delete" title="刪除"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;
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

        function buildDepartmentListPrintDocument(departments) {
            const rows = departments.map((department, index) => {
                const parentName = department.parent && department.parent.name ? department.parent.name : '';

                return `
                    <tr>
                        <td class="text-center">${escapeHtml(String(index + 1))}</td>
                        <td>${escapeHtml(valueOrDash(department.name))}</td>
                        <td>${escapeHtml(valueOrDash(parentName))}</td>
                        <td>${escapeHtml(formatDateTime(department.created_at))}</td>
                        <td>${escapeHtml(formatDateTime(department.updated_at))}</td>
                    </tr>
                `;
            }).join('');

            const bodyHtml = departments.length === 0
                ? '<p class="text-center">沒有可列印的部門資料。</p>'
                : `<table>
                    <thead>
                        <tr>
                            <th>序號</th>
                            <th>部門名稱</th>
                            <th>上級部門</th>
                            <th>建立時間</th>
                            <th>更新時間</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>`;

            return buildPrintShell('部門基本資料', bodyHtml, `
                <span>筆數：${departments.length}</span>
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
                buildDepartmentListPrintDocument(getVisibleDepartments()),
                '部門基本資料列印'
            );
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
                <span>第 ${state.page} / ${state.totalPages} 頁，共 ${state.total} 筆</span>
                <button type="button" data-page="${state.page + 1}" ${nextDisabled}>下一頁</button>
            `;
        }

        async function loadDepartments(page = 1) {
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
                const response = await fetch(`api/departments/index.php?${params.toString()}`, {
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

                const departments = Array.isArray(result.data) ? result.data : [];
                departmentsCache.clear();

                // 應用排序
                const sortedDepartments = sortDepartments(departments);
                renderTableRows(sortedDepartments);

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || departments.length;
                } else {
                    state.totalPages = 1;
                    state.total = departments.length;
                }

                renderPagination();
                updateSortIndicators();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入失敗，請稍後再試。');
                renderTableRows([]);
            }
        }

        async function openEditModal(id) {
            try {
                const response = await fetch(`api/departments/show.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`讀取部門資料失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error(result.message || '讀取部門資料失敗。');
                }

                departmentsCache.set(result.data.id, result.data);
                openModal('edit', result.data);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '無法讀取部門資料。');
            }
        }

        async function deleteDepartment(id) {
            const confirmed = await window.AppFeedback.confirm({ title: '刪除部門', message: '確認刪除此部門資料？', impact: '員工與組織歸屬資料' });
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/departments/delete.php?id=${id}`, {
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

                showAlert('success', '部門資料已刪除。');
                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ id });
                }
                loadDepartments(state.page);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗，請稍後再試。');
            }
        }

        function openModal(mode, data = null) {
            if (!modalOverlay || !modalForm || !modalTitle) {
                return;
            }

            state.currentEditingId = mode === 'edit' && data ? data.id : null;

            if (mode === 'create') {
                modalTitle.textContent = '新增部門';
                modalForm.reset();
            } else if (mode === 'edit' && data) {
                modalTitle.textContent = '修改部門';
                if (nameInput) nameInput.value = data.name || '';
                if (parentInput) parentInput.value = data.parent?.id || '';
            }

            state.formInitialSnapshot = new FormData(modalForm);
            isFormDirty = false;
            modalOverlay.classList.remove('hidden');
            if (nameInput) nameInput.focus();
        }

        function closeModal() {
            if (!modalOverlay) {
                return;
            }

            modalOverlay.classList.add('hidden');
            hideModalAlert();
            state.currentEditingId = null;
            state.formInitialSnapshot = null;
            isFormDirty = false;
        }

        async function submitForm() {
            if (!modalForm) {
                return;
            }

            const formData = new FormData(modalForm);
            const payload = {};

            for (const [key, value] of formData.entries()) {
                const trimmedValue = value.toString().trim();
                payload[key] = trimmedValue === '' ? null : trimmedValue;
            }

            const isEdit = state.currentEditingId !== null;
            const url = isEdit ? `api/departments/update.php?id=${state.currentEditingId}` : 'api/departments/index.php';
            const method = isEdit ? 'PUT' : 'POST';

            try {
                let requestOptions = {
                    method: method,
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(payload),
                };

                if (method === 'PUT') {
                    requestOptions = {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json',
                        },
                        body: new URLSearchParams({
                            ...payload,
                            _method: 'PUT'
                        }),
                    };
                }

                const response = await fetch(url, requestOptions);
                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || '操作失敗，請稍後再試。');
                }

                const message = isEdit ? '部門資料已更新。' : '部門資料已建立。';
                showAlert('success', message);
                if (dataSyncHelper) {
                    if (isEdit) {
                        dataSyncHelper.notifyUpdated(result.data);
                    } else {
                        dataSyncHelper.notifyCreated(result.data);
                    }
                }
                closeModal();
                loadDepartments(state.page);
            } catch (error) {
                console.error(error);
                showModalAlert('error', error.message || '操作失敗，請稍後再試。', false);
            }
        }

        // 事件監聽器設置
        if (headerCreateButton) {
            headerCreateButton.addEventListener('click', () => openModal('create'));
        }

        if (printButton) {
            printButton.addEventListener('click', handlePrintList);
        }

        if (modalCloseButton) {
            modalCloseButton.addEventListener('click', closeModal);
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', closeModal);
        }

        if (modalForm) {
            modalForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await submitForm();
            });
        }

        if (filterForm) {
            filterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                loadDepartments(1);
            });
        }

        if (resetFilterButton) {
            resetFilterButton.addEventListener('click', () => {
                if (filterForm) {
                    filterForm.reset();
                    loadDepartments(1);
                }
            });
        }

        if (tableBody) {
            tableBody.addEventListener('click', (event) => {
                const target = event.target.closest('button[data-action]');
                if (!target) return;

                const action = target.dataset.action;
                const row = target.closest('tr');
                const id = row ? parseInt(row.dataset.id, 10) : null;

                if (!id) return;

                switch (action) {
                    case 'edit':
                        openEditModal(id);
                        break;
                    case 'delete':
                        deleteDepartment(id);
                        break;
                }
            });
        }

        if (paginationContainer) {
            paginationContainer.addEventListener('click', (event) => {
                const target = event.target.closest('button[data-page]');
                if (!target) return;

                const page = parseInt(target.dataset.page, 10);
                if (page >= 1 && page <= state.totalPages) {
                    loadDepartments(page);
                }
            });
        }

        if (tableElement) {
            const headers = tableElement.querySelectorAll('th[data-sort]');
            headers.forEach(header => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', function() {
                    const sortField = this.getAttribute('data-sort');
                    if (sortField) {
                        if (state.sortField === sortField) {
                            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                        } else {
                            state.sortField = sortField;
                            state.sortDirection = 'asc';
                        }
                        loadDepartments();
                    }
                });
            });
        }

        loadDepartments(1);

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('departments', {
                onRefresh: () => loadDepartments(state.page),
                debounceMs: 300
            });
        }
    }

    window.initializeDepartmentsModule = initializeDepartmentsModule;
})();
