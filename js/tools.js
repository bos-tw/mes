/**
 * Tools Module
 * 工具/載具管理模組
 */
(function() {
    'use strict';

    function initializeToolsModule(container) {
        const moduleRoot = container.querySelector('[data-module="tools"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        const alertBox = moduleRoot.querySelector('[data-tools-alert]');
        const filterForm = moduleRoot.querySelector('[data-tools-filter]');
        const tableElement = moduleRoot.querySelector('[data-tools-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-tools-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-tools-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-tools-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-tools-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');

        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const printButton = moduleRoot.querySelector('.content-header [data-action="print"]');

        const toolNumberInput = modalForm ? modalForm.querySelector('input[name="tool_number"]') : null;
        const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
        const typeInput = modalForm ? modalForm.querySelector('input[name="type"]') : null;
        const statusSelect = modalForm ? modalForm.querySelector('select[name="status"]') : null;
        const currentLocationInput = modalForm ? modalForm.querySelector('input[name="current_location"]') : null;
        const weightInput = modalForm ? modalForm.querySelector('input[name="weight_kg"]') : null;
        const capacityInput = modalForm ? modalForm.querySelector('input[name="capacity_kg"]') : null;

        const toolsCache = new Map();
        const numericSortFields = new Set(['id', 'weight_kg', 'capacity_kg']);
        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            currentEditingId: null,
            formInitialSnapshot: null,
            sortField: null,
            sortDirection: 'asc',
        };
        let isFormDirty = false;

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

        async function initializeLookupSelects() {
            const filterStatusSelect = filterForm ? filterForm.querySelector('select[name="status"]') : null;
            if (filterStatusSelect && filterStatusSelect.hasAttribute('data-lookup-domain')) {
                await populateSelectOptions(filterStatusSelect, 'TOOL_STATUS');
            }

            const formStatusSelect = modalForm ? modalForm.querySelector('select[name="status_lookup_id"]') : null;
            if (formStatusSelect && formStatusSelect.hasAttribute('data-lookup-domain')) {
                await populateSelectOptions(formStatusSelect, 'TOOL_STATUS');
            }
        }

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
                console.warn(`tools: 欄位不存在 - ${name}`);
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

    
function formatNumber(value) {
            if (value === null || value === undefined || Number.isNaN(Number(value))) {
                return '-';
            }
            return Number(value).toFixed(2);
        }

        function formatDateTime(value) {
            return value && value !== '' ? value : '-';
        }

        function formatStatus(status) {
            switch (status) {
                case 'available':
                    return '可用';
                case 'in_use':
                    return '使用中';
                case 'maintenance':
                    return '維修中';
                case 'retired':
                    return '已退役';
                default:
                    return status || '-';
            }
        }

        function setFormInitialSnapshot() {
            state.formInitialSnapshot = getFormSnapshot();
            isFormDirty = false;
        }

        function getFormSnapshot() {
            if (!modalForm) {
                return {};
            }

            return {
                tool_number: toolNumberInput ? toolNumberInput.value.trim() : '',
                name: nameInput ? nameInput.value.trim() : '',
                type: typeInput ? typeInput.value.trim() : '',
                status: statusSelect ? statusSelect.value : 'available',
                current_location: currentLocationInput ? currentLocationInput.value.trim() : '',
                weight_kg: weightInput ? weightInput.value.trim() : '',
                capacity_kg: capacityInput ? capacityInput.value.trim() : '',
            };
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

        function renderLoadingRow() {
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="10" class="text-center">資料載入中...</td></tr>';
            }
        }

        function updateSortIndicators() {
            if (!tableElement) {
                return;
            }

            const allHeaders = tableElement.querySelectorAll('th[data-sort]');
            allHeaders.forEach(header => header.classList.remove('sort-asc', 'sort-desc'));

            if (state.sortField) {
                const currentHeader = tableElement.querySelector(`th[data-sort="${state.sortField}"]`);
                if (currentHeader) {
                    currentHeader.classList.add(state.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            }
        }

        function getSortValue(tool, field) {
            if (!field) {
                return null;
            }
            return tool[field];
        }

        function sortTools(tools) {
            if (!state.sortField) {
                return tools;
            }

            const field = state.sortField;
            const direction = state.sortDirection === 'asc' ? 1 : -1;

            return tools.sort((a, b) => {
                const aValue = getSortValue(a, field);
                const bValue = getSortValue(b, field);

                if (aValue == null && bValue == null) {
                    return 0;
                }
                if (aValue == null) {
                    return 1;
                }
                if (bValue == null) {
                    return -1;
                }

                if (numericSortFields.has(field)) {
                    const aNum = Number(aValue);
                    const bNum = Number(bValue);
                    if (Number.isNaN(aNum) && Number.isNaN(bNum)) {
                        return 0;
                    }
                    if (Number.isNaN(aNum)) {
                        return direction;
                    }
                    if (Number.isNaN(bNum)) {
                        return -direction;
                    }
                    return (aNum - bNum) * direction;
                }

                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
                return aStr.localeCompare(bStr) * direction;
            });
        }

        function renderTableRows(rows) {
            if (!tableBody) {
                return;
            }

            if (!rows || rows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="10" class="text-center">尚無符合條件的資料。</td></tr>';
                return;
            }

            const html = rows.map((tool) => {
                toolsCache.set(tool.id, tool);
                return `
                    <tr data-id="${tool.id}">
                        <td>${escapeHtml(tool.tool_number)}</td>
                        <td>${escapeHtml(tool.name)}</td>
                        <td>${escapeHtml(tool.type || '-')}</td>
                        <td>${escapeHtml(tool.status_label || formatStatus(tool.status))}</td>
                        <td>${escapeHtml(tool.current_location || '-')}</td>
                        <td>${formatNumber(tool.weight_kg)}</td>
                        <td>${formatNumber(tool.capacity_kg)}</td>
                        <td>${formatDateTime(tool.updated_at)}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text" data-action="edit" title="修改"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn text danger" data-action="delete" title="刪除"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;

            // 通知欄位管理器表格已更新
            const manager = window.toolColumnManager;
            if (manager && typeof manager.onTableUpdated === 'function') {
                manager.onTableUpdated();
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
                <span>第 ${state.page} / ${state.totalPages} 頁，共 ${state.total} 筆資料</span>
                <button type="button" data-page="${state.page + 1}" ${nextDisabled}>下一頁</button>
            `;
        }

        async function loadTools(page = 1) {
            if (!filterForm) {
                return;
            }

            hideAlert();
            renderLoadingRow();

            const formData = new FormData(filterForm);
            const params = new URLSearchParams();
            const keyword = (formData.get('keyword') || '').toString().trim();
            const statusValue = (formData.get('status') || '').toString().trim();
            const typeValue = (formData.get('type') || '').toString().trim();
            const perPageValue = parseInt((formData.get('perPage') || '10').toString(), 10);

            state.page = Math.max(1, page);
            state.perPage = Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10;

            params.set('page', String(state.page));
            params.set('perPage', String(state.perPage));
            if (keyword !== '') {
                params.set('keyword', keyword);
            }
            if (statusValue !== '') {
                params.set('status', statusValue);
            }
            if (typeValue !== '') {
                params.set('type', typeValue);
            }

            try {
                const response = await fetch(`api/tools/index.php?${params.toString()}`, {
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

                const tools = Array.isArray(result.data) ? result.data : [];
                toolsCache.clear();

                const sortedTools = sortTools(tools);
                renderTableRows(sortedTools);

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || tools.length;
                } else {
                    state.totalPages = 1;
                    state.total = tools.length;
                }

                renderPagination();
                updateSortIndicators();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入失敗，請稍後再試。');
                renderTableRows([]);
            }
        }

        async function openModal(mode, tool) {
            if (!modalOverlay || !modalForm) {
                return;
            }

            modalForm.reset();
            state.currentEditingId = mode === 'edit' && tool ? tool.id : null;

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯載具' : '新增載具';
            }

            if (tool) {
                if (toolNumberInput) toolNumberInput.value = tool.tool_number || '';
                if (nameInput) nameInput.value = tool.name || '';
                if (typeInput) typeInput.value = tool.type || '';

                const formStatusSelect = modalForm ? modalForm.querySelector('select[name="status_lookup_id"]') : null;
                if (formStatusSelect) {
                    formStatusSelect.value = tool.status_lookup_id || '';
                } else if (statusSelect) {
                    statusSelect.value = tool.status || 'available';
                }

                if (currentLocationInput) currentLocationInput.value = tool.current_location || '';
                if (weightInput) weightInput.value = tool.weight_kg != null ? String(tool.weight_kg) : '';
                if (capacityInput) capacityInput.value = tool.capacity_kg != null ? String(tool.capacity_kg) : '';
            } else {
                const formStatusSelect = modalForm ? modalForm.querySelector('select[name="status_lookup_id"]') : null;
                if (formStatusSelect) {
                    const availableOption = formStatusSelect.querySelector('option[data-value-key="available"]');
                    if (availableOption) {
                        formStatusSelect.value = availableOption.value;
                    }
                } else if (statusSelect) {
                    statusSelect.value = 'available';
                }
            }

            modalOverlay.classList.remove('hidden');
            setFormInitialSnapshot();

            if (toolNumberInput) {
                toolNumberInput.focus();
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

        async function openEditForm(id) {
            try {
                const response = await fetch(`api/tools/update.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error(`讀取載具資料失敗（${response.status}）`);
                }
                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error(result.message || '讀取載具資料失敗。');
                }
                toolsCache.set(result.data.id, result.data);
                openModal('edit', result.data);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '無法讀取載具資料。');
            }
        }

        async function deleteTool(id) {
            const confirmed = await window.AppFeedback.confirm({ title: '刪除載具', message: '確認刪除此載具資料？', impact: '工單、庫存與出貨載具資料' });
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/tools/update.php?id=${id}`, {
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

                showAlert('success', '載具資料已刪除。');
                // 通知 DataSync 資料已刪除
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('tools', DataSync.EVENT_TYPES.DELETED, { id });
                }
                loadTools(state.page);
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
                loadTools(1);
            });
        }

        if (resetFilterButton && filterForm) {
            resetFilterButton.addEventListener('click', () => {
                filterForm.reset();
                if ('perPage' in filterForm.elements) {
                    filterForm.elements.perPage.value = '10';
                }
                loadTools(1);
            });
        }

        if (headerCreateButton) {
            headerCreateButton.addEventListener('click', () => {
                hideAlert();
                openModal('create');
            });
        }

        if (printButton) {
            printButton.addEventListener('click', () => window.print());
        }

        if (modalForm) {
            modalForm.addEventListener('input', () => {
                updateDirtyState();
            });

            modalForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const toolNumberValue = toolNumberInput ? toolNumberInput.value.trim() : '';
                const nameValue = nameInput ? nameInput.value.trim() : '';
                const typeValue = typeInput ? typeInput.value.trim() : '';
                const statusValue = statusSelect ? statusSelect.value : 'available';
                const currentLocationValue = currentLocationInput ? currentLocationInput.value.trim() : '';
                const weightValue = weightInput ? weightInput.value.trim() : '';
                const capacityValue = capacityInput ? capacityInput.value.trim() : '';

                if (toolNumberValue === '') {
                    showModalAlert('error', '請輸入載具編號。', false);
                    return;
                }

                if (nameValue === '') {
                    showModalAlert('error', '請輸入載具名稱。', false);
                    return;
                }

                if (weightValue === '') {
                    showModalAlert('error', '請輸入載具重量。', false);
                    return;
                }

                const payload = {
                    tool_number: toolNumberValue,
                    name: nameValue,
                    type: typeValue,
                    status: statusValue,
                    current_location: currentLocationValue,
                    weight_kg: weightValue,
                    capacity_kg: capacityValue,
                };

                hideAlert();

                const isEdit = state.currentEditingId !== null;
                const endpoint = isEdit ? `api/tools/update.php?id=${state.currentEditingId}` : 'api/tools/index.php';
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
                    showAlert('success', isEdit ? '載具資料已更新。' : '載具建立成功。');
                    // 通知 DataSync 資料已變更
                    if (typeof DataSync !== 'undefined') {
                        const eventType = isEdit ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED;
                        DataSync.notifyWithDependencies('tools', eventType, result.data);
                    }
                    loadTools(isEdit ? state.page : 1);
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
                    showAlert('error', '無法取得載具編號。');
                    return;
                }

                if (action === 'edit') {
                    hideAlert();
                    await openEditForm(id);
                } else if (action === 'delete') {
                    hideAlert();
                    await deleteTool(id);
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

                loadTools(nextPage);
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

                    if (state.sortField === sortField) {
                        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        state.sortField = sortField;
                        state.sortDirection = 'asc';
                    }

                    loadTools(state.page);
                });
            }
        }

        loadTools(1);

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('tools', {
                onRefresh: () => loadTools(state.page),
                debounceMs: 300
            });
        }
    }

    window.initializeToolsModule = initializeToolsModule;
})();
