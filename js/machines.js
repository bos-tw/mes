/**
 * Machines Module
 * 機台管理模組
 */
(function() {
    'use strict';

    function initializeMachinesModule(container) {
        const moduleRoot = container.querySelector('[data-module="machines"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        const alertBox = moduleRoot.querySelector('[data-machines-alert]');
        const filterForm = moduleRoot.querySelector('[data-machines-filter]');
        const tableElement = moduleRoot.querySelector('[data-machines-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-machines-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-machines-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-machines-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-machines-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');

        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const printButton = moduleRoot.querySelector('.content-header [data-action="print"]');

        const filterStatusSelect = filterForm ? filterForm.querySelector('select[name="status_lookup_id"]') : null;
        const filterDepartmentSelect = filterForm ? filterForm.querySelector('select[name="department_id"]') : null;
        const filterCapabilitySelect = filterForm ? filterForm.querySelector('select[name="machine_capability_id"]') : null;

        const machineNumberInput = modalForm ? modalForm.querySelector('input[name="machine_number"]') : null;
        const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
        const modelInput = modalForm ? modalForm.querySelector('input[name="model"]') : null;
        const departmentSelect = modalForm ? modalForm.querySelector('select[name="department_id"]') : null;
        const statusSelect = modalForm ? modalForm.querySelector('select[name="status_lookup_id"]') : null;
        const purchaseDateInput = modalForm ? modalForm.querySelector('input[name="purchase_date"]') : null;
        const lensCountInput = modalForm ? modalForm.querySelector('input[name="lens_count"]') : null;
        const lengthInput = modalForm ? modalForm.querySelector('input[name="length_mm"]') : null;
        const threadDiameterInput = modalForm ? modalForm.querySelector('input[name="thread_outer_diameter_mm"]') : null;
        const notesTextarea = modalForm ? modalForm.querySelector('textarea[name="notes"]') : null;
        const capabilitySelect = modalForm ? modalForm.querySelector('select[name="machine_capability_id"]') : null;

        const machinesCache = new Map();
        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            currentEditingId: null,
            formSnapshot: null,
        };

        let isFormDirty = false;
        let cachedDepartments = null;
        let cachedCapabilities = null;

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

        function setFieldValue(name, value) {
            if (!modalForm) {
                return;
            }

            const field = modalForm.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value || '';
            } else {
                console.warn(`machines: 欄位不存在 - ${name}`);
            }
        }

    
function formatDecimal(value) {
            if (value === null || value === undefined || value === '') {
                return '-';
            }

            const numericValue = Number(value);
            if (Number.isNaN(numericValue)) {
                return '-';
            }

            return numericValue.toFixed(2);
        }

        function formatInteger(value) {
            if (value === null || value === undefined || value === '') {
                return '-';
            }

            const numericValue = Number(value);
            if (Number.isNaN(numericValue)) {
                return '-';
            }

            return String(numericValue);
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

        function renderLoadingRow() {
            if (!tableBody) {
                return;
            }

            tableBody.innerHTML = '<tr><td colspan="11" class="text-center">資料載入中...</td></tr>';
        }

        function renderEmptyState() {
            if (!tableBody) {
                return;
            }

            tableBody.innerHTML = '<tr><td colspan="11" class="text-center">尚無符合條件的資料。</td></tr>';
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

        function renderTableRows(rows) {
            if (!tableBody) {
                return;
            }

            if (!rows || rows.length === 0) {
                renderEmptyState();
                return;
            }

            const html = rows.map((machine) => {
                machinesCache.set(machine.id, machine);
                const statusText = machine.status_label || machine.status_key || '-';
                return `
                    <tr data-id="${escapeHtml(machine.id)}">
                        <td>${escapeHtml(machine.machine_number || '-')}</td>
                        <td>${escapeHtml(machine.name || '-')}</td>
                        <td>${escapeHtml(machine.model || '-')}</td>
                        <td>${escapeHtml(machine.department_name || '-')}</td>
                        <td>${escapeHtml(machine.capability_names || '-')}</td>
                        <td>${formatInteger(machine.lens_count)}</td>
                        <td>${formatDecimal(machine.length_mm)}</td>
                        <td>${formatDecimal(machine.thread_outer_diameter_mm)}</td>
                        <td>${escapeHtml(statusText)}</td>
                        <td>${formatDateTime(machine.updated_at)}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text" data-action="edit" title="修改"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn text danger" data-action="delete" title="刪除"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;
        }

        async function readJsonResponse(response, fallbackMessage) {
            const raw = await response.text();
            if (!raw || raw.trim() === '') {
                throw new Error(`${fallbackMessage}（伺服器未回傳內容，HTTP ${response.status}）`);
            }

            try {
                return JSON.parse(raw);
            } catch (error) {
                console.error('machines: 非 JSON 回應內容', raw);
                throw new Error(`${fallbackMessage}（伺服器回應格式錯誤，HTTP ${response.status}）`);
            }
        }

        async function fetchDepartments() {
            if (cachedDepartments !== null) {
                return cachedDepartments;
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
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await readJsonResponse(response, '載入部門列表失敗');
                cachedDepartments = Array.isArray(result.data) ? result.data : [];
            } catch (error) {
                console.error('載入部門列表時發生錯誤：', error);
                cachedDepartments = [];
            }

            return cachedDepartments;
        }

        async function fetchCapabilities() {
            if (cachedCapabilities !== null) {
                return cachedCapabilities;
            }

            try {
                const response = await fetch('api/machine_capabilities/index.php?perPage=1000&active_only=1', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await readJsonResponse(response, '載入機台能力失敗');
                cachedCapabilities = Array.isArray(result.data) ? result.data : [];
            } catch (error) {
                console.error('載入機台能力時發生錯誤：', error);
                cachedCapabilities = [];
            }

            return cachedCapabilities;
        }

        async function populateDepartmentSelect(selectElement, placeholderText) {
            if (!selectElement) {
                return;
            }

            const departments = await fetchDepartments();
            const currentValue = selectElement.value;

            selectElement.innerHTML = '';
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = placeholderText;
            selectElement.appendChild(placeholderOption);

            departments.forEach((department) => {
                const option = document.createElement('option');
                option.value = String(department.id);
                option.textContent = department.name;
                selectElement.appendChild(option);
            });

            if (currentValue && selectElement.querySelector(`option[value="${currentValue}"]`)) {
                selectElement.value = currentValue;
            }
        }

        async function populateCapabilitySelect(selectElement, placeholderText) {
            if (!selectElement) {
                return;
            }

            const capabilities = await fetchCapabilities();
            const currentValue = selectElement.value;

            selectElement.innerHTML = '';
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = placeholderText;
            selectElement.appendChild(placeholderOption);

            capabilities.forEach((capability) => {
                const option = document.createElement('option');
                option.value = String(capability.id);
                option.textContent = capability.capability_name || capability.capability_code || '';
                selectElement.appendChild(option);
            });

            if (currentValue && selectElement.querySelector(`option[value="${currentValue}"]`)) {
                selectElement.value = currentValue;
            }
        }

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

                const result = await readJsonResponse(response, '載入查詢值失敗');
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
            if (filterStatusSelect && filterStatusSelect.hasAttribute('data-lookup-domain')) {
                await populateSelectOptions(filterStatusSelect, 'MACHINE_STATUS');
            }

            if (statusSelect && statusSelect.hasAttribute('data-lookup-domain')) {
                await populateSelectOptions(statusSelect, 'MACHINE_STATUS');
            }
        }

        async function initializeDepartmentSelects() {
            await populateDepartmentSelect(filterDepartmentSelect, '全部部門');
            await populateDepartmentSelect(departmentSelect, '請選擇部門');
        }

        async function initializeCapabilitySelects() {
            await populateCapabilitySelect(filterCapabilitySelect, '全部能力');
            await populateCapabilitySelect(capabilitySelect, '請選擇能力');
        }

        const lookupInitPromise = initializeLookupSelects();
        const departmentInitPromise = initializeDepartmentSelects();
        const capabilityInitPromise = initializeCapabilitySelects();

        function collectFilterValues() {
            if (!filterForm) {
                return {
                    keyword: '',
                    status_lookup_id: '',
                    department_id: '',
                    machine_capability_id: '',
                    perPage: state.perPage,
                };
            }

            const formData = new FormData(filterForm);
            const perPageValue = Number.parseInt((formData.get('perPage') || '10').toString(), 10);

            return {
                keyword: (formData.get('keyword') || '').toString().trim(),
                status_lookup_id: (formData.get('status_lookup_id') || '').toString(),
                department_id: (formData.get('department_id') || '').toString(),
                machine_capability_id: (formData.get('machine_capability_id') || '').toString(),
                perPage: Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10,
            };
        }

        async function loadMachines(page = 1) {
            hideAlert();
            renderLoadingRow();

            const filters = collectFilterValues();

            state.page = Math.max(1, page);
            state.perPage = filters.perPage;

            const params = new URLSearchParams();
            params.set('page', String(state.page));
            params.set('perPage', String(state.perPage));

            if (filters.keyword !== '') {
                params.set('keyword', filters.keyword);
            }

            if (filters.status_lookup_id !== '') {
                params.set('status_lookup_id', filters.status_lookup_id);
            }

            if (filters.department_id !== '') {
                params.set('department_id', filters.department_id);
            }

            if (filters.machine_capability_id !== '') {
                params.set('machine_capability_id', filters.machine_capability_id);
            }

            try {
                const response = await fetch(`api/machines/index.php?${params.toString()}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`載入失敗（${response.status}）`);
                }

                const result = await readJsonResponse(response, `載入失敗（${response.status}）`);
                if (!result.success) {
                    throw new Error(result.message || '載入失敗，請稍後再試。');
                }

                const machines = Array.isArray(result.data) ? result.data : [];
                machinesCache.clear();

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || machines.length;
                } else {
                    state.totalPages = 1;
                    state.total = machines.length;
                }

                if (machines.length === 0) {
                    renderEmptyState();
                } else {
                    renderTableRows(machines);
                }

                renderPagination();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入失敗，請稍後再試。');
                renderEmptyState();
            }
        }

        function getFormSnapshot() {
            if (!modalForm) {
                return {};
            }

            return {
                machine_number: machineNumberInput ? machineNumberInput.value.trim() : '',
                name: nameInput ? nameInput.value.trim() : '',
                model: modelInput ? modelInput.value.trim() : '',
                department_id: departmentSelect ? departmentSelect.value : '',
                status_lookup_id: statusSelect ? statusSelect.value : '',
                purchase_date: purchaseDateInput ? purchaseDateInput.value : '',
                lens_count: lensCountInput ? lensCountInput.value.trim() : '',
                length_mm: lengthInput ? lengthInput.value.trim() : '',
                thread_outer_diameter_mm: threadDiameterInput ? threadDiameterInput.value.trim() : '',
                notes: notesTextarea ? notesTextarea.value.trim() : '',
                machine_capability_id: capabilitySelect ? capabilitySelect.value : '',
            };
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

        async function openModal(mode, machine = null) {
            if (!modalOverlay || !modalForm) {
                return;
            }

            await Promise.all([lookupInitPromise, departmentInitPromise, capabilityInitPromise]);

            modalForm.reset();
            state.currentEditingId = null;
            state.formSnapshot = null;
            isFormDirty = false;

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯機台' : '新增機台';
            }

            if (mode === 'edit' && machine) {
                state.currentEditingId = Number(machine.id);

                if (machineNumberInput) machineNumberInput.value = machine.machine_number || '';
                if (nameInput) nameInput.value = machine.name || '';
                if (modelInput) modelInput.value = machine.model || '';
                if (departmentSelect) departmentSelect.value = machine.department_id ? String(machine.department_id) : '';
                if (statusSelect) statusSelect.value = machine.status_lookup_id ? String(machine.status_lookup_id) : '';
                if (purchaseDateInput) purchaseDateInput.value = machine.purchase_date || '';
                if (lensCountInput) lensCountInput.value = machine.lens_count != null ? String(machine.lens_count) : '';
                if (lengthInput) lengthInput.value = machine.length_mm != null ? String(machine.length_mm) : '';
                if (threadDiameterInput) threadDiameterInput.value = machine.thread_outer_diameter_mm != null ? String(machine.thread_outer_diameter_mm) : '';
                if (notesTextarea) notesTextarea.value = machine.notes || '';
                if (capabilitySelect) capabilitySelect.value = machine.machine_capability_id ? String(machine.machine_capability_id) : '';
            } else {
                if (statusSelect) {
                    const operationalOption = statusSelect.querySelector('option[data-value-key="operational"]');
                    statusSelect.value = operationalOption ? operationalOption.value : '';
                }
                if (capabilitySelect) capabilitySelect.value = '';
            }

            modalOverlay.classList.remove('hidden');
            setFormSnapshot();

            if (machineNumberInput) {
                machineNumberInput.focus();
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
            state.formSnapshot = null;
            isFormDirty = false;
        }

        async function openEditModal(id) {
            const cached = machinesCache.get(id);
            if (cached) {
                await openModal('edit', cached);
                return;
            }

            try {
                const response = await fetch(`api/machines/show.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`讀取機台資料失敗（${response.status}）`);
                }

                const result = await readJsonResponse(response, `讀取機台資料失敗（${response.status}）`);
                if (!result.success || !result.data) {
                    throw new Error(result.message || '讀取機台資料失敗。');
                }

                machinesCache.set(result.data.id, result.data);
                await openModal('edit', result.data);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '無法讀取機台資料。');
            }
        }

        async function deleteMachine(id) {
            const confirmed = window.confirm('確認刪除此機台資料？');
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/machines/delete.php?id=${id}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ _method: 'DELETE' }),
                });

                const result = await readJsonResponse(response, '刪除失敗，請稍後再試。');
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '刪除失敗，請稍後再試。');
                }

                showAlert('success', result.message || '機台資料已刪除。');
                // 通知 DataSync 資料已刪除
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('machines', DataSync.EVENT_TYPES.DELETED, { id });
                }
                loadMachines(state.page);
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
                loadMachines(1);
            });
        }

        if (resetFilterButton && filterForm) {
            resetFilterButton.addEventListener('click', () => {
                filterForm.reset();
                loadMachines(1);
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

            modalForm.addEventListener('change', () => {
                updateDirtyState();
            });

            modalForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const machineNumberValue = machineNumberInput ? machineNumberInput.value.trim() : '';
                const nameValue = nameInput ? nameInput.value.trim() : '';

                if (machineNumberValue === '') {
                    showModalAlert('error', '請輸入機台編號。', false);
                    return;
                }

                if (nameValue === '') {
                    showModalAlert('error', '請輸入機台名稱。', false);
                    return;
                }

                const payload = {
                    machine_number: machineNumberValue,
                    name: nameValue,
                    model: modelInput ? modelInput.value.trim() : '',
                    department_id: departmentSelect ? departmentSelect.value : '',
                    status_lookup_id: statusSelect ? statusSelect.value : '',
                    purchase_date: purchaseDateInput ? purchaseDateInput.value : '',
                    lens_count: lensCountInput ? lensCountInput.value.trim() : '',
                    length_mm: lengthInput ? lengthInput.value.trim() : '',
                    thread_outer_diameter_mm: threadDiameterInput ? threadDiameterInput.value.trim() : '',
                    notes: notesTextarea ? notesTextarea.value.trim() : '',
                    machine_capability_id: capabilitySelect ? capabilitySelect.value : '',
                };

                hideAlert();

                const isEdit = state.currentEditingId !== null;
                const endpoint = isEdit ? `api/machines/update.php?id=${state.currentEditingId}` : 'api/machines/index.php';
                const method = 'POST';
                const requestPayload = isEdit ? { ...payload, _method: 'PUT' } : payload;

                try {
                    const response = await fetch(endpoint, {
                        method,
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestPayload),
                    });

                    const result = await readJsonResponse(response, '儲存失敗，請稍後再試。');
                    if (!response.ok || !result.success) {
                        const message = result && result.message ? result.message : '儲存失敗，請稍後再試。';
                        const errors = result && result.errors ? Object.values(result.errors).join('、') : '';
                        showModalAlert('error', `${message}${errors ? `（${errors}）` : ''}`, false);
                        return;
                    }

                    closeModal(true);
                    showAlert('success', isEdit ? '機台資料已更新。' : '機台建立成功。');
                    // 通知 DataSync 資料已變更
                    if (typeof DataSync !== 'undefined') {
                        const eventType = isEdit ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED;
                        DataSync.notifyWithDependencies('machines', eventType, result.data);
                    }
                    loadMachines(isEdit ? state.page : 1);
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
                    showAlert('error', '無法取得機台編號。');
                    return;
                }

                if (action === 'edit') {
                    hideAlert();
                    await openEditModal(id);
                } else if (action === 'delete') {
                    hideAlert();
                    await deleteMachine(id);
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

                loadMachines(nextPage);
            });
        }

        loadMachines(1);

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('machines', {
                onRefresh: () => loadMachines(state.page),
                onDependencyUpdate: (sourceModule) => {
                    if (sourceModule === 'machine_capabilities') {
                        cachedCapabilities = null;
                        initializeCapabilitySelects();
                    }
                    loadMachines(state.page);
                },
                debounceMs: 300
            });
        }
    }

    window.initializeMachinesModule = initializeMachinesModule;
})();
