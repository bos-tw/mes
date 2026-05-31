/**
 * Inventory Items Module
 * 管理庫存項目的 CRUD 操作
 */

(function() {
    'use strict';

    // 初始化函數,當模組被載入時呼叫
    function initializeInventoryItemsModule(container, initialContext = null) {
        const moduleRoot = container.querySelector('[data-module="inventory_items"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

    // DOM Elements
    const elements = {
        alert: moduleRoot.querySelector('[data-inventory-items-alert]'),
        table: moduleRoot.querySelector('[data-inventory-items-table]'),
        tbody: moduleRoot.querySelector('[data-inventory-items-table] tbody'),
        pagination: moduleRoot.querySelector('[data-inventory-items-pagination]'),
        filterForm: moduleRoot.querySelector('[data-inventory-items-filter]'),
        filterDrawer: moduleRoot.querySelector('[data-inventory-items-filter-drawer]'),
        filterOverlay: moduleRoot.querySelector('[data-inventory-items-filter-overlay]'),
        filterSummary: moduleRoot.querySelector('[data-inventory-items-filter-summary]'),
        filterCountBadge: moduleRoot.querySelector('[data-inventory-items-filter-count]'),
        modal: moduleRoot.querySelector('[data-inventory-items-modal]'),
        modalForm: moduleRoot.querySelector('[data-inventory-items-form]'),
        modalAlert: moduleRoot.querySelector('[data-inventory-items-modal-alert]'),
        detailModal: moduleRoot.querySelector('[data-inventory-items-detail-modal]'),
        detailContent: moduleRoot.querySelector('[data-inventory-items-details]'),
        createButton: moduleRoot.querySelector('.content-header [data-action="create"]'),
        batchExportButton: moduleRoot.querySelector('.content-header [data-action="batch-export"], .content-header [data-action="export"]'),
        openFilterDrawerButton: moduleRoot.querySelector('[data-action="open-filter-drawer"]'),
        closeFilterDrawerButton: moduleRoot.querySelector('[data-action="close-filter-drawer"]'),
        // 出貨 Modal
        shippingModal: moduleRoot.querySelector('[data-shipping-modal]'),
        shippingForm: moduleRoot.querySelector('[data-shipping-form]'),
        shippingModalAlert: moduleRoot.querySelector('[data-shipping-modal-alert]'),
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
        screeningItems: [],
        workOrders: [],
        employees: [],
        deleteBlockReasons: new Map(),
    };

    // Initialize
    init();

    function init() {
        loadCustomers();
        loadScreeningItems();
        loadWorkOrders();
        loadEmployees();
        loadInventoryItems();
        attachEventListeners();

        // Handle initial context if provided
        if (initialContext && initialContext.inventoryItemId) {
            setTimeout(() => {
                openDetailModal(initialContext.inventoryItemId);
            }, 500);
        } else if (initialContext && initialContext.workOrderId) {
            setTimeout(() => {
                openCreateModal(initialContext.workOrderId);
            }, 500);
        }

        // Listen for context updates (when switching to already open tab)
        container.addEventListener('module:context', (e) => {
            const context = e.detail.context;
            if (context && context.inventoryItemId) {
                openDetailModal(context.inventoryItemId);
            } else if (context && context.workOrderId) {
                openCreateModal(context.workOrderId);
            }
        });
    }

    function attachEventListeners() {
        // Header buttons
        if (elements.createButton) {
            elements.createButton.addEventListener('click', () => openCreateModal());
        }

        if (elements.batchExportButton) {
            elements.batchExportButton.addEventListener('click', handleExport);
        }

        // Filter form
        if (elements.filterForm) {
            elements.filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                state.currentPage = 1;
                closeFilterDrawer();
                loadInventoryItems();
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
                    loadInventoryItems();
                });
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

            // 攔截表單原生 submit 事件，防止頁面重載
            if (elements.modalForm) {
                elements.modalForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    handleSubmit();
                });
            }

            // Work order selection
            const workOrderSelect = elements.modalForm.querySelector('[name="work_order_id"]');
            if (workOrderSelect) {
                workOrderSelect.addEventListener('change', handleWorkOrderChange);
            }

            // Auto-calculate quantity_on_hand
            const goodUnitsInput = elements.modalForm.querySelector('[name="total_good_units"]');
            const onHandInput = elements.modalForm.querySelector('[name="quantity_on_hand"]');
            if (goodUnitsInput && onHandInput) {
                goodUnitsInput.addEventListener('input', () => {
                    if (!onHandInput.value) {
                        onHandInput.value = goodUnitsInput.value;
                    }
                });
            }

            // Auto-calculate defect_weight_kg
            const defectUnitsInput = elements.modalForm.querySelector('[name="total_defect_units"]');
            const weightPerUnitInput = elements.modalForm.querySelector('[name="weight_per_unit_g"]');
            if (defectUnitsInput) defectUnitsInput.addEventListener('input', updateDefectWeight);
            if (weightPerUnitInput) weightPerUnitInput.addEventListener('input', updateDefectWeight);
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
                    const inventoryItemId = normalizeInventoryItemId(state.editingId);
                    if (inventoryItemId) {
                        closeDetailModal();
                        openEditModal(inventoryItemId);
                    }
                });
            }

            elements.detailModal.addEventListener('click', (e) => {
                const navLink = e.target.closest('[data-navigate]');
                if (!navLink) return;
                e.preventDefault();
                const moduleId = navLink.dataset.navigate;
                const targetId = navLink.dataset.id;
                if (moduleId !== 'shipping_orders' || !targetId) return;
                if (typeof window.openTabAndNavigate === 'function') {
                    window.openTabAndNavigate('shipping_orders', '出貨單', {
                        shippingOrderId: parseInt(targetId, 10)
                    });
                } else if (typeof window.openTab === 'function') {
                    window.openTab('shipping_orders', '出貨單', 'modules/shipping_orders.html');
                }
            });
        }

        // Shipping modal
        if (elements.shippingModal) {
            const closeButtons = elements.shippingModal.querySelectorAll('[data-action="close-shipping-modal"]');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', closeShippingModal);
            });

            const submitButton = elements.shippingModal.querySelector('[data-action="submit-shipping"]');
            if (submitButton) {
                submitButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleAddToShipping();
                });
            }

            if (elements.shippingForm) {
                elements.shippingForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    handleAddToShipping();
                });
            }
        }
    }

    function setFilterDrawerOpen(isOpen) {
        const controller = window.ModuleRenderer?.getFilterDrawerController?.('inventory_items', moduleRoot);
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
                screeningItemId: '',
                screeningItemLabel: '',
                status: '',
                statusLabel: '',
                qualityStatus: '',
                qualityStatusLabel: '',
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
            screeningItemId: getTextValue('screening_item_id'),
            screeningItemLabel: getOptionLabel('screening_item_id'),
            status: getTextValue('status'),
            statusLabel: getOptionLabel('status'),
            qualityStatus: getTextValue('quality_status'),
            qualityStatusLabel: getOptionLabel('quality_status'),
            startDate: getTextValue('start_date'),
            endDate: getTextValue('end_date'),
            perPage: Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 20,
        };
    }

    function updateFilterSummary() {
        window.ModuleRenderer?.getFilterDrawerController?.('inventory_items', moduleRoot)?.updateSummary();
    }

    // API Calls
    async function loadCustomers() {
        try {
            const response = await fetch('api/customers/index.php?perPage=1000&sortField=customer_number&sortDirection=asc', {
                credentials: 'include'
            });
            const data = await response.json();
            state.customers = data.data || [];
            populateCustomerSelects();
        } catch (error) {
            console.error('載入客戶失敗:', error);
        }
    }

    async function loadScreeningItems() {
        try {
            const response = await fetch('api/screening_items/index.php', {
                credentials: 'include'
            });
            const data = await response.json();
            state.screeningItems = data.data || [];
            populateScreeningItemSelects();
        } catch (error) {
            console.error('載入受篩產品失敗:', error);
        }
    }

    async function loadWorkOrders() {
        try {
            const response = await fetch('api/work_orders/index.php?perPage=1000&status=completed&exclude_has_inventory=1', {
                credentials: 'include'
            });
            const data = await response.json();
            state.workOrders = data.data || [];
            populateWorkOrderSelect();
        } catch (error) {
            console.error('載入工單失敗:', error);
        }
    }

    async function loadEmployees() {
        try {
            const response = await fetch('api/employees/index.php', {
                credentials: 'include'
            });
            const data = await response.json();
            state.employees = data.data || [];
            populateEmployeeSelects();
        } catch (error) {
            console.error('載入員工失敗:', error);
        }
    }

    async function loadInventoryItems() {
        try {
            const filterValues = collectFilterValues();
            state.perPage = filterValues.perPage;

            const params = new URLSearchParams({
                page: state.currentPage,
                perPage: state.perPage,
                sortBy: state.sortField,
                sortOrder: state.sortDirection,
            });

            // Add filter parameters
            if (filterValues.keyword) params.set('keyword', filterValues.keyword);
            if (filterValues.customerId) params.set('customer_id', filterValues.customerId);
            if (filterValues.screeningItemId) params.set('screening_item_id', filterValues.screeningItemId);
            if (filterValues.status) params.set('status', filterValues.status);
            if (filterValues.qualityStatus) params.set('quality_status', filterValues.qualityStatus);
            if (filterValues.startDate) params.set('start_date', filterValues.startDate);
            if (filterValues.endDate) params.set('end_date', filterValues.endDate);

            const response = await fetch(`api/inventory_items/index.php?${params}`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.data) {
                renderTable(data.data);
                state.totalPages = data.pagination.totalPages;
                renderPagination(data.pagination);
            }
            updateFilterSummary();
        } catch (error) {
            console.error('載入庫存項目失敗:', error);
            showAlert('error', '載入資料失敗');
            updateFilterSummary();
        }
    }

    async function loadInventoryItemDetails(id) {
        const inventoryItemId = normalizeInventoryItemId(id);
        if (!inventoryItemId) {
            throw new Error('庫存項目 ID 無效');
        }

        try {
            const [detailResponse, shippingResponse] = await Promise.all([
                fetch(`api/inventory_items/show.php?id=${inventoryItemId}`, {
                    credentials: 'include'
                }),
                fetch(`api/shipping_order_items/index.php?inventory_item_id=${inventoryItemId}&perPage=100&sortField=so.shipping_date&sortDirection=DESC`, {
                    credentials: 'include'
                })
            ]);

            const detailData = await detailResponse.json();
            const shippingData = await shippingResponse.json();

            return {
                ...detailData,
                shipping_history: shippingData.success ? (shippingData.data || []) : []
            };
        } catch (error) {
            console.error('載入庫存詳情失敗:', error);
            throw error;
        }
    }

    async function createInventoryItem(formData) {
        try {
            const response = await fetch('api/inventory_items/index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessages = Array.isArray(data.errors) && data.errors.length
                    ? `${data.message || '建立失敗'}：${data.errors.join('、')}`
                    : (data.message || '建立失敗');
                throw new Error(errorMessages);
            }

            return data;
        } catch (error) {
            console.error('建立庫存項目失敗:', error);
            throw error;
        }
    }

    async function updateInventoryItem(id, formData) {
        try {
            const response = await fetch('api/inventory_items/update.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...formData, id }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessages = Array.isArray(data.errors) && data.errors.length
                    ? `${data.message || '更新失敗'}：${data.errors.join('、')}`
                    : (data.message || '更新失敗');
                throw new Error(errorMessages);
            }

            return data;
        } catch (error) {
            console.error('更新庫存項目失敗:', error);
            throw error;
        }
    }

    async function deleteInventoryItem(id) {
        try {
            const response = await fetch('api/inventory_items/delete.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '刪除失敗');
            }

            return data;
        } catch (error) {
            console.error('刪除庫存項目失敗:', error);
            throw error;
        }
    }

    // Render Functions

function renderTable(items) {
        if (!elements.tbody) return;
        state.deleteBlockReasons.clear();

        if (items.length === 0) {
            elements.tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="12" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-box-open" style="font-size: 3rem; color: #ccc;"></i>
                        <p style="color: #999; margin-top: 1rem;">暫無庫存資料</p>
                    </td>
                </tr>
            `;
            return;
        }

        elements.tbody.innerHTML = items.map(item => {
            const statusClass = item.status ? item.status.toLowerCase().replace(/_/g, '-') : 'in-stock';
            const qualityClass = item.quality_status ? item.quality_status.toLowerCase().replace(/_/g, '-') : 'qualified';
            const receiptType = String(item.receipt_type || 'standard').toLowerCase();
            const receiptTypeBadge = receiptType === 'partial'
                ? '<span class="inventory-receipt-badge partial">部分入庫</span>'
                : (receiptType === 'final' ? '<span class="inventory-receipt-badge final">最終補入</span>' : '');

            // 客戶名稱處理（停用顯示）
            const customerIsActive = item.customer_is_active !== 0 && item.customer_is_active !== '0' && item.customer_is_active !== false;
            const customerDisplay = item.customer_name
                ? (customerIsActive ? escapeHtml(item.customer_name) : `${escapeHtml(item.customer_name)} <span class="text-muted">(已停用)</span>`)
                : '-';

            // 判斷是否可以加入出貨單 (在庫 + 合格)
            const canShip = item.status === 'in_stock'
                && (item.quality_status === 'qualified' || receiptType === 'partial')
                && item.quantity_on_hand > 0;
            // 判斷是否已有分配數量（已加入出貨單）
            const hasAllocated = parseFloat(item.quantity_allocated || 0) > 0;
            const shippingBtnTitle = hasAllocated ? '已加入出貨單（已分配數量：' + item.quantity_allocated + '）' : '加入出貨單';
            const deleteBlockReason = getInventoryDeleteBlockReason(item);
            if (deleteBlockReason) {
                state.deleteBlockReasons.set(Number(item.id), deleteBlockReason.alert);
            }
            const deleteButton = deleteBlockReason
                ? `<button type="button" class="btn text op-action-btn op-role-delete" data-action="delete-blocked" title="${escapeHtml(deleteBlockReason.tooltip)}" aria-label="${escapeHtml(deleteBlockReason.tooltip)}" onclick="window.inventoryItemsModule.showDeleteBlocked(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>`
                : `<button type="button" class="btn text danger op-action-btn op-role-delete" data-action="delete" title="刪除" aria-label="刪除" onclick="window.inventoryItemsModule.delete(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>`;

            return `
            <tr data-id="${item.id}">
                <td><strong>${escapeHtml(item.inventory_number) || '-'}</strong>${receiptTypeBadge}</td>
                <td>${escapeHtml(item.work_order_number) || '-'}</td>
                <td>${customerDisplay}</td>
                <td>${escapeHtml(item.customer_batch_number) || '-'}</td>
                <td>${escapeHtml(item.screening_item_name) || '-'}</td>
                <td>${formatNumber(item.quantity_on_hand)}</td>
                <td>${parseFloat(item.net_weight_kg).toFixed(2)}</td>
                <td><span class="status-badge ${qualityClass}">${getQualityStatusLabel(item.quality_status)}</span></td>
                <td><span class="status-badge ${statusClass}">${getStatusLabel(item.status)}</span></td>
                <td>${formatDateTime(item.received_at)}</td>
                <td class="table-actions">
                    ${canShip ? `
                    <button type="button" class="btn text op-action-btn op-role-shipping" data-action="add-to-shipping" title="${escapeHtml(shippingBtnTitle)}" onclick="window.inventoryItemsModule.openShippingModal(${item.id})">
                        <i class="fas fa-shipping-fast"></i>
                    </button>
                    ` : ''}
                    <button type="button" class="btn text op-action-btn op-role-view" data-action="view" title="檢視" aria-label="檢視" onclick="window.inventoryItemsModule.viewDetail(${item.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn text op-action-btn op-role-edit" data-action="edit" title="編輯" aria-label="編輯" onclick="window.inventoryItemsModule.edit(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${deleteButton}
                </td>
            </tr>
        `;
        }).join('');

        // 通知欄位管理器表格已更新
        const manager = window.inventoryItemColumnManager;
        if (manager && typeof manager.onTableUpdated === 'function') {
            manager.onTableUpdated();
        }
    }

    function renderPagination(pagination) {
        if (!elements.pagination) return;

        const { page, totalPages, total } = pagination;
        let html = '<div class="pagination">';

        // Previous button
        html += `<button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} onclick="window.inventoryItemsModule.goToPage(${page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;

        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);

        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="window.inventoryItemsModule.goToPage(1)">1</button>`;
            if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="window.inventoryItemsModule.goToPage(${i})">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
            html += `<button class="pagination-btn" onclick="window.inventoryItemsModule.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        html += `<button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} onclick="window.inventoryItemsModule.goToPage(${page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;

        html += `<span class="pagination-info">共 ${total} 筆</span>`;
        html += '</div>';

        elements.pagination.innerHTML = html;
    }

    function renderDetailView(data) {
        if (!elements.detailContent) return;

        const { item, transactions, shipping_history: shippingHistory } = data;

        elements.detailContent.innerHTML = `
            <dl class="detail-list inventory-detail-list">
                <div>
                    <dt>庫存編號</dt>
                    <dd><strong>${escapeHtml(item.inventory_number)}</strong></dd>
                </div>
                <div>
                    <dt>入庫時間</dt>
                    <dd>${formatDateTime(item.received_at)}</dd>
                </div>
                <div>
                    <dt>庫存狀態</dt>
                    <dd><span class="status-badge ${item.status ? item.status.toLowerCase().replace(/_/g, '-') : 'in-stock'}">${getStatusLabel(item.status)}</span></dd>
                </div>
                <div>
                    <dt>質量狀態</dt>
                    <dd><span class="status-badge ${item.quality_status ? item.quality_status.toLowerCase().replace(/_/g, '-') : 'qualified'}">${getQualityStatusLabel(item.quality_status)}</span></dd>
                </div>
            </dl>

            <div class="detail-section">
                <h4>來源追溯</h4>
                <dl class="detail-list inventory-detail-list">
                    <div>
                        <dt>生產工單</dt>
                        <dd><strong>${escapeHtml(item.work_order_number) || '-'}</strong></dd>
                    </div>
                    <div>
                        <dt>訂單號碼</dt>
                        <dd>${escapeHtml(item.order_number) || '-'}</dd>
                    </div>
                    <div>
                        <dt>客戶名稱</dt>
                        <dd>${escapeHtml(item.customer_name) || '-'}</dd>
                    </div>
                    <div>
                        <dt>客戶批號</dt>
                        <dd>${escapeHtml(item.customer_batch_number) || '-'}</dd>
                    </div>
                    <div>
                        <dt>受篩產品</dt>
                        <dd>${escapeHtml(item.screening_item_name) || '-'}</dd>
                    </div>
                    <div>
                        <dt>內部批號</dt>
                        <dd>${escapeHtml(item.internal_lot_number) || '-'}</dd>
                    </div>
                </dl>
            </div>

            <div class="detail-section">
                <h4>數量資訊</h4>
                <dl class="detail-list inventory-detail-list">
                    <div>
                        <dt>良品總支數</dt>
                        <dd>${formatNumber(item.total_good_units)}</dd>
                    </div>
                    <div>
                        <dt>不良品總支數</dt>
                        <dd>${formatNumber(item.total_defect_units)}</dd>
                    </div>
                    <div>
                        <dt>現有庫存</dt>
                        <dd><strong>${formatNumber(item.quantity_on_hand)}</strong></dd>
                    </div>
                    <div>
                        <dt>已配貨</dt>
                        <dd>${formatNumber(item.quantity_allocated)}</dd>
                    </div>
                    <div>
                        <dt>保留數量</dt>
                        <dd>${formatNumber(item.quantity_reserved)}</dd>
                    </div>
                    <div>
                        <dt>已出貨</dt>
                        <dd>${formatNumber(item.quantity_shipped)}</dd>
                    </div>
                </dl>
            </div>

            <div class="detail-section">
                <h4>重量資訊</h4>
                <dl class="detail-list inventory-detail-list">
                    <div>
                        <dt>淨重 (kg)</dt>
                        <dd><strong>${parseFloat(item.net_weight_kg).toFixed(2)}</strong></dd>
                    </div>
                    <div>
                        <dt>總重 (kg,含載具)</dt>
                        <dd>${parseFloat(item.gross_weight_kg).toFixed(2)}</dd>
                    </div>
                    <div>
                        <dt>載具總重 (kg)</dt>
                        <dd>${parseFloat(item.tool_weight_kg || 0).toFixed(2)}</dd>
                    </div>
                    <div>
                        <dt>產品單支重 (g)</dt>
                        <dd>${parseFloat(item.weight_per_unit_g).toFixed(3)}</dd>
                    </div>
                </dl>
            </div>

            ${item.tool_statistics ? `
            <div class="detail-section">
                <h4>載具資訊</h4>
                <dl class="detail-list inventory-detail-list">
                    <div>
                        <dt>載具統計</dt>
                        <dd>${item.tool_statistics}</dd>
                    </div>
                    <div>
                        <dt>載具總數量</dt>
                        <dd>${item.total_tool_quantity || 0}</dd>
                    </div>
                </dl>
            </div>
            ` : ''}

            ${item.warehouse_location || item.storage_zone || item.shelf_number ? `
            <div class="detail-section">
                <h4>儲位資訊</h4>
                <dl class="detail-list inventory-detail-list">
                    ${item.warehouse_location ? `<div><dt>倉庫位置</dt><dd>${item.warehouse_location}</dd></div>` : ''}
                    ${item.storage_zone ? `<div><dt>儲區</dt><dd>${item.storage_zone}</dd></div>` : ''}
                    ${item.shelf_number ? `<div><dt>貨架號</dt><dd>${item.shelf_number}</dd></div>` : ''}
                </dl>
            </div>
            ` : ''}

            ${item.inspection_date || item.inspector_name || item.quality_notes ? `
            <div class="detail-section">
                <h4>質量與檢驗</h4>
                <dl class="detail-list inventory-detail-list">
                    ${item.inspection_date ? `<div><dt>檢驗日期</dt><dd>${formatDateTime(item.inspection_date)}</dd></div>` : ''}
                    ${item.inspector_name ? `<div><dt>檢驗人員</dt><dd>${item.inspector_name}</dd></div>` : ''}
                    ${item.quality_notes ? `<div><dt>質量備註</dt><dd>${item.quality_notes}</dd></div>` : ''}
                </dl>
            </div>
            ` : ''}

            ${shippingHistory && shippingHistory.length > 0 ? `
            <div class="detail-section">
                <h4>出貨履歷</h4>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>出貨單號</th>
                                <th>出貨日期</th>
                                <th>狀態</th>
                                <th>數量</th>
                                <th>客戶</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${shippingHistory.map(row => {
                                const statusLabel = getShippingStatusLabel(row.order_status);
                                return `
                                <tr>
                                    <td>
                                        <a href="#" class="link-text" data-navigate="shipping_orders" data-id="${row.shipping_order_id}">
                                            ${escapeHtml(row.shipping_order_number) || row.shipping_order_id}
                                        </a>
                                    </td>
                                    <td>${row.shipping_date || '-'}</td>
                                    <td><span class="status-badge">${escapeHtml(statusLabel)}</span></td>
                                    <td>${formatNumber(row.shipped_quantity)} ${escapeHtml(row.shipped_unit || '')}</td>
                                    <td>${escapeHtml(row.customer_name || '-')}</td>
                                </tr>
                            `;}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            ${transactions && transactions.length > 0 ? `
            <div class="detail-section">
                <h4>異動記錄</h4>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>時間</th>
                                <th>類型</th>
                                <th>方向</th>
                                <th>數量</th>
                                <th>異動後數量</th>
                                <th>操作人員</th>
                                <th>備註</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map(t => {
                                const directionClass = getTransactionDirectionClass(t.direction);
                                const directionLabel = getTransactionDirectionLabel(t.direction);
                                return `
                                <tr>
                                    <td>${formatDateTime(t.created_at)}</td>
                                    <td>${getRefTypeLabel(t.ref_type)}</td>
                                    <td><span class="status-badge ${directionClass}">${directionLabel}</span></td>
                                    <td>${formatNumber(t.quantity)}</td>
                                    <td>${formatNumber(t.after_quantity)}</td>
                                    <td>${t.operator_name || '-'}</td>
                                    <td>${t.notes || '-'}</td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            ${item.notes ? `
            <div class="detail-section">
                <h4>備註</h4>
                <p>${item.notes}</p>
            </div>
            ` : ''}
        `;
    }

    // Populate Functions
    function populateCustomerSelects() {
        const selects = [
            elements.filterForm?.querySelector('[name="customer_id"]'),
        ];

        selects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            const firstOption = select.querySelector('option[value=""]');
            select.innerHTML = firstOption ? firstOption.outerHTML : '<option value="">-- 所有客戶 --</option>';

            state.customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customer.name;
                select.appendChild(option);
            });

            if (currentValue) select.value = currentValue;
        });
    }

    function populateScreeningItemSelects() {
        const selects = [
            elements.filterForm?.querySelector('[name="screening_item_id"]'),
        ];

        selects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            const firstOption = select.querySelector('option[value=""]');
            select.innerHTML = firstOption ? firstOption.outerHTML : '<option value="">-- 所有產品 --</option>';

            state.screeningItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.name;
                select.appendChild(option);
            });

            if (currentValue) select.value = currentValue;
        });
    }

    function populateWorkOrderSelect() {
        const select = elements.modalForm?.querySelector('[name="work_order_id"]');
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">-- 請選擇工單 --</option>';

        state.workOrders.forEach(wo => {
            const option = document.createElement('option');
            option.value = wo.id;
            option.textContent = `${wo.work_order_number} - ${wo.customer_name}`;
            option.dataset.details = JSON.stringify(wo);
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    }

    function ensureWorkOrderOption(select, workOrderId, workOrderLabel = '') {
        if (!select || !workOrderId) return;
        const normalizedId = String(workOrderId);
        let option = select.querySelector(`option[value="${normalizedId}"]`);
        if (!option) {
            option = document.createElement('option');
            option.value = normalizedId;
            option.textContent = workOrderLabel || `工單 #${normalizedId}`;
            option.dataset.locked = 'true';
            select.appendChild(option);
        } else if (workOrderLabel) {
            option.textContent = workOrderLabel;
        }
        select.value = normalizedId;
    }

    function getWorkOrderReadonlyDisplay(select) {
        if (!select || !elements.modalForm) return null;
        let displayInput = elements.modalForm.querySelector('[data-work-order-readonly-display]');
        if (!displayInput) {
            displayInput = document.createElement('input');
            displayInput.type = 'text';
            displayInput.readOnly = true;
            displayInput.className = `${select.className || ''} readonly-field`;
            displayInput.setAttribute('data-work-order-readonly-display', 'true');
            displayInput.style.display = 'none';
            select.insertAdjacentElement('afterend', displayInput);
        }
        return displayInput;
    }

    function setWorkOrderFieldMode(mode, item = null) {
        const select = elements.modalForm?.querySelector('[name="work_order_id"]');
        if (!select) return;
        const readonlyDisplay = getWorkOrderReadonlyDisplay(select);

        if (mode === 'edit') {
            const workOrderId = normalizeInventoryItemId(item?.work_order_id || select.value);
            const workOrderNumber = (item?.work_order_number || '').toString().trim();
            const customerName = (item?.customer_name || '').toString().trim();
            const workOrderLabel = workOrderNumber
                ? `${workOrderNumber}${customerName ? ` - ${customerName}` : ''}`
                : '';

            if (workOrderId) {
                ensureWorkOrderOption(select, workOrderId, workOrderLabel);
            }

            const selectedText = select.options[select.selectedIndex]?.textContent?.trim() || '';
            if (readonlyDisplay) {
                readonlyDisplay.value = workOrderLabel || selectedText || '-';
                readonlyDisplay.style.display = '';
            }

            // 編輯模式防呆：顯示唯讀欄位，不提供下拉選單變更來源工單
            select.style.display = 'none';
            select.required = false;
            return;
        }

        select.style.display = '';
        select.required = true;
        if (readonlyDisplay) {
            readonlyDisplay.value = '';
            readonlyDisplay.style.display = 'none';
        }
    }

    function populateEmployeeSelects() {
        const selects = [
            elements.modalForm?.querySelector('[name="inspector_employee_id"]'),
        ];

        selects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            const firstOption = select.querySelector('option[value=""]');
            select.innerHTML = firstOption ? firstOption.outerHTML : '<option value="">-- 請選擇 --</option>';

            state.employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = emp.name;
                select.appendChild(option);
            });

            if (currentValue) select.value = currentValue;
        });
    }

    // Modal Functions
    async function openCreateModal(workOrderId = null) {
        state.editingId = null;

        if (!elements.modal || !elements.modalForm) {
            showAlert('error', '無法開啟表單');
            return;
        }

        elements.modalForm.reset();
        hideModalAlert();
        setWorkOrderFieldMode('create');

        // Set default received_at to now
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        const receivedAtInput = elements.modalForm.querySelector('[name="received_at"]');
        if (receivedAtInput) receivedAtInput.value = localDateTime;

        const modalTitle = elements.modal.querySelector('[data-modal-title]');
        if (modalTitle) modalTitle.textContent = '新增入庫項目';

        elements.modal.classList.remove('hidden');

        // 如果有指定工單ID,自動填入工單資訊
        if (workOrderId) {
            try {
                // 先載入工單資料，確保下拉選單有該選項
                const response = await fetch(`api/work_orders/show.php?id=${workOrderId}`, {
                    credentials: 'include'
                });
                const result = await response.json();

                if (result.success && result.data) {
                    const wo = result.data;
                    const workOrderSelect = elements.modalForm.querySelector('[name="work_order_id"]');

                    if (workOrderSelect) {
                        // 檢查選項是否存在，不存在則新增
                        let option = workOrderSelect.querySelector(`option[value="${workOrderId}"]`);
                        if (!option) {
                            option = document.createElement('option');
                            option.value = wo.id;
                            option.textContent = `${wo.work_order_number} - ${wo.customer_name}`;
                            workOrderSelect.appendChild(option);
                        }

                        workOrderSelect.value = workOrderId;
                        // 觸發 change 事件以填入其他欄位
                        workOrderSelect.dispatchEvent(new Event('change'));
                    }
                }
            } catch (error) {
                console.error('載入指定工單失敗:', error);
                showAlert('warning', '無法自動載入工單資訊');
            }
        }
    }

    async function openEditModal(id) {
        const inventoryItemId = normalizeInventoryItemId(id);
        if (!inventoryItemId) {
            showAlert('error', '無法編輯：庫存項目 ID 無效');
            return;
        }

        try {
            state.editingId = inventoryItemId;
            const data = await loadInventoryItemDetails(inventoryItemId);

            if (!data || !data.item) {
                throw new Error('無法載入庫存項目詳情');
            }

            hideModalAlert();
            populateForm(data.item);
            setWorkOrderFieldMode('edit', data.item);
            elements.modal.querySelector('[data-modal-title]').textContent = '編輯庫存項目';
            elements.modal.classList.remove('hidden');
        } catch (error) {
            showAlert('error', error.message);
        }
    }

    function closeModal() {
        elements.modal.classList.add('hidden');
        elements.modalForm.reset();
        hideModalAlert();
        setWorkOrderFieldMode('create');
        state.editingId = null;
    }

    async function openDetailModal(id) {
        const inventoryItemId = normalizeInventoryItemId(id);
        if (!inventoryItemId) {
            showAlert('error', '無法檢視：庫存項目 ID 無效');
            return;
        }

        try {
            state.editingId = inventoryItemId;
            const data = await loadInventoryItemDetails(inventoryItemId);

            if (!data) {
                throw new Error('無法載入庫存項目詳情');
            }

            renderDetailView(data);
            elements.detailModal.classList.remove('hidden');
        } catch (error) {
            showAlert('error', error.message);
        }
    }

    function closeDetailModal() {
        elements.detailModal.classList.add('hidden');
        state.editingId = null;
    }

    // ===== 出貨 Modal 相關函數 =====
    async function openShippingModal(inventoryItemId) {
        if (!elements.shippingModal || !elements.shippingForm) {
            showAlert('error', '出貨功能載入失敗');
            return;
        }

        // 先取得庫存項目資訊
        try {
            const response = await fetch(`api/inventory_items/show.php?id=${inventoryItemId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || '載入庫存項目失敗');
            }

            const item = data.item;

            // 安全的欄位設定函數
            function setShippingField(name, value) {
                const field = elements.shippingForm.querySelector(`[name="${name}"]`);
                if (field) {
                    field.value = value || '';
                } else {
                    console.warn(`inventory_items: 出貨表單欄位不存在 - ${name}`);
                }
            }

            // 填入庫存項目資訊
            setShippingField('inventory_item_id', inventoryItemId);
            setShippingField('customer_id', item.customer_id);
            elements.shippingModal.querySelector('[data-shipping-inventory-number]').textContent = item.inventory_number || '-';
            elements.shippingModal.querySelector('[data-shipping-customer-name]').textContent = item.customer_name || '-';
            elements.shippingModal.querySelector('[data-shipping-product-name]').textContent = item.screening_item_name || '-';
            const receiptType = String(item.receipt_type || 'standard').toLowerCase();
            const receiptLabel = receiptType === 'partial' ? '（部分入庫）' : (receiptType === 'final' ? '（最終補入）' : '');
            if (receiptLabel) {
                elements.shippingModal.querySelector('[data-shipping-inventory-number]').textContent = `${item.inventory_number || '-'} ${receiptLabel}`;
            }

            const availableQty = parseInt(item.quantity_on_hand) - parseInt(item.quantity_allocated || 0);
            elements.shippingModal.querySelector('[data-shipping-available-qty]').textContent = formatNumber(availableQty);
            elements.shippingModal.querySelector('[data-shipping-max-qty]').textContent = `最大可出貨數量: ${formatNumber(availableQty)}`;

            // 設定數量輸入欄位的最大值
            const qtyInput = elements.shippingForm.querySelector('[name="quantity"]');
            qtyInput.max = availableQty;
            qtyInput.value = availableQty; // 預設全部出貨

            // 載入該客戶的待處理出貨單
            await loadPendingShippingOrders(item.customer_id);

            // 顯示 Modal
            elements.shippingModal.classList.remove('hidden');
            hideShippingModalAlert();

        } catch (error) {
            console.error('載入庫存項目失敗:', error);
            showAlert('error', error.message);
        }
    }

    async function loadPendingShippingOrders(customerId) {
        const select = elements.shippingForm.querySelector('[name="shipping_order_id"]');
        if (!select) return;

        select.innerHTML = '<option value="">載入中...</option>';

        try {
            const response = await fetch(`api/shipping_orders/pending.php?customer_id=${customerId || ''}`, {
                credentials: 'include'
            });
            const data = await response.json();

            let html = '<option value="new">＋ 建立新出貨單</option>';

            if (data.orders && data.orders.length > 0) {
                html += '<optgroup label="草稿出貨單">';
                data.orders.forEach(order => {
                    const date = order.created_at ? new Date(order.created_at).toLocaleDateString() : '';
                    html += `<option value="${order.id}">${escapeHtml(order.shipping_order_number)} (${date}, ${order.item_count || 0}項)</option>`;
                });
                html += '</optgroup>';
            }

            select.innerHTML = html;
        } catch (error) {
            console.error('載入出貨單失敗:', error);
            select.innerHTML = '<option value="new">＋ 建立新出貨單</option>';
        }
    }

    function closeShippingModal() {
        elements.shippingModal.classList.add('hidden');
        elements.shippingForm.reset();
        hideShippingModalAlert();
    }

    function showShippingModalAlert(type, message) {
        const alertEl = elements.shippingModalAlert;
        if (!alertEl) return;
        alertEl.className = `modal-alert ${type}`;
        alertEl.textContent = message;
        alertEl.classList.remove('hidden');
    }

    function hideShippingModalAlert() {
        if (elements.shippingModalAlert) {
            elements.shippingModalAlert.classList.add('hidden');
        }
    }

    async function handleAddToShipping() {
        const formData = new FormData(elements.shippingForm);
        const inventoryItemId = formData.get('inventory_item_id');
        const customerId = formData.get('customer_id');
        const shippingOrderId = formData.get('shipping_order_id');
        const quantity = parseInt(formData.get('quantity'));
        const notes = formData.get('notes');

        // 驗證
        if (!shippingOrderId) {
            showShippingModalAlert('error', '請選擇出貨單');
            return;
        }
        if (!quantity || quantity <= 0) {
            showShippingModalAlert('error', '請輸入有效的出貨數量');
            return;
        }

        try {
            const submitBtn = elements.shippingModal.querySelector('[data-action="submit-shipping"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 處理中...';
            }

            const payload = {
                inventory_item_id: parseInt(inventoryItemId),
                shipping_order_id: shippingOrderId === 'new' ? null : parseInt(shippingOrderId),
                customer_id: customerId ? parseInt(customerId) : null,
                quantity: quantity,
                shipped_quantity: quantity,
                notes: notes
            };

            const response = await fetch('api/shipping_orders/add_item.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || '加入出貨單失敗');
            }

            // 成功
            closeShippingModal();
            showAlert('success', data.message || '已成功加入出貨單');
            loadInventoryItems(); // 刷新表格

            // 詢問是否跳轉到出貨單頁面
            const createdShippingOrderId = data.shipping_order_id
                || data.data?.shipping_order_id
                || data.data?.shipping_order?.id
                || null;

            if (typeof DataSync !== 'undefined') {
                const eventPayload = {
                    id: createdShippingOrderId ? Number(createdShippingOrderId) : undefined,
                    shipping_order_id: createdShippingOrderId ? Number(createdShippingOrderId) : undefined,
                    inventory_item_id: parseInt(inventoryItemId, 10),
                };
                DataSync.notifyWithDependencies('shipping_orders', DataSync.EVENT_TYPES.UPDATED, eventPayload);
            }

            if (createdShippingOrderId && confirm('已成功加入出貨單！是否前往出貨單頁面查看？')) {
                if (typeof window.openTabAndNavigate === 'function') {
                    window.openTabAndNavigate('shipping_orders', '出貨單', {
                        shippingOrderId: Number(createdShippingOrderId)
                    });
                } else if (typeof window.openTab === 'function') {
                    window.openTab('shipping_orders', '出貨單', 'modules/shipping_orders.html');
                }
            }

        } catch (error) {
            console.error('加入出貨單失敗:', error);
            showShippingModalAlert('error', error.message);
        } finally {
            const submitBtn = elements.shippingModal.querySelector('[data-action="submit-shipping"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> 加入出貨單';
            }
        }
    }
    // ===== 出貨 Modal 相關函數結束 =====

    function updateDefectWeight() {
        if (!elements.modalForm) return;
        const defectUnits = parseFloat(elements.modalForm.querySelector('[name="total_defect_units"]')?.value || 0);
        const weightPerUnit = parseFloat(elements.modalForm.querySelector('[name="weight_per_unit_g"]')?.value || 0);
        const defectWeightInput = elements.modalForm.querySelector('[name="defect_weight_kg"]');
        if (defectWeightInput) {
            defectWeightInput.value = ((defectUnits * weightPerUnit) / 1000).toFixed(3);
        }
    }

    function populateForm(item) {
        if (!elements.modalForm) return;

        // Populate all form fields
        Object.keys(item).forEach(key => {
            const input = elements.modalForm.querySelector(`[name="${key}"]`);
            if (input && item[key] !== null) {
                if (input.type === 'datetime-local') {
                    // Convert to local datetime format
                    const date = new Date(item[key]);
                    input.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                } else {
                    input.value = item[key];
                }
            }
        });

        // Populate readonly fields
        const readonlyFields = {
            'customer_name': item.customer_name,
            'order_number': item.order_number,
            'customer_batch_number': item.customer_batch_number,
            'screening_item_name': item.screening_item_name,
        };

        Object.entries(readonlyFields).forEach(([name, value]) => {
            const input = elements.modalForm.querySelector(`[name="${name}"]`);
            if (input && value) input.value = value;
        });

        updateDefectWeight();
    }

    async function handleWorkOrderChange(e) {
        const select = e.target;
        const workOrderId = select.value;

        if (!workOrderId) {
            // 清空自動填入的欄位
            const fieldsToClear = [
                'screening_item_id', 'screening_item_name', 'customer_name', 'order_number',
                'customer_batch_number', 'weight_per_unit_g', 'tool_statistics'
            ];
            fieldsToClear.forEach(name => {
                const input = elements.modalForm.querySelector(`[name="${name}"]`);
                if (input) input.value = '';
            });
            return;
        }

        try {
            // 呼叫 work_orders/show.php 取得完整工單詳情
            const response = await fetch(`api/work_orders/show.php?id=${workOrderId}`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (!data.success || !data.data) {
                throw new Error(data.message || '無法載入工單詳情');
            }

            const wo = data.data;

            // Auto-fill fields from work order
            const fieldsToFill = {
                'screening_item_name': wo.screening_item_name,
                'customer_name': wo.customer_name,
                'order_number': wo.order_number,
                'customer_batch_number': wo.customer_batch_number,
                'weight_per_unit_g': wo.weight_per_unit_g,
                'tool_statistics': wo.tool_statistics,
                'tool_weight_kg': wo.total_tool_weight,
                'total_tool_quantity': wo.total_container_quantity ?? wo.tool_quantity,
            };

            Object.entries(fieldsToFill).forEach(([name, value]) => {
                const input = elements.modalForm.querySelector(`[name="${name}"]`);
                if (input && value !== null && value !== undefined) {
                    input.value = value;
                }
            });

            const screeningItemIdInput = elements.modalForm.querySelector('[name="screening_item_id"]');
            if (screeningItemIdInput && wo.screening_item_id) {
                screeningItemIdInput.value = wo.screening_item_id;
            }

            autoFillInventoryQuantitiesFromWorkOrder(wo);

            showAlert('success', '工單資訊已載入');
        } catch (error) {
            console.error('處理工單選擇失敗:', error);
            showAlert('error', error.message || '載入工單詳情失敗');
        }
    }

    function autoFillInventoryQuantitiesFromWorkOrder(workOrder) {
        if (!elements.modalForm || !workOrder) return;

        const productionRecords = Array.isArray(workOrder.production_records) ? workOrder.production_records : [];
        const grossWeightFromRecords = productionRecords.reduce((sum, record) => {
            const weight = parseFloat(record.weight_kg);
            return sum + (Number.isFinite(weight) ? weight : 0);
        }, 0);

        const toolWeight = parseFloat(workOrder.total_tool_weight) || 0;
        const fallbackNetWeight = parseFloat(workOrder.total_weight_kg) || 0;
        const netWeight = grossWeightFromRecords > 0 ? Math.max(grossWeightFromRecords - toolWeight, 0) : fallbackNetWeight;
        const grossWeight = grossWeightFromRecords > 0 ? grossWeightFromRecords : (netWeight > 0 ? netWeight + toolWeight : 0);

        const weightPerUnit = parseFloat(workOrder.weight_per_unit_g) || 0;
        let goodUnits = parseFloat(workOrder.total_units) || 0;
        if (weightPerUnit > 0 && netWeight > 0) {
            goodUnits = Math.round((netWeight * 1000) / weightPerUnit);
        }

        const defectUnits = Array.isArray(workOrder.screening_defects)
            ? workOrder.screening_defects.reduce((sum, defect) => {
                const qty = parseFloat(defect.defect_quantity);
                return sum + (Number.isFinite(qty) ? qty : 0);
            }, 0)
            : 0;

        const numericFields = {
            'total_good_units': goodUnits,
            'total_defect_units': defectUnits,
            'quantity_on_hand': goodUnits,
            'quantity_allocated': 0,
            'net_weight_kg': netWeight,
            'gross_weight_kg': grossWeight,
        };

        Object.entries(numericFields).forEach(([name, value]) => {
            const input = elements.modalForm.querySelector(`[name="${name}"]`);
            if (!input || value === null || value === undefined || Number.isNaN(value)) return;

            const numericValue = typeof value === 'number' ? value : parseFloat(value);
            if (input.type === 'number') {
                const step = input.getAttribute('step');
                const decimals = step && step.includes('.') ? step.split('.')[1].length : 0;
                input.value = numericValue.toFixed(decimals);
            } else {
                input.value = numericValue.toString();
            }
        });

        updateDefectWeight();
    }

    async function handleSubmit() {
        if (!elements.modalForm.checkValidity()) {
            elements.modalForm.reportValidity();
            return;
        }

        hideModalAlert();
        const formData = new FormData(elements.modalForm);
        const data = {};
        formData.forEach((value, key) => {
            if (value !== '') data[key] = value;
        });

        try {
            if (state.editingId) {
                const result = await updateInventoryItem(state.editingId, data);
                showAlert('success', '庫存項目更新成功');
                // 通知 DataSync 資料已更新
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('inventory_items', DataSync.EVENT_TYPES.UPDATED, result.data);
                }
            } else {
                const result = await createInventoryItem(data);
                const createdItem = result.data || result.item || data;
                showAlert('success', '庫存項目建立成功');
                // 通知 DataSync 資料已建立
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('inventory_items', DataSync.EVENT_TYPES.CREATED, createdItem);
                    if (createdItem && createdItem.work_order_id) {
                        DataSync.notifyWithDependencies('work_orders', DataSync.EVENT_TYPES.UPDATED, {
                            id: createdItem.work_order_id,
                            has_inventory: true,
                            inventory_item_id: createdItem.id || null
                        });
                    }
                }
            }

            closeModal();
            loadInventoryItems();
        } catch (error) {
            showModalAlert('error', error.message || '操作失敗');
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
            assessment = await checkWorkflowDelete('inventory_items', id);
        } catch (error) {
            showAlert('error', error.message || '流程檢查失敗');
            return;
        }

        if (!assessment.allowed) {
            await confirmWorkflowDelete(assessment, '此庫存項目目前不可刪除。');
            return;
        }

        const confirmed = await confirmWorkflowDelete(assessment, '確定要刪除此庫存項目嗎?');
        if (!confirmed) {
            return;
        }

        try {
            const result = await deleteInventoryItem(id);
            showAlert('success', '庫存項目刪除成功');
            // 通知 DataSync 資料已刪除
            if (typeof DataSync !== 'undefined') {
                DataSync.notifyWithDependencies('inventory_items', DataSync.EVENT_TYPES.DELETED, result.data || { id });
                if (result.data && result.data.work_order_id) {
                    DataSync.notifyWithDependencies('work_orders', DataSync.EVENT_TYPES.UPDATED, {
                        id: result.data.work_order_id,
                        has_inventory: false,
                        inventory_item_id: id
                    });
                }
            }
            loadInventoryItems();
        } catch (error) {
            showAlert('error', error.message);
        }
    }

    function showDeleteBlocked(id) {
        const reason = state.deleteBlockReasons.get(Number(id)) || '此庫存項目目前不可刪除。';
        showAlert('warning', reason);
    }

    function handleExport() {
        const values = collectFilterValues();
        const params = new URLSearchParams();
        if (values.keyword) params.set('keyword', values.keyword);
        if (values.customerId) params.set('customer_id', values.customerId);
        if (values.screeningItemId) params.set('screening_item_id', values.screeningItemId);
        if (values.status) params.set('status', values.status);
        if (values.qualityStatus) params.set('quality_status', values.qualityStatus);
        if (values.startDate) params.set('start_date', values.startDate);
        if (values.endDate) params.set('end_date', values.endDate);

        window.open(`/api/inventory_items/export.php?${params}`, '_blank');
    }

    function resetFilters() {
        if (elements.filterForm) {
            elements.filterForm.reset();
            if ('perPage' in elements.filterForm.elements) {
                elements.filterForm.elements.perPage.value = '20';
            }
            state.currentPage = 1;
            closeFilterDrawer();
            updateFilterSummary();
            loadInventoryItems();
        }
    }

    function goToPage(page) {
        if (page < 1 || page > state.totalPages) return;
        state.currentPage = page;
        loadInventoryItems();
    }

    // Alert Functions
    function showAlert(type, message) {
        if (!elements.alert) return;

        elements.alert.textContent = message;
        elements.alert.className = `module-alert ${type}`;
        elements.alert.classList.remove('hidden');

        if (type === 'success') {
            setTimeout(() => {
                elements.alert.classList.add('hidden');
            }, 3000);
        }
    }

    function showModalAlert(type, message) {
        if (!elements.modalAlert) return;

        elements.modalAlert.textContent = message;
        elements.modalAlert.className = `modal-alert ${type}`;
        elements.modalAlert.classList.remove('hidden');
    }

    function hideModalAlert() {
        if (!elements.modalAlert) return;

        elements.modalAlert.textContent = '';
        elements.modalAlert.className = 'modal-alert hidden';
    }

    // Utility Functions
    function formatNumber(num) {
        if (num === null || num === undefined) return '0';
        const rounded = Math.round(parseFloat(num) * 100) / 100;
        return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function formatDateTime(datetime) {
        if (!datetime) return '-';
        const date = new Date(datetime);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getStatusClass(status) {
        const classes = {
            'in_stock': 'success',
            'allocated': 'warning',
            'shipped': 'info',
            'consumed': 'secondary',
        };
        return classes[status] || 'secondary';
    }

    function getStatusLabel(status) {
        const labels = {
            'in_stock': '在庫',
            'allocated': '已配貨',
            'shipped': '已出貨',
            'consumed': '已耗用',
        };
        return labels[status] || status;
    }

    function getQualityStatusClass(status) {
        const classes = {
            'qualified': 'success',
            'pending': 'warning',
            'quarantine': 'warning',
            'rejected': 'danger',
        };
        return classes[status] || 'secondary';
    }

    function getQualityStatusLabel(status) {
        const labels = {
            'qualified': '合格',
            'pending': '待檢',
            'quarantine': '隔離',
            'rejected': '拒收',
        };
        return labels[status] || status;
    }

    function buildWorkflowBlockedAlertMessage(type) {
        switch (type) {
            case 'allocated':
                return '此資料已進入後續流程\n\n目前流程：\n庫存 → 出貨配貨\n\n可執行動作：\n請先從出貨單移除配貨或取消配貨。';
            case 'shipped':
                return '此資料已進入後續流程\n\n目前流程：\n庫存 → 已出貨\n\n可執行動作：\n請走退貨、沖銷或作廢流程。';
            case 'from_work_order':
                return '此資料已進入後續流程\n\n目前流程：\n生產工單 → 庫存\n\n可執行動作：\n請回到生產工單調整狀態，並選擇「刪除庫存並變更狀態」。';
            default:
                return '此庫存項目目前不可刪除。';
        }
    }

    function getInventoryDeleteBlockReason(item) {
        if (parseFloat(item.quantity_allocated || 0) > 0) {
            return {
                tooltip: '此庫存已有配貨，請先從出貨單移除或取消配貨後再處理。',
                alert: buildWorkflowBlockedAlertMessage('allocated')
            };
        }
        if (parseFloat(item.quantity_shipped || 0) > 0) {
            return {
                tooltip: '此庫存已有出貨記錄，無法刪除。',
                alert: buildWorkflowBlockedAlertMessage('shipped')
            };
        }
        if (Number(item.work_order_id || 0) > 0) {
            return {
                tooltip: '此庫存由生產工單轉入，請回到生產工單調整狀態。',
                alert: buildWorkflowBlockedAlertMessage('from_work_order')
            };
        }
        return null;
    }

    function getRefTypeLabel(refType) {
        const labels = {
            'work_order': '生產工單',
            'shipping_order': '出貨單',
            'return_order': '退貨單',
            'adjustment': '庫存調整',
        };
        return labels[refType] || refType;
    }

    function getShippingStatusLabel(status) {
        const labels = {
            'draft': '草稿',
            'confirmed': '已確認',
            'preparing': '準備中',
            'packed': '已包裝',
            'shipped': '已出貨',
            'delivered': '已送達',
            'cancelled': '已取消',
        };
        return labels[status] || status || '-';
    }

    function getTransactionDirectionLabel(direction) {
        switch (direction) {
            case 'inbound':
                return '入庫';
            case 'outbound':
                return '出庫';
            case 'adjustment':
                return '調整';
            default:
                return direction || '-';
        }
    }

    function getTransactionDirectionClass(direction) {
        switch (direction) {
            case 'inbound':
                return 'success';
            case 'outbound':
                return 'danger';
            case 'adjustment':
                return 'warning';
            default:
                return 'secondary';
        }
    }

    function normalizeInventoryItemId(value) {
        const id = Number.parseInt(value, 10);
        if (!Number.isFinite(id) || id <= 0) {
            return null;
        }
        return id;
    }

    function refreshInventoryItemsForDataSync(sourceModule = null) {
        if (sourceModule === 'work_orders') {
            loadWorkOrders();
        }
        if (sourceModule === 'screening_items') {
            loadScreeningItems();
        }

        loadInventoryItems();

        if (elements.modal && !elements.modal.classList.contains('hidden') && state.editingId) {
            openEditModal(state.editingId);
        }

        if (elements.detailModal && !elements.detailModal.classList.contains('hidden') && state.editingId) {
            openDetailModal(state.editingId);
        }
    }

    // 建立資料同步輔助器
    if (typeof DataSync !== 'undefined') {
        DataSync.createModuleHelper('inventory_items', {
            onRefresh: () => refreshInventoryItemsForDataSync(),
            onDependencyUpdate: (sourceModule) => refreshInventoryItemsForDataSync(sourceModule),
            debounceMs: 300
        });
    }

    // Public API
    window.inventoryItemsModule = {
        viewDetail: openDetailModal,
        edit: openEditModal,
        delete: handleDelete,
        showDeleteBlocked: showDeleteBlocked,
        goToPage: goToPage,
        openShippingModal: openShippingModal,
        openCreate: (workOrderId = null) => {
            // 直接開啟新增表單,可選的預填工單
            openCreateModal(workOrderId);
        },
        createFromWorkOrder: (workOrderId) => {
            // 切換到庫存管理模組
            if (typeof window.openTab === 'function') {
                window.openTab('inventory_items', '庫存項目', 'modules/inventory_items.html');
                setTimeout(() => {
                    openCreateModal(workOrderId);
                }, 500);
            } else {
                // 如果已在當前模組,直接開啟
                openCreateModal(workOrderId);
            }
        },
    };

    } // End of initializeInventoryItemsModule

    // Export - 暴露到全域供 script.js 註冊
    window.initializeInventoryItemsModule = initializeInventoryItemsModule;

})();
