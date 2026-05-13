/**
 * production_records.js
 * 生產紀錄模組
 */
(function () {
    'use strict';

    const API_BASE = 'api/production_records';
    const MODULE_NAME = 'production_records';

    /* =======================
     * State
     * ======================= */
    let state = {
        data: [],
        workOrders: [],
        employees: [],
        machines: [],
        pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
        filters: {
            work_order_id: '',
            machine_id: '',
            employee_id: '',
            date_from: '',
            date_to: '',
            card_number: ''
        },
        viewingId: null
    };

    let dataSyncHelper = null;

    /* =======================
     * DOM References
     * ======================= */
    let dom = {};

    function cacheDom(container) {
        const m = container.querySelector('[data-module="production_records"]');
        if (!m) return null;
        dom = {
            moduleRoot: m,
            tableBody: m.querySelector('[data-production-records-table] tbody'),
            pagination: m.querySelector('[data-production-records-pagination]'),
            // Filter form
            filterForm: m.querySelector('[data-production-records-filter]'),
            filterWorkOrder: m.querySelector('[name="work_order_id"]'),
            filterMachine: m.querySelector('[name="machine_id"]'),
            filterEmployee: m.querySelector('[name="employee_id"]'),
            filterDateFrom: m.querySelector('[name="date_from"]'),
            filterDateTo: m.querySelector('[name="date_to"]'),
            filterCardNumber: m.querySelector('[name="card_number"]'),
            // Alert
            alertBox: m.querySelector('[data-production-records-alert]'),
            // Detail Modal
            detailModal: m.querySelector('[data-production-records-detail-modal]'),
            detailContent: m.querySelector('[data-production-records-details]')
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
        if (state.filters.work_order_id) params.append('work_order_id', state.filters.work_order_id);
        if (state.filters.machine_id) params.append('machine_id', state.filters.machine_id);
        if (state.filters.employee_id) params.append('employee_id', state.filters.employee_id);
        if (state.filters.date_from) params.append('date_from', state.filters.date_from);
        if (state.filters.date_to) params.append('date_to', state.filters.date_to);
        if (state.filters.card_number) params.append('card_number', state.filters.card_number);

        const res = await fetch(`${API_BASE}/?${params}`);
        if (!res.ok) throw new Error('載入失敗');
        const json = await res.json();

        state.data = json.data || [];
        state.pagination.total = json.pagination?.total || 0;
        state.pagination.totalPages = json.pagination?.totalPages || 0;
        state.workOrders = json.workOrders || [];
        state.employees = json.employees || [];
        state.machines = json.machines || [];
    }

    async function fetchOne(id) {
        const res = await fetch(`${API_BASE}/show.php?id=${id}`);
        if (!res.ok) throw new Error('載入失敗');
        const json = await res.json();
        return json.data;
    }

    /* =======================
     * Render Functions
     * ======================= */
    function renderTable() {
        if (!dom.tableBody) return;
        if (state.data.length === 0) {
            dom.tableBody.innerHTML = `<tr><td colspan="11" class="empty-message">目前沒有生產紀錄</td></tr>`;
        } else {
            dom.tableBody.innerHTML = state.data.map(r => `
                <tr>
                    <td>${escapeHtml(r.work_order_number)}</td>
                    <td>${escapeHtml(r.card_number || '-')}</td>
                    <td>${escapeHtml(r.production_date || '')}</td>
                    <td>${escapeHtml(r.production_time || '-')}</td>
                    <td class="text-right">${r.weight_kg !== null ? r.weight_kg.toFixed(2) : '-'}</td>
                    <td>${escapeHtml(r.machine_name || r.machine_type || '-')}</td>
                    <td>${escapeHtml(r.employee_name || r.employee_number)}</td>
                    <td>${escapeHtml(r.notes || '')}</td>
                    <td class="actions-cell">
                        <button type="button" class="btn text" data-action="view" data-id="${r.id}" title="檢視"><i class="fas fa-eye"></i></button>
                        <button type="button" class="btn text" data-action="print-screening-report" data-work-order-id="${r.work_order_id}" title="列印篩分檢驗報表"><i class="fas fa-file-medical-alt"></i></button>
                        <button type="button" class="btn text" data-action="goto-work-order" data-work-order-id="${r.work_order_id}" title="前往工單"><i class="fas fa-external-link-alt"></i></button>
                    </td>
                </tr>
            `).join('');
        }
        renderPagination();
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
        // Work orders dropdown
        if (dom.filterWorkOrder) {
            const val = dom.filterWorkOrder.value;
            dom.filterWorkOrder.innerHTML = `<option value="">全部工單</option>` +
                state.workOrders.map(w => `<option value="${w.id}">${escapeHtml(w.work_order_number)}</option>`).join('');
            dom.filterWorkOrder.value = val;
        }
        // Machines dropdown
        if (dom.filterMachine) {
            const val = dom.filterMachine.value;
            dom.filterMachine.innerHTML = `<option value="">全部機台</option>` +
                state.machines.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
            dom.filterMachine.value = val;
        }
        // Employees dropdown
        if (dom.filterEmployee) {
            const val = dom.filterEmployee.value;
            dom.filterEmployee.innerHTML = `<option value="">全部作業員</option>` +
                state.employees.map(e => `<option value="${e.id}">${escapeHtml(e.employee_number)} - ${escapeHtml(e.name)}</option>`).join('');
            dom.filterEmployee.value = val;
        }
    }

    function renderDetail(record) {
        if (!dom.detailContent) return;
        dom.detailContent.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">ID</span><span class="detail-value">${record.id}</span></div>
                <div class="detail-item"><span class="detail-label">工單編號</span><span class="detail-value">${escapeHtml(record.work_order_number)}</span></div>
                <div class="detail-item"><span class="detail-label">卡號</span><span class="detail-value">${escapeHtml(record.card_number || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">生產日期</span><span class="detail-value">${escapeHtml(record.production_date || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">生產時間</span><span class="detail-value">${escapeHtml(record.production_time || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">重量 (kg)</span><span class="detail-value">${record.weight_kg !== null ? record.weight_kg.toFixed(2) : '-'}</span></div>
                <div class="detail-item"><span class="detail-label">機台</span><span class="detail-value">${escapeHtml(record.machine_name || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">機台類型</span><span class="detail-value">${escapeHtml(record.machine_type || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">作業員</span><span class="detail-value">${escapeHtml(record.employee_name || record.employee_number)}</span></div>
                <div class="detail-item full-width"><span class="detail-label">備註</span><span class="detail-value">${escapeHtml(record.notes || '-')}</span></div>
                <div class="detail-item"><span class="detail-label">建立時間</span><span class="detail-value">${escapeHtml(record.created_at || '')}</span></div>
                <div class="detail-item"><span class="detail-label">更新時間</span><span class="detail-value">${escapeHtml(record.updated_at || '')}</span></div>
            </div>
        `;
    }

    /* =======================
     * Modal Functions
     * ======================= */
    function openDetailModal(record) {
        state.viewingId = record.id;
        renderDetail(record);
        dom.detailModal.classList.remove('hidden');
    }

    function closeDetailModal() {
        dom.detailModal.classList.add('hidden');
        state.viewingId = null;
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

    /* =======================
     * Event Handlers
     * ======================= */
    async function handleView(id) {
        try {
            const record = await fetchOne(id);
            openDetailModal(record);
        } catch (err) {
            showAlert(err.message, 'error');
        }
    }

    function handleFilterChange() {
        if (dom.filterWorkOrder) state.filters.work_order_id = dom.filterWorkOrder.value;
        if (dom.filterMachine) state.filters.machine_id = dom.filterMachine.value;
        if (dom.filterEmployee) state.filters.employee_id = dom.filterEmployee.value;
        if (dom.filterDateFrom) state.filters.date_from = dom.filterDateFrom.value;
        if (dom.filterDateTo) state.filters.date_to = dom.filterDateTo.value;
        if (dom.filterCardNumber) state.filters.card_number = dom.filterCardNumber.value;
        state.pagination.page = 1;
        loadData();
    }

    /* =======================
     * DataSync Integration
     * ======================= */
    function subscribeToChanges() {
        if (window.DataSync) {
            dataSyncHelper = DataSync.createModuleHelper(MODULE_NAME, {
                onRefresh: () => refreshDataForDataSync(),
                onDependencyUpdate: () => refreshDataForDataSync()
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

    async function refreshDataForDataSync() {
        await loadData();

        if (state.viewingId && dom.detailModal && !dom.detailModal.classList.contains('hidden')) {
            try {
                const record = await fetchOne(state.viewingId);
                openDetailModal(record);
            } catch (err) {
                showAlert(err.message, 'error');
            }
        }
    }

    /* =======================
     * Initialize
     * ======================= */
    function initializeProductionRecordsModule(container) {
        if (!cacheDom(container)) return;
        if (dom.moduleRoot.dataset.initialised === 'true') return;
        dom.moduleRoot.dataset.initialised = 'true';

        // Event delegation for module root
        dom.moduleRoot.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            switch (action) {
                case 'view': handleView(parseInt(id, 10)); break;
                case 'print-screening-report':
                    const printWorkOrderId = btn.dataset.workOrderId;
                    if (printWorkOrderId) {
                        // 開啟篩分檢驗報表列印頁面
                        const printUrl = `print/screening_inspection_print.html?work_order_id=${printWorkOrderId}`;
                        window.open(printUrl, '_blank');
                    }
                    break;
                case 'goto-work-order':
                    const workOrderId = btn.dataset.workOrderId;
                    if (workOrderId) {
                        // 開啟生產工單頁面並帶入工單 ID
                        if (typeof window.openTabWithContext === 'function') {
                            window.openTabWithContext('work_orders', '生產工單', { workOrderId: workOrderId });
                        } else {
                            // fallback: 直接開啟 work_orders 頁籤
                            const menuLink = document.querySelector('[data-page="work_orders"]');
                            if (menuLink) menuLink.click();
                        }
                    }
                    break;
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
                case 'close-detail-modal':
                    closeDetailModal();
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

    window.initializeProductionRecordsModule = initializeProductionRecordsModule;
})();
