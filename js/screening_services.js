/**
 * Screening Services Module
 * 篩分服務管理模組
 */
(function() {
    'use strict';

    function initializeScreeningServicesModule(container) {
        const moduleRoot = container.querySelector('[data-module="screening_services"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        const alertBox = moduleRoot.querySelector('[data-screening-services-alert]');
        const filterForm = moduleRoot.querySelector('[data-screening-services-filter]');
        const tableElement = moduleRoot.querySelector('[data-screening-services-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-screening-services-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-screening-services-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-screening-services-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-screening-services-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');

        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const printButton = moduleRoot.querySelector('.content-header [data-action="print"]');

        const serviceNumberInput = modalForm ? modalForm.querySelector('input[name="service_number"]') : null;
        const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
        const nameEnInput = modalForm ? modalForm.querySelector('input[name="name_en"]') : null;
        // 支援 <select> 或 <input>，視 modal HTML 而定
        const categoryInput = modalForm ? modalForm.querySelector('select[name="category"], input[name="category"]') : null;
        const defaultPriceInput = modalForm ? modalForm.querySelector('input[name="default_price_per_unit"]') : null;
        const tolerancePlusValueInput = modalForm ? modalForm.querySelector('input[name="tolerance_plus_value"]') : null;
        const tolerancePlusOverInput = modalForm ? modalForm.querySelector('input[name="tolerance_plus_over"]') : null;
        const toleranceMinusValueInput = modalForm ? modalForm.querySelector('input[name="tolerance_minus_value"]') : null;
        const toleranceMinusOverInput = modalForm ? modalForm.querySelector('input[name="tolerance_minus_over"]') : null;
        const ppmStandardInput = modalForm ? modalForm.querySelector('input[name="ppm_standard"]') : null;
        const isActiveCheckbox = modalForm ? modalForm.querySelector('input[name="is_active"]') : null;
        const descriptionInput = modalForm ? modalForm.querySelector('textarea[name="description"]') : null;

        const servicesCache = new Map();
        const numericSortFields = new Set([
            'id',
            'default_price_per_unit',
            'tolerance_plus_value',
            'tolerance_plus_over',
            'tolerance_minus_value',
            'tolerance_minus_over',
            'ppm_standard',
            'is_active',
        ]);
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

        function showModalAlert(type, message, autoHide = true) {
            // 優先在 modal 內顯示，沒有時回退到頁面 alert，若仍無則使用 window.alert
            if (modalAlertBox) {
                modalAlertBox.textContent = message;
                modalAlertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
                modalAlertBox.classList.add(type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'error');
                if (autoHide && type === 'success') setTimeout(() => hideModalAlert(), 3000);
                const modalWindow = modalOverlay?.querySelector('.modal-window');
                if (modalWindow) modalWindow.scrollTop = 0;
                return;
            }

            // 回退到頁面上的 alert
            if (alertBox) {
                showAlert(type, message);
                return;
            }

            // 最後回退到 window.alert，並在 console 也列印
            console[type === 'error' ? 'error' : 'warn']('[screening_services] ' + message);
            window.AppFeedback.toast(message, type === 'success' ? 'success' : 'error');
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
                console.warn(`screening_services: 欄位不存在 - ${name}`);
            }
        }

        function showAlert(type, message) {
            if (!alertBox) {
                // 若沒有 alertBox，fallback 到 console + window.alert
                console[type === 'error' ? 'error' : 'log']('[screening_services] ' + message);
                window.AppFeedback.toast(message, type === 'success' ? 'success' : 'error');
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

    
function formatDecimal(value, decimals = 2) {
            if (value === null || value === undefined || value === '') {
                return '-';
            }

            const numericValue = Number(value);
            if (Number.isNaN(numericValue)) {
                return '-';
            }

            return numericValue.toFixed(decimals);
        }

        function formatPpm(value) {
            return formatDecimal(value, 0);
        }

        function formatStatus(value) {
            return Number(value) === 1 ? '啟用' : '停用';
        }

        function formatDateTime(value) {
            return value && value !== '' ? value : '-';
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
                service_number: serviceNumberInput ? serviceNumberInput.value.trim() : '',
                name: nameInput ? nameInput.value.trim() : '',
                name_en: nameEnInput ? nameEnInput.value.trim() : '',
                category: categoryInput ? categoryInput.value.trim() : '',
                default_price_per_unit: defaultPriceInput ? defaultPriceInput.value.trim() : '',
                tolerance_plus_value: tolerancePlusValueInput ? tolerancePlusValueInput.value.trim() : '',
                tolerance_plus_over: tolerancePlusOverInput ? tolerancePlusOverInput.value.trim() : '',
                tolerance_minus_value: toleranceMinusValueInput ? toleranceMinusValueInput.value.trim() : '',
                tolerance_minus_over: toleranceMinusOverInput ? toleranceMinusOverInput.value.trim() : '',
                ppm_standard: ppmStandardInput ? ppmStandardInput.value.trim() : '',
                is_active: isActiveCheckbox ? (isActiveCheckbox.checked ? '1' : '0') : '0',
                description: descriptionInput ? descriptionInput.value.trim() : '',
            };
        }

        function hasUnsavedChanges() {
            if (!modalForm || !state.formInitialSnapshot) {
                return false;
            }

            const current = getFormSnapshot();
            return Object.keys(state.formInitialSnapshot).some(key => state.formInitialSnapshot[key] !== current[key]);
        }

        function updateDirtyState() {
            isFormDirty = hasUnsavedChanges();
        }

        function renderLoadingRow() {
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="12" class="text-center">資料載入中...</td></tr>';
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

        function getSortValue(service, field) {
            if (!field) {
                return null;
            }

            return service[field];
        }

        function sortServices(services) {
            if (!state.sortField) {
                return services;
            }

            const field = state.sortField;
            const direction = state.sortDirection === 'asc' ? 1 : -1;

            return services.sort((a, b) => {
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
                tableBody.innerHTML = '<tr><td colspan="12" class="text-center">尚無符合條件的資料。</td></tr>';
                return;
            }

            const html = rows.map(service => {
                servicesCache.set(service.id, service);
                return `
                    <tr data-id="${service.id}">
                        <td>${escapeHtml(service.service_number || '-')}</td>
                        <td>${escapeHtml(service.name)}</td>
                        <td>${escapeHtml(service.name_en || '-')}</td>
                        <td>${escapeHtml(service.category || '-')}</td>
                        <td>${formatDecimal(service.default_price_per_unit, 2)}</td>
                        <td>${formatDecimal(service.tolerance_plus_value, 4)}</td>
                        <td>${formatDecimal(service.tolerance_minus_value, 4)}</td>
                        <td>${formatPpm(service.ppm_standard)}</td>
                        <td>${formatStatus(service.is_active)}</td>
                        <td>${escapeHtml(formatDateTime(service.updated_at))}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text" data-action="edit" title="修改"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn text danger" data-action="delete" title="刪除"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;
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

        async function loadScreeningServices(page = 1) {
            if (!filterForm) {
                return;
            }

            hideAlert();
            renderLoadingRow();

            const formData = new FormData(filterForm);
            const params = new URLSearchParams();
            const keyword = (formData.get('keyword') || '').toString().trim();
            const category = (formData.get('category') || '').toString().trim();
            const isActive = (formData.get('isActive') || '').toString().trim();
            const perPageValue = parseInt((formData.get('perPage') || '10').toString(), 10);

            state.page = Math.max(1, page);
            state.perPage = Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10;

            params.set('page', String(state.page));
            params.set('perPage', String(state.perPage));
            if (keyword !== '') {
                params.set('keyword', keyword);
            }
            if (category !== '') {
                params.set('category', category);
            }
            if (isActive !== '') {
                params.set('isActive', isActive);
            }

            try {
                const response = await fetch(`api/screening_services/index.php?${params.toString()}`, {
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

                const services = Array.isArray(result.data) ? result.data : [];
                servicesCache.clear();

                const sortedServices = sortServices(services);
                renderTableRows(sortedServices);

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || services.length;
                } else {
                    state.totalPages = 1;
                    state.total = services.length;
                }

                renderPagination();
                updateSortIndicators();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入失敗，請稍後再試。');
                renderTableRows([]);
            }
        }

        async function openModal(mode, service) {
            if (!modalOverlay || !modalForm) {
                return;
            }

            modalForm.reset();
            state.currentEditingId = mode === 'edit' && service ? service.id : null;

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯篩分服務' : '新增篩分服務';
            }

            if (service) {
                if (serviceNumberInput) serviceNumberInput.value = service.service_number || '';
                if (nameInput) nameInput.value = service.name || '';
                if (nameEnInput) nameEnInput.value = service.name_en || '';
                if (categoryInput) categoryInput.value = service.category || '';
                if (defaultPriceInput) defaultPriceInput.value = service.default_price_per_unit != null ? String(service.default_price_per_unit) : '';
                if (tolerancePlusValueInput) tolerancePlusValueInput.value = service.tolerance_plus_value != null ? String(service.tolerance_plus_value) : '';
                if (tolerancePlusOverInput) tolerancePlusOverInput.value = service.tolerance_plus_over != null ? String(service.tolerance_plus_over) : '';
                if (toleranceMinusValueInput) toleranceMinusValueInput.value = service.tolerance_minus_value != null ? String(service.tolerance_minus_value) : '';
                if (toleranceMinusOverInput) toleranceMinusOverInput.value = service.tolerance_minus_over != null ? String(service.tolerance_minus_over) : '';
                if (ppmStandardInput) ppmStandardInput.value = service.ppm_standard != null ? String(service.ppm_standard) : '';
                if (isActiveCheckbox) isActiveCheckbox.checked = Number(service.is_active) === 1;
                if (descriptionInput) descriptionInput.value = service.description || '';
            } else if (isActiveCheckbox) {
                isActiveCheckbox.checked = true;
            }

            modalOverlay.classList.remove('hidden');
            setFormInitialSnapshot();

            if (serviceNumberInput) {
                serviceNumberInput.focus();
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
                const response = await fetch(`api/screening_services/update.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`讀取篩分服務資料失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error(result.message || '讀取篩分服務資料失敗。');
                }

                servicesCache.set(result.data.id, result.data);
                openModal('edit', result.data);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '無法讀取篩分服務資料。');
            }
        }

        async function deleteService(id) {
            const confirmed = await window.AppFeedback.confirm({ title: '刪除篩分服務', message: '確認刪除此篩分服務資料？', impact: '訂單品項與工單服務設定' });
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/screening_services/delete.php?id=${id}`, {
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

                showAlert('success', '篩分服務資料已刪除。');
                // 通知 DataSync 資料已刪除
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('screening_services', DataSync.EVENT_TYPES.DELETED, { id });
                }
                loadScreeningServices(state.page);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗，請稍後再試。');
            }
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', event => {
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
            filterForm.addEventListener('submit', event => {
                event.preventDefault();
                loadScreeningServices(1);
            });
        }

        if (resetFilterButton && filterForm) {
            resetFilterButton.addEventListener('click', () => {
                filterForm.reset();
                if ('perPage' in filterForm.elements) {
                    filterForm.elements.perPage.value = '10';
                }
                loadScreeningServices(1);
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

            modalForm.addEventListener('submit', async event => {
                event.preventDefault();

                const serviceNumberValue = serviceNumberInput ? serviceNumberInput.value.trim() : '';
                const nameValue = nameInput ? nameInput.value.trim() : '';
                const nameEnValue = nameEnInput ? nameEnInput.value.trim() : '';
                const categoryValue = categoryInput ? categoryInput.value.trim() : '';
                const defaultPriceValue = defaultPriceInput ? defaultPriceInput.value.trim() : '';
                const tolerancePlusValue = tolerancePlusValueInput ? tolerancePlusValueInput.value.trim() : '';
                const tolerancePlusOverValue = tolerancePlusOverInput ? tolerancePlusOverInput.value.trim() : '';
                const toleranceMinusValue = toleranceMinusValueInput ? toleranceMinusValueInput.value.trim() : '';
                const toleranceMinusOverValue = toleranceMinusOverInput ? toleranceMinusOverInput.value.trim() : '';
                const ppmStandardValue = ppmStandardInput ? ppmStandardInput.value.trim() : '';
                const isActiveValue = isActiveCheckbox ? (isActiveCheckbox.checked ? '1' : '0') : '0';
                const descriptionValue = descriptionInput ? descriptionInput.value.trim() : '';

                if (nameValue === '') {
                    showModalAlert('error', '請輸入服務名稱。', false);
                    return;
                }

                if (defaultPriceValue === '') {
                    showModalAlert('error', '請輸入預設單價。', false);
                    return;
                }

                const defaultPriceNumber = Number(defaultPriceValue);
                if (Number.isNaN(defaultPriceNumber) || defaultPriceNumber < 0) {
                    showModalAlert('error', '預設單價需為大於等於 0 的數值。', false);
                    return;
                }

                if (tolerancePlusValue !== '') {
                    const tolerancePlusNumber = Number(tolerancePlusValue);
                    if (Number.isNaN(tolerancePlusNumber) || tolerancePlusNumber < 0) {
                        showModalAlert('error', '公差(+)需為大於等於 0 的數值。', false);
                        return;
                    }
                }

                if (tolerancePlusOverValue !== '') {
                    const tolerancePlusOverNumber = Number(tolerancePlusOverValue);
                    if (Number.isNaN(tolerancePlusOverNumber) || tolerancePlusOverNumber < 0) {
                        showModalAlert('error', '正值(+)需為大於等於 0 的數值。', false);
                        return;
                    }
                }

                if (toleranceMinusValue !== '') {
                    const toleranceMinusNumber = Number(toleranceMinusValue);
                    if (Number.isNaN(toleranceMinusNumber)) {
                        showModalAlert('error', '公差(-)需為有效數值。', false);
                        return;
                    }
                }

                if (toleranceMinusOverValue !== '') {
                    const toleranceMinusOverNumber = Number(toleranceMinusOverValue);
                    if (Number.isNaN(toleranceMinusOverNumber)) {
                        showModalAlert('error', '負值(-)需為有效數值。', false);
                        return;
                    }
                }

                if (ppmStandardValue !== '') {
                    const ppmStandardNumber = Number(ppmStandardValue);
                    if (Number.isNaN(ppmStandardNumber) || ppmStandardNumber < 0) {
                        showModalAlert('error', 'PPM 標準需為大於等於 0 的數值。', false);
                        return;
                    }
                }

                const payload = {
                    service_number: serviceNumberValue,
                    name: nameValue,
                    name_en: nameEnValue,
                    category: categoryValue,
                    default_price_per_unit: defaultPriceValue,
                    tolerance_plus_value: tolerancePlusValue,
                    tolerance_plus_over: tolerancePlusOverValue,
                    tolerance_minus_value: toleranceMinusValue,
                    tolerance_minus_over: toleranceMinusOverValue,
                    ppm_standard: ppmStandardValue,
                    description: descriptionValue,
                    is_active: isActiveValue,
                };

                hideAlert();

                const isEdit = state.currentEditingId !== null;
                const endpoint = isEdit ? `api/screening_services/update.php?id=${state.currentEditingId}` : 'api/screening_services/index.php';

                // 編輯時使用 POST + _method 覆寫，避免 Apache 不支援 PUT 方法
                if (isEdit) {
                    payload._method = 'PUT';
                }

                try {
                    console.debug('screening_services save payload:', payload);
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    const result = await response.json();
                    console.debug('screening_services save result:', result);
                    if (!response.ok || !result.success) {
                        const message = result && result.message ? result.message : '儲存失敗，請稍後再試。';
                        const errors = result && result.errors ? Object.values(result.errors).join('、') : '';
                        showModalAlert('error', `${message}${errors ? `（${errors}）` : ''}`, false);
                        return;
                    }

                    // 顯示後端回傳的訊息（如果有），避免一律顯示固定成功字串導致誤解
                    const serverMessage = result.message || (isEdit ? '篩分服務資料已更新。' : '篩分服務建立成功。');
                    closeModal(true);
                    showAlert('success', serverMessage);
                    // 通知 DataSync 資料已變更
                    if (typeof DataSync !== 'undefined') {
                        const eventType = isEdit ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED;
                        DataSync.notifyWithDependencies('screening_services', eventType, result.data);
                    }
                    loadScreeningServices(isEdit ? state.page : 1);
                } catch (error) {
                    console.error(error);
                    showModalAlert('error', error.message || '儲存失敗，請稍後再試。', false);
                }
            });
        }

        if (tableBody) {
            tableBody.addEventListener('click', async event => {
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
                    showAlert('error', '無法取得篩分服務編號。');
                    return;
                }

                if (action === 'edit') {
                    hideAlert();
                    await openEditForm(id);
                } else if (action === 'delete') {
                    hideAlert();
                    await deleteService(id);
                }
            });
        }

        if (paginationContainer) {
            paginationContainer.addEventListener('click', event => {
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

                loadScreeningServices(nextPage);
            });
        }

        if (tableElement) {
            const tableHead = tableElement.querySelector('thead');
            if (tableHead) {
                tableHead.addEventListener('click', event => {
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

                    loadScreeningServices(state.page);
                });
            }
        }

        loadScreeningServices(1);

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('screening_services', {
                onRefresh: () => loadScreeningServices(state.page),
                debounceMs: 300
            });
        }
    }

    window.initializeScreeningServicesModule = initializeScreeningServicesModule;
})();
