/**
 * 退貨單管理模組
 *
 * 提供退貨單的 CRUD 功能，包含：
 * - 退貨單列表（分頁、搜尋、排序）
 * - 新增退貨單
 * - 編輯退貨單
 * - 刪除退貨單
 * - 退貨品項管理
 *
 * @module return_orders
 * @requires DataSync - 跨分頁資料同步
 */
(function() {
    'use strict';

    const API_BASE = 'api/return_orders';

    /**
     * 初始化退貨單模組
     * @param {HTMLElement} container - 模組容器
     */
    function initializeReturnOrdersModule(container) {
        const moduleRoot = container.querySelector('[data-module="return_orders"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // 狀態管理
        const state = {
            page: 1,
            perPage: 20,
            keyword: '',
            customerId: '',
            status: '',
            sortField: 'id',
            sortDirection: 'DESC',
            data: [],
            total: 0,
            editingId: null,
            viewingId: null,
        };

        let dataSyncHelper = null;

        function getCurrentTabId() {
            const tabContent = moduleRoot.closest('.tab-content[data-tab-id]');
            return tabContent?.dataset.tabId || null;
        }

        function markCurrentTabChangesClean() {
            const tabId = getCurrentTabId();
            if (tabId && typeof window.markTabChangesClean === 'function') {
                window.markTabChangesClean(tabId);
            }
        }

        // 載入篩選器選項（客戶）
        async function loadFilterOptions() {
            try {
                const response = await fetch('api/customers/index.php?perPage=999');
                const result = await response.json();
                if (result.success) {
                    const customerSelect = elements.filterForm?.querySelector('[name="customer_id"]');
                    if (customerSelect) {
                        const currentValue = customerSelect.value;
                        customerSelect.innerHTML = '<option value="">-- 所有客戶 --</option>' +
                            result.data.map(c => `<option value="${c.id}">${escapeHtml(c.short_name || c.name)}</option>`).join('');
                        customerSelect.value = currentValue;
                        updateFilterSummary();
                    }
                }
            } catch (error) {
                console.error('載入客戶選項失敗:', error);
            }
        }

        // DOM 元素
        const elements = {
            alert: moduleRoot.querySelector('[data-return-orders-alert]'),
            table: moduleRoot.querySelector('[data-return-orders-table]'),
            pagination: moduleRoot.querySelector('[data-return-orders-pagination]'),
            filterForm: moduleRoot.querySelector('[data-return-orders-filter]'),
            filterDrawer: moduleRoot.querySelector('[data-return-orders-filter-drawer]'),
            filterOverlay: moduleRoot.querySelector('[data-return-orders-filter-overlay]'),
            filterSummary: moduleRoot.querySelector('[data-return-orders-filter-summary]'),
            filterCountBadge: moduleRoot.querySelector('[data-return-orders-filter-count]'),
            createBtn: moduleRoot.querySelector('[data-action="create"]'),
            batchPrintBtn: moduleRoot.querySelector('.content-header [data-action="batch-print"]'),
            batchExportBtn: moduleRoot.querySelector('.content-header [data-action="batch-export"], .content-header [data-action="export"]'),
            openFilterDrawerBtn: moduleRoot.querySelector('[data-action="open-filter-drawer"]'),
            closeFilterDrawerBtn: moduleRoot.querySelector('[data-action="close-filter-drawer"]'),
            selectionCountBadge: moduleRoot.querySelector('[data-selection-count]'),
            selectAllRowsCheckbox: moduleRoot.querySelector('[data-return-orders-table] thead [data-action="select-all"]'),
            modal: document.querySelector('[data-return-orders-modal]'),
            modalForm: document.querySelector('[data-return-orders-form]'),
            modalTitle: document.querySelector('[data-modal-title]'),
            modalAlert: document.querySelector('[data-return-orders-modal-alert]'),
            detailModal: document.querySelector('[data-return-orders-detail-modal]'),
            detailContent: document.querySelector('[data-return-orders-details]'),
            customerSelect: document.querySelector('[data-return-orders-form] [name="customer_id"]'),
            shippingOrderSelect: document.querySelector('[data-return-orders-form] [name="original_shipping_order_id"]'),
            itemsSection: document.querySelector('#return-items-section'),
            itemsTableBody: document.querySelector('#shipping-items-table tbody'),
            selectAllItems: document.querySelector('#select-all-items'),
            selectedItemsCount: document.querySelector('#selected-items-count'),
        };
        const selectedReturnOrderIds = new Set();

        // 取得 tbody
        function getTbody() {
            return elements.table ? elements.table.querySelector('tbody') : null;
        }

        function setFilterDrawerOpen(isOpen) {
            const controller = window.ModuleRenderer?.getFilterDrawerController?.('return_orders', moduleRoot);
            if (isOpen) controller?.open();
            else controller?.close();
        }

        function openFilterDrawer() {
            setFilterDrawerOpen(true);
        }

        function closeFilterDrawer() {
            setFilterDrawerOpen(false);
        }

        function collectFilterValues() {
            if (!elements.filterForm) {
                return {
                    keyword: '',
                    customerId: '',
                    customerLabel: '',
                    status: '',
                    statusLabel: '',
                    startDate: '',
                    endDate: '',
                    perPage: 20
                };
            }

            const formData = new FormData(elements.filterForm);
            const getTextValue = (name) => (formData.get(name) || '').toString().trim();
            const getOptionLabel = (name) => {
                const field = elements.filterForm.elements[name];
                if (!(field instanceof HTMLSelectElement)) {
                    return '';
                }

                const selectedOption = field.options[field.selectedIndex];
                if (!selectedOption) {
                    return '';
                }

                const value = (selectedOption.value || '').toString().trim();
                if (value === '') {
                    return '';
                }

                return (selectedOption.textContent || '').replace(/^--\s*|\s*--$/g, '').trim();
            };

            const perPageValue = Number.parseInt(getTextValue('perPage') || '20', 10);

            return {
                keyword: getTextValue('keyword'),
                customerId: getTextValue('customer_id'),
                customerLabel: getOptionLabel('customer_id'),
                status: getTextValue('processing_status'),
                statusLabel: getOptionLabel('processing_status'),
                startDate: getTextValue('start_date'),
                endDate: getTextValue('end_date'),
                perPage: Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 20
            };
        }

        function updateFilterSummary() {
            window.ModuleRenderer?.getFilterDrawerController?.('return_orders', moduleRoot)?.updateSummary();
        }

        function getCurrentPageRowIds() {
            const tbody = getTbody();
            if (!tbody) return [];
            return Array.from(tbody.querySelectorAll('tr[data-id]'))
                .map((row) => Number.parseInt(row.getAttribute('data-id') || '', 10))
                .filter(Number.isInteger);
        }

        function updateSelectionUI() {
            const count = selectedReturnOrderIds.size;
            if (elements.batchPrintBtn) {
                elements.batchPrintBtn.disabled = count === 0;
            }
            if (elements.selectionCountBadge) {
                elements.selectionCountBadge.textContent = String(count);
                elements.selectionCountBadge.classList.toggle('hidden', count === 0);
            }

            const tbody = getTbody();
            if (elements.selectAllRowsCheckbox && tbody) {
                const checkboxes = Array.from(tbody.querySelectorAll('input[data-action="select-row"]'));
                const checkedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
                const hasRows = checkboxes.length > 0;
                elements.selectAllRowsCheckbox.checked = hasRows && checkedCount === checkboxes.length;
                elements.selectAllRowsCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
            }
        }

        // 載入資料
        async function loadData() {
            try {
                const filters = collectFilterValues();
                state.perPage = filters.perPage;

                const params = new URLSearchParams({
                    page: state.page,
                    perPage: state.perPage,
                    sortField: state.sortField,
                    sortDirection: state.sortDirection,
                });

                if (filters.keyword) params.append('keyword', filters.keyword);
                if (filters.customerId) params.append('customer_id', filters.customerId);
                if (filters.status) params.append('status', filters.status);
                if (filters.startDate) params.append('start_date', filters.startDate);
                if (filters.endDate) params.append('end_date', filters.endDate);

                const response = await fetch(`${API_BASE}/index.php?${params}`);
                const result = await response.json();

                if (result.success) {
                    state.data = result.data;
                    state.total = result.pagination.total;
                    renderTable();
                    renderPagination(result.pagination);
                    updateFilterSummary();
                } else {
                    showAlert(result.message, 'danger');
                    updateFilterSummary();
                }
            } catch (error) {
                console.error('載入退貨單失敗:', error);
                showAlert('載入資料失敗。', 'danger');
                updateFilterSummary();
            }
        }

        // 渲染表格
        function renderTable() {
            const tbody = getTbody();
            if (!tbody) return;

            if (state.data.length === 0) {
                selectedReturnOrderIds.clear();
                tbody.innerHTML = `
                    <tr>
                        <td colspan="10" class="text-center text-muted py-4">
                            暫無資料
                        </td>
                    </tr>
                `;
                updateSelectionUI();
                return;
            }

            const visibleIds = new Set(
                state.data
                    .map(item => Number.parseInt(item.id, 10))
                    .filter(Number.isInteger)
            );
            for (const id of Array.from(selectedReturnOrderIds)) {
                if (!visibleIds.has(id)) {
                    selectedReturnOrderIds.delete(id);
                }
            }

            tbody.innerHTML = state.data.map(item => `
                <tr data-id="${item.id}">
                    <td class="checkbox-col">
                        <input type="checkbox" data-action="select-row" value="${item.id}"${selectedReturnOrderIds.has(Number.parseInt(item.id, 10)) ? ' checked' : ''}>
                    </td>
                    <td data-column="return_order_number">${escapeHtml(item.return_order_number || '')}</td>
                    <td data-column="customer_name">${escapeHtml(item.customer_name || '')}</td>
                    <td data-column="shipping_order_number">${escapeHtml(item.shipping_order_number || '-')}</td>
                    <td data-column="return_date">${item.return_date || '-'}</td>
                    <td data-column="item_count">${item.item_count || 0}</td>
                    <td data-column="total_quantity">${item.total_quantity || 0}</td>
                    <td data-column="processing_status">${getStatusBadge(item.processing_status)}</td>
                    <td data-column="created_at">${formatDateTime(item.created_at)}</td>
                    <td class="table-actions">
                        <button type="button" class="btn text" data-action="print" data-id="${item.id}" title="列印">
                            <i class="fas fa-print"></i>
                        </button>
                        <button type="button" class="btn text" data-action="view" data-id="${item.id}" title="檢視">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn text" data-action="edit" data-id="${item.id}" title="編輯">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn text danger" data-action="delete" data-id="${item.id}" title="刪除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            // 套用欄位顯示設定
            const manager = window.returnOrderColumnManager;
            if (manager) {
                manager.onTableUpdated();
            }
            updateSelectionUI();
        }

        // 格式化日期時間
        function formatDateTime(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // 取得狀態徽章
        function getStatusBadge(status) {
            const statusMap = {
                'pending': '<span class="status-badge pending">待處理</span>',
                'processing': '<span class="status-badge in-progress">處理中</span>',
                'completed': '<span class="status-badge completed">已完成</span>',
                'cancelled': '<span class="status-badge cancelled">已取消</span>',
            };
            return statusMap[status] || `<span class="status-badge secondary">${escapeHtml(status || '未知')}</span>`;
        }

        // 渲染分頁
        function renderPagination(pagination) {
            if (!elements.pagination) return;

            const { page, totalPages } = pagination;
            let html = '';

            if (totalPages > 1) {
                html += `<button class="btn btn-sm btn-outline-secondary" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">上一頁</button>`;
                html += `<span class="mx-2">第 ${page} / ${totalPages} 頁</span>`;
                html += `<button class="btn btn-sm btn-outline-secondary" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">下一頁</button>`;
            }

            elements.pagination.innerHTML = html;
        }

        // 顯示提示訊息
        function showAlert(message, type = 'info', isModal = false) {
            const alertEl = isModal ? elements.modalAlert : elements.alert;
            if (alertEl) {
                alertEl.className = `module-alert alert-${type}`;
                alertEl.textContent = message;
                alertEl.classList.remove('hidden');
                if (!isModal) {
                    setTimeout(() => alertEl.classList.add('hidden'), 5000);
                }
            }
        }

        // 隱藏提示訊息
        function hideAlert(isModal = false) {
            const alertEl = isModal ? elements.modalAlert : elements.alert;
            if (alertEl) {
                alertEl.classList.add('hidden');
            }
        }

        // HTML 跳脫
        // 開啟新增 Modal
        function openCreateModal() {
            state.editingId = null;
            if (elements.modalTitle) elements.modalTitle.textContent = '新增退貨單';
            if (elements.modalForm) elements.modalForm.reset();
            resetShippingItems();
            hideAlert(true);
            loadCustomerOptions();
            openModal();
        }

        // 載入客戶選項
        async function loadCustomerOptions() {
            try {
                const response = await fetch('api/customers/index.php?perPage=999');
                const result = await response.json();
                if (result.success) {
                    const customerSelect = elements.modalForm?.querySelector('[name="customer_id"]');
                    if (customerSelect) {
                        customerSelect.innerHTML = '<option value="">-- 請選擇客戶 --</option>' +
                            result.data.map(c => `<option value="${c.id}">${escapeHtml(c.short_name || c.name)}</option>`).join('');
                    }
                }
            } catch (error) {
                console.error('載入客戶選項失敗:', error);
            }
        }

        // 開啟編輯 Modal
        async function openEditModal(id) {
            try {
                const response = await fetch(`${API_BASE}/show.php?id=${id}`);
                const result = await response.json();

                if (result.success) {
                    state.editingId = id;
                    if (elements.modalTitle) elements.modalTitle.textContent = '編輯退貨單';
                    await loadCustomerOptions();
                    populateForm(result.data);
                    hideAlert(true);
                    openModal();
                } else {
                    showAlert(result.message, 'danger');
                }
            } catch (error) {
                console.error('載入退貨單失敗:', error);
                showAlert('載入資料失敗。', 'danger');
            }
        }

        // 填入表單資料
        function populateForm(data) {
            if (!elements.modalForm) return;

            const fields = ['customer_id', 'return_date', 'return_reason', 'processing_status', 'notes', 'original_shipping_order_id'];
            fields.forEach(field => setFieldValue(field, data[field]));

            if (data.customer_id) {
                loadShippingOrdersForCustomer(data.customer_id, data.original_shipping_order_id || null);
            }
        }

        // 開啟 Modal
        function openModal() {
            if (elements.modal) {
                elements.modal.classList.remove('hidden');
            }
        }

        // 關閉 Modal
        function closeModal() {
            if (elements.modal) {
                elements.modal.classList.add('hidden');
            }
            if (elements.modalForm) {
                elements.modalForm.reset();
            }
            state.editingId = null;
            resetShippingItems();
            hideAlert(true);
            markCurrentTabChangesClean();
        }

        // 開啟詳情 Modal
        function openDetailModal() {
            if (elements.detailModal) {
                elements.detailModal.classList.remove('hidden');
            }
        }

        // 關閉詳情 Modal
        function closeDetailModal() {
            if (elements.detailModal) {
                elements.detailModal.classList.add('hidden');
            }
        }

        // 檢視詳情
        async function viewDetail(id) {
            try {
                const response = await fetch(`${API_BASE}/show.php?id=${id}`);
                const result = await response.json();

                if (result.success) {
                    state.viewingId = id;
                    renderDetailContent(result.data);
                    openDetailModal();
                } else {
                    showAlert(result.message, 'danger');
                }
            } catch (error) {
                console.error('載入詳情失敗:', error);
                showAlert('載入資料失敗。', 'danger');
            }
        }

        // 渲染詳情內容
        function renderDetailContent(data) {
            if (!elements.detailContent) return;

            // 來源出貨單資訊
            let shippingOrderInfo = '-';
            if (data.shipping_order_number && data.original_shipping_order_id) {
                shippingOrderInfo = `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span><strong>${escapeHtml(data.shipping_order_number)}</strong></span>
                        <button type="button" class="btn text" data-action="goto-shipping-order" data-id="${data.original_shipping_order_id}" title="查看出貨單">
                            <i class="fas fa-external-link-alt"></i> 查看
                        </button>
                    </div>
                `;
            } else if (data.shipping_order_number) {
                shippingOrderInfo = escapeHtml(data.shipping_order_number);
            }

            elements.detailContent.innerHTML = `
                <div class="detail-grid">
                    <div class="detail-section">
                        <h4>基本資訊</h4>
                        <dl class="detail-list">
                            <dt>退貨單號</dt>
                            <dd>${escapeHtml(data.return_order_number || '')}</dd>
                            <dt>客戶</dt>
                            <dd>${escapeHtml(data.customer_name || '')}</dd>
                            <dt>來源出貨單</dt>
                            <dd>${shippingOrderInfo}</dd>
                            <dt>退貨日期</dt>
                            <dd>${data.return_date || '-'}</dd>
                            <dt>處理狀態</dt>
                            <dd>${getStatusBadge(data.processing_status)}</dd>
                        </dl>
                    </div>
                    <div class="detail-section">
                        <h4>退貨原因</h4>
                        <p>${escapeHtml(data.return_reason || '-')}</p>
                        <h4>備註</h4>
                        <p>${escapeHtml(data.notes || '-')}</p>
                    </div>
                </div>
                ${data.items && data.items.length > 0 ? `
                <div class="detail-section">
                    <h4>退貨品項</h4>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>品項</th>
                                <th>客戶批號</th>
                                <th>出貨數量</th>
                                <th>退貨數量</th>
                                <th>單位</th>
                                <th>原因</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.items.map(item => `
                                <tr>
                                    <td>${escapeHtml(item.screening_item_name || item.part_number || item.sub_item_number || '-') }</td>
                                    <td>${escapeHtml(item.customer_batch_number || '-') }</td>
                                    <td>${item.shipped_quantity || 0}</td>
                                    <td>${item.returned_quantity || 0}</td>
                                    <td>${escapeHtml(item.returned_unit || item.shipped_unit || '-') }</td>
                                    <td>${escapeHtml(item.reason || '-') }</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
            `;
        }

        // 儲存資料
        async function saveData() {
            if (!elements.modalForm) return;

            const formData = new FormData(elements.modalForm);
            const data = Object.fromEntries(formData.entries());

            // 手動收集 disabled 的 select 值
            if (elements.shippingOrderSelect && elements.shippingOrderSelect.value) {
                data.original_shipping_order_id = elements.shippingOrderSelect.value;
            }

            const selectedItems = collectSelectedItems();
            if (elements.shippingOrderSelect && elements.shippingOrderSelect.value && selectedItems.length === 0) {
                showAlert('請至少選擇一項退貨品項。', 'danger', true);
                return;
            }
            if (selectedItems.length > 0) {
                data.items = selectedItems;
            }

            try {
                let url, method;
                if (state.editingId) {
                    url = `${API_BASE}/update.php?id=${state.editingId}`;
                    method = 'PUT';
                } else {
                    url = `${API_BASE}/index.php`;
                    method = 'POST';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.success) {
                    closeModal();
                    loadData();
                    showAlert(state.editingId ? '退貨單已更新。' : '退貨單已建立。', 'success');

                    // 通知其他模組
                    if (dataSyncHelper) {
                        if (state.editingId) {
                            dataSyncHelper.notifyUpdated(result.data);
                        } else {
                            dataSyncHelper.notifyCreated(result.data);
                        }
                    }
                } else {
                    showAlert(result.message, 'danger', true);
                }
            } catch (error) {
                console.error('儲存退貨單失敗:', error);
                showAlert('儲存資料失敗。', 'danger', true);
            }
        }

        // 刪除資料
        async function deleteData(id) {
            let assessment;
            try {
                assessment = await checkWorkflowDelete('return_orders', id);
            } catch (error) {
                const message = error instanceof Error ? error.message : '流程檢查失敗。';
                alert(message);
                return;
            }

            if (!assessment.allowed) {
                await confirmWorkflowDelete(assessment, '此退貨單目前不可刪除。');
                return;
            }

            const confirmed = await confirmWorkflowDelete(assessment, '確定要刪除此退貨單嗎？');
            if (!confirmed) return;

            try {
                const response = await fetch(`${API_BASE}/delete.php?id=${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                const result = await response.json();

                if (result.success) {
                    loadData();

                    if (dataSyncHelper) {
                        dataSyncHelper.notifyDeleted({ id });
                    }
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('刪除退貨單失敗:', error);
                alert('刪除資料失敗。');
            }
        }

        async function checkWorkflowDelete(moduleName, id) {
            const response = await fetch(`api/workflow_guard/check.php?module=${encodeURIComponent(moduleName)}&action=delete&id=${encodeURIComponent(id)}`, {
                credentials: 'include',
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || '流程檢查失敗');
            }
            return result.data || {};
        }

        async function confirmWorkflowDelete(assessment, fallbackMessage, confirmText = '確定刪除') {
            if (typeof window.showWorkflowImpactConfirm === 'function') {
                return window.showWorkflowImpactConfirm({
                    title: '流程影響確認',
                    message: assessment.message || fallbackMessage,
                    impacts: Array.isArray(assessment.impacts) ? assessment.impacts : [],
                    recommendedAction: assessment.recommended_action || '',
                    severity: assessment.severity || 'info',
                    allowConfirm: !!assessment.allowed,
                    confirmText,
                    cancelText: '取消'
                });
            }
            if (!assessment.allowed) {
                return false;
            }
            const impacts = Array.isArray(assessment.impacts) && assessment.impacts.length > 0
                ? `\n\n影響範圍：\n${assessment.impacts.map((impact) => `- ${impact}`).join('\n')}`
                : '';
            return window.confirm(`${assessment.message || fallbackMessage}${impacts}\n\n確定繼續嗎？`);
        }

        // 事件綁定
        function attachEventListeners() {
            // 使用事件委派處理所有 data-action
            moduleRoot.addEventListener('click', handleModuleClick);
            document.addEventListener('click', handleDocumentClick);

            if (elements.modalForm) {
                elements.modalForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    saveData();
                });
            }

            // 新增按鈕（位於 moduleRoot 之外的 header）
            if (elements.createBtn) {
                elements.createBtn.addEventListener('click', openCreateModal);
            }
            if (elements.batchPrintBtn) {
                elements.batchPrintBtn.addEventListener('click', handleBatchPrint);
            }
            if (elements.batchExportBtn) {
                elements.batchExportBtn.addEventListener('click', handleBatchExport);
            }

            // 篩選表單
            if (elements.filterForm) {
                elements.filterForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    state.page = 1;
                    closeFilterDrawer();
                    loadData();
                });

                // 重設按鈕
                elements.filterForm.querySelector('[data-action="reset-filter"]')?.addEventListener('click', () => {
                    elements.filterForm.reset();
                    state.perPage = 20;
                    if ('perPage' in elements.filterForm.elements) {
                        elements.filterForm.elements.perPage.value = '20';
                    }
                    state.page = 1;
                    closeFilterDrawer();
                    updateFilterSummary();
                    loadData();
                });
            }

            // 分頁
            if (elements.pagination) {
                elements.pagination.addEventListener('click', (e) => {
                    const btn = e.target.closest('[data-page]');
                    if (btn && !btn.disabled) {
                        state.page = parseInt(btn.dataset.page, 10);
                        loadData();
                    }
                });
            }

            // 排序
            if (elements.table) {
                elements.table.querySelectorAll('th[data-sort]').forEach(th => {
                    th.style.cursor = 'pointer';
                    th.addEventListener('click', () => {
                        const field = th.dataset.sort;
                        if (state.sortField === field) {
                            state.sortDirection = state.sortDirection === 'ASC' ? 'DESC' : 'ASC';
                        } else {
                            state.sortField = field;
                            state.sortDirection = 'DESC';
                        }
                        loadData();
                    });
                });

                elements.table.addEventListener('change', (event) => {
                    const target = event.target;
                    if (!(target instanceof HTMLInputElement)) {
                        return;
                    }

                    if (target.dataset.action !== 'select-row') {
                        return;
                    }

                    const id = Number.parseInt(target.value || '', 10);
                    if (!Number.isInteger(id)) {
                        return;
                    }

                    if (target.checked) {
                        selectedReturnOrderIds.add(id);
                    } else {
                        selectedReturnOrderIds.delete(id);
                    }
                    updateSelectionUI();
                });
            }

            if (elements.selectAllRowsCheckbox) {
                elements.selectAllRowsCheckbox.addEventListener('change', () => {
                    const shouldCheckAll = elements.selectAllRowsCheckbox.checked;
                    const tbody = getTbody();
                    if (!tbody) return;
                    const checkboxes = tbody.querySelectorAll('input[data-action="select-row"]');
                    checkboxes.forEach((checkbox) => {
                        checkbox.checked = shouldCheckAll;
                        const id = Number.parseInt(checkbox.value || '', 10);
                        if (!Number.isInteger(id)) return;
                        if (shouldCheckAll) {
                            selectedReturnOrderIds.add(id);
                        } else {
                            selectedReturnOrderIds.delete(id);
                        }
                    });
                    updateSelectionUI();
                });
            }

            if (elements.customerSelect) {
                elements.customerSelect.addEventListener('change', (e) => {
                    const customerId = e.target.value;
                    resetShippingItems();
                    if (customerId) {
                        loadShippingOrdersForCustomer(customerId, null);
                    }
                });
            }

            if (elements.shippingOrderSelect) {
                elements.shippingOrderSelect.addEventListener('change', (e) => {
                    const shippingOrderId = e.target.value;
                    if (!shippingOrderId) {
                        resetShippingItems();
                        return;
                    }
                    loadShippingOrderItems(shippingOrderId);
                });
            }

            if (elements.selectAllItems) {
                elements.selectAllItems.addEventListener('change', (e) => {
                    if (!elements.itemsTableBody) return;
                    const checked = e.target.checked;
                    elements.itemsTableBody.querySelectorAll('input[data-item-select]').forEach(cb => {
                        cb.checked = checked;
                    });
                    updateSelectedCount();
                });
            }

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    closeFilterDrawer();
                }
            });
        }

        // 處理模組內點擊事件
        function handleModuleClick(e) {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.id ? parseInt(actionBtn.dataset.id, 10) : null;

            switch (action) {
                case 'create':
                    openCreateModal();
                    break;
                case 'view':
                    if (id) viewDetail(id);
                    break;
                case 'edit':
                    if (id) openEditModal(id);
                    break;
                case 'delete':
                    if (id) deleteData(id);
                    break;
                case 'print':
                    if (id) printReturnOrder(id);
                    break;
            }
        }

        // 處理文件級別點擊事件 (Modal 按鈕)
        function handleDocumentClick(e) {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            // 只處理退貨單相關的 modal
            const inReturnOrdersModal = actionBtn.closest('[data-return-orders-modal]') ||
                                         actionBtn.closest('[data-return-orders-detail-modal]') ||
                                         actionBtn.closest('[data-add-return-item-modal]');
            if (!inReturnOrdersModal) return;

            const action = actionBtn.dataset.action;

            switch (action) {
                case 'close-modal':
                case 'cancel':
                    closeModal();
                    break;
                case 'close-detail-modal':
                    closeDetailModal();
                    break;
                case 'submit':
                    saveData();
                    break;
                case 'edit-from-detail':
                    closeDetailModal();
                    if (state.viewingId) openEditModal(state.viewingId);
                    break;
                case 'goto-shipping-order': {
                    const shippingOrderId = Number.parseInt(actionBtn.dataset.id || '', 10);
                    if (Number.isInteger(shippingOrderId)) {
                        goToShippingOrder(shippingOrderId);
                    }
                    break;
                }
            }
        }

        function setFieldValue(name, value) {
            if (!elements.modalForm) return;
            const field = elements.modalForm.querySelector(`[name="${name}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = !!value;
                } else {
                    field.value = value ?? '';
                }
            } else {
                console.warn(`return_orders: 欄位不存在 - ${name}`);
            }
        }

        function resetShippingItems() {
            if (elements.shippingOrderSelect) {
                elements.shippingOrderSelect.innerHTML = '<option value="">-- 請先選擇客戶 --</option>';
                elements.shippingOrderSelect.disabled = true;
            }
            if (elements.itemsSection) {
                elements.itemsSection.style.display = 'none';
            }
            if (elements.itemsTableBody) {
                elements.itemsTableBody.innerHTML = '';
            }
            if (elements.selectedItemsCount) {
                elements.selectedItemsCount.textContent = '0';
            }
            if (elements.selectAllItems) {
                elements.selectAllItems.checked = false;
            }
        }

        async function loadShippingOrdersForCustomer(customerId, selectedId) {
            if (!elements.shippingOrderSelect) return;
            elements.shippingOrderSelect.disabled = true;
            elements.shippingOrderSelect.innerHTML = '<option value="">載入中...</option>';

            try {
                const response = await fetch(`api/shipping_orders/index.php?customer_id=${customerId}&perPage=100`);
                const result = await response.json();
                if (result.success) {
                    const options = result.data.map(order =>
                        `<option value="${order.id}">${escapeHtml(order.shipping_order_number)} (${order.shipping_date || '-'})</option>`
                    ).join('');
                    elements.shippingOrderSelect.innerHTML = '<option value="">-- 請選擇原出貨單 --</option>' + options;
                    elements.shippingOrderSelect.disabled = false;
                    if (selectedId) {
                        elements.shippingOrderSelect.value = selectedId;
                        if (selectedId) {
                            loadShippingOrderItems(selectedId);
                        }
                    }
                } else {
                    elements.shippingOrderSelect.innerHTML = '<option value="">載入失敗</option>';
                }
            } catch (error) {
                console.error('載入出貨單失敗:', error);
                elements.shippingOrderSelect.innerHTML = '<option value="">載入失敗</option>';
            }
        }

        async function loadShippingOrderItems(shippingOrderId) {
            if (!elements.itemsTableBody || !elements.itemsSection) return;
            elements.itemsSection.style.display = 'block';
            elements.itemsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">載入中...</td></tr>';

            try {
                const response = await fetch(`api/shipping_orders/show.php?id=${shippingOrderId}`);
                const result = await response.json();
                if (result.success && Array.isArray(result.items)) {
                    renderShippingItems(result.items);
                } else {
                    elements.itemsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">無可退貨品項</td></tr>';
                }
            } catch (error) {
                console.error('載入出貨單品項失敗:', error);
                elements.itemsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">載入失敗</td></tr>';
            }
        }

        function renderShippingItems(items) {
            if (!elements.itemsTableBody) return;
            if (!items.length) {
                elements.itemsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">無可退貨品項</td></tr>';
                return;
            }

            elements.itemsTableBody.innerHTML = items.map(item => {
                const itemName = item.screening_item_name || item.inventory_number || '-';
                const batch = item.customer_batch_number || '-';
                const shippedQty = item.shipped_quantity || 0;
                const shippedUnit = item.shipped_unit || '';

                return `
                    <tr>
                        <td class="text-center">
                            <input type="checkbox" data-item-select data-item-id="${item.id}" data-item-unit="${escapeHtml(shippedUnit)}">
                        </td>
                        <td>${escapeHtml(itemName)}</td>
                        <td>${escapeHtml(batch)}</td>
                        <td>${shippedQty} ${escapeHtml(shippedUnit)}</td>
                        <td>
                            <input type="number" class="item-input" data-item-qty min="1" max="${shippedQty}" value="${shippedQty}">
                        </td>
                        <td>
                            <input type="text" class="item-input" data-item-reason placeholder="退貨原因">
                        </td>
                    </tr>
                `;
            }).join('');

            elements.itemsTableBody.querySelectorAll('[data-item-select]').forEach(cb => {
                cb.addEventListener('change', updateSelectedCount);
            });
            updateSelectedCount();
        }

        function updateSelectedCount() {
            if (!elements.itemsTableBody || !elements.selectedItemsCount) return;
            const count = elements.itemsTableBody.querySelectorAll('[data-item-select]:checked').length;
            elements.selectedItemsCount.textContent = String(count);
        }

        function collectSelectedItems() {
            if (!elements.itemsTableBody) return [];
            const items = [];
            elements.itemsTableBody.querySelectorAll('tr').forEach(row => {
                const checkbox = row.querySelector('[data-item-select]');
                if (!checkbox || !checkbox.checked) return;
                const qtyInput = row.querySelector('[data-item-qty]');
                const reasonInput = row.querySelector('[data-item-reason]');
                const returnedQuantity = qtyInput ? qtyInput.value : '';
                if (!returnedQuantity) return;
                items.push({
                    shipping_order_item_id: checkbox.dataset.itemId,
                    returned_quantity: returnedQuantity,
                    returned_unit: checkbox.dataset.itemUnit || '',
                    reason: reasonInput ? reasonInput.value : '',
                });
            });
            return items;
        }

        function csvEscape(value) {
            const text = value == null ? '' : String(value);
            if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
                return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
        }

        function formatDateForFileName() {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        }

        async function handleBatchPrint() {
            const ids = selectedReturnOrderIds.size > 0
                ? Array.from(selectedReturnOrderIds)
                : getCurrentPageRowIds();

            if (ids.length === 0) {
                showAlert('目前沒有可列印的退貨單。', 'warning');
                return;
            }

            const confirmed = window.confirm(`即將開啟 ${ids.length} 筆退貨單列印頁，是否繼續？`);
            if (!confirmed) {
                return;
            }

            ids.forEach((id) => {
                window.open(`print/return_order_print.html?id=${id}`, '_blank');
            });
            showAlert(`已開啟 ${ids.length} 筆退貨單列印頁。`, 'success');
        }

        async function handleBatchExport() {
            try {
                const selectedIds = selectedReturnOrderIds.size > 0 ? Array.from(selectedReturnOrderIds) : [];
                const filters = collectFilterValues();
                const params = new URLSearchParams({
                    page: '1',
                    perPage: selectedIds.length > 0 ? String(Math.max(selectedIds.length, 100)) : '5000',
                    sortField: state.sortField,
                    sortDirection: state.sortDirection
                });

                if (filters.keyword) params.set('keyword', filters.keyword);
                if (filters.customerId) params.set('customer_id', filters.customerId);
                if (filters.status) params.set('status', filters.status);
                if (filters.startDate) params.set('start_date', filters.startDate);
                if (filters.endDate) params.set('end_date', filters.endDate);

                const response = await fetch(`${API_BASE}/index.php?${params.toString()}`);
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || '匯出失敗');
                }

                let rows = Array.isArray(result.data) ? result.data : [];
                if (selectedIds.length > 0) {
                    const idSet = new Set(selectedIds.map((id) => Number.parseInt(id, 10)));
                    rows = rows.filter((row) => idSet.has(Number.parseInt(row.id, 10)));
                }

                if (rows.length === 0) {
                    showAlert('沒有可匯出的退貨單資料。', 'warning');
                    return;
                }

                const csvRows = [
                    ['退貨單號', '客戶', '原出貨單', '退貨日期', '項目數', '退貨總數', '處理狀態', '建立時間'],
                    ...rows.map((row) => [
                        row.return_order_number || '',
                        row.customer_name || '',
                        row.shipping_order_number || '',
                        row.return_date || '',
                        row.item_count ?? 0,
                        row.total_quantity ?? 0,
                        row.processing_status || '',
                        row.created_at || ''
                    ])
                ];

                const csvContent = '\uFEFF' + csvRows.map((line) => line.map(csvEscape).join(',')).join('\r\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `return_orders_${formatDateForFileName()}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showAlert(`已匯出 ${rows.length} 筆退貨單資料。`, 'success');
            } catch (error) {
                console.error('批次匯出退貨單失敗:', error);
                showAlert(error.message || '匯出失敗', 'danger');
            }
        }

        // 列印退貨單
        function printReturnOrder(id) {
            window.open(`print/return_order_print.html?id=${id}`, '_blank');
        }

        // 跳轉到出貨單
        function goToShippingOrder(shippingOrderId) {
            if (typeof window.openTab === 'function') {
                window.openTab('shipping_orders', '出貨單', 'modules/shipping_orders.html');
            } else {
                console.warn('openTab 函數不存在');
            }
        }

        function isModalVisible(modal) {
            return modal && !modal.classList.contains('hidden');
        }

        async function refreshOpenReturnOrderFormForDataSync(sourceModule = null) {
            if (!isModalVisible(elements.modal)) {
                return;
            }

            if (state.editingId) {
                await openEditModal(state.editingId);
                return;
            }

            const currentCustomerId = elements.customerSelect?.value || '';
            const currentShippingOrderId = elements.shippingOrderSelect?.value || '';

            if (sourceModule === 'customers') {
                await loadCustomerOptions();
                if (elements.customerSelect && currentCustomerId) {
                    elements.customerSelect.value = currentCustomerId;
                }
            }

            if (currentCustomerId && ['customers', 'shipping_orders', 'shipping_order_items'].includes(sourceModule)) {
                await loadShippingOrdersForCustomer(currentCustomerId, currentShippingOrderId || null);
            } else if (currentShippingOrderId && ['shipping_orders', 'shipping_order_items'].includes(sourceModule)) {
                await loadShippingOrderItems(currentShippingOrderId);
            }
        }

        async function refreshReturnOrdersForDataSync(sourceModule = null) {
            if (sourceModule === 'customers' || sourceModule === 'shipping_orders') {
                await loadFilterOptions();
            }

            await loadData();

            if (state.viewingId && isModalVisible(elements.detailModal)) {
                await viewDetail(state.viewingId);
            }

            await refreshOpenReturnOrderFormForDataSync(sourceModule);
        }

        // DataSync 訂閱
        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('return_orders', {
                onRefresh: () => refreshReturnOrdersForDataSync(),
                onDependencyUpdate: (sourceModule) => refreshReturnOrdersForDataSync(sourceModule)
            });
        }

        // 公開 API
        window.returnOrdersModule = {
            print: printReturnOrder,
            goToShippingOrder: goToShippingOrder,
            refresh: loadData
        };

        // 初始化
        attachEventListeners();
        loadFilterOptions();
        loadData();
    }

    // 匯出初始化函數
    window.initializeReturnOrdersModule = initializeReturnOrdersModule;
})();
