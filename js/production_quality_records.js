/**
 * Production Quality Records Module
 * 生產品質檢驗模組
 */
(function() {
    'use strict';

    function initializeProductionQualityRecordsModule(container) {
        const moduleRoot = container.querySelector('[data-module="production_quality_records"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';
        // 欄位管理器由 column_manager.js 自動初始化，不需要手動呼叫

        const alertBox = moduleRoot.querySelector('[data-production-quality-records-alert]');
        const filterForm = moduleRoot.querySelector('[data-production-quality-records-filter]');
        const tableElement = moduleRoot.querySelector('[data-production-quality-records-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-production-quality-records-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-production-quality-records-modal]');
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-production-quality-records-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-production-quality-records-modal-alert]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');
        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const printButton = moduleRoot.querySelector('.content-header [data-action="print"]');
        const exportButton = moduleRoot.querySelector('.content-header [data-action="export"]');

        const productionRecordSelect = modalForm ? modalForm.querySelector('select[name="production_record_id"]') : null;
        const workOrderNumberInput = modalForm ? modalForm.querySelector('input[name="work_order_number"]') : null;
        const cardNumberInput = modalForm ? modalForm.querySelector('input[name="card_number"]') : null;
        const inspectionDatetimeInput = modalForm ? modalForm.querySelector('input[name="inspection_datetime"]') : null;
        const inspectorSelect = modalForm ? modalForm.querySelector('select[name="inspector_id"]') : null;
        const sampleQuantityInput = modalForm ? modalForm.querySelector('input[name="sample_quantity_pcs"]') : null;
        const defectiveQuantityInput = modalForm ? modalForm.querySelector('input[name="defective_quantity_pcs"]') : null;
        const rejectionRateInput = modalForm ? modalForm.querySelector('input[name="rejection_rate_ppm"]') : null;
        const inspectionResultSelect = modalForm ? modalForm.querySelector('select[name="inspection_result"]') : null;
        const reworkNeededSelect = modalForm ? modalForm.querySelector('select[name="rework_needed"]') : null;
        const notesTextarea = modalForm ? modalForm.querySelector('textarea[name="notes"]') : null;

        const recordsCache = new Map();
        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            currentEditingId: null,
            formSnapshot: null,
            sortField: 'inspection_datetime',
            sortDirection: 'desc',
        };

        let isFormDirty = false;
        const sortableHeaders = tableElement ? Array.from(tableElement.querySelectorAll('th[data-sort]')) : [];
        const totalColumns = 11;

    
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

        function truncate(value, maxLength = 50) {
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

        function formatRejectionRate(value) {
            if (value === null || value === undefined || value === '') {
                return '-';
            }

            const numeric = Number(value);
            if (!Number.isFinite(numeric)) {
                return '-';
            }

            return escapeHtml(numeric.toFixed(2)) + ' ppm';
        }

        function calculateRejectionRate() {
            if (!sampleQuantityInput || !defectiveQuantityInput || !rejectionRateInput) {
                return;
            }

            const sampleQty = Number(sampleQuantityInput.value);
            const defectiveQty = Number(defectiveQuantityInput.value);

            if (!Number.isFinite(sampleQty) || sampleQty <= 0) {
                rejectionRateInput.value = '';
                return;
            }

            if (!Number.isFinite(defectiveQty) || defectiveQty < 0) {
                rejectionRateInput.value = '';
                return;
            }

            // 計算不良率 (ppm) = (不良數量 / 抽樣數量) * 1000000
            const rejectionRate = (defectiveQty / sampleQty) * 1000000;
            rejectionRateInput.value = rejectionRate.toFixed(2);
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

        const defaultDescColumns = new Set(['created_at', 'updated_at', 'inspection_datetime']);

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
            loadData(1);
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
        }

        function renderTable(rows) {
            if (!tableBody) {
                return;
            }

            if (!Array.isArray(rows) || rows.length === 0) {
                renderEmptyState();
                return;
            }

            const html = rows.map((record) => {
                recordsCache.set(record.id, record);

                // 重工需求 badge
                const reworkNeeded = record.rework_needed !== 0 && record.rework_needed !== '0';
                const reworkBadge = reworkNeeded
                    ? '<span class="status-badge error">是</span>'
                    : '<span class="status-badge success">否</span>';

                return `
                    <tr data-id="${record.id}">
                        <td>${record.work_order_number ? escapeHtml(record.work_order_number) : '-'}</td>
                        <td>${record.card_number ? escapeHtml(record.card_number) : '-'}</td>
                        <td>${formatDateTime(record.inspection_datetime)}</td>
                        <td>${record.inspector_name ? escapeHtml(record.inspector_name) : '-'}</td>
                        <td>${record.sample_quantity_pcs !== null && record.sample_quantity_pcs !== undefined ? escapeHtml(record.sample_quantity_pcs) : '-'}</td>
                        <td>${record.defective_quantity_pcs !== null && record.defective_quantity_pcs !== undefined ? escapeHtml(record.defective_quantity_pcs) : '-'}</td>
                        <td>${formatRejectionRate(record.rejection_rate_ppm)}</td>
                        <td>${record.inspection_result ? escapeHtml(record.inspection_result) : '-'}</td>
                        <td>${reworkBadge}</td>
                        <td>${truncate(record.notes)}</td>
                        <td>
                            <button type="button" class="btn text" data-action="edit" title="編輯"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn text danger" data-action="delete" title="刪除"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;

            // 更新欄位可見性
            if (window.productionQualityRecordsColumnManager) {
                window.productionQualityRecordsColumnManager.onTableUpdated();
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

        async function loadData(page = 1) {
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
                const response = await fetch(`api/production_quality_records/index.php?${params.toString()}`, {
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

                const records = Array.isArray(result.data) ? result.data : [];
                recordsCache.clear();

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || records.length;
                } else {
                    state.totalPages = 1;
                    state.total = records.length;
                }

                if (records.length === 0) {
                    renderEmptyState();
                } else {
                    renderTable(records);
                }

                renderPagination();
                updateSortIndicators();
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

            const formData = new FormData(modalForm);
            const snapshot = {};
            for (const [key, value] of formData.entries()) {
                snapshot[key] = value;
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

        async function loadProductionRecords() {
            if (!productionRecordSelect) {
                return;
            }

            try {
                const response = await fetch('api/production_records/list_for_quality.php', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('載入生產紀錄失敗');
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || '載入生產紀錄失敗');
                }

                const records = Array.isArray(result.data) ? result.data : [];
                productionRecordSelect.innerHTML = '<option value="">-- 請選擇生產紀錄 --</option>';
                records.forEach((record) => {
                    const option = document.createElement('option');
                    option.value = record.id;
                    option.textContent = `${record.work_order_number || ''} - ${record.card_number || ''}`;
                    option.dataset.workOrderNumber = record.work_order_number || '';
                    option.dataset.cardNumber = record.card_number || '';
                    productionRecordSelect.appendChild(option);
                });
            } catch (error) {
                console.error(error);
                showModalAlert('error', error.message || '載入生產紀錄失敗', false);
            }
        }

        async function loadEmployees() {
            if (!inspectorSelect) {
                return;
            }

            try {
                const response = await fetch('api/employees/list_for_selector.php', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('載入員工資料失敗');
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || '載入員工資料失敗');
                }

                const employees = Array.isArray(result.data) ? result.data : [];
                inspectorSelect.innerHTML = '<option value="">-- 請選擇檢驗人員 --</option>';
                employees.forEach((employee) => {
                    const option = document.createElement('option');
                    option.value = employee.id;
                    option.textContent = `${employee.employee_number || ''} - ${employee.name || ''}`;
                    inspectorSelect.appendChild(option);
                });
            } catch (error) {
                console.error(error);
                showModalAlert('error', error.message || '載入員工資料失敗', false);
            }
        }

        function populateForm(record) {
            if (!modalForm) {
                return;
            }

            if (productionRecordSelect) productionRecordSelect.value = record.production_record_id || '';
            if (workOrderNumberInput) workOrderNumberInput.value = record.work_order_number || '';
            if (cardNumberInput) cardNumberInput.value = record.card_number || '';
            if (inspectionDatetimeInput) {
                if (record.inspection_datetime) {
                    const date = new Date(record.inspection_datetime);
                    if (!Number.isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        inspectionDatetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                    } else {
                        inspectionDatetimeInput.value = '';
                    }
                } else {
                    inspectionDatetimeInput.value = '';
                }
            }
            if (inspectorSelect) inspectorSelect.value = record.inspector_id || '';
            if (sampleQuantityInput) sampleQuantityInput.value = record.sample_quantity_pcs !== null && record.sample_quantity_pcs !== undefined ? record.sample_quantity_pcs : '';
            if (defectiveQuantityInput) defectiveQuantityInput.value = record.defective_quantity_pcs !== null && record.defective_quantity_pcs !== undefined ? record.defective_quantity_pcs : '';
            if (rejectionRateInput) rejectionRateInput.value = record.rejection_rate_ppm !== null && record.rejection_rate_ppm !== undefined ? record.rejection_rate_ppm : '';
            if (inspectionResultSelect) inspectionResultSelect.value = record.inspection_result || '';
            if (reworkNeededSelect) reworkNeededSelect.value = record.rework_needed !== null && record.rework_needed !== undefined ? String(record.rework_needed) : '0';
            if (notesTextarea) notesTextarea.value = record.notes || '';
        }

        async function openModal(mode, record = null) {
            if (!modalOverlay || !modalForm) {
                return;
            }

            modalForm.reset();
            state.currentEditingId = null;
            isFormDirty = false;
            state.formSnapshot = null;

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯品質檢驗紀錄' : '新增品質檢驗紀錄';
            }

            // 載入下拉選單資料
            await Promise.all([loadProductionRecords(), loadEmployees()]);

            if (mode === 'edit' && record) {
                state.currentEditingId = Number(record.id);
                populateForm(record);
            } else {
                // 新增模式：設定當前日期時間
                if (inspectionDatetimeInput) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    inspectionDatetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                }
            }

            modalOverlay.classList.remove('hidden');
            setFormSnapshot();

            if (productionRecordSelect) {
                productionRecordSelect.focus();
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
            hideModalAlert();
            modalOverlay.classList.add('hidden');
            state.currentEditingId = null;
            state.formSnapshot = null;
            isFormDirty = false;
        }

        async function openEditModal(id) {
            const cached = recordsCache.get(id);
            if (cached) {
                await openModal('edit', cached);
                return;
            }

            try {
                const response = await fetch(`api/production_quality_records/show.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`讀取品質檢驗紀錄失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error(result.message || '讀取品質檢驗紀錄失敗。');
                }

                recordsCache.set(result.data.id, result.data);
                await openModal('edit', result.data);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '無法讀取品質檢驗紀錄。');
            }
        }

        async function saveRecord(event) {
            event.preventDefault();

            const formData = new FormData(modalForm);

            // 驗證必填欄位
            const productionRecordId = formData.get('production_record_id');
            const inspectionDatetime = formData.get('inspection_datetime');
            const sampleQuantityPcs = formData.get('sample_quantity_pcs');

            if (!productionRecordId || productionRecordId.trim() === '') {
                showModalAlert('error', '請選擇生產紀錄。', false);
                productionRecordSelect?.focus();
                return;
            }

            if (!inspectionDatetime || inspectionDatetime.trim() === '') {
                showModalAlert('error', '請輸入檢驗日期時間。', false);
                inspectionDatetimeInput?.focus();
                return;
            }

            if (!sampleQuantityPcs || sampleQuantityPcs.trim() === '') {
                showModalAlert('error', '請輸入抽樣數量。', false);
                sampleQuantityInput?.focus();
                return;
            }

            hideModalAlert();

            const isEdit = state.currentEditingId !== null;
            const endpoint = isEdit ? 'api/production_quality_records/update.php' : 'api/production_quality_records/index.php';

            if (isEdit) {
                formData.append('_method', 'PUT');
                formData.append('id', String(state.currentEditingId));
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
                showAlert('success', isEdit ? '品質檢驗紀錄已更新。' : '品質檢驗紀錄已新增。');
                loadData(isEdit ? state.page : 1);

                // 發送資料同步通知
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('production_quality_records', isEdit ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED, result.data);
                }
            } catch (error) {
                console.error(error);
                showModalAlert('error', error.message || '儲存失敗，請稍後再試。', false);
            }
        }

        async function deleteRecord(id) {
            const confirmed = await window.AppFeedback.confirm({ title: '刪除品質檢驗紀錄', message: '此操作無法復原。', impact: '工單生產品質追溯資料' });
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/production_quality_records/delete.php?id=${id}`, {
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

                showAlert('success', result.message || '品質檢驗紀錄已刪除。');
                state.total = Math.max(0, state.total - 1);
                const isLastItemOnPage = state.page > 1 && state.total <= state.perPage * (state.page - 1);
                const targetPage = isLastItemOnPage ? state.page - 1 : state.page;
                loadData(targetPage);

                // 發送資料同步通知
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('production_quality_records', DataSync.EVENT_TYPES.DELETED, { id });
                }
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗，請稍後再試。');
            }
        }

        function bindEvents() {
            // Modal 外層點擊關閉
            if (modalOverlay) {
                modalOverlay.addEventListener('click', (event) => {
                    if (event.target === modalOverlay) {
                        closeModal();
                    }
                });
            }

            // Modal 關閉按鈕
            if (modalCloseButton) {
                modalCloseButton.addEventListener('click', () => closeModal());
            }

            // 取消按鈕
            if (cancelButton) {
                cancelButton.addEventListener('click', () => closeModal());
            }

            // 篩選表單提交
            if (filterForm) {
                filterForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    loadData(1);
                });
            }

            // 重置篩選
            if (resetFilterButton && filterForm) {
                resetFilterButton.addEventListener('click', () => {
                    filterForm.reset();
                    if ('perPage' in filterForm.elements) {
                        filterForm.elements.perPage.value = '10';
                    }
                    loadData(1);
                });
            }

            // 新增按鈕
            if (headerCreateButton) {
                headerCreateButton.addEventListener('click', async () => {
                    hideAlert();
                    await openModal('create');
                });
            }

            // 列印按鈕
            if (printButton) {
                printButton.addEventListener('click', () => window.print());
            }

            // 匯出按鈕
            if (exportButton) {
                exportButton.addEventListener('click', async () => {
                    try {
                        const filterFormData = new FormData(filterForm);
                        const keyword = filterFormData.get('keyword') || '';

                        const params = new URLSearchParams();
                        if (keyword !== '') {
                            params.set('keyword', keyword);
                        }

                        const queryString = params.toString();
                        const url = `api/production_quality_records/export.php${queryString ? '?' + queryString : ''}`;

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
                        let filename = '生產品質檢驗紀錄.xlsx';
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

                        showAlert('success', '生產品質檢驗紀錄已匯出。');
                    } catch (error) {
                        console.error(error);
                        showAlert('error', error.message || '匯出失敗，請稍後再試。');
                    }
                });
            }

            // Modal 表單事件
            if (modalForm) {
                // 生產紀錄選擇變更
                if (productionRecordSelect) {
                    productionRecordSelect.addEventListener('change', () => {
                        const selectedOption = productionRecordSelect.options[productionRecordSelect.selectedIndex];
                        if (selectedOption && selectedOption.value) {
                            if (workOrderNumberInput) {
                                workOrderNumberInput.value = selectedOption.dataset.workOrderNumber || '';
                            }
                            if (cardNumberInput) {
                                cardNumberInput.value = selectedOption.dataset.cardNumber || '';
                            }
                        } else {
                            if (workOrderNumberInput) workOrderNumberInput.value = '';
                            if (cardNumberInput) cardNumberInput.value = '';
                        }
                        updateDirtyState();
                    });
                }

                // 自動計算不良率
                if (sampleQuantityInput) {
                    sampleQuantityInput.addEventListener('input', calculateRejectionRate);
                }
                if (defectiveQuantityInput) {
                    defectiveQuantityInput.addEventListener('input', calculateRejectionRate);
                }

                // 表單變更追蹤
                modalForm.addEventListener('input', updateDirtyState);
                modalForm.addEventListener('change', updateDirtyState);

                // 表單提交
                modalForm.addEventListener('submit', saveRecord);
            }

            // 表格操作按鈕
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
                        showAlert('error', '無法取得紀錄編號。');
                        return;
                    }

                    if (actionElement.dataset.action === 'edit') {
                        hideAlert();
                        openEditModal(id);
                    } else if (actionElement.dataset.action === 'delete') {
                        hideAlert();
                        deleteRecord(id);
                    }
                });
            }

            // 分頁按鈕
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

                    loadData(nextPage);
                });
            }
        }

        // 初始化
        bindEvents();
        updateSortIndicators();
        loadData(1);

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('production_quality_records', {
                onRefresh: () => loadData(state.page),
                debounceMs: 300
            });
        }
    }

    window.initializeProductionQualityRecordsModule = initializeProductionQualityRecordsModule;
})();
