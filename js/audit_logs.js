/**
 * Audit Logs Module
 * 稽核記錄模組
 */
(function() {
    'use strict';

    function initializeAuditLogsModule(container) {
        const moduleRoot = container.querySelector('[data-module="audit_logs"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        const alertBox = moduleRoot.querySelector('[data-auditlogs-alert]');
        const filterForm = moduleRoot.querySelector('[data-auditlogs-filter]');
        const tableElement = moduleRoot.querySelector('[data-auditlogs-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const selectAllCheckbox = tableElement ? tableElement.querySelector('[data-action="toggle-select-all"]') : null;
        const paginationContainer = moduleRoot.querySelector('[data-auditlogs-pagination]');
        const exportButton = moduleRoot.querySelector('.content-header [data-action="export"]');
        const deleteSelectedButton = moduleRoot.querySelector('.content-header [data-action="delete-selected"]');
        const detailModalOverlay = moduleRoot.querySelector('[data-auditlogs-detail-modal]');
        const detailModalCloseButton = detailModalOverlay ? detailModalOverlay.querySelector('[data-action="close-detail-modal"]') : null;
        const detailContent = detailModalOverlay ? detailModalOverlay.querySelector('[data-detail-content]') : null;
        const resetFilterButton = filterForm ? filterForm.querySelector('[data-action="reset-filter"]') : null;

        const auditLogsCache = new Map();
        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            selectedIds: new Set(),
            sortField: 'created_at',
            sortDirection: 'desc',
        };

        let dataSyncHelper = null;

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

    
function formatDateTime(value) {
            if (!value) {
                return '-';
            }

            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return value;
            }

            return date.toLocaleString('zh-TW', { hour12: false });
        }

        function formatEmployee(log) {
            if (!log.employee || (!log.employee.name && !log.employee.account)) {
                return '-';
            }

            const parts = [];
            if (log.employee.name) {
                parts.push(log.employee.name);
            }
            if (log.employee.account) {
                parts.push(`(${log.employee.account})`);
            }

            return parts.join(' ');
        }

        function formatDetailsPreview(details) {
            if (!details) {
                return '-';
            }

            const trimmed = details.trim();
            if (trimmed.length <= 60) {
                return trimmed;
            }
            return `${trimmed.slice(0, 57)}...`;
        }

        function renderLoadingRow() {
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">資料載入中...</td></tr>';
            }
        }

        function renderTableRows(rows) {
            if (!tableBody) {
                return;
            }

            if (!Array.isArray(rows) || rows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">尚無符合條件的資料。</td></tr>';
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = false;
                }
                updateDeleteSelectedButton();
                return;
            }

            const html = rows.map((log) => {
                auditLogsCache.set(log.id, log);
                const employeeDisplay = formatEmployee(log);
                const ipDisplay = log.ip_address || '-';
                const detailsPreview = formatDetailsPreview(log.details);
                const detailsTooltip = detailsPreview === '-' ? '檢視詳細資料' : `檢視詳細資料 - ${detailsPreview}`;

                return `
                    <tr data-id="${log.id}">
                        <td title="${escapeHtml(employeeDisplay)}">${escapeHtml(employeeDisplay)}</td>
                        <td title="${escapeHtml(log.action)}">${escapeHtml(log.action)}</td>
                        <td>${escapeHtml(log.target_table || '-')}</td>
                        <td>${escapeHtml(ipDisplay)}</td>
                        <td>${escapeHtml(formatDateTime(log.created_at))}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text" data-action="view-details" title="${escapeHtml(detailsTooltip)}" aria-label="檢視操作日誌 ${log.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;
            updateSelectAllCheckbox();
            updateDeleteSelectedButton();
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

        function updateDeleteSelectedButton() {
            if (!deleteSelectedButton) {
                return;
            }

            deleteSelectedButton.disabled = state.selectedIds.size === 0;
        }

        function updateSelectAllCheckbox() {
            if (!selectAllCheckbox || !tableBody) {
                return;
            }

            const rowCheckboxes = tableBody.querySelectorAll('input[data-role="row-checkbox"]');
            if (rowCheckboxes.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
                return;
            }

            let checkedCount = 0;
            rowCheckboxes.forEach((checkbox) => {
                if (checkbox.checked) {
                    checkedCount += 1;
                }
            });

            if (checkedCount === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            } else if (checkedCount === rowCheckboxes.length) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            }
        }

        function updateSortIndicators() {
            if (!tableElement) {
                return;
            }

            const sortableHeaders = tableElement.querySelectorAll('th[data-sort]');
            sortableHeaders.forEach((header) => {
                header.classList.remove('sort-asc', 'sort-desc');
            });

            if (!state.sortField) {
                return;
            }

            const activeHeader = tableElement.querySelector(`th[data-sort="${state.sortField}"]`);
            if (activeHeader) {
                activeHeader.classList.add(state.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        }

        function collectFilterValues() {
            if (!filterForm) {
                return {
                    keyword: '',
                    perPage: state.perPage,
                };
            }

            const formData = new FormData(filterForm);
            const rawKeyword = formData.get('keyword');
            const rawPerPage = formData.get('perPage');

            const keyword = rawKeyword ? rawKeyword.toString().trim() : '';
            const perPageValue = rawPerPage ? Number.parseInt(rawPerPage.toString(), 10) : Number.NaN;
            const perPage = Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10;

            return { keyword, perPage };
        }

        async function loadAuditLogs(page = 1) {
            if (!filterForm) {
                return;
            }

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
                const response = await fetch(`api/audit_logs/index.php?${params.toString()}`, {
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

                const logs = Array.isArray(result.data) ? result.data : [];
                const currentIds = new Set(logs.map((log) => log.id));
                state.selectedIds = new Set([...state.selectedIds].filter((id) => currentIds.has(id)));

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || logs.length;
                } else {
                    state.totalPages = 1;
                    state.total = logs.length;
                }

                renderTableRows(logs);
                renderPagination();
                updateSortIndicators();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入失敗，請稍後再試。');
                renderTableRows([]);
            }
        }

        function openDetailModal(log) {
            if (!detailModalOverlay || !detailContent) {
                return;
            }

            const detailFields = detailContent.querySelectorAll('[data-detail-field]');
            detailFields.forEach((field) => {
                const element = field;
                if (!(element instanceof HTMLElement)) {
                    return;
                }
                const key = element.getAttribute('data-detail-field');
                if (!key) {
                    return;
                }

                switch (key) {
                    case 'id':
                        element.textContent = String(log.id);
                        break;
                    case 'employee':
                        element.textContent = formatEmployee(log);
                        break;
                    case 'action':
                        element.textContent = log.action || '-';
                        break;
                    case 'target_table':
                        element.textContent = log.target_table || '-';
                        break;
                    case 'target_id':
                        element.textContent = log.target_id !== null && log.target_id !== undefined ? String(log.target_id) : '-';
                        break;
                    case 'ip_address':
                        element.textContent = log.ip_address || '-';
                        break;
                    case 'created_at':
                        element.textContent = formatDateTime(log.created_at);
                        break;
                    case 'details':
                        if (log.details) {
                            try {
                                const parsed = JSON.parse(log.details);
                                element.textContent = JSON.stringify(parsed, null, 2);
                            } catch (parseError) {
                                element.textContent = log.details;
                            }
                        } else {
                            element.textContent = '-';
                        }
                        break;
                    default:
                        element.textContent = log[key] || '-';
                }
            });

            detailModalOverlay.classList.remove('hidden');
        }

        function closeDetailModal() {
            if (!detailModalOverlay) {
                return;
            }

            detailModalOverlay.classList.add('hidden');
        }

        async function deleteSelectedLogs() {
            if (state.selectedIds.size === 0) {
                showAlert('error', '請先選擇要刪除的日誌。');
                return;
            }

            const confirmed = await window.AppFeedback.confirm({ title: '刪除操作日誌', message: `確認刪除選取的 ${state.selectedIds.size} 筆操作日誌？`, impact: '稽核追溯資料' });
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch('api/audit_logs/delete.php', {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ ids: Array.from(state.selectedIds) }),
                });

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '刪除失敗，請稍後再試。');
                }

                const deletedIds = Array.from(state.selectedIds);
                showAlert('success', result.message || '已刪除選取的操作日誌。');
                state.selectedIds.clear();
                if (dataSyncHelper) {
                    dataSyncHelper.notifyBulkUpdated({ ids: deletedIds });
                }
                loadAuditLogs(state.page);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗，請稍後再試。');
            }
        }

        async function exportAuditLogs() {
            if (!filterForm) {
                return;
            }

            hideAlert();

            const { keyword } = collectFilterValues();
            const params = new URLSearchParams();
            if (keyword !== '') {
                params.set('keyword', keyword);
            }
            if (state.sortField) {
                params.set('sortField', state.sortField);
                params.set('sortDirection', state.sortDirection);
            }

            const queryString = params.toString();
            const exportUrl = queryString ? `api/audit_logs/export.php?${queryString}` : 'api/audit_logs/export.php';

            if (exportButton) {
                exportButton.disabled = true;
            }

            try {
                const response = await fetch(exportUrl, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    const contentType = response.headers.get('Content-Type') || '';
                    if (contentType.includes('application/json')) {
                        const errorData = await response.json();
                        const message = errorData && typeof errorData === 'object' && 'message' in errorData
                            ? String(errorData.message)
                            : null;
                        throw new Error(message || `匯出失敗（${response.status}）`);
                    }

                    const errorText = await response.text();
                    throw new Error(errorText || `匯出失敗（${response.status}）`);
                }

                const contentType = response.headers.get('Content-Type') || '';
                if (contentType.includes('application/json')) {
                    const result = await response.json();
                    throw new Error(result && result.message ? result.message : '匯出失敗，請稍後再試。');
                }

                const blob = await response.blob();
                const disposition = response.headers.get('Content-Disposition') || '';
                let filename = 'audit_logs_export.csv';
                const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
                if (match) {
                    const encoded = match[1] || match[2];
                    try {
                        filename = decodeURIComponent(encoded);
                    } catch (decodeError) {
                        filename = encoded;
                    }
                }

                const downloadUrl = window.URL.createObjectURL(blob);
                const tempLink = document.createElement('a');
                tempLink.href = downloadUrl;
                tempLink.download = filename;
                document.body.appendChild(tempLink);
                tempLink.click();
                tempLink.remove();
                window.URL.revokeObjectURL(downloadUrl);
                showAlert('success', '匯出檔案已開始下載。');
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '匯出失敗，請稍後再試。');
            } finally {
                if (exportButton) {
                    exportButton.disabled = false;
                }
            }
        }

        if (filterForm) {
            filterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                loadAuditLogs(1);
            });
        }

        if (resetFilterButton && filterForm) {
            resetFilterButton.addEventListener('click', () => {
                filterForm.reset();
                if (filterForm.elements.perPage) {
                    filterForm.elements.perPage.value = '10';
                }
                loadAuditLogs(1);
            });
        }

        if (exportButton) {
            exportButton.addEventListener('click', () => {
                exportAuditLogs();
            });
        }

        if (deleteSelectedButton) {
            deleteSelectedButton.addEventListener('click', () => {
                deleteSelectedLogs();
            });
        }

        if (detailModalOverlay) {
            detailModalOverlay.addEventListener('click', (event) => {
                if (event.target === detailModalOverlay) {
                    closeDetailModal();
                }
            });
        }

        if (detailModalCloseButton) {
            detailModalCloseButton.addEventListener('click', closeDetailModal);
        }

        if (tableElement) {
            const sortableHeaders = tableElement.querySelectorAll('th[data-sort]');
            sortableHeaders.forEach((header) => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    const sortField = header.getAttribute('data-sort');
                    if (!sortField) {
                        return;
                    }

                    if (state.sortField === sortField) {
                        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        state.sortField = sortField;
                        state.sortDirection = 'asc';
                    }

                    updateSortIndicators();
                    loadAuditLogs(1);
                });
            });

            updateSortIndicators();
        }

        if (tableBody) {
            tableBody.addEventListener('change', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLInputElement)) {
                    return;
                }

                if (target.dataset.role === 'row-checkbox') {
                    const row = target.closest('tr');
                    if (!row) {
                        return;
                    }

                    const id = Number.parseInt(row.getAttribute('data-id') || '', 10);
                    if (!Number.isInteger(id)) {
                        return;
                    }

                    if (target.checked) {
                        state.selectedIds.add(id);
                    } else {
                        state.selectedIds.delete(id);
                    }

                    updateSelectAllCheckbox();
                    updateDeleteSelectedButton();
                }
            });

            tableBody.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const actionElement = target.closest('[data-action]');
                const action = actionElement ? actionElement.getAttribute('data-action') : null;
                if (!action) {
                    return;
                }

                const row = target.closest('tr');
                if (!row) {
                    return;
                }

                const id = Number.parseInt(row.getAttribute('data-id') || '', 10);
                if (!Number.isInteger(id)) {
                    showAlert('error', '無法取得日誌編號。');
                    return;
                }

                if (action === 'view-details') {
                    const log = auditLogsCache.get(id);
                    if (log) {
                        openDetailModal(log);
                    }
                }
            });
        }

        if (selectAllCheckbox && tableBody) {
            selectAllCheckbox.addEventListener('change', () => {
                const shouldSelectAll = selectAllCheckbox.checked;
                const rowCheckboxes = tableBody.querySelectorAll('input[data-role="row-checkbox"]');
                rowCheckboxes.forEach((checkbox) => {
                    checkbox.checked = shouldSelectAll;
                    const row = checkbox.closest('tr');
                    if (!row) {
                        return;
                    }
                    const id = Number.parseInt(row.getAttribute('data-id') || '', 10);
                    if (!Number.isInteger(id)) {
                        return;
                    }

                    if (shouldSelectAll) {
                        state.selectedIds.add(id);
                    } else {
                        state.selectedIds.delete(id);
                    }
                });

                updateSelectAllCheckbox();
                updateDeleteSelectedButton();
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

                loadAuditLogs(nextPage);
            });
        }

        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('audit_logs', {
                onRefresh: () => loadAuditLogs(state.page)
            });
        }

        loadAuditLogs(1);
    }

    window.initializeAuditLogsModule = initializeAuditLogsModule;
})();
