/**
 * 不良品歷史紀錄模組
 */
(function () {
    'use strict';

    const API_BASE = 'api/defect_history_records';
    const MODULE_NAME = 'defect_history_records';

    function initializeDefectHistoryRecordsModule(container, initialContext = null) {
        const moduleRoot = container.querySelector('[data-module="defect_history_records"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        const state = {
            page: 1,
            perPage: 20,
            keyword: '',
            sourceType: '',
            customerId: '',
            orderId: '',
            workOrderId: '',
            shippingOrderId: '',
            dateFrom: '',
            dateTo: '',
            customers: [],
            sourceTypeOptions: [],
            total: 0,
            totalPages: 1,
            rows: [],
            currentDetailId: null,
            currentContext: initialContext || null,
        };

        const alertBox = moduleRoot.querySelector('[data-defect-history-records-alert]');
        const table = moduleRoot.querySelector('[data-defect-history-records-table]');
        const tbody = table ? table.querySelector('tbody') : null;
        const pagination = moduleRoot.querySelector('[data-defect-history-records-pagination]');
        const filterForm = moduleRoot.querySelector('[data-defect-history-records-filter]');
        const detailModal = moduleRoot.querySelector('[data-defect-history-records-detail-modal]');
        const detailContent = moduleRoot.querySelector('[data-defect-history-records-details]');

        function showAlert(message, type = 'error') {
            if (!alertBox) {
                return;
            }
            alertBox.textContent = message;
            alertBox.className = `module-alert ${type}`;
            alertBox.classList.remove('hidden');
        }

        function hideAlert() {
            if (!alertBox) {
                return;
            }
            alertBox.classList.add('hidden');
            alertBox.textContent = '';
        }

        function setSelectOptions(select, options, defaultLabel) {
            if (!select) {
                return;
            }

            const currentValue = select.value;
            select.innerHTML = '';

            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = defaultLabel;
            select.appendChild(emptyOption);

            options.forEach((option) => {
                const element = document.createElement('option');
                element.value = String(option.value ?? option.id ?? '');
                element.textContent = String(option.label ?? option.name ?? '');
                select.appendChild(element);
            });

            if (currentValue !== '') {
                select.value = currentValue;
            }
        }

        function setFilterFieldValue(name, value) {
            if (!filterForm) {
                return;
            }

            const field = filterForm.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value;
            }
        }

        function formatNumber(value, fractionDigits = 2) {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue)) {
                return '0';
            }

            return numericValue.toLocaleString('zh-TW', {
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits,
            });
        }

        function getSecondScreeningReasonLabel(reason) {
            const labels = {
                relaxed_after_high_defect: '不良過多，客戶放寬後再篩',
                customer_required_second_pass: '客戶每批要求二次篩選',
            };
            return labels[reason] || reason || '';
        }

        function renderSecondScreeningTrace(record) {
            if (!record.rescreen_batch_id && !record.rescreen_batch_number) {
                return '';
            }

            const traceParts = [];
            if (record.rescreen_batch_number) {
                traceParts.push(`案件 ${record.rescreen_batch_number}`);
            }
            if (record.second_screening_reason_label || record.second_screening_reason) {
                traceParts.push(record.second_screening_reason_label || getSecondScreeningReasonLabel(record.second_screening_reason));
            }
            if (record.rescreen_round) {
                traceParts.push(`第 ${record.rescreen_round} 輪`);
            }

            if (traceParts.length === 0) {
                return '';
            }

            return `<div class="subtext">二次篩選：${escapeHtml(traceParts.join(' / '))}</div>`;
        }

        function getContextFilterPatch(context) {
            if (!context || typeof context !== 'object') {
                return null;
            }

            const patch = {};
            const orderId = Number.parseInt(context.orderId ?? context.highlightOrderId ?? '', 10);
            const workOrderId = Number.parseInt(context.workOrderId ?? context.highlightWorkOrderId ?? '', 10);
            const shippingOrderId = Number.parseInt(context.shippingOrderId ?? context.highlightShippingOrderId ?? '', 10);
            const customerId = Number.parseInt(context.customerId ?? context.highlightCustomerId ?? '', 10);

            if (Number.isInteger(orderId) && orderId > 0) {
                patch.orderId = String(orderId);
            }
            if (Number.isInteger(workOrderId) && workOrderId > 0) {
                patch.workOrderId = String(workOrderId);
            }
            if (Number.isInteger(shippingOrderId) && shippingOrderId > 0) {
                patch.shippingOrderId = String(shippingOrderId);
            }
            if (Number.isInteger(customerId) && customerId > 0) {
                patch.customerId = String(customerId);
            }

            return Object.keys(patch).length > 0 ? patch : null;
        }

        function applyContext(context) {
            state.currentContext = context || null;
            const patch = getContextFilterPatch(context);
            if (!patch) {
                return;
            }

            state.page = 1;
            state.customerId = patch.customerId ?? '';
            state.orderId = patch.orderId ?? '';
            state.workOrderId = patch.workOrderId ?? '';
            state.shippingOrderId = patch.shippingOrderId ?? '';
        }

        function collectFilters() {
            if (!filterForm) {
                return;
            }

            const formData = new FormData(filterForm);
            state.keyword = String(formData.get('keyword') || '').trim();
            state.sourceType = String(formData.get('source_type') || '').trim();
            state.customerId = String(formData.get('customer_id') || '').trim();
            state.dateFrom = String(formData.get('date_from') || '').trim();
            state.dateTo = String(formData.get('date_to') || '').trim();
            state.perPage = Number.parseInt(String(formData.get('perPage') || '20'), 10) || 20;
        }

        async function loadData() {
            try {
                const params = new URLSearchParams({
                    page: String(state.page),
                    perPage: String(state.perPage),
                });

                if (state.keyword) params.set('keyword', state.keyword);
                if (state.sourceType) params.set('source_type', state.sourceType);
                if (state.customerId) params.set('customer_id', state.customerId);
                if (state.dateFrom) params.set('date_from', state.dateFrom);
                if (state.dateTo) params.set('date_to', state.dateTo);
                if (state.orderId) params.set('order_id', state.orderId);
                if (state.workOrderId) params.set('work_order_id', state.workOrderId);
                if (state.shippingOrderId) params.set('shipping_order_id', state.shippingOrderId);

                const response = await fetch(`${API_BASE}/?${params.toString()}`, {
                    headers: { 'Accept': 'application/json' }
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || '載入不良品歷史紀錄失敗。');
                }

                state.rows = Array.isArray(result.data) ? result.data : [];
                state.customers = Array.isArray(result.customers) ? result.customers : [];
                state.sourceTypeOptions = Array.isArray(result.sourceTypeOptions) ? result.sourceTypeOptions : [];
                state.total = Number.parseInt(String(result.pagination?.total || 0), 10) || 0;
                state.totalPages = Number.parseInt(String(result.pagination?.totalPages || 1), 10) || 1;

                renderFilterOptions();
                renderTable();
                renderPagination();
                hideAlert();
                refreshDetailIfNeeded();
            } catch (error) {
                showAlert(error.message || '載入失敗。');
            }
        }

        function renderFilterOptions() {
            if (!filterForm) {
                return;
            }

            setSelectOptions(
                filterForm.querySelector('[name="source_type"]'),
                state.sourceTypeOptions,
                '全部來源'
            );
            setSelectOptions(
                filterForm.querySelector('[name="customer_id"]'),
                state.customers,
                '全部客戶'
            );

            setFilterFieldValue('source_type', state.sourceType);
            setFilterFieldValue('customer_id', state.customerId);
            setFilterFieldValue('keyword', state.keyword);
            setFilterFieldValue('date_from', state.dateFrom);
            setFilterFieldValue('date_to', state.dateTo);
            setFilterFieldValue('perPage', String(state.perPage));
        }

        function renderTable() {
            if (!tbody) {
                return;
            }

            if (state.rows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="13" class="text-center">目前沒有不良品歷史資料</td></tr>';
                return;
            }

            tbody.innerHTML = state.rows.map((row) => {
                const rowId = escapeHtml(String(row.id || ''));
                const recordedQuantity = formatNumber(row.recorded_defect_quantity, 2);
                const estimatedUnits = row.defect_units_estimated == null ? '-' : formatNumber(row.defect_units_estimated, 2);
                const defectWeight = row.defect_weight_kg == null ? '-' : formatNumber(row.defect_weight_kg, 3);

                return `
                    <tr data-record-id="${rowId}">
                        <td>${escapeHtml(row.occurred_at || '-')}</td>
                        <td>${escapeHtml(row.source_type_label || '-')}${renderSecondScreeningTrace(row)}</td>
                        <td>${escapeHtml(row.order_number || '-')}</td>
                        <td>${escapeHtml(row.work_order_number || '-')}</td>
                        <td>${escapeHtml(row.shipping_order_number || '-')}</td>
                        <td>${escapeHtml(row.customer_name || '-')}</td>
                        <td>${escapeHtml(row.defect_item_name || '-')}</td>
                        <td class="text-right">${escapeHtml(recordedQuantity)}</td>
                        <td>${escapeHtml(row.shipping_annotation_label || '未標註')}</td>
                        <td>${escapeHtml(row.returned_with_shipment_label || '未送回')}</td>
                        <td class="text-right">${escapeHtml(estimatedUnits)}</td>
                        <td class="text-right">${escapeHtml(defectWeight)}</td>
                        <td class="actions-cell">
                            <button type="button" class="btn text op-action-btn op-role-view" data-action="view" data-id="${rowId}" title="檢視詳情">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${row.order_id ? '<button type="button" class="btn text op-action-btn op-role-order" data-action="open-order" title="開啟訂單"><i class="fas fa-file-invoice"></i></button>' : ''}
                            ${row.work_order_id ? '<button type="button" class="btn text op-action-btn op-role-work-order" data-action="open-work-order" title="開啟工單"><i class="fas fa-clipboard"></i></button>' : ''}
                            ${row.shipping_order_id ? '<button type="button" class="btn text op-action-btn op-role-shipping" data-action="open-shipping-order" title="開啟出貨單"><i class="fas fa-shipping-fast"></i></button>' : ''}
                            ${(row.shipping_annotation_shipping_order_id || row.shipping_order_id) ? '<button type="button" class="btn text op-action-btn op-role-return" data-action="open-return-orders" title="開啟退貨單"><i class="fas fa-undo"></i></button>' : ''}
                            ${row.source_type !== 'rescreen_batch_defect' && row.work_order_id ? '<button type="button" class="btn text op-action-btn op-role-rescreen" data-action="create-second-screening" title="建立二次篩選"><i class="fas fa-redo"></i></button>' : ''}
                            ${row.rescreen_batch_id ? '<button type="button" class="btn text op-action-btn op-role-rescreen" data-action="open-second-screening" title="檢視二次篩選"><i class="fas fa-redo"></i></button>' : ''}
                            ${row.customer_id ? '<button type="button" class="btn text op-action-btn op-role-customer" data-action="open-customer" title="開啟客戶"><i class="fas fa-handshake"></i></button>' : ''}
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function renderPagination() {
            if (!pagination) {
                return;
            }

            const totalPages = Math.max(state.totalPages, 1);
            const currentPage = Math.min(state.page, totalPages);
            pagination.innerHTML = `
                <span class="page-info">第 ${currentPage} / ${totalPages} 頁，共 ${state.total} 筆</span>
                <button type="button" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>上一頁</button>
                <button type="button" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>下一頁</button>
            `;
        }

        function getRowById(recordId) {
            return state.rows.find((row) => String(row.id) === String(recordId)) || null;
        }

        function renderDetail(record) {
            if (!detailContent) {
                return;
            }

            const estimatedUnits = record.defect_units_estimated == null ? '-' : `${formatNumber(record.defect_units_estimated, 2)} 支`;
            const defectWeight = record.defect_weight_kg == null ? '-' : `${formatNumber(record.defect_weight_kg, 3)} kg`;
            const distributionUnits = record.defect_distribution_units_total == null ? '-' : `${formatNumber(record.defect_distribution_units_total, 2)} 支`;
            const unitWeight = record.weight_per_unit_g == null ? '-' : `${formatNumber(record.weight_per_unit_g, 3)} g`;
            const orderNetWeight = record.order_net_weight_kg == null ? '-' : `${formatNumber(record.order_net_weight_kg, 3)} kg`;
            const actualNetWeight = record.actual_net_weight_kg == null ? '-' : `${formatNumber(record.actual_net_weight_kg, 3)} kg`;
            const totalWeight = record.total_weight_kg == null ? '-' : `${formatNumber(record.total_weight_kg, 3)} kg`;
            const shippingStatusLabel = record.shipping_status_label || '-';
            const relatedReturnOrderLabel = record.related_return_order_label || '0 筆';

            detailContent.innerHTML = `
                <div class="detail-grid">
                    <div class="detail-item"><label>來源</label><span>${escapeHtml(record.source_type_label || '-')}</span></div>
                    <div class="detail-item"><label>二次篩選案件</label><span>${escapeHtml(record.rescreen_batch_number || '-')}</span></div>
                    <div class="detail-item"><label>二次篩選原因</label><span>${escapeHtml(record.second_screening_reason_label || getSecondScreeningReasonLabel(record.second_screening_reason) || '-')}</span></div>
                    <div class="detail-item"><label>二次篩選輪次</label><span>${escapeHtml(record.rescreen_round ? `第 ${record.rescreen_round} 輪` : '-')}</span></div>
                    <div class="detail-item"><label>發生時間</label><span>${escapeHtml(record.occurred_at || '-')}</span></div>
                    <div class="detail-item"><label>訂單編號</label><span>${escapeHtml(record.order_number || '-')}</span></div>
                    <div class="detail-item"><label>工單編號</label><span>${escapeHtml(record.work_order_number || '-')}</span></div>
                    <div class="detail-item"><label>出貨單編號</label><span>${escapeHtml(record.shipping_order_number || '-')}</span></div>
                    <div class="detail-item"><label>客戶</label><span>${escapeHtml(record.customer_name || '-')}</span></div>
                    <div class="detail-item"><label>不良項目</label><span>${escapeHtml(record.defect_item_name || '-')}</span></div>
                    <div class="detail-item"><label>記錄數量</label><span>${escapeHtml(formatNumber(record.recorded_defect_quantity, 2))}</span></div>
                    <div class="detail-item"><label>出貨單標註</label><span>${escapeHtml(record.shipping_annotation_label || '未標註')}</span></div>
                    <div class="detail-item"><label>需隨貨送回</label><span>${escapeHtml(record.shipping_return_required_label || '否')}</span></div>
                    <div class="detail-item"><label>已隨貨送回</label><span>${escapeHtml(record.returned_with_shipment_label || '未送回')}</span></div>
                    <div class="detail-item"><label>對應出貨狀態</label><span>${escapeHtml(shippingStatusLabel)}</span></div>
                    <div class="detail-item"><label>關聯退貨單</label><span>${escapeHtml(relatedReturnOrderLabel)}</span></div>
                    <div class="detail-item"><label>推算不良支數</label><span>${escapeHtml(estimatedUnits)}</span></div>
                    <div class="detail-item"><label>推算不良重量</label><span>${escapeHtml(defectWeight)}</span></div>
                    <div class="detail-item"><label>人工分布總數</label><span>${escapeHtml(distributionUnits)}</span></div>
                    <div class="detail-item"><label>單支重</label><span>${escapeHtml(unitWeight)}</span></div>
                    <div class="detail-item"><label>訂單淨重</label><span>${escapeHtml(orderNetWeight)}</span></div>
                    <div class="detail-item"><label>實際淨重</label><span>${escapeHtml(actualNetWeight)}</span></div>
                    <div class="detail-item"><label>摘要總重量</label><span>${escapeHtml(totalWeight)}</span></div>
                    <div class="detail-item full-width"><label>備註</label><span>${escapeHtml(record.notes || '-')}</span></div>
                </div>
                <div class="detail-inline-actions">
                    ${record.order_id ? '<button type="button" class="btn outline small" data-action="open-order"><i class="fas fa-file-invoice"></i> 開啟訂單</button>' : ''}
                    ${record.work_order_id ? '<button type="button" class="btn outline small" data-action="open-work-order"><i class="fas fa-clipboard"></i> 開啟工單</button>' : ''}
                    ${record.shipping_order_id ? '<button type="button" class="btn outline small" data-action="open-shipping-order"><i class="fas fa-shipping-fast"></i> 開啟出貨單</button>' : ''}
                    ${(record.shipping_annotation_shipping_order_id || record.shipping_order_id) ? '<button type="button" class="btn outline small" data-action="open-return-orders"><i class="fas fa-undo"></i> 開啟退貨單</button>' : ''}
                    ${record.source_type !== 'rescreen_batch_defect' && record.work_order_id ? '<button type="button" class="btn outline small" data-action="create-second-screening"><i class="fas fa-redo"></i> 建立二次篩選</button>' : ''}
                    ${record.rescreen_batch_id ? '<button type="button" class="btn outline small" data-action="open-second-screening"><i class="fas fa-redo"></i> 檢視二次篩選</button>' : ''}
                    ${record.customer_id ? '<button type="button" class="btn outline small" data-action="open-customer"><i class="fas fa-handshake"></i> 開啟客戶</button>' : ''}
                </div>
            `;
        }

        function openDetail(recordId) {
            const record = getRowById(recordId);
            if (!record || !detailModal) {
                return;
            }

            state.currentDetailId = String(record.id);
            renderDetail(record);
            detailModal.classList.remove('hidden');
        }

        function closeDetail() {
            if (!detailModal) {
                return;
            }
            detailModal.classList.add('hidden');
            state.currentDetailId = null;
        }

        function refreshDetailIfNeeded() {
            if (!state.currentDetailId || !detailModal || detailModal.classList.contains('hidden')) {
                return;
            }

            const record = getRowById(state.currentDetailId);
            if (!record) {
                closeDetail();
                return;
            }
            renderDetail(record);
        }

        function openRelatedModule(action, record) {
            if (!record) {
                return;
            }

            switch (action) {
                case 'open-order':
                    if (record.order_id && typeof window.openTabAndNavigate === 'function') {
                        window.openTabAndNavigate('orders', '訂單主表管理', { orderId: record.order_id });
                    }
                    break;
                case 'open-work-order':
                    if (record.work_order_id && typeof window.openTabAndNavigate === 'function') {
                        window.openTabAndNavigate('work_orders', '生產工單', { workOrderId: record.work_order_id });
                    }
                    break;
                case 'open-shipping-order':
                    if (record.shipping_order_id && typeof window.openTabAndNavigate === 'function') {
                        window.openTabAndNavigate('shipping_orders', '出貨單', { shippingOrderId: record.shipping_order_id });
                    }
                    break;
                case 'open-customer':
                    if (record.customer_id && typeof window.openTab === 'function') {
                        window.openTab('customers', '客戶基本資料', 'modules/customers.html', {
                            context: { customerId: record.customer_id }
                        });
                    }
                    break;
                case 'open-return-orders': {
                    const shippingOrderId = Number.parseInt(
                        String(record.shipping_annotation_shipping_order_id || record.shipping_order_id || ''),
                        10
                    );
                    if (Number.isInteger(shippingOrderId) && shippingOrderId > 0) {
                        if (typeof window.openTabAndNavigate === 'function') {
                            window.openTabAndNavigate('return_orders', '退貨單', {
                                originalShippingOrderId: shippingOrderId,
                                shippingOrderId
                            });
                        } else if (typeof window.openTab === 'function') {
                            window.openTab('return_orders', '退貨單', 'modules/return_orders.html', {
                                context: {
                                    originalShippingOrderId: shippingOrderId,
                                    shippingOrderId
                                }
                            });
                        }
                    }
                    break;
                }
                case 'create-second-screening':
                    if (record.work_order_id && typeof window.openTab === 'function') {
                        window.openTab('rescreen_batches', '二次篩選紀錄', 'modules/rescreen_batches.html', {
                            context: {
                                action: 'create',
                                sourceWorkOrderId: record.work_order_id,
                                workOrderId: record.work_order_id,
                                secondScreeningReason: 'relaxed_after_high_defect',
                                rescreenType: 'relaxed_rescreen',
                                sourceDefectHistoryRecordId: record.source_record_id,
                                customerApprovalReference: '由不良品歷史紀錄建立，請補客戶放寬標準通知或核准依據。',
                                notes: `來源不良紀錄：${record.source_type_label || ''} / ${record.defect_item_name || ''}`,
                            }
                        });
                    }
                    break;
                case 'open-second-screening':
                    if (record.rescreen_batch_id && typeof window.openTab === 'function') {
                        window.openTab('rescreen_batches', '二次篩選紀錄', 'modules/rescreen_batches.html', {
                            context: {
                                action: 'view',
                                rescreenBatchId: record.rescreen_batch_id,
                            }
                        });
                    }
                    break;
            }
        }

        function resolveRecordFromTarget(target) {
            const row = target.closest('tr[data-record-id]');
            if (!row) {
                return null;
            }
            return getRowById(row.getAttribute('data-record-id') || '');
        }

        function bindEvents() {
            moduleRoot.addEventListener('click', (event) => {
                const actionTarget = event.target.closest('[data-action]');
                if (!actionTarget) {
                    return;
                }

                const action = actionTarget.getAttribute('data-action') || '';
                if (action === 'close-detail-modal') {
                    closeDetail();
                    return;
                }

                if (action === 'view') {
                    openDetail(actionTarget.getAttribute('data-id') || '');
                    return;
                }

                const record = resolveRecordFromTarget(actionTarget) || getRowById(state.currentDetailId || '');
                openRelatedModule(action, record);
            });

            if (pagination) {
                pagination.addEventListener('click', (event) => {
                    const button = event.target.closest('button[data-page]');
                    if (!button || button.disabled) {
                        return;
                    }
                    const nextPage = Number.parseInt(button.getAttribute('data-page') || '', 10);
                    if (!Number.isInteger(nextPage) || nextPage <= 0) {
                        return;
                    }
                    state.page = nextPage;
                    loadData();
                });
            }

            if (filterForm) {
                filterForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    collectFilters();
                    state.page = 1;
                    state.orderId = '';
                    state.workOrderId = '';
                    state.shippingOrderId = '';
                    loadData();
                });

                filterForm.addEventListener('click', (event) => {
                    if (!event.target.closest('[data-action="reset-filter"]')) {
                        return;
                    }
                    filterForm.reset();
                    state.page = 1;
                    state.perPage = 20;
                    state.keyword = '';
                    state.sourceType = '';
                    state.customerId = '';
                    state.dateFrom = '';
                    state.dateTo = '';
                    state.orderId = '';
                    state.workOrderId = '';
                    state.shippingOrderId = '';
                    loadData();
                });
            }

            container.addEventListener('module:context', (event) => {
                applyContext(event.detail?.context || null);
                loadData();
            });
        }

        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper(MODULE_NAME, {
                onRefresh: () => loadData(),
                onDependencyUpdate: () => loadData(),
                debounceMs: 300,
            });
        }

        window.defectHistoryRecordsModule = {
            refresh: loadData,
            openByContext(context) {
                applyContext(context);
                loadData();
            }
        };

        applyContext(initialContext);
        bindEvents();
        loadData();
    }

    window.initializeDefectHistoryRecordsModule = initializeDefectHistoryRecordsModule;
})();
