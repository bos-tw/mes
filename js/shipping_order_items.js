/**
 * Shipping Order Items Module
 * 出貨品項查詢/報表模組
 */

(function() {
    'use strict';

    function initializeShippingOrderItemsModule(container) {
        const moduleRoot = container.querySelector('[data-module="shipping_order_items"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        // DOM Elements
        const elements = {
            alert: moduleRoot.querySelector('[data-shipping-order-items-alert]'),
            table: moduleRoot.querySelector('[data-shipping-order-items-table]'),
            tbody: moduleRoot.querySelector('[data-shipping-order-items-table] tbody'),
            pagination: moduleRoot.querySelector('[data-shipping-order-items-pagination]'),
            filterForm: moduleRoot.querySelector('[data-shipping-order-items-filter]'),
            summary: moduleRoot.querySelector('[data-shipping-order-items-summary]'),
            totalItems: moduleRoot.querySelector('[data-total-items]'),
            totalQuantity: moduleRoot.querySelector('[data-total-quantity]'),
        };

        // State
        const state = {
            currentPage: 1,
            perPage: 20,
            totalPages: 1,
            sortField: 'soi.created_at',
            sortDirection: 'DESC',
            customers: [],
            shippingStatuses: [],
        };

        // Initialize
        init();

        function init() {
            loadCustomers();
            loadShippingStatuses();
            loadItems();
            attachEventListeners();
        }

        function attachEventListeners() {
            // Filter form
            if (elements.filterForm) {
                elements.filterForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    state.currentPage = 1;
                    loadItems();
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
                        loadItems();
                    });
                });
            }
        }

        function resetFilters() {
            elements.filterForm.reset();
            state.currentPage = 1;
            state.sortField = 'soi.created_at';
            state.sortDirection = 'DESC';
            loadItems();
        }

        // API Calls
        async function loadCustomers() {
            try {
                const response = await fetch('api/customers/index.php?perPage=1000&is_active=1', {
                    credentials: 'include'
                });
                const data = await response.json();
                state.customers = data.data || data.items || [];
                populateCustomerSelect();
            } catch (error) {
                console.error('載入客戶失敗:', error);
            }
        }

        async function loadShippingStatuses() {
            try {
                const response = await fetch('api/lookup_values/index.php?domain_key=shipping_status&is_active=1&perPage=100', {
                    credentials: 'include'
                });
                const data = await response.json();
                state.shippingStatuses = data.data || data.items || [];
                populateStatusSelect();
            } catch (error) {
                console.error('載入出貨狀態失敗:', error);
            }
        }

        function populateCustomerSelect() {
            const select = elements.filterForm?.querySelector('[name="customer_id"]');
            if (!select) return;

            const currentValue = select.value;
            select.innerHTML = '<option value="">-- 所有客戶 --</option>';
            state.customers.forEach(customer => {
                select.innerHTML += `<option value="${customer.id}">${escapeHtml(customer.customer_number)} - ${escapeHtml(customer.name)}</option>`;
            });
            select.value = currentValue;
        }

        function populateStatusSelect() {
            const select = elements.filterForm?.querySelector('[name="status"]');
            if (!select) return;

            const currentValue = select.value;
            select.innerHTML = '<option value="">-- 所有狀態 --</option>';
            state.shippingStatuses.forEach(status => {
                select.innerHTML += `<option value="${escapeHtml(status.value_key)}">${escapeHtml(status.value_label)}</option>`;
            });
            select.value = currentValue;
        }

        async function loadItems() {
            try {
                const formData = new FormData(elements.filterForm);
                const params = new URLSearchParams();

                params.set('page', state.currentPage);
                params.set('perPage', formData.get('perPage') || state.perPage);
                params.set('sortField', state.sortField);
                params.set('sortDirection', state.sortDirection);

                for (const [key, value] of formData.entries()) {
                    if (value && key !== 'perPage') {
                        params.set(key, value);
                    }
                }

                const response = await fetch(`api/shipping_order_items/index.php?${params.toString()}`, {
                    credentials: 'include'
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || '載入失敗');
                }

                renderTable(data.data || []);
                renderPagination(data.pagination || {});
                updateSummary(data.totals || {});

            } catch (error) {
                console.error('載入出貨品項失敗:', error);
                showAlert('error', error.message);
            }
        }

        // Render Functions
    
function renderTable(items) {
            if (!elements.tbody) return;

            if (items.length === 0) {
                elements.tbody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="11" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-box-open" style="font-size: 3rem; color: #ccc;"></i>
                            <p style="color: #999; margin-top: 1rem;">暫無出貨品項資料</p>
                        </td>
                    </tr>
                `;
                return;
            }

            elements.tbody.innerHTML = items.map(item => {
                const statusClass = getStatusClass(item.order_status);
                return `
                <tr data-id="${item.id}">
                    <td><a href="#" class="link-to-order" data-order-id="${item.shipping_order_id}">${escapeHtml(item.shipping_order_number) || '-'}</a></td>
                    <td>${escapeHtml(item.customer_name) || '-'}</td>
                    <td>${escapeHtml(item.inventory_number) || '-'}</td>
                    <td>${escapeHtml(item.screening_item_name) || '-'}</td>
                    <td>${formatNumber(item.shipped_quantity)}</td>
                    <td>${item.net_weight_kg ? parseFloat(item.net_weight_kg).toFixed(4) : '-'}</td>
                    <td>${item.shipping_date ? formatDate(item.shipping_date) : '-'}</td>
                    <td><span class="status-badge ${statusClass}">${getStatusLabel(item.order_status)}</span></td>
                    <td>${formatDateTime(item.created_at)}</td>
                    <td class="table-actions">
                        <button type="button" class="btn text" title="檢視出貨單" onclick="window.shippingOrderItemsModule.viewOrder(${item.shipping_order_id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
            }).join('');

            // Add click handlers for order links
            elements.tbody.querySelectorAll('.link-to-order').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const orderId = link.dataset.orderId;
                    viewOrder(orderId);
                });
            });

            // 套用欄位可見性設定
            const manager = window.shippingOrderItemColumnManager;
            if (manager && typeof manager.onTableUpdated === 'function') {
                manager.onTableUpdated();
            }
        }

        function renderPagination(pagination) {
            if (!elements.pagination) return;

            const { page, totalPages, total } = pagination;
            let html = '<div class="pagination">';

            html += `<button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} onclick="window.shippingOrderItemsModule.goToPage(${page - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;

            const startPage = Math.max(1, page - 2);
            const endPage = Math.min(totalPages, page + 2);

            if (startPage > 1) {
                html += `<button class="pagination-btn" onclick="window.shippingOrderItemsModule.goToPage(1)">1</button>`;
                if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
            }

            for (let i = startPage; i <= endPage; i++) {
                html += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="window.shippingOrderItemsModule.goToPage(${i})">${i}</button>`;
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
                html += `<button class="pagination-btn" onclick="window.shippingOrderItemsModule.goToPage(${totalPages})">${totalPages}</button>`;
            }

            html += `<button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} onclick="window.shippingOrderItemsModule.goToPage(${page + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;

            html += `<span class="pagination-info">共 ${total} 筆</span>`;
            html += '</div>';

            elements.pagination.innerHTML = html;
        }

        function updateSummary(totals) {
            if (elements.totalItems) {
                elements.totalItems.textContent = formatNumber(totals.total_items || 0);
            }
            if (elements.totalQuantity) {
                elements.totalQuantity.textContent = formatNumber(totals.total_quantity || 0);
            }
        }

        function goToPage(page) {
            state.currentPage = page;
            loadItems();
        }

        function viewOrder(orderId) {
            // Open shipping orders tab and view the order
            if (window.openTabAndNavigate) {
                window.openTabAndNavigate('shipping_orders', '出貨單', { shippingOrderId: orderId });
            } else {
                // Fallback: try to use shippingOrdersModule directly
                if (window.shippingOrdersModule && window.shippingOrdersModule.viewDetail) {
                    window.shippingOrdersModule.viewDetail(orderId);
                }
            }
        }

        // Utility Functions
        function showAlert(type, message) {
            if (!elements.alert) return;
            elements.alert.className = `alert alert-${type}`;
            elements.alert.textContent = message;
            elements.alert.classList.remove('hidden');
            setTimeout(() => elements.alert.classList.add('hidden'), 5000);
        }

        function formatDate(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-TW');
        }

        function formatDateTime(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleString('zh-TW');
        }

        function formatNumber(num) {
            if (num === null || num === undefined) return '0';
            return parseFloat(num).toLocaleString();
        }

        function getStatusLabel(status) {
            const found = state.shippingStatuses.find(s => s.value_key === status);
            if (found) return found.value_label;

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

        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('shipping_order_items', {
                onRefresh: loadItems,
                onDependencyUpdate: (sourceModule) => {
                    if (sourceModule === 'customers') {
                        loadCustomers();
                    }
                    if (sourceModule === 'lookup_values') {
                        loadShippingStatuses();
                    }
                    loadItems();
                }
            });
        }

        // Public API
        window.shippingOrderItemsModule = {
            goToPage: goToPage,
            viewOrder: viewOrder,
            refresh: loadItems,
        };

    } // End of initializeShippingOrderItemsModule

    // Export
    window.initializeShippingOrderItemsModule = initializeShippingOrderItemsModule;
})();
