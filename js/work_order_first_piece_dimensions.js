/**
 * Work Order First Piece Dimensions Module
 * 首件尺寸檢驗管理模組
 */
(function() {
    'use strict';

    function initializeWorkOrderFirstPieceDimensionsModule(container) {
        const moduleRoot = container.querySelector('[data-module="work_order_first_piece_dimensions"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // DOM 元素
        const elements = {
            alert: moduleRoot.querySelector('[data-first-piece-alert]'),
            table: moduleRoot.querySelector('[data-first-piece-table]'),
            tbody: moduleRoot.querySelector('[data-first-piece-table] tbody'),
            pagination: moduleRoot.querySelector('[data-first-piece-pagination]'),
            filterForm: moduleRoot.querySelector('[data-first-piece-filter]'),
            filterWorkOrderSelect: moduleRoot.querySelector('[data-filter-work-order]'),
            filterEmployeeSelect: moduleRoot.querySelector('[data-filter-employee]'),
            // 新增/編輯 Modal
            modal: moduleRoot.querySelector('[data-first-piece-modal]'),
            modalTitle: moduleRoot.querySelector('[data-modal-title]'),
            modalAlert: moduleRoot.querySelector('[data-first-piece-modal-alert]'),
            form: moduleRoot.querySelector('[data-first-piece-form]'),
            modalWorkOrderSelect: moduleRoot.querySelector('[data-modal-work-order-select]'),
            modalEmployeeSelect: moduleRoot.querySelector('[data-modal-employee-select]'),
            workOrderInfoSection: moduleRoot.querySelector('[data-work-order-info]'),
            // 詳情 Modal
            detailModal: moduleRoot.querySelector('[data-first-piece-detail-modal]'),
            detailContent: moduleRoot.querySelector('[data-first-piece-detail-content]'),
            // Header buttons
            createButton: moduleRoot.querySelector('[data-action="create"]'),
            exportButton: moduleRoot.querySelector('[data-action="export"]')
        };

        // 狀態
        const state = {
            currentPage: 1,
            perPage: 20,
            totalPages: 1,
            totalItems: 0,
            sortField: 'measured_at',
            sortDirection: 'DESC',
            items: [],
            workOrders: [],
            employees: [],
            currentViewingId: null
        };

        let dataSyncHelper = null;

        // 初始化
        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('work_order_first_piece_dimensions', {
                onRefresh: loadData,
                onDependencyUpdate: (sourceModule) => {
                    if (sourceModule === 'work_orders') {
                        loadWorkOrders();
                    }
                    if (sourceModule === 'employees') {
                        loadEmployees();
                    }
                    loadData();
                }
            });
        }
        init();

        function init() {
            attachEventListeners();
            loadWorkOrders();
            loadEmployees();
            loadData();
        }

        // 綁定事件
        function attachEventListeners() {
            // 篩選表單
            if (elements.filterForm) {
                elements.filterForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    state.currentPage = 1;
                    loadData();
                });

                const resetBtn = elements.filterForm.querySelector('[data-action="reset-filter"]');
                if (resetBtn) {
                    resetBtn.addEventListener('click', () => {
                        elements.filterForm.reset();
                        state.currentPage = 1;
                        loadData();
                    });
                }
            }

            // 排序
            if (elements.table) {
                elements.table.querySelectorAll('th[data-sort]').forEach(th => {
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
            }

            // 新增按鈕
            if (elements.createButton) {
                elements.createButton.addEventListener('click', () => openModal());
            }

            // 匯出按鈕
            if (elements.exportButton) {
                elements.exportButton.addEventListener('click', exportData);
            }

            // Modal 關閉
            if (elements.modal) {
                elements.modal.querySelector('[data-action="close-modal"]')?.addEventListener('click', closeModal);
                elements.modal.querySelector('[data-action="cancel"]')?.addEventListener('click', closeModal);
                elements.modal.addEventListener('click', (e) => {
                    if (e.target === elements.modal) closeModal();
                });
            }

            // 表單提交
            if (elements.form) {
                elements.form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    saveData();
                });
            }

            // 工單選擇變化時顯示工單資訊
            if (elements.modalWorkOrderSelect) {
                elements.modalWorkOrderSelect.addEventListener('change', onWorkOrderChange);
            }

            // 表格操作 (事件委派)
            if (elements.tbody) {
                elements.tbody.addEventListener('click', handleTableAction);
            }

            // 分頁
            if (elements.pagination) {
                elements.pagination.addEventListener('click', handlePagination);
            }

            // 詳情 Modal
            if (elements.detailModal) {
                elements.detailModal.querySelector('[data-action="close-detail-modal"]')?.addEventListener('click', closeDetailModal);
                elements.detailModal.querySelector('[data-action="edit-from-detail"]')?.addEventListener('click', () => {
                    closeDetailModal();
                    if (state.currentViewingId) {
                        editData(state.currentViewingId);
                    }
                });
                elements.detailModal.addEventListener('click', (e) => {
                    if (e.target === elements.detailModal) closeDetailModal();
                });
            }
        }

        // HTML 跳脫函數 - 防止 XSS
    
// 載入工單列表
        async function loadWorkOrders() {
            try {
                const response = await fetch('api/work_orders/index.php?perPage=500');
                const result = await response.json();

                if (result.success && result.data) {
                    state.workOrders = result.data;
                    populateWorkOrderSelects();
                }
            } catch (error) {
                console.error('載入工單失敗:', error);
            }
        }

        // 填充工單下拉選單
        function populateWorkOrderSelects() {
            const defaultOption = '<option value="">-- 請選擇工單 --</option>';
            const filterDefault = '<option value="">-- 所有工單 --</option>';

            const options = state.workOrders.map(wo =>
                `<option value="${wo.id}">${escapeHtml(wo.work_order_number)} (${escapeHtml(wo.customer_name) || '未知客戶'})</option>`
            ).join('');

            if (elements.modalWorkOrderSelect) {
                elements.modalWorkOrderSelect.innerHTML = defaultOption + options;
            }
            if (elements.filterWorkOrderSelect) {
                elements.filterWorkOrderSelect.innerHTML = filterDefault + options;
            }
        }

        // 載入員工列表
        async function loadEmployees() {
            try {
                const response = await fetch('api/employees/index.php?limit=500&is_active=1');
                const result = await response.json();

                if (result.success && result.data) {
                    state.employees = result.data;
                    populateEmployeeSelects();
                }
            } catch (error) {
                console.error('載入員工失敗:', error);
            }
        }

        // 填充員工下拉選單
        function populateEmployeeSelects() {
            const defaultOption = '<option value="">-- 請選擇 --</option>';
            const filterDefault = '<option value="">-- 所有人員 --</option>';

            const options = state.employees.map(emp =>
                `<option value="${emp.id}">${escapeHtml(emp.employee_number)} - ${escapeHtml(emp.name)}</option>`
            ).join('');

            if (elements.modalEmployeeSelect) {
                elements.modalEmployeeSelect.innerHTML = defaultOption + options;
            }
            if (elements.filterEmployeeSelect) {
                elements.filterEmployeeSelect.innerHTML = filterDefault + options;
            }
        }

        // 載入資料
        async function loadData() {
            showLoading();
            try {
                const formData = new FormData(elements.filterForm);
                const params = new URLSearchParams({
                    page: state.currentPage,
                    limit: formData.get('perPage') || state.perPage,
                    keyword: formData.get('keyword') || '',
                    work_order_id: formData.get('work_order_id') || '',
                    measured_by_employee_id: formData.get('measured_by_employee_id') || '',
                    start_date: formData.get('start_date') || '',
                    end_date: formData.get('end_date') || '',
                    sort_field: state.sortField,
                    sort_direction: state.sortDirection
                });

                const response = await fetch(`api/work_order_first_piece_dimensions/index.php?${params}`);
                const result = await response.json();

                if (result.success) {
                    state.items = result.data;
                    state.totalItems = result.pagination.total;
                    state.totalPages = result.pagination.pages;
                    state.perPage = result.pagination.limit;
                    renderTable();
                    renderPagination();
                } else {
                    showAlert('danger', result.message || '載入資料失敗');
                    renderEmptyTable();
                }
            } catch (error) {
                console.error('載入資料錯誤:', error);
                showAlert('danger', '系統發生錯誤，請稍後再試');
                renderEmptyTable();
            }
        }

        // 顯示載入中
        function showLoading() {
            if (elements.tbody) {
                elements.tbody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #666;"></i>
                            <p style="color: #666; margin-top: 0.5rem;">載入中...</p>
                        </td>
                    </tr>
                `;
            }
        }

        // 渲染空表格
        function renderEmptyTable() {
            if (elements.tbody) {
                elements.tbody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="10" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-ruler-combined" style="font-size: 3rem; color: #ccc;"></i>
                            <p style="color: #999; margin-top: 1rem;">暫無首件檢驗資料</p>
                        </td>
                    </tr>
                `;
            }
        }

        // 渲染表格
        function renderTable() {
            if (!elements.tbody) return;

            if (!state.items || state.items.length === 0) {
                renderEmptyTable();
                return;
            }

            elements.tbody.innerHTML = state.items.map(item => `
                <tr>
                    <td>
                        <a href="#" class="link-text" data-action="go-work-order" data-id="${Number.parseInt(item.work_order_id, 10) || 0}">
                            ${escapeHtml(item.work_order_number) || '-'}
                        </a>
                    </td>
                    <td>${escapeHtml(item.customer_batch_number) || '-'}</td>
                    <td>${formatDateTime(item.measured_at)}</td>
                    <td>${escapeHtml(item.measured_by_name) || '-'}</td>
                    <td>${formatDimension(item.head_height)}</td>
                    <td>${formatDimension(item.head_width)}</td>
                    <td>${formatDimension(item.length)}</td>
                    <td>${formatDimension(item.thread_outer_diameter)}</td>
                    <td>${escapeHtml(item.notes) || '-'}</td>
                    <td class="table-actions">
                        <button type="button" class="btn text" title="檢視" data-action="view" data-id="${Number.parseInt(item.id, 10) || 0}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn text" title="編輯" data-action="edit" data-id="${Number.parseInt(item.id, 10) || 0}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn text danger" title="刪除" data-action="delete" data-id="${Number.parseInt(item.id, 10) || 0}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // 渲染分頁
        function renderPagination() {
            if (!elements.pagination) return;

            const { currentPage, totalPages, totalItems, perPage } = state;

            if (totalPages <= 1) {
                elements.pagination.innerHTML = '';
                return;
            }

            let html = '<div class="pagination">';

            // 資訊
            const start = (currentPage - 1) * perPage + 1;
            const end = Math.min(currentPage * perPage, totalItems);
            html += `<span class="pagination-info">顯示 ${start}-${end} 筆，共 ${totalItems} 筆</span>`;

            // 上一頁
            html += `<button type="button" class="pagination-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>`;

            // 頁碼
            const pages = generatePageNumbers(currentPage, totalPages);
            pages.forEach(p => {
                if (p === '...') {
                    html += '<span class="pagination-ellipsis">...</span>';
                } else {
                    html += `<button type="button" class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
                }
            });

            // 下一頁
            html += `<button type="button" class="pagination-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>`;

            html += '</div>';
            elements.pagination.innerHTML = html;
        }

        // 生成頁碼
        function generatePageNumbers(current, total) {
            const pages = [];
            const delta = 2;

            if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
            } else {
                pages.push(1);
                if (current > delta + 2) pages.push('...');

                const start = Math.max(2, current - delta);
                const end = Math.min(total - 1, current + delta);

                for (let i = start; i <= end; i++) pages.push(i);

                if (current < total - delta - 1) pages.push('...');
                pages.push(total);
            }

            return pages;
        }

        // 處理分頁
        function handlePagination(e) {
            const btn = e.target.closest('button[data-page]');
            if (!btn || btn.disabled) return;

            const page = parseInt(btn.dataset.page, 10);
            if (page && page !== state.currentPage) {
                state.currentPage = page;
                loadData();
            }
        }

        // 處理表格操作
        function handleTableAction(e) {
            const btn = e.target.closest('button[data-action]');
            const link = e.target.closest('a[data-action]');

            if (btn) {
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id, 10);

                if (action === 'view') viewData(id);
                else if (action === 'edit') editData(id);
                else if (action === 'delete') deleteData(id);
            }

            if (link) {
                e.preventDefault();
                const action = link.dataset.action;
                const id = parseInt(link.dataset.id, 10);

                if (action === 'go-work-order' && id) {
                    navigateToWorkOrder(id);
                }
            }
        }

        // 跳轉到工單
        function navigateToWorkOrder(workOrderId) {
            if (window.openTabAndNavigate) {
                window.openTabAndNavigate('work_orders', '生產工單', { workOrderId });
            }
        }

        // 工單變更時顯示工單資訊
        function onWorkOrderChange() {
            const workOrderId = elements.modalWorkOrderSelect.value;
            const infoSection = elements.workOrderInfoSection;

            if (!workOrderId) {
                infoSection?.classList.add('hidden');
                return;
            }

            const workOrder = state.workOrders.find(wo => wo.id == workOrderId);
            if (workOrder) {
                infoSection?.classList.remove('hidden');
                infoSection.querySelector('[data-info-customer]').textContent = workOrder.customer_name || '-';
                infoSection.querySelector('[data-info-batch]').textContent = workOrder.customer_batch_number || '-';
                infoSection.querySelector('[data-info-product]').textContent = workOrder.screening_item_name || '-';
                infoSection.querySelector('[data-info-status]').textContent = getStatusLabel(workOrder.status);
            }
        }

        // 開啟 Modal
        function openModal(data = null) {
            if (elements.form) elements.form.reset();
            hideModalAlert();
            elements.workOrderInfoSection?.classList.add('hidden');

            if (data) {
                elements.modalTitle.textContent = '編輯首件尺寸檢驗';
                elements.form.querySelector('[name="id"]').value = data.id;

                // 填入表單資料
                const fields = ['work_order_id', 'measured_at', 'measured_by_employee_id', 'notes',
                    'head_height', 'head_width', 'length', 'thread_outer_diameter',
                    'washer_diameter', 'outer_diameter', 'hole_diameter', 'thickness'];

                fields.forEach(field => {
                    const input = elements.form.querySelector(`[name="${field}"]`);
                    if (input && data[field] !== null && data[field] !== undefined) {
                        input.value = data[field];
                    }
                });

                // 觸發工單資訊顯示
                onWorkOrderChange();
            } else {
                elements.modalTitle.textContent = '新增首件尺寸檢驗';
                elements.form.querySelector('[name="id"]').value = '';

                // 設定預設測量時間
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                elements.form.querySelector('[name="measured_at"]').value = now.toISOString().slice(0, 16);
            }

            elements.modal?.classList.remove('hidden');
        }

        // 關閉 Modal
        function closeModal() {
            elements.modal?.classList.add('hidden');
        }

        // 檢視詳情
        async function viewData(id) {
            try {
                const response = await fetch(`api/work_order_first_piece_dimensions/show.php?id=${id}`);
                const result = await response.json();

                if (result.success) {
                    state.currentViewingId = id;
                    renderDetailContent(result.data);
                    elements.detailModal?.classList.remove('hidden');
                } else {
                    showAlert('danger', result.message || '無法讀取資料');
                }
            } catch (error) {
                console.error('讀取詳情錯誤:', error);
                showAlert('danger', '系統發生錯誤');
            }
        }

        // 渲染詳情內容
        function renderDetailContent(data) {
            if (!elements.detailContent) return;

            const statusLabel = getStatusLabel(data.work_order_status);

            elements.detailContent.innerHTML = `
                <div class="detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div class="detail-section">
                        <h4 style="margin-bottom: 0.75rem; color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.5rem;">
                            <i class="fas fa-clipboard-list"></i> 基本資訊
                        </h4>
                        <p><strong>工單號碼：</strong>
                            <a href="#" class="link-text" data-navigate="work_orders" data-id="${Number.parseInt(data.work_order_id, 10) || 0}">${escapeHtml(data.work_order_number) || '-'}</a>
                        </p>
                        <p><strong>客戶：</strong>${escapeHtml(data.customer_name) || '-'}</p>
                        <p><strong>客戶批號：</strong>${escapeHtml(data.customer_batch_number) || '-'}</p>
                        <p><strong>受篩產品：</strong>${escapeHtml(data.screening_item_name) || '-'}</p>
                        <p><strong>測量時間：</strong>${formatDateTime(data.measured_at)}</p>
                        <p><strong>測量人員：</strong>${escapeHtml(data.measured_by_name) || '-'}</p>
                        <p><strong>備註：</strong>${escapeHtml(data.notes) || '-'}</p>
                    </div>
                    <div class="detail-section">
                        <h4 style="margin-bottom: 0.75rem; color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.5rem;">
                            <i class="fas fa-ruler"></i> 尺寸數據 (mm)
                        </h4>
                        <div class="dimension-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                            <p><strong>頭高：</strong>${formatDimension(data.head_height)}</p>
                            <p><strong>頭寬：</strong>${formatDimension(data.head_width)}</p>
                            <p><strong>長度：</strong>${formatDimension(data.length)}</p>
                            <p><strong>牙外徑：</strong>${formatDimension(data.thread_outer_diameter)}</p>
                            <p><strong>華司徑：</strong>${formatDimension(data.washer_diameter)}</p>
                            <p><strong>外徑：</strong>${formatDimension(data.outer_diameter)}</p>
                            <p><strong>孔徑：</strong>${formatDimension(data.hole_diameter)}</p>
                            <p><strong>厚度：</strong>${formatDimension(data.thickness)}</p>
                        </div>
                    </div>
                </div>
                <div class="detail-section" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 0.85rem;">
                        <i class="fas fa-clock"></i> 建立時間：${formatDateTime(data.created_at)} |
                        更新時間：${formatDateTime(data.updated_at)}
                    </p>
                </div>
            `;

            // 綁定詳情中的連結
            elements.detailContent.querySelectorAll('[data-navigate]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    closeDetailModal();
                    if (link.dataset.navigate === 'work_orders') {
                        navigateToWorkOrder(parseInt(link.dataset.id, 10));
                    }
                });
            });
        }

        // 關閉詳情 Modal
        function closeDetailModal() {
            elements.detailModal?.classList.add('hidden');
            state.currentViewingId = null;
        }

        // 編輯資料
        async function editData(id) {
            try {
                const response = await fetch(`api/work_order_first_piece_dimensions/show.php?id=${id}`);
                const result = await response.json();

                if (result.success) {
                    openModal(result.data);
                } else {
                    showAlert('danger', result.message || '無法讀取資料');
                }
            } catch (error) {
                console.error('讀取資料錯誤:', error);
                showAlert('danger', '系統發生錯誤');
            }
        }

        // 儲存資料
        async function saveData() {
            const formData = new FormData(elements.form);
            const data = Object.fromEntries(formData.entries());
            const id = data.id;

            // 驗證必填欄位
            if (!data.work_order_id) {
                showModalAlert('danger', '請選擇工單');
                return;
            }
            if (!data.measured_at) {
                showModalAlert('danger', '請輸入測量時間');
                return;
            }

            const url = id ? 'api/work_order_first_piece_dimensions/update.php' : 'api/work_order_first_piece_dimensions/index.php';

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    closeModal();
                    showAlert('success', id ? '更新成功' : '新增成功');
                    if (dataSyncHelper) {
                        if (id) {
                            dataSyncHelper.notifyUpdated({ id });
                        } else {
                            dataSyncHelper.notifyCreated(data);
                        }
                    }
                    loadData();
                } else {
                    showModalAlert('danger', result.message || '儲存失敗');
                }
            } catch (error) {
                console.error('儲存錯誤:', error);
                showModalAlert('danger', '系統發生錯誤');
            }
        }

        // 刪除資料
        async function deleteData(id) {
            if (!Number.isInteger(id) || id <= 0) {
                showAlert('danger', '無效的資料 ID，無法刪除。');
                return;
            }

            if (!confirm('確定要刪除這筆首件檢驗資料嗎？此動作無法復原。')) return;

            try {
                const response = await fetch('api/work_order_first_piece_dimensions/delete.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        _method: 'DELETE',
                        id
                    })
                });

                const raw = await response.text();
                if (!raw || raw.trim() === '') {
                    throw new Error(`伺服器未回傳內容（HTTP ${response.status}）`);
                }

                let result = null;
                try {
                    result = JSON.parse(raw);
                } catch (_parseError) {
                    throw new Error(`伺服器回應格式錯誤（HTTP ${response.status}）`);
                }

                if (response.ok && result.success) {
                    showAlert('success', '刪除成功');
                    if (dataSyncHelper) {
                        dataSyncHelper.notifyDeleted({ id });
                    }
                    loadData();
                } else {
                    showAlert('danger', (result && result.message) || '刪除失敗');
                }
            } catch (error) {
                console.error('刪除錯誤:', error);
                showAlert('danger', `刪除失敗：${error.message || '系統發生錯誤'}`);
            }
        }

        // 匯出資料
        function exportData() {
            const formData = new FormData(elements.filterForm);
            const params = new URLSearchParams({
                keyword: formData.get('keyword') || '',
                work_order_id: formData.get('work_order_id') || '',
                measured_by_employee_id: formData.get('measured_by_employee_id') || '',
                start_date: formData.get('start_date') || '',
                end_date: formData.get('end_date') || ''
            });
            window.location.href = `api/work_order_first_piece_dimensions/export.php?${params}`;
        }

        // 顯示全域訊息
        function showAlert(type, message) {
            if (!elements.alert) return;
            elements.alert.className = `module-alert ${type}`;
            elements.alert.textContent = message;
            elements.alert.classList.remove('hidden');

            setTimeout(() => {
                elements.alert.classList.add('hidden');
            }, 3000);
        }

        // 顯示 Modal 訊息
        function showModalAlert(type, message) {
            if (!elements.modalAlert) return;
            elements.modalAlert.className = `modal-alert ${type}`;
            elements.modalAlert.textContent = message;
            elements.modalAlert.classList.remove('hidden');
        }

        // 隱藏 Modal 訊息
        function hideModalAlert() {
            elements.modalAlert?.classList.add('hidden');
        }

        // 格式化日期時間
        function formatDateTime(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return escapeHtml(String(dateStr));
            return date.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // 格式化尺寸
        function formatDimension(value) {
            if (value === null || value === undefined || value === '') return '-';
            const numericValue = parseFloat(value);
            if (Number.isNaN(numericValue)) return '-';
            return numericValue.toFixed(4);
        }

        // 取得狀態標籤
        function getStatusLabel(status) {
            const labels = {
                'pending': '待處理',
                'in_progress': '進行中',
                'completed': '已完成',
                'cancelled': '已取消'
            };
            return labels[status] || status || '-';
        }

        // 暴露模組方法供外部調用
        window.firstPieceDimensionsModule = {
            viewDetail: viewData,
            edit: editData
        };
    }

    window.initializeWorkOrderFirstPieceDimensionsModule = initializeWorkOrderFirstPieceDimensionsModule;
})();
