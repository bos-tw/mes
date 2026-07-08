/**
 * Inventory Transactions Module
 * 清單、篩選、排序、分頁與摘要
 */

(function() {
    'use strict';

    function initializeInventoryTransactionsModule(container) {
        const moduleRoot = container.querySelector('[data-module="inventory_transactions"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        const elements = {
            alert: moduleRoot.querySelector('[data-inventory-transactions-alert]'),
            table: moduleRoot.querySelector('[data-inventory-transactions-table]'),
            tbody: moduleRoot.querySelector('[data-inventory-transactions-table] tbody'),
            pagination: moduleRoot.querySelector('[data-inventory-transactions-pagination]'),
            filterForm: moduleRoot.querySelector('[data-inventory-transactions-filter]'),
            summary: moduleRoot.querySelector('[data-inventory-transactions-summary]'),
            detailModal: moduleRoot.querySelector('[data-inventory-transactions-detail-modal]'),
            detailContent: moduleRoot.querySelector('[data-inventory-transactions-detail-content]'),
        };

        const state = {
            currentPage: 1,
            perPage: 20,
            sortField: 'it.created_at',
            sortDirection: 'DESC',
            items: [], // 儲存當前資料供檢視使用
        };

        let dataSyncHelper = null;

        attachEventListeners();
        loadData();

        function attachEventListeners() {
            if (elements.filterForm) {
                elements.filterForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    state.currentPage = 1;
                    const perPageInput = elements.filterForm.querySelector('[name="perPage"]');
                    if (perPageInput) {
                        state.perPage = parseInt(perPageInput.value, 10) || 20;
                    }
                    loadData();
                });

                const resetBtn = elements.filterForm.querySelector('[data-action="reset-filter"]');
                if (resetBtn) {
                    resetBtn.addEventListener('click', () => {
                        elements.filterForm.reset();
                        state.currentPage = 1;
                        state.perPage = 20;
                        state.sortField = 'it.created_at';
                        state.sortDirection = 'DESC';
                        loadData();
                    });
                }
            }

            if (elements.table) {
                elements.table.querySelectorAll('th[data-sort]').forEach(th => {
                    th.addEventListener('click', () => {
                        const field = th.dataset.sort;
                        if (!field) return;
                        if (state.sortField === field) {
                            state.sortDirection = state.sortDirection === 'ASC' ? 'DESC' : 'ASC';
                        } else {
                            state.sortField = field;
                            state.sortDirection = 'DESC';
                        }
                        loadData();
                    });
                });

                // 表格操作按鈕委派
                elements.table.addEventListener('click', (e) => {
                    const viewBtn = e.target.closest('[data-action="view-detail"]');
                    if (viewBtn) {
                        const id = parseInt(viewBtn.dataset.id, 10);
                        openDetailModal(id);
                    }
                });
            }

            if (elements.pagination) {
                elements.pagination.addEventListener('click', (e) => {
                    const btn = e.target.closest('button[data-page]');
                    if (!btn) return;
                    const targetPage = parseInt(btn.dataset.page, 10);
                    if (Number.isInteger(targetPage) && targetPage !== state.currentPage) {
                        state.currentPage = targetPage;
                        loadData();
                    }
                });
            }

            // Detail modal close
            if (elements.detailModal) {
                elements.detailModal.querySelectorAll('[data-action="close-detail-modal"]').forEach(btn => {
                    btn.addEventListener('click', closeDetailModal);
                });
                elements.detailModal.addEventListener('click', (e) => {
                    if (e.target === elements.detailModal) closeDetailModal();
                });

                // Handle navigation links inside modal
                elements.detailModal.addEventListener('click', (e) => {
                    const navLink = e.target.closest('[data-navigate]');
                    if (navLink) {
                        e.preventDefault();
                        const moduleId = navLink.dataset.navigate;
                        const targetId = navLink.dataset.id;
                        navigateToModule(moduleId, targetId);
                    }
                });
            }
        }

        function navigateToModule(moduleId, targetId) {
            closeDetailModal();
            const titles = {
                'orders': '訂單管理',
                'work_orders': '工單管理',
                'shipping_orders': '出貨單'
            };
            const title = titles[moduleId] || moduleId;
            const params = {};
            if (moduleId === 'orders' && targetId) {
                params.orderId = parseInt(targetId, 10);
            } else if (moduleId === 'work_orders' && targetId) {
                params.workOrderId = parseInt(targetId, 10);
            } else if (moduleId === 'shipping_orders' && targetId) {
                params.shippingOrderId = parseInt(targetId, 10);
            }
            if (window.openTabAndNavigate) {
                window.openTabAndNavigate(moduleId, title, params);
            }
        }

        function openDetailModal(id) {
            const item = state.items.find(i => i.id === id);
            if (!item) return;
            renderDetailContent(item);
            if (elements.detailModal) elements.detailModal.classList.remove('hidden');
        }

        function closeDetailModal() {
            if (elements.detailModal) elements.detailModal.classList.add('hidden');
        }

    
        function renderDetailContent(item) {
            if (!elements.detailContent) return;
            const directionLabel = escapeHtml(item.direction_label || getDirectionLabel(item.direction));
            const directionClass = getDirectionClass(item.direction);
            const sourceInfo = buildSourceInfo(item);

            elements.detailContent.innerHTML = `
                <div class="detail-grid detail-grid-two-column">
                    <div class="detail-section">
                        <h4>基本資訊</h4>
                        <p><strong>異動編號：</strong>${item.id}</p>
                        <p><strong>庫存編號：</strong>${escapeHtml(item.inventory_number) || '-'}</p>
                        <p><strong>客戶批號：</strong>${escapeHtml(item.customer_batch_number || item.order_item_batch_number) || '-'}</p>
                        <p><strong>產品：</strong>${item.product_number ? `${escapeHtml(item.product_number)} / ${escapeHtml(item.screening_item_name) || ''}` : (escapeHtml(item.screening_item_name) || '-')}</p>
                        <p><strong>客戶：</strong>${escapeHtml(item.customer_name) || '-'}</p>
                    </div>
                    <div class="detail-section">
                        <h4>異動資訊</h4>
                        <p><strong>異動方向：</strong><span class="status-badge ${directionClass}">${directionLabel}</span></p>
                        <p><strong>變動數量：</strong>${formatNumber(item.quantity)}</p>
                        <p><strong>異動後庫存：</strong>${formatNumber(item.after_quantity)}</p>
                        <p><strong>建立時間：</strong>${formatDateTime(item.created_at)}</p>
                        <p><strong>建立人：</strong>${escapeHtml(item.created_by_employee_name) || '-'}</p>
                    </div>
                </div>
                <div class="detail-section detail-section-spaced-top">
                    <h4>來源關聯</h4>
                    ${sourceInfo}
                    ${item.notes ? `<p class="detail-inline-note"><strong>備註：</strong>${escapeHtml(item.notes)}</p>` : ''}
                </div>
            `;
        }

        function buildSourceInfo(item) {
            const parts = [];
            if (item.order_number) {
                parts.push(`<p><strong>訂單：</strong><a href="#" class="link-text" data-navigate="orders" data-id="${item.order_id}">${escapeHtml(item.order_number)}</a></p>`);
            }
            if (item.work_order_number) {
                parts.push(`<p><strong>工單：</strong><a href="#" class="link-text" data-navigate="work_orders" data-id="${item.work_order_id}">${escapeHtml(item.work_order_number)}</a></p>`);
            }
            if (item.ref_type === 'shipping_order' && item.ref_id) {
                parts.push(`<p><strong>出貨單：</strong><a href="#" class="link-text" data-navigate="shipping_orders" data-id="${item.ref_id}">#${item.ref_id}</a></p>`);
            }
            if (item.order_item_batch_number) {
                parts.push(`<p><strong>訂單品項批號：</strong>${escapeHtml(item.order_item_batch_number)}</p>`);
            }
            const refLabel = getRefTypeLabel(item.ref_type);
            if (item.ref_type && item.ref_id) {
                parts.push(`<p><strong>來源類型：</strong>${refLabel} #${item.ref_id}</p>`);
            } else if (item.ref_type) {
                parts.push(`<p><strong>來源類型：</strong>${refLabel}</p>`);
            }
            return parts.length ? parts.join('') : '<p>無關聯資料</p>';
        }

        async function loadData() {
            try {
                const params = new URLSearchParams({
                    page: state.currentPage,
                    perPage: state.perPage,
                    sortField: state.sortField,
                    sortDirection: state.sortDirection,
                });

                if (elements.filterForm) {
                    const formData = new FormData(elements.filterForm);
                    formData.forEach((value, key) => {
                        if (value) params.set(key, value);
                    });
                }

                const response = await fetch(`api/inventory_transactions/index.php?${params.toString()}`, {
                    credentials: 'include'
                });
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || '載入資料失敗');
                }

                renderTable(data.data || []);
                state.items = data.data || []; // 儲存供檢視使用
                renderSummary(data.totals || {});
                renderPagination(data.pagination || {});
            } catch (error) {
                console.error('載入庫存異動失敗:', error);
                showAlert('error', error.message || '載入資料時發生錯誤');
            }
        }

        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('inventory_transactions', {
                onRefresh: loadData
            });
        }

        function renderTable(items) {
            if (!elements.tbody) return;

            if (!items.length) {
                elements.tbody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="13" class="text-center">
                            <i class="fas fa-box-open" style="font-size: 2.5rem; color: #ccc;"></i>
                            <p style="color: #999; margin-top: 0.5rem;">暫無資料</p>
                        </td>
                    </tr>
                `;
                return;
            }

            elements.tbody.innerHTML = items.map(item => {
                const directionLabel = escapeHtml(item.direction_label || getDirectionLabel(item.direction));
                const directionClass = getDirectionClass(item.direction);
                const qty = formatNumber(item.quantity);
                const afterQty = formatNumber(item.after_quantity);
                const sourceDisplay = buildSourceDisplay(item);
                const product = item.product_number ? `${escapeHtml(item.product_number)} / ${escapeHtml(item.screening_item_name) || '-'}` : (escapeHtml(item.screening_item_name) || '-');
                const orderNumber = escapeHtml(item.order_number) || '-';
                const workOrderNumber = escapeHtml(item.work_order_number) || '-';

                return `
                    <tr>
                        <td><strong>${escapeHtml(item.inventory_number) || '-'}</strong><div class="subtext">${escapeHtml(item.customer_batch_number) || ''}</div></td>
                        <td>${product}</td>
                        <td>${escapeHtml(item.customer_name) || '-'}</td>
                        <td>${orderNumber}</td>
                        <td>${workOrderNumber}</td>
                        <td>${sourceDisplay}</td>
                        <td><span class="status-badge ${directionClass}">${directionLabel}</span></td>
                        <td>${qty}</td>
                        <td>${afterQty}</td>
                        <td>${escapeHtml(item.created_by_employee_name) || '-'}</td>
                        <td>${formatDateTime(item.created_at)}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text" data-action="view-detail" data-id="${item.id}" title="檢視詳情">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // 通知欄位管理器表格已更新
            const manager = window.inventoryTransactionColumnManager;
            if (manager && typeof manager.onTableUpdated === 'function') {
                manager.onTableUpdated();
            }
        }

        function renderSummary(totals) {
            if (!elements.summary) return;
            const totalItems = elements.summary.querySelector('[data-total-items]');
            const inbound = elements.summary.querySelector('[data-total-inbound]');
            const outbound = elements.summary.querySelector('[data-total-outbound]');
            const net = elements.summary.querySelector('[data-total-net]');

            if (totalItems) totalItems.textContent = formatNumber(totals.total_items || 0);
            if (inbound) inbound.textContent = formatNumber(totals.inbound_quantity || 0);
            if (outbound) outbound.textContent = formatNumber(totals.outbound_quantity || 0);
            if (net) net.textContent = formatNumber(totals.net_quantity || 0);
        }

        function renderPagination(pagination) {
            if (!elements.pagination) return;

            const current = Number(pagination.page || 1);
            const totalPages = Number(pagination.totalPages || 1);
            if (totalPages <= 1) {
                elements.pagination.innerHTML = '';
                return;
            }

            const buttons = [];
            const start = Math.max(1, current - 2);
            const end = Math.min(totalPages, current + 2);

            if (current > 1) {
                buttons.push(`<button data-page="${current - 1}"><i class="fas fa-angle-left"></i></button>`);
            }

            for (let i = start; i <= end; i++) {
                buttons.push(`<button data-page="${i}" class="${i === current ? 'active' : ''}">${i}</button>`);
            }

            if (current < totalPages) {
                buttons.push(`<button data-page="${current + 1}"><i class="fas fa-angle-right"></i></button>`);
            }

            elements.pagination.innerHTML = buttons.join('');
        }

        function showAlert(type, message) {
            if (!elements.alert) return;
            elements.alert.textContent = message;
            elements.alert.className = `module-alert ${type}`;
            elements.alert.classList.remove('hidden');
            setTimeout(() => elements.alert.classList.add('hidden'), 5000);
        }

        // 來源顯示（表格用，簡潔版）
        function buildSourceDisplay(item) {
            // 優先顯示工單號，其次訂單號，最後 ref_type
            if (item.work_order_number) {
                return `<span class="source-tag work-order">工單 ${escapeHtml(item.work_order_number)}</span>`;
            }
            if (item.order_number) {
                return `<span class="source-tag order">訂單 ${escapeHtml(item.order_number)}</span>`;
            }
            const refLabel = getRefTypeLabel(item.ref_type);
            if (item.ref_type && item.ref_id) {
                return `<span class="source-tag">${escapeHtml(refLabel)} #${Number(item.ref_id) || 0}</span>`;
            }
            return refLabel || '-';
        }
    }

    function getRefTypeLabel(refType) {
        if (!refType) return '-';
        const map = {
            work_order: '生產工單',
            work_orders: '生產工單',
            order: '訂單',
            orders: '訂單',
            order_item: '訂單品項',
            order_items: '訂單品項',
            shipping_order: '出貨單',
            shipping_orders: '出貨單',
            return_order: '退貨單',
            return_orders: '退貨單',
            production_records: '生產紀錄',
            inventory_transactions: '庫存異動',
            adjustment: '手動調整',
        };
        return escapeHtml(map[refType] || refType || '-');
    }

    function getDirectionLabel(direction) {
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

    function getDirectionClass(direction) {
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

    function formatDateTime(value) {
        if (!value) return '-';
        const date = new Date(value.replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) return value;
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function pad(num) {
        return String(num).padStart(2, '0');
    }

    function formatNumber(num) {
        const n = Number(num);
        if (Number.isNaN(n)) return '-';
        return n % 1 === 0 ? n.toLocaleString() : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    window.initializeInventoryTransactionsModule = initializeInventoryTransactionsModule;
})();
