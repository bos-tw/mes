(function() {
    'use strict';

    const API_BASE = 'api/rescreen_batches';

    function initializeRescreenBatchesModule(container, initialContext = null) {
        const moduleRoot = container.querySelector('[data-module="rescreen_batches"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        const state = {
            page: 1,
            perPage: 20,
            sortField: 'id',
            sortDirection: 'DESC',
            customerId: '',
            sourceReturnOrderId: '',
            sourceWorkOrderId: '',
            editingId: null,
            viewingId: null,
            currentContext: initialContext || null,
            data: [],
            sourceWorkOrderDetails: null,
        };

        let dataSyncHelper = null;

        const elements = {
            alert: moduleRoot.querySelector('[data-rescreen-batches-alert]'),
            table: moduleRoot.querySelector('[data-rescreen-batches-table]'),
            pagination: moduleRoot.querySelector('[data-rescreen-batches-pagination]'),
            filterForm: moduleRoot.querySelector('[data-rescreen-batches-filter]'),
            modal: document.querySelector('[data-rescreen-batches-modal]'),
            modalForm: document.querySelector('[data-rescreen-batches-form]'),
            modalTitle: document.querySelector('[data-rescreen-batches-modal] [data-modal-title]'),
            modalAlert: document.querySelector('[data-rescreen-batches-modal-alert]'),
            detailModal: document.querySelector('[data-rescreen-batches-detail-modal]'),
            detailContent: document.querySelector('[data-rescreen-batches-detail]'),
            createBtn: moduleRoot.querySelector('[data-action="create"]'),
            sourceSummary: document.querySelector('[data-rescreen-source-summary]'),
            defectEditor: document.querySelector('[data-rescreen-defect-editor]'),
            productionEditor: document.querySelector('[data-rescreen-production-editor]'),
        };

        const tbody = elements.table?.querySelector('tbody');

        function escapeHtml(value) {
            const div = document.createElement('div');
            div.textContent = value == null ? '' : String(value);
            return div.innerHTML;
        }

        function showAlert(message, type = 'info', isModal = false) {
            const target = isModal ? elements.modalAlert : elements.alert;
            if (!target) return;
            target.className = `module-alert alert-${type}`;
            target.textContent = message;
            target.classList.remove('hidden');
            if (!isModal) {
                window.setTimeout(() => target.classList.add('hidden'), 5000);
            }
        }

        function hideAlert(isModal = false) {
            const target = isModal ? elements.modalAlert : elements.alert;
            target?.classList.add('hidden');
        }

        function getTypeLabel(type) {
            return type === 'relaxed_rescreen' ? '放寬後重篩' : '嚴格重篩';
        }

        function getStatusBadge(status) {
            const map = {
                draft: '<span class="status-badge pending">草稿</span>',
                planned: '<span class="status-badge scheduled">已排程</span>',
                in_progress: '<span class="status-badge in-progress">進行中</span>',
                completed: '<span class="status-badge completed">已完成</span>',
                cancelled: '<span class="status-badge cancelled">已取消</span>',
            };
            return map[status] || `<span class="status-badge secondary">${escapeHtml(status || '-')}</span>`;
        }

        function getStatusLabel(status) {
            const map = {
                draft: '草稿',
                planned: '已排程',
                in_progress: '進行中',
                completed: '已完成',
                cancelled: '已取消',
            };
            return map[status] || (status || '-');
        }

        function getRequestReasonLabel(code) {
            const map = {
                customer_strict_request: '客戶要求更嚴格',
                high_defect_relax: '不良率偏高，客戶同意放寬後再篩',
                other: '其他原因',
            };
            return map[code] || '-';
        }

        function getSecondScreeningReasonLabel(reason, legacyCode = '') {
            const normalizedReason = String(reason || '').trim();
            const map = {
                relaxed_after_high_defect: '不良過多，客戶放寬後再篩',
                customer_required_second_pass: '客戶每批要求二次篩選',
            };
            if (map[normalizedReason]) {
                return map[normalizedReason];
            }
            if (normalizedReason !== '') {
                return normalizedReason;
            }
            return getRequestReasonLabel(legacyCode);
        }

        function getDispositionLabel(disposition) {
            const map = {
                rework: '可再處理',
                scrap: '報廢',
                return_to_customer: '退回客戶',
                hold: '暫留待判',
                other: '其他',
            };
            return map[disposition] || (disposition || '-');
        }

        function formatQuantity(value, unit = '') {
            const text = value == null || value === '' ? '0' : String(value);
            return `${text}${unit ? ` ${unit}` : ''}`;
        }

        function formatDateTime(value) {
            if (!value) {
                return '-';
            }
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return String(value);
            }
            return date.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        }

        function buildStatusBadgeElement(status) {
            const span = document.createElement('span');
            span.className = 'status-badge secondary';
            span.textContent = status || '-';
            if (status === 'draft') {
                span.className = 'status-badge pending';
                span.textContent = '草稿';
            } else if (status === 'planned') {
                span.className = 'status-badge scheduled';
                span.textContent = '已排程';
            } else if (status === 'in_progress') {
                span.className = 'status-badge in-progress';
                span.textContent = '進行中';
            } else if (status === 'completed') {
                span.className = 'status-badge completed';
                span.textContent = '已完成';
            } else if (status === 'cancelled') {
                span.className = 'status-badge cancelled';
                span.textContent = '已取消';
            }
            return span;
        }
        function buildDefectEditorRows(rows = []) {
            if (!elements.defectEditor) return;
            const helper = window.RescreenBatchEditorHelper;
            elements.defectEditor.innerHTML = helper
                ? helper.buildDefectEditorHtml(rows, escapeHtml)
                : '<p class="text-muted">二次篩分服務明細編輯器載入失敗。</p>';
        }

        function buildDefaultDefectRowsFromWorkOrder(workOrder) { return window.RescreenBatchEditorHelper?.buildDefaultDefectRowsFromWorkOrder(workOrder) || []; }

        function buildProductionEditorRows(rows = []) {
            if (!elements.productionEditor) return;
            const helper = window.RescreenBatchEditorHelper;
            elements.productionEditor.innerHTML = helper
                ? helper.buildProductionEditorHtml(rows, escapeHtml)
                : '<p class="text-muted">二次篩選生產記錄編輯器載入失敗。</p>';
        }

        function collectDefectRows() {
            return window.RescreenBatchEditorHelper?.collectDefectRows(elements.defectEditor) || [];
        }

        function collectProductionRecordRows() {
            return window.RescreenBatchEditorHelper?.collectProductionRecordRows(elements.productionEditor) || [];
        }

        function setExecutionResultFormDefaults(values = {}) {
            [['started_at', values.started_at || ''], ['completed_at', values.completed_at || ''], ['rescreen_output_good_units', values.rescreen_output_good_units ?? ''], ['rescreen_output_defect_units', values.rescreen_output_defect_units ?? ''], ['rescreen_output_scrap_units', values.rescreen_output_scrap_units ?? '']].forEach(([name, value]) => setFormValue(name, value));
        }

        function appendProductionRecordRow(initialRow = {}) {
            if (!elements.productionEditor) return;
            const tbody = elements.productionEditor.querySelector('tbody');
            if (!tbody) {
                buildProductionEditorRows([initialRow]);
                return;
            }
            const helper = window.RescreenBatchEditorHelper;
            if (!helper) return;
            tbody.insertAdjacentHTML('beforeend', helper.buildProductionEditorRowHtml(initialRow, escapeHtml));
            const emptyHint = elements.productionEditor.querySelector('.text-muted.mt-2');
            if (emptyHint) emptyHint.remove();
        }

        function collectFilters() {
            if (!elements.filterForm) {
                return {};
            }
            const formData = new FormData(elements.filterForm);
            return {
                keyword: String(formData.get('keyword') || '').trim(),
                customer_id: String(formData.get('customer_id') || '').trim(),
                rescreen_type: String(formData.get('rescreen_type') || '').trim(),
                second_screening_reason: String(formData.get('second_screening_reason') || '').trim(),
                status: String(formData.get('status') || '').trim(),
                perPage: String(formData.get('perPage') || '20').trim(),
            };
        }

        function getContextFilterPatch(context) {
            if (!context || typeof context !== 'object') {
                return null;
            }
            const patch = {};
            const sourceReturnOrderId = Number.parseInt(
                context.sourceReturnOrderId ?? context.returnOrderId ?? context.highlightReturnOrderId ?? context.highlightId ?? '',
                10
            );
            const sourceWorkOrderId = Number.parseInt(
                context.sourceWorkOrderId ?? context.workOrderId ?? '',
                10
            );
            const rescreenBatchId = Number.parseInt(context.rescreenBatchId ?? context.id ?? '', 10);
            if (Number.isInteger(sourceReturnOrderId) && sourceReturnOrderId > 0) {
                patch.sourceReturnOrderId = String(sourceReturnOrderId);
            }
            if (Number.isInteger(sourceWorkOrderId) && sourceWorkOrderId > 0) {
                patch.sourceWorkOrderId = String(sourceWorkOrderId);
            }
            if (Number.isInteger(rescreenBatchId) && rescreenBatchId > 0) {
                patch.rescreenBatchId = rescreenBatchId;
            }
            return Object.keys(patch).length > 0 ? patch : null;
        }

        async function applyContext(context) {
            state.currentContext = context || null;
            const patch = getContextFilterPatch(context);
            if (!patch) {
                if (context?.action === 'create') {
                    await openCreateModal(context);
                }
                return;
            }
            state.page = 1;
            state.sourceReturnOrderId = patch.sourceReturnOrderId || '';
            state.sourceWorkOrderId = patch.sourceWorkOrderId || '';
            await loadData();
            if (context?.action === 'create') {
                await openCreateModal(context);
                return;
            }
            if (patch.rescreenBatchId) {
                await viewDetail(patch.rescreenBatchId);
            }
        }

        async function loadWorkOrderSourceSummary(workOrderId) {
            const normalizedId = Number.parseInt(workOrderId, 10);
            if (!elements.sourceSummary || !Number.isInteger(normalizedId) || normalizedId <= 0) {
                return null;
            }
            elements.sourceSummary.innerHTML = '<p class="text-muted">正在載入來源工單...</p>';
            try {
                const response = await fetch(`api/work_orders/show.php?id=${normalizedId}`);
                const result = await response.json();
                if (!result.success) {
                    elements.sourceSummary.innerHTML = `<p class="text-danger">${escapeHtml(result.message || '載入來源工單失敗')}</p>`;
                    return null;
                }
                const data = result.data || {};
                state.sourceWorkOrderDetails = data;
                elements.sourceSummary.innerHTML = `
                    <div class="detail-item"><span class="detail-label">來源工單</span><span class="detail-value">${escapeHtml(data.work_order_number || '-')}</span></div>
                    <div class="detail-item"><span class="detail-label">客戶</span><span class="detail-value">${escapeHtml(data.customer_name || '-')}</span></div>
                    <div class="detail-item"><span class="detail-label">訂單</span><span class="detail-value">${escapeHtml(data.order_number || '-')}</span></div>
                    <div class="detail-item"><span class="detail-label">客戶批號</span><span class="detail-value">${escapeHtml(data.customer_batch_number || '-')}</span></div>
                    <div class="detail-item"><span class="detail-label">預估數量</span><span class="detail-value">${formatQuantity(data.total_units || 0, '支')}</span></div>
                    <div class="detail-item"><span class="detail-label">預估重量</span><span class="detail-value">${formatQuantity(data.total_weight_kg || 0, 'kg')}</span></div>
                `;
                return data;
            } catch (error) {
                console.error('loadWorkOrderSourceSummary failed:', error);
                elements.sourceSummary.innerHTML = '<p class="text-danger">載入來源工單失敗。</p>';
                return null;
            }
        }

        async function loadCustomers() {
            try {
                const response = await fetch('api/customers/index.php?perPage=999');
                const result = await response.json();
                if (!result.success) return;
                const html = ['<option value="">-- 所有客戶 --</option>']
                    .concat(result.data.map((item) => `<option value="${item.id}">${escapeHtml(item.short_name || item.name)}</option>`))
                    .join('');
                const filterSelect = elements.filterForm?.querySelector('[name="customer_id"]');
                if (filterSelect) {
                    const current = filterSelect.value;
                    filterSelect.innerHTML = html;
                    filterSelect.value = current;
                }
            } catch (error) {
                console.error('loadCustomers failed:', error);
            }
        }

        async function loadReturnOrdersForSelect(selectedId = '') {
            try {
                const response = await fetch('api/return_orders/index.php?perPage=500');
                const result = await response.json();
                const select = elements.modalForm?.querySelector('[name="source_return_order_id"]');
                if (!select) return;
                if (!result.success) {
                    select.innerHTML = '<option value="">載入失敗</option>';
                    return;
                }
                select.innerHTML = '<option value="">-- 請選擇退貨單 --</option>' + result.data.map((item) => {
                    const label = `${item.return_order_number} / ${item.customer_name || '-'} / ${item.return_date || '-'}`;
                    return `<option value="${item.id}">${escapeHtml(label)}</option>`;
                }).join('');
                if (selectedId) {
                    select.value = String(selectedId);
                }
            } catch (error) {
                console.error('loadReturnOrdersForSelect failed:', error);
            }
        }

        async function loadReturnOrderSummary(returnOrderId) {
            if (!elements.sourceSummary) {
                return;
            }
            if (!returnOrderId) {
                elements.sourceSummary.innerHTML = '<p class="text-muted">請先選擇退貨單，或從生產工單建立二次篩選。</p>';
                return;
            }
            try {
                const response = await fetch(`api/return_orders/show.php?id=${returnOrderId}`);
                const result = await response.json();
                if (!result.success) {
                    elements.sourceSummary.innerHTML = `<p class="text-danger">${escapeHtml(result.message || '載入退貨單摘要失敗')}</p>`;
                    return;
                }
                const data = result.data || {};
                const items = Array.isArray(data.items) ? data.items : [];
                const totalQuantity = items.reduce((sum, item) => sum + (Number.parseFloat(item.returned_quantity || 0) || 0), 0);
                elements.sourceSummary.innerHTML = `
                    <div class="detail-item"><span class="detail-label">退貨單號</span><span class="detail-value">${escapeHtml(data.return_order_number || '-')}</span></div>
                    <div class="detail-item"><span class="detail-label">客戶</span><span class="detail-value">${escapeHtml(data.customer_name || '-')}</span></div>
                    <div class="detail-item"><span class="detail-label">來源出貨單</span><span class="detail-value">${escapeHtml(data.shipping_order_number || '-')}</span></div>
                    <div class="detail-item"><span class="detail-label">退貨品項數</span><span class="detail-value">${escapeHtml(String(items.length))}</span></div>
                    <div class="detail-item"><span class="detail-label">退回總數量</span><span class="detail-value">${escapeHtml(String(totalQuantity))}</span></div>
                    <div class="detail-item" style="grid-column: 1 / -1;"><span class="detail-label">備註</span><span class="detail-value">${escapeHtml(data.notes || data.return_reason || '-')}</span></div>
                `;
            } catch (error) {
                console.error('loadReturnOrderSummary failed:', error);
                elements.sourceSummary.innerHTML = '<p class="text-danger">載入退貨單摘要失敗。</p>';
            }
        }

        async function loadData() {
            try {
                const filters = collectFilters();
                state.perPage = Number.parseInt(filters.perPage || '20', 10) || 20;
                const params = new URLSearchParams({
                    page: String(state.page),
                    perPage: String(state.perPage),
                    sortField: state.sortField,
                    sortDirection: state.sortDirection,
                });
                if (filters.keyword) params.set('keyword', filters.keyword);
                if (filters.customer_id) params.set('customer_id', filters.customer_id);
                if (filters.rescreen_type) params.set('rescreen_type', filters.rescreen_type);
                if (filters.second_screening_reason) params.set('second_screening_reason', filters.second_screening_reason);
                if (filters.status) params.set('status', filters.status);
                if (state.sourceReturnOrderId) params.set('source_return_order_id', state.sourceReturnOrderId);
                if (state.sourceWorkOrderId) params.set('source_work_order_id', state.sourceWorkOrderId);

                const response = await fetch(`${API_BASE}/index.php?${params.toString()}`);
                const result = await response.json();
                if (!result.success) {
                    showAlert(result.message || '載入失敗', 'danger');
                    return;
                }
                state.data = Array.isArray(result.data) ? result.data : [];
                renderTable();
                renderPagination(result.pagination || {});
            } catch (error) {
                console.error('loadData failed:', error);
                showAlert('載入二次篩選紀錄失敗。', 'danger');
            }
        }

        function renderTable() {
            if (!tbody) return;
            if (state.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4">暫無資料</td></tr>';
                return;
            }
            const fragment = document.createDocumentFragment();
            const columns = [
                (item) => item.rescreen_batch_number || '',
                (item) => getTypeLabel(item.rescreen_type),
                (item) => getSecondScreeningReasonLabel(item.second_screening_reason, item.request_reason_code),
                (item) => item.customer_name || '',
                (item) => item.return_order_number || '',
                (item) => item.shipping_order_number || '-',
                (item) => item.source_work_order_number || '-',
                (item) => String(item.received_total_quantity || 0),
                (item) => formatDateTime(item.created_at),
            ];

            state.data.forEach((item) => {
                const row = document.createElement('tr');
                row.dataset.id = String(item.id || '');

                columns.forEach((getter) => {
                    const cell = document.createElement('td');
                    cell.textContent = getter(item);
                    row.appendChild(cell);
                });

                const statusCell = document.createElement('td');
                statusCell.appendChild(buildStatusBadgeElement(String(item.status || '')));
                row.appendChild(statusCell);

                const actionCell = document.createElement('td');
                actionCell.className = 'table-actions';
                actionCell.innerHTML = `
                    <button type="button" class="btn text" data-action="view" data-id="${escapeHtml(String(item.id || ''))}" title="檢視"><i class="fas fa-eye"></i></button>
                    <button type="button" class="btn text" data-action="edit" data-id="${escapeHtml(String(item.id || ''))}" title="編輯"><i class="fas fa-edit"></i></button>
                `;
                row.appendChild(actionCell);
                fragment.appendChild(row);
            });

            tbody.replaceChildren(fragment);
        }

        function renderPagination(pagination) {
            if (!elements.pagination) return;
            const page = Number.parseInt(pagination.page, 10) || 1;
            const totalPages = Number.parseInt(pagination.totalPages, 10) || 1;
            if (totalPages <= 1) {
                elements.pagination.innerHTML = '';
                return;
            }
            elements.pagination.innerHTML = `
                <button class="btn btn-sm btn-outline-secondary" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">上一頁</button>
                <span class="mx-2">第 ${page} / ${totalPages} 頁</span>
                <button class="btn btn-sm btn-outline-secondary" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">下一頁</button>
            `;
        }

        function openModal() {
            elements.modal?.classList.remove('hidden');
        }

        function closeModal() {
            elements.modal?.classList.add('hidden');
            elements.modalForm?.reset();
            state.editingId = null;
            state.sourceWorkOrderDetails = null;
            setFormValue('source_work_order_id', '');
            const returnSelect = elements.modalForm?.querySelector('[name="source_return_order_id"]');
            if (returnSelect) {
                returnSelect.disabled = false;
            }
            hideAlert(true);
            buildDefectEditorRows([]);
            buildProductionEditorRows([]);
            loadReturnOrderSummary('');
        }

        function openDetailModal() {
            elements.detailModal?.classList.remove('hidden');
        }

        function closeDetailModal() {
            elements.detailModal?.classList.add('hidden');
        }

        async function openCreateModal(prefillContext = null) {
            state.editingId = null;
            if (elements.modalTitle) {
                elements.modalTitle.textContent = '新增二次篩選紀錄';
            }
            elements.modalForm?.reset();
            hideAlert(true);
            const selectedWorkOrderId = prefillContext?.sourceWorkOrderId || prefillContext?.workOrderId || '';
            const selectedReturnOrderId = prefillContext?.sourceReturnOrderId || prefillContext?.returnOrderId || '';
            await loadReturnOrdersForSelect(selectedReturnOrderId);
            setFormValue('source_work_order_id', selectedWorkOrderId);
            const returnSelect = elements.modalForm?.querySelector('[name="source_return_order_id"]');
            if (selectedWorkOrderId) {
                if (returnSelect) {
                    returnSelect.value = '';
                    returnSelect.disabled = true;
                }
                setFormValue('rescreen_type', prefillContext?.rescreenType || 'strict_rescreen');
                setFormValue(
                    'second_screening_reason',
                    getSecondScreeningReasonLabel(prefillContext?.secondScreeningReason) || '客戶每批要求二次篩選'
                );
                setFormValue('source_defect_history_record_id', prefillContext?.sourceDefectHistoryRecordId || '');
                setFormValue('customer_approval_reference', prefillContext?.customerApprovalReference || '');
                setFormValue('notes', prefillContext?.notes || '');
                setExecutionResultFormDefaults();
                const workOrderData = await loadWorkOrderSourceSummary(selectedWorkOrderId);
                buildDefectEditorRows(buildDefaultDefectRowsFromWorkOrder(workOrderData));
                buildProductionEditorRows([]);
            } else {
                if (returnSelect) {
                    returnSelect.disabled = false;
                }
                setFormValue('rescreen_type', prefillContext?.rescreenType || 'relaxed_rescreen');
                setFormValue(
                    'second_screening_reason',
                    getSecondScreeningReasonLabel(prefillContext?.secondScreeningReason) || '不良過多，客戶放寬後再篩'
                );
                setFormValue('source_defect_history_record_id', prefillContext?.sourceDefectHistoryRecordId || '');
                setFormValue('customer_approval_reference', prefillContext?.customerApprovalReference || '');
                setFormValue('notes', prefillContext?.notes || '');
                setExecutionResultFormDefaults();
                await loadReturnOrderSummary(selectedReturnOrderId);
                buildDefectEditorRows([]);
                buildProductionEditorRows([]);
            }
            openModal();
        }

        async function openEditModal(id) {
            try {
                const response = await fetch(`${API_BASE}/show.php?id=${id}`);
                const result = await response.json();
                if (!result.success) {
                    showAlert(result.message || '載入案件失敗', 'danger');
                    return;
                }
                const data = result.data || {};
                state.editingId = id;
                if (elements.modalTitle) {
                    elements.modalTitle.textContent = '編輯二次篩選紀錄';
                }
                await loadReturnOrdersForSelect(data.source_return_order_id || '');
                setFormValue('source_work_order_id', data.source_return_order_id ? '' : (data.source_work_order_id || ''));
                setFormValue('source_return_order_id', data.source_return_order_id);
                setFormValue('rescreen_type', data.rescreen_type || 'strict_rescreen');
                setFormValue('second_screening_reason', data.second_screening_reason || '');
                setFormValue('request_reason_code', data.request_reason_code || '');
                setFormValue('customer_approval_reference', data.customer_approval_reference || '');
                setFormValue('status', data.status || 'draft');
                setFormValue('notes', data.notes || '');
                setExecutionResultFormDefaults({
                    started_at: window.RescreenBatchEditorHelper?.formatDateTimeLocalValue(data.started_at || '') || '',
                    completed_at: window.RescreenBatchEditorHelper?.formatDateTimeLocalValue(data.completed_at || '') || '',
                    rescreen_output_good_units: data.rescreen_output_good_units ?? '',
                    rescreen_output_defect_units: data.rescreen_output_defect_units ?? '',
                    rescreen_output_scrap_units: data.rescreen_output_scrap_units ?? '',
                });
                buildDefectEditorRows(Array.isArray(data.defects) ? data.defects : []);
                buildProductionEditorRows(Array.isArray(data.production_records) ? data.production_records : []);
                const returnSelect = elements.modalForm?.querySelector('[name="source_return_order_id"]');
                if (returnSelect) {
                    returnSelect.disabled = !data.source_return_order_id && !!data.source_work_order_id;
                }
                if (data.source_return_order_id) {
                    await loadReturnOrderSummary(data.source_return_order_id || '');
                } else {
                    await loadWorkOrderSourceSummary(data.source_work_order_id || '');
                }
                openModal();
            } catch (error) {
                console.error('openEditModal failed:', error);
                showAlert('載入案件失敗。', 'danger');
            }
        }

        function setFormValue(name, value) {
            const field = elements.modalForm?.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value ?? '';
            }
        }

        async function saveData() {
            if (!elements.modalForm) return;
            const formData = new FormData(elements.modalForm);
            const data = Object.fromEntries(formData.entries());
            const defectRows = collectDefectRows();
            const productionRecordRows = collectProductionRecordRows();
            if (defectRows.length > 0 || state.editingId) {
                data.defects = defectRows;
            }
            if (productionRecordRows.length > 0 || state.editingId) {
                data.production_records = productionRecordRows;
            }
            const url = state.editingId ? `${API_BASE}/update.php?id=${state.editingId}` : `${API_BASE}/index.php`;
            const method = state.editingId ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await response.json();
                if (!result.success) {
                    showAlert(result.message || '儲存失敗', 'danger', true);
                    return;
                }
                closeModal();
                await loadData();
                showAlert(state.editingId ? '二次篩選紀錄已更新。' : '二次篩選紀錄已建立。', 'success');
                if (dataSyncHelper) {
                    if (method === 'POST') dataSyncHelper.notifyCreated(result.data);
                    else dataSyncHelper.notifyUpdated(result.data);
                }
            } catch (error) {
                console.error('saveData failed:', error);
                showAlert('儲存二次篩選紀錄失敗。', 'danger', true);
            }
        }

        async function viewDetail(id) {
            try {
                const response = await fetch(`${API_BASE}/show.php?id=${id}`);
                const result = await response.json();
                if (!result.success) {
                    showAlert(result.message || '載入案件失敗', 'danger');
                    return;
                }
                state.viewingId = id;
                renderDetail(result.data || {});
                openDetailModal();
            } catch (error) {
                console.error('viewDetail failed:', error);
                showAlert('載入二次篩選紀錄失敗。', 'danger');
            }
        }

        function renderRuleTable(title, rows) {
            if (!Array.isArray(rows) || rows.length === 0) {
                return `<div class="detail-section"><h4>${escapeHtml(title)}</h4><p class="text-muted">無資料</p></div>`;
            }
            return `
                <div class="detail-section">
                    <h4>${escapeHtml(title)}</h4>
                    <table class="data-table compact">
                        <thead>
                            <tr>
                                <th>服務</th>
                                <th>啟用</th>
                                <th>正公差</th>
                                <th>負公差</th>
                                <th>PPM</th>
                                <th>備註</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map((row) => `
                                <tr>
                                    <td>${escapeHtml(row.service_name || '-')}</td>
                                    <td>${row.is_enabled == 1 ? '是' : '否'}</td>
                                    <td>${escapeHtml(row.tolerance_plus_value ?? '-')}</td>
                                    <td>${escapeHtml(row.tolerance_minus_value ?? '-')}</td>
                                    <td>${escapeHtml(row.ppm_standard ?? '-')}</td>
                                    <td>${escapeHtml(row.notes || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        function renderDetail(data) {
            if (!elements.detailContent) return;
            const items = Array.isArray(data.items) ? data.items : [];
            const defects = Array.isArray(data.defects) ? data.defects : [];
            const productionRecords = Array.isArray(data.production_records) ? data.production_records : [];
            const hasDefects = defects.length > 0;
            const defectRecorderNames = Array.from(new Set(
                defects
                    .map((defect) => String(defect.defect_recorded_by_name || '').trim())
                    .filter(Boolean)
            ));
            const latestDefectRecord = defects.reduce((latest, defect) => {
                const recordedAt = String(defect.defect_recorded_at || '').trim();
                if (!recordedAt) {
                    return latest;
                }
                if (!latest || recordedAt > String(latest.defect_recorded_at || '').trim()) {
                    return defect;
                }
                return latest;
            }, null);
            const screeningOperatorLabel = defectRecorderNames.join('、')
                || data.rescreen_assigned_employee_name
                || data.rescreen_calibration_employee_name
                || '-';
            const screeningStartAt = data.started_at || '';
            const screeningCompletedAt = data.completed_at || '';
            const resultLabel = data.status === 'completed'
                ? (hasDefects ? '已完成，有再次不良需處置' : '已完成，未記錄再次不良')
                : '尚未完成，結果待確認';
            const primaryItem = items[0] || {};
            elements.detailContent.innerHTML = `
                <div class="detail-section">
                    <h4>二篩結果一眼看</h4>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">二篩編號</span><span class="detail-value">${escapeHtml(data.rescreen_batch_number || '-')}</span></div>
                        <div class="detail-item"><span class="detail-label">目前狀態</span><span class="detail-value">${escapeHtml(getStatusLabel(data.status))}</span></div>
                        <div class="detail-item"><span class="detail-label">二篩方式</span><span class="detail-value">${escapeHtml(getTypeLabel(data.rescreen_type))}</span></div>
                        <div class="detail-item"><span class="detail-label">二篩原因</span><span class="detail-value">${escapeHtml(getSecondScreeningReasonLabel(data.second_screening_reason, data.request_reason_code))}</span></div>
                        <div class="detail-item"><span class="detail-label">目前結果</span><span class="detail-value">${escapeHtml(resultLabel)}</span></div>
                        <div class="detail-item"><span class="detail-label">客戶</span><span class="detail-value">${escapeHtml(data.customer_name || '-')}</span></div>
                        <div class="detail-item"><span class="detail-label">主批號 / 產品</span><span class="detail-value">${escapeHtml(data.customer_batch_number || primaryItem.customer_batch_number || '-')} / ${escapeHtml(data.screening_item_name || primaryItem.screening_item_name || data.part_number || '-')}</span></div>
                        <div class="detail-item"><span class="detail-label">來源數量</span><span class="detail-value">${escapeHtml(formatQuantity(data.received_total_quantity, primaryItem.returned_unit || ''))}</span></div>
                        <div class="detail-item"><span class="detail-label">來源重量</span><span class="detail-value">${escapeHtml(data.received_total_weight_kg || 0)} kg</span></div>
                    </div>
                </div>
                <div class="detail-section">
                    <h4>追溯時間線</h4>
                    <table class="data-table compact">
                        <thead>
                            <tr>
                                <th>順序</th>
                                <th>流程節點</th>
                                <th>單號 / 紀錄</th>
                                <th>使用者要確認的事</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>原始訂單 / 工單</td>
                                <td>${escapeHtml(data.order_number || '-')} / ${escapeHtml(data.source_work_order_number || '-')}</td>
                                <td>這批貨原本從哪張訂單與哪張工單產生。</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>原出貨單</td>
                                <td>${escapeHtml(data.shipping_order_number || '-')}</td>
                                <td>這批貨曾經用哪張出貨單交給客戶。</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>退貨單</td>
                                <td>${escapeHtml(data.return_order_number || '-')}</td>
                                <td>${data.return_order_number ? '客戶退回後，由這張退貨單進入放寬後二篩流程。' : '此案件由原生產工單直接建立，沒有退貨單來源。'}</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>二次篩選案件</td>
                                <td>${escapeHtml(data.rescreen_batch_number || '-')}</td>
                                <td>${escapeHtml(getSecondScreeningReasonLabel(data.second_screening_reason, data.request_reason_code))}；目前${escapeHtml(resultLabel)}。</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="detail-section">
                    <h4>這次為什麼二篩</h4>
                    <dl class="detail-list">
                        <dt>原因</dt><dd>${escapeHtml(getSecondScreeningReasonLabel(data.second_screening_reason, data.request_reason_code))}</dd>
                        <dt>客戶通知 / 標準佐證</dt><dd>${escapeHtml(data.customer_approval_reference || '-')}</dd>
                        <dt>說明</dt><dd>${escapeHtml(data.decision_notes || data.notes || '-')}</dd>
                        <dt>關聯原始工單</dt><dd>${escapeHtml(data.source_work_order_number || '-')}</dd>
                    </dl>
                </div>
                <div class="detail-section">
                    <h4>執行人員與時間</h4>
                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">主要篩選人員</span><span class="detail-value">${escapeHtml(screeningOperatorLabel)}</span></div>
                        <div class="detail-item"><span class="detail-label">校機 / 協助人員</span><span class="detail-value">${escapeHtml(data.rescreen_calibration_employee_name || '-')}</span></div>
                        <div class="detail-item"><span class="detail-label">二篩開始時間</span><span class="detail-value">${escapeHtml(formatDateTime(screeningStartAt))}</span></div>
                        <div class="detail-item"><span class="detail-label">二篩完成時間</span><span class="detail-value">${escapeHtml(formatDateTime(screeningCompletedAt))}</span></div>
                        <div class="detail-item"><span class="detail-label">再次不良最後記錄人員</span><span class="detail-value">${escapeHtml(latestDefectRecord?.defect_recorded_by_name || '-')}</span></div>
                        <div class="detail-item"><span class="detail-label">再次不良最後記錄時間</span><span class="detail-value">${escapeHtml(formatDateTime(latestDefectRecord?.defect_recorded_at || ''))}</span></div>
                    </div>
                </div>
                <div class="detail-section">
                    <h4>來源明細</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>產品</th>
                                <th>客批</th>
                                <th>原始工單</th>
                                <th>原庫存</th>
                                <th>來源數量</th>
                                <th>估重(kg)</th>
                                <th>來源說明</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((item) => `
                                <tr>
                                    <td>${escapeHtml(item.screening_item_name || item.part_number || item.sub_item_number || '-')}</td>
                                    <td>${escapeHtml(item.customer_batch_number || '-')}</td>
                                    <td>${escapeHtml(item.source_work_order_number || '-')}</td>
                                    <td>${escapeHtml(item.inventory_number || '-')}</td>
                                    <td>${escapeHtml(item.returned_quantity || 0)} ${escapeHtml(item.returned_unit || '')}</td>
                                    <td>${escapeHtml(item.estimated_weight_kg || 0)}</td>
                                    <td>${escapeHtml(item.source_notes || item.return_reason || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${renderRuleTable('原始標準快照', data.rules?.original || [])}
                ${renderRuleTable('二次篩選標準快照', data.rules?.rescreen || [])}
                <div class="detail-section">
                    <h4>二次篩分服務明細</h4>
                    ${defects.length === 0 ? '<p class="text-muted">目前尚無二次篩選再次不良紀錄。</p>' : `
                        <table class="data-table compact">
                            <thead><tr><th>服務</th><th>不良數量</th><th>重量(kg)</th><th>支數</th><th>處置</th><th>記錄人員</th><th>記錄時間</th><th>備註</th></tr></thead>
                            <tbody>
                                ${defects.map((defect) => `
                                    <tr>
                                        <td>${escapeHtml(defect.service_name || '-')}</td>
                                        <td>${escapeHtml(defect.defect_quantity || 0)}</td>
                                        <td>${escapeHtml(defect.defect_weight_kg || 0)}</td>
                                        <td>${escapeHtml(defect.defect_units || 0)}</td>
                                        <td>${escapeHtml(getDispositionLabel(defect.disposition))}</td>
                                        <td>${escapeHtml(defect.defect_recorded_by_name || '-')}</td>
                                        <td>${escapeHtml(formatDateTime(defect.defect_recorded_at || ''))}</td>
                                        <td>${escapeHtml(defect.notes || '-')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
                <div class="detail-section">
                    <h4>二次篩選生產記錄</h4>
                    ${productionRecords.length === 0 ? '<p class="text-muted">目前尚無二次篩選生產記錄。</p>' : `
                        <table class="data-table compact">
                            <thead><tr><th>卡號/桶號</th><th>重量(kg)</th><th>日期</th><th>時間</th><th>機台</th><th>載具</th><th>載具重(kg)</th><th>記錄人員</th><th>備註</th></tr></thead>
                            <tbody>
                                ${productionRecords.map((record) => `
                                    <tr>
                                        <td>${escapeHtml(record.card_number || '-')}</td>
                                        <td>${escapeHtml(record.weight_kg ?? '-')}</td>
                                        <td>${escapeHtml(record.production_date || '-')}</td>
                                        <td>${escapeHtml(record.production_time || '-')}</td>
                                        <td>${escapeHtml(record.machine_name || record.machine_type || '-')}</td>
                                        <td>${escapeHtml(record.tool_name || '-')}</td>
                                        <td>${escapeHtml(record.tool_weight_kg ?? '-')}</td>
                                        <td>${escapeHtml(record.employee_name || '-')}</td>
                                        <td>${escapeHtml(record.notes || '-')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            `;
        }

        function handleModuleClick(event) {
            const button = event.target.closest('[data-action]');
            if (!button) return;
            const action = button.dataset.action;
            const id = Number.parseInt(button.dataset.id || '', 10);
            if (action === 'create') {
                openCreateModal(state.currentContext || null);
            } else if (action === 'view' && Number.isInteger(id)) {
                viewDetail(id);
            } else if (action === 'edit' && Number.isInteger(id)) {
                openEditModal(id);
            } else if (action === 'add-production-record') {
                appendProductionRecordRow();
            }
        }

        function handleDocumentClick(event) {
            const button = event.target.closest('[data-action]');
            if (!button) return;
            const inRescreenModal = button.closest('[data-rescreen-batches-modal]') || button.closest('[data-rescreen-batches-detail-modal]');
            if (!inRescreenModal) return;
            const action = button.dataset.action;
            if (action === 'close-modal' || action === 'cancel') {
                closeModal();
            } else if (action === 'close-detail-modal') {
                closeDetailModal();
            } else if (action === 'edit-from-detail' && state.viewingId) {
                closeDetailModal();
                openEditModal(state.viewingId);
            } else if (action === 'remove-production-record') {
                button.closest('[data-rescreen-production-row]')?.remove();
            }
        }

        function attachEvents() {
            moduleRoot.addEventListener('click', handleModuleClick);
            document.addEventListener('click', handleDocumentClick);
            elements.createBtn?.addEventListener('click', () => openCreateModal(state.currentContext || null));
            elements.modalForm?.addEventListener('submit', (event) => {
                event.preventDefault();
                saveData();
            });
            elements.filterForm?.addEventListener('submit', (event) => {
                event.preventDefault();
                state.page = 1;
                loadData();
            });
            elements.filterForm?.querySelector('[data-action="reset-filter"]')?.addEventListener('click', () => {
                elements.filterForm.reset();
                state.sourceReturnOrderId = '';
                state.page = 1;
                loadData();
            });
            elements.pagination?.addEventListener('click', (event) => {
                const button = event.target.closest('[data-page]');
                if (!button || button.disabled) return;
                state.page = Number.parseInt(button.dataset.page || '1', 10) || 1;
                loadData();
            });
            elements.modalForm?.querySelector('[name="source_return_order_id"]')?.addEventListener('change', (event) => {
                loadReturnOrderSummary(event.target.value);
            });
            container.addEventListener('module:context', (event) => {
                applyContext(event.detail?.context || null).catch((error) => {
                    console.error('rescreen_batches: applyContext failed', error);
                });
            });
        }

        async function refreshForDataSync(sourceModule = null) {
            if (sourceModule === 'customers') {
                await loadCustomers();
            }
            if (sourceModule === 'return_orders' && state.editingId === null && elements.modal && !elements.modal.classList.contains('hidden')) {
                await loadReturnOrdersForSelect(elements.modalForm?.querySelector('[name="source_return_order_id"]')?.value || '');
            }
            await loadData();
            if (state.viewingId && elements.detailModal && !elements.detailModal.classList.contains('hidden')) {
                await viewDetail(state.viewingId);
            }
        }

        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('rescreen_batches', {
                onRefresh: () => refreshForDataSync(),
                onDependencyUpdate: (sourceModule) => refreshForDataSync(sourceModule),
            });
        }

        window.rescreenBatchesModule = {
            openCreateFromReturnOrder(context) {
                return openCreateModal(context || null);
            },
            openByContext(context) {
                return applyContext(context);
            },
            refresh: loadData,
        };

        attachEvents();
        loadCustomers();
        loadReturnOrdersForSelect();
        applyContext(initialContext).then(() => {
            if (!getContextFilterPatch(initialContext)) {
                loadData();
            }
        }).catch(() => loadData());
    }

    window.initializeRescreenBatchesModule = initializeRescreenBatchesModule;
})();
