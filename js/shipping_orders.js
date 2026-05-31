/**
 * Shipping Orders Module
 * 管理出貨單的 CRUD 操作
 */

(function() {
    'use strict';

    // 初始化函數 (改為 async)
    async function initializeShippingOrdersModule(container, initialContext = null) {
        const moduleRoot = container.querySelector('[data-module="shipping_orders"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        // 動態載入退貨 Modal HTML
        async function loadReturnModals(root) {
            try {
                const response = await fetch('modules/shipping_order_return_modals.html');
                if (response.ok) {
                    const html = await response.text();
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    // 將 Modal HTML 附加到 moduleRoot
                    while (tempDiv.firstChild) {
                        root.appendChild(tempDiv.firstChild);
                    }
                    return true;
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                console.error('❌ 載入退貨 Modal 失敗:', error);
                // 在頁面顯示錯誤提示
                const alert = root.querySelector('[data-shipping-orders-alert]');
                if (alert) {
                    alert.className = 'module-alert error';
                    alert.textContent = '⚠️ 退貨功能載入失敗，建立退貨單功能暫時無法使用。請重新整理頁面或聯繫系統管理員。';
                    alert.classList.remove('hidden');
                    // 5秒後自動隱藏
                    setTimeout(() => {
                        alert.classList.add('hidden');
                    }, 5000);
                }
                return false;
            }
        }

        // 等待 Modal HTML 載入完成
        await loadReturnModals(moduleRoot);

        // DOM Elements
        const elements = {
            alert: moduleRoot.querySelector('[data-shipping-orders-alert]'),
            table: moduleRoot.querySelector('[data-shipping-orders-table]'),
            tbody: moduleRoot.querySelector('[data-shipping-orders-table] tbody'),
            pagination: moduleRoot.querySelector('[data-shipping-orders-pagination]'),
            filterForm: moduleRoot.querySelector('[data-shipping-orders-filter]'),
            filterDrawer: moduleRoot.querySelector('[data-shipping-orders-filter-drawer]'),
            filterOverlay: moduleRoot.querySelector('[data-shipping-orders-filter-overlay]'),
            filterSummary: moduleRoot.querySelector('[data-shipping-orders-filter-summary]'),
            filterCountBadge: moduleRoot.querySelector('[data-shipping-orders-filter-count]'),
            modal: moduleRoot.querySelector('[data-shipping-orders-modal]'),
            modalForm: moduleRoot.querySelector('[data-shipping-orders-form]'),
            modalAlert: moduleRoot.querySelector('[data-shipping-orders-modal-alert]'),
            modalTitle: moduleRoot.querySelector('[data-modal-title]'),
            detailModal: moduleRoot.querySelector('[data-shipping-orders-detail-modal]'),
            detailContent: moduleRoot.querySelector('[data-shipping-orders-details]'),
            createButton: moduleRoot.querySelector('.content-header [data-action="create"]'),
            batchPrintButton: moduleRoot.querySelector('.content-header [data-action="batch-print"]'),
            batchExportButton: moduleRoot.querySelector('.content-header [data-action="batch-export"], .content-header [data-action="export"]'),
            openFilterDrawerButton: moduleRoot.querySelector('[data-action="open-filter-drawer"]'),
            closeFilterDrawerButton: moduleRoot.querySelector('[data-action="close-filter-drawer"]'),
            selectAllCheckbox: moduleRoot.querySelector('[data-shipping-orders-table] thead [data-action="select-all"]'),
            addItemModal: moduleRoot.querySelector('[data-add-item-modal]'),
            addItemForm: moduleRoot.querySelector('[data-add-item-form]'),
            addItemModalAlert: moduleRoot.querySelector('[data-add-item-modal-alert]'),
        };

        // State
        const state = {
            currentPage: 1,
            perPage: 20,
            totalPages: 1,
            sortField: 'id',
            sortDirection: 'DESC',
            editingId: null,
            customers: [],
            orders: [],
            inventoryItems: [],
            addItemContext: null,
            shippingStatuses: [],
        };
        const selectedShippingOrderIds = new Set();

        // Initialize
        init();

        async function handleIncomingContext(context) {
            if (!context || typeof context !== 'object') {
                return;
            }

            const rawId = context.shippingOrderId ?? context.highlightId ?? null;
            if (rawId === null || rawId === undefined || rawId === '') {
                return;
            }

            const shippingOrderId = Number.parseInt(rawId, 10);
            if (!Number.isInteger(shippingOrderId) || shippingOrderId <= 0) {
                return;
            }

            state.currentPage = 1;
            await loadShippingOrders();
            await openDetailModal(shippingOrderId);
        }

        function init() {
            loadCustomers();
            loadOrders();
            loadShippingStatuses();
            loadShippingOrders();
            attachEventListeners();

            // Handle initial context
            setTimeout(() => {
                handleIncomingContext(initialContext).catch((error) => {
                    console.error('處理初始導頁參數失敗:', error);
                });
            }, 500);

            // Handle context updates for already-open tabs
            container.addEventListener('module:context', (event) => {
                handleIncomingContext(event?.detail?.context ?? null).catch((error) => {
                    console.error('處理模組導頁參數失敗:', error);
                });
            });
        }

        function attachEventListeners() {
            // Header buttons
            if (elements.createButton) {
                elements.createButton.addEventListener('click', () => openCreateModal());
            }
            if (elements.batchPrintButton) {
                elements.batchPrintButton.addEventListener('click', handleBatchPrint);
            }
            if (elements.batchExportButton) {
                elements.batchExportButton.addEventListener('click', handleBatchExport);
            }

            // Filter form
            if (elements.filterForm) {
                elements.filterForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    state.currentPage = 1;
                    closeFilterDrawer();
                    loadShippingOrders();
                });

                const resetButton = elements.filterForm.querySelector('[data-action="reset-filter"]');
                if (resetButton) {
                    resetButton.addEventListener('click', resetFilters);
                }
            }

            // Table sorting
            if (elements.table) {
                const headers = elements.table.querySelectorAll('th[data-sort]');
                headers.forEach(header => {
                    header.addEventListener('click', () => {
                        const field = header.dataset.sort;
                        if (state.sortField === field) {
                            state.sortDirection = state.sortDirection === 'ASC' ? 'DESC' : 'ASC';
                        } else {
                            state.sortField = field;
                            state.sortDirection = 'DESC';
                        }
                        loadShippingOrders();
                    });
                });

                elements.table.addEventListener('change', (event) => {
                    const target = event.target;
                    if (!(target instanceof HTMLInputElement)) {
                        return;
                    }

                    if (target.dataset.action === 'select-row') {
                        const id = Number.parseInt(target.value || '', 10);
                        if (!Number.isInteger(id)) {
                            return;
                        }

                        if (target.checked) {
                            selectedShippingOrderIds.add(id);
                        } else {
                            selectedShippingOrderIds.delete(id);
                        }
                        updateSelectionState();
                    }
                });
            }

            if (elements.selectAllCheckbox) {
                elements.selectAllCheckbox.addEventListener('change', () => {
                    const shouldCheckAll = elements.selectAllCheckbox.checked;
                    const checkboxes = elements.tbody
                        ? elements.tbody.querySelectorAll('input[data-action="select-row"]')
                        : [];

                    checkboxes.forEach((checkbox) => {
                        checkbox.checked = shouldCheckAll;
                        const id = Number.parseInt(checkbox.value || '', 10);
                        if (!Number.isInteger(id)) {
                            return;
                        }

                        if (shouldCheckAll) {
                            selectedShippingOrderIds.add(id);
                        } else {
                            selectedShippingOrderIds.delete(id);
                        }
                    });

                    updateSelectionState();
                });
            }

            // Modal close buttons
            if (elements.modal) {
                // 綁定關閉和取消按鈕
                elements.modal.querySelectorAll('[data-action="close-modal"], [data-action="cancel"]').forEach(btn => {
                    btn.addEventListener('click', closeModal);
                });

                const submitButton = elements.modal.querySelector('[data-action="submit"]');
                if (submitButton) {
                    submitButton.addEventListener('click', handleSubmit);
                }

                // Customer change -> filter orders
                const customerSelect = elements.modalForm?.querySelector('[name="customer_id"]');
                if (customerSelect) {
                    customerSelect.addEventListener('change', () => {
                        populateOrderSelect(customerSelect.value);
                    });
                }
            }

            // Detail modal
            if (elements.detailModal) {
                const closeButtons = elements.detailModal.querySelectorAll('[data-action="close-detail-modal"]');
                closeButtons.forEach(btn => {
                    btn.addEventListener('click', closeDetailModal);
                });

                const editButton = elements.detailModal.querySelector('[data-action="edit-from-detail"]');
                if (editButton) {
                    editButton.addEventListener('click', () => {
                        const idToEdit = state.editingId; // 先保存 ID
                        if (idToEdit) {
                            closeDetailModal();
                            openEditModal(idToEdit);
                        }
                    });
                }

                const printButton = elements.detailModal.querySelector('[data-action="print-detail"]');
                if (printButton) {
                    printButton.addEventListener('click', () => {
                        if (state.editingId) {
                            printShippingOrder(state.editingId);
                        }
                    });
                }
            }

            // Add item modal
            if (elements.addItemModal) {
                const closeButtons = elements.addItemModal.querySelectorAll('[data-action="close-add-item-modal"]');
                closeButtons.forEach(btn => {
                    btn.addEventListener('click', closeAddItemModal);
                });

                const submitButton = elements.addItemModal.querySelector('[data-action="submit-add-item"]');
                if (submitButton) {
                    submitButton.addEventListener('click', handleAddItem);
                }

                // Inventory item selection change
                const itemSelect = elements.addItemForm?.querySelector('[name="inventory_item_id"]');
                if (itemSelect) {
                    itemSelect.addEventListener('change', handleInventoryItemChange);
                }
            }

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    closeFilterDrawer();
                }
            });
        }

        function setFilterDrawerOpen(isOpen) {
            const controller = window.ModuleRenderer?.getFilterDrawerController?.('shipping_orders', moduleRoot);
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
                    perPage: 20,
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
                status: getTextValue('status'),
                statusLabel: getOptionLabel('status'),
                startDate: getTextValue('start_date'),
                endDate: getTextValue('end_date'),
                perPage: Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 20,
            };
        }

        function updateFilterSummary() {
            window.ModuleRenderer?.getFilterDrawerController?.('shipping_orders', moduleRoot)?.updateSummary();
        }

        function updateSelectionState() {
            if (!elements.tbody) {
                return;
            }

            const checkboxes = Array.from(elements.tbody.querySelectorAll('input[data-action="select-row"]'));
            const checkedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
            const hasRows = checkboxes.length > 0;
            if (elements.selectAllCheckbox) {
                elements.selectAllCheckbox.checked = hasRows && checkedCount === checkboxes.length;
                elements.selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
            }
        }

        // API Calls
        async function loadCustomers() {
            try {
                const response = await fetch('api/customers/index.php?perPage=1000&is_active=1', {
                    credentials: 'include'
                });
                const data = await response.json();
                // 客戶 API 回傳的是 data 不是 items
                state.customers = data.data || data.items || [];
                populateCustomerSelects();
            } catch (error) {
                console.error('載入客戶失敗:', error);
            }
        }

        async function loadOrders() {
            try {
                const response = await fetch('api/orders/index.php?perPage=1000', {
                    credentials: 'include'
                });
                const data = await response.json();
                // 訂單 API 回傳的可能是 data 或 items
                state.orders = data.data || data.items || [];
            } catch (error) {
                console.error('載入訂單失敗:', error);
            }
        }

        async function loadShippingStatuses() {
            try {
                const response = await fetch('api/lookup_values/index.php?domain_key=shipping_status&is_active=1&perPage=100', {
                    credentials: 'include'
                });
                const data = await response.json();
                const list = Array.isArray(data.data || data.items) ? (data.data || data.items) : [];
                state.shippingStatuses = list.length > 0 ? list : getDefaultShippingStatuses();
                populateStatusSelects();
            } catch (error) {
                console.error('載入出貨狀態失敗:', error);
                state.shippingStatuses = getDefaultShippingStatuses();
                populateStatusSelects();
            }
        }

        function getDefaultShippingStatuses() {
            return [
                { value_key: 'draft', value_label: '草稿' },
                { value_key: 'confirmed', value_label: '已確認' },
                { value_key: 'preparing', value_label: '準備中' },
                { value_key: 'packed', value_label: '已包裝' },
                { value_key: 'shipped', value_label: '已出貨' },
                { value_key: 'delivered', value_label: '已送達' },
                { value_key: 'cancelled', value_label: '已取消' }
            ];
        }

        function populateStatusSelects() {
            const filterSelect = elements.filterForm?.querySelector('[name="status"]');
            const modalSelect = elements.modalForm?.querySelector('[name="status"]');
            const statusList = state.shippingStatuses.length ? state.shippingStatuses : getDefaultShippingStatuses();

            // 篩選表單的狀態選單
            if (filterSelect) {
                const currentValue = filterSelect.value;
                filterSelect.innerHTML = '<option value="">-- 所有狀態 --</option>';
                statusList.forEach(status => {
                    filterSelect.innerHTML += `<option value="${escapeHtml(status.value_key)}">${escapeHtml(status.value_label)}</option>`;
                });
                filterSelect.value = currentValue;
            }

            // Modal 表單的狀態選單
            if (modalSelect) {
                const currentValue = modalSelect.value;
                modalSelect.innerHTML = '';
                statusList.forEach(status => {
                    modalSelect.innerHTML += `<option value="${escapeHtml(status.value_key)}">${escapeHtml(status.value_label)}</option>`;
                });
                // 預設選草稿
                modalSelect.value = currentValue || 'draft';
            }
        }

        async function loadShippingOrders() {
            try {
                const filterValues = collectFilterValues();
                const params = new URLSearchParams();
                state.perPage = filterValues.perPage;

                params.set('page', state.currentPage);
                params.set('perPage', String(state.perPage));
                params.set('sortField', state.sortField);
                params.set('sortDirection', state.sortDirection);

                if (filterValues.keyword) params.set('keyword', filterValues.keyword);
                if (filterValues.customerId) params.set('customer_id', filterValues.customerId);
                if (filterValues.status) params.set('status', filterValues.status);
                if (filterValues.startDate) params.set('start_date', filterValues.startDate);
                if (filterValues.endDate) params.set('end_date', filterValues.endDate);

                const response = await fetch(`api/shipping_orders/index.php?${params.toString()}`, {
                    credentials: 'include'
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || '載入失敗');
                }

                renderTable(data.data || []);
                renderPagination(data.pagination || {});
                updateFilterSummary();
            } catch (error) {
                console.error('載入出貨單失敗:', error);
                showAlert('error', error.message);
                updateFilterSummary();
            }
        }

        async function createShippingOrder(data) {
            const response = await fetch('api/shipping_orders/index.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || '新增失敗');
            }
            return result;
        }

        async function updateShippingOrder(id, data) {
            const response = await fetch(`api/shipping_orders/update.php?id=${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || '更新失敗');
            }
            return result;
        }

        async function deleteShippingOrder(id) {
            const response = await fetch(`api/shipping_orders/delete.php?id=${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || '刪除失敗');
            }
            return result;
        }

        async function getShippingOrderDetail(id) {
            const response = await fetch(`api/shipping_orders/show.php?id=${id}`, {
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || '載入詳情失敗');
            }
            // API 返回 { success, order, items }，轉換為 { order, items } 結構
            return {
                order: result.order,
                items: result.items || []
            };
        }

        // Render Functions

function renderTable(items) {
            if (!elements.tbody) return;

            if (items.length === 0) {
                selectedShippingOrderIds.clear();
                updateSelectionState();
                elements.tbody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="10" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-shipping-fast" style="font-size: 3rem; color: #ccc;"></i>
                            <p style="color: #999; margin-top: 1rem;">暫無出貨單資料</p>
                        </td>
                    </tr>
                `;
                return;
            }

            const visibleIds = new Set(items.map(item => Number.parseInt(item.id, 10)).filter(Number.isInteger));
            for (const id of Array.from(selectedShippingOrderIds)) {
                if (!visibleIds.has(id)) {
                    selectedShippingOrderIds.delete(id);
                }
            }

            elements.tbody.innerHTML = items.map(item => {
                const statusClass = getStatusClass(item.status);
                const isSelected = selectedShippingOrderIds.has(Number.parseInt(item.id, 10)) ? ' checked' : '';
                return `
                <tr data-id="${item.id}">
                    <td class="checkbox-col">
                        <input type="checkbox" data-action="select-row" value="${item.id}"${isSelected}>
                    </td>
                    <td><strong>${escapeHtml(item.shipping_order_number) || '-'}</strong></td>
                    <td>${escapeHtml(item.customer_name) || '-'}</td>
                    <td>${item.shipping_date ? formatDate(item.shipping_date) : '-'}</td>
                    <td>${item.item_count || 0}</td>
                    <td>${formatNumber(item.total_quantity || 0)}</td>
                    <td>${getDeliveryMethodLabel(item.delivery_method)}</td>
                    <td><span class="status-badge ${statusClass}">${getStatusLabel(item.status)}</span></td>
                    <td>${formatDateTime(item.created_at)}</td>
                    <td class="table-actions">
                        <button type="button" class="btn text" title="列印" onclick="window.shippingOrdersModule.print(${item.id})">
                            <i class="fas fa-print"></i>
                        </button>
                        <button type="button" class="btn text" title="項目/明細" onclick="window.shippingOrdersModule.viewDetail(${item.id})">
                            <i class="fas fa-list"></i>
                        </button>
                        <button type="button" class="btn text" title="編輯" onclick="window.shippingOrdersModule.edit(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${item.status === 'draft' ? `
                        <button type="button" class="btn text" title="新增項目" onclick="window.shippingOrdersModule.openAddItem(${item.id}, ${item.customer_id || 'null'})">
                            <i class="fas fa-plus"></i>
                        </button>
                        ` : ''}
                        <button type="button" class="btn text danger" title="刪除" onclick="window.shippingOrdersModule.delete(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            }).join('');

            // 通知欄位管理器表格已更新
            const manager = window.shippingOrderColumnManager;
            if (manager && typeof manager.onTableUpdated === 'function') {
                manager.onTableUpdated();
            }
            updateSelectionState();
        }

        function renderPagination(pagination) {
            if (!elements.pagination) return;

            const { page, totalPages, total } = pagination;
            let html = '<div class="pagination">';

            html += `<button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} onclick="window.shippingOrdersModule.goToPage(${page - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;

            const startPage = Math.max(1, page - 2);
            const endPage = Math.min(totalPages, page + 2);

            if (startPage > 1) {
                html += `<button class="pagination-btn" onclick="window.shippingOrdersModule.goToPage(1)">1</button>`;
                if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
            }

            for (let i = startPage; i <= endPage; i++) {
                html += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="window.shippingOrdersModule.goToPage(${i})">${i}</button>`;
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
                html += `<button class="pagination-btn" onclick="window.shippingOrdersModule.goToPage(${totalPages})">${totalPages}</button>`;
            }

            html += `<button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} onclick="window.shippingOrdersModule.goToPage(${page + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;

            html += `<span class="pagination-info">共 ${total || 0} 筆</span>`;
            html += '</div>';

            elements.pagination.innerHTML = html;
        }

        function populateCustomerSelects() {
            const filterSelect = elements.filterForm?.querySelector('[name="customer_id"]');
            const modalSelect = elements.modalForm?.querySelector('[name="customer_id"]');

            // 篩選表單的客戶選單
            if (filterSelect) {
                const currentValue = filterSelect.value;
                filterSelect.innerHTML = '<option value="">-- 所有客戶 --</option>';
                state.customers.forEach(customer => {
                    filterSelect.innerHTML += `<option value="${customer.id}">${escapeHtml(customer.customer_number)} - ${escapeHtml(customer.name)}</option>`;
                });
                filterSelect.value = currentValue;
            }

            // Modal 表單的客戶選單
            if (modalSelect) {
                const currentValue = modalSelect.value;
                modalSelect.innerHTML = '<option value="">-- 請選擇客戶 --</option>';
                state.customers.forEach(customer => {
                    modalSelect.innerHTML += `<option value="${Number(customer.id)}">${escapeHtml(customer.customer_number)} - ${escapeHtml(customer.name)}</option>`;
                });
                modalSelect.value = currentValue;
            }
        }

        function populateOrderSelect(customerId) {
            const select = elements.modalForm?.querySelector('[name="order_id"]');
            if (!select) return;

            select.innerHTML = '<option value="">-- 不關聯訂單 --</option>';

            const filteredOrders = customerId
                ? state.orders.filter(o => String(o.customer?.id || o.customer_id) === String(customerId))
                : state.orders;

            filteredOrders.forEach(order => {
                select.innerHTML += `<option value="${order.id}">${escapeHtml(order.order_number)}</option>`;
            });
        }

        // Modal Functions
        async function openCreateModal() {
            // 確保客戶資料和狀態資料已載入
            if (state.customers.length === 0) {
                await loadCustomers();
            }
            if (state.shippingStatuses.length === 0) {
                await loadShippingStatuses();
            }

            state.editingId = null;
            elements.modalForm.reset();
            elements.modalTitle.textContent = '新增出貨單';

            // 填充客戶選單
            const customerSelect = elements.modalForm.querySelector('[name="customer_id"]');
            if (customerSelect) {
                customerSelect.innerHTML = '<option value="">-- 請選擇客戶 --</option>';
                state.customers.forEach(customer => {
                    customerSelect.innerHTML += `<option value="${customer.id}">${escapeHtml(customer.customer_number)} - ${escapeHtml(customer.name)}</option>`;
                });
            }

            // 填充狀態選單
            const statusSelect = elements.modalForm.querySelector('[name="status"]');
            if (statusSelect) {
                statusSelect.innerHTML = '';
                const statusList = state.shippingStatuses.length ? state.shippingStatuses : getDefaultShippingStatuses();
                statusList.forEach(status => {
                    statusSelect.innerHTML += `<option value="${escapeHtml(status.value_key)}">${escapeHtml(status.value_label)}</option>`;
                });
                statusSelect.value = 'draft'; // 預設選草稿
            }

            populateOrderSelect();
            elements.modal.classList.remove('hidden');
            hideModalAlert();
        }

        async function openEditModal(id) {
            try {
                // 確保客戶資料和狀態資料已載入
                if (state.customers.length === 0) {
                    await loadCustomers();
                }

                if (state.shippingStatuses.length === 0) {
                    await loadShippingStatuses();
                }

                const data = await getShippingOrderDetail(id);
                const order = data.order;

                if (!order) {
                    throw new Error('無法取得出貨單資料');
                }

                state.editingId = id;
                elements.modalForm.reset();
                elements.modalTitle.textContent = '編輯出貨單';

                // 先確保客戶選單選項已填充
                const customerSelect = elements.modalForm.querySelector('[name="customer_id"]');

                if (customerSelect) {
                    // 重新填充客戶選單
                    customerSelect.innerHTML = '<option value="">-- 請選擇客戶 --</option>';
                    state.customers.forEach(customer => {
                        customerSelect.innerHTML += `<option value="${customer.id}">${escapeHtml(customer.customer_number)} - ${escapeHtml(customer.name)}</option>`;
                    });

                    // 設定選中的客戶
                    if (order.customer_id) {
                        customerSelect.value = order.customer_id;
                    }
                }

                // 填充訂單選單並設定值
                populateOrderSelect(order.customer_id);
                if (order.order_id) {
                    const orderSelect = elements.modalForm.querySelector('[name="order_id"]');
                    if (orderSelect) {
                        orderSelect.value = order.order_id;
                    }
                }

                // 確保狀態選單選項已填充
                const statusSelect = elements.modalForm.querySelector('[name="status"]');
                if (statusSelect) {
                    statusSelect.innerHTML = '';
                    const statusList = state.shippingStatuses.length ? state.shippingStatuses : getDefaultShippingStatuses();
                    statusList.forEach(status => {
                        statusSelect.innerHTML += `<option value="${escapeHtml(status.value_key)}">${escapeHtml(status.value_label)}</option>`;
                    });
                    // 設定當前狀態值
                    if (order.status && !statusSelect.querySelector(`option[value="${order.status}"]`)) {
                        const fallbackOption = document.createElement('option');
                        fallbackOption.value = order.status;
                        fallbackOption.textContent = order.status_label || order.status;
                        statusSelect.appendChild(fallbackOption);
                    }
                    if (order.status) {
                        statusSelect.value = order.status;
                    }
                }

                // Populate other form fields (excluding status which is handled above)
                const fieldsToPopulate = [
                    'id', 'shipping_order_number', 'shipping_date', 'delivery_method',
                    'consignee_name', 'consignee_address', 'carrier', 'tracking_number',
                    'notes'
                ];

                fieldsToPopulate.forEach(key => {
                    const input = elements.modalForm.querySelector(`[name="${key}"]`);
                    if (input && order[key] !== null && order[key] !== undefined) {
                        input.value = order[key];
                    }
                });

                elements.modal.classList.remove('hidden');
                hideModalAlert();
            } catch (error) {
                console.error('編輯出貨單失敗:', error);
                showAlert('error', error.message);
            }
        }

        function closeModal() {
            elements.modal.classList.add('hidden');
            state.editingId = null;
        }

        async function openDetailModal(id) {
            try {
                const data = await getShippingOrderDetail(id);
                state.editingId = id;
                renderDetailContent(data);
                elements.detailModal.classList.remove('hidden');
            } catch (error) {
                showAlert('error', error.message);
            }
        }

        function closeDetailModal() {
            elements.detailModal.classList.add('hidden');
            state.editingId = null;
        }

        function renderDetailContent(data) {
            const { order, items } = data;

            // 退貨狀態徽章
            let returnStatusBadge = '';
            if (order.return_status && order.return_status !== 'none') {
                if (order.return_status === 'partial') {
                    returnStatusBadge = '<span class="status-badge warning" style="margin-left: 0.5rem;"><i class="fas fa-undo"></i> 部分退貨</span>';
                } else if (order.return_status === 'full') {
                    returnStatusBadge = '<span class="status-badge success" style="margin-left: 0.5rem;"><i class="fas fa-check-circle"></i> 全部退貨</span>';
                }
            }

            // 計算退貨統計
            const returnedItems = items.filter(item => parseFloat(item.total_returned || 0) > 0);
            const returnStats = returnedItems.length > 0 ? ` (${returnedItems.length}/${items.length} 項已退)` : '';

            let html = `
                <div class="detail-sections">
                    <section class="detail-section">
                        <h4>基本資訊</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">出貨單號</span>
                                <span class="detail-value"><strong>${escapeHtml(order.shipping_order_number) || '-'}</strong>${returnStatusBadge}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">客戶</span>
                                <span class="detail-value">${escapeHtml(order.customer_name) || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">關聯訂單</span>
                                <span class="detail-value">${escapeHtml(order.order_number) || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">狀態</span>
                                <span class="detail-value"><span class="status-badge ${getStatusClass(order.status)}">${getStatusLabel(order.status)}</span></span>
                            </div>
                        </div>
                    </section>

                    <section class="detail-section">
                        <h4>出貨資訊</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">出貨日期</span>
                                <span class="detail-value">${order.shipping_date ? formatDate(order.shipping_date) : '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">配送方式</span>
                                <span class="detail-value">${getDeliveryMethodLabel(order.delivery_method)}</span>
                            </div>
                            <div class="detail-item" style="grid-column: 1 / -1;">
                                <span class="detail-label">收件人/地址</span>
                                <span class="detail-value">${escapeHtml(order.consignee_name || '-')} / ${escapeHtml(order.consignee_address || '-')}</span>
                            </div>
                        </div>
                    </section>

                    <section class="detail-section">
                        <h4>追蹤資訊</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">物流公司</span>
                                <span class="detail-value">${escapeHtml(order.carrier) || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">追蹤編號</span>
                                <span class="detail-value">${escapeHtml(order.tracking_number) || '-'}</span>
                            </div>
                        </div>
                    </section>

                    ${order.notes ? `
                    <section class="detail-section">
                        <h4>備註</h4>
                        <p>${escapeHtml(order.notes)}</p>
                    </section>
                    ` : ''}

                    <section class="detail-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h4 style="margin: 0;">出貨項目 (${items.length}${returnStats})</h4>
                            <div>
                                ${order.status === 'draft' ? `
                                <button type="button" class="btn primary" onclick="window.shippingOrdersModule.openAddItem(${order.id}, ${order.customer_id || 'null'})">
                                    <i class="fas fa-plus"></i> 新增項目
                                </button>
                                ` : ''}
                                ${(order.status === 'shipped' || order.status === 'delivered') && order.return_status !== 'full' ? `
                                <button type="button" class="btn outline" onclick="window.shippingOrdersModule.openCreateReturnModal(${order.id})">
                                    <i class="fas fa-undo"></i> 建立退貨單
                                </button>
                                ` : ''}
                            </div>
                        </div>
                        ${items.length > 0 ? `
                        <div class="table-responsive">
                            <table class="data-table compact">
                                <thead>
                                    <tr>
                                        <th>庫存編號</th>
                                        <th>產品</th>
                                        <th>出貨數量</th>
                                        <th>已退數量</th>
                                        <th>可退數量</th>
                                        <th>單位淨重</th>
                                        ${order.status === 'draft' ? '<th>操作</th>' : ''}
                                        ${(order.status === 'shipped' || order.status === 'delivered') ? '<th>操作</th>' : ''}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map(item => {
                                        const totalReturned = parseFloat(item.total_returned || 0);
                                        const returnableQty = parseFloat(item.returnable_quantity || item.shipped_quantity || 0);
                                        const isFullyReturned = returnableQty <= 0;
                                        const rowClass = isFullyReturned ? 'text-muted' : '';

                                        return `
                                    <tr class="${rowClass}">
                                        <td>${escapeHtml(item.inventory_number) || '-'}</td>
                                        <td>${escapeHtml(item.screening_item_name || item.product_name) || '-'}</td>
                                        <td>${formatNumber(item.shipped_quantity)}</td>
                                        <td>${totalReturned > 0 ? `<span class="text-danger">${formatNumber(totalReturned)}</span>` : '-'}</td>
                                        <td>${returnableQty > 0 ? `<span class="text-success"><strong>${formatNumber(returnableQty)}</strong></span>` : '<span class="text-muted">已全退</span>'}</td>
                                        <td>${item.net_weight_kg ? parseFloat(item.net_weight_kg).toFixed(4) : '-'} kg</td>
                                        ${order.status === 'draft' ? `
                                        <td>
                                            <button type="button" class="btn text danger" title="刪除" onclick="window.shippingOrdersModule.deleteItem(${item.id}, ${order.id})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                        ` : ''}
                                        ${(order.status === 'shipped' || order.status === 'delivered') ? `
                                        <td>
                                            ${!isFullyReturned ? `
                                            <button type="button" class="btn text" title="快速退貨" onclick="window.shippingOrdersModule.quickReturnItem(${order.id}, ${item.id})">
                                                <i class="fas fa-undo"></i>
                                            </button>
                                            ` : ''}
                                        </td>
                                        ` : ''}
                                    </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                        ` : '<p class="text-muted">尚無出貨項目，可新增多筆項目</p>'}
                    </section>

                    ${order.return_orders && order.return_orders.length > 0 ? `
                    <section class="detail-section">
                        <h4>相關退貨單 (${order.return_orders.length})</h4>
                        <div class="table-responsive">
                            <table class="data-table compact">
                                <thead>
                                    <tr>
                                        <th>退貨單號</th>
                                        <th>退貨日期</th>
                                        <th>處理狀態</th>
                                        <th>退貨數量</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.return_orders.map(ro => `
                                    <tr>
                                        <td><strong>${escapeHtml(ro.return_order_number)}</strong></td>
                                        <td>${ro.return_date ? formatDate(ro.return_date) : '-'}</td>
                                        <td><span class="status-badge">${ro.processing_status || '-'}</span></td>
                                        <td>${formatNumber(ro.total_quantity || 0)}</td>
                                        <td>
                                            <button type="button" class="btn text" title="查看退貨單" onclick="window.openTab('return_orders', '退貨單', 'modules/return_orders.html')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    ` : order.has_returns ? `
                    <section class="detail-section">
                        <p class="text-muted"><i class="fas fa-info-circle"></i> 此出貨單有退貨記錄，但未能載入詳細資訊。</p>
                    </section>
                    ` : ''}
                </div>
            `;

            elements.detailContent.innerHTML = html;
        }

        // Add Item Modal Functions
        async function openAddItemModal(shippingOrderId, customerId) {
            elements.addItemForm.reset();
            elements.addItemForm.querySelector('[name="shipping_order_id"]').value = shippingOrderId;
            state.addItemContext = { shippingOrderId, customerId };

            // Load available inventory items for this customer
            await loadAvailableInventoryItems(customerId);

            elements.addItemModal.classList.remove('hidden');
            hideAddItemModalAlert();
        }

        function closeAddItemModal() {
            elements.addItemModal.classList.add('hidden');
            state.addItemContext = null;
        }

        async function loadAvailableInventoryItems(customerId) {
            const select = elements.addItemForm.querySelector('[name="inventory_item_id"]');
            if (!select) return;

            select.innerHTML = '<option value="">載入中...</option>';

            try {
                let url = 'api/inventory_items/index.php?perPage=1000&status=in_stock&quality_status=qualified';
                if (customerId) {
                    url += `&customer_id=${customerId}`;
                }

                const response = await fetch(url, {
                    credentials: 'include'
                });
                const data = await response.json();
                // 庫存項目 API 回傳的可能是 data 或 items
                state.inventoryItems = data.data || data.items || [];

                select.innerHTML = '<option value="">-- 請選擇庫存項目 --</option>';
                state.inventoryItems.forEach(item => {
                    const available = parseInt(item.quantity_on_hand) - parseInt(item.quantity_allocated || 0);
                    const receiptType = String(item.receipt_type || 'standard').toLowerCase();
                    const receiptLabel = receiptType === 'partial' ? '（部分入庫）' : (receiptType === 'final' ? '（最終補入）' : '');
                    if (available > 0) {
                        select.innerHTML += `<option value="${item.id}" data-available="${available}">${escapeHtml(item.inventory_number)}${receiptLabel} - ${escapeHtml(item.screening_item_name || '未知產品')} (可用: ${formatNumber(available)})</option>`;
                    }
                });

                if (select.options.length === 1) {
                    select.innerHTML = '<option value="">-- 無可用庫存項目 --</option>';
                }
            } catch (error) {
                console.error('載入庫存項目失敗:', error);
                select.innerHTML = '<option value="">載入失敗</option>';
            }
        }

        function handleInventoryItemChange() {
            const select = elements.addItemForm.querySelector('[name="inventory_item_id"]');
            const infoDiv = elements.addItemModal.querySelector('[data-selected-item-info]');
            const qtyInput = elements.addItemForm.querySelector('[name="quantity"]');

            const selectedOption = select.options[select.selectedIndex];
            const itemId = select.value;

            if (!itemId) {
                infoDiv.innerHTML = '<p class="text-muted">請先選擇庫存項目</p>';
                qtyInput.max = '';
                qtyInput.value = '';
                return;
            }

            const item = state.inventoryItems.find(i => String(i.id) === String(itemId));
            if (item) {
                const available = parseInt(item.quantity_on_hand) - parseInt(item.quantity_allocated || 0);
                const receiptType = String(item.receipt_type || 'standard').toLowerCase();
                const receiptLabel = receiptType === 'partial' ? '部分入庫' : (receiptType === 'final' ? '最終補入' : '一般入庫');
                infoDiv.innerHTML = `
                    <div class="detail-item">
                        <span class="detail-label">庫存編號</span>
                        <span class="detail-value">${escapeHtml(item.inventory_number) || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">入庫類型</span>
                        <span class="detail-value">${escapeHtml(receiptLabel)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">產品</span>
                        <span class="detail-value">${escapeHtml(item.screening_item_name) || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">可用數量</span>
                        <span class="detail-value">${formatNumber(available)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">淨重</span>
                        <span class="detail-value">${parseFloat(item.net_weight_kg || 0).toFixed(2)} kg</span>
                    </div>
                `;
                qtyInput.max = available;
                qtyInput.value = available;
            }
        }

        async function handleAddItem() {
            const formData = new FormData(elements.addItemForm);
            const shippingOrderId = formData.get('shipping_order_id');
            const inventoryItemId = formData.get('inventory_item_id');
            const quantity = parseInt(formData.get('quantity'));
            const notes = formData.get('notes');

            if (!inventoryItemId) {
                showAddItemModalAlert('error', '請選擇庫存項目');
                return;
            }
            if (!quantity || quantity <= 0) {
                showAddItemModalAlert('error', '請輸入有效的數量');
                return;
            }

            try {
                const submitBtn = elements.addItemModal.querySelector('[data-action="submit-add-item"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 處理中...';
                }

                const response = await fetch('api/shipping_orders/add_item.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shipping_order_id: parseInt(shippingOrderId),
                        inventory_item_id: parseInt(inventoryItemId),
                        quantity: quantity,
                        notes: notes
                    })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || '加入失敗');
                }

                closeAddItemModal();
                showAlert('success', '已成功加入出貨項目');
                loadShippingOrders();

                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('shipping_orders', DataSync.EVENT_TYPES.UPDATED, {
                        id: parseInt(shippingOrderId, 10) || null
                    });
                }

                // If detail modal is open, refresh it
                if (state.editingId && !elements.detailModal.classList.contains('hidden')) {
                    openDetailModal(state.editingId);
                }

            } catch (error) {
                showAddItemModalAlert('error', error.message);
            } finally {
                const submitBtn = elements.addItemModal.querySelector('[data-action="submit-add-item"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-plus"></i> 加入';
                }
            }
        }

        async function handleDeleteItem(itemId, shippingOrderId) {
            let assessment;
            try {
                assessment = await checkWorkflowDelete('shipping_order_items', itemId);
            } catch (error) {
                showAlert('error', error.message || '流程檢查失敗');
                return;
            }

            if (!assessment.allowed) {
                await confirmWorkflowDelete(assessment, '此出貨項目目前不可刪除。');
                return;
            }

            const confirmed = await confirmWorkflowDelete(assessment, '確定要刪除此出貨項目嗎？此操作會釋放已分配的庫存數量。');
            if (!confirmed) return;

            try {
                const response = await fetch(`api/shipping_orders/delete_item.php?id=${itemId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || '刪除失敗');
                }

                showAlert('success', '出貨項目已刪除');
                loadShippingOrders();

                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('shipping_orders', DataSync.EVENT_TYPES.UPDATED, {
                        id: shippingOrderId || null
                    });
                }

                // Refresh detail modal if open
                if (shippingOrderId && !elements.detailModal.classList.contains('hidden')) {
                    openDetailModal(shippingOrderId);
                }

            } catch (error) {
                showAlert('error', error.message);
            }
        }

        // Form Handlers
        async function handleSubmit() {
            const formData = new FormData(elements.modalForm);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value || null;
            }

            try {
                const submitBtn = elements.modal.querySelector('[data-action="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 儲存中...';
                }

                let createdId = null;
                let result = null;

                if (state.editingId) {
                    result = await updateShippingOrder(state.editingId, data);
                    showAlert('success', '出貨單已更新');
                } else {
                    result = await createShippingOrder(data);
                    createdId = result?.data?.id || null;
                    showAlert('success', '出貨單已建立');
                }

                if (typeof DataSync !== 'undefined') {
                    const eventType = state.editingId ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED;
                    const payload = result?.data || (state.editingId ? { id: state.editingId } : { id: createdId });
                    DataSync.notifyWithDependencies('shipping_orders', eventType, payload);
                }

                closeModal();
                loadShippingOrders();

                if (createdId) {
                    setTimeout(() => {
                        openDetailModal(createdId);
                    }, 300);
                }

            } catch (error) {
                showModalAlert('error', error.message);
            } finally {
                const submitBtn = elements.modal.querySelector('[data-action="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '儲存';
                }
            }
        }

        async function checkWorkflowDelete(moduleName, id) {
            const response = await fetch(`api/workflow_guard/check.php?module=${encodeURIComponent(moduleName)}&action=delete&id=${encodeURIComponent(id)}`, {
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || '流程檢查失敗');
            }
            return result.data || {};
        }

        function buildWorkflowConfirmMessage(assessment, fallbackMessage) {
            const impacts = Array.isArray(assessment.impacts) && assessment.impacts.length > 0
                ? `\n\n影響範圍：\n${assessment.impacts.map((impact) => `- ${impact}`).join('\n')}`
                : '';
            return `${assessment.message || fallbackMessage}${impacts}\n\n確定繼續嗎？`;
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
            return window.confirm(buildWorkflowConfirmMessage(assessment, fallbackMessage));
        }

        async function handleDelete(id) {
            let assessment;
            try {
                assessment = await checkWorkflowDelete('shipping_orders', id);
            } catch (error) {
                showAlert('error', error.message || '流程檢查失敗');
                return;
            }

            if (!assessment.allowed) {
                await confirmWorkflowDelete(assessment, '此出貨單目前不可刪除。');
                return;
            }

            const confirmed = await confirmWorkflowDelete(assessment, '確定要刪除此出貨單嗎？');
            if (!confirmed) return;

            try {
                await deleteShippingOrder(id);
                showAlert('success', '出貨單已刪除');
                loadShippingOrders();

                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('shipping_orders', DataSync.EVENT_TYPES.DELETED, { id });
                }
            } catch (error) {
                showAlert('error', error.message);
            }
        }

        function resetFilters() {
            if (!elements.filterForm) {
                return;
            }
            elements.filterForm.reset();
            if ('perPage' in elements.filterForm.elements) {
                elements.filterForm.elements.perPage.value = '20';
            }
            state.currentPage = 1;
            closeFilterDrawer();
            updateFilterSummary();
            loadShippingOrders();
        }

        function goToPage(page) {
            state.currentPage = page;
            loadShippingOrders();
        }

        // Print Function
        function printShippingOrder(id) {
            window.open(`print/shipping_order_print.html?id=${id}`, '_blank');
        }

        function getCurrentPageRowIds() {
            if (!elements.tbody) {
                return [];
            }

            const rows = Array.from(elements.tbody.querySelectorAll('tr[data-id]'));
            return rows
                .map((row) => Number.parseInt(row.getAttribute('data-id') || '', 10))
                .filter(Number.isInteger);
        }

        function handleBatchPrint() {
            const ids = selectedShippingOrderIds.size > 0
                ? Array.from(selectedShippingOrderIds)
                : getCurrentPageRowIds();

            if (ids.length === 0) {
                showAlert('error', '目前沒有可列印的出貨單。');
                return;
            }

            const confirmed = window.confirm(`即將開啟 ${ids.length} 筆出貨單列印頁，是否繼續？`);
            if (!confirmed) {
                return;
            }

            ids.forEach((id) => {
                window.open(`print/shipping_order_print.html?id=${id}`, '_blank');
            });
            showAlert('success', `已開啟 ${ids.length} 筆出貨單列印頁。`);
        }

        async function handleBatchExport() {
            try {
                const ids = selectedShippingOrderIds.size > 0 ? Array.from(selectedShippingOrderIds) : [];
                const filterValues = collectFilterValues();
                const params = new URLSearchParams();

                params.set('page', '1');
                params.set('perPage', ids.length > 0 ? String(Math.max(ids.length, 100)) : '5000');
                params.set('sortField', state.sortField);
                params.set('sortDirection', state.sortDirection);

                if (filterValues.keyword) params.set('keyword', filterValues.keyword);
                if (filterValues.customerId) params.set('customer_id', filterValues.customerId);
                if (filterValues.status) params.set('status', filterValues.status);
                if (filterValues.startDate) params.set('start_date', filterValues.startDate);
                if (filterValues.endDate) params.set('end_date', filterValues.endDate);

                const response = await fetch(`api/shipping_orders/index.php?${params.toString()}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || '匯出失敗');
                }

                let rows = Array.isArray(data.data) ? data.data : [];
                if (ids.length > 0) {
                    const idSet = new Set(ids);
                    rows = rows.filter((row) => idSet.has(Number.parseInt(row.id, 10)));
                }

                if (rows.length === 0) {
                    showAlert('error', '沒有可匯出的資料。');
                    return;
                }

                const csvRows = [
                    ['出貨單號', '客戶', '出貨日期', '項目數', '總數量', '配送方式', '狀態', '建立時間'],
                    ...rows.map((row) => [
                        row.shipping_order_number || '',
                        row.customer_name || '',
                        row.shipping_date || '',
                        row.item_count ?? 0,
                        row.total_quantity ?? 0,
                        getDeliveryMethodLabel(row.delivery_method),
                        getStatusLabel(row.status),
                        row.created_at || '',
                    ])
                ];

                const csvContent = '\uFEFF' + csvRows
                    .map((line) => line.map(csvEscape).join(','))
                    .join('\r\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `shipping_orders_${formatDateForFileName()}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showAlert('success', `已匯出 ${rows.length} 筆出貨單資料。`);
            } catch (error) {
                console.error('批次匯出失敗:', error);
                showAlert('error', error.message || '匯出失敗，請稍後再試。');
            }
        }

        // Helper Functions
        function showAlert(type, message) {
            if (!elements.alert) return;
            elements.alert.className = `module-alert ${type}`;
            elements.alert.textContent = message;
            elements.alert.classList.remove('hidden');
            setTimeout(() => elements.alert.classList.add('hidden'), 5000);
        }

        function showModalAlert(type, message) {
            if (!elements.modalAlert) return;
            elements.modalAlert.className = `modal-alert ${type}`;
            elements.modalAlert.textContent = message;
            elements.modalAlert.classList.remove('hidden');
        }

        function hideModalAlert() {
            if (elements.modalAlert) {
                elements.modalAlert.classList.add('hidden');
            }
        }

        function setFieldValue(name, value) {
            if (!elements.modalForm) {
                return;
            }

            const field = elements.modalForm.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value || '';
            } else {
                console.warn(`shipping_orders: 欄位不存在 - ${name}`);
            }
        }

        function showAddItemModalAlert(type, message) {
            if (!elements.addItemModalAlert) return;
            elements.addItemModalAlert.className = `modal-alert ${type}`;
            elements.addItemModalAlert.textContent = message;
            elements.addItemModalAlert.classList.remove('hidden');
        }

        function hideAddItemModalAlert() {
            if (elements.addItemModalAlert) {
                elements.addItemModalAlert.classList.add('hidden');
            }
        }

        function formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-TW');
        }

        function formatDateTime(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleString('zh-TW');
        }

        function formatNumber(num) {
            if (num === null || num === undefined) return '0';
            return parseInt(num).toLocaleString();
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

        function getStatusLabel(status) {
            // 先從 state.shippingStatuses 中查找
            const found = state.shippingStatuses.find(s => s.value_key === status);
            if (found) return found.value_label;

            // 備用靜態對應
            const labels = {
                'draft': '草稿',
                'confirmed': '已確認',
                'preparing': '準備中',
                'packed': '已包裝',
                'shipped': '已出貨',
                'delivered': '已送達',
                'cancelled': '已取消'
            };
            return labels[status] || status || '-';
        }

        function getStatusClass(status) {
            const classes = {
                'draft': 'pending',
                'confirmed': 'in-progress',
                'preparing': 'in-progress',
                'packed': 'in-progress',
                'shipped': 'in-progress',
                'delivered': 'completed',
                'cancelled': 'cancelled'
            };
            return classes[status] || 'pending';
        }

        function getDeliveryMethodLabel(method) {
            const labels = {
                'pickup': '自取',
                'delivery': '宅配',
                'freight': '貨運'
            };
            return labels[method] || method || '-';
        }

        // ===== 退貨功能 =====

        // DOM Elements for return modals
        let returnModalElements = null;

        function initReturnModalElements() {
            if (returnModalElements) return returnModalElements;

            returnModalElements = {
                createReturnModal: moduleRoot.querySelector('[data-create-return-modal]'),
                createReturnForm: moduleRoot.querySelector('[data-create-return-form]'),
                returnModalAlert: moduleRoot.querySelector('[data-return-modal-alert]'),
                shippingOrderInfo: moduleRoot.querySelector('[data-shipping-order-info]'),
                returnItemsTable: moduleRoot.querySelector('[data-return-items-table]'),
                quickReturnModal: moduleRoot.querySelector('[data-quick-return-modal]'),
                quickReturnForm: moduleRoot.querySelector('[data-quick-return-form]'),
                quickReturnModalAlert: moduleRoot.querySelector('[data-quick-return-modal-alert]'),
                quickReturnItemInfo: moduleRoot.querySelector('[data-quick-return-item-info]'),
            };

            // Attach event listeners for return modals
            if (returnModalElements.createReturnModal) {
                // Close buttons
                returnModalElements.createReturnModal.querySelectorAll('[data-action="close-return-modal"]').forEach(btn => {
                    btn.addEventListener('click', closeCreateReturnModal);
                });

                // Select all/none buttons
                const selectAllBtn = returnModalElements.createReturnModal.querySelector('[data-action="select-all-items"]');
                const deselectAllBtn = returnModalElements.createReturnModal.querySelector('[data-action="deselect-all-items"]');
                const toggleAllCheckbox = returnModalElements.createReturnModal.querySelector('[data-action="toggle-all-items"]');

                if (selectAllBtn) {
                    selectAllBtn.addEventListener('click', () => selectAllReturnItems(true));
                }
                if (deselectAllBtn) {
                    deselectAllBtn.addEventListener('click', () => selectAllReturnItems(false));
                }
                if (toggleAllCheckbox) {
                    toggleAllCheckbox.addEventListener('change', (e) => selectAllReturnItems(e.target.checked));
                }

                // Form submit
                if (returnModalElements.createReturnForm) {
                    returnModalElements.createReturnForm.addEventListener('submit', handleCreateReturn);
                }
            }

            if (returnModalElements.quickReturnModal) {
                // Close buttons
                returnModalElements.quickReturnModal.querySelectorAll('[data-action="close-quick-return-modal"]').forEach(btn => {
                    btn.addEventListener('click', closeQuickReturnModal);
                });

                // Form submit
                if (returnModalElements.quickReturnForm) {
                    returnModalElements.quickReturnForm.addEventListener('submit', handleQuickReturn);
                }
            }

            return returnModalElements;
        }

        async function openCreateReturnModal(shippingOrderId) {
            try {
                const elems = initReturnModalElements();
                if (!elems.createReturnModal) {
                    showAlert('error', '退貨 Modal 尚未載入，請重新整理頁面。');
                    return;
                }

                elems.createReturnForm.reset();
                elems.createReturnForm.querySelector('[name="shipping_order_id"]').value = shippingOrderId;

                // 設定今天為預設退貨日期
                const today = new Date().toISOString().split('T')[0];
                elems.createReturnForm.querySelector('[name="return_date"]').value = today;

                hideReturnModalAlert();

                // 載入可退品項
                const response = await fetch(`api/shipping_orders/get_returnable_items.php?shipping_order_id=${shippingOrderId}`, {
                    credentials: 'include'
                });
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || '載入可退品項失敗');
                }

                // 顯示出貨單資訊
                const order = data.shipping_order;
                elems.shippingOrderInfo.innerHTML = `
                    <div class="detail-item">
                        <span class="detail-label">出貨單號</span>
                        <span class="detail-value"><strong>${escapeHtml(order.shipping_order_number)}</strong></span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">客戶</span>
                        <span class="detail-value">${escapeHtml(order.customer_name) || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">退貨狀態</span>
                        <span class="detail-value"><span class="status-badge ${order.return_status === 'partial' ? 'warning' : 'success'}">${order.return_status === 'partial' ? '部分退貨' : order.return_status === 'full' ? '全部退貨' : '無退貨'}</span></span>
                    </div>
                `;

                // 填充品項表格
                const tbody = elems.returnItemsTable.querySelector('tbody');
                if (data.items && data.items.length > 0) {
                    tbody.innerHTML = data.items.map((item, idx) => `
                        <tr>
                            <td>
                                <input type="checkbox"
                                       class="return-item-checkbox"
                                       data-item-id="${item.shipping_order_item_id}"
                                       data-returnable-qty="${item.returnable_quantity}"
                                       data-shipped-unit="${escapeHtml(item.shipped_unit || '支')}">
                            </td>
                            <td>${escapeHtml(item.inventory_number) || '-'}</td>
                            <td>${escapeHtml(item.screening_item_name) || '-'}</td>
                            <td>${formatNumber(item.shipped_quantity)}</td>
                            <td>${formatNumber(item.total_returned || 0)}</td>
                            <td><strong class="text-success">${formatNumber(item.returnable_quantity)}</strong></td>
                            <td>
                                <input type="number"
                                       class="return-qty-input"
                                       data-item-id="${item.shipping_order_item_id}"
                                       min="0.01"
                                       max="${item.returnable_quantity}"
                                       step="0.01"
                                       placeholder="0"
                                       style="width: 100px;">
                            </td>
                            <td>
                                <input type="text"
                                       class="return-reason-input"
                                       data-item-id="${item.shipping_order_item_id}"
                                       placeholder="退貨原因"
                                       style="width: 150px;">
                            </td>
                        </tr>
                    `).join('');

                    // 綁定 checkbox 切換事件
                    tbody.querySelectorAll('.return-item-checkbox').forEach(checkbox => {
                        checkbox.addEventListener('change', (e) => {
                            const itemId = e.target.dataset.itemId;
                            const qtyInput = tbody.querySelector(`.return-qty-input[data-item-id="${itemId}"]`);
                            if (e.target.checked && (!qtyInput.value || parseFloat(qtyInput.value) === 0)) {
                                const returnableQty = parseFloat(e.target.dataset.returnableQty);
                                qtyInput.value = returnableQty;
                            } else if (!e.target.checked) {
                                qtyInput.value = '';
                            }
                        });
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">沒有可退貨的品項</td></tr>';
                }

                elems.createReturnModal.classList.remove('hidden');
            } catch (error) {
                showAlert('error', error.message);
            }
        }

        function closeCreateReturnModal() {
            const elems = initReturnModalElements();
            if (elems.createReturnModal) {
                elems.createReturnModal.classList.add('hidden');
            }
        }

        function selectAllReturnItems(selected) {
            const elems = initReturnModalElements();
            const checkboxes = elems.returnItemsTable.querySelectorAll('.return-item-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selected;
                checkbox.dispatchEvent(new Event('change'));
            });

            const toggleAllCheckbox = elems.createReturnModal.querySelector('[data-action="toggle-all-items"]');
            if (toggleAllCheckbox) {
                toggleAllCheckbox.checked = selected;
            }
        }

        async function handleCreateReturn(e) {
            e.preventDefault();
            const elems = initReturnModalElements();
            const formData = new FormData(elems.createReturnForm);

            // 收集選中的品項
            const items = [];
            const checkboxes = elems.returnItemsTable.querySelectorAll('.return-item-checkbox:checked');

            checkboxes.forEach(checkbox => {
                const itemId = checkbox.dataset.itemId;
                const qtyInput = elems.returnItemsTable.querySelector(`.return-qty-input[data-item-id="${itemId}"]`);
                const reasonInput = elems.returnItemsTable.querySelector(`.return-reason-input[data-item-id="${itemId}"]`);
                const shippedUnit = checkbox.dataset.shippedUnit || '支';

                const quantity = parseFloat(qtyInput.value);
                if (quantity > 0) {
                    items.push({
                        shipping_order_item_id: parseInt(itemId),
                        returned_quantity: quantity,
                        returned_unit: shippedUnit,
                        reason: reasonInput.value || null,
                        max_quantity: parseFloat(qtyInput.max) // 記錄最大可退數量用於驗證
                    });
                }
            });

            if (items.length === 0) {
                showReturnModalAlert('error', '請至少選擇一個品項並輸入退貨數量。');
                return;
            }

            // 數量二次驗證：確保退貨數量不超過可退數量
            const invalidItems = items.filter(item => item.returned_quantity > item.max_quantity);
            if (invalidItems.length > 0) {
                showReturnModalAlert('error', `部分品項退貨數量超過可退數量，請檢查後重新輸入。`);
                return;
            }

            // 移除驗證用的 max_quantity 欄位
            items.forEach(item => delete item.max_quantity);

            const payload = {
                shipping_order_id: parseInt(formData.get('shipping_order_id')),
                return_date: formData.get('return_date'),
                return_reason: formData.get('return_reason') || null,
                notes: formData.get('notes') || null,
                items: items
            };

            try {
                const response = await fetch('api/return_orders/create_from_shipping.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || '建立退貨單失敗');
                }

                showAlert('success', `退貨單 ${result.data.return_order_number} 已建立成功。`);
                closeCreateReturnModal();

                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('return_orders', DataSync.EVENT_TYPES.CREATED, result.data);
                    DataSync.notifyWithDependencies('shipping_orders', DataSync.EVENT_TYPES.UPDATED, {
                        id: payload.shipping_order_id
                    });
                }

                // 重新載入詳情頁以更新退貨狀態
                if (state.editingId) {
                    await openDetailModal(state.editingId);
                }

            } catch (error) {
                showReturnModalAlert('error', error.message);
            }
        }

        async function openQuickReturnModal(shippingOrderId, itemId) {
            try {
                const elems = initReturnModalElements();
                if (!elems.quickReturnModal) {
                    showAlert('error', '快速退貨 Modal 尚未載入，請重新整理頁面。');
                    return;
                }

                elems.quickReturnForm.reset();
                elems.quickReturnForm.querySelector('[name="shipping_order_id"]').value = shippingOrderId;
                elems.quickReturnForm.querySelector('[name="shipping_order_item_id"]').value = itemId;

                // 設定今天為預設退貨日期
                const today = new Date().toISOString().split('T')[0];
                elems.quickReturnForm.querySelector('[name="return_date"]').value = today;

                hideQuickReturnModalAlert();

                // 取得品項資訊
                const data = await getShippingOrderDetail(shippingOrderId);
                const item = data.items.find(i => i.id == itemId);

                if (!item) {
                    throw new Error('找不到該品項');
                }

                const returnableQty = parseFloat(item.returnable_quantity || item.shipped_quantity);
                const shippedUnit = item.shipped_unit || '支';

                // 設定單位（用於後續提交）
                const unitInput = elems.quickReturnForm.querySelector('[name="shipped_unit"]');
                if (unitInput) {
                    unitInput.value = shippedUnit;
                } else {
                    // 如果沒有單位欄位，建立一個隱藏欄位
                    const hiddenUnit = document.createElement('input');
                    hiddenUnit.type = 'hidden';
                    hiddenUnit.name = 'shipped_unit';
                    hiddenUnit.value = shippedUnit;
                    elems.quickReturnForm.appendChild(hiddenUnit);
                }

                elems.quickReturnItemInfo.innerHTML = `
                    <div class="detail-item">
                        <span class="detail-label">庫存編號</span>
                        <span class="detail-value">${escapeHtml(item.inventory_number) || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">產品名稱</span>
                        <span class="detail-value">${escapeHtml(item.screening_item_name) || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">出貨數量</span>
                        <span class="detail-value">${formatNumber(item.shipped_quantity)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">已退數量</span>
                        <span class="detail-value">${formatNumber(item.total_returned || 0)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">可退數量</span>
                        <span class="detail-value"><strong class="text-success">${formatNumber(returnableQty)}</strong></span>
                    </div>
                `;

                // 設定可退數量提示和 max 值
                const qtyInput = elems.quickReturnForm.querySelector('[name="returned_quantity"]');
                const hintText = elems.quickReturnForm.querySelector('[data-available-qty-hint]');
                qtyInput.max = returnableQty;
                qtyInput.value = returnableQty; // 預設填入全部可退數量
                if (hintText) {
                    hintText.textContent = `可退數量: ${formatNumber(returnableQty)}`;
                }

                elems.quickReturnModal.classList.remove('hidden');
            } catch (error) {
                showAlert('error', error.message);
            }
        }

        function closeQuickReturnModal() {
            const elems = initReturnModalElements();
            if (elems.quickReturnModal) {
                elems.quickReturnModal.classList.add('hidden');
            }
        }

        async function handleQuickReturn(e) {
            e.preventDefault();
            const elems = initReturnModalElements();
            const formData = new FormData(elems.quickReturnForm);

            const returnedQty = parseFloat(formData.get('returned_quantity'));
            const qtyInput = elems.quickReturnForm.querySelector('[name="returned_quantity"]');
            const maxQty = parseFloat(qtyInput.max);

            // 數量二次驗證：確保退貨數量不超過可退數量
            if (returnedQty > maxQty) {
                showQuickReturnModalAlert('error', `退貨數量 ${returnedQty} 超過可退數量 ${maxQty}，請重新輸入。`);
                return;
            }

            if (returnedQty <= 0) {
                showQuickReturnModalAlert('error', '退貨數量必須大於 0。');
                return;
            }

            const payload = {
                shipping_order_id: parseInt(formData.get('shipping_order_id')),
                return_date: formData.get('return_date'),
                return_reason: formData.get('reason') || null,
                items: [{
                    shipping_order_item_id: parseInt(formData.get('shipping_order_item_id')),
                    returned_quantity: returnedQty,
                    returned_unit: formData.get('shipped_unit') || '支',
                    reason: formData.get('reason') || null
                }]
            };

            try {
                const response = await fetch('api/return_orders/create_from_shipping.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || '建立退貨單失敗');
                }

                showAlert('success', `退貨單 ${result.data.return_order_number} 已建立成功。`);
                closeQuickReturnModal();

                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('return_orders', DataSync.EVENT_TYPES.CREATED, result.data);
                    DataSync.notifyWithDependencies('shipping_orders', DataSync.EVENT_TYPES.UPDATED, {
                        id: payload.shipping_order_id
                    });
                }

                // 重新載入詳情頁以更新退貨狀態
                if (state.editingId) {
                    await openDetailModal(state.editingId);
                }

            } catch (error) {
                showQuickReturnModalAlert('error', error.message);
            }
        }

        function showReturnModalAlert(type, message) {
            const elems = initReturnModalElements();
            if (!elems.returnModalAlert) return;
            elems.returnModalAlert.className = `modal-alert ${type}`;
            elems.returnModalAlert.textContent = message;
            elems.returnModalAlert.classList.remove('hidden');
        }

        function hideReturnModalAlert() {
            const elems = initReturnModalElements();
            if (elems.returnModalAlert) {
                elems.returnModalAlert.classList.add('hidden');
            }
        }

        function showQuickReturnModalAlert(type, message) {
            const elems = initReturnModalElements();
            if (!elems.quickReturnModalAlert) return;
            elems.quickReturnModalAlert.className = `modal-alert ${type}`;
            elems.quickReturnModalAlert.textContent = message;
            elems.quickReturnModalAlert.classList.remove('hidden');
        }

        function hideQuickReturnModalAlert() {
            const elems = initReturnModalElements();
            if (elems.quickReturnModalAlert) {
                elems.quickReturnModalAlert.classList.add('hidden');
            }
        }

        async function refreshOpenShippingModalsForDataSync() {
            if (
                state.addItemContext &&
                elements.addItemModal &&
                !elements.addItemModal.classList.contains('hidden')
            ) {
                const selectedItemId = elements.addItemForm?.querySelector('[name="inventory_item_id"]')?.value || '';
                await loadAvailableInventoryItems(state.addItemContext.customerId);
                const itemSelect = elements.addItemForm?.querySelector('[name="inventory_item_id"]');
                if (itemSelect && selectedItemId) {
                    itemSelect.value = selectedItemId;
                    handleInventoryItemChange();
                }
            }

            const returnElems = returnModalElements || initReturnModalElements();
            if (
                returnElems.createReturnModal &&
                !returnElems.createReturnModal.classList.contains('hidden')
            ) {
                const shippingOrderId = returnElems.createReturnForm?.querySelector('[name="shipping_order_id"]')?.value;
                if (shippingOrderId) {
                    await openCreateReturnModal(shippingOrderId);
                }
            }

            if (
                returnElems.quickReturnModal &&
                !returnElems.quickReturnModal.classList.contains('hidden')
            ) {
                const shippingOrderId = returnElems.quickReturnForm?.querySelector('[name="shipping_order_id"]')?.value;
                const itemId = returnElems.quickReturnForm?.querySelector('[name="shipping_order_item_id"]')?.value;
                if (shippingOrderId && itemId) {
                    await openQuickReturnModal(shippingOrderId, itemId);
                }
            }
        }

        async function refreshCurrentShippingOrderView() {
            await loadShippingOrders();
            if (state.editingId && elements.modal && !elements.modal.classList.contains('hidden')) {
                await openEditModal(state.editingId);
            }
            if (state.editingId && elements.detailModal && !elements.detailModal.classList.contains('hidden')) {
                await openDetailModal(state.editingId);
            }
            await refreshOpenShippingModalsForDataSync();
        }

        async function navigateToShippingOrder(shippingOrderId) {
            const normalizedId = Number.parseInt(shippingOrderId, 10);
            if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
                return;
            }
            state.currentPage = 1;
            await loadShippingOrders();
            await openDetailModal(normalizedId);
        }

        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('shipping_orders', {
                onRefresh: refreshCurrentShippingOrderView,
                onDependencyUpdate: (sourceModule) => {
                    if (sourceModule === 'customers') {
                        loadCustomers();
                    }
                    if (sourceModule === 'orders') {
                        loadOrders();
                    }
                    refreshCurrentShippingOrderView();
                }
            });
        }

        // Public API
        window.shippingOrdersModule = {
            viewDetail: navigateToShippingOrder,
            edit: openEditModal,
            delete: handleDelete,
            deleteItem: handleDeleteItem,
            goToPage: goToPage,
            openAddItem: openAddItemModal,
            refresh: loadShippingOrders,
            print: printShippingOrder,
            openCreateReturnModal: openCreateReturnModal,
            quickReturnItem: openQuickReturnModal,
        };

    } // End of initializeShippingOrdersModule

    // Export
    window.initializeShippingOrdersModule = initializeShippingOrdersModule;
})();
