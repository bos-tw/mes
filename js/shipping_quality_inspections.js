/**
 * shipping_quality_inspections.js
 * 出貨品質檢驗模組
 */
(function () {
    'use strict';

    const API_BASE = 'api/shipping_quality_inspections';
    const MODULE_NAME = 'shipping_quality_inspections';

    /* =======================
     * State
     * ======================= */
    let state = {
        data: [],
        shippingOrders: [],
        employees: [],
        resultOptions: [],
        pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
        filters: {
            shipping_order_id: '',
            inspection_result: '',
            date_from: '',
            date_to: ''
        },
        editingId: null
    };

    let dataSyncHelper = null;

    /* =======================
     * DOM References
     * ======================= */
    let dom = {};

    function cacheDom(container) {
        const m = container.querySelector('[data-module="shipping_quality_inspections"]');
        if (!m) return null;
        dom = {
            moduleRoot: m,
            // Header create button is inside data-module now
            createButton: m.querySelector('.content-header [data-action="create"]'),
            tableBody: m.querySelector('[data-shipping-quality-inspections-table] tbody'),
            pagination: m.querySelector('[data-shipping-quality-inspections-pagination]'),
            // Filter form
            filterForm: m.querySelector('[data-shipping-quality-inspections-filter]'),
            filterShippingOrder: m.querySelector('[name="shipping_order_id"]'),
            filterResult: m.querySelector('[name="inspection_result"]'),
            filterDateFrom: m.querySelector('[name="date_from"]'),
            filterDateTo: m.querySelector('[name="date_to"]'),
            // Alert
            alertBox: m.querySelector('[data-shipping-quality-inspections-alert]'),
            // Modal
            modal: m.querySelector('[data-shipping-quality-inspections-modal]'),
            modalTitle: m.querySelector('[data-modal-title]'),
            modalAlert: m.querySelector('[data-shipping-quality-inspections-modal-alert]'),
            form: m.querySelector('[data-shipping-quality-inspections-form]'),
            // Detail Modal
            detailModal: m.querySelector('[data-shipping-quality-inspections-detail-modal]'),
            detailContent: m.querySelector('[data-shipping-quality-inspections-details]')
        };
        return dom;
    }

    /* =======================
     * API Functions
     * ======================= */
    async function fetchList() {
        const params = new URLSearchParams({
            page: state.pagination.page,
            perPage: state.pagination.perPage
        });
        if (state.filters.shipping_order_id) params.append('shipping_order_id', state.filters.shipping_order_id);
        if (state.filters.inspection_result) params.append('inspection_result', state.filters.inspection_result);
        if (state.filters.date_from) params.append('date_from', state.filters.date_from);
        if (state.filters.date_to) params.append('date_to', state.filters.date_to);

        const res = await fetch(`${API_BASE}/?${params}`);
        if (!res.ok) throw new Error('載入失敗');
        const json = await res.json();

        state.data = json.data || [];
        state.pagination.total = json.pagination?.total || 0;
        state.pagination.totalPages = json.pagination?.totalPages || 0;
        state.shippingOrders = json.shippingOrders || [];
        state.employees = json.employees || [];
        state.resultOptions = json.resultOptions || [];
    }

    async function fetchOne(id) {
        const res = await fetch(`${API_BASE}/show.php?id=${id}`);
        if (!res.ok) throw new Error('載入失敗');
        const json = await res.json();
        return json.data;
    }

    async function createRecord(payload) {
        const res = await fetch(`${API_BASE}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '新增失敗');
        return json;
    }

    async function updateRecord(id, payload) {
        const res = await fetch(`${API_BASE}/update.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '更新失敗');
        return json;
    }

    async function deleteRecord(id) {
        const res = await fetch(`${API_BASE}/delete.php?id=${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '刪除失敗');
        return json;
    }

    /* =======================
     * Render Functions
     * ======================= */
    function renderTable() {
        if (!dom.tableBody) return;
        if (state.data.length === 0) {
            dom.tableBody.innerHTML = `<tr><td colspan="10" class="empty-message">目前沒有出貨品質檢驗紀錄</td></tr>`;
        } else {
            dom.tableBody.innerHTML = state.data.map(r => `
                <tr>
                    <td>${escapeHtml(r.shipping_order_number)}</td>
                    <td>${escapeHtml(r.inspection_datetime)}</td>
                    <td>${escapeHtml(r.inspector_name || r.inspector_number)}</td>
                    <td class="text-right">${r.sample_quantity_pcs.toLocaleString()}</td>
                    <td class="text-right">${r.defective_quantity_pcs.toLocaleString()}</td>
                    <td class="text-right">${r.rejection_rate_ppm.toFixed(2)}</td>
                    <td>${formatResult(r.inspection_result)}</td>
                    <td>${escapeHtml(r.notes || '')}</td>
                    <td class="actions-cell">
                        <button type="button" class="btn text" data-action="view" data-id="${r.id}" title="檢視"><i class="fas fa-eye"></i></button>
                        <button type="button" class="btn text" data-action="edit" data-id="${r.id}" title="編輯"><i class="fas fa-edit"></i></button>
                        <button type="button" class="btn text danger" data-action="delete" data-id="${r.id}" title="刪除"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }
        renderPagination();
    }

    function formatResult(result) {
        const map = { 'pass': '合格', 'fail': '不合格', 'conditional': '有條件合格' };
        const cls = result === 'pass' ? 'active' : (result === 'fail' ? 'inactive' : 'pending');
        return `<span class="status-badge ${cls}">${map[result] || result}</span>`;
    }

    function renderPagination() {
        if (!dom.pagination) return;
        const { page, totalPages, total } = state.pagination;
        dom.pagination.innerHTML = `
            <button type="button" class="btn outline small" data-action="prev-page" ${page <= 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> 上一頁
            </button>
            <span class="pagination-info">第 ${page} / ${totalPages || 1} 頁，共 ${total} 筆</span>
            <button type="button" class="btn outline small" data-action="next-page" ${page >= totalPages ? 'disabled' : ''}>
                下一頁 <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    function renderFilters() {
        // Shipping orders dropdown
        if (dom.filterShippingOrder) {
            const val = dom.filterShippingOrder.value;
            dom.filterShippingOrder.innerHTML = `<option value="">全部出貨單</option>` +
                state.shippingOrders.map(s => `<option value="${s.id}">${escapeHtml(s.order_number)}</option>`).join('');
            dom.filterShippingOrder.value = val;
        }
        // Result dropdown
        if (dom.filterResult) {
            const val = dom.filterResult.value;
            dom.filterResult.innerHTML = `<option value="">全部結果</option>` +
                state.resultOptions.map(o => `<option value="${o.value}">${escapeHtml(o.label)}</option>`).join('');
            dom.filterResult.value = val;
        }
    }

    function renderFormDropdowns() {
        const shippingOrderSelect = dom.form.querySelector('[name="shipping_order_id"]');
        const inspectorSelect = dom.form.querySelector('[name="inspector_id"]');
        const resultSelect = dom.form.querySelector('[name="inspection_result"]');

        if (shippingOrderSelect) {
            const val = shippingOrderSelect.value;
            shippingOrderSelect.innerHTML = `<option value="">請選擇出貨單</option>` +
                state.shippingOrders.map(s => `<option value="${s.id}">${escapeHtml(s.order_number)}</option>`).join('');
            shippingOrderSelect.value = val;
        }
        if (inspectorSelect) {
            const val = inspectorSelect.value;
            inspectorSelect.innerHTML = `<option value="">請選擇檢驗員</option>` +
                state.employees.map(e => `<option value="${e.id}">${escapeHtml(e.employee_number)} - ${escapeHtml(e.name)}</option>`).join('');
            inspectorSelect.value = val;
        }
        if (resultSelect) {
            const val = resultSelect.value;
            resultSelect.innerHTML = state.resultOptions.map(o => `<option value="${o.value}">${escapeHtml(o.label)}</option>`).join('');
            resultSelect.value = val || 'pass';
        }
    }

    function renderDetail(record) {
        if (!dom.detailContent) return;
        dom.detailContent.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">ID</span><span class="detail-value">${record.id}</span></div>
                <div class="detail-item"><span class="detail-label">出貨單</span><span class="detail-value">${escapeHtml(record.shipping_order_number)}</span></div>
                <div class="detail-item"><span class="detail-label">檢驗時間</span><span class="detail-value">${escapeHtml(record.inspection_datetime)}</span></div>
                <div class="detail-item"><span class="detail-label">檢驗員</span><span class="detail-value">${escapeHtml(record.inspector_name || record.inspector_number)}</span></div>
                <div class="detail-item"><span class="detail-label">抽樣數量</span><span class="detail-value">${record.sample_quantity_pcs.toLocaleString()} pcs</span></div>
                <div class="detail-item"><span class="detail-label">不良數量</span><span class="detail-value">${record.defective_quantity_pcs.toLocaleString()} pcs</span></div>
                <div class="detail-item"><span class="detail-label">不良率 PPM</span><span class="detail-value">${record.rejection_rate_ppm.toFixed(2)}</span></div>
                <div class="detail-item"><span class="detail-label">檢驗結果</span><span class="detail-value">${formatResult(record.inspection_result)}</span></div>
                <div class="detail-item full-width"><span class="detail-label">備註</span><span class="detail-value">${escapeHtml(record.notes || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">建立時間</span><span class="detail-value">${escapeHtml(record.created_at || '')}</span></div>
                <div class="detail-item"><span class="detail-label">更新時間</span><span class="detail-value">${escapeHtml(record.updated_at || '')}</span></div>
            </div>
        `;
    }

    /* =======================
     * Modal Functions
     * ======================= */
    function openModal(record = null) {
        state.editingId = record ? record.id : null;
        if (dom.modalTitle) {
            dom.modalTitle.textContent = record ? '編輯出貨品質檢驗' : '新增出貨品質檢驗';
        }
        hideModalAlert();
        dom.form.reset();
        renderFormDropdowns();

        // 安全的欄位設定函數
        function setFieldValue(name, value) {
            const field = dom.form.querySelector(`[name="${name}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = !!value;
                } else {
                    field.value = value || '';
                }
            } else {
                console.warn(`shipping_quality_inspections: 欄位不存在 - ${name}`);
            }
        }

        if (record) {
            setFieldValue('id', record.id);
            setFieldValue('shipping_order_id', record.shipping_order_id);
            setFieldValue('inspection_datetime', record.inspection_datetime?.replace(' ', 'T').substring(0, 16));
            setFieldValue('inspector_id', record.inspector_id);
            setFieldValue('sample_quantity_pcs', record.sample_quantity_pcs);
            setFieldValue('defective_quantity_pcs', record.defective_quantity_pcs);
            setFieldValue('inspection_result', record.inspection_result);
            setFieldValue('notes', record.notes);
        } else {
            // Set default datetime to now
            const now = new Date();
            const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setFieldValue('inspection_datetime', localIso);
        }

        dom.modal.classList.remove('hidden');
    }

    function closeModal() {
        dom.modal.classList.add('hidden');
        state.editingId = null;
    }

    function openDetailModal(record) {
        state.editingId = record.id;
        renderDetail(record);
        dom.detailModal.classList.remove('hidden');
    }

    function closeDetailModal() {
        dom.detailModal.classList.add('hidden');
        state.editingId = null;
    }

    /* =======================
     * Alert Functions
     * ======================= */
    function showAlert(msg, type = 'error') {
        if (!dom.alertBox) return;
        dom.alertBox.textContent = msg;
        dom.alertBox.className = `module-alert alert-${type}`;
        dom.alertBox.classList.remove('hidden');
        setTimeout(() => dom.alertBox.classList.add('hidden'), 5000);
    }

    function showModalAlert(msg, type = 'error') {
        if (!dom.modalAlert) return;
        dom.modalAlert.textContent = msg;
        dom.modalAlert.className = `modal-alert alert-${type}`;
        dom.modalAlert.classList.remove('hidden');
    }

    function hideModalAlert() {
        if (dom.modalAlert) dom.modalAlert.classList.add('hidden');
    }

    /* =======================
     * Event Handlers
     * ======================= */
    async function handleFormSubmit(e) {
        e.preventDefault();
        hideModalAlert();

        const formData = new FormData(dom.form);
        const payload = {
            shipping_order_id: parseInt(formData.get('shipping_order_id'), 10),
            inspection_datetime: formData.get('inspection_datetime')?.replace('T', ' ') + ':00',
            inspector_id: parseInt(formData.get('inspector_id'), 10),
            sample_quantity_pcs: parseInt(formData.get('sample_quantity_pcs'), 10) || 0,
            defective_quantity_pcs: parseInt(formData.get('defective_quantity_pcs'), 10) || 0,
            inspection_result: formData.get('inspection_result') || 'pass',
            notes: formData.get('notes') || ''
        };

        try {
            if (state.editingId) {
                await updateRecord(state.editingId, payload);
                showAlert('出貨品質檢驗更新成功', 'success');
            } else {
                await createRecord(payload);
                showAlert('出貨品質檢驗新增成功', 'success');
            }
            closeModal();
            await fetchList();
            renderTable();
            notifyChange();
        } catch (err) {
            showModalAlert(err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('確定要刪除此出貨品質檢驗紀錄嗎？')) return;
        try {
            await deleteRecord(id);
            showAlert('出貨品質檢驗刪除成功', 'success');
            await fetchList();
            renderTable();
            notifyChange();
        } catch (err) {
            showAlert(err.message, 'error');
        }
    }

    async function handleView(id) {
        try {
            const record = await fetchOne(id);
            openDetailModal(record);
        } catch (err) {
            showAlert(err.message, 'error');
        }
    }

    async function handleEdit(id) {
        try {
            const record = await fetchOne(id);
            openModal(record);
        } catch (err) {
            showAlert(err.message, 'error');
        }
    }

    function handleFilterChange() {
        if (dom.filterShippingOrder) state.filters.shipping_order_id = dom.filterShippingOrder.value;
        if (dom.filterResult) state.filters.inspection_result = dom.filterResult.value;
        if (dom.filterDateFrom) state.filters.date_from = dom.filterDateFrom.value;
        if (dom.filterDateTo) state.filters.date_to = dom.filterDateTo.value;
        state.pagination.page = 1;
        loadData();
    }

    /* =======================
     * DataSync Integration
     * ======================= */
    function notifyChange() {
        if (dataSyncHelper) {
            dataSyncHelper.notifyUpdated({});
        }
    }

    function subscribeToChanges() {
        if (window.DataSync) {
            dataSyncHelper = DataSync.createModuleHelper(MODULE_NAME, {
                onRefresh: loadData
            });
        }
    }

    /* =======================
     * Utility
     * ======================= */
    /* =======================
     * Load Data
     * ======================= */
    async function loadData() {
        try {
            await fetchList();
            renderTable();
            renderFilters();
        } catch (err) {
            showAlert(err.message, 'error');
        }
    }

    /* =======================
     * Initialize
     * ======================= */
    function initializeShippingQualityInspectionsModule(container) {
        if (!cacheDom(container)) return;
        if (dom.moduleRoot.dataset.initialised === 'true') return;
        dom.moduleRoot.dataset.initialised = 'true';

        // Header create button event
        if (dom.createButton) {
            dom.createButton.addEventListener('click', () => openModal());
        }

        // Event delegation for module root
        dom.moduleRoot.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            switch (action) {
                case 'view': handleView(parseInt(id, 10)); break;
                case 'edit': handleEdit(parseInt(id, 10)); break;
                case 'delete': handleDelete(parseInt(id, 10)); break;
                case 'prev-page':
                    if (state.pagination.page > 1) {
                        state.pagination.page--;
                        loadData();
                    }
                    break;
                case 'next-page':
                    if (state.pagination.page < state.pagination.totalPages) {
                        state.pagination.page++;
                        loadData();
                    }
                    break;
                case 'reset-filter':
                    if (dom.filterForm) dom.filterForm.reset();
                    handleFilterChange();
                    break;
                case 'close-modal':
                case 'cancel':
                    closeModal();
                    break;
                case 'close-detail-modal':
                    closeDetailModal();
                    break;
                case 'edit-from-detail':
                    closeDetailModal();
                    handleEdit(state.editingId);
                    break;
            }
        });

        // Filter form submit
        if (dom.filterForm) {
            dom.filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleFilterChange();
            });
        }

        // Form submit
        if (dom.form) {
            dom.form.addEventListener('submit', handleFormSubmit);
        }

        subscribeToChanges();
        loadData();
    }

    window.initializeShippingQualityInspectionsModule = initializeShippingQualityInspectionsModule;
})();
