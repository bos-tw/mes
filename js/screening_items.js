/**
 * Screening Items Module
 * 篩分項目管理模組
 */
(function() {
    'use strict';

    function initializeScreeningItemsModule(container) {
        const moduleRoot = container.querySelector('[data-module="screening_items"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        const alertBox = moduleRoot.querySelector('[data-screening-items-alert]');
        const filterForm = moduleRoot.querySelector('[data-screening-items-filter]');
        const tableElement = moduleRoot.querySelector('[data-screening-items-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-screening-items-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-screening-items-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-screening-items-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-screening-items-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const modalCancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const submitButton = modalOverlay ? modalOverlay.querySelector('[data-action="submit"]') : null;
        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');

        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            sortField: null,
            sortDirection: 'asc',
            isLoading: false,
            isSubmitting: false,
            currentMode: 'create',
            currentEditingId: null,
            items: [],
            cache: new Map(),
        };

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
                console.warn(`screening_items: 欄位不存在 - ${name}`);
            }
        }

        function showAlert(type, message) {
            if (!alertBox || !message) {
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

    
function formatNumber(value, fractionDigits = 4) {
            const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value));
            const digits = Number.isInteger(fractionDigits) ? Math.max(0, fractionDigits) : 4;

            if (!Number.isFinite(numericValue)) {
                return (0).toLocaleString('zh-TW', {
                    minimumFractionDigits: digits,
                    maximumFractionDigits: digits,
                });
            }

            return numericValue.toLocaleString('zh-TW', {
                minimumFractionDigits: digits,
                maximumFractionDigits: digits,
            });
        }

        function formatDateTime(value) {
            if (!value) {
                return '-';
            }
            if (typeof value === 'string' && value.includes('T')) {
                return value.replace('T', ' ').replace('Z', '');
            }
            return value;
        }

        function clearFormValidation() {
            if (!modalForm) {
                return;
            }

            modalForm.querySelectorAll('.has-error').forEach((element) => {
                element.classList.remove('has-error');
                element.removeAttribute('aria-invalid');
            });
        }

        function setLoading(loading) {
            state.isLoading = loading;
            if (tableElement) {
                tableElement.classList.toggle('is-loading', loading);
            }
            if (loading) {
                renderLoadingRow();
            }
        }

        function renderLoadingRow() {
            if (!tableBody) {
                return;
            }
            tableBody.innerHTML = '<tr><td colspan="10" class="text-center">資料載入中...</td></tr>';
        }

        function renderEmptyRow(message) {
            if (!tableBody) {
                return;
            }
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center">${escapeHtml(message)}</td></tr>`;
        }

        function getSortValue(item, field) {
            if (!field) {
                return null;
            }
            return item[field];
        }

        function sortItems(items) {
            if (!state.sortField) {
                return items;
            }

            const direction = state.sortDirection === 'asc' ? 1 : -1;
            const field = state.sortField;

            return [...items].sort((a, b) => {
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

                if (typeof aValue === 'number' || typeof bValue === 'number') {
                    const aNum = Number(aValue);
                    const bNum = Number(bValue);
                    if (!Number.isFinite(aNum) && !Number.isFinite(bNum)) {
                        return 0;
                    }
                    if (!Number.isFinite(aNum)) {
                        return direction;
                    }
                    if (!Number.isFinite(bNum)) {
                        return -direction;
                    }
                    return (aNum - bNum) * direction;
                }

                return String(aValue).localeCompare(String(bValue), 'zh-TW', { sensitivity: 'base', numeric: true }) * direction;
            });
        }

        function updateSortIndicators() {
            if (!tableElement) {
                return;
            }

            const headers = tableElement.querySelectorAll('th[data-sort]');
            headers.forEach((header) => {
                header.classList.remove('sort-asc', 'sort-desc');
                const icon = header.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-sort-up', 'fa-sort-down');
                    icon.classList.add('fa-sort');
                }
            });

            if (!state.sortField) {
                return;
            }

            const activeHeader = tableElement.querySelector(`th[data-sort="${state.sortField}"]`);
            if (!activeHeader) {
                return;
            }

            activeHeader.classList.add(state.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            const icon = activeHeader.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-sort');
                icon.classList.add(state.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
            }
        }

        function renderTableRows(items) {
            if (!tableBody) {
                return;
            }

            if (!items || items.length === 0) {
                renderEmptyRow('尚無受篩產品資料。');
                return;
            }

            const sorted = sortItems(items);

            const rowsHtml = sorted.map((item) => {
                const weight = item.weight_per_unit_g != null ? formatNumber(item.weight_per_unit_g, 2) : '-';
                const unitPrice = item.unit_price != null ? formatNumber(item.unit_price, 2) : '-';
                const updatedAt = formatDateTime(item.updated_at);

                return `
                    <tr data-id="${escapeHtml(item.id)}">
                        <td>${escapeHtml(item.item_number ?? '-')}</td>
                        <td>
                            <div class="table-primary">${escapeHtml(item.name ?? '-')}</div>
                            ${item.notes ? `<div class="table-secondary">${escapeHtml(item.notes)}</div>` : ''}
                        </td>
                        <td>${escapeHtml(item.material ?? '-')}</td>
                        <td>${escapeHtml(item.thread_type ?? '-')}</td>
                        <td class="text-right">${weight}</td>
                        <td class="text-right">${unitPrice}</td>
                        <td>${escapeHtml(item.unit ?? 'pcs')}</td>
                        <td>${escapeHtml(updatedAt)}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text" data-action="edit-screening-item" title="修改">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn text danger" data-action="delete-screening-item" title="刪除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = rowsHtml;

            // 通知欄位管理器表格已更新
            const manager = window.screeningItemColumnManager;
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
                <span>第 ${state.page} / ${state.totalPages} 頁，共 ${state.total} 筆</span>
                <button type="button" data-page="${state.page + 1}" ${nextDisabled}>下一頁</button>
            `;
        }

        function buildQueryParams(page = 1) {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('perPage', String(state.perPage));

            if (!filterForm) {
                return params;
            }

            const formData = new FormData(filterForm);
            const keyword = (formData.get('keyword') || '').toString().trim();
            const material = (formData.get('material') || '').toString().trim();
            const threadType = (formData.get('thread_type') || '').toString().trim();
            const unit = (formData.get('unit') || '').toString().trim();

            if (keyword !== '') {
                params.set('keyword', keyword);
            }
            if (material !== '') {
                params.set('material', material);
            }
            if (threadType !== '') {
                params.set('thread_type', threadType);
            }
            if (unit !== '') {
                params.set('unit', unit);
            }

            return params;
        }

        async function loadScreeningItems(page = 1) {
            hideAlert();
            setLoading(true);

            state.page = Math.max(1, page);

            if (filterForm) {
                const perPageValue = parseInt(filterForm.perPage?.value ?? '10', 10);
                if (Number.isFinite(perPageValue) && perPageValue > 0) {
                    state.perPage = perPageValue;
                }
            }

            const params = buildQueryParams(state.page);

            try {
                const response = await fetch(`api/screening_items/index.php?${params.toString()}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result?.message || `HTTP ${response.status}`);
                }

                const data = Array.isArray(result.data) ? result.data : [];
                state.items = data;

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || data.length;
                } else {
                    state.totalPages = 1;
                    state.total = data.length;
                }

                if (state.page > state.totalPages && state.totalPages > 0) {
                    await loadScreeningItems(state.totalPages);
                    return;
                }

                renderTableRows(state.items);
                updateSortIndicators();
                renderPagination();
            } catch (error) {
                const message = error instanceof Error ? error.message : '載入受篩產品失敗。';
                showAlert('error', message);
                renderEmptyRow('無法載入受篩產品資料。');
            } finally {
                setLoading(false);
            }
        }

        function collectFormData() {
            if (!modalForm) {
                return null;
            }

            clearFormValidation();

            const formData = new FormData(modalForm);
            const name = (formData.get('name') || '').toString().trim();
            if (name === '') {
                const field = modalForm.querySelector('[name="name"]');
                if (field) {
                    field.classList.add('has-error');
                    field.setAttribute('aria-invalid', 'true');
                    field.focus();
                }
                showModalAlert('error', '請輸入產品規格名稱。', false);
                return null;
            }

            const weightRaw = (formData.get('weight_per_unit_g') || '').toString().trim();
            const weightValue = Number.parseFloat(weightRaw);
            if (!Number.isFinite(weightValue) || weightValue <= 0) {
                const field = modalForm.querySelector('[name="weight_per_unit_g"]');
                if (field) {
                    field.classList.add('has-error');
                    field.setAttribute('aria-invalid', 'true');
                    field.focus();
                }
                showModalAlert('error', '請輸入大於 0 的單支重量 (克)。', false);
                return null;
            }

            const unitPriceRaw = (formData.get('unit_price') || '').toString().trim();
            let unitPriceValue = null;
            if (unitPriceRaw !== '') {
                unitPriceValue = Number.parseFloat(unitPriceRaw);
                if (!Number.isFinite(unitPriceValue) || unitPriceValue < 0) {
                    const field = modalForm.querySelector('[name="unit_price"]');
                    if (field) {
                        field.classList.add('has-error');
                        field.setAttribute('aria-invalid', 'true');
                        field.focus();
                    }
                    showModalAlert('error', '請輸入大於或等於 0 的單價。', false);
                    return null;
                }
            }

            const itemNumber = (formData.get('item_number') || '').toString().trim();
            const material = (formData.get('material') || '').toString().trim();
            const threadType = (formData.get('thread_type') || '').toString().trim();
            const unit = (formData.get('unit') || '').toString().trim();
            const notes = (formData.get('notes') || '').toString().trim();

            return {
                item_number: itemNumber !== '' ? itemNumber : null,
                name,
                material: material !== '' ? material : null,
                thread_type: threadType !== '' ? threadType : null,
                weight_per_unit_g: Number(weightValue.toFixed(2)),
                unit_price: unitPriceValue !== null ? Number(unitPriceValue.toFixed(2)) : null,
                unit: unit !== '' ? unit : null,
                notes: notes !== '' ? notes : null,
            };
        }

        function resetModalForm() {
            if (!modalForm) {
                return;
            }
            modalForm.reset();
            clearFormValidation();
        }

        function fillModalForm(data) {
            if (!modalForm || !data) {
                return;
            }

            if (modalForm.item_number) {
                modalForm.item_number.value = data.item_number ?? '';
            }
            if (modalForm.name) {
                modalForm.name.value = data.name ?? '';
            }
            if (modalForm.material) {
                modalForm.material.value = data.material ?? '';
            }
            if (modalForm.thread_type) {
                modalForm.thread_type.value = data.thread_type ?? '';
            }
            if (modalForm.weight_per_unit_g) {
                modalForm.weight_per_unit_g.value = data.weight_per_unit_g != null ? String(data.weight_per_unit_g) : '';
            }
            if (modalForm.unit_price) {
                modalForm.unit_price.value = data.unit_price != null ? String(data.unit_price) : '';
            }
            if (modalForm.unit) {
                modalForm.unit.value = data.unit ?? '';
            }
            if (modalForm.notes) {
                modalForm.notes.value = data.notes ?? '';
            }
        }

        function closeModal() {
            if (!modalOverlay) {
                return;
            }
            modalOverlay.classList.add('hidden');
            hideModalAlert();
            document.removeEventListener('keydown', handleEscapeKey);
            state.currentMode = 'create';
            state.currentEditingId = null;
            resetModalForm();
        }

        function handleEscapeKey(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        }

        function openModal(mode, data = null) {
            if (!modalOverlay) {
                return;
            }

            state.currentMode = mode;
            state.currentEditingId = mode === 'edit' && data ? data.id : null;

            resetModalForm();

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯受篩產品' : '新增受篩產品';
            }

            if (mode === 'edit' && data) {
                fillModalForm(data);
            }

            modalOverlay.classList.remove('hidden');
            document.addEventListener('keydown', handleEscapeKey);

            setTimeout(() => {
                if (modalForm?.name) {
                    modalForm.name.focus();
                }
            }, 50);
        }

        async function submitForm() {
            if (state.isSubmitting) {
                return;
            }

            const payload = collectFormData();
            if (!payload) {
                return;
            }

            state.isSubmitting = true;
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = '儲存中…';
            }

            const isEdit = state.currentMode === 'edit' && state.currentEditingId;
            const url = isEdit
                ? `api/screening_items/update.php?id=${encodeURIComponent(state.currentEditingId)}`
                : 'api/screening_items/index.php';
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method,
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    const message = result?.message || `HTTP ${response.status}`;
                    showModalAlert('error', message, false);
                    return;
                }

                showAlert('success', result.message || '操作成功。');
                // 通知 DataSync 資料已變更
                if (typeof DataSync !== 'undefined') {
                    const eventType = isEdit ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED;
                    DataSync.notifyWithDependencies('screening_items', eventType, result.data);
                }
                closeModal();
                await loadScreeningItems(state.page);
            } catch (error) {
                const message = error instanceof Error ? error.message : '儲存失敗。';
                showModalAlert('error', message, false);
            } finally {
                state.isSubmitting = false;
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = '儲存';
                }
            }
        }

        async function loadScreeningItemDetail(id) {
            if (state.cache.has(id)) {
                return state.cache.get(id);
            }

            try {
                const response = await fetch(`api/screening_items/update.php?id=${encodeURIComponent(id)}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result?.message || `HTTP ${response.status}`);
                }

                const data = result.data;
                state.cache.set(id, data);
                return data;
            } catch (error) {
                const message = error instanceof Error ? error.message : '載入受篩產品明細失敗。';
                showAlert('error', message);
                return null;
            }
        }

        async function handleDelete(id) {
            const target = state.items.find((item) => item.id === id);
            const label = target ? `${target.item_number ?? ''} ${target.name ?? ''}`.trim() || `ID ${id}` : `ID ${id}`;
            const confirmed = await window.AppFeedback.confirm({ title: '刪除受篩產品', message: `確認刪除「${label}」？`, impact: '相關訂單與工單產品資料' });
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/screening_items/delete.php?id=${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result?.message || `HTTP ${response.status}`);
                }

                showAlert('success', result.message || '受篩產品已刪除。');
                // 通知 DataSync 資料已刪除
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('screening_items', DataSync.EVENT_TYPES.DELETED, { id });
                }
                state.cache.delete(id);
                const reloadPage = state.items.length === 1 && state.page > 1 ? state.page - 1 : state.page;
                await loadScreeningItems(reloadPage);
            } catch (error) {
                const message = error instanceof Error ? error.message : '刪除失敗。';
                showAlert('error', message);
            }
        }

        if (headerCreateButton) {
            headerCreateButton.addEventListener('click', () => {
                openModal('create');
            });
        }

        if (filterForm) {
            filterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                loadScreeningItems(1);
            });

            const resetButton = filterForm.querySelector('[data-action="reset-filter"]');
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    filterForm.reset();
                    loadScreeningItems(1);
                });
            }
        }

        if (tableElement) {
            tableElement.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const sortableHeader = target.closest('th[data-sort]');
                if (sortableHeader) {
                    const field = sortableHeader.getAttribute('data-sort');
                    if (!field) {
                        return;
                    }
                    if (state.sortField === field) {
                        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        state.sortField = field;
                        state.sortDirection = 'asc';
                    }
                    updateSortIndicators();
                    renderTableRows(state.items);
                    return;
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
                if (!actionElement) {
                    return;
                }

                const row = actionElement.closest('tr');
                if (!row) {
                    return;
                }

                const id = Number.parseInt(row.getAttribute('data-id') || '', 10);
                if (!Number.isInteger(id)) {
                    return;
                }

                const action = actionElement.getAttribute('data-action');
                if (action === 'edit-screening-item') {
                    const data = await loadScreeningItemDetail(id);
                    if (data) {
                        openModal('edit', data);
                    }
                } else if (action === 'delete-screening-item') {
                    handleDelete(id);
                }
            });
        }

        if (paginationContainer) {
            paginationContainer.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const pageButton = target.closest('[data-page]');
                if (!pageButton) {
                    return;
                }

                const page = Number.parseInt(pageButton.getAttribute('data-page') || '', 10);
                if (!Number.isInteger(page) || page < 1 || page > state.totalPages) {
                    return;
                }

                loadScreeningItems(page);
            });
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (event) => {
                if (event.target === modalOverlay) {
                    closeModal();
                }
            });
        }

        if (modalCloseButton) {
            modalCloseButton.addEventListener('click', closeModal);
        }

        if (modalCancelButton) {
            modalCancelButton.addEventListener('click', closeModal);
        }

        if (modalForm) {
            modalForm.addEventListener('submit', (event) => {
                event.preventDefault();
                submitForm();
            });

            modalForm.addEventListener('input', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }
                if (target.classList.contains('has-error')) {
                    target.classList.remove('has-error');
                    target.removeAttribute('aria-invalid');
                }
            });
        }

        hideAlert();
        loadScreeningItems();

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('screening_items', {
                onRefresh: () => loadScreeningItems(state.page),
                debounceMs: 300
            });
        }
    }

    window.initializeScreeningItemsModule = initializeScreeningItemsModule;
})();
